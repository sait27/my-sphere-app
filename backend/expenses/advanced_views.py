from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
import json
from .models import Expense, ExpenseCategory, ExpenseTag, ExpenseAnalytics
from .serializers import ExpenseCategorySerializer, ExpenseTagSerializer, ExpenseAnalyticsSerializer

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
        user = request.user
        period = request.query_params.get('period', 'month')  # month, quarter, year
        
        # Calculate date range
        today = timezone.now().date()
        if period == 'month':
            start_date = today.replace(day=1)
        elif period == 'quarter':
            quarter_start = ((today.month - 1) // 3) * 3 + 1
            start_date = today.replace(month=quarter_start, day=1)
        else:  # year
            start_date = today.replace(month=1, day=1)
        
        expenses = Expense.objects.filter(
            user=user,
            transaction_date__gte=start_date,
            transaction_date__lte=today
        )
        
        # Basic stats
        total_amount = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        avg_amount = expenses.aggregate(Avg('amount'))['amount__avg'] or 0
        expense_count = expenses.count()
        
        # Category breakdown
        category_stats = expenses.values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Payment method breakdown
        payment_stats = expenses.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Daily spending trend
        daily_stats = expenses.extra(
            select={'day': 'date(transaction_date)'}
        ).values('day').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('day')
        
        # Top vendors
        vendor_stats = expenses.exclude(vendor__isnull=True).values('vendor').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:10]
        
        # Expense type breakdown
        type_stats = expenses.values('expense_type').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        return Response({
            'period': period,
            'date_range': {'start': start_date, 'end': today},
            'summary': {
                'total_amount': float(total_amount),
                'average_amount': float(avg_amount),
                'expense_count': expense_count,
                'daily_average': float(total_amount / max((today - start_date).days, 1))
            },
            'category_breakdown': list(category_stats),
            'payment_method_breakdown': list(payment_stats),
            'daily_spending': list(daily_stats),
            'top_vendors': list(vendor_stats),
            'expense_type_breakdown': list(type_stats)
        })
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Get spending trends and patterns"""
        user = request.user
        months = int(request.query_params.get('months', 6))
        
        # Get monthly trends
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=months * 30)
        
        monthly_trends = []
        for i in range(months):
            month_start = end_date.replace(day=1) - timedelta(days=i * 30)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_expenses = Expense.objects.filter(
                user=user,
                transaction_date__gte=month_start,
                transaction_date__lte=month_end
            )
            
            total = month_expenses.aggregate(Sum('amount'))['amount__sum'] or 0
            count = month_expenses.count()
            avg = month_expenses.aggregate(Avg('amount'))['amount__avg'] or 0
            
            monthly_trends.append({
                'month': month_start.strftime('%Y-%m'),
                'total': float(total),
                'count': count,
                'average': float(avg)
            })
        
        return Response({
            'monthly_trends': list(reversed(monthly_trends))
        })
    
    @action(detail=False, methods=['get'])
    def budget_analysis(self, request):
        """Analyze spending against budgets"""
        user = request.user
        current_month = timezone.now().date().replace(day=1)
        
        # Get current month expenses by category
        month_expenses = Expense.objects.filter(
            user=user,
            transaction_date__gte=current_month
        )
        
        category_spending = month_expenses.values('category').annotate(
            spent=Sum('amount')
        )
        
        # Get custom categories with budgets
        custom_categories = ExpenseCategory.objects.filter(
            user=user,
            budget_limit__isnull=False,
            is_active=True
        )
        
        budget_analysis = []
        for category in custom_categories:
            spent = month_expenses.filter(category=category.name).aggregate(
                Sum('amount')
            )['amount__sum'] or 0
            
            budget_analysis.append({
                'category': category.name,
                'budget_limit': float(category.budget_limit),
                'spent': float(spent),
                'remaining': float(category.budget_limit - spent),
                'percentage_used': float((spent / category.budget_limit) * 100) if category.budget_limit > 0 else 0,
                'is_over_budget': spent > category.budget_limit
            })
        
        return Response({
            'current_month': current_month.strftime('%Y-%m'),
            'budget_analysis': budget_analysis,
            'total_budgeted': sum([float(cat.budget_limit) for cat in custom_categories]),
            'total_spent': float(month_expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
        })
    
    @action(detail=False, methods=['post'])
    def bulk_categorize(self, request):
        """Bulk categorize expenses using AI or rules"""
        user = request.user
        expense_ids = request.data.get('expense_ids', [])
        new_category = request.data.get('category')
        
        if not expense_ids or not new_category:
            return Response(
                {'error': 'expense_ids and category are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = Expense.objects.filter(
            user=user,
            expense_id__in=expense_ids
        ).update(category=new_category)
        
        return Response({
            'updated_count': updated_count,
            'category': new_category
        })
    
    @action(detail=False, methods=['post'])
    def duplicate_expense(self, request):
        """Duplicate an existing expense"""
        user = request.user
        expense_id = request.data.get('expense_id')
        
        try:
            original_expense = Expense.objects.get(expense_id=expense_id, user=user)
            
            # Create duplicate
            original_expense.pk = None
            original_expense.expense_id = None  # Will generate new ID
            original_expense.display_id = None  # Will generate new display ID
            original_expense.transaction_date = timezone.now().date()
            original_expense.save()
            
            return Response({
                'message': 'Expense duplicated successfully',
                'new_expense_id': original_expense.expense_id
            })
            
        except Expense.DoesNotExist:
            return Response(
                {'error': 'Expense not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced expense search"""
        user = request.user
        query = request.query_params.get('q', '')
        category = request.query_params.get('category')
        vendor = request.query_params.get('vendor')
        payment_method = request.query_params.get('payment_method')
        min_amount = request.query_params.get('min_amount')
        max_amount = request.query_params.get('max_amount')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        expenses = Expense.objects.filter(user=user)
        
        if query:
            expenses = expenses.filter(
                Q(description__icontains=query) |
                Q(vendor__icontains=query) |
                Q(raw_text__icontains=query) |
                Q(notes__icontains=query)
            )
        
        if category:
            expenses = expenses.filter(category=category)
        
        if vendor:
            expenses = expenses.filter(vendor__icontains=vendor)
        
        if payment_method:
            expenses = expenses.filter(payment_method=payment_method)
        
        if min_amount:
            expenses = expenses.filter(amount__gte=min_amount)
        
        if max_amount:
            expenses = expenses.filter(amount__lte=max_amount)
        
        if start_date:
            expenses = expenses.filter(transaction_date__gte=start_date)
        
        if end_date:
            expenses = expenses.filter(transaction_date__lte=end_date)
        
        from .serializers import ExpenseSerializer
        serializer = ExpenseSerializer(expenses[:100], many=True)  # Limit results
        
        return Response({
            'results': serializer.data,
            'total_count': expenses.count()
        })
