from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.ExpenseCategoryViewSet, basename='expense-categories')
router.register(r'tags', views.ExpenseTagViewSet, basename='expense-tags')
router.register(r'advanced', views.ExpenseAdvancedViewSet, basename='expense-advanced')

urlpatterns = [
    path('', views.ExpenseAPIView.as_view(), name='expense-list-create'),
    path('list/', views.ExpenseListCreateView.as_view(), name='expense-list-paginated'),
    path('summary/', views.ExpenseSummaryView.as_view(), name='expense-summary'),
    path('bulk/', views.ExpenseBulkOperationsView.as_view(), name='expense-bulk-actions'),
    path('export/', views.ExpenseExportView.as_view(), name='expense-export'),
    path('analytics/', views.ExpenseAnalyticsView.as_view(), name='expense-analytics'),
    path('trends/', views.ExpenseTrendsView.as_view(), name='expense-trends'),
    path('ai-insights/', views.AIInsightsView.as_view(), name='ai-insights'),
    path('advanced-analytics/', views.AdvancedAnalyticsView.as_view(), name='advanced-analytics'),
    path('budget-analysis/', views.BudgetAnalysisView.as_view(), name='budget-analysis'),
    path('trends-analysis/', views.TrendsAnalysisView.as_view(), name='trends-analysis'),
    path('<str:expense_id>/', views.ExpenseDetailAPIView.as_view(), name='expense-detail'),
    path('', include(router.urls)),
]