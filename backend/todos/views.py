from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
import json

from .models import Goal, Task, TaskDependency, TaskNote, TaskTemplate, AIInsight
from .serializers import (
    GoalSerializer, TaskSerializer, TaskDependencySerializer, 
    TaskNoteSerializer, TaskTemplateSerializer, AIInsightSerializer,
    TaskCreateFromTemplateSerializer
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
            
        except Exception as e:
            print(f"Natural language task creation failed: {e}")
            return Response({'error': f'Failed to create task: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
