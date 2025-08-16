from django.contrib import admin
from .models import Goal, Task, TaskDependency, TaskNote, TaskTemplate, AIInsight

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'priority', 'status', 'target_date', 'progress_percentage', 'created_at']
    list_filter = ['priority', 'status', 'created_at', 'target_date']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['progress_percentage', 'created_at', 'updated_at']
    
    def progress_percentage(self, obj):
        return f"{obj.progress_percentage}%"
    progress_percentage.short_description = 'Progress'

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'goal', 'priority', 'status', 'task_type', 'due_date', 'ai_priority_score']
    list_filter = ['priority', 'status', 'task_type', 'created_at', 'due_date']
    search_fields = ['title', 'description', 'user__username', 'goal__title']
    readonly_fields = ['ai_priority_score', 'created_at', 'updated_at', 'completed_at']
    raw_id_fields = ['goal']

@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = ['task', 'depends_on', 'created_at']
    raw_id_fields = ['task', 'depends_on']

@admin.register(TaskNote)
class TaskNoteAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'is_ai_generated', 'created_at']
    list_filter = ['is_ai_generated', 'created_at']
    search_fields = ['content', 'task__title', 'user__username']
    raw_id_fields = ['task']

@admin.register(TaskTemplate)
class TaskTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'default_priority', 'default_type', 'is_public', 'created_at']
    list_filter = ['default_priority', 'default_type', 'is_public', 'created_at']
    search_fields = ['name', 'title_template', 'user__username']

@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'insight_type', 'confidence_score', 'is_actionable', 'is_dismissed', 'created_at']
    list_filter = ['insight_type', 'is_actionable', 'is_dismissed', 'created_at']
    search_fields = ['title', 'content', 'user__username']
    readonly_fields = ['confidence_score', 'created_at']
    raw_id_fields = ['related_task', 'related_goal']
