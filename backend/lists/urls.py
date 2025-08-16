# lists/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import sharing_views
from .sharing_views import (
    ListShareView, SharedListView, UserSharesView, 
    ShareCollaboratorsView
)
from .bulk_operations import (
    ListBulkOperationsView, ListItemBulkOperationsView
)

router = DefaultRouter()
router.register(r'', views.ListViewSet, basename='list')
router.register(r'templates', views.ListTemplateViewSet, basename='listtemplate')

urlpatterns = [
    path('', include(router.urls)),
    path('smart-add/', views.SmartAddItemView.as_view(), name='smart-add-item'),
    path('agenda/', views.AgendaView.as_view(), name='agenda'),
    
    # Sharing URLs
    path('<int:list_id>/share/', ListShareView.as_view(), name='list-share'),
    path('<int:list_id>/share/<int:share_id>/', ListShareView.as_view(), name='list-share-detail'),
    path('shared/<str:share_token>/', SharedListView.as_view(), name='shared-list'),
    path('shares/', UserSharesView.as_view(), name='user-shares'),
    path('shares/<int:share_id>/collaborators/', ShareCollaboratorsView.as_view(), name='share-collaborators'),

    
    # Bulk Operations URLs
    path('bulk-operations/', ListBulkOperationsView.as_view(), name='list-bulk-operations'),
    path('items/bulk-operations/', ListItemBulkOperationsView.as_view(), name='list-item-bulk-operations'),
]