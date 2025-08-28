from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from django.shortcuts import render
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, DecimalField, Count, Avg, Q
from django.db.models.functions import TruncMonth, TruncDate
from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action

import json
import os
import csv
import logging
from datetime import datetime, timedelta, date
import google.generativeai as genai

from .models import Expense, ExpenseCategory, ExpenseTag, ExpenseAnalytics, ExpenseAIInsight
from .serializers import ExpenseSerializer, ExpenseCategorySerializer, ExpenseTagSerializer, ExpenseAnalyticsSerializer
from .services import ExpenseService, AIExpenseParser, ExpenseAdvancedService, ExpenseCategoryService, ExpenseTagService
from .validators import ExpenseValidator, FilterValidator
from budgets.models import Budget
from .ai_insights import AIInsightsEngine
from .advanced_analytics import AdvancedExpenseAnalytics

logger = logging.getLogger(__name__)

# AI Configuration
try:
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY") or settings.GOOGLE_API_KEY)
    GEMINI_MODEL = genai.GenerativeModel('gemini-1.5-flash')
    logger.info("Gemini AI Model configured successfully")
except (AttributeError, KeyError):
    GEMINI_MODEL = None
    logger.warning("GOOGLE_API_KEY not configured. AI features disabled.")

class ExpensePagination(PageNumberPagination):
    """Custom pagination for expenses"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

# Core Views
class ExpenseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            expenses = Expense.objects.filter(user=request.user).order_by('-transaction_date')
            serializer = ExpenseSerializer(expenses, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching expenses: {e}")
            return Response([], status=status.HTTP_200_OK)
    
    def post(self, request):
        user = request.user
        user_text = request.data.get('text')
        if not user_text:
            return Response({'error': 'The "text" field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"""
        You are a highly intelligent expense parsing system. Your task is to analyze the user's text and extract ALL SEPARATE financial expenses mentioned.

        **CRITICAL INSTRUCTIONS:**
        1. CAREFULLY identify EVERY INDIVIDUAL expense mentioned in the text, even if they are in a single sentence.
        2. Look for patterns like "X on item1, Y on item2, Z on item3" - these are SEPARATE expenses.
        3. For each expense, extract: amount, category, vendor (if mentioned), description, and transaction_date.
        4. The transaction_date should be today ({datetime.now().strftime('%Y-%m-%d')}) unless specified otherwise.
        5. Categories: Food & Dining, Groceries, Shopping, Travel, Entertainment, Utilities, Health, Education, Other.
        6. Return ONLY valid JSON with "expenses" array.

        **EXAMPLES:**
        Input: "paid 40 on pickles, 100 on shirt, 50 on milk"
        Output:
        {{
            "expenses": [
                {{
                    "amount": 40.00,
                    "category": "Groceries",
                    "vendor": null,
                    "description": "pickles",
                    "transaction_date": "{datetime.now().strftime('%Y-%m-%d')}"
                }},
                {{
                    "amount": 100.00,
                    "category": "Shopping",
                    "vendor": null,
                    "description": "shirt",
                    "transaction_date": "{datetime.now().strftime('%Y-%m-%d')}"
                }},
                {{
                    "amount": 50.00,
                    "category": "Groceries",
                    "vendor": null,
                    "description": "milk",
                    "transaction_date": "{datetime.now().strftime('%Y-%m-%d')}"
                }}
            ]
        }}

        **User's Text:** "{user_text}"
        **Your JSON Response:**
        """
        
        try:
            response = GEMINI_MODEL.generate_content(prompt)
            cleaned_json_string = response.text.strip().replace('```json', '').replace('```', '').strip()
            ai_data = json.loads(cleaned_json_string)
        except Exception as e:
            return Response({'error': 'Failed to process text with AI.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        expense_list = ai_data.get('expenses', [])
        
        if not expense_list:
            return Response({'error': 'AI did not find any expenses in the text.'}, status=status.HTTP_400_BAD_REQUEST)

        created_expenses_ids = []
        try:
            with transaction.atomic():
                highest_display_id = Expense.objects.filter(user=user).order_by('-display_id').select_for_update().first()
                next_display_id = 1
                if highest_display_id:
                    next_display_id = highest_display_id.display_id + 1
                    
                for i, expense_data in enumerate(expense_list):
                    new_expense = Expense.objects.create(
                        user=user,
                        display_id=next_display_id + i,
                        raw_text=user_text,
                        amount=expense_data.get('amount'),
                        category=expense_data.get('category', 'Other'),
                        vendor=expense_data.get('vendor'),
                        description=expense_data.get('description'),
                        transaction_date=expense_data.get('transaction_date', datetime.now().strftime('%Y-%m-%d'))
                    )
                    created_expenses_ids.append(new_expense.expense_id)
                
        except Exception as e:
            return Response({'error': 'Failed to save expense to database.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'status': 'success',
            'message': f'Successfully saved {len(created_expenses_ids)} expenses for user {user.username}.',
            'created_expense_ids': created_expenses_ids
        }, status=status.HTTP_201_CREATED)

class ExpenseListCreateView(generics.ListCreateAPIView):
    """List and create expenses with proper pagination and filtering"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ExpensePagination
    
    def get_queryset(self):
        try:
            filters = FilterValidator.validate_filters(self.request.query_params)
            return ExpenseService.get_user_expenses(self.request.user, filters)
        except ValidationError as e:
            logger.warning(f"Invalid filters from user {self.request.user.username}: {e}")
            return ExpenseService.get_user_expenses(self.request.user)
    
    def create(self, request, *args, **kwargs):
        try:
            validated_data = ExpenseValidator.validate_create_request(request.data)
            
            if not GEMINI_MODEL:
                return Response(
                    {'error': 'AI service not available'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            parser = AIExpenseParser(GEMINI_MODEL)
            ai_data = parser.parse_expense_text(validated_data['text'])
            
            expenses = ExpenseService.create_expense_from_ai(
                request.user, 
                validated_data['text'], 
                ai_data
            )
            
            serializer = self.get_serializer(expenses, many=True)
            
            logger.info(f"Created {len(expenses)} expenses for user {request.user.username}")
            return Response(
                {
                    'message': f'Successfully created {len(expenses)} expense(s)',
                    'expenses': serializer.data
                }, 
                status=status.HTTP_201_CREATED
            )
            
        except ValidationError as e:
            logger.warning(f"Validation error for user {request.user.username}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Unexpected error creating expense: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ExpenseDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """This view handles getting, updating, and deleting a single expense."""
    permission_classes = [IsAuthenticated]
    serializer_class = ExpenseSerializer
    queryset = Expense.objects.all()
    lookup_field = 'expense_id'

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific expense"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'expense_id'
    
    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)

class ExpenseSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(cache_page(60 * 10))
    def get(self, request):
        summary_data = ExpenseService.get_expense_summary(request.user)
        return Response(summary_data, status=status.HTTP_200_OK)

class ExpenseAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        period = request.GET.get('period', 'month')
        analytics_data = ExpenseService.get_analytics_data(request.user, period)
        
        return Response({
            'summary': {
                'total_amount': float(analytics_data['summary']['total_amount'] or 0),
                'expense_count': analytics_data['summary']['expense_count'],
                'average_amount': float(analytics_data['summary']['average_amount'] or 0),
                'daily_average': float(analytics_data['summary']['total_amount'] or 0) / max(1, (analytics_data['date_range']['end'] - analytics_data['date_range']['start']).days)
            },
            'category_breakdown': [
                {
                    'category': item['category'],
                    'total': float(item['total']),
                    'count': item['count']
                }
                for item in analytics_data['category_breakdown']
            ],
            'payment_method_breakdown': [
                {
                    'payment_method': item['payment_method'] or 'cash',
                    'total': float(item['total']),
                    'count': item['count']
                }
                for item in analytics_data['payment_method_breakdown']
            ]
        })

class ExpenseTrendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        months = int(request.GET.get('months', 6))
        
        start_date = datetime.now() - timedelta(days=months * 30)
        
        monthly_trends = Expense.objects.filter(
            user=user,
            transaction_date__gte=start_date.date()
        ).annotate(
            month=TruncMonth('transaction_date')
        ).values('month').annotate(
            total=Sum('amount'),
            count=Count('expense_id')
        ).order_by('month')
        
        return Response({
            'monthly_trends': [
                {
                    'month': trend['month'].strftime('%B %Y'),
                    'total': float(trend['total']),
                    'count': trend['count']
                }
                for trend in monthly_trends
            ]
        })

class ExpenseBudgetAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        now = datetime.now()
        start_of_month = now.replace(day=1)
        
        current_month_expenses = Expense.objects.filter(
            user=user,
            transaction_date__gte=start_of_month.date()
        ).values('category').annotate(
            spent=Sum('amount')
        )
        
        budget_analysis = []
        
        return Response({
            'budget_analysis': budget_analysis,
            'message': 'Budget analysis requires Budget model to have category field'
        })

class ExpenseBulkOperationsView(APIView):
    """Handle bulk operations on expenses"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            validated_data = ExpenseValidator.validate_bulk_operation(request.data)
            
            result = ExpenseService.bulk_update_expenses(
                request.user,
                validated_data['expense_ids'],
                validated_data['operation'],
                category=validated_data.get('category')
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            logger.warning(f"Bulk operation validation error: {e}")
            
        # Fallback to original logic
        action = request.data.get('action') or request.data.get('operation')
        expense_ids = request.data.get('expense_ids', [])
        
        if not action or not expense_ids:
            return Response({'error': 'Action and expense_ids are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        expenses = Expense.objects.filter(expense_id__in=expense_ids, user=request.user)
        
        if action == 'delete':
            count = expenses.count()
            expenses.delete()
            return Response({'message': f'Successfully deleted {count} expenses'}, status=status.HTTP_200_OK)
        
        elif action == 'categorize':
            new_category = request.data.get('category')
            if not new_category:
                return Response({'error': 'Category is required for categorize'}, status=status.HTTP_400_BAD_REQUEST)
            
            count = expenses.update(category=new_category)
            return Response({'message': f'Successfully categorized {count} expenses'}, status=status.HTTP_200_OK)
        
        elif action == 'duplicate':
            duplicated_count = 0
            for expense in expenses:
                expense.pk = None
                expense.expense_id = None
                expense.save()
                duplicated_count += 1
            return Response({'message': f'Successfully duplicated {duplicated_count} expenses'}, status=status.HTTP_200_OK)
        
        else:
            return Response({'error': f'Invalid action: {action}'}, status=status.HTTP_400_BAD_REQUEST)

class ExpenseExportView(APIView):
    """Export expenses to various formats"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            validated_data = ExpenseValidator.validate_export_request(request.data)
            
            expenses = Expense.objects.filter(
                expense_id__in=validated_data['expense_ids'], 
                user=request.user
            ).order_by('-transaction_date')
            
            if validated_data['format'] == 'csv':
                return self._export_csv(expenses)
            else:
                return Response(
                    {'error': 'Format not supported yet'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Export error: {e}")
            
        # Fallback to original logic
        expense_ids = request.data.get('expense_ids', [])
        export_format = request.data.get('format', 'csv')
        
        if not expense_ids:
            return Response({'error': 'expense_ids are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        expenses = Expense.objects.filter(expense_id__in=expense_ids, user=request.user).order_by('-transaction_date')
        
        if export_format == 'csv':
            return self._export_csv(expenses)
        
        return Response({'error': 'Unsupported export format'}, status=status.HTTP_400_BAD_REQUEST)
    
    def _export_csv(self, expenses):
        """Export expenses as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="expenses_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        
        writer = csv.writer(response)
        writer.writerow(['Date', 'Amount (₹)', 'Category', 'Vendor', 'Description', 'Payment Method'])
        
        for expense in expenses:
            writer.writerow([
                expense.transaction_date.strftime('%Y-%m-%d') if expense.transaction_date else '',
                f"₹{expense.amount}",
                expense.category or '',
                expense.vendor or '',
                expense.description or '',
                expense.payment_method or 'Not specified'
            ])
        
        logger.info(f"Exported {expenses.count()} expenses as CSV")
        return response

# Advanced Views from advanced_views.py
class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ExpenseCategory.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExpenseTagViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseTagSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ExpenseTag.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExpenseAdvancedViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get comprehensive expense analytics"""
        try:
            period = request.query_params.get('period', 'month')
            analytics_data = ExpenseAdvancedService.get_comprehensive_analytics(request.user, period)
            print(f"Analytics data: {analytics_data}")
            return Response(analytics_data)
        except Exception as e:
            logger.error(f"Analytics error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get spending trends and patterns"""
        months = int(request.query_params.get('months', 6))
        trends_data = ExpenseAdvancedService.get_spending_trends(request.user, months)
        return Response(trends_data)
    
    @action(detail=False, methods=['get'], url_path='budget-analysis')
    def budget_analysis(self, request):
        """Analyze spending against budgets"""
        budget_data = ExpenseAdvancedService.get_budget_analysis(request.user)
        return Response(budget_data)
    
    @action(detail=False, methods=['post'])
    def bulk_categorize(self, request):
        """Bulk categorize expenses using AI or rules"""
        expense_ids = request.data.get('expense_ids', [])
        new_category = request.data.get('category')
        
        if not expense_ids or not new_category:
            return Response(
                {'error': 'expense_ids and category are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = ExpenseAdvancedService.bulk_categorize_expenses(request.user, expense_ids, new_category)
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def duplicate_expense(self, request):
        """Duplicate an existing expense"""
        expense_id = request.data.get('expense_id')
        
        try:
            result = ExpenseAdvancedService.duplicate_expense(request.user, expense_id)
            return Response(result)
        except Expense.DoesNotExist:
            return Response(
                {'error': 'Expense not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced expense search"""
        search_params = {
            'q': request.query_params.get('q', ''),
            'category': request.query_params.get('category'),
            'vendor': request.query_params.get('vendor'),
            'payment_method': request.query_params.get('payment_method'),
            'min_amount': request.query_params.get('min_amount'),
            'max_amount': request.query_params.get('max_amount'),
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date')
        }
        
        result = ExpenseAdvancedService.search_expenses(request.user, search_params)
        return Response(result)

# AI and Advanced Analytics Views
class AIInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'
        cache_duration_minutes = 60

        try:
            insight_cache = ExpenseAIInsight.objects.get(user=user)
            is_stale = timezone.now() - insight_cache.generated_at > timedelta(minutes=cache_duration_minutes)

            if not force_refresh and not is_stale:
                return Response(insight_cache.insights_data)

        except ExpenseAIInsight.DoesNotExist:
            insight_cache = None

        try:
            engine = AIInsightsEngine(user)
            new_insights = engine.generate_insights()

            if insight_cache:
                insight_cache.insights_data = new_insights
                insight_cache.save()
            else:
                ExpenseAIInsight.objects.create(user=user, insights_data=new_insights)

            return Response(new_insights)

        except Exception as e:
            return Response({"error": f"Failed to generate AI insights: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdvancedAnalyticsView(APIView):
    """Advanced analytics endpoint with predictive insights"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'month')
        
        try:
            analytics_engine = AdvancedExpenseAnalytics(request.user)
            analytics_data = analytics_engine.get_comprehensive_analytics(period)
            return Response(analytics_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate advanced analytics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BudgetAnalysisView(APIView):
    """Budget analysis endpoint"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            analytics_engine = AdvancedExpenseAnalytics(request.user)
            budget_data = analytics_engine.get_budget_analysis()
            return Response(budget_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate budget analysis: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TrendsAnalysisView(APIView):
    """Trends analysis endpoint"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        months = request.query_params.get('months', 6)
        try:
            analytics_engine = AdvancedExpenseAnalytics(request.user)
            trends_data = analytics_engine.get_trends_analysis(int(months))
            return Response(trends_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate trends analysis: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )