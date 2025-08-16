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
        # Calculate date range
        end_date = timezone.now().date()
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)  # Default to month
        
        expenses = Expense.objects.filter(
            user=user,
            transaction_date__range=[start_date, end_date]
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
