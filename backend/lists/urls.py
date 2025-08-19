# lists/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .bulk_operations import (
    ListBulkOperationsView, ListItemBulkOperationsView
)

router = DefaultRouter()
# This will handle /lists/ and /lists/<pk>/
router.register(r'', views.ListViewSet, basename='list')

urlpatterns = [
    # --- SPECIFIC URLS FIRST (BEFORE ROUTER) ---
    # Templates with explicit create endpoint
    path('templates/<str:pk>/create/', views.ListTemplateViewSet.as_view({'post': 'create_list'}), name='template-create-list'),
    path('templates/', views.ListTemplateViewSet.as_view({'get': 'list', 'post': 'create'}), name='template-list'),
    path('templates/<str:pk>/', views.ListTemplateViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='template-detail'),
    path('agenda/', views.AgendaView.as_view(), name='agenda'),
    path('analytics/', views.ListAnalyticsView.as_view(), name='list-analytics'),

    # Enhanced AI-powered list operations - MUST BE BEFORE ROUTER
    path('<str:list_id>/add_items/', views.SmartAddItemView.as_view(), name='list-add-items'),
    path('<str:list_id>/suggestions/', views.ListSuggestionsView.as_view(), name='list-suggestions'),
    path('<str:list_id>/smart_completion/', views.SmartCompletionView.as_view(), name='smart-completion'),
    path('items/<str:item_id>/', views.ListItemDetailView.as_view(), name='list-item-detail'),
    
    # Enhanced template operations - NOW HANDLED BY ROUTER
    # path('templates/<str:template_id>/create/', views.CreateListFromTemplateView.as_view(), name='create-from-template'),

    # Sharing functionality removed

    # Bulk Operations & Export URLs
    path('bulk/', ListItemBulkOperationsView.as_view(), name='list-item-bulk-operations'),
    path('bulk-operations/', ListBulkOperationsView.as_view(), name='list-bulk-operations'),
    path('export/', views.ListViewSet.as_view({'post': 'export'}), name='list-export'),
    
    # --- ROUTER URLS LAST ---
    # The router handles /lists/ and /lists/<pk>/ patterns
    path('', include(router.urls)),
]