from django.contrib import admin
from .models import Subscription, SubscriptionCategory, SubscriptionPayment, SubscriptionUsage, SubscriptionAlert

@admin.register(SubscriptionCategory)
class SubscriptionCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'user__username']

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'provider', 'amount', 'billing_cycle', 'status', 'next_billing_date']
    list_filter = ['status', 'billing_cycle', 'created_at']
    search_fields = ['name', 'provider', 'user__username']
    readonly_fields = ['subscription_id', 'monthly_cost', 'yearly_cost']

@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'amount', 'payment_date', 'status']
    list_filter = ['status', 'payment_date']
    search_fields = ['subscription__name', 'transaction_id']

@admin.register(SubscriptionUsage)
class SubscriptionUsageAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'usage_date', 'usage_count', 'usage_duration']
    list_filter = ['usage_date']
    search_fields = ['subscription__name']

@admin.register(SubscriptionAlert)
class SubscriptionAlertAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'alert_type', 'title', 'alert_date', 'is_read']
    list_filter = ['alert_type', 'is_read', 'alert_date']
    search_fields = ['title', 'subscription__name']