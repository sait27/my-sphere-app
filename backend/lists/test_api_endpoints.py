#!/usr/bin/env python3
"""
Test file to check outputs of each Lists API endpoint
"""

import os
import sys
import django
import json
from datetime import datetime

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysphere_core.settings')
os.environ.setdefault('DJANGO_ALLOWED_HOSTS', 'testserver,localhost,127.0.0.1')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from lists.models import List, ListItem, ListTemplate

class ListsAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Try to get existing user or create new one
        try:
            self.user = User.objects.get(username='testuser')
        except User.DoesNotExist:
            self.user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create test data
        self.test_list, created = List.objects.get_or_create(
            user=self.user,
            name='Test List',
            defaults={
                'description': 'Test Description',
                'list_type': 'checklist',
                'priority': 'medium'
            }
        )
        
        self.test_item, created = ListItem.objects.get_or_create(
            list=self.test_list,
            name='Test Item',
            defaults={'priority': 'high'}
        )

    def test_lists_crud(self):
        """Test basic CRUD operations"""
        print("\n=== Testing Lists CRUD ===")
        
        # GET /lists/
        response = self.client.get('/lists/')
        print(f"GET /lists/ - Status: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"Response: {response.data}")
        else:
            print(f"Response content: {response.content.decode() if response.content else 'Empty'}")
        
        # POST /lists/
        data = {
            'name': 'New Test List',
            'description': 'New Description',
            'list_type': 'shopping',
            'priority': 'high'
        }
        response = self.client.post('/lists/', data)
        print(f"POST /lists/ - Status: {response.status_code}")
        if response.status_code == 201 and hasattr(response, 'data'):
            new_list_id = response.data['id']
            print(f"Created list ID: {new_list_id}")
        elif response.content:
            print(f"Response: {response.content.decode()}")
        
        # GET /lists/{id}/
        response = self.client.get(f'/lists/{self.test_list.id}/')
        print(f"GET /lists/{self.test_list.id}/ - Status: {response.status_code}")
        
        # PATCH /lists/{id}/
        update_data = {'name': 'Updated Test List'}
        response = self.client.patch(f'/lists/{self.test_list.id}/', update_data)
        print(f"PATCH /lists/{self.test_list.id}/ - Status: {response.status_code}")

    def test_list_items(self):
        """Test list items operations"""
        print("\n=== Testing List Items ===")
        
        # POST /lists/{id}/add_items/
        response = self.client.post(f'/lists/{self.test_list.id}/add_items/', {
            'text': 'milk, bread, eggs, cheese'
        })
        print(f"POST /lists/{self.test_list.id}/add_items/ - Status: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"Response: {response.data}")
        elif response.content:
            print(f"Response: {response.content.decode()}")
        
        # GET /lists/items/{id}/
        response = self.client.get(f'/lists/items/{self.test_item.id}/')
        print(f"GET /lists/items/{self.test_item.id}/ - Status: {response.status_code}")
        
        # PATCH /lists/items/{id}/
        response = self.client.patch(f'/lists/items/{self.test_item.id}/', {
            'name': 'Updated Item',
            'is_completed': True
        })
        print(f"PATCH /lists/items/{self.test_item.id}/ - Status: {response.status_code}")

    def test_list_operations(self):
        """Test list operations"""
        print("\n=== Testing List Operations ===")
        
        # POST /lists/{id}/duplicate/
        response = self.client.post(f'/lists/{self.test_list.id}/duplicate/', {
            'name': 'Duplicated List'
        })
        print(f"POST /lists/{self.test_list.id}/duplicate/ - Status: {response.status_code}")
        
        # GET /lists/{id}/suggestions/
        response = self.client.get(f'/lists/{self.test_list.id}/suggestions/')
        print(f"GET /lists/{self.test_list.id}/suggestions/ - Status: {response.status_code}")
        
        # POST /lists/{id}/smart_completion/
        response = self.client.post(f'/lists/{self.test_list.id}/smart_completion/')
        print(f"POST /lists/{self.test_list.id}/smart_completion/ - Status: {response.status_code}")

    def test_bulk_operations(self):
        """Test bulk operations"""
        print("\n=== Testing Bulk Operations ===")
        
        # Create another list for bulk operations
        list2 = List.objects.create(
            user=self.user,
            name='Test List 2',
            list_type='todo'
        )
        
        # POST /lists/bulk-operations/
        response = self.client.post('/lists/bulk-operations/', {
            'operation': 'duplicate_lists',
            'list_ids': [self.test_list.id, list2.id]
        })
        print(f"POST /lists/bulk-operations/ - Status: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"Response: {response.data}")
        elif response.content:
            print(f"Response: {response.content.decode()}")

    def test_templates(self):
        """Test template operations"""
        print("\n=== Testing Templates ===")
        
        # Create test template
        template = ListTemplate.objects.create(
            user=self.user,
            name='Test Template',
            description='Test Template Description',
            category='general'
        )
        
        # GET /lists/templates/
        response = self.client.get('/lists/templates/')
        print(f"GET /lists/templates/ - Status: {response.status_code}")
        
        # POST /lists/templates/
        response = self.client.post('/lists/templates/', {
            'name': 'New Template',
            'description': 'New Template Description',
            'category': 'work'
        })
        print(f"POST /lists/templates/ - Status: {response.status_code}")
        
        # POST /lists/templates/{id}/create/
        response = self.client.post(f'/lists/templates/{template.id}/create/', {
            'name': 'List from Template'
        })
        print(f"POST /lists/templates/{template.id}/create/ - Status: {response.status_code}")

    def test_analytics_and_ai(self):
        """Test analytics and AI endpoints"""
        print("\n=== Testing Analytics & AI ===")
        
        # GET /lists/analytics/
        response = self.client.get('/lists/analytics/')
        print(f"GET /lists/analytics/ - Status: {response.status_code}")
        
        # GET /lists/agenda/
        response = self.client.get('/lists/agenda/')
        print(f"GET /lists/agenda/ - Status: {response.status_code}")
        
        # GET /lists/ai/insights/
        response = self.client.get('/lists/ai/insights/')
        print(f"GET /lists/ai/insights/ - Status: {response.status_code}")
        
        # POST /lists/ai/suggestions/
        response = self.client.post('/lists/ai/suggestions/', {
            'list_name': 'Grocery List',
            'list_type': 'shopping',
            'context': 'Weekly shopping'
        })
        print(f"POST /lists/ai/suggestions/ - Status: {response.status_code}")
        
        # POST /lists/ai/parse/
        response = self.client.post('/lists/ai/parse/', {
            'text': 'buy milk, get bread, pick up dry cleaning'
        })
        print(f"POST /lists/ai/parse/ - Status: {response.status_code}")
        
        # GET /lists/ai/analytics/
        response = self.client.get('/lists/ai/analytics/')
        print(f"GET /lists/ai/analytics/ - Status: {response.status_code}")

    def test_export(self):
        """Test export functionality"""
        print("\n=== Testing Export ===")
        
        # POST /lists/export/
        response = self.client.post('/lists/export/', {
            'list_ids': [self.test_list.id],
            'format': 'csv'
        })
        print(f"POST /lists/export/ (CSV) - Status: {response.status_code}")
        
        response = self.client.post('/lists/export/', {
            'list_ids': [self.test_list.id],
            'format': 'json'
        })
        print(f"POST /lists/export/ (JSON) - Status: {response.status_code}")

def run_tests():
    """Run all API tests"""
    print("=" * 60)
    print("LISTS API ENDPOINTS TEST")
    print("=" * 60)
    
    test_case = ListsAPITestCase()
    test_case.setUp()
    
    try:
        test_case.test_lists_crud()
        test_case.test_list_items()
        test_case.test_list_operations()
        test_case.test_bulk_operations()
        test_case.test_templates()
        test_case.test_analytics_and_ai()
        test_case.test_export()
        
        print("\n" + "=" * 60)
        print("ALL TESTS COMPLETED")
        print("=" * 60)
        
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    run_tests()