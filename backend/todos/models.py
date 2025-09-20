from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json

class Goal(models.Model):
    """Long-term goals that can have multiple tasks"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    target_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ai_insights = models.TextField(blank=True)  # AI-generated insights and suggestions
    
    class Meta:
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"
    
    @property
    def progress_percentage(self):
        """Calculate completion percentage based on associated tasks"""
        total_tasks = self.tasks.count()
        if total_tasks == 0:
            return 0
        completed_tasks = self.tasks.filter(status='completed').count()
        return int((completed_tasks / total_tasks) * 100)

class Task(models.Model):
    """Individual tasks that can be part of goals or standalone"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    TASK_TYPES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
        ('health', 'Health'),
        ('finance', 'Finance'),
        ('learning', 'Learning'),
        ('social', 'Social'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    task_type = models.CharField(max_length=15, choices=TASK_TYPES, default='personal')
    
    # Time management
    estimated_duration = models.IntegerField(null=True, blank=True, help_text="Estimated duration in minutes")
    actual_duration = models.IntegerField(null=True, blank=True, help_text="Actual duration in minutes")
    due_date = models.DateTimeField(null=True, blank=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    
    # AI features
    ai_priority_score = models.FloatField(default=0.0)  # AI-calculated priority score
    ai_suggestions = models.TextField(blank=True)  # AI suggestions for the task
    ai_category = models.CharField(max_length=50, blank=True)  # AI-determined category
    
    # Integration with other modules
    related_expense_id = models.IntegerField(null=True, blank=True)  # Link to expense
    related_list_id = models.IntegerField(null=True, blank=True)  # Link to checklist
    calendar_event_id = models.CharField(max_length=255, null=True, blank=True)  # Google Calendar event ID
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-ai_priority_score', '-priority', 'due_date', '-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != 'completed':
            self.completed_at = None
        super().save(*args, **kwargs)

class TaskDependency(models.Model):
    """Define dependencies between tasks"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependencies')
    depends_on = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='dependents')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['task', 'depends_on']
    
    def __str__(self):
        return f"{self.task.title} depends on {self.depends_on.title}"

class TaskNote(models.Model):
    """Notes and updates for tasks"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='notes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.task.title}"

class TaskTemplate(models.Model):
    """Reusable task templates"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_templates')
    name = models.CharField(max_length=100)
    title_template = models.CharField(max_length=200)
    description_template = models.TextField(blank=True)
    default_priority = models.CharField(max_length=10, choices=Task.PRIORITY_CHOICES, default='medium')
    default_type = models.CharField(max_length=15, choices=Task.TASK_TYPES, default='personal')
    estimated_duration = models.IntegerField(null=True, blank=True)
    is_public = models.BooleanField(default=False)  # Allow sharing templates
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class TaskAttachment(models.Model):
    """File attachments for tasks"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='task_attachments/')
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Attachment {self.file_name} for {self.task.title}"

class TaskTag(models.Model):
    """Tags for categorizing and organizing tasks"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#64748b', help_text="Hex color code")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
    
    def __str__(self):
        return self.name

class TaskTagAssignment(models.Model):
    """Many-to-many relationship between tasks and tags"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='tag_assignments')
    tag = models.ForeignKey(TaskTag, on_delete=models.CASCADE, related_name='task_assignments')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['task', 'tag']
    
    def __str__(self):
        return f"{self.task.title} - {self.tag.name}"

class Subtask(models.Model):
    """Subtasks that belong to a parent task"""
    parent_task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)
    order = models.IntegerField(default=0, help_text="Order within parent task")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"Subtask: {self.title}"
    
    def save(self, *args, **kwargs):
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)

class TaskReminder(models.Model):
    """Reminders for tasks"""
    REMINDER_TYPES = [
        ('email', 'Email'),
        ('push', 'Push Notification'),
        ('sms', 'SMS'),
        ('popup', 'Popup'),
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=10, choices=REMINDER_TYPES, default='push')
    remind_at = models.DateTimeField()
    message = models.TextField(blank=True)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['remind_at']
    
    def __str__(self):
        return f"Reminder for {self.task.title} at {self.remind_at}"

class RecurringTaskTemplate(models.Model):
    """Templates for recurring tasks"""
    RECURRENCE_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
        ('custom', 'Custom'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recurring_templates')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Task.PRIORITY_CHOICES, default='medium')
    task_type = models.CharField(max_length=15, choices=Task.TASK_TYPES, default='personal')
    estimated_duration = models.IntegerField(null=True, blank=True)
    
    # Recurrence settings
    recurrence_type = models.CharField(max_length=10, choices=RECURRENCE_TYPES)
    recurrence_interval = models.IntegerField(default=1, help_text="Every X days/weeks/months")
    days_of_week = models.CharField(max_length=20, blank=True, help_text="Comma-separated days (0=Mon, 6=Sun)")
    day_of_month = models.IntegerField(null=True, blank=True, help_text="Day of month for monthly recurrence")
    
    # Schedule settings
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    max_occurrences = models.IntegerField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Recurring: {self.title} ({self.get_recurrence_type_display()})"

class TimeEntry(models.Model):
    """Time tracking entries for tasks"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    is_manual_entry = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"Time entry for {self.task.title}"
    
    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            self.duration_minutes = int(delta.total_seconds() / 60)
        super().save(*args, **kwargs)

class TaskComment(models.Model):
    """Comments on tasks for collaboration"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment on {self.task.title} by {self.user.username}"

class TaskAssignment(models.Model):
    """Task assignments for collaboration"""
    ASSIGNMENT_ROLES = [
        ('assignee', 'Assignee'),
        ('reviewer', 'Reviewer'),
        ('collaborator', 'Collaborator'),
        ('observer', 'Observer'),
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='assignments')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks_assigned')
    role = models.CharField(max_length=15, choices=ASSIGNMENT_ROLES, default='assignee')
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_accepted = models.BooleanField(default=False)
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['task', 'assigned_to']
    
    def __str__(self):
        return f"{self.task.title} assigned to {self.assigned_to.username}"

class TaskActivityLog(models.Model):
    """Activity log for task changes"""
    ACTION_TYPES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('status_changed', 'Status Changed'),
        ('priority_changed', 'Priority Changed'),
        ('assigned', 'Assigned'),
        ('commented', 'Commented'),
        ('attachment_added', 'Attachment Added'),
        ('attachment_removed', 'Attachment Removed'),
        ('tag_added', 'Tag Added'),
        ('tag_removed', 'Tag Removed'),
        ('subtask_added', 'Subtask Added'),
        ('subtask_completed', 'Subtask Completed'),
        ('time_logged', 'Time Logged'),
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activity_log')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField()
    metadata = models.TextField(blank=True, help_text="JSON data for additional context")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.task.title}"

class TaskCustomField(models.Model):
    """Custom fields for tasks"""
    FIELD_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('datetime', 'DateTime'),
        ('boolean', 'Boolean'),
        ('select', 'Select'),
        ('multi_select', 'Multi Select'),
        ('url', 'URL'),
        ('email', 'Email'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_fields')
    name = models.CharField(max_length=100)
    field_type = models.CharField(max_length=15, choices=FIELD_TYPES)
    options = models.TextField(blank=True, help_text="JSON array of options for select fields")
    is_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_field_type_display()})"

class TaskCustomFieldValue(models.Model):
    """Values for custom fields on tasks"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='custom_field_values')
    custom_field = models.ForeignKey(TaskCustomField, on_delete=models.CASCADE)
    value = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['task', 'custom_field']
    
    def __str__(self):
        return f"{self.custom_field.name}: {self.value}"

class AIInsight(models.Model):
    """Store AI-generated insights and recommendations"""
    INSIGHT_TYPES = [
        ('productivity', 'Productivity'),
        ('priority', 'Priority Suggestion'),
        ('scheduling', 'Scheduling'),
        ('goal_progress', 'Goal Progress'),
        ('habit', 'Habit Formation'),
        ('integration', 'Cross-module Integration'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_insights')
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    confidence_score = models.FloatField(default=0.0)  # AI confidence in the insight
    is_actionable = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    related_task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True)
    related_goal = models.ForeignKey(Goal, on_delete=models.CASCADE, null=True, blank=True)
    metadata = models.TextField(blank=True)  # JSON data for additional context
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-confidence_score', '-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_insight_type_display()})"
