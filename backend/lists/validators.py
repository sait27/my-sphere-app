# lists/validators.py

import re
from decimal import Decimal, InvalidOperation
from datetime import datetime
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from .models import List, ListItem, ListCategory, ListTemplate

class ListValidator:
    """Validator for list creation and updates"""
    
    @staticmethod
    def validate_create_list(data, user):
        """Validate list creation data"""
        errors = {}
        
        # Required fields
        if not data.get('name'):
            errors['name'] = 'List name is required'
        elif len(data['name'].strip()) < 2:
            errors['name'] = 'List name must be at least 2 characters'
        elif len(data['name']) > 100:
            errors['name'] = 'List name cannot exceed 100 characters'
        
        # Check for duplicate names (case-insensitive)
        if data.get('name'):
            existing = List.objects.filter(
                user=user,
                name__iexact=data['name'].strip(),
                is_archived=False
            ).exists()
            if existing:
                errors['name'] = 'A list with this name already exists'
        
        # Validate list type
        valid_types = [choice[0] for choice in List.LIST_TYPES]
        if data.get('list_type') and data['list_type'] not in valid_types:
            errors['list_type'] = f'Invalid list type. Must be one of: {", ".join(valid_types)}'
        
        # Validate priority
        valid_priorities = [choice[0] for choice in List.PRIORITY_LEVELS]
        if data.get('priority') and data['priority'] not in valid_priorities:
            errors['priority'] = f'Invalid priority. Must be one of: {", ".join(valid_priorities)}'
        
        # Validate category if provided
        if data.get('category_id'):
            try:
                category = ListCategory.objects.get(id=data['category_id'], user=user)
                data['category'] = category
            except ListCategory.DoesNotExist:
                errors['category'] = 'Invalid category selected'
        
        # Validate due date
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                if due_date < datetime.now(due_date.tzinfo):
                    errors['due_date'] = 'Due date cannot be in the past'
            except (ValueError, AttributeError):
                errors['due_date'] = 'Invalid due date format'
        
        # Validate estimated cost
        if data.get('estimated_cost'):
            try:
                cost = Decimal(str(data['estimated_cost']))
                if cost < 0:
                    errors['estimated_cost'] = 'Estimated cost cannot be negative'
                elif cost > 999999.99:
                    errors['estimated_cost'] = 'Estimated cost too large'
            except (InvalidOperation, ValueError):
                errors['estimated_cost'] = 'Invalid estimated cost format'
        
        if errors:
            raise ValidationError(errors)
        
        return data

    @staticmethod
    def validate_update_list(data, list_obj, user):
        """Validate list update data"""
        errors = {}
        
        # Name validation (if being updated)
        if 'name' in data:
            if not data['name']:
                errors['name'] = 'List name is required'
            elif len(data['name'].strip()) < 2:
                errors['name'] = 'List name must be at least 2 characters'
            elif len(data['name']) > 100:
                errors['name'] = 'List name cannot exceed 100 characters'
            else:
                # Check for duplicate names (excluding current list)
                existing = List.objects.filter(
                    user=user,
                    name__iexact=data['name'].strip(),
                    is_archived=False
                ).exclude(id=list_obj.id).exists()
                if existing:
                    errors['name'] = 'A list with this name already exists'
        
        # Validate other fields similar to create validation
        if 'list_type' in data:
            valid_types = [choice[0] for choice in List.LIST_TYPES]
            if data['list_type'] not in valid_types:
                errors['list_type'] = f'Invalid list type. Must be one of: {", ".join(valid_types)}'
        
        if errors:
            raise ValidationError(errors)
        
        return data

class ListItemValidator:
    """Validator for list item operations"""
    
    @staticmethod
    def validate_create_item(data, list_obj):
        """Validate item creation data"""
        errors = {}
        
        # Required fields
        if not data.get('name'):
            errors['name'] = 'Item name is required'
        elif len(data['name'].strip()) < 1:
            errors['name'] = 'Item name cannot be empty'
        elif len(data['name']) > 200:
            errors['name'] = 'Item name cannot exceed 200 characters'
        
        # Validate quantity format
        if data.get('quantity'):
            quantity = data['quantity'].strip()
            if len(quantity) > 50:
                errors['quantity'] = 'Quantity description too long'
        
        # Validate priority
        if data.get('priority'):
            valid_priorities = [choice[0] for choice in ListItem.PRIORITY_LEVELS]
            if data['priority'] not in valid_priorities:
                errors['priority'] = f'Invalid priority. Must be one of: {", ".join(valid_priorities)}'
        
        # Validate prices
        for price_field in ['price', 'estimated_price']:
            if data.get(price_field):
                try:
                    price = Decimal(str(data[price_field]))
                    if price < 0:
                        errors[price_field] = f'{price_field.replace("_", " ").title()} cannot be negative'
                    elif price > 999999.99:
                        errors[price_field] = f'{price_field.replace("_", " ").title()} too large'
                except (InvalidOperation, ValueError):
                    errors[price_field] = f'Invalid {price_field.replace("_", " ")} format'
        
        # Validate URL format
        if data.get('url'):
            url_pattern = re.compile(
                r'^https?://'  # http:// or https://
                r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
                r'localhost|'  # localhost...
                r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
                r'(?::\d+)?'  # optional port
                r'(?:/?|[/?]\S+)$', re.IGNORECASE)
            if not url_pattern.match(data['url']):
                errors['url'] = 'Invalid URL format'
        
        # Check for duplicate items in the same list
        if data.get('name'):
            existing = ListItem.objects.filter(
                list=list_obj,
                name__iexact=data['name'].strip()
            ).exists()
            if existing:
                errors['name'] = 'An item with this name already exists in this list'
        
        if errors:
            raise ValidationError(errors)
        
        return data

    @staticmethod
    def validate_bulk_items(data):
        """Validate bulk item operations"""
        errors = {}
        
        if not data.get('item_ids'):
            errors['item_ids'] = 'At least one item ID is required'
        elif not isinstance(data['item_ids'], list):
            errors['item_ids'] = 'Item IDs must be provided as a list'
        elif len(data['item_ids']) > 100:
            errors['item_ids'] = 'Cannot process more than 100 items at once'
        
        # Validate operation type
        valid_operations = [
            'bulk_complete_items', 'bulk_delete_items', 
            'bulk_categorize_items', 'bulk_update_priority'
        ]
        if not data.get('operation'):
            errors['operation'] = 'Operation type is required'
        elif data['operation'] not in valid_operations:
            errors['operation'] = f'Invalid operation. Must be one of: {", ".join(valid_operations)}'
        
        # Operation-specific validation
        if data.get('operation') == 'bulk_categorize_items':
            if not data.get('category'):
                errors['category'] = 'Category is required for categorization operation'
        
        if data.get('operation') == 'bulk_update_priority':
            valid_priorities = [choice[0] for choice in ListItem.PRIORITY_LEVELS]
            if not data.get('priority') or data['priority'] not in valid_priorities:
                errors['priority'] = f'Valid priority is required. Must be one of: {", ".join(valid_priorities)}'
        
        if errors:
            raise ValidationError(errors)
        
        return data

class ListAnalyticsValidator:
    """Validator for analytics requests"""
    
    @staticmethod
    def validate_analytics_request(data):
        """Validate analytics request parameters"""
        errors = {}
        
        # Validate period
        valid_periods = ['week', 'month', 'quarter', 'year']
        if data.get('period') and data['period'] not in valid_periods:
            errors['period'] = f'Invalid period. Must be one of: {", ".join(valid_periods)}'
        
        # Validate date range if provided
        if data.get('start_date') and data.get('end_date'):
            try:
                start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
                
                if start_date >= end_date:
                    errors['date_range'] = 'Start date must be before end date'
                
                # Limit to reasonable date ranges
                if (end_date - start_date).days > 365:
                    errors['date_range'] = 'Date range cannot exceed 365 days'
                    
            except (ValueError, AttributeError):
                errors['date_range'] = 'Invalid date format'
        
        # Validate metrics selection
        if data.get('metrics'):
            valid_metrics = [
                'summary', 'productivity', 'categories', 'list_types', 
                'completion_trends', 'insights'
            ]
            invalid_metrics = set(data['metrics']) - set(valid_metrics)
            if invalid_metrics:
                errors['metrics'] = f'Invalid metrics: {", ".join(invalid_metrics)}'
        
        if errors:
            raise ValidationError(errors)
        
        return data

class ListSharingValidator:
    """Validator for list sharing operations"""
    
    @staticmethod
    def validate_share_list(data, list_obj, user):
        """Validate list sharing data"""
        errors = {}
        
        # Validate recipient
        if not data.get('recipient_email') and not data.get('recipient_id'):
            errors['recipient'] = 'Recipient email or user ID is required'
        
        if data.get('recipient_email'):
            try:
                recipient = User.objects.get(email=data['recipient_email'])
                if recipient == user:
                    errors['recipient'] = 'Cannot share list with yourself'
            except User.DoesNotExist:
                errors['recipient'] = 'User with this email does not exist'
        
        if data.get('recipient_id'):
            try:
                recipient = User.objects.get(id=data['recipient_id'])
                if recipient == user:
                    errors['recipient'] = 'Cannot share list with yourself'
            except User.DoesNotExist:
                errors['recipient'] = 'User does not exist'
        
        # Validate permission level
        valid_permissions = [choice[0] for choice in ListShare.PERMISSION_LEVELS]
        if not data.get('permission_level'):
            errors['permission_level'] = 'Permission level is required'
        elif data['permission_level'] not in valid_permissions:
            errors['permission_level'] = f'Invalid permission level. Must be one of: {", ".join(valid_permissions)}'
        
        # Check if already shared
        if data.get('recipient_email'):
            recipient = User.objects.get(email=data['recipient_email'])
        else:
            recipient = User.objects.get(id=data['recipient_id'])
        
        existing_share = ListShare.objects.filter(
            list=list_obj,
            user=recipient
        ).exists()
        
        if existing_share:
            errors['recipient'] = 'List is already shared with this user'
        
        if errors:
            raise ValidationError(errors)
        
        return data

class ListTemplateValidator:
    """Validator for template operations"""
    
    @staticmethod
    def validate_create_template(data, user):
        """Validate template creation data"""
        errors = {}
        
        # Required fields
        if not data.get('name'):
            errors['name'] = 'Template name is required'
        elif len(data['name'].strip()) < 2:
            errors['name'] = 'Template name must be at least 2 characters'
        elif len(data['name']) > 100:
            errors['name'] = 'Template name cannot exceed 100 characters'
        
        # Check for duplicate template names
        if data.get('name'):
            existing = ListTemplate.objects.filter(
                user=user,
                name__iexact=data['name'].strip()
            ).exists()
            if existing:
                errors['name'] = 'A template with this name already exists'
        
        # Validate category
        if data.get('category'):
            valid_categories = ['general', 'shopping', 'work', 'personal', 'travel', 'health']
            if data['category'] not in valid_categories:
                errors['category'] = f'Invalid category. Must be one of: {", ".join(valid_categories)}'
        
        # Validate description length
        if data.get('description') and len(data['description']) > 500:
            errors['description'] = 'Description cannot exceed 500 characters'
        
        if errors:
            raise ValidationError(errors)
        
        return data

class ListImportValidator:
    """Validator for list import operations"""
    
    @staticmethod
    def validate_import_data(data, user):
        """Validate imported list data"""
        errors = {}
        
        # Validate file format
        if not data.get('format'):
            errors['format'] = 'Import format is required'
        elif data['format'] not in ['csv', 'json', 'txt']:
            errors['format'] = 'Invalid format. Supported formats: csv, json, txt'
        
        # Validate data structure
        if not data.get('items') and not data.get('content'):
            errors['data'] = 'No data provided for import'
        
        # Validate items if provided
        if data.get('items'):
            if not isinstance(data['items'], list):
                errors['items'] = 'Items must be provided as a list'
            elif len(data['items']) > 1000:
                errors['items'] = 'Cannot import more than 1000 items at once'
            else:
                # Validate each item
                for i, item in enumerate(data['items']):
                    if not isinstance(item, dict):
                        errors[f'item_{i}'] = 'Each item must be an object'
                    elif not item.get('name'):
                        errors[f'item_{i}'] = 'Item name is required'
        
        # Validate list settings
        if data.get('list_name'):
            if len(data['list_name']) > 100:
                errors['list_name'] = 'List name cannot exceed 100 characters'
            
            # Check for duplicate names
            existing = List.objects.filter(
                user=user,
                name__iexact=data['list_name'].strip(),
                is_archived=False
            ).exists()
            if existing:
                errors['list_name'] = 'A list with this name already exists'
        
        if errors:
            raise ValidationError(errors)
        
        return data

# Utility functions for common validations
def validate_text_input(text, field_name, min_length=1, max_length=200):
    """Common text input validation"""
    if not text or not text.strip():
        return f'{field_name} is required'
    
    text = text.strip()
    if len(text) < min_length:
        return f'{field_name} must be at least {min_length} characters'
    
    if len(text) > max_length:
        return f'{field_name} cannot exceed {max_length} characters'
    
    return None

def validate_email_format(email):
    """Validate email format"""
    email_pattern = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    return email_pattern.match(email) is not None

def sanitize_html_input(text):
    """Basic HTML sanitization"""
    if not text:
        return text
    
    # Remove potentially dangerous HTML tags
    dangerous_tags = ['script', 'iframe', 'object', 'embed', 'form']
    for tag in dangerous_tags:
        text = re.sub(f'<{tag}.*?</{tag}>', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(f'<{tag}.*?>', '', text, flags=re.IGNORECASE)
    
    return text
