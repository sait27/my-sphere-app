from django.http import JsonResponse, HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from django.core.exceptions import ValidationError
from django.db import transaction
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action

import csv
import logging
from datetime import datetime, timedelta

from .models import (
    LendingTransaction, LendingCategory, PaymentRecord, PaymentReminder, 
    LendingAIInsight, ContactProfile, PaymentPlan, TransactionTemplate, 
    NotificationRule
)
from .serializers import (
    LendingTransactionSerializer, LendingCategorySerializer, PaymentRecordSerializer,
    ContactProfileSerializer, PaymentPlanSerializer, TransactionTemplateSerializer,
    NotificationRuleSerializer
)
from .services import LendingService, LendingAnalyticsService
from .validators import LendingValidator
from .ai_insights import get_lending_ai_insights

logger = logging.getLogger(__name__)

class LendingPagination(PageNumberPagination):
    """Custom pagination for lending transactions"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class LendingTransactionViewSet(viewsets.ModelViewSet):
    """Main viewset for lending transactions with comprehensive functionality"""
    serializer_class = LendingTransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = LendingPagination
    
    def get_queryset(self):
        try:
            filters = LendingValidator.validate_filters(self.request.query_params)
            return LendingService.get_user_transactions(self.request.user, filters)
        except ValidationError as e:
            logger.warning(f"Invalid filters from user {self.request.user.username}: {e}")
            return LendingService.get_user_transactions(self.request.user)
    
    def create(self, request, *args, **kwargs):
        try:
            validated_data = LendingValidator.validate_create_request(request.data)
            transaction = LendingService.create_transaction(request.user, validated_data)
            serializer = self.get_serializer(transaction)
            
            logger.info(f"Created lending transaction {transaction.lending_id} for user {request.user.username}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValidationError as e:
            logger.warning(f"Validation error for user {request.user.username}: {e}")
            return Response({'errors': e.message_dict if hasattr(e, 'message_dict') else str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error creating lending transaction: {e}")
            return Response({'error': 'Internal server error'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics"""
        try:
            summary_data = LendingService.get_summary_data(request.user)
            return Response(summary_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error getting summary for user {request.user.username}: {e}")
            return Response({'error': 'Failed to get summary'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get comprehensive analytics data"""
        try:
            period = request.query_params.get('period', 'month')
            analytics_data = LendingService.get_analytics_data(request.user, period)
            return Response(analytics_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error getting analytics for user {request.user.username}: {e}")
            return Response({'error': 'Failed to get analytics'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def ai_insights(self, request):
        """Get AI-powered insights with enhanced caching"""
        try:
            # Check for force refresh parameter
            force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'
            
            # Generate insights with caching support
            insights = get_lending_ai_insights(request.user, force_refresh=force_refresh)
            
            # Update database cache for historical tracking
            try:
                insight_cache = LendingAIInsight.objects.get(user=request.user)
                insight_cache.insights_data = insights
                insight_cache.risk_score = insights.get('risk_score', 0)
                insight_cache.generated_at = timezone.now()
                insight_cache.save()
            except LendingAIInsight.DoesNotExist:
                LendingAIInsight.objects.create(
                    user=request.user,
                    insights_data=insights,
                    risk_score=insights.get('risk_score', 0)
                )
            
            return Response(insights)
            
        except Exception as e:
            logger.error(f"Error generating AI insights for user {request.user.username}: {e}")
            return Response({'error': 'Failed to generate AI insights'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue transactions"""
        try:
            overdue_transactions = self.get_queryset().filter(
                due_date__lt=timezone.now().date(),
                status='active'
            )
            serializer = self.get_serializer(overdue_transactions, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error getting overdue transactions: {e}")
            return Response({'error': 'Failed to get overdue transactions'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark a transaction as completed"""
        try:
            transaction = self.get_object()
            transaction.status = 'completed'
            transaction.date_completed = timezone.now()
            transaction.save()
            
            serializer = self.get_serializer(transaction)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error marking transaction completed: {e}")
            return Response({'error': 'Failed to mark transaction as completed'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment record to a transaction"""
        try:
            transaction = self.get_object()
            validated_data = LendingValidator.validate_payment_record(request.data)
            
            payment = PaymentRecord.objects.create(
                transaction=transaction,
                **validated_data
            )
            
            # Update transaction amount_paid
            transaction.amount_paid += payment.amount
            if transaction.amount_paid >= transaction.amount:
                transaction.status = 'completed'
                transaction.date_completed = timezone.now()
            elif transaction.amount_paid > 0:
                transaction.status = 'partial'
            
            transaction.save()
            
            serializer = PaymentRecordSerializer(payment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValidationError as e:
            return Response({'errors': e.message_dict if hasattr(e, 'message_dict') else str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error adding payment: {e}")
            return Response({'error': 'Failed to add payment'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_operations(self, request):
        """Handle bulk operations on transactions"""
        try:
            validated_data = LendingValidator.validate_bulk_operation(request.data)
            result = LendingService.bulk_update_transactions(
                request.user,
                validated_data['transaction_ids'],
                validated_data['operation'],
                **validated_data.get('params', {})
            )
            return Response(result, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({'errors': e.message_dict if hasattr(e, 'message_dict') else str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Bulk operations failed: {e}")
            return Response({'error': 'Bulk operation failed'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def cash_flow_forecast(self, request):
        """Get cash flow forecast"""
        try:
            months = int(request.query_params.get('months', 6))
            from .services import AdvancedAnalyticsService
            forecast = AdvancedAnalyticsService.get_cash_flow_forecast(request.user, months)
            return Response(forecast)
        except Exception as e:
            logger.error(f"Cash flow forecast failed: {e}")
            return Response({'error': 'Failed to generate forecast'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def lending_patterns(self, request):
        """Get lending patterns analysis"""
        try:
            from .services import AdvancedAnalyticsService
            patterns = AdvancedAnalyticsService.get_lending_patterns(request.user)
            return Response(patterns)
        except Exception as e:
            logger.error(f"Lending patterns analysis failed: {e}")
            return Response({'error': 'Failed to analyze patterns'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def notifications(self, request):
        """Get pending notifications"""
        try:
            from .services import NotificationService
            notifications = NotificationService.get_pending_notifications(request.user)
            return Response({'notifications': notifications})
        except Exception as e:
            logger.error(f"Notifications retrieval failed: {e}")
            return Response({'error': 'Failed to get notifications'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def risk_analysis(self, request):
        """Get overall risk analysis for all transactions"""
        try:
            risk_data = LendingAnalyticsService.get_risk_analysis(request.user)
            return Response(risk_data)
        except Exception as e:
            logger.error(f"Risk analysis failed: {e}")
            return Response({'error': 'Failed to get risk analysis'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def risk_assessment(self, request, pk=None):
        """Get risk assessment for transaction"""
        try:
            transaction = self.get_object()
            from .services import RiskAssessmentService
            risk_data = RiskAssessmentService.calculate_transaction_risk(transaction)
            return Response(risk_data)
        except Exception as e:
            logger.error(f"Risk assessment failed: {e}")
            return Response({'error': 'Failed to assess risk'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def create_payment_plan(self, request, pk=None):
        """Create payment plan for transaction"""
        try:
            transaction = self.get_object()
            from .services import PaymentPlanService
            plan = PaymentPlanService.create_payment_plan(transaction, request.data)
            from .serializers import PaymentPlanSerializer
            serializer = PaymentPlanSerializer(plan)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Payment plan creation failed: {e}")
            return Response({'error': 'Failed to create payment plan'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        """Upload document for transaction"""
        try:
            transaction = self.get_object()
            from .services import DocumentService
            document_data = {
                'document_type': request.data.get('document_type'),
                'title': request.data.get('title'),
                'uploaded_by': request.user
            }
            document = DocumentService.upload_document(
                transaction, document_data, request.FILES['file']
            )
            from .serializers import LendingDocumentSerializer
            serializer = LendingDocumentSerializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Document upload failed: {e}")
            return Response({'error': 'Failed to upload document'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ContactProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for managing contact profiles"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ContactProfile.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        from .serializers import ContactProfileSerializer
        return ContactProfileSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_reliability_score(self, request, pk=None):
        """Recalculate reliability score"""
        try:
            contact = self.get_object()
            from .services import ContactManagementService
            score = ContactManagementService.calculate_reliability_score(contact)
            return Response({'reliability_score': score})
        except Exception as e:
            logger.error(f"Reliability score update failed: {e}")
            return Response({'error': 'Failed to update score'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TransactionTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transaction templates"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TransactionTemplate.objects.filter(user=self.request.user, is_active=True)
    
    def get_serializer_class(self):
        from .serializers import TransactionTemplateSerializer
        return TransactionTemplateSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def create_transaction(self, request, pk=None):
        """Create transaction from template"""
        try:
            template = self.get_object()
            from .services import TransactionTemplateService
            transaction = TransactionTemplateService.create_from_template(
                template, request.data
            )
            from .serializers import LendingTransactionSerializer
            serializer = LendingTransactionSerializer(transaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Transaction creation from template failed: {e}")
            return Response({'error': 'Failed to create transaction'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for payment plans"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PaymentPlan.objects.filter(transaction__user=self.request.user)
    
    def get_serializer_class(self):
        from .serializers import PaymentPlanSerializer
        return PaymentPlanSerializer
    
    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        """Record payment for installment"""
        try:
            payment_plan = self.get_object()
            installment_id = request.data.get('installment_id')
            amount = Decimal(str(request.data.get('amount')))
            
            installment = payment_plan.installments.get(id=installment_id)
            from .services import PaymentPlanService
            result = PaymentPlanService.record_installment_payment(installment, amount)
            
            return Response(result)
        except Exception as e:
            logger.error(f"Payment recording failed: {e}")
            return Response({'error': 'Failed to record payment'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class NotificationRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for notification rules"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NotificationRule.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        from .serializers import NotificationRuleSerializer
        return NotificationRuleSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LendingCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for lending categories"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return LendingCategory.objects.filter(user=self.request.user, is_active=True)
    
    def get_serializer_class(self):
        return LendingCategorySerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LendingDashboardView(APIView):
    """Dashboard view with comprehensive lending overview"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get dashboard data"""
        try:
            summary = LendingService.get_summary_data(request.user)
            recent_transactions = LendingService.get_user_transactions(request.user)[:10]
            transaction_serializer = LendingTransactionSerializer(recent_transactions, many=True)
            
            from .services import NotificationService, AdvancedAnalyticsService
            notifications = NotificationService.get_pending_notifications(request.user)
            risk_analysis = LendingAnalyticsService.get_risk_analysis(request.user)
            cash_flow = AdvancedAnalyticsService.get_cash_flow_forecast(request.user, 3)
            
            dashboard_data = {
                'summary': summary,
                'recent_transactions': transaction_serializer.data,
                'notifications': notifications[:5],
                'risk_analysis': risk_analysis,
                'cash_flow_forecast': cash_flow,
                'quick_stats': {
                    'total_contacts': ContactProfile.objects.filter(user=request.user).count(),
                    'active_templates': TransactionTemplate.objects.filter(
                        user=request.user, is_active=True
                    ).count(),
                    'payment_plans': PaymentPlan.objects.filter(
                        transaction__user=request.user
                    ).count()
                }
            }
            
            return Response(dashboard_data)
            
        except Exception as e:
            logger.error(f"Dashboard data retrieval failed: {e}")
            return Response({'error': 'Failed to load dashboard'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)