# expenses/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import shortuuid
import json

def generate_expense_id():
    # This now generates the all-caps version
    return f"EXP{shortuuid.random(length=22).upper()}"

class ExpenseCategory(models.Model):
    """Custom expense categories for users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    icon = models.CharField(max_length=50, default='circle')
    budget_limit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class ExpenseTag(models.Model):
    """Tags for expenses"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6B7280')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class Expense(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Credit/Debit Card'),
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer'),
        ('wallet', 'Digital Wallet'),
        ('other', 'Other')
    ]
    
    EXPENSE_TYPES = [
        ('personal', 'Personal'),
        ('business', 'Business'),
        ('shared', 'Shared'),
        ('reimbursable', 'Reimbursable')
    ]
    
    expense_id = models.CharField(
        max_length=25,
        primary_key=True,
        default=generate_expense_id,
        editable=False
    )
    display_id = models.IntegerField(editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Enhanced fields
    raw_text = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    custom_category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, blank=True)
    vendor = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    transaction_date = models.DateField()
    
    # New advanced fields
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPES, default='personal')
    location = models.CharField(max_length=200, blank=True, null=True)
    receipt_url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    tags = models.ManyToManyField(ExpenseTag, blank=True)
    
    # Financial tracking
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tip_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Recurring expenses
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly')
    ], blank=True, null=True)
    next_occurrence = models.DateField(null=True, blank=True)
    
    # AI and analytics
    ai_confidence = models.FloatField(default=0.0)
    ai_suggestions = models.JSONField(default=dict, blank=True)
    is_verified = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def total_amount(self):
        """Calculate total amount including tax and tip, minus discount"""
        return self.amount + self.tax_amount + self.tip_amount - self.discount_amount

    def __str__(self):
        return f"{self.user.username} - {self.expense_id} - ${self.amount}"

    # --- NEW LOGIC ---
    # We override the save method to calculate the display_id before saving.
    def save(self, *args, **kwargs):
        if not self.display_id:
            last_expense = Expense.objects.filter(user=self.user).order_by('-display_id').first()
            if last_expense:
                self.display_id = last_expense.display_id + 1
            else:
                self.display_id = 1
        self.full_clean()
        super().save(*args, **kwargs)
        
    def clean(self):
        from django.core.exceptions import ValidationError
        from django.utils.translation import gettext_lazy as _
        from decimal import Decimal
        import datetime
        
        # Validate amount is not negative
        if self.amount < Decimal('0'):
            raise ValidationError({
                'amount': _('Expense amount cannot be negative.')
            })
            
        # Validate tax_amount is not negative
        if self.tax_amount < Decimal('0'):
            raise ValidationError({
                'tax_amount': _('Tax amount cannot be negative.')
            })
            
        # Validate tip_amount is not negative
        if self.tip_amount < Decimal('0'):
            raise ValidationError({
                'tip_amount': _('Tip amount cannot be negative.')
            })
            
        # Validate discount_amount is not negative
        if self.discount_amount < Decimal('0'):
            raise ValidationError({
                'discount_amount': _('Discount amount cannot be negative.')
            })
            
        # Validate transaction_date is not in the future
        today = datetime.date.today()
        if self.transaction_date > today:
            raise ValidationError({
                'transaction_date': _('Transaction date cannot be in the future.')
            })
    
    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'transaction_date']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'vendor']),
        ]

class ExpenseAttachment(models.Model):
    """File attachments for expenses (receipts, invoices, etc.)"""
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='expense_attachments/')
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.expense.expense_id} - {self.filename}"

class ExpenseAnalytics(models.Model):
    """Cached analytics data for expenses"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.DateField()
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2)
    category_breakdown = models.JSONField(default=dict)
    vendor_breakdown = models.JSONField(default=dict)
    daily_spending = models.JSONField(default=dict)
    payment_method_breakdown = models.JSONField(default=dict)
    average_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    highest_expense = models.DecimalField(max_digits=10, decimal_places=2)
    most_frequent_category = models.CharField(max_length=100)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'month']
        ordering = ['-month']