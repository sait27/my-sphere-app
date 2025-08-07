# expenses/urls.py

from django.urls import path
# Make sure to import both of your view classes
from .views import ExpenseAPIView, ExpenseDetailAPIView

urlpatterns = [
    # 1. This path handles getting the LIST of all expenses and CREATING new ones.
    #    (e.g., GET /api/v1/expenses/  and  POST /api/v1/expenses/)
    path('', ExpenseAPIView.as_view(), name='expense_list_create'),
    
    # 2. This path handles actions on a SINGLE expense (identified by its ID).
    #    (e.g., DELETE /api/v1/expenses/EXP123XYZ/)
    path('<str:expense_id>/', ExpenseDetailAPIView.as_view(), name='expense_detail'),
]