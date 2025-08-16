# lists/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    List, ListItem, ListTemplate, ListCategory, 
    ListShare, ListActivity
)

class ListCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ListCategory
        fields = ['id', 'name', 'color', 'icon', 'created_at']
        read_only_fields = ['id', 'created_at']

class ListItemSerializer(serializers.ModelSerializer):
    completed_by_name = serializers.CharField(source='completed_by.username', read_only=True)
    
    class Meta:
        model = ListItem
        fields = [
            'id', 'name', 'description', 'quantity', 'unit', 'priority',
            'category', 'brand', 'price', 'estimated_price', 'is_completed',
            'completed_at', 'completed_by', 'completed_by_name', 'is_recurring',
            'recurring_frequency', 'order', 'notes', 'url', 'image_url',
            'auto_added', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'completed_at', 'completed_by', 'completed_by_name', 'created_at', 'updated_at']

class ListTemplateSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ListTemplate
        fields = [
            'id', 'name', 'description', 'category', 'is_public',
            'use_count', 'user', 'user_name', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'user_name', 'use_count', 'created_at']

class ListShareSerializer(serializers.ModelSerializer):
    shared_with_name = serializers.CharField(source='user.username', read_only=True)
    shared_with_email = serializers.CharField(source='user.email', read_only=True)
    shared_by_name = serializers.CharField(source='shared_by.username', read_only=True)
    
    class Meta:
        model = ListShare
        fields = [
            'id', 'user', 'shared_with_name', 'shared_with_email',
            'permission_level', 'shared_by', 'shared_by_name', 'shared_at'
        ]
        read_only_fields = ['id', 'shared_with_name', 'shared_with_email', 'shared_by_name', 'shared_at']

class ListActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ListActivity
        fields = [
            'id', 'action', 'description', 'metadata',
            'user', 'user_name', 'created_at'
        ]
        read_only_fields = ['id', 'user_name', 'created_at']

class ListSerializer(serializers.ModelSerializer):
    items = ListItemSerializer(many=True, read_only=True)
    category_details = ListCategorySerializer(source='category', read_only=True)
    template_details = ListTemplateSerializer(source='template', read_only=True)
    shared_users = ListShareSerializer(source='listshare_set', many=True, read_only=True)
    recent_activities = ListActivitySerializer(source='activities', many=True, read_only=True)
    
    # Computed fields
    items_count = serializers.SerializerMethodField()
    completed_items_count = serializers.SerializerMethodField()
    pending_items_count = serializers.SerializerMethodField()
    total_estimated_cost = serializers.SerializerMethodField()
    total_actual_cost = serializers.SerializerMethodField()
    
    class Meta:
        model = List
        fields = [
            'id', 'name', 'description', 'list_type', 'category', 'category_details',
            'priority', 'is_shared', 'template', 'template_details', 'auto_sort',
            'sort_by', 'due_date', 'is_archived', 'completion_percentage',
            'ai_suggestions', 'estimated_cost', 'actual_cost', 'created_at',
            'updated_at', 'items', 'shared_users', 'recent_activities',
            'items_count', 'completed_items_count', 'pending_items_count',
            'total_estimated_cost', 'total_actual_cost'
        ]
        read_only_fields = [
            'id', 'completion_percentage', 'created_at', 'updated_at',
            'items', 'shared_users', 'recent_activities', 'items_count',
            'completed_items_count', 'pending_items_count', 'total_estimated_cost',
            'total_actual_cost'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_completed_items_count(self, obj):
        return obj.items.filter(is_completed=True).count()
    
    def get_pending_items_count(self, obj):
        return obj.items.filter(is_completed=False).count()
    
    def get_total_estimated_cost(self, obj):
        from django.db.models import Sum
        total = obj.items.filter(estimated_price__isnull=False).aggregate(
            total=Sum('estimated_price')
        )['total']
        return float(total) if total else 0.0
    
    def get_total_actual_cost(self, obj):
        from django.db.models import Sum
        total = obj.items.filter(price__isnull=False).aggregate(
            total=Sum('price')
        )['total']
        return float(total) if total else 0.0

# Simplified serializers for list views
class ListSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for list summaries"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    items_count = serializers.SerializerMethodField()
    completed_items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = List
        fields = [
            'id', 'name', 'list_type', 'priority', 'completion_percentage',
            'is_shared', 'is_archived', 'due_date', 'created_at', 'updated_at',
            'category_name', 'category_color', 'items_count', 'completed_items_count'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_completed_items_count(self, obj):
        return obj.items.filter(is_completed=True).count()

class BulkOperationSerializer(serializers.Serializer):
    """Serializer for bulk operations"""
    operation = serializers.ChoiceField(choices=[
        'bulk_complete_items', 'bulk_delete_items', 'bulk_categorize_items',
        'duplicate_list', 'archive_lists', 'bulk_update_priority'
    ])
    item_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    list_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    category = serializers.CharField(required=False)
    priority = serializers.ChoiceField(
        choices=[choice[0] for choice in ListItem.PRIORITY_LEVELS],
        required=False
    )
    completed = serializers.BooleanField(required=False, default=True)
    new_name = serializers.CharField(required=False)

class SmartAddSerializer(serializers.Serializer):
    """Serializer for AI-powered item addition"""
    text = serializers.CharField(max_length=1000)
    context = serializers.CharField(max_length=200, required=False)
    auto_categorize = serializers.BooleanField(default=True)
    estimate_prices = serializers.BooleanField(default=True)

class ListAnalyticsSerializer(serializers.Serializer):
    """Serializer for analytics requests"""
    period = serializers.ChoiceField(
        choices=['week', 'month', 'quarter', 'year'],
        default='month'
    )
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)
    metrics = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    include_archived = serializers.BooleanField(default=False)

class ListSharingSerializer(serializers.Serializer):
    """Serializer for list sharing"""
    recipient_email = serializers.EmailField(required=False)
    recipient_id = serializers.IntegerField(required=False)
    permission_level = serializers.ChoiceField(
        choices=[choice[0] for choice in ListShare.PERMISSION_LEVELS]
    )
    message = serializers.CharField(max_length=500, required=False)

class ListExportSerializer(serializers.Serializer):
    """Serializer for list export"""
    list_ids = serializers.ListField(
        child=serializers.CharField()
    )
    format = serializers.ChoiceField(
        choices=['csv', 'json', 'pdf'],
        default='csv'
    )
    include_completed = serializers.BooleanField(default=True)
    include_notes = serializers.BooleanField(default=True)
    include_prices = serializers.BooleanField(default=True)