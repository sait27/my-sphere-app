# expenses/serializers.py

from rest_framework import serializers
from .models import Expense, ExpenseCategory, ExpenseTag, ExpenseAttachment, ExpenseAnalytics

class ExpenseTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseTag
        fields = ['id', 'name', 'color', 'created_at']

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'color', 'icon', 'budget_limit', 'is_active', 'created_at']

class ExpenseAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseAttachment
        fields = ['id', 'file', 'filename', 'file_type', 'file_size', 'uploaded_at']

class ExpenseSerializer(serializers.ModelSerializer):
    tags = ExpenseTagSerializer(many=True, read_only=True)
    attachments = ExpenseAttachmentSerializer(many=True, read_only=True)
    custom_category = ExpenseCategorySerializer(read_only=True)
    total_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = Expense
        fields = [
            'expense_id', 'display_id', 'raw_text', 'amount', 'category', 
            'custom_category', 'vendor', 'description', 'transaction_date',
            'payment_method', 'expense_type', 'location', 'receipt_url', 
            'notes', 'tags', 'tax_amount', 'discount_amount', 'tip_amount',
            'is_recurring', 'recurring_frequency', 'next_occurrence',
            'ai_confidence', 'ai_suggestions', 'is_verified', 
            'attachments', 'total_amount', 'created_at', 'updated_at'
        ]

class ExpenseAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseAnalytics
        fields = '__all__'