# expenses/urls.py

from django.urls import path
from .views import ExpenseAPIView 

urlpatterns = [
    path('', ExpenseAPIView.as_view(), name='expense_api'),
]