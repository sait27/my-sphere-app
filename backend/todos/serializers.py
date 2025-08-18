from rest_framework import serializers
from .models import (
    Goal, Task, TaskDependency, TaskNote, TaskTemplate, AIInsight, TaskAttachment,
    TaskTag, TaskTagAssignment, Subtask, TaskReminder, RecurringTaskTemplate,
    TimeEntry, TaskComment, TaskAssignment, TaskActivityLog, TaskCustomField,
    TaskCustomFieldValue
)
from django.contrib.auth.models import User

class GoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Goal
        fields = ['id', 'title', 'description', 'priority', 'status', 'target_date', 
                 'created_at', 'updated_at', 'ai_insights', 'progress_percentage', 'task_count']
        read_only_fields = ['created_at', 'updated_at', 'progress_percentage']
    
    def get_task_count(self, obj):
        return obj.tasks.count()

class TaskNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskNote
        fields = ['id', 'content', 'is_ai_generated', 'created_at']
        read_only_fields = ['created_at']

class TaskAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskAttachment
        fields = ['id', 'file', 'file_name', 'file_size', 'file_type', 'created_at']
        read_only_fields = ['created_at']

class TaskDependencySerializer(serializers.ModelSerializer):
    depends_on_title = serializers.CharField(source='depends_on.title', read_only=True)
    
    class Meta:
        model = TaskDependency
        fields = ['id', 'depends_on', 'depends_on_title', 'created_at']
        read_only_fields = ['created_at']

class TaskTagSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskTag
        fields = ['id', 'name', 'color', 'created_at', 'task_count']
        read_only_fields = ['created_at']
    
    def get_task_count(self, obj):
        return obj.task_assignments.count()

class TaskTagAssignmentSerializer(serializers.ModelSerializer):
    tag_name = serializers.CharField(source='tag.name', read_only=True)
    tag_color = serializers.CharField(source='tag.color', read_only=True)
    
    class Meta:
        model = TaskTagAssignment
        fields = ['id', 'tag', 'tag_name', 'tag_color', 'created_at']
        read_only_fields = ['created_at']

class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ['id', 'title', 'description', 'is_completed', 'order', 
                 'created_at', 'updated_at', 'completed_at']
        read_only_fields = ['created_at', 'updated_at', 'completed_at']

class TaskReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskReminder
        fields = ['id', 'reminder_type', 'remind_at', 'message', 'is_sent', 
                 'sent_at', 'is_active', 'created_at']
        read_only_fields = ['created_at', 'is_sent', 'sent_at']

class TimeEntrySerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    duration_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = TimeEntry
        fields = ['id', 'task', 'task_title', 'start_time', 'end_time', 
                 'duration_minutes', 'duration_hours', 'description', 
                 'is_manual_entry', 'created_at']
        read_only_fields = ['created_at', 'duration_minutes']
    
    def get_duration_hours(self, obj):
        if obj.duration_minutes:
            return round(obj.duration_minutes / 60, 2)
        return None

class TaskCommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskComment
        fields = ['id', 'content', 'user_username', 'parent_comment', 
                 'replies', 'is_edited', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'is_edited']
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return TaskCommentSerializer(obj.replies.all(), many=True).data
        return []

class TaskAssignmentSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)
    
    class Meta:
        model = TaskAssignment
        fields = ['id', 'assigned_to', 'assigned_to_username', 'assigned_by',
                 'assigned_by_username', 'role', 'assigned_at', 'is_accepted',
                 'accepted_at']
        read_only_fields = ['assigned_at', 'assigned_by']

class TaskCustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskCustomField
        fields = ['id', 'name', 'field_type', 'options', 'is_required', 
                 'is_active', 'order', 'created_at']
        read_only_fields = ['created_at']

class TaskCustomFieldValueSerializer(serializers.ModelSerializer):
    field_name = serializers.CharField(source='custom_field.name', read_only=True)
    field_type = serializers.CharField(source='custom_field.field_type', read_only=True)
    
    class Meta:
        model = TaskCustomFieldValue
        fields = ['id', 'custom_field', 'field_name', 'field_type', 'value', 
                 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class TaskSerializer(serializers.ModelSerializer):
    goal_title = serializers.CharField(source='goal.title', read_only=True)
    notes = TaskNoteSerializer(many=True, read_only=True)
    dependencies = TaskDependencySerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    tag_assignments = TaskTagAssignmentSerializer(many=True, read_only=True)
    subtasks = SubtaskSerializer(many=True, read_only=True)
    reminders = TaskReminderSerializer(many=True, read_only=True)
    time_entries = TimeEntrySerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    assignments = TaskAssignmentSerializer(many=True, read_only=True)
    custom_field_values = TaskCustomFieldValueSerializer(many=True, read_only=True)
    is_overdue = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    total_time_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = ['id', 'goal', 'goal_title', 'title', 'description', 'priority', 'status', 
                 'task_type', 'estimated_duration', 'actual_duration', 'due_date', 
                 'scheduled_for', 'ai_priority_score', 'ai_suggestions', 'ai_category',
                 'related_expense_id', 'related_list_id', 'created_at', 'updated_at', 
                 'completed_at', 'notes', 'dependencies', 'attachments', 'tag_assignments',
                 'subtasks', 'reminders', 'time_entries', 'comments', 'assignments',
                 'custom_field_values', 'is_overdue', 'completion_percentage', 'total_time_spent']
        read_only_fields = ['created_at', 'updated_at', 'completed_at', 'ai_priority_score', 'is_overdue']
    
    def get_is_overdue(self, obj):
        if obj.due_date and obj.status != 'completed':
            from django.utils import timezone
            return obj.due_date < timezone.now()
        return False
    
    def get_completion_percentage(self, obj):
        subtasks = obj.subtasks.all()
        if not subtasks:
            return 100 if obj.status == 'completed' else 0
        
        completed_subtasks = subtasks.filter(is_completed=True).count()
        total_subtasks = subtasks.count()
        return int((completed_subtasks / total_subtasks) * 100)
    
    def get_total_time_spent(self, obj):
        total_minutes = sum(entry.duration_minutes or 0 for entry in obj.time_entries.all())
        return round(total_minutes / 60, 2) if total_minutes else 0

class TaskTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskTemplate
        fields = ['id', 'name', 'title_template', 'description_template', 
                 'default_priority', 'default_type', 'estimated_duration', 
                 'is_public', 'created_at']
        read_only_fields = ['created_at']

class AIInsightSerializer(serializers.ModelSerializer):
    related_task_title = serializers.CharField(source='related_task.title', read_only=True)
    related_goal_title = serializers.CharField(source='related_goal.title', read_only=True)
    
    class Meta:
        model = AIInsight
        fields = ['id', 'insight_type', 'title', 'content', 'confidence_score', 
                 'is_actionable', 'is_dismissed', 'related_task', 'related_task_title',
                 'related_goal', 'related_goal_title', 'metadata', 'created_at']
        read_only_fields = ['created_at', 'confidence_score']

class TaskCreateFromTemplateSerializer(serializers.Serializer):
    template_id = serializers.IntegerField()
    title = serializers.CharField(max_length=200, required=False)
    description = serializers.CharField(required=False)
    due_date = serializers.DateTimeField(required=False)
    goal_id = serializers.IntegerField(required=False)

class RecurringTaskTemplateSerializer(serializers.ModelSerializer):
    next_due_date = serializers.SerializerMethodField()
    
    class Meta:
        model = RecurringTaskTemplate
        fields = ['id', 'title', 'description', 'priority', 'task_type', 
                 'estimated_duration', 'recurrence_type', 'recurrence_interval',
                 'days_of_week', 'day_of_month', 'start_date', 'end_date',
                 'max_occurrences', 'is_active', 'created_at', 'updated_at',
                 'next_due_date']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_next_due_date(self, obj):
        # Calculate next due date based on recurrence pattern
        from datetime import datetime, timedelta
        import calendar
        
        if not obj.is_active:
            return None
            
        today = datetime.now().date()
        
        if obj.recurrence_type == 'daily':
            return today + timedelta(days=obj.recurrence_interval)
        elif obj.recurrence_type == 'weekly':
            return today + timedelta(weeks=obj.recurrence_interval)
        elif obj.recurrence_type == 'monthly':
            next_month = today.replace(day=1) + timedelta(days=32)
            try:
                return next_month.replace(day=obj.day_of_month or today.day)
            except ValueError:
                # Handle months with fewer days
                return next_month.replace(day=calendar.monthrange(next_month.year, next_month.month)[1])
        
        return None

class TaskActivityLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TaskActivityLog
        fields = ['id', 'action', 'description', 'user_username', 'metadata', 'created_at']
        read_only_fields = ['created_at']
