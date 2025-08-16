# expenses/views_refactored.py
"""
Refactored views following Django best practices
"""

import logging
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.conf import settings
import csv
import google.generativeai as genai

from .models import Expense
from .serializers import ExpenseSerializer
from .services import ExpenseService, AIExpenseParser
from .validators import ExpenseValidator, FilterValidator

logger = logging.getLogger(__name__)

# Configure AI
try:
    genai.configure(api_key=settings.GOOGLE_API_KEY)
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


class ExpenseListCreateView(generics.ListCreateAPIView):
    """
    List and create expenses with proper pagination and filtering
    """
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ExpensePagination
    
    def get_queryset(self):
        """Get filtered queryset for the authenticated user"""
        try:
            filters = FilterValidator.validate_filters(self.request.query_params)
            return ExpenseService.get_user_expenses(self.request.user, filters)
        except ValidationError as e:
            logger.warning(f"Invalid filters from user {self.request.user.username}: {e}")
            return ExpenseService.get_user_expenses(self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create expense using AI parsing"""
        try:
            # Validate input
            validated_data = ExpenseValidator.validate_create_request(request.data)
            
            # Parse with AI
            if not GEMINI_MODEL:
                return Response(
                    {'error': 'AI service not available'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            parser = AIExpenseParser(GEMINI_MODEL)
            ai_data = parser.parse_expense_text(validated_data['text'])
            
            # Create expenses
            expenses = ExpenseService.create_expense_from_ai(
                request.user, 
                validated_data['text'], 
                ai_data
            )
            
            # Serialize response
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


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific expense
    """
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'expense_id'
    
    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)


class ExpenseBulkOperationsView(APIView):
    """Handle bulk operations on expenses"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Validate input
            validated_data = ExpenseValidator.validate_bulk_operation(request.data)
            
            # Perform operation
            result = ExpenseService.bulk_update_expenses(
                request.user,
                validated_data['expense_ids'],
                validated_data['operation'],
                category=validated_data.get('category')
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            logger.warning(f"Bulk operation validation error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Bulk operation error: {e}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExpenseExportView(APIView):
    """Export expenses to various formats"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Validate input
            validated_data = ExpenseValidator.validate_export_request(request.data)
            
            # Get expenses
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
            return Response(
                {'error': 'Export failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _export_csv(self, expenses):
        """Export expenses as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="expenses.csv"'
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


class ExpenseAnalyticsView(APIView):
    """Get expense analytics data"""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def get(self, request):
        try:
            # Validate parameters
            validated_params = ExpenseValidator.validate_analytics_params(request.query_params)
            
            # Get analytics data
            analytics = ExpenseService.get_analytics_data(
                request.user, 
                validated_params['period']
            )
            
            return Response(analytics, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Analytics error: {e}")
            return Response(
                {'error': 'Analytics unavailable'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExpenseSummaryView(APIView):
    """Get expense summary statistics"""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 10))  # Cache for 10 minutes
    def get(self, request):
        try:
            expenses = Expense.objects.filter(user=request.user)
            
            summary = {
                'total_expenses': expenses.count(),
                'total_amount': sum(expense.amount for expense in expenses),
                'categories': list(expenses.values_list('category', flat=True).distinct()),
                'date_range': {
                    'earliest': expenses.order_by('transaction_date').first().transaction_date if expenses.exists() else None,
                    'latest': expenses.order_by('-transaction_date').first().transaction_date if expenses.exists() else None
                }
            }
            
            return Response(summary, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Summary error: {e}")
            return Response(
                {'error': 'Summary unavailable'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
