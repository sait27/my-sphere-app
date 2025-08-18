from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
import json
import os

from .models import (
    Goal, Task, TaskDependency, TaskNote, TaskTemplate, AIInsight, TaskAttachment,
    TaskTag, TaskTagAssignment, Subtask, TaskReminder, RecurringTaskTemplate,
    TimeEntry, TaskComment, TaskAssignment, TaskActivityLog, TaskCustomField,
    TaskCustomFieldValue
)
from .serializers import (
    GoalSerializer, TaskSerializer, TaskDependencySerializer, 
    TaskNoteSerializer, TaskTemplateSerializer, AIInsightSerializer,
    TaskCreateFromTemplateSerializer, TaskAttachmentSerializer,
    TaskTagSerializer, TaskTagAssignmentSerializer, SubtaskSerializer,
    TaskReminderSerializer, RecurringTaskTemplateSerializer, TimeEntrySerializer,
    TaskCommentSerializer, TaskAssignmentSerializer, TaskActivityLogSerializer,
    TaskCustomFieldSerializer, TaskCustomFieldValueSerializer
)
from .ai_engine import AITaskEngine

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generate_ai_insights(self, request, pk=None):
        """Generate AI insights for a specific goal"""
        goal = self.get_object()
        ai_engine = AITaskEngine()
        
        # Generate insights based on goal progress and tasks
        insights = []
        
        # Progress analysis
        progress = goal.progress_percentage
        if progress < 25:
            insight = AIInsight(
                user=request.user,
                insight_type='goal_progress',
                title=f"Goal '{goal.title}' needs attention",
                content=f"Only {progress}% complete. Consider breaking down tasks or adjusting timeline.",
                confidence_score=0.8,
                related_goal=goal
            )
            insight.save()
            insights.append(AIInsightSerializer(insight).data)
        
        return Response({'insights': insights})

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)
        
        # Filter parameters
        status_filter = self.request.query_params.get('status', None)
        priority_filter = self.request.query_params.get('priority', None)
        task_type_filter = self.request.query_params.get('task_type', None)
        goal_filter = self.request.query_params.get('goal', None)
        overdue = self.request.query_params.get('overdue', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        if task_type_filter:
            queryset = queryset.filter(task_type=task_type_filter)
        if goal_filter:
            queryset = queryset.filter(goal_id=goal_filter)
        if overdue == 'true':
            queryset = queryset.filter(
                due_date__lt=timezone.now(),
                status__in=['pending', 'in_progress']
            )
        
        return queryset
    
    def perform_create(self, serializer):
        task = serializer.save(user=self.request.user)
        
        # Run AI processing
        ai_engine = AITaskEngine()
        task.ai_priority_score = ai_engine.calculate_priority_score(task)
        task.ai_suggestions = ai_engine.generate_task_suggestions(task)
        task.ai_category = ai_engine.categorize_task(task)
        task.save()
    
    @action(detail=False, methods=['post'])
    def create_from_natural_language(self, request):
        """Create task from natural language input"""
        text = request.data.get('text', '')
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            ai_engine = AITaskEngine()
            parsed_data = ai_engine.process_natural_language_task(request.user, text)
            
            # Create task with parsed data
            task_data = {
                'title': parsed_data['title'],
                'description': parsed_data['description'],
                'priority': parsed_data['priority'],
                'task_type': parsed_data['task_type'],
                'estimated_duration': parsed_data.get('estimated_duration'),
            }
            
            if parsed_data.get('due_date'):
                task_data['due_date'] = parsed_data['due_date']
            
            serializer = TaskSerializer(data=task_data)
            if serializer.is_valid():
                task = serializer.save(user=request.user)
                
                # Run AI processing with error handling
                try:
                    task.ai_priority_score = ai_engine.calculate_priority_score(task)
                    task.ai_suggestions = ai_engine.generate_task_suggestions(task)
                    task.ai_category = ai_engine.categorize_task(task)
                    task.save()
                except Exception as ai_error:
                    # AI processing failed, but task is created - just log the error
                    print(f"AI processing failed for task {task.id}: {ai_error}")
                
                return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except ValueError as e:
            print(f"Natural language task creation failed due to value error: {e}")
            return Response({'error': f'Invalid input format: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except KeyError as e:
            print(f"Natural language task creation failed due to missing key: {e}")
            return Response({'error': f'Missing required field: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except json.JSONDecodeError as e:
            print(f"Natural language task creation failed due to JSON parsing error: {e}")
            return Response({'error': 'Failed to parse AI response'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"Natural language task creation failed with unexpected error: {e}")
            return Response({'error': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def update_ai_data(self, request, pk=None):
        """Refresh AI data for a task"""
        task = self.get_object()
        ai_engine = AITaskEngine()
        
        task.ai_priority_score = ai_engine.calculate_priority_score(task)
        task.ai_suggestions = ai_engine.generate_task_suggestions(task)
        task.ai_category = ai_engine.categorize_task(task)
        task.save()
        
        return Response(TaskSerializer(task).data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics"""
        user_tasks = Task.objects.filter(user=request.user)
        
        stats = {
            'total_tasks': user_tasks.count(),
            'completed_today': user_tasks.filter(
                status='completed',
                completed_at__date=timezone.now().date()
            ).count(),
            'overdue': user_tasks.filter(
                due_date__lt=timezone.now(),
                status__in=['pending', 'in_progress']
            ).count(),
            'high_priority': user_tasks.filter(
                priority__in=['high', 'urgent'],
                status__in=['pending', 'in_progress']
            ).count(),
            'by_status': dict(user_tasks.values('status').annotate(count=Count('id')).values_list('status', 'count')),
            'by_priority': dict(user_tasks.values('priority').annotate(count=Count('id')).values_list('priority', 'count')),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to a task"""
        task = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'Note content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        note = TaskNote.objects.create(
            task=task,
            user=request.user,
            content=content,
            is_ai_generated=False
        )
        
        return Response(TaskNoteSerializer(note).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        """Upload a file attachment to a task"""
        task = self.get_object()
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create attachment
        attachment = TaskAttachment.objects.create(
            task=task,
            user=request.user,
            file=file_obj,
            file_name=file_obj.name,
            file_size=file_obj.size,
            file_type=file_obj.content_type
        )
        
        return Response(TaskAttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def delete_attachment(self, request, pk=None):
        """Delete a file attachment"""
        task = self.get_object()
        attachment_id = request.data.get('attachment_id')
        
        if not attachment_id:
            return Response({'error': 'Attachment ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            attachment = TaskAttachment.objects.get(id=attachment_id, task=task)
            # Delete the file from storage
            if attachment.file:
                if os.path.isfile(attachment.file.path):
                    os.remove(attachment.file.path)
            attachment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TaskAttachment.DoesNotExist:
            return Response({'error': 'Attachment not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def smart_suggestions(self, request):
        """Get AI-powered task suggestions"""
        ai_engine = AITaskEngine()
        
        # Get scheduling suggestions
        unscheduled_tasks = Task.objects.filter(
            user=request.user,
            status__in=['pending', 'in_progress'],
            scheduled_for__isnull=True,
            due_date__isnull=False
        )[:5]
        
        suggestions = []
        for task in unscheduled_tasks:
            task_suggestions = ai_engine.suggest_task_scheduling(task)
            if task_suggestions:
                suggestions.extend(task_suggestions)
        
        return Response({'suggestions': suggestions})

class TaskTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TaskTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TaskTemplate.objects.filter(
            Q(user=self.request.user) | Q(is_public=True)
        )
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def create_task(self, request, pk=None):
        """Create a task from this template"""
        template = self.get_object()
        serializer = TaskCreateFromTemplateSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            
            task_data = {
                'title': data.get('title', template.title_template),
                'description': data.get('description', template.description_template),
                'priority': template.default_priority,
                'task_type': template.default_type,
                'estimated_duration': template.estimated_duration,
            }
            
            if data.get('due_date'):
                task_data['due_date'] = data['due_date']
            if data.get('goal_id'):
                task_data['goal'] = data['goal_id']
            
            task_serializer = TaskSerializer(data=task_data)
            if task_serializer.is_valid():
                task = task_serializer.save(user=request.user)
                
                # Run AI processing
                ai_engine = AITaskEngine()
                task.ai_priority_score = ai_engine.calculate_priority_score(task)
                task.ai_suggestions = ai_engine.generate_task_suggestions(task)
                task.ai_category = ai_engine.categorize_task(task)
                task.save()
                
                return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
            
            return Response(task_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AIInsightViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AIInsightSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIInsight.objects.filter(user=self.request.user, is_dismissed=False)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss an AI insight"""
        insight = self.get_object()
        insight.is_dismissed = True
        insight.save()
        return Response({'status': 'dismissed'})
    
    @action(detail=False, methods=['post'])
    def generate_insights(self, request):
        """Generate new AI insights for the user"""
        ai_engine = AITaskEngine()
        
        # Generate productivity insights
        productivity_insights = ai_engine.generate_productivity_insights(request.user)
        
        # Generate expense integration insights
        expense_insights = ai_engine.integrate_with_expenses(request.user)
        
        # Save new insights
        all_insights = productivity_insights + expense_insights
        for insight in all_insights:
            insight.save()
        
        # Return serialized insights
        serialized = AIInsightSerializer(all_insights, many=True)
        return Response({'insights': serialized.data})

class TaskNoteViewSet(viewsets.ModelViewSet):
    serializer_class = TaskNoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task', None)
        if task_id:
            return TaskNote.objects.filter(task_id=task_id, task__user=self.request.user)
        return TaskNote.objects.filter(task__user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskAttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task', None)
        if task_id:
            return TaskAttachment.objects.filter(task_id=task_id, task__user=self.request.user)
        return TaskAttachment.objects.filter(task__user=self.request.user)
    
    def perform_create(self, serializer):
        task_id = self.request.data.get('task')
        if not task_id:
            raise serializers.ValidationError({'task': 'Task ID is required'})
            
        try:
            task = Task.objects.get(id=task_id, user=self.request.user)
        except Task.DoesNotExist:
            raise serializers.ValidationError({'task': 'Task not found'})
            
        file_obj = self.request.FILES.get('file')
        if not file_obj:
            raise serializers.ValidationError({'file': 'File is required'})
            
        serializer.save(
            task=task,
            user=self.request.user,
            file_name=file_obj.name,
            file_size=file_obj.size,
            file_type=file_obj.content_type
        )

class TaskTagViewSet(viewsets.ModelViewSet):
    serializer_class = TaskTagSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TaskTag.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def assign_to_task(self, request, pk=None):
        """Assign this tag to a task"""
        tag = self.get_object()
        task_id = request.data.get('task_id')
        
        if not task_id:
            return Response({'error': 'Task ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            task = Task.objects.get(id=task_id, user=request.user)
            assignment, created = TaskTagAssignment.objects.get_or_create(
                task=task,
                tag=tag
            )
            
            if created:
                # Log activity
                TaskActivityLog.objects.create(
                    task=task,
                    user=request.user,
                    action='tag_added',
                    description=f"Added tag '{tag.name}' to task"
                )
                return Response(TaskTagAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'Tag already assigned to this task'})
                
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

class SubtaskViewSet(viewsets.ModelViewSet):
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task', None)
        if task_id:
            return Subtask.objects.filter(parent_task_id=task_id, parent_task__user=self.request.user)
        return Subtask.objects.filter(parent_task__user=self.request.user)
    
    def perform_create(self, serializer):
        task_id = self.request.data.get('parent_task')
        try:
            task = Task.objects.get(id=task_id, user=self.request.user)
            subtask = serializer.save(parent_task=task)
            
            # Log activity
            TaskActivityLog.objects.create(
                task=task,
                user=self.request.user,
                action='subtask_added',
                description=f"Added subtask '{subtask.title}'"
            )
        except Task.DoesNotExist:
            raise serializers.ValidationError({'parent_task': 'Task not found'})
    
    @action(detail=True, methods=['post'])
    def toggle_complete(self, request, pk=None):
        """Toggle completion status of subtask"""
        subtask = self.get_object()
        subtask.is_completed = not subtask.is_completed
        subtask.save()
        
        # Log activity
        action = 'subtask_completed' if subtask.is_completed else 'subtask_uncompleted'
        TaskActivityLog.objects.create(
            task=subtask.parent_task,
            user=request.user,
            action=action,
            description=f"{'Completed' if subtask.is_completed else 'Uncompleted'} subtask '{subtask.title}'"
        )
        
        return Response(SubtaskSerializer(subtask).data)

class TimeEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TimeEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task', None)
        if task_id:
            return TimeEntry.objects.filter(task_id=task_id, task__user=self.request.user)
        return TimeEntry.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        task_id = self.request.data.get('task')
        try:
            task = Task.objects.get(id=task_id, user=self.request.user)
            time_entry = serializer.save(task=task, user=self.request.user)
            
            # Log activity
            TaskActivityLog.objects.create(
                task=task,
                user=self.request.user,
                action='time_logged',
                description=f"Logged {time_entry.duration_minutes or 0} minutes"
            )
        except Task.DoesNotExist:
            raise serializers.ValidationError({'task': 'Task not found'})
    
    @action(detail=False, methods=['post'])
    def start_timer(self, request):
        """Start a timer for a task"""
        task_id = request.data.get('task_id')
        if not task_id:
            return Response({'error': 'Task ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            task = Task.objects.get(id=task_id, user=request.user)
            
            # Check if there's already an active timer
            active_timer = TimeEntry.objects.filter(
                task=task,
                user=request.user,
                end_time__isnull=True
            ).first()
            
            if active_timer:
                return Response({'error': 'Timer already running for this task'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create new time entry
            time_entry = TimeEntry.objects.create(
                task=task,
                user=request.user,
                start_time=timezone.now()
            )
            
            return Response(TimeEntrySerializer(time_entry).data, status=status.HTTP_201_CREATED)
            
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def stop_timer(self, request, pk=None):
        """Stop a running timer"""
        time_entry = self.get_object()
        
        if time_entry.end_time:
            return Response({'error': 'Timer already stopped'}, status=status.HTTP_400_BAD_REQUEST)
        
        time_entry.end_time = timezone.now()
        time_entry.save()  # This will automatically calculate duration
        
        return Response(TimeEntrySerializer(time_entry).data)

class TaskReminderViewSet(viewsets.ModelViewSet):
    serializer_class = TaskReminderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task', None)
        if task_id:
            return TaskReminder.objects.filter(task_id=task_id, task__user=self.request.user)
        return TaskReminder.objects.filter(task__user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        task_id = self.request.data.get('task')
        try:
            task = Task.objects.get(id=task_id, user=self.request.user)
            serializer.save(task=task)
        except Task.DoesNotExist:
            raise serializers.ValidationError({'task': 'Task not found'})

class RecurringTaskTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringTaskTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return RecurringTaskTemplate.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generate_tasks(self, request, pk=None):
        """Generate tasks from recurring template"""
        template = self.get_object()
        count = int(request.data.get('count', 1))
        
        if count > 10:
            return Response({'error': 'Cannot generate more than 10 tasks at once'}, status=status.HTTP_400_BAD_REQUEST)
        
        tasks = []
        for i in range(count):
            # Calculate due date based on recurrence
            from datetime import datetime, timedelta
            base_date = datetime.now().date()
            
            if template.recurrence_type == 'daily':
                due_date = base_date + timedelta(days=i * template.recurrence_interval)
            elif template.recurrence_type == 'weekly':
                due_date = base_date + timedelta(weeks=i * template.recurrence_interval)
            elif template.recurrence_type == 'monthly':
                # Simple monthly calculation
                due_date = base_date + timedelta(days=30 * i * template.recurrence_interval)
            else:
                due_date = base_date
            
            # Create task
            task = Task.objects.create(
                user=request.user,
                title=template.title,
                description=template.description,
                priority=template.priority,
                task_type=template.task_type,
                estimated_duration=template.estimated_duration,
                due_date=datetime.combine(due_date, datetime.min.time())
            )
            tasks.append(task)
        
        serialized_tasks = TaskSerializer(tasks, many=True)
        return Response(serialized_tasks.data, status=status.HTTP_201_CREATED)

class TaskCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task', None)
        if task_id:
            return TaskComment.objects.filter(task_id=task_id, task__user=self.request.user)
        return TaskComment.objects.filter(task__user=self.request.user)
    
    def perform_create(self, serializer):
        task_id = self.request.data.get('task')
        try:
            task = Task.objects.get(id=task_id, user=self.request.user)
            comment = serializer.save(task=task, user=self.request.user)
            
            # Log activity
            TaskActivityLog.objects.create(
                task=task,
                user=self.request.user,
                action='commented',
                description=f"Added comment: {comment.content[:50]}{'...' if len(comment.content) > 50 else ''}"
            )
        except Task.DoesNotExist:
            raise serializers.ValidationError({'task': 'Task not found'})

class TaskCustomFieldViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCustomFieldSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TaskCustomField.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TaskActivityLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task', None)
        if task_id:
            return TaskActivityLog.objects.filter(task_id=task_id, task__user=self.request.user)
        return TaskActivityLog.objects.filter(task__user=self.request.user)
