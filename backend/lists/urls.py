# lists/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.ListTemplateViewSet, basename='template')
router.register(r'', views.ListViewSet, basename='list')

urlpatterns = [
    # Core views (must come before router)
    path('agenda/', views.AgendaView.as_view(), name='agenda'),
    path('analytics/', views.ListAnalyticsView.as_view(), name='list-analytics'),
    
    # AI endpoints
    path('ai/insights/', views.AIInsightsView.as_view(), name='ai-insights'),
    path('ai/suggestions/', views.AISuggestionsView.as_view(), name='ai-suggestions'),
    path('ai/parse/', views.AIParseView.as_view(), name='ai-parse'),
    path('ai/analytics/', views.AIAnalyticsView.as_view(), name='ai-analytics'),

    # List operations
    path('<str:list_id>/add_items/', views.SmartAddItemView.as_view(), name='list-add-items'),
    path('<str:list_id>/convert-to-expense/', views.ConvertToExpenseView.as_view(), name='convert-to-expense'),
    path('<str:pk>/duplicate/', views.ListViewSet.as_view({'post': 'duplicate'}), name='list-duplicate'),
    path('<str:list_id>/suggestions/', views.ListSuggestionsView.as_view(), name='list-suggestions'),
    path('<str:list_id>/smart_completion/', views.SmartCompletionView.as_view(), name='smart-completion'),
    path('items/<str:item_id>/', views.ListItemDetailView.as_view(), name='list-item-detail'),
    path('items/bulk-update/', views.BulkItemUpdateView.as_view(), name='bulk-item-update'),
    
    # Router URLs (must come last)
    path('', include(router.urls)),
]