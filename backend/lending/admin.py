from django.contrib import admin
from .models import LendingTransaction, PaymentRecord, PaymentReminder, LendingCategory, LendingAnalytics

@admin.register(LendingTransaction)
class LendingTransactionAdmin(admin.ModelAdmin):
    list_display = ['person_name', 'transaction_type', 'amount', 'status', 'due_date', 'created_at']
    list_filter = ['transaction_type', 'status', 'created_at', 'priority']
    search_fields = ['person_name', 'description', 'lending_id']
    readonly_fields = ['lending_id', 'display_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('lending_id', 'display_id', 'transaction_type', 'person_name', 'person_contact', 'person_email')
        }),
        ('Financial Details', {
            'fields': ('amount', 'interest_rate', 'interest_type', 'amount_paid', 'payment_method')
        }),
        ('Categorization', {
            'fields': ('category', 'custom_category', 'priority')
        }),
        ('Dates & Status', {
            'fields': ('transaction_date', 'due_date', 'status', 'date_completed')
        }),
        ('Additional Information', {
            'fields': ('description', 'notes', 'location')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'is_verified', 'ai_confidence'),
            'classes': ('collapse',)
        })
    )

@admin.register(LendingCategory)
class LendingCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'user__username']

@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = ['transaction', 'amount', 'payment_date', 'payment_method']
    list_filter = ['payment_date', 'payment_method']
    search_fields = ['transaction__person_name', 'notes']

@admin.register(PaymentReminder)
class PaymentReminderAdmin(admin.ModelAdmin):
    list_display = ['transaction', 'reminder_date', 'reminder_type', 'is_sent']
    list_filter = ['is_sent', 'reminder_type', 'reminder_date']
    search_fields = ['transaction__person_name', 'message']

@admin.register(LendingAnalytics)
class LendingAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['user', 'month', 'total_lent', 'total_borrowed', 'overdue_count']
    list_filter = ['month', 'updated_at']
    readonly_fields = ['updated_at']