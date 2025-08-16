import google.generativeai as genai
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from .models import Task, Goal, AIInsight
from expenses.models import Expense
from lists.models import List

class AITaskEngine:
    """AI engine for task prioritization, suggestions, and insights"""
    
    def __init__(self):
        # Use Gemini API instead of OpenAI
        genai.configure(api_key=getattr(settings, 'GEMINI_API_KEY', None))
        self.model = genai.GenerativeModel('gemini-pro')
    
    def calculate_priority_score(self, task):
        """Calculate AI priority score based on multiple factors"""
        try:
            score = 50  # Base score
            
            # Due date factor
            if task.due_date:
                days_until_due = (task.due_date - timezone.now().date()).days
                if days_until_due <= 0:
                    score += 40  # Overdue
                elif days_until_due <= 1:
                    score += 30  # Due today/tomorrow
                elif days_until_due <= 3:
                    score += 20  # Due this week
                elif days_until_due <= 7:
                    score += 10  # Due next week
            
            # Priority factor
            priority_scores = {'low': 0, 'medium': 10, 'high': 20, 'urgent': 30}
            score += priority_scores.get(task.priority, 10)
            
            # Task type factor (some types are more time-sensitive)
            type_scores = {
                'work': 15, 'health': 20, 'finance': 15, 
                'personal': 5, 'learning': 5, 'social': 5, 'other': 5
            }
            score += type_scores.get(task.task_type, 5)
            
            # Goal association (tasks linked to goals get higher priority)
            if task.goal:
                score += 15
            
            return min(100, max(0, score))  # Clamp between 0-100
        except Exception as e:
            print(f"Error calculating priority score: {e}")
            return 50  # Default score for a task
    
    def generate_task_suggestions(self, task):
        """Generate AI suggestions for a task"""
        try:
            # Simple rule-based suggestions
            suggestions = []
            
            if task.task_type == 'work':
                suggestions.append("Break down into smaller subtasks")
                suggestions.append("Set specific time blocks for focused work")
            elif task.task_type == 'health':
                suggestions.append("Schedule at a consistent time")
                suggestions.append("Set reminders to maintain consistency")
            elif task.task_type == 'learning':
                suggestions.append("Allocate dedicated study time")
                suggestions.append("Take notes and review regularly")
            else:
                suggestions.append("Set a specific deadline")
                suggestions.append("Identify required resources beforehand")
            
            if task.priority in ['high', 'urgent']:
                suggestions.append("Consider doing this task first thing in the morning")
            
            return "; ".join(suggestions)
            
        except Exception as e:
            return "Focus on breaking this task into smaller, manageable steps."
    
    def categorize_task(self, task):
        """Use AI to categorize tasks automatically"""
        try:
            # Simple rule-based categorization
            title_desc = (task.title + " " + task.description).lower()
            
            if any(word in title_desc for word in ['work', 'office', 'meeting', 'project', 'client', 'boss']):
                return 'work'
            elif any(word in title_desc for word in ['doctor', 'health', 'exercise', 'medical', 'gym', 'workout']):
                return 'health'
            elif any(word in title_desc for word in ['money', 'bank', 'payment', 'bill', 'budget', 'finance']):
                return 'finance'
            elif any(word in title_desc for word in ['learn', 'study', 'course', 'book', 'education', 'training']):
                return 'learning'
            elif any(word in title_desc for word in ['friend', 'family', 'social', 'party', 'dinner', 'visit']):
                return 'social'
            else:
                return task.task_type
            
        except Exception as e:
            return task.task_type
    
    def generate_productivity_insights(self, user):
        """Generate productivity insights for a user"""
        insights = []
        
        # Analyze task completion patterns
        completed_tasks = Task.objects.filter(
            user=user, 
            status='completed',
            completed_at__gte=timezone.now() - timedelta(days=30)
        )
        
        overdue_tasks = Task.objects.filter(
            user=user,
            status__in=['pending', 'in_progress'],
            due_date__lt=timezone.now()
        )
        
        # Overdue tasks insight
        if overdue_tasks.count() > 0:
            insight = AIInsight(
                user=user,
                insight_type='productivity',
                title=f"You have {overdue_tasks.count()} overdue tasks",
                content=f"Consider reviewing and rescheduling these tasks: {', '.join([t.title for t in overdue_tasks[:3]])}",
                confidence_score=0.9,
                is_actionable=True
            )
            insights.append(insight)
        
        # Completion rate insight
        total_tasks = Task.objects.filter(user=user, created_at__gte=timezone.now() - timedelta(days=30)).count()
        if total_tasks > 0:
            completion_rate = (completed_tasks.count() / total_tasks) * 100
            if completion_rate < 50:
                insight = AIInsight(
                    user=user,
                    insight_type='productivity',
                    title=f"Task completion rate is {completion_rate:.1f}%",
                    content="Consider breaking down large tasks into smaller, manageable pieces to improve completion rates.",
                    confidence_score=0.8,
                    is_actionable=True
                )
                insights.append(insight)
        
        return insights
    
    def suggest_task_scheduling(self, task):
        """Suggest optimal scheduling for a task"""
        suggestions = []
        
        if not task.scheduled_for and task.due_date:
            # Suggest scheduling based on estimated duration and due date
            if task.estimated_duration:
                buffer_time = timedelta(hours=2)  # 2-hour buffer
                suggested_start = task.due_date - timedelta(minutes=task.estimated_duration) - buffer_time
                
                if suggested_start > timezone.now():
                    suggestions.append({
                        'type': 'scheduling',
                        'message': f"Consider scheduling this task for {suggested_start.strftime('%Y-%m-%d %H:%M')} to complete before the deadline.",
                        'suggested_time': suggested_start.isoformat()
                    })
        
        return suggestions
    
    def integrate_with_expenses(self, user):
        """Find tasks related to expenses and suggest integrations"""
        insights = []
        
        # Find recent high-amount expenses that might need follow-up tasks
        recent_expenses = Expense.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(days=7),
            amount__gte=100  # High-value expenses
        )
        
        for expense in recent_expenses:
            # Check if there's already a related task
            existing_task = Task.objects.filter(
                user=user,
                related_expense_id=expense.id
            ).first()
            
            if not existing_task:
                insight = AIInsight(
                    user=user,
                    insight_type='integration',
                    title=f"Follow-up needed for ${expense.amount} expense at {expense.vendor}",
                    content=f"Consider creating a task to track or categorize this expense: {expense.raw_text}",
                    confidence_score=0.7,
                    is_actionable=True,
                    metadata=json.dumps({'expense_id': expense.id, 'amount': float(expense.amount)})
                )
                insights.append(insight)
        
        return insights
    
    def process_natural_language_task(self, user, text):
        """Process natural language input to create structured tasks"""
        # Always use fallback parsing for now to ensure functionality
        return self._fallback_task_parsing(text)
    
    def _fallback_task_parsing(self, text):
        """Fallback parsing when AI is not available"""
        # Basic parsing logic
        title = text[:100] if len(text) <= 100 else text[:97] + "..."
        
        # Simple priority detection
        priority = 'medium'
        text_lower = text.lower()
        if any(word in text_lower for word in ['urgent', 'asap', 'immediately', 'critical']):
            priority = 'urgent'
        elif any(word in text_lower for word in ['important', 'high', 'priority']):
            priority = 'high'
        elif any(word in text_lower for word in ['low', 'later', 'someday']):
            priority = 'low'
        
        # Simple type detection
        task_type = 'personal'
        if any(word in text_lower for word in ['work', 'office', 'meeting', 'project']):
            task_type = 'work'
        elif any(word in text_lower for word in ['doctor', 'health', 'exercise', 'medical']):
            task_type = 'health'
        elif any(word in text_lower for word in ['money', 'bank', 'payment', 'bill']):
            task_type = 'finance'
        elif any(word in text_lower for word in ['learn', 'study', 'course', 'book']):
            task_type = 'learning'
        elif any(word in text_lower for word in ['friend', 'family', 'social', 'party']):
            task_type = 'social'
        
        # Simple duration estimation (in minutes)
        estimated_duration = None
        if any(word in text_lower for word in ['quick', 'fast', 'brief']):
            estimated_duration = 15
        elif any(word in text_lower for word in ['hour', '1h', '60']):
            estimated_duration = 60
        elif any(word in text_lower for word in ['30', 'half hour']):
            estimated_duration = 30
        
        # Simple due date parsing
        due_date = None
        if 'today' in text_lower:
            due_date = timezone.now().date().isoformat()
        elif 'tomorrow' in text_lower:
            due_date = (timezone.now().date() + timedelta(days=1)).isoformat()
        elif 'next week' in text_lower:
            due_date = (timezone.now().date() + timedelta(days=7)).isoformat()
        
        return {
            'title': title,
            'description': text,
            'priority': priority,
            'task_type': task_type,
            'estimated_duration': estimated_duration,
            'due_date': due_date
        }
