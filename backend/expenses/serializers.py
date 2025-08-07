# expenses/serializers.py

from rest_framework import serializers
from .models import Expense

# expenses/serializers.py
class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        # Add 'display_id' to the list of fields
        fields = ['expense_id', 'display_id', 'amount', 'category', 'vendor', 'transaction_date', 'raw_text']