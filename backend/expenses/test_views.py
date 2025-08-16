# expenses/test_views.py
"""
Test suite for expense views and API endpoints
"""

from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal
from datetime import date
from unittest.mock import patch, Mock
from .models import Expense


class ExpenseAPITestCase(APITestCase):
    """Test cases for Expense API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create JWT token for authentication
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        # Create test expenses
        self.expense1 = Expense.objects.create(
            user=self.user,
            amount=Decimal('100.50'),
            category='Food',
            vendor='Test Restaurant',
            transaction_date=date.today()
        )
        
        self.expense2 = Expense.objects.create(
            user=self.user,
            amount=Decimal('50.00'),
            category='Transport',
            vendor='Uber',
            transaction_date=date.today()
        )
    
    def test_get_expenses_authenticated(self):
        """Test getting expenses with authentication"""
        url = reverse('expense_list_create')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_get_expenses_unauthenticated(self):
        """Test getting expenses without authentication"""
        self.client.credentials()  # Remove authentication
        url = reverse('expense_list_create')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    @patch('expenses.views.GEMINI_MODEL')
    def test_create_expense_with_ai(self, mock_ai):
        """Test creating expense with AI parsing"""
        # Mock AI response
        mock_response = Mock()
        mock_response.text = '''
        {
            "expenses": [
                {
                    "amount": 25.50,
                    "category": "Food",
                    "vendor": "Coffee Shop",
                    "description": "morning coffee",
                    "transaction_date": "2023-08-15"
                }
            ]
        }
        '''
        mock_ai.generate_content.return_value = mock_response
        
        url = reverse('expense_list_create')
        data = {'text': 'bought coffee for 25.50 at coffee shop'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('expenses', response.data)
        self.assertEqual(len(response.data['expenses']), 1)
    
    def test_create_expense_missing_text(self):
        """Test creating expense without text field"""
        url = reverse('expense_list_create')
        data = {}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_get_expense_detail(self):
        """Test getting specific expense details"""
        url = reverse('expense_detail', kwargs={'expense_id': self.expense1.expense_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['expense_id'], self.expense1.expense_id)
    
    def test_update_expense(self):
        """Test updating expense"""
        url = reverse('expense_detail', kwargs={'expense_id': self.expense1.expense_id})
        data = {
            'amount': '120.00',
            'category': 'Food',
            'vendor': 'Updated Restaurant'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['vendor'], 'Updated Restaurant')
    
    def test_delete_expense(self):
        """Test deleting expense"""
        url = reverse('expense_detail', kwargs={'expense_id': self.expense1.expense_id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Expense.objects.filter(expense_id=self.expense1.expense_id).exists())


class BulkOperationsTestCase(APITestCase):
    """Test cases for bulk operations"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        # Create test expenses
        self.expenses = []
        for i in range(3):
            expense = Expense.objects.create(
                user=self.user,
                amount=Decimal(f'{100 + i}.00'),
                category='Test',
                transaction_date=date.today()
            )
            self.expenses.append(expense)
    
    def test_bulk_delete(self):
        """Test bulk delete operation"""
        url = reverse('expense_bulk_operations')
        data = {
            'operation': 'delete',
            'expense_ids': [exp.expense_id for exp in self.expenses[:2]]
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Expense.objects.filter(user=self.user).count(), 1)
    
    def test_bulk_categorize(self):
        """Test bulk categorize operation"""
        url = reverse('expense_bulk_operations')
        data = {
            'operation': 'categorize',
            'expense_ids': [exp.expense_id for exp in self.expenses],
            'category': 'New Category'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if all expenses were categorized
        for expense in self.expenses:
            expense.refresh_from_db()
            self.assertEqual(expense.category, 'New Category')
    
    def test_bulk_duplicate(self):
        """Test bulk duplicate operation"""
        initial_count = Expense.objects.filter(user=self.user).count()
        
        url = reverse('expense_bulk_operations')
        data = {
            'operation': 'duplicate',
            'expense_ids': [self.expenses[0].expense_id]
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Expense.objects.filter(user=self.user).count(), initial_count + 1)


class AnalyticsTestCase(APITestCase):
    """Test cases for analytics endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        # Create test expenses for analytics
        categories = ['Food', 'Transport', 'Shopping']
        for i, category in enumerate(categories):
            Expense.objects.create(
                user=self.user,
                amount=Decimal(f'{(i+1)*100}.00'),
                category=category,
                transaction_date=date.today()
            )
    
    def test_get_analytics(self):
        """Test getting analytics data"""
        url = reverse('expense_analytics')
        response = self.client.get(url, {'period': 'month'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
        self.assertIn('category_breakdown', response.data)
    
    def test_get_summary(self):
        """Test getting expense summary"""
        url = reverse('expense_summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_expenses', response.data)
        self.assertIn('total_amount', response.data)
        self.assertEqual(response.data['total_expenses'], 3)


class ExportTestCase(APITestCase):
    """Test cases for export functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        self.expense = Expense.objects.create(
            user=self.user,
            amount=Decimal('100.00'),
            category='Food',
            vendor='Test Restaurant',
            transaction_date=date.today()
        )
    
    def test_export_csv(self):
        """Test CSV export functionality"""
        url = reverse('expense_export')
        data = {
            'expense_ids': [self.expense.expense_id],
            'format': 'csv'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
    
    def test_export_invalid_format(self):
        """Test export with invalid format"""
        url = reverse('expense_export')
        data = {
            'expense_ids': [self.expense.expense_id],
            'format': 'invalid'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
