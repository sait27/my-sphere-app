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
from .views import AgendaView, ListAnalyticsView

router = DefaultRouter()
router.register(r'', views.ListViewSet, basename='list')
router.register(r'templates', views.ListTemplateViewSet, basename='listtemplate')

urlpatterns = [
    path('', include(router.urls)),
    path('smart-add/', views.SmartAddItemView.as_view(), name='smart-add-item'),
    path('agenda/', AgendaView.as_view(), name='agenda'),
    path('analytics/', ListAnalyticsView.as_view(), name='list-analytics'),
    
    # List item operations
    path('<int:list_id>/add_items/', views.SmartAddItemView.as_view(), name='list-add-items'),
    path('<int:list_id>/items/', views.ListViewSet.as_view({'post': 'create_item'}), name='list-items'),
    path('items/<int:item_id>/', views.ListItemDetailView.as_view(), name='list-item-detail'),
    
    # Sharing URLs
    path('<int:list_id>/share/', ListShareView.as_view(), name='list-share'),
    path('<int:list_id>/share/<int:share_id>/', ListShareView.as_view(), name='list-share-detail'),
    path('shared/<str:share_token>/', SharedListView.as_view(), name='shared-list'),
    path('shares/', UserSharesView.as_view(), name='user-shares'),
    path('shares/<int:share_id>/collaborators/', ShareCollaboratorsView.as_view(), name='share-collaborators'),
    
    # Bulk Operations URLs
    path('bulk/', ListItemBulkOperationsView.as_view(), name='list-item-bulk-operations'),
    path('bulk-operations/', ListBulkOperationsView.as_view(), name='list-bulk-operations'),
    path('export/', views.ListViewSet.as_view({'post': 'export'}), name='list-export'),
]