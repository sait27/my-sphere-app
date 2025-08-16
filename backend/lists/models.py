# lists/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import shortuuid
import json

# --- List Model ---
def generate_list_id():
    """Generates a unique, prefixed ID for a List."""
    return f"LST{shortuuid.random(length=22).upper()}"

def generate_list_item_id():
    """Generates a unique, prefixed ID for a ListItem."""
    return f"ITM{shortuuid.random(length=22).upper()}"

class ListTemplate(models.Model):
    """Reusable list templates"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50, default='general')
    is_public = models.BooleanField(default=False)
    use_count = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"

class ListCategory(models.Model):
    """Custom categories for lists"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#3B82F6')
    icon = models.CharField(max_length=50, default='list')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class List(models.Model):
    LIST_TYPES = [
        ('checklist', 'Checklist'),
        ('shopping', 'Shopping List'),
        ('todo', 'To-Do List'),
        ('inventory', 'Inventory'),
        ('wishlist', 'Wishlist'),
        ('recipe', 'Recipe'),
        ('packing', 'Packing List'),
        ('other', 'Other')
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent')
    ]
    
    id = models.CharField(
        max_length=25,
        primary_key=True,
        default=generate_list_id,
        editable=False
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lists')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    list_type = models.CharField(max_length=20, choices=LIST_TYPES, default='checklist')
    category = models.ForeignKey(ListCategory, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    
    # Advanced features
    is_shared = models.BooleanField(default=False)
    shared_with = models.ManyToManyField(User, through='ListShare', through_fields=('list', 'user'), related_name='shared_lists')
    template = models.ForeignKey(ListTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Smart features
    auto_sort = models.BooleanField(default=False)
    sort_by = models.CharField(max_length=20, choices=[
        ('name', 'Name'),
        ('priority', 'Priority'),
        ('created', 'Created Date'),
        ('price', 'Price'),
        ('quantity', 'Quantity')
    ], default='created')
    
    # Completion tracking
    due_date = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    completion_percentage = models.FloatField(default=0.0)
    
    # AI and analytics
    ai_suggestions = models.JSONField(default=dict, blank=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def update_completion_percentage(self):
        """Update completion percentage based on completed items."""
        total_items = self.items.count()
        if total_items == 0:
            percentage = 0.0
        else:
            completed_items = self.items.filter(is_completed=True).count()
            percentage = (completed_items / total_items) * 100
        
        # Update the field directly in the database to avoid recursion
        List.objects.filter(pk=self.pk).update(completion_percentage=percentage)

    def calculate_total_cost(self):
        """Calculate total cost of all items"""
        total = self.items.filter(price__isnull=False).aggregate(
            total=models.Sum('price')
        )['total'] or 0
        return total

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'list_type']),
            models.Index(fields=['user', 'is_archived']),
        ]

class ListShare(models.Model):
    """Sharing permissions for lists"""
    PERMISSION_LEVELS = [
        ('view', 'View Only'),
        ('edit', 'Edit Items'),
        ('admin', 'Full Access')
    ]
    
    list = models.ForeignKey(List, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission_level = models.CharField(max_length=10, choices=PERMISSION_LEVELS, default='view')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_lists_created')
    shared_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['list', 'user']

class ListItem(models.Model):
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent')
    ]
    
    id = models.CharField(
        max_length=25,
        primary_key=True,
        default=generate_list_item_id,
        editable=False
    )
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    quantity = models.CharField(max_length=50, blank=True, null=True)
    unit = models.CharField(max_length=20, blank=True, null=True)  # kg, lbs, pieces, etc.
    
    # Enhanced fields
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    category = models.CharField(max_length=50, blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estimated_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Status tracking
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    
    # Smart features
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly')
    ], blank=True, null=True)
    
    # AI and suggestions
    ai_suggestions = models.JSONField(default=dict, blank=True)
    auto_added = models.BooleanField(default=False)  # Added by AI suggestions
    
    # Ordering
    order = models.IntegerField(default=0)
    
    # Metadata
    notes = models.TextField(blank=True, null=True)
    url = models.URLField(blank=True, null=True)  # Product URL
    image_url = models.URLField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)
        # Update parent list completion percentage
        self.list.update_completion_percentage()

    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['list', 'is_completed']),
            models.Index(fields=['list', 'priority']),
        ]

class ListActivity(models.Model):
    """Track activities on lists"""
    ACTION_TYPES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('item_added', 'Item Added'),
        ('item_completed', 'Item Completed'),
        ('item_removed', 'Item Removed'),
        ('shared', 'Shared'),
        ('archived', 'Archived')
    ]
    
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

class ListAnalytics(models.Model):
    """Analytics data for lists"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.DateField()
    total_lists = models.IntegerField(default=0)
    completed_lists = models.IntegerField(default=0)
    total_items = models.IntegerField(default=0)
    completed_items = models.IntegerField(default=0)
    average_completion_time = models.DurationField(null=True, blank=True)
    most_used_category = models.CharField(max_length=50, blank=True, null=True)
    productivity_score = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'month']
        ordering = ['-month']