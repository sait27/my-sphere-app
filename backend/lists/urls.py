# lists/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListViewSet, SmartAddItemView, ListItemDetailView, AgendaView

router = DefaultRouter()
# The router handles the general URLs for listing, creating, and retrieving lists
router.register('', ListViewSet, basename='list')

urlpatterns = [
    # --- SPECIFIC PATHS FIRST ---
    # These are the most specific URLs, so we list them before the router.
    path('agenda/', AgendaView.as_view(), name='agenda'),
    path('<str:list_id>/add_items/', SmartAddItemView.as_view(), name='smart_add_items'),
    path('items/<str:pk>/', ListItemDetailView.as_view(), name='list_item_detail'),

    # --- GENERAL ROUTER PATHS LAST ---
    # The router's URLs (like /lists/{id}/) are more general, so they come last.
    path('', include(router.urls)),
]