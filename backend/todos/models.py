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
