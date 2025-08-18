# budgets/serializers.py
from rest_framework import serializers
from .models import Budget

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = [
            'id', 
            'user', 
            'amount', 
            'category', 
            'start_date', 
            'end_date', 
            'is_active'
        ]
        read_only_fields = ['user']