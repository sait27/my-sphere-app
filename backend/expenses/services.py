# expenses/services.py
"""
Business logic layer for expenses - following Django best practices
"""

import logging
import json
from decimal import Decimal
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import TruncMonth, TruncDate
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import Expense, ExpenseCategory, ExpenseTag
from budgets.models import Budget
from .advanced_analytics import AdvancedExpenseAnalytics

logger = logging.getLogger(__name__)

class ExpenseService:
    """Service class for expense-related business logic"""
    
    @staticmethod
    def create_expense_from_ai(user: User, raw_text: str, ai_data: Dict) -> List[Expense]:
        """
        Create expenses from AI-parsed data
        
        Args:
            user: The user creating the expense
            raw_text: Original text input
            ai_data: Parsed data from AI
            
        Returns:
            List of created Expense objects
            
        Raises:
            ValidationError: If data is invalid
        """
        expenses = []
        expense_list = ai_data.get('expenses', [])
        
        if not expense_list:
            raise ValidationError("AI did not find any expenses in the text.")
        
        logger.info(f"Creating {len(expense_list)} expenses for user {user.username}")
        
        for expense_data in expense_list:
            try:
                expense = Expense.objects.create(
                    user=user,
                    raw_text=raw_text,
                    amount=Decimal(str(expense_data.get('amount', 0))),
                    category=expense_data.get('category', 'Other'),
                    vendor=expense_data.get('vendor'),
                    description=expense_data.get('description'),
                    transaction_date=expense_data.get('transaction_date', timezone.now().date())
                )
                expenses.append(expense)
                logger.info(f"Created expense {expense.expense_id} for ₹{expense.amount}")
                
            except Exception as e:
                logger.error(f"Failed to create expense: {e}")
                raise ValidationError(f"Failed to create expense: {str(e)}")
        
        return expenses
    
    @staticmethod
    def get_user_expenses(user: User, filters: Optional[Dict] = None) -> List[Expense]:
        """
        Get filtered expenses for a user
        
        Args:
            user: The user
            filters: Optional filters dict
            
        Returns:
            QuerySet of expenses
        """
        queryset = Expense.objects.filter(user=user)
        
        if filters:
            if filters.get('category') and filters['category'] != 'all':
                queryset = queryset.filter(category=filters['category'])
            
            if filters.get('date_range'):
                date_filter = filters['date_range']
                if date_filter == 'today':
                    queryset = queryset.filter(transaction_date=timezone.now().date())
                elif date_filter == 'week':
                    week_ago = timezone.now().date() - timedelta(days=7)
                    queryset = queryset.filter(transaction_date__gte=week_ago)
                elif date_filter == 'month':
                    month_ago = timezone.now().date() - timedelta(days=30)
                    queryset = queryset.filter(transaction_date__gte=month_ago)
            
            if filters.get('min_amount'):
                queryset = queryset.filter(amount__gte=filters['min_amount'])
            
            if filters.get('max_amount'):
                queryset = queryset.filter(amount__lte=filters['max_amount'])
        
        return queryset.order_by('-transaction_date', '-created_at')
    
    @staticmethod
    def get_analytics_data(user: User, period: str = 'month') -> Dict:
        """
        Generate analytics data for user expenses
        
        Args:
            user: The user
            period: Time period for analysis
            
        Returns:
            Dictionary containing analytics data
        """
        # Calculate date range based on current period
        today = timezone.now().date()
        
        if period == 'week':
            # Current week (Monday to Sunday)
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'month':
            # Current month only
            start_date = today.replace(day=1)
            next_month = (start_date + timedelta(days=32)).replace(day=1)
            end_date = next_month - timedelta(days=1)
        elif period == 'quarter':
            # Current quarter only
            quarter = (today.month - 1) // 3 + 1
            start_date = today.replace(month=(quarter - 1) * 3 + 1, day=1)
            end_month = quarter * 3
            if end_month > 12:
                end_date = today.replace(year=today.year + 1, month=end_month - 12, day=1) - timedelta(days=1)
            else:
                end_date = (today.replace(month=end_month, day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        elif period == 'year':
            # Current year only
            start_date = today.replace(month=1, day=1)
            end_date = today.replace(month=12, day=31)
        else:
            # Default to current month
            start_date = today.replace(day=1)
            next_month = (start_date + timedelta(days=32)).replace(day=1)
            end_date = next_month - timedelta(days=1)
        
        expenses = Expense.objects.filter(
            user=user,
            transaction_date__gte=start_date,
            transaction_date__lte=end_date
        )
        
        # Summary statistics
        summary = expenses.aggregate(
            total_amount=Sum('amount'),
            expense_count=Count('expense_id'),
            average_amount=Avg('amount')
        )
        
        # Category breakdown
        category_breakdown = list(
            expenses.values('category')
            .annotate(
                total=Sum('amount'),
                count=Count('expense_id')
            )
            .order_by('-total')
        )
        
        # Payment method breakdown
        payment_breakdown = list(
            expenses.values('payment_method')
            .annotate(
                total=Sum('amount'),
                count=Count('expense_id')
            )
            .order_by('-total')
        )
        
        logger.info(f"Generated analytics for user {user.username} - {period} period")
        
        return {
            'summary': summary,
            'category_breakdown': category_breakdown,
            'payment_method_breakdown': payment_breakdown,
            'period': period,
            'date_range': {
                'start': start_date,
                'end': end_date
            }
        }
    
    @staticmethod
    def bulk_update_expenses(user: User, expense_ids: List[str], operation: str, **kwargs) -> Dict:
        """
        Perform bulk operations on expenses
        
        Args:
            user: The user
            expense_ids: List of expense IDs
            operation: Operation to perform
            **kwargs: Additional parameters
            
        Returns:
            Result dictionary
        """
        expenses = Expense.objects.filter(expense_id__in=expense_ids, user=user)
        count = expenses.count()
        
        if operation == 'delete':
            expenses.delete()
            logger.info(f"Deleted {count} expenses for user {user.username}")
            return {'message': f'Successfully deleted {count} expenses', 'count': count}
        
        elif operation == 'categorize':
            category = kwargs.get('category')
            if not category:
                raise ValidationError('Category is required for categorize operation')
            
            expenses.update(category=category)
            logger.info(f"Categorized {count} expenses to '{category}' for user {user.username}")
            return {'message': f'Successfully categorized {count} expenses', 'count': count}
        
        elif operation == 'duplicate':
            duplicated = 0
            for expense in expenses:
                expense.pk = None
                expense.expense_id = None
                expense.save()
                duplicated += 1
            
            logger.info(f"Duplicated {duplicated} expenses for user {user.username}")
            return {'message': f'Successfully duplicated {duplicated} expenses', 'count': duplicated}
        
        else:
            raise ValidationError(f'Invalid operation: {operation}')
    
    @staticmethod
    def get_expense_summary(user: User) -> Dict:
        """Get expense summary data"""
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        start_of_month = today.replace(day=1)
        end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        today_sum = Expense.objects.filter(
            user=user, transaction_date=today
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        week_sum = Expense.objects.filter(
            user=user, 
            transaction_date__gte=start_of_week,
            transaction_date__lte=end_of_week
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        month_sum = Expense.objects.filter(
            user=user, 
            transaction_date__gte=start_of_month,
            transaction_date__lte=end_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        current_budget_amount = 0
        try:
            budget = Budget.objects.get(
                user=user, is_active=True, start_date__lte=today, end_date__gte=today
            )
            current_budget_amount = budget.amount
        except (Budget.DoesNotExist, Budget.MultipleObjectsReturned):
            pass
        
        # Get current month expenses for totals
        current_month_expenses = Expense.objects.filter(
            user=user,
            transaction_date__gte=start_of_month,
            transaction_date__lte=end_of_month
        )
        
        return {
            'today': float(today_sum),
            'week': float(week_sum),
            'month': float(month_sum),
            'current_budget': float(current_budget_amount),
            'total_expenses': current_month_expenses.count(),
            'total_amount': float(current_month_expenses.aggregate(total=Sum('amount'))['total'] or 0),
            'categories': list(current_month_expenses.values_list('category', flat=True).distinct()),
            'date_range': {
                'start': start_of_month,
                'end': end_of_month
            }
        }


class AIExpenseParser:
    """Service for AI-powered expense parsing"""
    
    def __init__(self, ai_model):
        self.ai_model = ai_model
        self.logger = logging.getLogger(__name__)
    
    def parse_expense_text(self, text: str) -> Dict:
        """
        Parse expense text using AI
        
        Args:
            text: Raw expense text
            
        Returns:
            Parsed expense data
            
        Raises:
            ValidationError: If parsing fails
        """
        if not self.ai_model:
            raise ValidationError("AI model not configured")
        
        prompt = self._build_prompt(text)
        
        try:
            response = self.ai_model.generate_content(prompt)
            cleaned_json = response.text.strip().replace('```json', '').replace('```', '').strip()
            
            self.logger.info(f"AI parsed expense text successfully")
            return json.loads(cleaned_json)
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse AI response as JSON: {e}")
            raise ValidationError("Failed to parse AI response")
        
        except Exception as e:
            self.logger.error(f"AI processing error: {e}")
            raise ValidationError(f"AI processing failed: {str(e)}")
    
    def _build_prompt(self, text: str) -> str:
        """Build the AI prompt for expense parsing"""
        return f"""
        You are a highly intelligent expense parsing system. Your task is to analyze the user's text and extract ALL SEPARATE financial expenses mentioned.

        **CRITICAL RULES:**
        1. Extract EVERY expense mentioned, even if multiple in one sentence
        2. Return ONLY valid JSON - no explanations or extra text
        3. Use Indian Rupee amounts (₹) but return numbers only
        4. Infer reasonable categories from context
        5. Extract vendor/merchant names when mentioned
        6. Use today's date if no date specified: {datetime.now().strftime('%Y-%m-%d')}

        **JSON Format:**
        {{
            "expenses": [
                {{
                    "amount": 150.00,
                    "category": "Food & Dining",
                    "vendor": "Starbucks",
                    "description": "coffee",
                    "transaction_date": "{datetime.now().strftime('%Y-%m-%d')}"
                }}
            ]
        }}

        **User's Text:** "{text}"
        **Your JSON Response:**
        """


class ExpenseAdvancedService:
    """Service for advanced expense operations"""
    
    @staticmethod
    def get_comprehensive_analytics(user: User, period: str = 'month') -> Dict:
        """Get comprehensive expense analytics"""
        today = timezone.now().date()
        
        if period == 'week':
            # Current week (Monday to Sunday)
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'month':
            # Current month only
            start_date = today.replace(day=1)
            next_month = (start_date + timedelta(days=32)).replace(day=1)
            end_date = next_month - timedelta(days=1)
        elif period == 'quarter':
            # Current quarter only
            quarter = (today.month - 1) // 3 + 1
            start_date = today.replace(month=(quarter - 1) * 3 + 1, day=1)
            end_month = quarter * 3
            if end_month > 12:
                end_date = today.replace(year=today.year + 1, month=end_month - 12, day=1) - timedelta(days=1)
            else:
                end_date = (today.replace(month=end_month, day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        elif period == 'year':
            # Current year only
            start_date = today.replace(month=1, day=1)
            end_date = today.replace(month=12, day=31)
        else:
            # Default to current month
            start_date = today.replace(day=1)
            next_month = (start_date + timedelta(days=32)).replace(day=1)
            end_date = next_month - timedelta(days=1)
        
        expenses = Expense.objects.filter(
            user=user, 
            transaction_date__gte=start_date, 
            transaction_date__lte=end_date
        )
        
        total_amount = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        avg_amount = expenses.aggregate(Avg('amount'))['amount__avg'] or 0
        expense_count = expenses.count()
        days_in_period = max((today - start_date).days, 1)

        weekend_total = weekday_total = 0
        by_day_of_week = {}

        for expense in expenses:
            day_name = expense.transaction_date.strftime('%A')
            by_day_of_week[day_name] = by_day_of_week.get(day_name, 0) + float(expense.amount)
            
            if expense.transaction_date.weekday() >= 5:
                weekend_total += float(expense.amount)
            else:
                weekday_total += float(expense.amount)

        high_value_transactions = [
            {
                'id': t.expense_id,
                'description': t.description or t.vendor or t.category,
                'amount': float(t.amount)
            } for t in expenses.order_by('-amount')[:3]
        ]
        
        category_stats = expenses.values('category').annotate(
            total=Sum('amount'), count=Count('expense_id')
        ).order_by('-total')
        
        payment_stats = expenses.values('payment_method').annotate(
            total=Sum('amount'), count=Count('expense_id')
        ).order_by('-total')

        return {
            'summary': {
                'total_amount': float(total_amount),
                'average_amount': float(avg_amount),
                'expense_count': expense_count,
                'daily_average': float(total_amount / days_in_period)
            },
            'category_insights': {
                'category_breakdown': [
                    {
                        'category': item['category'],
                        'total': float(item['total']),
                        'count': item['count']
                    } for item in category_stats
                ]
            },
            'payment_method_breakdown': [
                {
                    'payment_method': item['payment_method'] or 'cash',
                    'total': float(item['total']),
                    'count': item['count']
                } for item in payment_stats
            ],
            'spending_patterns': {
                'by_day_of_week': by_day_of_week,
                'weekend_vs_weekday': {
                    'weekday': weekday_total,
                    'weekend': weekend_total
                }
            },
            'high_value_transactions': high_value_transactions
        }
    
    @staticmethod
    def get_spending_trends(user: User, months: int = 6) -> Dict:
        """Get spending trends"""
        end_date = timezone.now().date()
        monthly_trends = []
        
        for i in range(months):
            month_start = end_date.replace(day=1) - timedelta(days=i * 30)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_expenses = Expense.objects.filter(
                user=user, transaction_date__gte=month_start, transaction_date__lte=month_end
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
        
        return {'monthly_trends': list(reversed(monthly_trends))}
    
    @staticmethod
    def get_budget_analysis(user: User) -> Dict:
        """Get budget analysis"""
        current_month = timezone.now().date().replace(day=1)
        next_month = (current_month + timedelta(days=32)).replace(day=1)
        
        logger.info(f"Budget analysis for user {user.username}, period: {current_month} to {next_month}")
        
        # Get current month expenses
        month_expenses = Expense.objects.filter(
            user=user, 
            transaction_date__gte=current_month,
            transaction_date__lt=next_month
        )
        
        logger.info(f"Found {month_expenses.count()} expenses for current month")
        
        # Get active budgets for current period
        active_budgets = Budget.objects.filter(
            user=user,
            is_active=True,
            start_date__lte=current_month,
            end_date__gte=current_month
        )
        
        logger.info(f"Found {active_budgets.count()} active budgets")
        
        budget_analysis = []
        for budget in active_budgets:
            # Calculate spent amount for this category
            spent_amount = month_expenses.filter(
                category=budget.category
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            remaining_amount = budget.amount - spent_amount
            utilization_percentage = (spent_amount / budget.amount * 100) if budget.amount > 0 else 0
            
            logger.info(f"Budget {budget.category}: spent={spent_amount}, budget={budget.amount}, utilization={utilization_percentage}%")
            
            budget_analysis.append({
                'category': budget.category,
                'budget_amount': float(budget.amount),
                'spent_amount': float(spent_amount),
                'remaining_amount': float(remaining_amount),
                'utilization_percentage': float(utilization_percentage),
                'status': 'over_budget' if spent_amount > budget.amount else 'within_budget'
            })
        
        total_budgeted = sum([float(budget.amount) for budget in active_budgets])
        total_spent = float(month_expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
        
        result = {
            'budget_analysis': budget_analysis,
            'current_month': current_month.strftime('%Y-%m'),
            'total_budgeted': total_budgeted,
            'total_spent': total_spent,
            'overall_utilization': (total_spent / total_budgeted * 100) if total_budgeted > 0 else 0,
            'message': 'No active budgets found for current month. Create budgets to see analysis.' if not budget_analysis else None
        }
        
        logger.info(f"Budget analysis result: {result}")
        return result
    
    @staticmethod
    def bulk_categorize_expenses(user: User, expense_ids: List[str], new_category: str) -> Dict:
        """Bulk categorize expenses"""
        updated_count = Expense.objects.filter(
            user=user, expense_id__in=expense_ids
        ).update(category=new_category)
        
        return {'updated_count': updated_count, 'category': new_category}
    
    @staticmethod
    def duplicate_expense(user: User, expense_id: str) -> Dict:
        """Duplicate an expense"""
        original_expense = Expense.objects.get(expense_id=expense_id, user=user)
        
        original_expense.pk = None
        original_expense.expense_id = None
        original_expense.display_id = None
        original_expense.transaction_date = timezone.now().date()
        original_expense.save()
        
        return {
            'message': 'Expense duplicated successfully',
            'new_expense_id': original_expense.expense_id
        }
    
    @staticmethod
    def search_expenses(user: User, search_params: Dict) -> Dict:
        """Advanced expense search"""
        expenses = Expense.objects.filter(user=user)
        
        if search_params.get('q'):
            expenses = expenses.filter(
                Q(description__icontains=search_params['q']) |
                Q(vendor__icontains=search_params['q']) |
                Q(raw_text__icontains=search_params['q']) |
                Q(notes__icontains=search_params['q'])
            )
        
        for field in ['category', 'payment_method']:
            if search_params.get(field):
                expenses = expenses.filter(**{field: search_params[field]})
        
        if search_params.get('vendor'):
            expenses = expenses.filter(vendor__icontains=search_params['vendor'])
        
        if search_params.get('min_amount'):
            expenses = expenses.filter(amount__gte=search_params['min_amount'])
        
        if search_params.get('max_amount'):
            expenses = expenses.filter(amount__lte=search_params['max_amount'])
        
        if search_params.get('start_date'):
            expenses = expenses.filter(transaction_date__gte=search_params['start_date'])
        
        if search_params.get('end_date'):
            expenses = expenses.filter(transaction_date__lte=search_params['end_date'])
        
        from .serializers import ExpenseSerializer
        serializer = ExpenseSerializer(expenses[:100], many=True)
        
        return {'results': serializer.data, 'total_count': expenses.count()}


class ExpenseCategoryService:
    """Service for expense category operations"""
    
    @staticmethod
    def get_user_categories(user: User):
        return ExpenseCategory.objects.filter(user=user)
    
    @staticmethod
    def create_category(user: User, category_data: Dict):
        return ExpenseCategory.objects.create(user=user, **category_data)


class ExpenseTagService:
    """Service for expense tag operations"""
    
    @staticmethod
    def get_user_tags(user: User):
        return ExpenseTag.objects.filter(user=user)
    
    @staticmethod
    def create_tag(user: User, tag_data: Dict):
        return ExpenseTag.objects.create(user=user, **tag_data)