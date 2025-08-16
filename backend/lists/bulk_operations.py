from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import List, ListItem
import logging

logger = logging.getLogger(__name__)


class ListBulkOperationsView(APIView):
    """Handle bulk operations on lists"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        operation = request.data.get('operation')
        list_ids = request.data.get('list_ids', [])
        
        if not operation or not list_ids:
            return Response(
                {'error': 'Operation and list_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user's lists
        user_lists = List.objects.filter(
            user=request.user, 
            id__in=list_ids
        )

        if not user_lists.exists():
            return Response(
                {'error': 'No valid lists found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            with transaction.atomic():
                result = self._execute_bulk_operation(operation, user_lists, request.data)
                return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Bulk operation failed: {str(e)}")
            return Response(
                {'error': f'Bulk operation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _execute_bulk_operation(self, operation, lists, data):
        """Execute the specified bulk operation"""
        updated_count = 0
        
        if operation == 'delete':
            count = lists.count()
            lists.delete()
            return {
                'message': f'Successfully deleted {count} lists',
                'updated_count': count
            }
        
        elif operation == 'archive':
            updated_count = lists.update(
                is_archived=True,
                updated_at=timezone.now()
            )
            return {
                'message': f'Successfully archived {updated_count} lists',
                'updated_count': updated_count
            }
        
        elif operation == 'unarchive':
            updated_count = lists.update(
                is_archived=False,
                updated_at=timezone.now()
            )
            return {
                'message': f'Successfully unarchived {updated_count} lists',
                'updated_count': updated_count
            }
        
        elif operation == 'mark_favorite':
            updated_count = lists.update(
                is_favorite=True,
                updated_at=timezone.now()
            )
            return {
                'message': f'Successfully marked {updated_count} lists as favorite',
                'updated_count': updated_count
            }
        
        elif operation == 'unmark_favorite':
            updated_count = lists.update(
                is_favorite=False,
                updated_at=timezone.now()
            )
            return {
                'message': f'Successfully unmarked {updated_count} lists as favorite',
                'updated_count': updated_count
            }
        
        elif operation == 'change_category':
            category = data.get('category')
            if not category:
                raise ValueError('Category is required for change_category operation')
            
            updated_count = lists.update(
                category=category,
                updated_at=timezone.now()
            )
            return {
                'message': f'Successfully changed category for {updated_count} lists',
                'updated_count': updated_count
            }
        
        elif operation == 'change_priority':
            priority = data.get('priority')
            if not priority:
                raise ValueError('Priority is required for change_priority operation')
            
            updated_count = lists.update(
                priority=priority,
                updated_at=timezone.now()
            )
            return {
                'message': f'Successfully changed priority for {updated_count} lists',
                'updated_count': updated_count
            }
        
        else:
            raise ValueError(f'Unknown operation: {operation}')


class ListItemBulkOperationsView(APIView):
    """Handle bulk operations on list items"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        operation = request.data.get('operation')
        item_ids = request.data.get('item_ids', [])
        list_id = request.data.get('list_id')
        
        if not operation or not item_ids:
            return Response(
                {'error': 'Operation and item_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user's list items
        query = ListItem.objects.filter(id__in=item_ids)
        if list_id:
            query = query.filter(list_id=list_id, list__user=request.user)
        else:
            query = query.filter(list__user=request.user)

        user_items = query.all()

        if not user_items:
            return Response(
                {'error': 'No valid items found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            with transaction.atomic():
                result = self._execute_bulk_operation(operation, user_items, request.data)
                return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Bulk operation failed: {str(e)}")
            return Response(
                {'error': f'Bulk operation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _execute_bulk_operation(self, operation, items, data):
        """Execute the specified bulk operation on items"""
        updated_count = 0
        
        if operation == 'delete':
            count = len(items)
            for item in items:
                item.delete()
            return {
                'message': f'Successfully deleted {count} items',
                'updated_count': count
            }
        
        elif operation == 'complete':
            for item in items:
                item.is_completed = True
                item.completed_at = timezone.now()
                item.save()
                updated_count += 1
            return {
                'message': f'Successfully completed {updated_count} items',
                'updated_count': updated_count
            }
        
        elif operation == 'uncomplete':
            for item in items:
                item.is_completed = False
                item.completed_at = None
                item.save()
                updated_count += 1
            return {
                'message': f'Successfully uncompleted {updated_count} items',
                'updated_count': updated_count
            }
        
        elif operation == 'change_priority':
            priority = data.get('priority')
            if not priority:
                raise ValueError('Priority is required for change_priority operation')
            
            for item in items:
                item.priority = priority
                item.save()
                updated_count += 1
            return {
                'message': f'Successfully changed priority for {updated_count} items',
                'updated_count': updated_count
            }
        
        elif operation == 'move_to_list':
            target_list_id = data.get('target_list_id')
            if not target_list_id:
                raise ValueError('target_list_id is required for move_to_list operation')
            
            # Verify target list exists and belongs to user
            try:
                target_list = List.objects.get(id=target_list_id, user=items[0].list.user)
            except List.DoesNotExist:
                raise ValueError('Target list not found or access denied')
            
            for item in items:
                item.list = target_list
                item.save()
                updated_count += 1
            return {
                'message': f'Successfully moved {updated_count} items to {target_list.name}',
                'updated_count': updated_count
            }
        
        else:
            raise ValueError(f'Unknown operation: {operation}')
