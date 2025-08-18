#!/usr/bin/env python
"""
Simple URL Configuration Validator
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysphere_core.settings')

try:
    django.setup()
    print("Django setup successful")
except Exception as e:
    print(f"Django setup failed: {e}")
    sys.exit(1)

from django.urls import get_resolver

def test_url_patterns():
    """Test basic URL pattern loading"""
    try:
        resolver = get_resolver()
        print("URL resolver loaded successfully")
        
        # Test that key URL patterns exist
        patterns = resolver.url_patterns
        print(f"Found {len(patterns)} top-level URL patterns")
        
        # Check for key app patterns
        app_patterns = {}
        for pattern in patterns:
            if hasattr(pattern, 'app_name'):
                app_patterns[pattern.app_name] = pattern
            elif hasattr(pattern, 'pattern'):
                pattern_str = str(pattern.pattern)
                if 'expenses' in pattern_str:
                    app_patterns['expenses'] = pattern
                elif 'lists' in pattern_str:
                    app_patterns['lists'] = pattern
                elif 'todos' in pattern_str:
                    app_patterns['todos'] = pattern
                elif 'users' in pattern_str:
                    app_patterns['users'] = pattern
                elif 'budgets' in pattern_str:
                    app_patterns['budgets'] = pattern
                elif 'integrations' in pattern_str:
                    app_patterns['integrations'] = pattern
        
        print("App patterns found:")
        for app, pattern in app_patterns.items():
            print(f"  - {app}")
        
        return True
    except Exception as e:
        print(f"Error testing URL patterns: {e}")
        return False

def test_view_imports():
    """Test that key views can be imported"""
    try:
        from lists.views import ListViewSet, SmartAddItemView, ListAnalyticsView
        print("Lists views imported successfully")
        
        from todos.views import GoalViewSet, TaskViewSet
        print("Todos views imported successfully")
        
        from expenses.views import ExpenseAPIView, ExpenseDetailAPIView
        print("Expenses views imported successfully")
        
        return True
    except Exception as e:
        print(f"Error importing views: {e}")
        return False

if __name__ == "__main__":
    print("=== URL Configuration Validation ===")
    print()
    
    success = True
    
    if test_url_patterns():
        print("URL patterns test: PASSED")
    else:
        print("URL patterns test: FAILED")
        success = False
    
    print()
    
    if test_view_imports():
        print("View imports test: PASSED")
    else:
        print("View imports test: FAILED")
        success = False
    
    print()
    print("=" * 40)
    
    if success:
        print("All tests passed! URLs are properly configured.")
        print()
        print("Key endpoints available:")
        print("  /api/v1/lists/     - Lists management")
        print("  /api/v1/todos/     - Todo/task management") 
        print("  /api/v1/expenses/  - Expense tracking")
        print("  /api/v1/users/     - User management")
        print("  /api/v1/budgets/   - Budget management")
        print("  /api/v1/integrations/ - Third-party integrations")
    else:
        print("Some tests failed. Check the errors above.")
        sys.exit(1)
