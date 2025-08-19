# lists/views.py

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.decorators import action
from django.db import models
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied, ValidationError, ObjectDoesNotExist
from .models import List, ListItem, ListTemplate, ListCategory, ListActivity, ListAnalytics, TemplateItem
from .serializers import (
    ListSerializer, ListItemSerializer, ListTemplateSerializer, 
    ListCategorySerializer, ListActivitySerializer, ListAnalyticsSerializer
)

import os
import google.generativeai as genai
import json
from django.utils import timezone
from datetime import datetime, timedelta

# --- ViewSet for Managing Lists (Create, Read, Update, Delete) ---
class ListViewSet(viewsets.ModelViewSet):
    """Enhanced List ViewSet with service layer and advanced features"""
    permission_classes = [IsAuthenticated]
    serializer_class = ListSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        # Ensure users can only see their own lists
        queryset = List.objects.filter(user=self.request.user).prefetch_related(
            'items'
        ).select_related('category')
        
        # Apply search filter
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(items__name__icontains=search)
            ).distinct()
        
        # Apply list type filter
        list_type = self.request.query_params.get('list_type', '')
        if list_type:
            queryset = queryset.filter(list_type=list_type)
        
        # Apply priority filter
        priority = self.request.query_params.get('priority', '')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Apply archived filter
        is_archived = self.request.query_params.get('is_archived', 'false').lower()
        if is_archived == 'true':
            queryset = queryset.filter(is_archived=True)
        else:
            queryset = queryset.filter(is_archived=False)
        
        return queryset

    def perform_create(self, serializer):
        # Automatically assign the logged-in user when a new list is created
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='create_item')
    def create_item(self, request, pk=None):
        """Create a new item in the specified list"""
        try:
            list_obj = self.get_object()
            serializer = ListItemSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(list=list_obj)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a list with a new name"""
        try:
            original_list = self.get_object()
            new_name = request.data.get('name', f"{original_list.name} (Copy)")
            
            # Use service layer for duplication
            from .services import ListService
            duplicated_list = ListService().duplicate_list(original_list, new_name, request.user)
            
            serializer = self.get_serializer(duplicated_list)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_items(self, request, pk=None):
        """Add items using AI parsing"""
        try:
            list_obj = self.get_object()
            text = request.data.get('text', '')
            
            if not text:
                return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            from .services import ListItemService
            items = ListItemService().add_items_with_ai(list_obj, text)
            
            return Response({
                'status': f'Successfully added {len(items)} items',
                'items_count': len(items)
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get analytics for a specific list"""
        try:
            list_obj = self.get_object()
            from .services import ListAnalyticsService
            analytics = ListAnalyticsService().get_list_analytics(list_obj)
            return Response(analytics)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def bulk_operations(self, request):
        """Handle bulk operations on lists"""
        try:
            operation = request.data.get('operation')
            list_ids = request.data.get('list_ids', [])
            
            if not operation or not list_ids:
                return Response({'error': 'Operation and list_ids are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            lists = List.objects.filter(id__in=list_ids, user=request.user)
            
            if operation == 'archive_lists':
                lists.update(is_archived=True)
                return Response({'message': f'Archived {lists.count()} lists'})
            elif operation == 'delete_lists':
                count = lists.count()
                lists.delete()
                return Response({'message': f'Deleted {count} lists'})
            elif operation == 'duplicate_lists':
                from .services import ListService
                list_service = ListService()
                duplicated = []
                for list_obj in lists:
                    dup = list_service.duplicate_list(list_obj, f"{list_obj.name} (Copy)", request.user)
                    duplicated.append(dup)
                return Response({'message': f'Duplicated {len(duplicated)} lists'})
            else:
                return Response({'error': 'Invalid operation'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export lists in various formats"""
        try:
            list_ids = request.data.get('list_ids', [])
            format_type = request.data.get('format', 'csv')
            
            if not list_ids:
                return Response({'error': 'list_ids required'}, status=status.HTTP_400_BAD_REQUEST)
            
            lists = List.objects.filter(id__in=list_ids, user=request.user).prefetch_related('items')
            
            if format_type == 'csv':
                return self._export_csv(lists)
            elif format_type == 'json':
                return self._export_json(lists)
            else:
                return Response({'error': 'Unsupported format'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def _export_csv(self, lists):
        """Export lists as CSV"""
        import csv
        import io
        from datetime import datetime
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['List Name', 'Item Name', 'Quantity', 'Completed', 'Created Date'])
        
        for list_obj in lists:
            for item in list_obj.items.all():
                writer.writerow([
                    list_obj.name,
                    item.name,
                    item.quantity or '',
                    'Yes' if item.is_completed else 'No',
                    item.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])
        
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="lists_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        return response

    def _export_json(self, lists):
        """Export lists as JSON"""
        data = []
        for list_obj in lists:
            list_data = {
                'name': list_obj.name,
                'description': list_obj.description,
                'list_type': list_obj.list_type,
                'created_at': list_obj.created_at.isoformat(),
                'items': []
            }
            for item in list_obj.items.all():
                list_data['items'].append({
                    'name': item.name,
                    'quantity': item.quantity,
                    'is_completed': item.is_completed,
                    'created_at': item.created_at.isoformat()
                })
            data.append(list_data)
        
        response = HttpResponse(json.dumps(data, indent=2), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="lists_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json"'
        return response

# --- Special View for AI-powered "Smart Add" ---
class SmartAddItemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, list_id):
        from .services import ListService
        
        user_text = request.data.get('text')
        if not user_text:
            return Response({'error': 'Text field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_list = List.objects.get(id=list_id, user=request.user)
        except List.DoesNotExist:
            return Response({'error': 'List not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Use enhanced service for AI parsing
            list_service = ListService()
            result = list_service.add_items_from_text(target_list, user_text, request.user)
            
            # Serialize the updated list to return it to the frontend
            updated_list_serializer = ListSerializer(result['list'])
            
            return Response({
                'status': f'Successfully added {result["items_added_count"]} items.',
                'list': updated_list_serializer.data,
                'insights': result.get('insights', {}),
                'suggestions': result.get('suggestions', [])
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Failed to process text with enhanced AI.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



        
class ListItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ListItemSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'item_id'

    def get_queryset(self):
        # Ensure users can only access items from their own lists
        return ListItem.objects.filter(list__user=self.request.user)
    
    def perform_update(self, serializer):
        # Ensure the item belongs to the user's list
        item = self.get_object()
        if item.list.user != self.request.user:
            raise PermissionError("You don't have permission to update this item")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Ensure the item belongs to the user's list
        if instance.list.user != self.request.user:
            raise PermissionError("You don't have permission to delete this item")
        instance.delete()
    
class AgendaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Find the user's most recently updated list
            latest_list = List.objects.filter(user=request.user).latest('updated_at')

            # Get the top 5 uncompleted items from that list
            agenda_items = ListItem.objects.filter(
                list=latest_list, 
                is_completed=False
            ).order_by('created_at')[:5]

            serializer = ListItemSerializer(agenda_items, many=True)

            response_data = {
                'list_name': latest_list.name,
                'items': serializer.data
            }
            return Response(response_data)

        except List.DoesNotExist:
            # If the user has no lists, return an empty state
            return Response({'list_name': None, 'items': []})


# --- Analytics View ---
class ListAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_completion_trends(self, user, period):
        """
        Calculates the number of items completed per day over a given period.
        """
        end_date = timezone.now()
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'quarter':
            start_date = end_date - timedelta(days=90)
        else:  # 'year'
            start_date = end_date - timedelta(days=365)

        # This will hold our daily data points
        trends = []
        current_date = start_date.date()
        end_date_only = end_date.date()
        
        # Loop through each day in the period
        while current_date <= end_date_only:
            # Count items for the current user that were completed on this specific day
            completed_count = ListItem.objects.filter(
                list__user=user,
                is_completed=True,
                completed_at__date=current_date
            ).count()
            
            trends.append({
                'date': current_date.isoformat(),
                'completed_items': completed_count
            })
            # Move to the next day
            current_date += timedelta(days=1)
        
        return trends

    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'month')
        
        # Get user's lists
        user_lists = List.objects.filter(user=user)
        total_lists = user_lists.count()
        active_lists = user_lists.filter(is_archived=False).count()
        
        # Get user's items
        user_items = ListItem.objects.filter(list__user=user)
        total_items = user_items.count()
        completed_items = user_items.filter(is_completed=True).count()
        
        # Calculate completion rate
        completion_rate = (completed_items / total_items * 100) if total_items > 0 else 0
        
        # Category breakdown
        category_data = {}
        for list_obj in user_lists:
            list_type = list_obj.list_type or 'other'
            category_data[list_type] = category_data.get(list_type, 0) + 1
        
        # Mock insights for now
        insights = [
            {
                'title': 'Productivity Insight',
                'description': f'You have completed {completed_items} out of {total_items} items',
                'type': 'success'
            },
            {
                'title': 'List Management',
                'description': f'You have {active_lists} active lists to focus on',
                'type': 'info'
            }
        ]
        
        # *** NEW: Call the method to get the trends data ***
        completion_trends_data = self._get_completion_trends(user, period)
        
        return Response({
            'total_lists': total_lists,
            'active_lists': active_lists,
            'completed_lists': total_lists - active_lists,
            'total_items': total_items,
            'completed_items': completed_items,
            'completion_rate': round(completion_rate, 1),
            'productivity_score': min(100, round(completion_rate * 1.2, 1)),
            'category_breakdown': category_data,
            'insights': insights,
            'period': period,
            # *** NEW: Add the trends data to the response ***
            'completion_trends': completion_trends_data,
        })


# --- View for List Insights ---
class ListInsightsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, list_id):
        """Get AI-powered insights for a specific list"""
        try:
            # Verify the list exists and belongs to the user
            try:
                list_obj = List.objects.get(id=list_id, user=request.user)
            except List.DoesNotExist:
                return Response(
                    {'error': 'List not found or you do not have permission to access it'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Use service layer for insights
            from .services import ListAIService
            insights = ListAIService().generate_list_insights(list_obj)
            
            return Response({
                'list_id': list_obj.id,
                'list_name': list_obj.name,
                'insights': insights,
                'generated_at': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Enhanced Template View ---
class ListTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ListTemplateSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        # Get user's templates and public templates
        queryset = ListTemplate.objects.filter(
            models.Q(user=self.request.user) | models.Q(is_public=True)
        )
        
        # Apply search filter
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        # Apply category filter
        category = self.request.query_params.get('category', '')
        if category and category != 'all':
            queryset = queryset.filter(category=category)
            
        # Apply template type filter
        template_type = self.request.query_params.get('template_type', '')
        if template_type:
            queryset = queryset.filter(template_type=template_type)
            
        # Apply popularity filter
        sort_by = self.request.query_params.get('sort_by', '')
        if sort_by == 'popularity':
            queryset = queryset.annotate(usage_count=models.Count('usage_stats')).order_by('-usage_count')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-created_at')
        else:
            queryset = queryset.order_by('-created_at')
        
        return queryset

    def list(self, request):
        # Get filtered templates
        templates = self.get_queryset()
        serializer = self.get_serializer(templates, many=True)
        
        # Add user_name to each template
        for template_data in serializer.data:
            template = templates.get(id=template_data['id'])
            template_data['user_name'] = template.user.username
        
        return Response({
            'results': serializer.data,
            'count': len(serializer.data)
        })

    def create(self, request):
        # Create a new template
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Track template usage
        if instance.is_public or instance.user == request.user:
            from .services import ListTemplateService
            ListTemplateService().track_template_usage(instance, request.user)
            
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
        
    def create_list(self, request, pk=None):
        """Create a new list from this template"""
        try:
            # Print debug info
            print("Request data:", request.data)
            print("Template ID:", pk)
            
            # Get the template
            try:
                template = ListTemplate.objects.get(id=pk)
                print("Found template:", template.id, template.name)
            except ListTemplate.DoesNotExist as e:
                print("Template not found:", str(e))
                return Response(
                    {'error': f'Template not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get or default name and description
            name = request.data.get('name', template.name)
            description = request.data.get('description', template.description)
            print("Creating list with name:", name)
            
            try:
                # Create new list
                new_list = List.objects.create(
                    user=request.user,
                    name=name,
                    description=description,
                    list_type='checklist',
                    template=template,
                    is_shared=False  # Default value for new lists
                )
                print("Created new list:", new_list.id)
                
                # Copy template items if they exist
                template_items = template.template_items.all()
                print(f"Found {template_items.count()} template items")
                
                for item in template_items:
                    ListItem.objects.create(
                        list=new_list,
                        name=item.name,
                        description=item.description,
                        quantity=item.quantity,
                        unit=item.unit,
                        priority=item.priority,
                        category=item.category,
                        brand=item.brand,
                        price=item.price,
                        estimated_price=item.estimated_price,
                        notes=item.notes,
                        url=item.url,
                        image_url=item.image_url
                    )
                
                # Increment template use count
                template.use_count += 1
                template.save()
                
                # Return the created list
                list_serializer = ListSerializer(new_list)
                return Response(list_serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as create_error:
                print("Error creating list:", str(create_error))
                if 'new_list' in locals():
                    new_list.delete()  # Cleanup on error
                return Response(
                    {'error': f'Error creating list: {str(create_error)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print("Unexpected error:", str(e))
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """Get recommended templates based on user history"""
        try:
            from .services import ListTemplateService
            recommended = ListTemplateService().get_recommended_templates(request.user)
            
            serializer = self.get_serializer(recommended, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# --- Create List From Template View ---
class CreateListFromTemplateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, template_id):
        try:
            # Get the template
            template = ListTemplate.objects.get(
                models.Q(id=template_id) & (models.Q(user=request.user) | models.Q(is_public=True))
            )
            
            # Get list data
            list_name = request.data.get('name', template.name)
            list_description = request.data.get('description', template.description)
            
            # Create new list from template
            new_list = List.objects.create(
                user=request.user,
                name=list_name,
                description=list_description,
                list_type='checklist',  # Default type for template-created lists
                template=template
            )
            
            # Increment template use count
            template.use_count += 1
            template.save()
            
            serializer = ListSerializer(new_list)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ListTemplate.DoesNotExist:
            return Response({'error': 'Template not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- ViewSet for Managing List Items (Create, Read, Update, Delete) ---
class ListItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ListItemSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'
    
    def get_queryset(self):
        # Ensure users can only see items from their own lists
        queryset = ListItem.objects.filter(list__user=self.request.user)
        
        # Apply filters
        list_id = self.request.query_params.get('list_id')
        if list_id:
            queryset = queryset.filter(list_id=list_id)
            
        is_completed = self.request.query_params.get('is_completed')
        if is_completed is not None:
            is_completed_bool = is_completed.lower() == 'true'
            queryset = queryset.filter(is_completed=is_completed_bool)
            
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset
    
    def perform_create(self, serializer):
        # Verify the list belongs to the user
        list_id = self.request.data.get('list')
        if list_id:
            try:
                list_obj = List.objects.get(id=list_id, user=self.request.user)
                serializer.save(list=list_obj)
            except List.DoesNotExist:
                raise PermissionDenied("You do not have permission to add items to this list")
        else:
            raise ValidationError("List ID is required")
    
    @action(detail=True, methods=['post'])
    def toggle_completed(self, request, pk=None):
        """Toggle the completed status of an item"""
        try:
            item = self.get_object()
            item.is_completed = not item.is_completed
            item.save()
            return Response({'status': 'success', 'is_completed': item.is_completed})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    @action(detail=False, methods=['post'])
    def bulk_toggle(self, request):
        """Toggle completion status for multiple items"""
        try:
            item_ids = request.data.get('item_ids', [])
            action = request.data.get('action')
            
            if not item_ids or not action:
                return Response({'error': 'item_ids and action are required'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Ensure user can only modify their own items
            items = ListItem.objects.filter(id__in=item_ids, list__user=request.user)
            
            if action == 'complete':
                items.update(is_completed=True)
                return Response({'message': f'Marked {items.count()} items as completed'})
            elif action == 'incomplete':
                items.update(is_completed=False)
                return Response({'message': f'Marked {items.count()} items as incomplete'})
            elif action == 'delete':
                count = items.count()
                items.delete()
                return Response({'message': f'Deleted {count} items'})
            else:
                return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    @action(detail=False, methods=['post'])
    def categorize(self, request):
        """Categorize multiple items"""
        try:
            item_ids = request.data.get('item_ids', [])
            category = request.data.get('category')
            
            if not item_ids or category is None:
                return Response({'error': 'item_ids and category are required'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Ensure user can only modify their own items
            items = ListItem.objects.filter(id__in=item_ids, list__user=request.user)
            items.update(category=category)
            
            return Response({'message': f'Updated category for {items.count()} items'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def create_from_list(self, request):
        """Create an enhanced template from an existing list"""
        from .services import ListTemplateService
        
        list_id = request.data.get('list_id')
        template_name = request.data.get('name')
        template_description = request.data.get('description', '')
        is_public = request.data.get('is_public', False)
        category = request.data.get('category', 'general')
        
        if not list_id or not template_name:
            return Response({'error': 'list_id and name are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            source_list = List.objects.get(id=list_id, user=request.user)
            
            # Use enhanced template service
            template_service = ListTemplateService()
            template_data = {
                'name': template_name,
                'description': template_description,
                'category': category,
                'is_public': is_public
            }
            
            template = template_service.create_template_from_list(
                request.user, source_list, template_data
            )
            
            serializer = ListTemplateSerializer(template)
            response_data = serializer.data
            response_data['ai_insights'] = template.metadata.get('ai_insights', {})
            response_data['enhanced_features'] = {
                'ai_insights': True,
                'quality_assessment': True,
                'optimization_suggestions': True
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except List.DoesNotExist:
            return Response({'error': 'Source list not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def generate_smart_template(self, request):
        """Generate a complete template using AI"""
        from .services import ListTemplateService
        
        template_request = {
            'name': request.data.get('name', 'AI Generated Template'),
            'description': request.data.get('description', ''),
            'list_type': request.data.get('list_type', 'checklist'),
            'target_audience': request.data.get('target_audience', 'general users'),
            'context': request.data.get('context', ''),
            'is_public': request.data.get('is_public', False)
        }
        
        if not template_request['name']:
            return Response({'error': 'Template name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            template_service = ListTemplateService()
            template = template_service.generate_smart_template(request.user, template_request)
            
            if not template:
                return Response({'error': 'AI service not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            serializer = ListTemplateSerializer(template)
            response_data = serializer.data
            response_data['ai_generated'] = True
            response_data['usage_tips'] = template.metadata.get('usage_tips', [])
            response_data['customization_suggestions'] = template.metadata.get('customization_suggestions', [])
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def get_suggestions(self, request, pk=None):
        """Get AI suggestions for improving a template"""
        try:
            template = self.get_object()
            
            # Return stored AI insights if available
            ai_insights = template.metadata.get('ai_insights', {})
            if ai_insights:
                return Response({
                    'template_insights': ai_insights,
                    'usage_tips': template.metadata.get('usage_tips', []),
                    'customization_suggestions': template.metadata.get('customization_suggestions', [])
                })
            else:
                return Response({'message': 'No AI insights available for this template'})
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- Enhanced AI Suggestions View ---
class ListSuggestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, list_id):
        """Get AI-powered suggestions for list improvement"""
        from .services import ListService
        
        try:
            target_list = List.objects.get(id=list_id, user=request.user)
            list_service = ListService()
            
            suggestions = list_service.ai_service.generate_advanced_suggestions(target_list)
            
            return Response({
                'list_name': target_list.name,
                'suggestions': suggestions,
                'enhanced_features': {
                    'context_aware_suggestions': True,
                    'completion_insights': True,
                    'cost_analysis': True,
                    'seasonal_recommendations': True
                }
            })
            
        except List.DoesNotExist:
            return Response({'error': 'List not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- Smart List Completion Detection ---
class SmartCompletionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, list_id):
        """Detect if list is logically complete and suggest next actions"""
        try:
            target_list = List.objects.get(id=list_id, user=request.user)
            
            # Calculate completion metrics
            total_items = target_list.items.count()
            completed_items = target_list.items.filter(is_completed=True).count()
            completion_rate = (completed_items / total_items * 100) if total_items > 0 else 0
            
            # Smart completion detection
            is_logically_complete = completion_rate >= 80
            has_critical_items = target_list.items.filter(
                is_completed=False, 
                priority__in=['high', 'urgent']
            ).exists()
            
            suggestions = []
            if is_logically_complete and not has_critical_items:
                suggestions.extend([
                    "Consider archiving this list as it appears to be complete",
                    "Create a template from this list for future use",
                    "Review completed items for any follow-up actions"
                ])
            elif has_critical_items:
                suggestions.extend([
                    "Focus on completing high-priority items first",
                    "Consider breaking down complex items into smaller tasks"
                ])
            
            return Response({
                'completion_analysis': {
                    'completion_rate': round(completion_rate, 1),
                    'is_logically_complete': is_logically_complete,
                    'has_critical_items': has_critical_items,
                    'total_items': total_items,
                    'completed_items': completed_items
                },
                'smart_suggestions': suggestions,
                'next_actions': {
                    'can_archive': is_logically_complete and not has_critical_items,
                    'should_focus_priorities': has_critical_items,
                    'ready_for_template': completion_rate >= 60
                }
            })
            
        except List.DoesNotExist:
            return Response({'error': 'List not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)