from rest_framework import serializers
from .models import Goal, Task, TaskDependency, TaskNote, TaskTemplate, AIInsight
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

class TaskDependencySerializer(serializers.ModelSerializer):
    depends_on_title = serializers.CharField(source='depends_on.title', read_only=True)
    
    class Meta:
        model = TaskDependency
        fields = ['id', 'depends_on', 'depends_on_title', 'created_at']
        read_only_fields = ['created_at']

class TaskSerializer(serializers.ModelSerializer):
    goal_title = serializers.CharField(source='goal.title', read_only=True)
    notes = TaskNoteSerializer(many=True, read_only=True)
    dependencies = TaskDependencySerializer(many=True, read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = ['id', 'goal', 'goal_title', 'title', 'description', 'priority', 'status', 
                 'task_type', 'estimated_duration', 'actual_duration', 'due_date', 
                 'scheduled_for', 'ai_priority_score', 'ai_suggestions', 'ai_category',
                 'related_expense_id', 'related_list_id', 'created_at', 'updated_at', 
                 'completed_at', 'notes', 'dependencies', 'is_overdue']
        read_only_fields = ['created_at', 'updated_at', 'completed_at', 'ai_priority_score', 'is_overdue']
    
    def get_is_overdue(self, obj):
        if obj.due_date and obj.status != 'completed':
            from django.utils import timezone
            return obj.due_date < timezone.now()
        return False

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
