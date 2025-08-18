# expenses/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.ExpenseAPIView.as_view(), name='expense-list-create'),
    path('summary/', views.ExpenseSummaryView.as_view(), name='expense-summary'),
    path('bulk/', views.ExpenseBulkOperationsView.as_view(), name='expense-bulk-actions'),
    path('export/', views.ExpenseExportView.as_view(), name='expense-export'),
    path('analytics/', views.ExpenseAnalyticsView.as_view(), name='expense-analytics'),
    path('ai-insights/', views.AIInsightsView.as_view(), name='ai-insights'),
    path('advanced-analytics/', views.AdvancedAnalyticsView.as_view(), name='advanced-analytics'),
    
    # Advanced analytics sub-endpoints
    path('advanced/analytics/', views.AdvancedAnalyticsView.as_view(), name='advanced-analytics-detail'),
    path('advanced/budget_analysis/', views.BudgetAnalysisView.as_view(), name='budget-analysis'),
    path('advanced/trends/', views.TrendsAnalysisView.as_view(), name='trends-analysis'),
    
    path('<str:expense_id>/', views.ExpenseDetailAPIView.as_view(), name='expense-detail'),
]