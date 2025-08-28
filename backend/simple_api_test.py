#!/usr/bin/env python3
"""
Simple API test without Django test framework
"""

import os
import sys
import django
import requests
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysphere_core.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

def get_auth_token():
    """Get or create test user and return JWT token"""
    try:
        user = User.objects.get(username='testuser')
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

def test_api_endpoints():
    """Test API endpoints using requests"""
    base_url = 'http://127.0.0.1:8000'
    token = get_auth_token()
    headers = {'Authorization': f'Bearer {token}'}
    
    print("=" * 60)
    print("SIMPLE API TEST")
    print("=" * 60)
    
    # Test endpoints
    endpoints = [
        ('GET', '/lists/', None),
        ('GET', '/lists/analytics/', None),
        ('GET', '/lists/templates/', None),
        ('POST', '/lists/', {'name': 'Test List', 'list_type': 'checklist'}),
    ]
    
    for method, endpoint, data in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=5)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=5)
            
            print(f"{method} {endpoint} - Status: {response.status_code}")
            if response.status_code < 400:
                try:
                    json_data = response.json()
                    print(f"  Success: {len(json_data) if isinstance(json_data, list) else 'OK'}")
                except:
                    print(f"  Success: {response.text[:100]}...")
            else:
                print(f"  Error: {response.text[:100]}...")
                
        except requests.exceptions.ConnectionError:
            print(f"{method} {endpoint} - Connection Error (Server not running?)")
        except Exception as e:
            print(f"{method} {endpoint} - Error: {e}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETED")
    print("=" * 60)

if __name__ == '__main__':
    test_api_endpoints()