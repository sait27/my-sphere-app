# lists/services.py

import os
import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from django.db import transaction
from django.db.models import Q, Count, Sum, Avg, F
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.cache import cache

# Google Generative AI is optional; provide a stub so tests can patch it
try:
    import google.generativeai as genai
except Exception:
    class _GenAIStub:
        def configure(self, *args, **kwargs):
            return None
        class GenerativeModel:
            def __init__(self, *args, **kwargs):
                pass
            def generate_content(self, *args, **kwargs):
                class _Resp:
                    text = '{"items": []}'
                return _Resp()
    genai = _GenAIStub()

from .models import (
    List, ListItem, ListTemplate, ListCategory, 
    ListShare, ListActivity, ListAnalytics
)

logger = logging.getLogger(__name__)

class ListAIService:
    """Service for AI-powered list operations"""
    
    def __init__(self):
        self.model = None  # lazy init so tests can patch GenerativeModel before use
        try:
            # genai is either the real module or our stub
            genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
            self.ai_available = True
        except Exception as e:
            logger.error(f"AI service initialization failed: {e}")
            self.ai_available = False

    def _ensure_model(self):
        """Create model lazily to honor runtime patches in tests."""
        if not self.ai_available:
            return False
        if self.model is None:
            try:
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as e:
                logger.error(f"AI model creation failed: {e}")
                self.ai_available = False
                return False
        return True

    def parse_list_items(self, text, list_type='checklist'):
        """Parse natural language text into structured list items"""
        if not self._ensure_model():
            return {'items': [{'name': text, 'quantity': None}]}
        
        try:
            prompt = self._build_parsing_prompt(text, list_type)
            response = self.model.generate_content(prompt)
            cleaned_json = response.text.strip().replace('```json', '').replace('```', '')
            return json.loads(cleaned_json)
        except Exception as e:
            logger.error(f"AI parsing failed: {e}")
            return {'items': [{'name': text, 'quantity': None}]}

    def _build_parsing_prompt(self, text, list_type):
        """Build AI prompt based on list type"""
        base_prompt = f"""
        You are a smart {list_type} parsing system.
        Analyze the user's text and extract all distinct items.
        For each item, extract: name, quantity, category, priority, estimated_price.
        
        Respond ONLY with JSON:
        {{
            "items": [
                {{
                    "name": "item name",
                    "quantity": "amount/unit or null",
                    "category": "category or null",
                    "priority": "low/medium/high/urgent",
                    "estimated_price": number or null
                }}
            ]
        }}
        """
        
        if list_type == 'shopping':
            base_prompt += "\nFocus on grocery/shopping items with quantities and estimated prices."
        elif list_type == 'todo':
            base_prompt += "\nFocus on tasks with priority levels."
        elif list_type == 'packing':
            base_prompt += "\nFocus on travel/packing items with quantities."
        
        return f"{base_prompt}\n\nUser's Text: \"{text}\"\nYour JSON Response:"

    def generate_suggestions(self, list_obj, context='completion'):
        """Generate AI suggestions for list improvements"""
        if not self._ensure_model():
            return []
        
        try:
            items_text = ", ".join([item.name for item in list_obj.items.all()[:10]])
            prompt = f"""
            Based on this {list_obj.list_type} list: "{list_obj.name}" 
            with items: {items_text}
            
            Suggest 3-5 additional items that might be missing.
            Respond with JSON: {{"suggestions": ["item1", "item2", ...]}}
            """
            
            response = self.model.generate_content(prompt)
            cleaned_json = response.text.strip().replace('```json', '').replace('```', '')
            result = json.loads(cleaned_json)
            return result.get('suggestions', [])
        except Exception as e:
            logger.error(f"AI suggestions failed: {e}")
            return []

class ListService:
    """Core service for list operations"""
    
    def __init__(self):
        self.ai_service = ListAIService()

    @transaction.atomic
    def create_list(self, user, validated_data):
        """Create a new list with validation and activity logging"""
        try:
            list_obj = List.objects.create(user=user, **validated_data)
            
            # Log activity
            ListActivity.objects.create(
                list=list_obj,
                user=user,
                action='created',
                description=f'Created list "{list_obj.name}"'
            )
            
            # Generate AI suggestions if enabled
            if validated_data.get('ai_suggestions_enabled', True):
                suggestions = self.ai_service.generate_suggestions(list_obj)
                list_obj.ai_suggestions = {'suggested_items': suggestions}
                list_obj.save()
            
            logger.info(f"List created: {list_obj.id} by user {user.id}")
            return list_obj
            
        except Exception as e:
            logger.error(f"List creation failed: {e}")
            raise

    @transaction.atomic
    def add_items_from_text(self, list_obj, text, user):
        """Add items to list using AI parsing"""
        try:
            parsed_data = self.ai_service.parse_list_items(text, list_obj.list_type)
            items_created = []
            
            for item_data in parsed_data.get('items', []):
                if not item_data.get('name'):
                    continue
                    
                item = ListItem.objects.create(
                    list=list_obj,
                    name=item_data['name'],
                    quantity=item_data.get('quantity'),
                    category=item_data.get('category'),
                    priority=item_data.get('priority', 'medium'),
                    estimated_price=item_data.get('estimated_price'),
                    auto_added=True
                )
                items_created.append(item)
            
            # Update list completion percentage
            list_obj.update_completion_percentage()
            
            # Log activity
            ListActivity.objects.create(
                list=list_obj,
                user=user,
                action='item_added',
                description=f'Added {len(items_created)} items via AI parsing',
                metadata={'items_count': len(items_created), 'source': 'ai_parsing'}
            )
            
            logger.info(f"Added {len(items_created)} items to list {list_obj.id}")
            return items_created
            
        except Exception as e:
            logger.error(f"Add items from text failed: {e}")
            raise

    @transaction.atomic
    def bulk_operations(self, user, operation_data):
        """Handle bulk operations on lists and items"""
        try:
            operation = operation_data['operation']
            results = {'success': 0, 'failed': 0, 'details': []}
            
            if operation == 'bulk_complete_items':
                results = self._bulk_complete_items(user, operation_data)
            elif operation == 'bulk_delete_items':
                results = self._bulk_delete_items(user, operation_data)
            elif operation == 'bulk_categorize_items':
                results = self._bulk_categorize_items(user, operation_data)
            elif operation == 'duplicate_list':
                results = self._duplicate_list(user, operation_data)
            elif operation == 'archive_lists':
                results = self._archive_lists(user, operation_data)
            else:
                raise ValueError(f"Unknown operation: {operation}")
            
            logger.info(f"Bulk operation {operation} completed: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Bulk operation failed: {e}")
            raise

    def _bulk_complete_items(self, user, data):
        """Mark multiple items as completed"""
        item_ids = data.get('item_ids', [])
        completed = data.get('completed', True)
        
        items = ListItem.objects.filter(
            id__in=item_ids,
            list__user=user
        )
        
        updated_count = 0
        for item in items:
            item.is_completed = completed
            if completed:
                item.completed_at = timezone.now()
                item.completed_by = user
            else:
                item.completed_at = None
                item.completed_by = None
            item.save()
            updated_count += 1
        
        # Update completion percentages for affected lists
        affected_lists = set(item.list for item in items)
        for list_obj in affected_lists:
            list_obj.update_completion_percentage()
        
        return {'success': updated_count, 'failed': 0}

    def _bulk_delete_items(self, user, data):
        """Delete multiple items"""
        item_ids = data.get('item_ids', [])
        
        items = ListItem.objects.filter(
            id__in=item_ids,
            list__user=user
        )
        
        affected_lists = set(item.list for item in items)
        deleted_count = items.count()
        items.delete()
        
        # Update completion percentages
        for list_obj in affected_lists:
            list_obj.update_completion_percentage()
        
        return {'success': deleted_count, 'failed': 0}

    def _duplicate_list(self, user, data):
        """Duplicate a list with all its items"""
        list_id = data.get('list_id')
        new_name = data.get('new_name')
        
        original_list = List.objects.get(id=list_id, user=user)
        
        # Create duplicate list
        duplicate_list = List.objects.create(
            user=user,
            name=new_name or f"{original_list.name} (Copy)",
            description=original_list.description,
            list_type=original_list.list_type,
            category=original_list.category,
            priority=original_list.priority
        )
        
        # Duplicate items
        items_to_create = []
        for item in original_list.items.all():
            items_to_create.append(ListItem(
                list=duplicate_list,
                name=item.name,
                description=item.description,
                quantity=item.quantity,
                unit=item.unit,
                priority=item.priority,
                category=item.category,
                estimated_price=item.estimated_price,
                order=item.order
            ))
        
        ListItem.objects.bulk_create(items_to_create)
        duplicate_list.update_completion_percentage()
        
        return {'success': 1, 'failed': 0, 'list_id': duplicate_list.id}

    @transaction.atomic
    def duplicate_list(self, original_list, new_name=None):
        """
        Duplicates a list and all its items.
        Resets completion status for the new list and its items.
        """
        user = original_list.user

        if not new_name:
            new_name = f"{original_list.name} (Copy)"

        # Create the new list instance
        new_list = List.objects.create(
            user=user,
            name=new_name,
            description=original_list.description,
            list_type=original_list.list_type,
            category=original_list.category,
            priority=original_list.priority,
            is_public=original_list.is_public,
            completion_percentage=0,
            is_archived=False,
            ai_suggestions_enabled=original_list.ai_suggestions_enabled,
        )

        # Duplicate items, ensuring they are not marked as completed
        items_to_create = []
        for item in original_list.items.all():
            items_to_create.append(ListItem(
                list=new_list,
                name=item.name,
                description=item.description,
                quantity=item.quantity,
                unit=item.unit,
                priority=item.priority,
                category=item.category,
                estimated_price=item.estimated_price,
                due_date=item.due_date,
                order=item.order,
                is_completed=False,  # Reset completion status
                completed_at=None,
                completed_by=None,
            ))
        
        if items_to_create:
            ListItem.objects.bulk_create(items_to_create)
        
        # Log activity for the new list
        ListActivity.objects.create(
            list=new_list,
            user=user,
            action='duplicated',
            description=f'List created by duplicating \"{original_list.name}\"'        )
        
        logger.info(f"List {original_list.id} duplicated to {new_list.id} by user {user.id}")
        return new_list

    def get_agenda_for_user(self, user):
        """Get all list items due today or overdue for a user."""
        today = timezone.now().date()
        
        # Get items due today or that are overdue and not completed
        agenda_items = ListItem.objects.filter(
            list__user=user,
            due_date__lte=today,
            is_completed=False
        ).select_related('list').order_by('due_date', 'priority')
        
        return agenda_items

class ListAnalyticsService:
    """Service for list analytics and insights"""
    
    def get_user_analytics(self, user, period='month'):
        """Get comprehensive analytics for user's lists"""
        cache_key = f"list_analytics_{user.id}_{period}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            # Date range calculation
            end_date = timezone.now()
            if period == 'week':
                start_date = end_date - timedelta(days=7)
            elif period == 'month':
                start_date = end_date - timedelta(days=30)
            elif period == 'quarter':
                start_date = end_date - timedelta(days=90)
            else:
                start_date = end_date - timedelta(days=365)
            
            # Basic stats
            lists_qs = List.objects.filter(
                user=user,
                created_at__gte=start_date
            )
            
            items_qs = ListItem.objects.filter(
                list__user=user,
                created_at__gte=start_date
            )
            
            analytics = {
                'summary': self._get_summary_stats(lists_qs, items_qs),
                'productivity': self._get_productivity_metrics(user, start_date, end_date),
                'categories': self._get_category_breakdown(lists_qs),
                'list_types': self._get_list_type_breakdown(lists_qs),
                'completion_trends': self._get_completion_trends(user, start_date, end_date),
                'insights': self._generate_insights(user, lists_qs, items_qs)
            }
            
            # Cache for 1 hour
            cache.set(cache_key, analytics, 3600)
            return analytics
            
        except Exception as e:
            logger.error(f"Analytics generation failed: {e}")
            return {}

    def _get_summary_stats(self, lists_qs, items_qs):
        """Calculate summary statistics"""
        return {
            'total_lists': lists_qs.count(),
            'active_lists': lists_qs.filter(is_archived=False).count(),
            'completed_lists': lists_qs.filter(completion_percentage=100).count(),
            'total_items': items_qs.count(),
            'completed_items': items_qs.filter(is_completed=True).count(),
            'average_completion': lists_qs.aggregate(
                avg=Avg('completion_percentage')
            )['avg'] or 0,
            'total_estimated_cost': items_qs.aggregate(
                total=Sum('estimated_price')
            )['total'] or 0
        }

    def _get_productivity_metrics(self, user, start_date, end_date):
        """Calculate productivity metrics"""
        completed_items = ListItem.objects.filter(
            list__user=user,
            is_completed=True,
            completed_at__gte=start_date,
            completed_at__lte=end_date
        )
        
        # Calculate average completion time
        completion_times = []
        for item in completed_items:
            if item.completed_at and item.created_at:
                delta = item.completed_at - item.created_at
                completion_times.append(delta.total_seconds())
        
        avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else 0
        
        return {
            'items_completed': completed_items.count(),
            'average_completion_time_hours': avg_completion_time / 3600,
            'productivity_score': min(100, (completed_items.count() / max(1, (end_date - start_date).days)) * 10)
        }

    def _get_category_breakdown(self, lists_qs):
        """Get breakdown by categories"""
        return list(lists_qs.values('category__name', 'category__color')
                   .annotate(count=Count('id'))
                   .order_by('-count'))

    def _get_list_type_breakdown(self, lists_qs):
        """Get breakdown by list types"""
        return list(lists_qs.values('list_type')
                   .annotate(count=Count('id'))
                   .order_by('-count'))

    def _get_completion_trends(self, user, start_date, end_date):
        """Get completion trends over time"""
        # Daily completion data for the period
        trends = []
        current_date = start_date.date()
        end_date_only = end_date.date()
        
        while current_date <= end_date_only:
            completed_count = ListItem.objects.filter(
                list__user=user,
                is_completed=True,
                completed_at__date=current_date
            ).count()
            
            trends.append({
                'date': current_date.isoformat(),
                'completed_items': completed_count
            })
            current_date += timedelta(days=1)
        
        return trends

    def _generate_insights(self, user, lists_qs, items_qs):
        """Generate AI-powered insights"""
        insights = []
        
        # Most productive list type
        list_type_stats = lists_qs.values('list_type').annotate(
            avg_completion=Avg('completion_percentage')
        ).order_by('-avg_completion').first()
        
        if list_type_stats:
            insights.append({
                'type': 'productivity',
                'title': 'Most Productive List Type',
                'description': f"Your {list_type_stats['list_type']} lists have the highest completion rate at {list_type_stats['avg_completion']:.1f}%"
            })
        
        # Completion pattern
        completed_items = items_qs.filter(is_completed=True)
        if completed_items.exists():
            avg_completion_time = completed_items.aggregate(
                avg_time=Avg(F('completed_at') - F('created_at'))
            )['avg_time']
            
            if avg_completion_time:
                days = avg_completion_time.days
                insights.append({
                    'type': 'timing',
                    'title': 'Average Task Completion',
                    'description': f"You typically complete tasks within {days} days"
                })
        
        return insights


class ListTemplateService:
    """Service for list templates"""
    
    def create_template_from_list(self, user, list_obj, template_data):
        """Create a reusable template from an existing list"""
        try:
            template = ListTemplate.objects.create(
                user=user,
                name=template_data['name'],
                description=template_data.get('description', ''),
                category=template_data.get('category', 'general'),
                is_public=template_data.get('is_public', False)
            )
            
            # Store list structure in template metadata
            items_data = []
            for item in list_obj.items.all():
                items_data.append({
                    'name': item.name,
                    'quantity': item.quantity,
                    'category': item.category,
                    'priority': item.priority,
                    'estimated_price': float(item.estimated_price) if item.estimated_price else None
                })
            
            template.metadata = {
                'list_type': list_obj.list_type,
                'items': items_data
            }
            template.save()
            
            return template
            
        except Exception as e:
            logger.error(f"Template creation failed: {e}")
            raise

    def create_list_from_template(self, user, template, list_name):
        """Create a new list from a template"""
        try:
            metadata = template.metadata or {}
            
            # Create list
            new_list = List.objects.create(
                user=user,
                name=list_name,
                list_type=metadata.get('list_type', 'checklist'),
                template=template
            )
            
            # Create items from template
            items_to_create = []
            for item_data in metadata.get('items', []):
                items_to_create.append(ListItem(
                    list=new_list,
                    name=item_data['name'],
                    quantity=item_data.get('quantity'),
                    category=item_data.get('category'),
                    priority=item_data.get('priority', 'medium'),
                    estimated_price=item_data.get('estimated_price')
                ))
            
            ListItem.objects.bulk_create(items_to_create)
            
            # Update template usage count
            template.use_count = F('use_count') + 1
            template.save()
            
            return new_list
            
        except Exception as e:
            logger.error(f"List creation from template failed: {e}")
            raise
