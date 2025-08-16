# expenses/validators.py
"""
Input validation for expense-related operations
"""

from decimal import Decimal, InvalidOperation
from datetime import datetime, date
from typing import Dict, Any, List
from django.core.exceptions import ValidationError
from django.utils import timezone


class ExpenseValidator:
    """Validator for expense data"""
    
    REQUIRED_FIELDS = ['text']
    OPTIONAL_FIELDS = ['amount', 'category', 'vendor', 'description', 'transaction_date']
    MAX_TEXT_LENGTH = 1000
    MAX_AMOUNT = Decimal('999999.99')
    MIN_AMOUNT = Decimal('0.01')
    
    @classmethod
    def validate_create_request(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate expense creation request data
        
        Args:
            data: Request data dictionary
            
        Returns:
            Validated and cleaned data
            
        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(data, dict):
            raise ValidationError("Request data must be a dictionary")
        
        # Check required fields
        for field in cls.REQUIRED_FIELDS:
            if field not in data or not data[field]:
                raise ValidationError(f"Field '{field}' is required")
        
        # Validate text field
        text = data.get('text', '').strip()
        if not text:
            raise ValidationError("Text field cannot be empty")
        
        if len(text) > cls.MAX_TEXT_LENGTH:
            raise ValidationError(f"Text field cannot exceed {cls.MAX_TEXT_LENGTH} characters")
        
        return {'text': text}
    
    @classmethod
    def validate_bulk_operation(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate bulk operation request data
        
        Args:
            data: Request data dictionary
            
        Returns:
            Validated data
            
        Raises:
            ValidationError: If validation fails
        """
        operation = data.get('operation') or data.get('action')
        expense_ids = data.get('expense_ids', [])
        
        if not operation:
            raise ValidationError("Operation field is required")
        
        if not expense_ids or not isinstance(expense_ids, list):
            raise ValidationError("expense_ids must be a non-empty list")
        
        valid_operations = ['delete', 'categorize', 'duplicate']
        if operation not in valid_operations:
            raise ValidationError(f"Invalid operation. Must be one of: {valid_operations}")
        
        # Validate categorize operation
        if operation == 'categorize':
            category = data.get('category')
            if not category or not isinstance(category, str):
                raise ValidationError("Category is required for categorize operation")
        
        return {
            'operation': operation,
            'expense_ids': expense_ids,
            'category': data.get('category')
        }
    
    @classmethod
    def validate_export_request(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate export request data
        
        Args:
            data: Request data dictionary
            
        Returns:
            Validated data
            
        Raises:
            ValidationError: If validation fails
        """
        expense_ids = data.get('expense_ids', [])
        export_format = data.get('format', 'csv')
        
        if not expense_ids or not isinstance(expense_ids, list):
            raise ValidationError("expense_ids must be a non-empty list")
        
        valid_formats = ['csv', 'json', 'xlsx']
        if export_format not in valid_formats:
            raise ValidationError(f"Invalid format. Must be one of: {valid_formats}")
        
        return {
            'expense_ids': expense_ids,
            'format': export_format
        }
    
    @classmethod
    def validate_analytics_params(cls, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate analytics request parameters
        
        Args:
            params: Query parameters
            
        Returns:
            Validated parameters
            
        Raises:
            ValidationError: If validation fails
        """
        period = params.get('period', 'month')
        valid_periods = ['week', 'month', 'quarter', 'year']
        
        if period not in valid_periods:
            raise ValidationError(f"Invalid period. Must be one of: {valid_periods}")
        
        return {'period': period}


class FilterValidator:
    """Validator for expense filters"""
    
    @classmethod
    def validate_filters(cls, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate expense filter parameters
        
        Args:
            filters: Filter parameters
            
        Returns:
            Validated filters
            
        Raises:
            ValidationError: If validation fails
        """
        validated = {}
        
        # Category filter
        category = filters.get('category')
        if category and category != 'all':
            validated['category'] = str(category)
        
        # Date range filter
        date_range = filters.get('date_range')
        if date_range and date_range != 'all':
            valid_ranges = ['today', 'week', 'month', 'quarter', 'year']
            if date_range not in valid_ranges:
                raise ValidationError(f"Invalid date_range. Must be one of: {valid_ranges}")
            validated['date_range'] = date_range
        
        # Amount range filters
        min_amount = filters.get('min_amount')
        if min_amount:
            try:
                validated['min_amount'] = Decimal(str(min_amount))
            except (InvalidOperation, ValueError):
                raise ValidationError("min_amount must be a valid number")
        
        max_amount = filters.get('max_amount')
        if max_amount:
            try:
                validated['max_amount'] = Decimal(str(max_amount))
            except (InvalidOperation, ValueError):
                raise ValidationError("max_amount must be a valid number")
        
        # Payment method filter
        payment_method = filters.get('payment_method')
        if payment_method and payment_method != 'all':
            validated['payment_method'] = str(payment_method)
        
        return validated
