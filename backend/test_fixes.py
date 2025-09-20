#!/usr/bin/env python
"""
Test script to verify the expense and budget fixes
"""
import os
import sys
import django
from datetime import date, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysphere_core.settings')
django.setup()

from django.contrib.auth.models import User
from expenses.models import Expense
from budgets.models import Budget
from expenses.services import ExpenseService
from expenses.advanced_analytics import AdvancedExpenseAnalytics

def test_month_boundary_analytics():
    """Test that analytics properly reset at month boundaries"""
    print("Testing month boundary analytics...")
    
    # Create test user
    user, created = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com'})
    
    # Clean up existing data
    Expense.objects.filter(user=user).delete()
    Budget.objects.filter(user=user).delete()
    
    # Create expenses from previous month
    last_month = date.today().replace(day=1) - timedelta(days=1)
    Expense.objects.create(
        user=user,
        amount=1000,
        category='Food & Dining',
        description='Last month expense',
        transaction_date=last_month
    )
    
    # Create expense from current month
    today = date.today()
    Expense.objects.create(
        user=user,
        amount=500,
        category='Food & Dining', 
        description='Current month expense',
        transaction_date=today
    )
    
    # Test expense summary
    summary = ExpenseService.get_expense_summary(user)
    print(f"Current month total: Rs.{summary['month']} (should be 500, not 1500)")
    
    # Test advanced analytics
    analytics = AdvancedExpenseAnalytics(user)
    budget_analysis = analytics.get_budget_analysis()
    print(f"Budget analysis completed without errors")
    
    return summary['month'] == 500.0

def test_budget_creation():
    """Test budget creation functionality"""
    print("Testing budget creation...")
    
    user, created = User.objects.get_or_create(username='testuser2', defaults={'email': 'test2@example.com'})
    Budget.objects.filter(user=user).delete()
    
    # Create a budget
    today = date.today()
    start_of_month = today.replace(day=1)
    
    budget = Budget.objects.create(
        user=user,
        category='Food & Dining',
        amount=5000,
        start_date=start_of_month,
        end_date=today.replace(day=28),  # Approximate end of month
        is_active=True
    )
    
    print(f"Budget created: {budget.category} - Rs.{budget.amount}")
    return budget.id is not None

def main():
    print("Running expense and budget fixes test...\n")
    
    try:
        # Test 1: Month boundary analytics
        analytics_test = test_month_boundary_analytics()
        print(f"Analytics test: {'PASSED' if analytics_test else 'FAILED'}\n")
        
        # Test 2: Budget creation
        budget_test = test_budget_creation()
        print(f"Budget creation test: {'PASSED' if budget_test else 'FAILED'}\n")
        
        if analytics_test and budget_test:
            print("All tests PASSED! Fixes are working correctly.")
        else:
            print("Some tests failed. Please check the implementation.")
            
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()