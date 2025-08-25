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
    ListActivity, ListAnalytics
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
            except (ValueError, TypeError) as e:
                logger.error(f"AI model creation failed due to invalid parameters: {e}")
                self.ai_available = False
                return False
            except ImportError as e:
                logger.error(f"AI model creation failed due to missing dependencies: {e}")
                self.ai_available = False
                return False
            except Exception as e:
                logger.error(f"AI model creation failed with unexpected error: {e}")
                self.ai_available = False
                return False
        return True

    def parse_list_items(self, text, list_type='checklist', context=None):
        """Parse natural language text into structured list items with context awareness"""
        if not self._ensure_model():
            return {'items': [{'name': text, 'quantity': None}]}
        
        try:
            prompt = self._build_enhanced_parsing_prompt(text, list_type, context)
            response = self.model.generate_content(prompt)
            cleaned_json = response.text.strip().replace('```json', '').replace('```', '')
            parsed_data = json.loads(cleaned_json)
            
            # Post-process with smart categorization
            return self._enhance_parsed_items(parsed_data, list_type, context)
        except Exception as e:
            logger.error(f"AI parsing failed: {e}")
            return {'items': [{'name': text, 'quantity': None}]}

    def _build_enhanced_parsing_prompt(self, text, list_type, context=None):
        """Build enhanced AI prompt with context awareness"""
        context_info = ""
        if context:
            existing_items = context.get('existing_items', [])
            user_preferences = context.get('user_preferences', {})
            recent_lists = context.get('recent_lists', [])
            
            if existing_items:
                context_info += f"\nExisting items in this list: {', '.join(existing_items[:5])}"
            if user_preferences:
                context_info += f"\nUser preferences: {user_preferences}"
            if recent_lists:
                context_info += f"\nRecent similar lists: {', '.join(recent_lists[:3])}"
        
        base_prompt = f"""
        You are an advanced {list_type} parsing system with context awareness.
        Analyze the user's text and extract all distinct items with intelligent categorization.
        
        For each item, extract:
        - name: Clear, concise item name
        - quantity: Amount/unit (be specific: "2 liters", "1 dozen", etc.)
        - category: Smart categorization based on item type
        - priority: Intelligent priority based on context and urgency indicators
        - estimated_price: Realistic price estimate in local currency
        - notes: Additional context, specifications, or tags
        
        Context-aware features:
        - Detect seasonal items and adjust categories
        - Recognize brand preferences and specifications
        - Identify bulk vs individual items
        - Understand urgency from language cues
        - Suggest complementary items when appropriate{context_info}
        
        Respond ONLY with JSON:
        {{
            "items": [
                {{
                    "name": "item name",
                    "quantity": "amount/unit or null",
                    "category": "smart category",
                    "priority": "low/medium/high/urgent",
                    "estimated_price": number or null,
                    "tags": ["tag1", "tag2"],
                    "notes": "additional context or null",
                    "confidence": 0.95
                }}
            ],
            "suggestions": [
                "complementary item 1",
                "complementary item 2"
            ],
            "insights": {{
                "total_estimated_cost": number,
                "category_breakdown": {{"category": count}},
                "urgency_level": "low/medium/high"
            }}
        }}
        """
        
        type_specific_instructions = {
            'shopping': "Focus on grocery/retail items. Consider seasonal availability, brand preferences, and bulk options. Estimate realistic prices.",
            'todo': "Focus on actionable tasks. Detect deadlines, dependencies, and effort levels. Prioritize based on urgency indicators.",
            'packing': "Focus on travel/event items. Consider destination, weather, duration, and activity type.",
            'inventory': "Focus on tracking and organization. Include specifications, conditions, and locations.",
            'wishlist': "Focus on desired items. Include price ranges, alternatives, and priority levels.",
            'checklist': "Focus on verification items. Ensure completeness and logical ordering."
        }
        
        if list_type in type_specific_instructions:
            base_prompt += f"\n\nSpecial instructions for {list_type}: {type_specific_instructions[list_type]}"
        
        return f"{base_prompt}\n\nUser's Text: \"{text}\"\nYour JSON Response:"

    def _enhance_parsed_items(self, parsed_data, list_type, context=None):
        """Post-process parsed items with smart enhancements"""
        try:
            enhanced_items = []
            for item in parsed_data.get('items', []):
                # Smart categorization
                if not item.get('category'):
                    item['category'] = self._auto_categorize_item(item['name'], list_type)
                
                # Auto-tagging (store in notes since tags field doesn't exist)
                if not item.get('tags'):
                    smart_tags = self._generate_smart_tags(item['name'], item.get('category'), list_type)
                    if smart_tags:
                        # Store tags in notes field as a fallback
                        existing_notes = item.get('notes', '') or ''
                        tag_text = f"Tags: {', '.join(smart_tags)}"
                        item['notes'] = f"{existing_notes}\n{tag_text}".strip() if existing_notes else tag_text
                    # Remove tags from item data to avoid model error
                    item.pop('tags', None)
                
                # Price estimation enhancement
                if not item.get('estimated_price') and list_type == 'shopping':
                    item['estimated_price'] = self._estimate_price(item['name'], item.get('quantity'))
                
                enhanced_items.append(item)
            
            parsed_data['items'] = enhanced_items
            return parsed_data
        except Exception as e:
            logger.error(f"Item enhancement failed: {e}")
            return parsed_data
    
    def _auto_categorize_item(self, item_name, list_type):
        """Automatically categorize items based on name and type"""
        category_mappings = {
            'shopping': {
                'fruits': ['apple', 'banana', 'orange', 'grape', 'berry', 'mango', 'pineapple'],
                'vegetables': ['carrot', 'broccoli', 'spinach', 'tomato', 'potato', 'onion', 'pepper'],
                'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs'],
                'meat': ['chicken', 'beef', 'pork', 'fish', 'turkey', 'lamb'],
                'pantry': ['rice', 'pasta', 'bread', 'flour', 'sugar', 'salt', 'oil'],
                'beverages': ['water', 'juice', 'soda', 'coffee', 'tea', 'beer', 'wine'],
                'household': ['detergent', 'soap', 'shampoo', 'toothpaste', 'paper', 'cleaner']
            },
            'todo': {
                'work': ['meeting', 'report', 'email', 'presentation', 'project', 'call'],
                'personal': ['exercise', 'doctor', 'family', 'hobby', 'social', 'self-care'],
                'home': ['clean', 'repair', 'organize', 'maintenance', 'garden', 'cook'],
                'finance': ['pay', 'budget', 'invest', 'tax', 'bank', 'insurance']
            }
        }
        
        item_lower = item_name.lower()
        for category, keywords in category_mappings.get(list_type, {}).items():
            if any(keyword in item_lower for keyword in keywords):
                return category
        
        return 'other'
    
    def _generate_smart_tags(self, item_name, category, list_type):
        """Generate smart tags for items"""
        tags = []
        item_lower = item_name.lower()
        
        # Universal tags
        if any(word in item_lower for word in ['urgent', 'asap', 'important', 'priority']):
            tags.append('urgent')
        if any(word in item_lower for word in ['organic', 'natural', 'bio']):
            tags.append('organic')
        if any(word in item_lower for word in ['large', 'big', 'bulk', 'family']):
            tags.append('bulk')
        
        # Type-specific tags
        if list_type == 'shopping':
            if 'frozen' in item_lower:
                tags.append('frozen')
            if any(word in item_lower for word in ['fresh', 'ripe']):
                tags.append('fresh')
            if category == 'dairy' and any(word in item_lower for word in ['low-fat', 'skim', 'whole']):
                tags.append('dairy-type')
        
        return tags[:3]  # Limit to 3 tags
    
    def _estimate_price(self, item_name, quantity):
        """Estimate price for shopping items"""
        # Basic price estimation (can be enhanced with real price data)
        price_estimates = {
            'milk': 3.50, 'bread': 2.50, 'eggs': 4.00, 'cheese': 6.00,
            'chicken': 8.00, 'beef': 12.00, 'fish': 10.00,
            'apple': 3.00, 'banana': 2.00, 'orange': 4.00,
            'rice': 5.00, 'pasta': 2.50, 'flour': 3.00
        }
        
        item_lower = item_name.lower()
        for key, price in price_estimates.items():
            if key in item_lower:
                # Adjust for quantity if specified
                if quantity and any(word in str(quantity).lower() for word in ['kg', 'liter', 'dozen']):
                    return price * 1.5  # Rough adjustment
                return price
        
        return None
    
    def generate_advanced_suggestions(self, list_obj, context='completion'):
        """Generate advanced AI suggestions with context awareness"""
        if not self._ensure_model():
            return {'suggestions': [], 'insights': {}}
        
        try:
            items_data = []
            for item in list_obj.items.all()[:15]:
                items_data.append({
                    'name': item.name,
                    'category': item.category or 'other',
                    'completed': item.is_completed,
                    'priority': item.priority or 'medium'
                })
            
            user_history = self._get_user_context(list_obj.user, list_obj.list_type)
            
            prompt = f"""
            Analyze this {list_obj.list_type} list: "{list_obj.name}"
            Current items: {json.dumps(items_data)}
            User context: {json.dumps(user_history)}
            
            Provide intelligent suggestions and insights:
            
            {{
                "missing_items": [
                    {{
                        "name": "suggested item",
                        "reason": "why it's suggested",
                        "priority": "low/medium/high",
                        "category": "category"
                    }}
                ],
                "optimization_tips": [
                    "tip for better list management"
                ],
                "completion_insights": {{
                    "estimated_time": "time to complete",
                    "difficulty_level": "easy/medium/hard",
                    "recommended_order": ["item1", "item2"]
                }},
                "seasonal_recommendations": [
                    "seasonal item or tip"
                ],
                "cost_insights": {{
                    "estimated_total": number,
                    "budget_tips": ["tip1", "tip2"]
                }}
            }}
            """
            
            response = self.model.generate_content(prompt)
            cleaned_json = response.text.strip().replace('```json', '').replace('```', '')
            return json.loads(cleaned_json)
        except Exception as e:
            logger.error(f"Advanced suggestions failed: {e}")
            return {'suggestions': [], 'insights': {}}
    
    def _get_user_context(self, user, list_type):
        """Get user context for better suggestions"""
        from .models import List, ListItem
        
        try:
            # Get user's recent lists of same type
            recent_lists = List.objects.filter(
                user=user,
                list_type=list_type,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).exclude(items__isnull=True)[:5]
            
            # Analyze patterns
            common_items = {}
            for list_obj in recent_lists:
                for item in list_obj.items.all():
                    common_items[item.name] = common_items.get(item.name, 0) + 1
            
            # Get top common items
            frequent_items = sorted(common_items.items(), key=lambda x: x[1], reverse=True)[:10]
            
            return {
                'frequent_items': [item[0] for item in frequent_items],
                'list_count': recent_lists.count(),
                'avg_items_per_list': sum(list_obj.items.count() for list_obj in recent_lists) / max(1, recent_lists.count())
            }
        except Exception as e:
            logger.error(f"User context retrieval failed: {e}")
            return {}

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
        """Add items to list using enhanced AI parsing with context"""
        try:
            # Build context for better parsing
            context = self._build_parsing_context(list_obj, user)
            
            # Use enhanced AI parsing
            parsed_data = self.ai_service.parse_list_items(text, list_obj.list_type, context)
            items_created = []
            
            for item_data in parsed_data.get('items', []):
                if not item_data.get('name'):
                    continue
                    
                item = ListItem.objects.create(
                    list=list_obj,
                    name=item_data['name'],
                    description=item_data.get('description'),
                    quantity=item_data.get('quantity'),
                    unit=item_data.get('unit'),
                    category=item_data.get('category'),
                    priority=item_data.get('priority', 'medium'),
                    estimated_price=item_data.get('estimated_price'),
                    notes=item_data.get('notes'),
                    auto_added=True
                )
                items_created.append(item)
            
            # Store AI insights
            if parsed_data.get('insights'):
                list_obj.ai_suggestions = {
                    **list_obj.ai_suggestions,
                    'last_parsing_insights': parsed_data['insights'],
                    'suggested_items': parsed_data.get('suggestions', [])
                }
                list_obj.save()
            
            # Update list completion percentage
            list_obj.update_completion_percentage()
            
            # Log enhanced activity
            ListActivity.objects.create(
                list=list_obj,
                user=user,
                action='item_added',
                description=f'Added {len(items_created)} items via enhanced AI parsing',
                metadata={
                    'items_count': len(items_created), 
                    'source': 'enhanced_ai_parsing',
                    'insights': parsed_data.get('insights', {})
                }
            )
            
            logger.info(f"Added {len(items_created)} enhanced items to list {list_obj.id}")
            
            # Refresh the list object to get the latest state, including completion percentage
            list_obj.refresh_from_db()
            
            return {
                'list': list_obj,
                'items_added_count': len(items_created),
                'insights': parsed_data.get('insights', {}),
                'suggestions': parsed_data.get('suggestions', [])
            }
            
        except Exception as e:
            logger.error(f"Enhanced add items from text failed: {e}")
            raise
    
    def _build_parsing_context(self, list_obj, user):
        """Build context for enhanced AI parsing"""
        try:
            # Get existing items in the list
            existing_items = [item.name for item in list_obj.items.all()[:10]]
            
            # Get user's recent similar lists
            recent_lists = List.objects.filter(
                user=user,
                list_type=list_obj.list_type,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).exclude(id=list_obj.id)[:3]
            
            recent_list_names = [lst.name for lst in recent_lists]
            
            # Get user preferences (can be expanded)
            user_preferences = {
                'preferred_categories': self._get_user_preferred_categories(user, list_obj.list_type),
                'typical_quantities': self._get_typical_quantities(user, list_obj.list_type)
            }
            
            return {
                'existing_items': existing_items,
                'recent_lists': recent_list_names,
                'user_preferences': user_preferences
            }
        except Exception as e:
            logger.error(f"Context building failed: {e}")
            return {}
    
    def _get_user_preferred_categories(self, user, list_type):
        """Get user's most used categories"""
        from django.db.models import Count
        
        try:
            categories = ListItem.objects.filter(
                list__user=user,
                list__list_type=list_type,
                category__isnull=False
            ).values('category').annotate(
                count=Count('category')
            ).order_by('-count')[:5]
            
            return [cat['category'] for cat in categories]
        except Exception as e:
            logger.error(f"Failed to get user preferred categories: {e}")
            return []
    
    def _get_typical_quantities(self, user, list_type):
        """Get typical quantities user uses"""
        try:
            quantities = ListItem.objects.filter(
                list__user=user,
                list__list_type=list_type,
                quantity__isnull=False
            ).values_list('quantity', flat=True)[:20]
            
            return list(set(quantities))
        except Exception as e:
            logger.error(f"Failed to get typical quantities: {e}")
            return []

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
        try:
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
        except Exception as e:
            logger.error(f"Bulk complete items failed: {e}")
            raise

    def _bulk_delete_items(self, user, data):
        """Delete multiple items"""
        try:
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
        except Exception as e:
            logger.error(f"Bulk delete items failed: {e}")
            raise

    def _duplicate_list(self, user, data):
        """Duplicate a list with all its items"""
        try:
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
        except Exception as e:
            logger.error(f"Duplicate list failed: {e}")
            raise

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
            description=f'List created by duplicating \"{original_list.name}\"'
        )
        
        logger.info(f"List {original_list.id} duplicated to {new_list.id} by user {user.id}")
        return new_list

    def get_agenda_for_user(self, user):
        """Get all list items due today or overdue for a user."""
        try:
            today = timezone.now().date()
            
            # Get items due today or that are overdue and not completed
            agenda_items = ListItem.objects.filter(
                list__user=user,
                due_date__lte=today,
                is_completed=False
            ).select_related('list').order_by('due_date', 'priority')
            
            return agenda_items
        except Exception as e:
            logger.error(f"Failed to get agenda for user: {e}")
            return ListItem.objects.none()

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
    """Enhanced service for list templates with AI generation"""
    
    def __init__(self):
        self.ai_service = ListAIService()
    
    def create_template_from_list(self, user, list_obj, template_data):
        """Create a reusable template from an existing list with AI enhancement"""
        try:
            template = ListTemplate.objects.create(
                user=user,
                name=template_data['name'],
                description=template_data.get('description', ''),
                category=template_data.get('category', 'general'),
                is_public=template_data.get('is_public', False)
            )
            
            # Store enhanced list structure in template metadata
            items_data = []
            for item in list_obj.items.all():
                items_data.append({
                    'name': item.name,
                    'quantity': item.quantity,
                    'category': item.category,
                    'priority': item.priority,
                    'estimated_price': float(item.estimated_price) if item.estimated_price else None,
                    # Tags stored in notes field since model doesn't have tags
                    'notes': getattr(item, 'notes', '')
                })
            
            # Generate AI insights for the template
            ai_insights = self._generate_template_insights(list_obj)
            
            template.metadata = {
                'list_type': list_obj.list_type,
                'items': items_data,
                'ai_insights': ai_insights,
                'creation_context': {
                    'source_list_completion': list_obj.completion_percentage,
                    'total_items': len(items_data),
                    'categories': list(set(item.get('category') for item in items_data if item.get('category')))
                }
            }
            template.save()
            
            return template
            
        except Exception as e:
            logger.error(f"Enhanced template creation failed: {e}")
            raise
    
    def _generate_template_insights(self, list_obj):
        """Generate AI insights for template optimization"""
        try:
            if not self.ai_service._ensure_model():
                return {}
            
            items_summary = ', '.join([item.name for item in list_obj.items.all()[:10]])
            
            prompt = f"""
            Analyze this {list_obj.list_type} list template: "{list_obj.name}"
            Items: {items_summary}
            
            Provide template optimization insights:
            {{
                "template_quality_score": 0.85,
                "completeness_assessment": "assessment of how complete this template is",
                "suggested_improvements": ["improvement 1", "improvement 2"],
                "target_audience": "who would benefit from this template",
                "seasonal_relevance": "when this template is most relevant",
                "estimated_completion_time": "time to complete",
                "difficulty_level": "easy/medium/hard"
            }}
            """
            
            response = self.ai_service.model.generate_content(prompt)
            cleaned_json = response.text.strip().replace('```json', '').replace('```', '')
            return json.loads(cleaned_json)
        except Exception as e:
            logger.error(f"Template insights generation failed: {e}")
            return {}
    
    def generate_smart_template(self, user, template_request):
        """Generate a complete template using AI based on user requirements"""
        try:
            if not self.ai_service._ensure_model():
                return None
            
            prompt = f"""
            Generate a comprehensive {template_request.get('list_type', 'checklist')} template.
            
            Requirements:
            - Name: {template_request.get('name', 'Custom Template')}
            - Description: {template_request.get('description', '')}
            - Target: {template_request.get('target_audience', 'general users')}
            - Context: {template_request.get('context', '')}
            
            Create a detailed template with 8-15 relevant items:
            {{
                "template_info": {{
                    "name": "template name",
                    "description": "detailed description",
                    "category": "category",
                    "estimated_time": "completion time",
                    "difficulty": "easy/medium/hard"
                }},
                "items": [
                    {{
                        "name": "item name",
                        "quantity": "quantity or null",
                        "category": "category",
                        "priority": "low/medium/high",
                        "estimated_price": number or null,
                        "notes": "additional context or specifications"
                    }}
                ],
                "usage_tips": [
                    "tip for using this template effectively"
                ],
                "customization_suggestions": [
                    "how users can customize this template"
                ]
            }}
            """
            
            response = self.ai_service.model.generate_content(prompt)
            cleaned_json = response.text.strip().replace('```json', '').replace('```', '')
            template_data = json.loads(cleaned_json)
            
            # Create the template
            template = ListTemplate.objects.create(
                user=user,
                name=template_data['template_info']['name'],
                description=template_data['template_info']['description'],
                category=template_data['template_info'].get('category', 'general'),
                is_public=template_request.get('is_public', False)
            )
            
            template.metadata = {
                'list_type': template_request.get('list_type', 'checklist'),
                'items': template_data['items'],
                'ai_generated': True,
                'generation_context': template_request,
                'usage_tips': template_data.get('usage_tips', []),
                'customization_suggestions': template_data.get('customization_suggestions', [])
            }
            template.save()
            
            logger.info(f"AI-generated template created: {template.id}")
            return template
            
        except Exception as e:
            logger.error(f"Smart template generation failed: {e}")
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
