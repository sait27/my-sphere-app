from django.core.exceptions import ValidationError
from decimal import Decimal, InvalidOperation
from datetime import datetime, date
import re
import os

class LendingValidator:
    """Validation utilities for lending operations"""
    
    @staticmethod
    def validate_create_request(data):
        """Validate lending transaction creation request"""
        errors = {}
        
        # Valid fields that can be accepted
        valid_fields = {
            'transaction_type', 'person_name', 'person_contact', 'person_email', 
            'amount', 'interest_rate', 'interest_type', 'category', 'custom_category',
            'priority', 'transaction_date', 'due_date', 'description', 'notes', 
            'location', 'payment_method'
        }
        
        # Filter out invalid fields
        filtered_data = {k: v for k, v in data.items() if k in valid_fields}
        
        # Required fields
        required_fields = ['transaction_type', 'person_name', 'amount']
        for field in required_fields:
            if not filtered_data.get(field):
                errors[field] = f'{field} is required'
        
        # Transaction type validation
        if filtered_data.get('transaction_type') not in ['lend', 'borrow']:
            errors['transaction_type'] = 'Invalid transaction type'
        
        # Amount validation
        try:
            amount = Decimal(str(filtered_data.get('amount', 0)))
            if amount <= 0:
                errors['amount'] = 'Amount must be greater than 0'
            elif amount > Decimal('1000000'):
                errors['amount'] = 'Amount cannot exceed $1,000,000'
        except (InvalidOperation, ValueError):
            errors['amount'] = 'Invalid amount format'
        
        # Person name validation
        person_name = filtered_data.get('person_name') or ''
        if person_name:
            person_name = person_name.strip()
            if len(person_name) < 2:
                errors['person_name'] = 'Person name must be at least 2 characters'
            elif len(person_name) > 100:
                errors['person_name'] = 'Person name cannot exceed 100 characters'
        
        # Email validation (if provided)
        email = filtered_data.get('person_email') or ''
        if email:
            email = email.strip()
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                errors['person_email'] = 'Invalid email format'
        
        # Interest rate validation
        try:
            interest_rate = Decimal(str(filtered_data.get('interest_rate', 0)))
            if interest_rate < 0:
                errors['interest_rate'] = 'Interest rate cannot be negative'
            elif interest_rate > 100:
                errors['interest_rate'] = 'Interest rate cannot exceed 100%'
        except (InvalidOperation, ValueError):
            errors['interest_rate'] = 'Invalid interest rate format'
        
        # Due date validation
        due_date = filtered_data.get('due_date')
        if due_date:
            try:
                if isinstance(due_date, str):
                    due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
                    filtered_data['due_date'] = due_date
                elif hasattr(due_date, 'date'):
                    due_date = due_date.date()
                    filtered_data['due_date'] = due_date
                if due_date < date.today():
                    errors['due_date'] = 'Due date cannot be in the past'
            except (ValueError, AttributeError):
                errors['due_date'] = 'Invalid due date format (use YYYY-MM-DD)'
        
        # Priority validation
        if filtered_data.get('priority') and filtered_data['priority'] not in ['low', 'medium', 'high', 'urgent']:
            errors['priority'] = 'Invalid priority level'
        
        if errors:
            raise ValidationError(errors)
        
        return filtered_data
    
    @staticmethod
    def validate_bulk_operation(data):
        """Validate bulk operation request"""
        errors = {}
        
        # Required fields
        if not data.get('operation'):
            errors['operation'] = 'Operation is required'
        
        if not data.get('transaction_ids'):
            errors['transaction_ids'] = 'Transaction IDs are required'
        elif not isinstance(data['transaction_ids'], list):
            errors['transaction_ids'] = 'Transaction IDs must be a list'
        elif len(data['transaction_ids']) == 0:
            errors['transaction_ids'] = 'At least one transaction ID is required'
        
        # Operation validation
        valid_operations = ['delete', 'mark_completed', 'categorize', 'set_priority']
        if data.get('operation') not in valid_operations:
            errors['operation'] = f'Invalid operation. Must be one of: {", ".join(valid_operations)}'
        
        # Operation-specific validation
        operation = data.get('operation')
        if operation == 'categorize' and not data.get('category'):
            errors['category'] = 'Category is required for categorize operation'
        
        if operation == 'set_priority':
            priority = data.get('priority')
            if not priority:
                errors['priority'] = 'Priority is required for set_priority operation'
            elif priority not in ['low', 'medium', 'high', 'urgent']:
                errors['priority'] = 'Invalid priority level'
        
        if errors:
            raise ValidationError(errors)
        
        return data
    
    @staticmethod
    def validate_payment_record(data):
        """Validate payment record data"""
        errors = {}
        
        # Amount validation
        try:
            amount = Decimal(str(data.get('amount', 0)))
            if amount <= 0:
                errors['amount'] = 'Payment amount must be greater than 0'
        except (InvalidOperation, ValueError):
            errors['amount'] = 'Invalid payment amount format'
        
        # Payment date validation
        payment_date = data.get('payment_date')
        if payment_date:
            try:
                if isinstance(payment_date, str):
                    payment_date = datetime.strptime(payment_date, '%Y-%m-%d').date()
                    data['payment_date'] = payment_date
                elif hasattr(payment_date, 'date'):
                    payment_date = payment_date.date()
                    data['payment_date'] = payment_date
                if payment_date > date.today():
                    errors['payment_date'] = 'Payment date cannot be in the future'
            except (ValueError, AttributeError):
                errors['payment_date'] = 'Invalid payment date format (use YYYY-MM-DD)'
        
        if errors:
            raise ValidationError(errors)
        
        return data
    
    @staticmethod
    def validate_filters(query_params):
        """Validate filter parameters"""
        filters = {}
        
        # Transaction type filter
        transaction_type = query_params.get('transaction_type')
        if transaction_type and transaction_type in ['lend', 'borrow']:
            filters['transaction_type'] = transaction_type
        
        # Status filter
        status = query_params.get('status')
        if status and status in ['active', 'completed', 'overdue', 'cancelled', 'partial']:
            filters['status'] = status
        
        # Person name filter
        person_name = query_params.get('person_name')
        if person_name:
            filters['person_name'] = str(person_name).strip()
        
        # Date range filters
        start_date = query_params.get('start_date')
        if start_date:
            try:
                if isinstance(start_date, str):
                    filters['start_date'] = datetime.strptime(start_date, '%Y-%m-%d').date()
                elif hasattr(start_date, 'date'):
                    filters['start_date'] = start_date.date()
                else:
                    filters['start_date'] = start_date
            except (ValueError, AttributeError):
                raise ValidationError({'start_date': 'Invalid start date format (use YYYY-MM-DD)'})
        
        end_date = query_params.get('end_date')
        if end_date:
            try:
                if isinstance(end_date, str):
                    filters['end_date'] = datetime.strptime(end_date, '%Y-%m-%d').date()
                elif hasattr(end_date, 'date'):
                    filters['end_date'] = end_date.date()
                else:
                    filters['end_date'] = end_date
            except (ValueError, AttributeError):
                raise ValidationError({'end_date': 'Invalid end date format (use YYYY-MM-DD)'})
        
        # Validate date range
        if filters.get('start_date') and filters.get('end_date'):
            if filters['start_date'] > filters['end_date']:
                raise ValidationError({'date_range': 'Start date cannot be after end date'})
        
        return filters
    
    @staticmethod
    def validate_contact_profile(data):
        """Validate contact profile data"""
        errors = {}
        
        # Name validation
        name = data.get('name') or ''
        if name:
            name = name.strip()
        if not name:
            errors['name'] = 'Name is required'
        elif len(name) < 2:
            errors['name'] = 'Name must be at least 2 characters'
        elif len(name) > 100:
            errors['name'] = 'Name cannot exceed 100 characters'
        
        # Email validation
        email = data.get('email') or ''
        if email:
            email = email.strip()
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                errors['email'] = 'Invalid email format'
        
        # Phone validation
        phone = data.get('phone') or ''
        if phone:
            phone = phone.strip()
            phone_pattern = r'^[\+]?[1-9]?\d{9,15}$'
            if not re.match(phone_pattern, phone):
                errors['phone'] = 'Invalid phone number format'
        
        # Relationship validation
        relationship = data.get('relationship')
        if relationship and relationship not in ['family', 'friend', 'colleague', 'business', 'other']:
            errors['relationship'] = 'Invalid relationship type'
        
        # Preferred contact method validation
        contact_method = data.get('preferred_contact_method')
        if contact_method and contact_method not in ['email', 'phone', 'sms', 'whatsapp']:
            errors['preferred_contact_method'] = 'Invalid contact method'
        
        if errors:
            raise ValidationError(errors)
        
        return data
    
    @staticmethod
    def validate_payment_plan(data):
        """Validate payment plan data"""
        errors = {}
        
        # Total installments validation
        try:
            installments = int(data.get('total_installments', 0))
            if installments < 2:
                errors['total_installments'] = 'Must have at least 2 installments'
            elif installments > 60:
                errors['total_installments'] = 'Cannot exceed 60 installments'
        except (ValueError, TypeError):
            errors['total_installments'] = 'Invalid installments count'
        
        # Installment amount validation
        try:
            amount = Decimal(str(data.get('installment_amount', 0)))
            if amount <= 0:
                errors['installment_amount'] = 'Installment amount must be greater than 0'
        except (InvalidOperation, ValueError):
            errors['installment_amount'] = 'Invalid installment amount format'
        
        # Frequency validation
        frequency = data.get('frequency')
        if frequency not in ['weekly', 'biweekly', 'monthly', 'quarterly']:
            errors['frequency'] = 'Invalid frequency'
        
        # Start date validation
        start_date = data.get('start_date')
        if not start_date:
            errors['start_date'] = 'Start date is required'
        else:
            try:
                if isinstance(start_date, str):
                    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                    data['start_date'] = start_date
                elif hasattr(start_date, 'date'):
                    start_date = start_date.date()
                    data['start_date'] = start_date
                if start_date < date.today():
                    errors['start_date'] = 'Start date cannot be in the past'
            except (ValueError, AttributeError):
                errors['start_date'] = 'Invalid start date format (use YYYY-MM-DD)'
        
        if errors:
            raise ValidationError(errors)
        
        return data
    
    @staticmethod
    def validate_transaction_template(data):
        """Validate transaction template data"""
        errors = {}
        
        # Name validation
        name = data.get('name') or ''
        if name:
            name = name.strip()
        if not name:
            errors['name'] = 'Template name is required'
        elif len(name) < 3:
            errors['name'] = 'Template name must be at least 3 characters'
        elif len(name) > 100:
            errors['name'] = 'Template name cannot exceed 100 characters'
        
        # Transaction type validation
        transaction_type = data.get('transaction_type')
        if not transaction_type:
            errors['transaction_type'] = 'Transaction type is required'
        elif transaction_type not in ['lend', 'borrow']:
            errors['transaction_type'] = 'Invalid transaction type'
        
        # Default amount validation (optional)
        default_amount = data.get('default_amount')
        if default_amount is not None:
            try:
                amount = Decimal(str(default_amount))
                if amount <= 0:
                    errors['default_amount'] = 'Default amount must be greater than 0'
            except (InvalidOperation, ValueError):
                errors['default_amount'] = 'Invalid default amount format'
        
        # Interest rate validation (optional)
        interest_rate = data.get('default_interest_rate')
        if interest_rate is not None:
            try:
                rate = Decimal(str(interest_rate))
                if rate < 0 or rate > 100:
                    errors['default_interest_rate'] = 'Interest rate must be between 0 and 100'
            except (InvalidOperation, ValueError):
                errors['default_interest_rate'] = 'Invalid interest rate format'
        
        if errors:
            raise ValidationError(errors)
        
        return data
    
    @staticmethod
    def validate_notification_rule(data):
        """Validate notification rule data"""
        errors = {}
        
        # Name validation
        name = data.get('name') or ''
        if name:
            name = name.strip()
        if not name:
            errors['name'] = 'Rule name is required'
        elif len(name) < 3:
            errors['name'] = 'Rule name must be at least 3 characters'
        
        # Trigger event validation
        trigger_event = data.get('trigger_event')
        valid_events = ['due_date_approaching', 'payment_overdue', 'payment_received', 'transaction_created']
        if not trigger_event:
            errors['trigger_event'] = 'Trigger event is required'
        elif trigger_event not in valid_events:
            errors['trigger_event'] = f'Invalid trigger event. Must be one of: {", ".join(valid_events)}'
        
        # Days before validation
        try:
            days_before = int(data.get('days_before', 3))
            if days_before < 0 or days_before > 365:
                errors['days_before'] = 'Days before must be between 0 and 365'
        except (ValueError, TypeError):
            errors['days_before'] = 'Invalid days before value'
        
        # Notification methods validation
        methods = data.get('notification_methods', [])
        if not isinstance(methods, list):
            errors['notification_methods'] = 'Notification methods must be a list'
        else:
            valid_methods = ['email', 'sms', 'push', 'whatsapp']
            invalid_methods = [m for m in methods if m not in valid_methods]
            if invalid_methods:
                errors['notification_methods'] = f'Invalid methods: {", ".join(invalid_methods)}'
        
        # Message template validation
        message_template = data.get('message_template') or ''
        if message_template:
            message_template = message_template.strip()
        if not message_template:
            errors['message_template'] = 'Message template is required'
        elif len(message_template) < 10:
            errors['message_template'] = 'Message template must be at least 10 characters'
        
        if errors:
            raise ValidationError(errors)
        
        return data
    
    @staticmethod
    def validate_document_upload(data, file_obj):
        """Validate document upload data"""
        errors = {}
        
        # Document type validation
        document_type = data.get('document_type')
        valid_types = ['agreement', 'receipt', 'contract', 'photo', 'other']
        if not document_type:
            errors['document_type'] = 'Document type is required'
        elif document_type not in valid_types:
            errors['document_type'] = f'Invalid document type. Must be one of: {", ".join(valid_types)}'
        
        # Title validation
        title = data.get('title') or ''
        if title:
            title = title.strip()
        if not title:
            errors['title'] = 'Document title is required'
        elif len(title) < 3:
            errors['title'] = 'Document title must be at least 3 characters'
        
        # File validation
        if not file_obj:
            errors['file'] = 'File is required'
        else:
            # File size validation (max 10MB)
            if file_obj.size > 10 * 1024 * 1024:
                errors['file'] = 'File size cannot exceed 10MB'
            
            # File type validation
            allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt']
            file_extension = file_obj.name.lower().split('.')[-1] if '.' in file_obj.name else ''
            if f'.{file_extension}' not in allowed_extensions:
                errors['file'] = f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'
        
        if errors:
            raise ValidationError(errors)
        
        return data