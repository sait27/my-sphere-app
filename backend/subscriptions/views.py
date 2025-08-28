from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Subscription, SubscriptionCategory, SubscriptionPayment, SubscriptionUsage, SubscriptionAlert
from .serializers import (
    SubscriptionSerializer, SubscriptionCreateSerializer, SubscriptionCategorySerializer,
    SubscriptionPaymentSerializer, SubscriptionUsageSerializer, SubscriptionAlertSerializer
)
from .ai_insights import SubscriptionAIEngine, SubscriptionOptimizer
from .nlp_parser import SubscriptionNLPParser

class SubscriptionCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SubscriptionCategory.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SubscriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SubscriptionCreateSerializer
        return SubscriptionSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Creation error: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get subscription dashboard data"""
        subscriptions = self.get_queryset()
        active_subs = subscriptions.filter(status='active')
        
        # Calculate costs
        monthly_total = sum(sub.monthly_cost for sub in active_subs)
        yearly_total = sum(sub.yearly_cost for sub in active_subs)
        
        # Upcoming renewals (next 30 days)
        next_month = timezone.now().date() + timedelta(days=30)
        upcoming_renewals = active_subs.filter(next_billing_date__lte=next_month)
        
        # Category breakdown
        categories = {}
        for sub in active_subs:
            cat_name = sub.category.name if sub.category else 'Uncategorized'
            if cat_name not in categories:
                categories[cat_name] = {'count': 0, 'cost': 0}
            categories[cat_name]['count'] += 1
            categories[cat_name]['cost'] += float(sub.monthly_cost)
        
        return Response({
            'total_subscriptions': subscriptions.count(),
            'active_subscriptions': active_subs.count(),
            'monthly_cost': float(monthly_total),
            'yearly_cost': float(yearly_total),
            'upcoming_renewals': upcoming_renewals.count(),
            'categories': categories,
            'recent_subscriptions': SubscriptionSerializer(
                subscriptions.order_by('-created_at')[:5], many=True
            ).data
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get detailed analytics"""
        subscriptions = self.get_queryset()
        
        # Cost trends (last 6 months)
        cost_trends = []
        for i in range(6):
            month_start = timezone.now().date().replace(day=1) - timedelta(days=30*i)
            month_payments = SubscriptionPayment.objects.filter(
                subscription__user=request.user,
                payment_date__year=month_start.year,
                payment_date__month=month_start.month
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            cost_trends.append({
                'month': month_start.strftime('%Y-%m'),
                'cost': float(month_payments)
            })
        
        # Payment method breakdown
        payment_methods = {}
        for sub in subscriptions.filter(status='active'):
            method = sub.get_payment_method_display()
            if method not in payment_methods:
                payment_methods[method] = {'count': 0, 'cost': 0}
            payment_methods[method]['count'] += 1
            payment_methods[method]['cost'] += float(sub.monthly_cost)
        
        return Response({
            'cost_trends': list(reversed(cost_trends)),
            'payment_methods': payment_methods,
            'avg_subscription_cost': float(
                subscriptions.filter(status='active').aggregate(
                    avg=Sum('amount')/Count('subscription_id')
                )['avg'] or 0
            )
        })
    
    @action(detail=False, methods=['get'])
    def ai_insights(self, request):
        """Get AI-powered insights"""
        try:
            ai_engine = SubscriptionAIEngine(request.user)
            insights = ai_engine.generate_insights()
            return Response(insights)
        except Exception as e:
            return Response(
                {'error': 'Failed to generate insights', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def optimization(self, request):
        """Get optimization suggestions"""
        try:
            optimizer = SubscriptionOptimizer(request.user)
            duplicates = optimizer.find_duplicates()
            downgrades = optimizer.suggest_downgrades()
            
            return Response({
                'duplicates': duplicates,
                'downgrade_suggestions': downgrades,
                'potential_monthly_savings': sum(d['potential_savings'] for d in duplicates)
            })
        except Exception as e:
            return Response(
                {'error': 'Failed to generate optimization suggestions', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment record"""
        subscription = self.get_object()
        serializer = SubscriptionPaymentSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(subscription=subscription)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_usage(self, request, pk=None):
        """Add usage tracking"""
        subscription = self.get_object()
        serializer = SubscriptionUsageSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(subscription=subscription)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause subscription"""
        subscription = self.get_object()
        subscription.status = 'paused'
        subscription.save()
        return Response({'message': 'Subscription paused successfully'})
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume subscription"""
        subscription = self.get_object()
        subscription.status = 'active'
        subscription.save()
        return Response({'message': 'Subscription resumed successfully'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel subscription"""
        subscription = self.get_object()
        subscription.status = 'cancelled'
        subscription.end_date = timezone.now().date()
        subscription.save()
        return Response({'message': 'Subscription cancelled successfully'})
    
    @action(detail=False, methods=['post'])
    def parse_nlp(self, request):
        """Parse natural language subscription description"""
        query = request.data.get('query', '')
        
        if not query.strip():
            return Response(
                {'error': 'Query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            parser = SubscriptionNLPParser()
            result = parser.parse_subscription_query(query)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': 'Failed to parse query', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SubscriptionAlertViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SubscriptionAlert.objects.filter(
            subscription__user=self.request.user,
            is_dismissed=False
        )
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread alerts"""
        alerts = self.get_queryset().filter(is_read=False, is_dismissed=False)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark alert as read"""
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response({'message': 'Alert marked as read'})
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss alert"""
        alert = self.get_object()
        alert.is_dismissed = True
        alert.save()
        return Response({'message': 'Alert dismissed'})
    
    @action(detail=True, methods=['delete'])
    def delete_alert(self, request, pk=None):
        """Permanently delete alert"""
        alert = self.get_object()
        alert.delete()
        return Response({'message': 'Alert deleted permanently'})