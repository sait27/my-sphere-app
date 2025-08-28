# lists/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    List, ListItem, ListTemplate, ListCategory, 
    ListActivity
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

# Sharing functionality removed

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
    recent_activities = ListActivitySerializer(source='activities', many=True, read_only=True)
    
    # Allow category to be sent as string and convert to foreign key
    category = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Computed fields
    items_count = serializers.SerializerMethodField()
    completed_items_count = serializers.SerializerMethodField()
    pending_items_count = serializers.SerializerMethodField()
    total_estimated_cost = serializers.SerializerMethodField()
    total_actual_cost = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    
    class Meta:
        model = List
        fields = [
            'id', 'name', 'description', 'list_type', 'category', 'category_details',
            'priority', 'template', 'template_details', 'auto_sort',
            'sort_by', 'due_date', 'is_archived', 'completion_percentage',
            'ai_suggestions', 'estimated_cost', 'actual_cost', 'budget', 'created_at',
            'updated_at', 'items', 'recent_activities',
            'items_count', 'completed_items_count', 'pending_items_count',
            'total_estimated_cost', 'total_actual_cost', 'category_name', 'is_favorite'
        ]
        read_only_fields = [
            'id', 'completion_percentage', 'created_at', 'updated_at',
            'items', 'recent_activities', 'items_count',
            'completed_items_count', 'pending_items_count', 'total_estimated_cost',
            'total_actual_cost', 'category_name', 'is_favorite'
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
    
    def get_category_name(self, obj):
        return obj.category.name if obj.category else None
    
    def get_is_favorite(self, obj):
        return False  # Placeholder for future favorites feature
    
    def create(self, validated_data):
        # Handle category string conversion
        category_name = validated_data.pop('category', None)
        category_obj = None
        
        if category_name:
            # Try to get or create the category for this user
            category_obj, created = ListCategory.objects.get_or_create(
                user=self.context['request'].user,
                name=category_name,
                defaults={'color': '#3B82F6', 'icon': 'list'}
            )
        
        # Create the list with the category object
        list_obj = List.objects.create(
            category=category_obj,
            **validated_data
        )
        return list_obj
    
    def update(self, instance, validated_data):
        # Handle category string conversion for updates
        category_name = validated_data.pop('category', None)
        
        if category_name is not None:
            if category_name:
                category_obj, created = ListCategory.objects.get_or_create(
                    user=self.context['request'].user,
                    name=category_name,
                    defaults={'color': '#3B82F6', 'icon': 'list'}
                )
                instance.category = category_obj
            else:
                instance.category = None
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

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
            'is_archived', 'due_date', 'created_at', 'updated_at',
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

# Sharing functionality removed

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