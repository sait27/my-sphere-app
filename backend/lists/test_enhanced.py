# lists/test_enhanced.py

import json
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
from django.core.exceptions import ValidationError

from .models import List, ListItem, ListTemplate, ListCategory, ListShare, ListActivity
from .services import ListService, ListAnalyticsService, ListTemplateService
from .validators import ListValidator, ListItemValidator

class ListModelTests(TestCase):
    """Test List and ListItem models"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.category = ListCategory.objects.create(
            user=self.user,
            name='Test Category',
            color='#FF5733'
        )
    
    def test_list_creation(self):
        """Test basic list creation"""
        list_obj = List.objects.create(
            user=self.user,
            name='Test List',
            description='Test Description',
            list_type='shopping',
            category=self.category,
            priority='high'
        )
        
        self.assertEqual(list_obj.name, 'Test List')
        self.assertEqual(list_obj.list_type, 'shopping')
        self.assertEqual(list_obj.priority, 'high')
        self.assertEqual(list_obj.completion_percentage, 0.0)
        self.assertFalse(list_obj.is_archived)
        self.assertTrue(list_obj.id.startswith('LST'))
    
    def test_list_completion_percentage(self):
        """Test completion percentage calculation"""
        list_obj = List.objects.create(
            user=self.user,
            name='Test List'
        )
        
        # Create items
        item1 = ListItem.objects.create(list=list_obj, name='Item 1')
        item2 = ListItem.objects.create(list=list_obj, name='Item 2')
        item3 = ListItem.objects.create(list=list_obj, name='Item 3')
        
        # Initially 0% complete
        list_obj.update_completion_percentage()
        list_obj.refresh_from_db()
        self.assertEqual(list_obj.completion_percentage, 0.0)
        
        # Complete one item (33.33%)
        item1.is_completed = True
        item1.save()
        list_obj.refresh_from_db()
        self.assertAlmostEqual(list_obj.completion_percentage, 33.33, places=1)
        
        # Complete all items (100%)
        item2.is_completed = True
        item2.save()
        item3.is_completed = True
        item3.save()
        list_obj.refresh_from_db()
        self.assertEqual(list_obj.completion_percentage, 100.0)
    
    def test_list_item_creation(self):
        """Test list item creation"""
        list_obj = List.objects.create(user=self.user, name='Test List')
        
        item = ListItem.objects.create(
            list=list_obj,
            name='Test Item',
            description='Test Description',
            quantity='2 pieces',
            priority='high',
            estimated_price=Decimal('25.50')
        )
        
        self.assertEqual(item.name, 'Test Item')
        self.assertEqual(item.quantity, '2 pieces')
        self.assertEqual(item.priority, 'high')
        self.assertEqual(item.estimated_price, Decimal('25.50'))
        self.assertFalse(item.is_completed)
        self.assertTrue(item.id.startswith('ITM'))
    
    def test_list_item_completion(self):
        """Test item completion tracking"""
        list_obj = List.objects.create(user=self.user, name='Test List')
        item = ListItem.objects.create(list=list_obj, name='Test Item')
        
        # Complete item
        item.is_completed = True
        item.completed_by = self.user
        item.save()
        
        self.assertTrue(item.is_completed)
        self.assertIsNotNone(item.completed_at)
        self.assertEqual(item.completed_by, self.user)
    
    def test_list_cost_calculation(self):
        """Test list cost calculation"""
        list_obj = List.objects.create(user=self.user, name='Shopping List')
        
        ListItem.objects.create(list=list_obj, name='Item 1', price=Decimal('10.00'))
        ListItem.objects.create(list=list_obj, name='Item 2', price=Decimal('15.50'))
        ListItem.objects.create(list=list_obj, name='Item 3')  # No price
        
        total_cost = list_obj.calculate_total_cost()
        self.assertEqual(total_cost, Decimal('25.50'))

class ListServiceTests(TestCase):
    """Test ListService business logic"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.service = ListService()
    
    def test_create_list_service(self):
        """Test list creation through service"""
        list_data = {
            'name': 'Service Test List',
            'description': 'Created via service',
            'list_type': 'todo',
            'priority': 'medium'
        }
        
        list_obj = self.service.create_list(self.user, list_data)
        
        self.assertEqual(list_obj.name, 'Service Test List')
        self.assertEqual(list_obj.user, self.user)
        
        # Check activity was logged
        activity = ListActivity.objects.filter(list=list_obj, action='created').first()
        self.assertIsNotNone(activity)
    
    @patch('lists.services.genai.GenerativeModel')
    def test_add_items_from_text(self, mock_model):
        """Test AI-powered item addition"""
        # Mock AI response
        mock_response = MagicMock()
        mock_response.text = '''
        {
            "items": [
                {"name": "milk", "quantity": "1 liter", "category": "dairy", "priority": "medium"},
                {"name": "bread", "quantity": "1 loaf", "category": "bakery", "priority": "low"}
            ]
        }
        '''
        mock_model.return_value.generate_content.return_value = mock_response
        
        list_obj = List.objects.create(user=self.user, name='Shopping List')
        
        items_created = self.service.add_items_from_text(
            list_obj, 
            "milk 1 liter and bread 1 loaf", 
            self.user
        )
        
        self.assertEqual(len(items_created), 2)
        self.assertEqual(items_created[0].name, 'milk')
        self.assertEqual(items_created[0].quantity, '1 liter')
        self.assertEqual(items_created[1].name, 'bread')
    
    def test_bulk_complete_items(self):
        """Test bulk item completion"""
        list_obj = List.objects.create(user=self.user, name='Test List')
        
        item1 = ListItem.objects.create(list=list_obj, name='Item 1')
        item2 = ListItem.objects.create(list=list_obj, name='Item 2')
        item3 = ListItem.objects.create(list=list_obj, name='Item 3')
        
        operation_data = {
            'operation': 'bulk_complete_items',
            'item_ids': [item1.id, item2.id],
            'completed': True
        }
        
        results = self.service.bulk_operations(self.user, operation_data)
        
        self.assertEqual(results['success'], 2)
        
        # Refresh items
        item1.refresh_from_db()
        item2.refresh_from_db()
        item3.refresh_from_db()
        
        self.assertTrue(item1.is_completed)
        self.assertTrue(item2.is_completed)
        self.assertFalse(item3.is_completed)
    
    def test_duplicate_list(self):
        """Test list duplication"""
        original_list = List.objects.create(
            user=self.user,
            name='Original List',
            description='Original description'
        )
        
        ListItem.objects.create(list=original_list, name='Item 1', quantity='2')
        ListItem.objects.create(list=original_list, name='Item 2', priority='high')
        
        operation_data = {
            'operation': 'duplicate_list',
            'list_id': original_list.id,
            'new_name': 'Duplicated List'
        }
        
        results = self.service.bulk_operations(self.user, operation_data)
        
        self.assertEqual(results['success'], 1)
        
        # Check duplicate was created
        duplicate_list = List.objects.get(id=results['list_id'])
        self.assertEqual(duplicate_list.name, 'Duplicated List')
        self.assertEqual(duplicate_list.items.count(), 2)

class ListAnalyticsServiceTests(TestCase):
    """Test ListAnalyticsService"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.analytics_service = ListAnalyticsService()
        
        # Create test data
        self.list1 = List.objects.create(user=self.user, name='List 1', list_type='shopping')
        self.list2 = List.objects.create(user=self.user, name='List 2', list_type='todo')
        
        # Add items
        ListItem.objects.create(list=self.list1, name='Item 1', is_completed=True)
        ListItem.objects.create(list=self.list1, name='Item 2', is_completed=False)
        ListItem.objects.create(list=self.list2, name='Item 3', is_completed=True)
    
    def test_get_user_analytics(self):
        """Test analytics generation"""
        analytics = self.analytics_service.get_user_analytics(self.user, 'month')
        
        self.assertIn('summary', analytics)
        self.assertIn('productivity', analytics)
        self.assertIn('categories', analytics)
        self.assertIn('list_types', analytics)
        
        # Check summary stats
        summary = analytics['summary']
        self.assertEqual(summary['total_lists'], 2)
        self.assertEqual(summary['total_items'], 3)
        self.assertEqual(summary['completed_items'], 2)

class ListValidatorTests(TestCase):
    """Test validation logic"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_valid_list_creation(self):
        """Test valid list creation data"""
        data = {
            'name': 'Valid List',
            'description': 'Valid description',
            'list_type': 'shopping',
            'priority': 'medium'
        }
        
        validated_data = ListValidator.validate_create_list(data, self.user)
        self.assertEqual(validated_data['name'], 'Valid List')
    
    def test_invalid_list_name(self):
        """Test invalid list name validation"""
        data = {'name': ''}  # Empty name
        
        with self.assertRaises(ValidationError):
            ListValidator.validate_create_list(data, self.user)
    
    def test_duplicate_list_name(self):
        """Test duplicate list name validation"""
        List.objects.create(user=self.user, name='Existing List')
        
        data = {'name': 'Existing List'}
        
        with self.assertRaises(ValidationError):
            ListValidator.validate_create_list(data, self.user)
    
    def test_valid_item_creation(self):
        """Test valid item creation data"""
        list_obj = List.objects.create(user=self.user, name='Test List')
        
        data = {
            'name': 'Valid Item',
            'quantity': '2 pieces',
            'priority': 'high',
            'price': '25.50'
        }
        
        validated_data = ListItemValidator.validate_create_item(data, list_obj)
        self.assertEqual(validated_data['name'], 'Valid Item')
    
    def test_invalid_item_price(self):
        """Test invalid item price validation"""
        list_obj = List.objects.create(user=self.user, name='Test List')
        
        data = {
            'name': 'Test Item',
            'price': '-10.00'  # Negative price
        }
        
        with self.assertRaises(ValidationError):
            ListItemValidator.validate_create_item(data, list_obj)

class ListAPITests(APITestCase):
    """Test List API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_create_list_api(self):
        """Test list creation via API"""
        url = reverse('list-list-create')
        data = {
            'name': 'API Test List',
            'description': 'Created via API',
            'list_type': 'todo',
            'priority': 'high'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'API Test List')
        self.assertTrue(response.data['id'].startswith('LST'))
    
    def test_list_list_api(self):
        """Test list retrieval via API"""
        List.objects.create(user=self.user, name='Test List 1')
        List.objects.create(user=self.user, name='Test List 2')
        
        url = reverse('list-list-create')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_list_filtering(self):
        """Test list filtering"""
        List.objects.create(user=self.user, name='Shopping List', list_type='shopping')
        List.objects.create(user=self.user, name='Todo List', list_type='todo')
        
        url = reverse('list-list-create')
        response = self.client.get(url, {'list_type': 'shopping'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Shopping List')
    
    def test_list_search(self):
        """Test list search"""
        List.objects.create(user=self.user, name='Grocery Shopping')
        List.objects.create(user=self.user, name='Work Tasks')
        
        url = reverse('list-list-create')
        response = self.client.get(url, {'search': 'grocery'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Grocery Shopping')
    
    @patch('lists.services.genai.GenerativeModel')
    def test_smart_add_items_api(self, mock_model):
        """Test AI-powered item addition via API"""
        # Mock AI response
        mock_response = MagicMock()
        mock_response.text = '''
        {
            "items": [
                {"name": "apples", "quantity": "1 kg"},
                {"name": "bananas", "quantity": "6 pieces"}
            ]
        }
        '''
        mock_model.return_value.generate_content.return_value = mock_response
        
        list_obj = List.objects.create(user=self.user, name='Shopping List')
        
        url = reverse('smart-add-items', kwargs={'list_id': list_obj.id})
        data = {'text': 'apples 1 kg and bananas 6 pieces'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('Successfully added', response.data['status'])
        self.assertEqual(response.data['items_count'], 2)
    
    def test_bulk_operations_api(self):
        """Test bulk operations via API"""
        list_obj = List.objects.create(user=self.user, name='Test List')
        item1 = ListItem.objects.create(list=list_obj, name='Item 1')
        item2 = ListItem.objects.create(list=list_obj, name='Item 2')
        
        url = reverse('list-bulk-operations')
        data = {
            'operation': 'bulk_complete_items',
            'item_ids': [item1.id, item2.id],
            'completed': True
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['success'], 2)
    
    def test_list_analytics_api(self):
        """Test analytics API"""
        # Create test data
        list_obj = List.objects.create(user=self.user, name='Test List')
        ListItem.objects.create(list=list_obj, name='Item 1', is_completed=True)
        ListItem.objects.create(list=list_obj, name='Item 2', is_completed=False)
        
        url = reverse('list-analytics')
        response = self.client.get(url, {'period': 'month'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
        self.assertIn('productivity', response.data)
    
    def test_list_export_api(self):
        """Test list export"""
        list_obj = List.objects.create(user=self.user, name='Export Test')
        ListItem.objects.create(list=list_obj, name='Item 1', quantity='2')
        ListItem.objects.create(list=list_obj, name='Item 2', price=Decimal('10.50'))
        
        url = reverse('list-export')
        data = {
            'list_ids': [list_obj.id],
            'format': 'csv'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
    
    def test_unauthorized_access(self):
        """Test unauthorized API access"""
        self.client.credentials()  # Remove auth
        
        url = reverse('list-list-create')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_user_isolation(self):
        """Test that users can only access their own lists"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='otherpass123'
        )
        
        # Create list for other user
        other_list = List.objects.create(user=other_user, name='Other User List')
        
        # Try to access other user's list
        url = reverse('list-detail', kwargs={'pk': other_list.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class ListTemplateTests(TestCase):
    """Test list template functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.template_service = ListTemplateService()
    
    def test_create_template_from_list(self):
        """Test template creation from existing list"""
        list_obj = List.objects.create(
            user=self.user,
            name='Shopping List',
            list_type='shopping'
        )
        
        ListItem.objects.create(list=list_obj, name='Milk', quantity='1 liter')
        ListItem.objects.create(list=list_obj, name='Bread', quantity='1 loaf')
        
        template_data = {
            'name': 'Grocery Template',
            'description': 'Basic grocery items',
            'category': 'shopping',
            'is_public': False
        }
        
        template = self.template_service.create_template_from_list(
            self.user, list_obj, template_data
        )
        
        self.assertEqual(template.name, 'Grocery Template')
        self.assertEqual(len(template.metadata['items']), 2)
    
    def test_create_list_from_template(self):
        """Test list creation from template"""
        template = ListTemplate.objects.create(
            user=self.user,
            name='Shopping Template',
            category='shopping',
            metadata={
                'list_type': 'shopping',
                'items': [
                    {'name': 'Milk', 'quantity': '1 liter'},
                    {'name': 'Bread', 'quantity': '1 loaf'}
                ]
            }
        )
        
        new_list = self.template_service.create_list_from_template(
            self.user, template, 'Weekly Shopping'
        )
        
        self.assertEqual(new_list.name, 'Weekly Shopping')
        self.assertEqual(new_list.list_type, 'shopping')
        self.assertEqual(new_list.items.count(), 2)
        
        # Check template usage count increased
        template.refresh_from_db()
        self.assertEqual(template.use_count, 1)
