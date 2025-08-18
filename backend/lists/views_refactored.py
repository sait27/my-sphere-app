# lists/views_refactored.py

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.contrib.auth.models import User
from django.db import models, transaction
from django.utils import timezone
from django.http import HttpResponse
from django.core.exceptions import ValidationError

from . import models as list_models
from .models import List, ListItem, ListTemplate, ListCategory, ListShare, ListActivity, ListAnalytics
from .serializers import (
    ListSerializer, ListItemSerializer, ListTemplateSerializer,
    ListCategorySerializer, ListShareSerializer, ListActivitySerializer,
    ListAnalyticsSerializer
)
from .services import ListService, ListItemService, ListTemplateService, ListAnalyticsService
from .validators import ListValidator, ListItemValidator

import os
import json
import csv
import io
from datetime import datetime, timedelta
import google.generativeai as genai


class ListViewSetRefactored(viewsets.ModelViewSet):
    """Enhanced List ViewSet with service layer and advanced features"""
    permission_classes = [IsAuthenticated]
    serializer_class = ListSerializer

    def get_queryset(self):
        return List.objects.filter(user=self.request.user).prefetch_related('items', 'categories', 'shares')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a list with a new name"""
        try:
            original_list = self.get_object()
            new_name = request.data.get('name', f"{original_list.name} (Copy)")
            
            duplicated_list = ListService.duplicate_list(original_list, new_name, request.user)
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
            
            items = ListItemService.add_items_with_ai(list_obj, text)
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
            analytics = ListAnalyticsService.get_list_analytics(list_obj)
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
                duplicated = []
                for list_obj in lists:
                    dup = ListService.duplicate_list(list_obj, f"{list_obj.name} (Copy)", request.user)
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


class ListItemViewSetRefactored(viewsets.ModelViewSet):
    """Enhanced ListItem ViewSet with service layer"""
    permission_classes = [IsAuthenticated]
    serializer_class = ListItemSerializer

    def get_queryset(self):
        return ListItem.objects.filter(list__user=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_operations(self, request):
        """Handle bulk operations on items"""
        try:
            operation = request.data.get('operation')
            item_ids = request.data.get('item_ids', [])
            
            if not operation or not item_ids:
                return Response({'error': 'Operation and item_ids are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            items = ListItem.objects.filter(id__in=item_ids, list__user=request.user)
            
            if operation == 'bulk_complete':
                items.update(is_completed=True)
                return Response({'message': f'Completed {items.count()} items'})
            elif operation == 'bulk_incomplete':
                items.update(is_completed=False)
                return Response({'message': f'Marked {items.count()} items as incomplete'})
            elif operation == 'bulk_delete_items':
                count = items.count()
                items.delete()
                return Response({'message': f'Deleted {count} items'})
            else:
                return Response({'error': 'Invalid operation'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ListTemplateViewSetRefactored(viewsets.ModelViewSet):
    """Enhanced ListTemplate ViewSet"""
    permission_classes = [IsAuthenticated]
    serializer_class = ListTemplateSerializer

    def get_queryset(self):
        # Return both user's templates and public templates
        return ListTemplate.objects.filter(
            models.Q(user=self.request.user) | models.Q(is_public=True)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def create_list(self, request, pk=None):
        """Create a list from this template"""
        try:
            template = self.get_object()
            list_name = request.data.get('name', f"List from {template.name}")
            
            new_list = ListTemplateService.create_list_from_template(template, list_name, request.user)
            
            # Increment use count
            template.use_count += 1
            template.save()
            
            serializer = ListSerializer(new_list)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ListAnalyticsViewRefactored(APIView):
    """Enhanced analytics view with comprehensive insights"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            period = request.query_params.get('period', 'month')
            analytics = ListAnalyticsService.get_user_analytics(request.user, period)
            return Response(analytics)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ListInsightsView(APIView):
    """AI-powered insights and recommendations"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            insights = ListAnalyticsService.get_ai_insights(request.user)
            return Response(insights)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ListShareViewSet(viewsets.ModelViewSet):
    """Handle list sharing functionality"""
    permission_classes = [IsAuthenticated]
    serializer_class = ListShareSerializer

    def get_queryset(self):
        return ListShare.objects.filter(
            models.Q(list__user=self.request.user) | models.Q(shared_with=self.request.user)
        )

    @action(detail=False, methods=['post'])
    def share_list(self, request):
        """Share a list with another user"""
        try:
            list_id = request.data.get('list_id')
            email = request.data.get('email')
            permission = request.data.get('permission', 'view')
            
            if not list_id or not email:
                return Response({'error': 'list_id and email are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            list_obj = List.objects.get(id=list_id, user=request.user)
            shared_with_user = User.objects.get(email=email)
            
            share, created = ListShare.objects.get_or_create(
                list=list_obj,
                shared_with=shared_with_user,
                defaults={'permission': permission, 'shared_by': request.user}
            )
            
            if not created:
                share.permission = permission
                share.save()
            
            serializer = self.get_serializer(share)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except List.DoesNotExist:
            return Response({'error': 'List not found'}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
