from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
import shortuuid
from datetime import date

def generate_lending_id():
    return f"LND{shortuuid.random(length=22).upper()}"

def get_current_date():
    return timezone.now().date()

class LendingCategory(models.Model):
    """Categories for lending transactions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#3B82F6')
    icon = models.CharField(max_length=50, default='handshake')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class LendingTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('lend', 'Lend'),
        ('borrow', 'Borrow'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
        ('partial', 'Partially Paid'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Core fields
    lending_id = models.CharField(
        max_length=25,
        primary_key=True,
        default=generate_lending_id,
        editable=False
    )
    display_id = models.IntegerField(editable=False, default=1)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Transaction details
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    person_name = models.CharField(max_length=100)
    person_contact = models.CharField(max_length=100, blank=True)
    person_email = models.EmailField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    
    # Financial details
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(Decimal('0'))])
    interest_type = models.CharField(max_length=20, choices=[
        ('simple', 'Simple Interest'),
        ('compound', 'Compound Interest'),
        ('flat', 'Flat Rate')
    ], default='simple')
    
    # Categorization
    category = models.CharField(max_length=100, default='Personal')
    custom_category = models.ForeignKey(LendingCategory, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Dates and status
    transaction_date = models.DateField(default=get_current_date)
    due_date = models.DateField(null=True, blank=True)
    date_completed = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    
    # Additional info
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    
    # Payment tracking
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=50, blank=True)
    
    # AI and analytics
    ai_confidence = models.FloatField(default=0.0)
    ai_suggestions = models.JSONField(default=dict, blank=True)
    is_verified = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'transaction_date']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'transaction_type']),
        ]

    def __str__(self):
        return f"{self.get_transaction_type_display()} ${self.amount} - {self.person_name}"

    def save(self, *args, **kwargs):
        if not self.display_id or self.display_id == 1:
            last_transaction = LendingTransaction.objects.filter(user=self.user).order_by('-display_id').first()
            if last_transaction and last_transaction.display_id:
                self.display_id = int(last_transaction.display_id) + 1
            else:
                self.display_id = 1
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        return self.due_date and self.due_date < timezone.now().date() and self.status == 'active'

    @property
    def remaining_amount(self):
        return self.amount - Decimal(str(self.amount_paid))

    @property
    def total_with_interest(self):
        if self.interest_rate > 0:
            if self.interest_type == 'simple':
                days = (timezone.now().date() - self.transaction_date).days
                return self.amount * (1 + (self.interest_rate / 100) * (days / 365))
            elif self.interest_type == 'compound':
                days = (timezone.now().date() - self.transaction_date).days
                return self.amount * ((1 + self.interest_rate / 100) ** (days / 365))
            else:  # flat
                return self.amount * (1 + self.interest_rate / 100)
        return self.amount

    @property
    def days_overdue(self):
        if self.is_overdue:
            return (timezone.now().date() - self.due_date).days
        return 0
    
    @property
    def contact_profile(self):
        """Get associated contact profile"""
        try:
            return ContactProfile.objects.get(user=self.user, name=self.person_name)
        except ContactProfile.DoesNotExist:
            return None

class PaymentRecord(models.Model):
    """Track partial payments for lending transactions"""
    transaction = models.ForeignKey(LendingTransaction, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(default=get_current_date)
    payment_method = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-payment_date']

class PaymentReminder(models.Model):
    """Reminders for lending transactions"""
    transaction = models.ForeignKey(LendingTransaction, on_delete=models.CASCADE, related_name='reminders')
    reminder_date = models.DateTimeField()
    message = models.TextField()
    reminder_type = models.CharField(max_length=20, choices=[
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('notification', 'In-App Notification')
    ], default='notification')
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-reminder_date']

class LendingAnalytics(models.Model):
    """Cached analytics data for lending"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.DateField()
    total_lent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_borrowed = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    active_lends = models.IntegerField(default=0)
    active_borrows = models.IntegerField(default=0)
    overdue_count = models.IntegerField(default=0)
    category_breakdown = models.JSONField(default=dict)
    person_breakdown = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'month']
        ordering = ['-month']

class ContactProfile(models.Model):
    """Enhanced contact management for lending"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    relationship = models.CharField(max_length=50, choices=[
        ('family', 'Family'),
        ('friend', 'Friend'),
        ('colleague', 'Colleague'),
        ('business', 'Business'),
        ('other', 'Other')
    ], default='other')
    reliability_score = models.FloatField(default=5.0)  # 1-10 scale
    preferred_contact_method = models.CharField(max_length=20, choices=[
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('sms', 'SMS'),
        ('whatsapp', 'WhatsApp')
    ], default='email')
    notes = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class PaymentPlan(models.Model):
    """Structured payment schedules"""
    transaction = models.OneToOneField(LendingTransaction, on_delete=models.CASCADE, related_name='payment_plan')
    total_installments = models.IntegerField()
    installment_amount = models.DecimalField(max_digits=10, decimal_places=2)
    frequency = models.CharField(max_length=20, choices=[
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly')
    ], default='monthly')
    start_date = models.DateField()
    auto_reminder = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Payment plan for {self.transaction.lending_id}"

class PaymentInstallment(models.Model):
    """Individual installments in a payment plan"""
    payment_plan = models.ForeignKey(PaymentPlan, on_delete=models.CASCADE, related_name='installments')
    installment_number = models.IntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        ordering = ['installment_number']
        unique_together = ['payment_plan', 'installment_number']

class TransactionTemplate(models.Model):
    """Reusable transaction templates"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    transaction_type = models.CharField(max_length=10, choices=LendingTransaction.TRANSACTION_TYPES)
    default_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    default_category = models.CharField(max_length=100, blank=True)
    default_interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    default_payment_method = models.CharField(max_length=50, blank=True)
    use_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-use_count', 'name']

class LendingDocument(models.Model):
    """Document management for transactions"""
    transaction = models.ForeignKey(LendingTransaction, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=[
        ('agreement', 'Agreement'),
        ('receipt', 'Receipt'),
        ('contract', 'Contract'),
        ('photo', 'Photo'),
        ('other', 'Other')
    ])
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='lending_documents/')
    file_size = models.IntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction.lending_id} - {self.title}"

class NotificationRule(models.Model):
    """Custom notification rules"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    trigger_event = models.CharField(max_length=50, choices=[
        ('due_date_approaching', 'Due Date Approaching'),
        ('payment_overdue', 'Payment Overdue'),
        ('payment_received', 'Payment Received'),
        ('transaction_created', 'Transaction Created')
    ])
    days_before = models.IntegerField(default=3)
    notification_methods = models.JSONField(default=list)  # ['email', 'sms']
    message_template = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class LendingAIInsight(models.Model):
    """AI insights for lending behavior"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='lending_ai_insight')
    insights_data = models.JSONField()
    risk_score = models.FloatField(default=0.0)
    generated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lending AI Insight for {self.user.username} at {self.generated_at}"