from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta
import json
from .models import List, ListItem, ListTemplate, ListCategory, ListShare, ListActivity
from .serializers import ListSerializer, ListItemSerializer

class ListAdvancedViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def create_from_template(self, request):
        """Create a new list from a template"""
        template_id = request.data.get('template_id')
        list_name = request.data.get('name')
        
        try:
            template = ListTemplate.objects.get(id=template_id)
            
            # Create new list
            new_list = List.objects.create(
                user=request.user,
                name=list_name or template.name,
                description=template.description,
                list_type='checklist',
                template=template
            )
            
            # Increment template usage
            template.use_count += 1
            template.save()
            
            return Response({
                'list_id': new_list.id,
                'message': 'List created from template successfully'
            })
            
        except ListTemplate.DoesNotExist:
            return Response(
                {'error': 'Template not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def smart_add_items(self, request):
        """Add items to list using AI parsing"""
        list_id = request.data.get('list_id')
        text_input = request.data.get('text')
        
        try:
            list_obj = List.objects.get(id=list_id, user=request.user)
            
            # Simple parsing logic (can be enhanced with AI)
            items = []
            lines = text_input.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Parse quantity and name
                parts = line.split(' ', 1)
                if len(parts) == 2 and parts[0].replace('.', '').isdigit():
                    quantity = parts[0]
                    name = parts[1]
                else:
                    quantity = '1'
                    name = line
                
                # Create list item
                item = ListItem.objects.create(
                    list=list_obj,
                    name=name,
                    quantity=quantity,
                    auto_added=True
                )
                items.append({
                    'id': item.id,
                    'name': item.name,
                    'quantity': item.quantity
                })
            
            # Log activity
            ListActivity.objects.create(
                list=list_obj,
                user=request.user,
                action='item_added',
                description=f'Added {len(items)} items via smart input'
            )
            
            return Response({
                'added_items': items,
                'count': len(items)
            })
            
        except List.DoesNotExist:
            return Response(
                {'error': 'List not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def share_list(self, request):
        """Share a list with other users"""
        list_id = request.data.get('list_id')
        user_emails = request.data.get('user_emails', [])
        permission_level = request.data.get('permission_level', 'view')
        
        try:
            list_obj = List.objects.get(id=list_id, user=request.user)
            
            shared_count = 0
            for email in user_emails:
                try:
                    from django.contrib.auth.models import User
                    user = User.objects.get(email=email)
                    
                    # Create or update share
                    share, created = ListShare.objects.get_or_create(
                        list=list_obj,
                        user=user,
                        defaults={
                            'permission_level': permission_level,
                            'shared_by': request.user
                        }
                    )
                    
                    if created:
                        shared_count += 1
                        
                        # Log activity
                        ListActivity.objects.create(
                            list=list_obj,
                            user=request.user,
                            action='shared',
                            description=f'Shared with {user.email}'
                        )
                        
                except User.DoesNotExist:
                    continue
            
            # Update list sharing status
            list_obj.is_shared = True
            list_obj.save()
            
            return Response({
                'shared_count': shared_count,
                'message': f'List shared with {shared_count} users'
            })
            
        except List.DoesNotExist:
            return Response(
                {'error': 'List not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get list analytics"""
        user = request.user
        period = request.query_params.get('period', 'month')
        
        # Calculate date range
        today = timezone.now().date()
        if period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today.replace(day=1)
        else:  # year
            start_date = today.replace(month=1, day=1)
        
        # Get lists in period
        lists = List.objects.filter(
            user=user,
            created_at__date__gte=start_date,
            created_at__date__lte=today
        )
        
        # Basic stats
        total_lists = lists.count()
        completed_lists = lists.filter(completion_percentage=100).count()
        total_items = ListItem.objects.filter(list__in=lists).count()
        completed_items = ListItem.objects.filter(
            list__in=lists,
            is_completed=True
        ).count()
        
        # List type breakdown
        type_stats = lists.values('list_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Completion rate by list type
        completion_stats = []
        for list_type in ['checklist', 'shopping', 'todo', 'wishlist']:
            type_lists = lists.filter(list_type=list_type)
            if type_lists.exists():
                avg_completion = type_lists.aggregate(
                    avg=Avg('completion_percentage')
                )['avg'] or 0
                completion_stats.append({
                    'list_type': list_type,
                    'average_completion': round(avg_completion, 2)
                })
        
        # Most productive days
        daily_stats = lists.extra(
            select={'day': 'date(created_at)'}
        ).values('day').annotate(
            lists_created=Count('id')
        ).order_by('-lists_created')[:7]
        
        return Response({
            'period': period,
            'summary': {
                'total_lists': total_lists,
                'completed_lists': completed_lists,
                'completion_rate': round((completed_lists / max(total_lists, 1)) * 100, 2),
                'total_items': total_items,
                'completed_items': completed_items,
                'item_completion_rate': round((completed_items / max(total_items, 1)) * 100, 2)
            },
            'list_type_breakdown': list(type_stats),
            'completion_by_type': completion_stats,
            'daily_activity': list(daily_stats)
        })
    
    @action(detail=False, methods=['post'])
    def duplicate_list(self, request):
        """Duplicate an existing list"""
        list_id = request.data.get('list_id')
        new_name = request.data.get('name')
        include_completed = request.data.get('include_completed', False)
        
        try:
            original_list = List.objects.get(id=list_id, user=request.user)
            
            # Create duplicate list
            new_list = List.objects.create(
                user=request.user,
                name=new_name or f"{original_list.name} (Copy)",
                description=original_list.description,
                list_type=original_list.list_type,
                priority=original_list.priority,
                auto_sort=original_list.auto_sort,
                sort_by=original_list.sort_by
            )
            
            # Copy items
            items_to_copy = original_list.items.all()
            if not include_completed:
                items_to_copy = items_to_copy.filter(is_completed=False)
            
            copied_count = 0
            for item in items_to_copy:
                ListItem.objects.create(
                    list=new_list,
                    name=item.name,
                    description=item.description,
                    quantity=item.quantity,
                    unit=item.unit,
                    priority=item.priority,
                    category=item.category,
                    brand=item.brand,
                    estimated_price=item.estimated_price,
                    notes=item.notes,
                    url=item.url,
                    order=item.order
                )
                copied_count += 1
            
            return Response({
                'new_list_id': new_list.id,
                'copied_items': copied_count,
                'message': 'List duplicated successfully'
            })
            
        except List.DoesNotExist:
            return Response(
                {'error': 'List not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def bulk_operations(self, request):
        """Perform bulk operations on list items"""
        list_id = request.data.get('list_id')
        item_ids = request.data.get('item_ids', [])
        operation = request.data.get('operation')  # complete, delete, move, categorize
        
        try:
            list_obj = List.objects.get(id=list_id, user=request.user)
            items = ListItem.objects.filter(id__in=item_ids, list=list_obj)
            
            if operation == 'complete':
                updated_count = items.update(
                    is_completed=True,
                    completed_at=timezone.now(),
                    completed_by=request.user
                )
            elif operation == 'delete':
                updated_count = items.count()
                items.delete()
            elif operation == 'categorize':
                category = request.data.get('category')
                updated_count = items.update(category=category)
            elif operation == 'move':
                target_list_id = request.data.get('target_list_id')
                target_list = List.objects.get(id=target_list_id, user=request.user)
                updated_count = items.update(list=target_list)
            else:
                return Response(
                    {'error': 'Invalid operation'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update completion percentages
            list_obj.update_completion_percentage()
            if operation == 'move':
                target_list.update_completion_percentage()
            
            return Response({
                'updated_count': updated_count,
                'operation': operation
            })
            
        except List.DoesNotExist:
            return Response(
                {'error': 'List not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """Get AI suggestions for list improvements"""
        list_id = request.query_params.get('list_id')
        
        try:
            list_obj = List.objects.get(id=list_id, user=request.user)
            
            suggestions = []
            
            # Suggest missing common items for shopping lists
            if list_obj.list_type == 'shopping':
                common_items = ['milk', 'bread', 'eggs', 'butter', 'rice']
                existing_items = set(item.name.lower() for item in list_obj.items.all())
                
                for item in common_items:
                    if item not in existing_items:
                        suggestions.append({
                            'type': 'add_item',
                            'suggestion': f"Consider adding '{item}' to your shopping list",
                            'item_name': item
                        })
            
            # Suggest organizing by categories
            if list_obj.items.filter(category__isnull=True).count() > 3:
                suggestions.append({
                    'type': 'organize',
                    'suggestion': 'Consider organizing items by categories for better shopping experience'
                })
            
            # Suggest price estimates for budgeting
            if list_obj.list_type == 'shopping' and list_obj.items.filter(estimated_price__isnull=True).count() > 0:
                suggestions.append({
                    'type': 'budget',
                    'suggestion': 'Add price estimates to track your shopping budget'
                })
            
            return Response({
                'suggestions': suggestions,
                'count': len(suggestions)
            })
            
        except List.DoesNotExist:
            return Response(
                {'error': 'List not found'},
                status=status.HTTP_404_NOT_FOUND
            )
