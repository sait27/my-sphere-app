# budgets/urls.py
from django.urls import path
from .views import BudgetView

urlpatterns = [
    path('current/', BudgetView.as_view(), name='current_budget'),
]