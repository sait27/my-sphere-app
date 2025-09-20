from rest_framework import serializers
from .models import (
    LendingTransaction, PaymentRecord, PaymentReminder, LendingCategory, 
    LendingAnalytics, ContactProfile, PaymentPlan, PaymentInstallment,
    TransactionTemplate, LendingDocument, NotificationRule
)

class LendingCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LendingCategory
        fields = ['id', 'name', 'color', 'icon', 'is_active', 'created_at']

class PaymentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentRecord
        fields = ['id', 'amount', 'payment_date', 'payment_method', 'notes', 'created_at']

class PaymentReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentReminder
        fields = ['id', 'reminder_date', 'message', 'reminder_type', 'is_sent', 'created_at']

class LendingTransactionSerializer(serializers.ModelSerializer):
    payments = PaymentRecordSerializer(many=True, read_only=True)
    reminders = PaymentReminderSerializer(many=True, read_only=True)
    custom_category = LendingCategorySerializer(read_only=True)
    total_with_interest = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    days_overdue = serializers.ReadOnlyField()

    class Meta:
        model = LendingTransaction
        fields = [
            'lending_id', 'display_id', 'transaction_type', 'person_name', 
            'person_contact', 'person_email', 'amount', 'interest_rate', 
            'interest_type', 'category', 'custom_category', 'priority',
            'transaction_date', 'due_date', 'date_completed', 'status',
            'description', 'notes', 'location', 'amount_paid', 'payment_method',
            'ai_confidence', 'ai_suggestions', 'is_verified', 'payments', 
            'reminders', 'total_with_interest', 'remaining_amount', 'is_overdue',
            'days_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'lending_id', 'display_id', 'created_at', 'updated_at']

class LendingAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LendingAnalytics
        fields = '__all__'

class ContactProfileSerializer(serializers.ModelSerializer):
    lending_history = serializers.SerializerMethodField()
    
    class Meta:
        model = ContactProfile
        fields = [
            'id', 'name', 'email', 'phone', 'relationship', 'reliability_score',
            'preferred_contact_method', 'notes', 'is_verified', 'created_at',
            'updated_at', 'lending_history'
        ]
        read_only_fields = ['reliability_score', 'created_at', 'updated_at']
    
    def get_lending_history(self, obj):
        from .services import ContactManagementService
        return ContactManagementService.get_contact_history(obj)

class PaymentInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInstallment
        fields = [
            'id', 'installment_number', 'due_date', 'amount', 'is_paid',
            'paid_date', 'paid_amount'
        ]

class PaymentPlanSerializer(serializers.ModelSerializer):
    installments = PaymentInstallmentSerializer(many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentPlan
        fields = [
            'id', 'total_installments', 'installment_amount', 'frequency',
            'start_date', 'auto_reminder', 'created_at', 'installments',
            'progress_percentage'
        ]
    
    def get_progress_percentage(self, obj):
        total = obj.installments.count()
        paid = obj.installments.filter(is_paid=True).count()
        return (paid / total * 100) if total > 0 else 0

class TransactionTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionTemplate
        fields = [
            'id', 'name', 'description', 'transaction_type', 'default_amount',
            'default_category', 'default_interest_rate', 'default_payment_method',
            'use_count', 'is_active', 'created_at'
        ]
        read_only_fields = ['use_count', 'created_at']

class LendingDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = LendingDocument
        fields = [
            'id', 'document_type', 'title', 'file', 'file_url', 'file_size',
            'uploaded_by', 'uploaded_at'
        ]
        read_only_fields = ['file_size', 'uploaded_by', 'uploaded_at']
    
    def get_file_url(self, obj):
        return obj.file.url if obj.file else None

class NotificationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationRule
        fields = [
            'id', 'name', 'trigger_event', 'days_before', 'notification_methods',
            'message_template', 'is_active', 'created_at'
        ]
        read_only_fields = ['created_at']

class EnhancedLendingTransactionSerializer(serializers.ModelSerializer):
    contact_profile = ContactProfileSerializer(read_only=True)
    payment_plan = PaymentPlanSerializer(read_only=True)
    documents = LendingDocumentSerializer(many=True, read_only=True)
    risk_assessment = serializers.SerializerMethodField()
    payments = PaymentRecordSerializer(many=True, read_only=True)
    reminders = PaymentReminderSerializer(many=True, read_only=True)
    custom_category = LendingCategorySerializer(read_only=True)
    
    class Meta:
        model = LendingTransaction
        fields = [
            'lending_id', 'display_id', 'transaction_type', 'person_name',
            'person_contact', 'person_email', 'amount', 'interest_rate',
            'interest_type', 'category', 'custom_category', 'priority',
            'transaction_date', 'due_date', 'date_completed', 'status',
            'description', 'notes', 'location', 'amount_paid', 'payment_method',
            'ai_confidence', 'ai_suggestions', 'is_verified', 'created_at',
            'updated_at', 'contact_profile', 'payment_plan', 'documents',
            'risk_assessment', 'payments', 'reminders', 'remaining_amount', 
            'total_with_interest', 'is_overdue', 'days_overdue'
        ]
        read_only_fields = [
            'lending_id', 'display_id', 'created_at', 'updated_at',
            'remaining_amount', 'total_with_interest', 'is_overdue', 'days_overdue'
        ]
    
    def get_risk_assessment(self, obj):
        from .services import RiskAssessmentService
        return RiskAssessmentService.calculate_transaction_risk(obj)