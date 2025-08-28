from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import shortuuid

def generate_subscription_id():
    return f"SUB{shortuuid.random(length=22).upper()}"

class SubscriptionCategory(models.Model):
    """Categories for subscriptions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#3B82F6')
    icon = models.CharField(max_length=50, default='circle')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class Subscription(models.Model):
    BILLING_CYCLES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
        ('custom', 'Custom'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    PAYMENT_METHODS = [
        ('card', 'Credit/Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('other', 'Other'),
    ]
    
    subscription_id = models.CharField(
        max_length=25,
        primary_key=True,
        default=generate_subscription_id,
        editable=False
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Basic Info
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    provider = models.CharField(max_length=100)
    category = models.ForeignKey(SubscriptionCategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Financial Details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLES)
    custom_cycle_days = models.IntegerField(null=True, blank=True)
    
    # Dates
    start_date = models.DateField()
    next_billing_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Status & Payment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    auto_renewal = models.BooleanField(default=True)
    
    # Notifications
    reminder_days = models.IntegerField(default=3)
    email_notifications = models.BooleanField(default=True)
    
    # Additional Info
    website_url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # AI & Analytics
    ai_insights = models.JSONField(default=dict, blank=True)
    usage_tracking = models.JSONField(default=dict, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def monthly_cost(self):
        """Convert any billing cycle to monthly cost"""
        if self.billing_cycle == 'weekly':
            return self.amount * Decimal('4.33')
        elif self.billing_cycle == 'monthly':
            return self.amount
        elif self.billing_cycle == 'quarterly':
            return self.amount / Decimal('3')
        elif self.billing_cycle == 'yearly':
            return self.amount / Decimal('12')
        elif self.billing_cycle == 'custom' and self.custom_cycle_days:
            return self.amount * Decimal('30') / Decimal(str(self.custom_cycle_days))
        return self.amount
    
    @property
    def yearly_cost(self):
        """Calculate yearly cost"""
        return self.monthly_cost * Decimal('12')
    
    def __str__(self):
        return f"{self.name} - ${self.amount}/{self.billing_cycle}"
    
    class Meta:
        ordering = ['-created_at']

class SubscriptionPayment(models.Model):
    """Track subscription payments"""
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ])
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-payment_date']

class SubscriptionUsage(models.Model):
    """Track subscription usage for AI insights"""
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='usage_logs')
    usage_date = models.DateField()
    usage_count = models.IntegerField(default=0)
    usage_duration = models.DurationField(null=True, blank=True)
    usage_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-usage_date']

class SubscriptionAlert(models.Model):
    """Subscription alerts and notifications"""
    ALERT_TYPES = [
        ('payment_due', 'Payment Due'),
        ('price_increase', 'Price Increase'),
        ('renewal_reminder', 'Renewal Reminder'),
        ('usage_limit', 'Usage Limit'),
        ('cancellation_reminder', 'Cancellation Reminder'),
    ]
    
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    alert_date = models.DateTimeField()
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-alert_date']