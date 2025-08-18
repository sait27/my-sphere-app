#!/usr/bin/env python
"""
URL Configuration Test Script
This script validates that all URL patterns are properly configured
"""

import os
import sys
import django
from django.core.management.base import BaseCommand
from django.urls import get_resolver
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysphere_core.settings')
django.setup()

def print_urls(urlpatterns, namespace="", prefix=""):
    """Print all URLs in the urlpatterns"""
    for pattern in urlpatterns:
        if hasattr(pattern, 'url_patterns'):
            # This is a included URLconf
            new_namespace = f"{namespace}:{pattern.namespace}" if pattern.namespace else namespace
            new_prefix = prefix + str(pattern.pattern)
            print_urls(pattern.url_patterns, new_namespace, new_prefix)
        else:
            # This is a URL pattern
            url = prefix + str(pattern.pattern)
            name = pattern.name
            view = pattern.callback
            view_name = f"{view.__module__}.{view.__name__}" if hasattr(view, '__name__') else str(view)
            
            namespace_prefix = f"[{namespace}]" if namespace else ""
            print(f"{namespace_prefix} {url.ljust(50)} -> {view_name} ({name})")

if __name__ == "__main__":
    print("=== MY SPHERE URL CONFIGURATION ===")
    print()
    
    try:
        resolver = get_resolver()
        print("[OK] URL resolver loaded successfully")
        print("Available URL patterns:")
        print()
        
        print_urls(resolver.url_patterns)
        
        print()
        print("="*80)
        print("[OK] All URL patterns loaded successfully!")
        print("Key endpoints to test:")
        print("   - /api/v1/lists/ (Lists feature)")
        print("   - /api/v1/todos/ (Todos feature)")
        print("   - /api/v1/expenses/ (Expenses feature)")
        print("   - /api/v1/users/ (User management)")
        print("   - /api/v1/budgets/ (Budget management)")
        print("   - /api/v1/integrations/ (Third-party integrations)")
        
    except Exception as e:
        print(f"[ERROR] Error loading URL patterns: {e}")
        sys.exit(1)
