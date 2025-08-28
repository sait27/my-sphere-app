#!/usr/bin/env python3
"""
Check which backend APIs are being used in Listify
"""

import os
import re
from pathlib import Path

def find_api_calls_in_frontend():
    """Find all API calls in frontend code"""
    frontend_path = Path("../frontend/src")
    api_calls = set()
    
    # Patterns to match API calls
    patterns = [
        r'apiClient\.get\([\'"`]([^\'"`]+)[\'"`]',
        r'apiClient\.post\([\'"`]([^\'"`]+)[\'"`]',
        r'apiClient\.put\([\'"`]([^\'"`]+)[\'"`]',
        r'apiClient\.patch\([\'"`]([^\'"`]+)[\'"`]',
        r'apiClient\.delete\([\'"`]([^\'"`]+)[\'"`]',
    ]
    
    for file_path in frontend_path.rglob("*.js"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                for pattern in patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        # Clean up the URL
                        url = match.strip().replace('${', '{').split('?')[0]
                        api_calls.add(url)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    for file_path in frontend_path.rglob("*.jsx"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                for pattern in patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        # Clean up the URL
                        url = match.strip().replace('${', '{').split('?')[0]
                        api_calls.add(url)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    return sorted(api_calls)

def get_backend_endpoints():
    """Get all backend endpoints from Django URLs"""
    endpoints = [
        # Lists endpoints
        '/lists/',
        '/lists/{id}/',
        '/lists/{id}/duplicate/',
        '/lists/{id}/add_items/',
        '/lists/bulk-operations/',
        '/lists/export/',
        '/lists/items/{id}/',
        '/lists/agenda/',
        '/lists/analytics/',
        '/lists/ai/insights/',
        '/lists/ai/suggestions/',
        '/lists/ai/parse/',
        '/lists/ai/analytics/',
        '/lists/{id}/suggestions/',
        '/lists/{id}/smart_completion/',
        '/lists/templates/',
        '/lists/templates/{id}/',
        '/lists/templates/{id}/create/',
        
        # Auth endpoints (if any)
        '/auth/login/',
        '/auth/register/',
        '/auth/refresh/',
        
        # Other potential endpoints
        '/users/',
        '/expenses/',
        '/budgets/',
        '/todos/',
    ]
    return sorted(endpoints)

def main():
    print("=" * 60)
    print("LISTIFY API USAGE ANALYSIS")
    print("=" * 60)
    
    print("\n1. FRONTEND API CALLS FOUND:")
    print("-" * 40)
    frontend_calls = find_api_calls_in_frontend()
    
    if frontend_calls:
        for call in frontend_calls:
            print(f"  {call}")
    else:
        print("  No API calls found in frontend")
    
    print(f"\nTotal frontend API calls: {len(frontend_calls)}")
    
    print("\n2. AVAILABLE BACKEND ENDPOINTS:")
    print("-" * 40)
    backend_endpoints = get_backend_endpoints()
    for endpoint in backend_endpoints:
        print(f"  {endpoint}")
    
    print(f"\nTotal backend endpoints: {len(backend_endpoints)}")
    
    print("\n3. USAGE ANALYSIS:")
    print("-" * 40)
    
    # Normalize endpoints for comparison
    def normalize_endpoint(endpoint):
        # Replace parameter patterns
        normalized = re.sub(r'\{[^}]+\}', '{id}', endpoint)
        normalized = re.sub(r'/[A-Z0-9]{20,}/', '/{id}/', normalized)
        return normalized
    
    normalized_frontend = {normalize_endpoint(call) for call in frontend_calls}
    normalized_backend = {normalize_endpoint(endpoint) for endpoint in backend_endpoints}
    
    used_endpoints = normalized_frontend.intersection(normalized_backend)
    unused_endpoints = normalized_backend - normalized_frontend
    
    print("USED ENDPOINTS:")
    for endpoint in sorted(used_endpoints):
        print(f"  [USED] {endpoint}")
    
    print(f"\nUNUSED ENDPOINTS:")
    for endpoint in sorted(unused_endpoints):
        print(f"  [UNUSED] {endpoint}")
    
    print(f"\nSUMMARY:")
    print(f"  Used: {len(used_endpoints)}")
    print(f"  Unused: {len(unused_endpoints)}")
    print(f"  Usage Rate: {len(used_endpoints)/(len(normalized_backend)) * 100:.1f}%")

if __name__ == '__main__':
    main()