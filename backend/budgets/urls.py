# budgets/urls.py
from django.urls import path
from .views import BudgetView, BudgetListView

urlpatterns = [
    path('current/', BudgetView.as_view(), name='current_budget'),
    path('', BudgetListView.as_view(), name='budget_list'),
]