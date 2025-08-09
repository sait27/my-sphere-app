# expenses/urls.py

from django.urls import path
# Make sure to import both of your view classes
from .views import ExpenseAPIView, ExpenseDetailAPIView, ExpenseSummaryView

urlpatterns = [

    path('', ExpenseAPIView.as_view(), name='expense_list_create'),
    path('summary/', ExpenseSummaryView.as_view(), name='expense_summary'),
    path('<str:expense_id>/', ExpenseDetailAPIView.as_view(), name='expense_detail'),
]