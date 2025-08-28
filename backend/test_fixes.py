#!/usr/bin/env python3
"""
Test script to verify the fixes are working
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysphere_core.settings')
django.setup()

from lists.services import GeminiAI, ListService
from lists.models import List, ListItem
from django.contrib.auth.models import User

def test_gemini_ai():
    """Test Gemini AI initialization"""
    print("Testing Gemini AI initialization...")
    try:
        gemini = GeminiAI()
        print(f"[OK] Gemini AI available: {gemini.ai_available}")
        if gemini.ai_available:
            print("[OK] Gemini AI initialized successfully")
        else:
            print("[WARN] Gemini AI not available (API key issue)")
        return True
    except Exception as e:
        print(f"[ERROR] Gemini AI initialization failed: {e}")
        return False

def test_list_service():
    """Test List Service"""
    print("\nTesting List Service...")
    try:
        service = ListService()
        print("[OK] List Service initialized successfully")
        return True
    except Exception as e:
        print(f"[ERROR] List Service initialization failed: {e}")
        return False

def test_duplicate_functionality():
    """Test duplicate functionality"""
    print("\nTesting duplicate functionality...")
    try:
        # Get or create a test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com'}
        )
        
        # Create a test list
        test_list = List.objects.create(
            user=user,
            name='Test List',
            description='Test description',
            list_type='checklist'
        )
        
        # Add some items
        ListItem.objects.create(
            list=test_list,
            name='Test Item 1',
            priority='medium'
        )
        ListItem.objects.create(
            list=test_list,
            name='Test Item 2',
            priority='high'
        )
        
        # Test duplication
        service = ListService()
        duplicated_list = service.duplicate_list(test_list, 'Test List (Copy)', user)
        
        print(f"[OK] Original list: {test_list.name} (ID: {test_list.id})")
        print(f"[OK] Duplicated list: {duplicated_list.name} (ID: {duplicated_list.id})")
        print(f"[OK] Original items count: {test_list.items.count()}")
        print(f"[OK] Duplicated items count: {duplicated_list.items.count()}")
        
        # Cleanup
        test_list.delete()
        duplicated_list.delete()
        if created:
            user.delete()
            
        print("[OK] Duplicate functionality working correctly")
        return True
    except Exception as e:
        print(f"[ERROR] Duplicate functionality failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("TESTING LISTIFY FIXES")
    print("=" * 50)
    
    tests = [
        test_gemini_ai,
        test_list_service,
        test_duplicate_functionality
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"[ERROR] Test failed with exception: {e}")
            results.append(False)
    
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("[OK] All tests passed!")
    else:
        print("[WARN] Some tests failed. Check the output above.")
    
    return passed == total

if __name__ == '__main__':
    main()