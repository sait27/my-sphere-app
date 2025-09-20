#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysphere_core.settings')
django.setup()

from django.contrib.auth.models import User
from lending.models import LendingTransaction
from lending.services import LendingService
from decimal import Decimal

def test_lending_functionality():
    print("Testing Lending Functionality...")
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    if created:
        print("[+] Created test user")
    else:
        print("[+] Using existing test user")
    
    # Test data
    test_data = {
        'transaction_type': 'lend',
        'person_name': 'John Doe',
        'person_email': 'john@example.com',
        'amount': Decimal('500.00'),
        'description': 'Emergency loan',
        'interest_rate': Decimal('5.0'),
        'category': 'Personal',
        'priority': 'medium'
    }
    
    try:
        # Test transaction creation
        transaction = LendingService.create_transaction(user, test_data)
        print(f"[+] Created transaction: {transaction.lending_id}")
        
        # Test fetching transactions
        transactions = LendingService.get_user_transactions(user)
        print(f"[+] Fetched {transactions.count()} transactions")
        
        # Test summary data
        summary = LendingService.get_summary_data(user)
        print(f"[+] Generated summary: {summary}")
        
        # Test analytics
        analytics = LendingService.get_analytics_data(user)
        print(f"[+] Generated analytics: {len(analytics)} data points")
        
        print("\n[SUCCESS] All lending functionality tests passed!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    test_lending_functionality()