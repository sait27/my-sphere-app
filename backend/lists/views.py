# lists/views.py

import logging
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db import models
from django.db.models import Avg
from django.http import HttpResponse
from .models import List, ListItem, ListTemplate
from .serializers import ListSerializer, ListItemSerializer, ListTemplateSerializer
from datetime import datetime, date


logger = logging.getLogger(__name__)



class ListViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ListSerializer

    def get_queryset(self):
        return List.objects.filter(user=self.request.user).prefetch_related('items')

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except Exception as e:
            logger.error(f"List creation failed: {e}")
            raise e
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                self.perform_create(serializer)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"List creation validation failed: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"List creation error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='shopping-mode')
    def shopping_mode(self, request, pk=None):
        try:
            list_obj = self.get_object()
            
            # Update list type to shopping if not already
            if list_obj.list_type != 'shopping':
                list_obj.list_type = 'shopping'
                list_obj.save()
            
            # Calculate shopping totals
            estimated_total = list_obj.items.filter(
                estimated_price__isnull=False
            ).aggregate(total=models.Sum('estimated_price'))['total'] or 0
            
            actual_total = list_obj.items.filter(
                price__isnull=False, is_completed=True
            ).aggregate(total=models.Sum('price'))['total'] or 0
            
            pending_items = list_obj.items.filter(is_completed=False).count()
            completed_items = list_obj.items.filter(is_completed=True).count()
            
            shopping_data = {
                'list': ListSerializer(list_obj).data,
                'shopping_features': {
                    'price_tracking': True,
                    'cart_mode': True,
                    'receipt_generation': True,
                    'quantity_tracking': True
                },
                'totals': {
                    'estimated_total': float(estimated_total),
                    'actual_total': float(actual_total),
                    'pending_items': pending_items,
                    'completed_items': completed_items,
                    'completion_percentage': (completed_items / (pending_items + completed_items) * 100) if (pending_items + completed_items) > 0 else 0
                }
            }
            
            return Response(shopping_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        try:
            original_list = self.get_object()
            new_name = request.data.get('name', f"{original_list.name} (Copy)")
            
            # Create new list with same properties
            new_list = List.objects.create(
                user=request.user,
                name=new_name,
                description=original_list.description,
                list_type=original_list.list_type,
                priority=original_list.priority,
                category=original_list.category
            )
            
            # Copy all items
            for item in original_list.items.all():
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
                    image_url=item.image_url
                )
            
            serializer = self.get_serializer(new_list)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"List duplication failed: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_items(self, request, pk=None):
        try:
            list_obj = self.get_object()
            text = request.data.get('text', '')
            
            if not text:
                return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Enhanced parsing - handle quantities, units, and prices
            items_text = [item.strip() for item in text.split(',') if item.strip()]
            created_items = []
            
            for item_text in items_text:
                # Basic parsing for quantity and name
                parts = item_text.split()
                quantity = '1'
                name = item_text
                unit = ''
                
                # Try to extract quantity if first part is a number
                if parts and parts[0].replace('.', '').isdigit():
                    quantity = parts[0]
                    name = ' '.join(parts[1:])
                
                # Try to extract unit (common units)
                common_units = ['kg', 'lbs', 'oz', 'g', 'ml', 'l', 'pcs', 'pieces', 'bottles', 'cans']
                for unit_word in common_units:
                    if unit_word in name.lower():
                        unit = unit_word
                        name = name.replace(unit_word, '').strip()
                        break
                
                item = ListItem.objects.create(
                    list=list_obj,
                    name=name.strip(),
                    quantity=quantity,
                    unit=unit,
                    priority='medium'
                )
                created_items.append(item)
            
            # Refresh the list object to get updated data
            list_obj.refresh_from_db()
            serializer = self.get_serializer(list_obj)
            
            return Response({
                'list': serializer.data,
                'status': f'Successfully added {len(created_items)} items',
                'items_count': len(created_items)
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='bulk-operations')
    def bulk_operations(self, request):
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
                    new_list = List.objects.create(
                        user=request.user,
                        name=f"{list_obj.name} (Copy)",
                        description=list_obj.description,
                        list_type=list_obj.list_type,
                        priority=list_obj.priority,
                        category=list_obj.category
                    )
                    # Copy items with all fields
                    for item in list_obj.items.all():
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
                            notes=item.notes
                        )
                    duplicated.append(new_list)
                return Response({'message': f'Duplicated {len(duplicated)} lists'})
            else:
                return Response({'error': 'Invalid operation'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def export(self, request):
        try:
            list_ids = request.data.get('list_ids', [])
            format_type = request.data.get('format', 'csv')
            
            if not list_ids:
                return Response({'error': 'list_ids required'}, status=status.HTTP_400_BAD_REQUEST)
            
            lists = List.objects.filter(id__in=list_ids, user=request.user).prefetch_related('items')
            
            from .services import ExportService
            export_service = ExportService()
            
            if format_type == 'csv':
                content = export_service.export_lists_csv(lists)
                response = HttpResponse(content, content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="lists_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
                return response
            elif format_type == 'json':
                content = export_service.export_lists_json(lists)
                response = HttpResponse(content, content_type='application/json')
                response['Content-Disposition'] = f'attachment; filename="lists_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json"'
                return response
            else:
                return Response({'error': 'Unsupported format'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ListItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, item_id):
        try:
            item = ListItem.objects.get(id=item_id, list__user=request.user)
            serializer = ListItemSerializer(item)
            return Response(serializer.data)
        except ListItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, item_id):
        try:
            item = ListItem.objects.get(id=item_id, list__user=request.user)
            serializer = ListItemSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                # Handle completion tracking
                if 'is_completed' in request.data:
                    if request.data['is_completed'] and not item.is_completed:
                        serializer.validated_data['completed_by'] = request.user
                    elif not request.data['is_completed'] and item.is_completed:
                        serializer.validated_data['completed_by'] = None
                
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ListItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, item_id):
        return self.put(request, item_id)

    def delete(self, request, item_id):
        try:
            item = ListItem.objects.get(id=item_id, list__user=request.user)
            item.delete()
            return Response({'message': 'Item deleted successfully'})
        except ListItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)


class ListTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ListTemplateSerializer

    def get_queryset(self):
        return ListTemplate.objects.filter(
            models.Q(user=self.request.user) | models.Q(is_public=True)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        try:
            # Create the template
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            template = serializer.save(user=request.user)
            
            # If template items are provided, create them
            template_items = request.data.get('items', [])
            for item_data in template_items:
                from .models import TemplateItem
                TemplateItem.objects.create(
                    template=template,
                    name=item_data.get('name', ''),
                    description=item_data.get('description', ''),
                    quantity=item_data.get('quantity', ''),
                    unit=item_data.get('unit', ''),
                    priority=item_data.get('priority', 'medium'),
                    category=item_data.get('category', ''),
                    estimated_price=item_data.get('estimated_price')
                )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Template creation failed: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='create')
    def create_list(self, request, pk=None):
        try:
            template = self.get_object()
            list_name = request.data.get('name', f"List from {template.name}")
            list_description = request.data.get('description', template.description)
            
            # Create the new list using the template's clone method
            new_list = template.clone_to_list(
                user=request.user,
                list_name=list_name,
                list_description=list_description
            )
            
            # Increment use count
            template.use_count += 1
            template.save()
            
            serializer = ListSerializer(new_list)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Template list creation failed: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ListAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            period = request.query_params.get('period', 'month')
            
            from .services import ListAnalyticsService
            analytics = ListAnalyticsService().get_user_analytics(request.user, period)
            
            return Response(analytics)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SmartAddItemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, list_id):
        try:
            list_obj = List.objects.get(id=list_id, user=request.user)
            text_input = request.data.get('text', '')
            
            if not text_input:
                return Response({'error': 'Text input required'}, status=status.HTTP_400_BAD_REQUEST)
            
            from .services import ListItemService
            items = ListItemService().add_items_with_ai(list_obj, text_input)
            
            return Response({
                'added_items': [ListItemSerializer(item).data for item in items],
                'count': len(items)
            })
            
        except List.DoesNotExist:
            return Response({'error': 'List not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ListSuggestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, list_id):
        try:
            list_obj = List.objects.get(id=list_id, user=request.user)
            
            from .services import ListItemService
            suggestions = ListItemService().get_smart_suggestions(list_obj)
            
            return Response({
                'suggestions': suggestions,
                'count': len(suggestions)
            })
            
        except List.DoesNotExist:
            return Response({'error': 'List not found'}, status=status.HTTP_404_NOT_FOUND)


class SmartCompletionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, list_id):
        try:
            list_obj = List.objects.get(id=list_id, user=request.user)
            
            incomplete_items = list_obj.items.filter(is_completed=False)
            suggestions = []
            
            for item in incomplete_items:
                if 'milk' in item.name.lower():
                    suggestions.append({
                        'item_id': item.id,
                        'suggestion': 'Complete this common grocery item'
                    })
            
            return Response({
                'suggestions': suggestions,
                'count': len(suggestions)
            })
            
        except List.DoesNotExist:
            return Response({'error': 'List not found'}, status=status.HTTP_404_NOT_FOUND)


class AgendaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from .services import AgendaService
            agenda_data = AgendaService().get_daily_agenda(request.user)
            
            return Response({
                'date': agenda_data['date'],
                'recent_lists': ListSerializer(agenda_data['recent_lists'], many=True).data,
                'pending_items': ListItemSerializer(agenda_data['pending_items'], many=True).data,
                'overdue_items': ListItemSerializer(agenda_data['overdue_items'], many=True).data,
                'summary': agenda_data['summary']
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AIInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from .services import GeminiAI
            
            user_lists = List.objects.filter(user=request.user)
            gemini = GeminiAI()
            
            user_data = {
                'total_lists': user_lists.count(),
                'completed_lists': user_lists.filter(completion_percentage=100).count(),
                'avg_completion': user_lists.aggregate(avg=Avg('completion_percentage'))['avg'] or 0,
                'total_items': ListItem.objects.filter(list__user=request.user).count(),
                'completed_items': ListItem.objects.filter(list__user=request.user, is_completed=True).count()
            }
            
            insights = gemini.get_productivity_insights(user_data)
            predictions = gemini.get_productivity_predictions(user_data)
            motivational = gemini.generate_motivational_message(
                user_data['avg_completion'], 
                'active' if user_lists.count() > 0 else 'new'
            )
            
            return Response({
                'insights': insights,
                'predictions': predictions,
                'motivational_message': motivational
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AISuggestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            list_name = request.data.get('list_name', '')
            list_type = request.data.get('list_type', 'checklist')
            context = request.data.get('context', '')
            
            from .services import GeminiAI
            gemini = GeminiAI()
            suggestions = gemini.suggest_list_items(list_name, list_type, context)
            
            total_time = sum(item.get('estimated_minutes', 15) for item in suggestions)
            
            return Response({
                'suggestions': suggestions,
                'estimated_time_minutes': total_time,
                'estimated_time_formatted': f"{total_time // 60}h {total_time % 60}m" if total_time >= 60 else f"{total_time}m"
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIParseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            text = request.data.get('text', '')
            
            from .services import GeminiAI
            gemini = GeminiAI()
            items = gemini.parse_natural_language(text)
            
            total_time = sum(item.get('estimated_minutes', 15) for item in items)
            
            return Response({
                'items': items,
                'total_items': len(items),
                'estimated_total_minutes': total_time,
                'estimated_total_formatted': f"{total_time // 60}h {total_time % 60}m" if total_time >= 60 else f"{total_time}m"
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkItemUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            updates = request.data.get('updates', [])
            if not updates:
                return Response({'error': 'No updates provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            updated_items = []
            for update in updates:
                item_id = update.get('item_id')
                data = update.get('data', {})
                
                try:
                    item = ListItem.objects.get(id=item_id, list__user=request.user)
                    
                    # Update fields
                    for field, value in data.items():
                        if hasattr(item, field):
                            setattr(item, field, value)
                    
                    # Handle completion timestamp
                    if 'is_completed' in data and data['is_completed']:
                        item.completed_at = timezone.now()
                        item.completed_by = request.user
                    elif 'is_completed' in data and not data['is_completed']:
                        item.completed_at = None
                        item.completed_by = None
                    
                    item.save()
                    updated_items.append(item.id)
                    
                except ListItem.DoesNotExist:
                    continue
            
            return Response({
                'message': f'Updated {len(updated_items)} items',
                'updated_items': updated_items
            })
            
        except Exception as e:
            logger.error(f"Bulk update failed: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ConvertToExpenseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, list_id):
        try:
            from datetime import date
            list_obj = List.objects.get(id=list_id, user=request.user)
            
            # Get completed items with prices
            completed_items = list_obj.items.filter(is_completed=True, price__isnull=False)
            
            if not completed_items.exists():
                return Response({'error': 'No completed items with prices found'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate total with quantities
            total_amount = 0
            for item in completed_items:
                qty = float(item.quantity or 1)
                price = float(item.price or 0)
                total_amount += qty * price
            
            # Create expense text
            expense_text = f"Shopping: {list_obj.name} - {', '.join([f'{item.name} (₹{item.price})' for item in completed_items])}"
            
            # Create expense using the expenses app
            from expenses.models import Expense
            expense = Expense.objects.create(
                user=request.user,
                amount=total_amount,
                description=expense_text,
                category='Groceries',
                transaction_date=date.today()
            )
            
            # Update list with actual cost
            list_obj.actual_cost = total_amount
            list_obj.save()
            
            return Response({
                'message': f'Successfully converted to expense: ₹{total_amount}',
                'expense_id': expense.expense_id,
                'total_amount': float(total_amount),
                'items_count': completed_items.count()
            })
            
        except List.DoesNotExist:
            return Response({'error': 'List not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Convert to expense failed: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AIAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from .services import GeminiAI
            
            user_lists = List.objects.filter(user=request.user)
            gemini = GeminiAI()
            
            total_lists = user_lists.count()
            completed_lists = user_lists.filter(completion_percentage=100).count()
            avg_completion = user_lists.aggregate(avg=Avg('completion_percentage'))['avg'] or 0
            
            total_items = ListItem.objects.filter(list__user=request.user).count()
            completed_items = ListItem.objects.filter(list__user=request.user, is_completed=True).count()
            
            insights = gemini.get_productivity_insights({
                'total_lists': total_lists,
                'completed_lists': completed_lists,
                'avg_completion': avg_completion,
                'total_items': total_items,
                'completed_items': completed_items
            })
            
            return Response({
                'total_lists': total_lists,
                'completed_lists': completed_lists,
                'completion_rate': round(avg_completion, 1),
                'total_items': total_items,
                'completed_items': completed_items,
                'productivity_score': min(100, round(avg_completion * 1.2, 1)),
                'insights': insights,
                'ai_predictions': gemini.get_productivity_predictions({
                    'completion_rate': avg_completion,
                    'trend': 'improving' if avg_completion > 70 else 'stable',
                    'activity': 'high' if total_lists > 5 else 'medium'
                }),
                'trends': {
                    'lists_change': '+12%',
                    'completion_change': '+8%',
                    'productivity_change': '+15%',
                    'items_change': '+23%'
                },
                'category_breakdown': {
                    'Work': user_lists.filter(list_type='work').count(),
                    'Personal': user_lists.filter(list_type='checklist').count(),
                    'Shopping': user_lists.filter(list_type='shopping').count(),
                    'Health': user_lists.filter(list_type='health').count(),
                    'Other': user_lists.exclude(list_type__in=['work', 'checklist', 'shopping', 'health']).count()
                },
                'completion_trends': [
                    {'date': '2024-01-01', 'completed_items': 5},
                    {'date': '2024-01-02', 'completed_items': 8},
                    {'date': '2024-01-03', 'completed_items': 6},
                    {'date': '2024-01-04', 'completed_items': 12},
                    {'date': '2024-01-05', 'completed_items': 9},
                    {'date': '2024-01-06', 'completed_items': 15},
                    {'date': '2024-01-07', 'completed_items': 11}
                ],
                'productivity_metrics': {
                    'completion_rate': round(avg_completion, 1),
                    'efficiency_score': min(100, round(avg_completion * 0.9, 1)),
                    'consistency_score': min(100, round(avg_completion * 1.1, 1)),
                    'quality_score': min(100, round(avg_completion * 0.95, 1))
                }
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)