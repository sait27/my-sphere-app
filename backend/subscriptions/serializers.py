from rest_framework import serializers
from .models import Subscription, SubscriptionCategory, SubscriptionPayment, SubscriptionUsage, SubscriptionAlert

class SubscriptionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionCategory
        fields = ['id', 'name', 'color', 'icon', 'created_at']
        read_only_fields = ['created_at']

class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = ['id', 'amount', 'payment_date', 'due_date', 'status', 'transaction_id', 'notes', 'created_at']
        read_only_fields = ['created_at']

class SubscriptionUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionUsage
        fields = ['id', 'usage_date', 'usage_count', 'usage_duration', 'usage_value', 'notes', 'created_at']
        read_only_fields = ['created_at']

class SubscriptionAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionAlert
        fields = ['id', 'alert_type', 'title', 'message', 'alert_date', 'is_read', 'is_dismissed', 'created_at']
        read_only_fields = ['created_at']

class SubscriptionSerializer(serializers.ModelSerializer):
    monthly_cost = serializers.ReadOnlyField()
    yearly_cost = serializers.ReadOnlyField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    payments = SubscriptionPaymentSerializer(many=True, read_only=True)
    usage_logs = SubscriptionUsageSerializer(many=True, read_only=True)
    alerts = SubscriptionAlertSerializer(many=True, read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'subscription_id', 'name', 'description', 'provider', 'category', 'category_name',
            'amount', 'currency', 'billing_cycle', 'custom_cycle_days',
            'start_date', 'next_billing_date', 'end_date',
            'status', 'payment_method', 'auto_renewal',
            'reminder_days', 'email_notifications',
            'website_url', 'notes', 'ai_insights', 'usage_tracking',
            'monthly_cost', 'yearly_cost',
            'payments', 'usage_logs', 'alerts',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['subscription_id', 'created_at', 'updated_at']

class SubscriptionCreateSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionCategory.objects.none(),
        required=False,
        allow_null=True
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            self.fields['category'].queryset = SubscriptionCategory.objects.filter(user=request.user)
    description = serializers.CharField(required=False, allow_blank=True)
    custom_cycle_days = serializers.IntegerField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    website_url = serializers.URLField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Subscription
        fields = [
            'name', 'description', 'provider', 'category',
            'amount', 'currency', 'billing_cycle', 'custom_cycle_days',
            'start_date', 'next_billing_date', 'end_date',
            'status', 'payment_method', 'auto_renewal',
            'reminder_days', 'email_notifications',
            'website_url', 'notes'
        ]
    
    def validate(self, data):
        if data.get('billing_cycle') == 'custom' and not data.get('custom_cycle_days'):
            raise serializers.ValidationError({
                'custom_cycle_days': 'Custom cycle days is required when billing cycle is custom.'
            })
        
        # Set defaults
        if 'currency' not in data:
            data['currency'] = 'INR'
        if 'status' not in data:
            data['status'] = 'active'
        if 'auto_renewal' not in data:
            data['auto_renewal'] = True
        if 'reminder_days' not in data:
            data['reminder_days'] = 3
        if 'email_notifications' not in data:
            data['email_notifications'] = True
            
        return data