# lists/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .sharing_views import (
    ListShareView, SharedListView, UserSharesView,
    ShareCollaboratorsView
)
from .bulk_operations import (
    ListBulkOperationsView, ListItemBulkOperationsView
)

router = DefaultRouter()
router.register(r'templates', views.ListTemplateViewSet, basename='listtemplate')
# This will handle /lists/ and /lists/<pk>/
router.register(r'', views.ListViewSet, basename='list')


urlpatterns = [
    # --- SPECIFIC URLS FIRST (BEFORE ROUTER) ---
    path('agenda/', views.AgendaView.as_view(), name='agenda'),
    path('analytics/', views.ListAnalyticsView.as_view(), name='list-analytics'),

    # Enhanced AI-powered list operations - MUST BE BEFORE ROUTER
    path('<str:list_id>/add_items/', views.SmartAddItemView.as_view(), name='list-add-items'),
    path('<str:list_id>/suggestions/', views.ListSuggestionsView.as_view(), name='list-suggestions'),
    path('<str:list_id>/smart_completion/', views.SmartCompletionView.as_view(), name='smart-completion'),
    path('items/<str:item_id>/', views.ListItemDetailView.as_view(), name='list-item-detail'),
    
    # Enhanced template operations
    path('templates/<str:template_id>/create/', views.CreateListFromTemplateView.as_view(), name='create-from-template'),

    # Sharing URLs
    path('<str:list_id>/share/', ListShareView.as_view(), name='list-share'),
    path('<str:list_id>/share/<str:share_id>/', ListShareView.as_view(), name='list-share-detail'),
    path('shared/<str:share_token>/', SharedListView.as_view(), name='shared-list'),
    path('shares/', UserSharesView.as_view(), name='user-shares'),
    path('shares/<str:share_id>/collaborators/', ShareCollaboratorsView.as_view(), name='share-collaborators'),

    # Bulk Operations & Export URLs
    path('bulk/', ListItemBulkOperationsView.as_view(), name='list-item-bulk-operations'),
    path('bulk-operations/', ListBulkOperationsView.as_view(), name='list-bulk-operations'),
    path('export/', views.ListViewSet.as_view({'post': 'export'}), name='list-export'),
    
    # --- ROUTER URLS LAST ---
    # The router handles /lists/ and /lists/<pk>/ patterns
    path('', include(router.urls)),
]