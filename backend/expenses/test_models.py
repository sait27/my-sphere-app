# expenses/test_models.py
"""
Test suite for expense models
"""

from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import date
from .models import Expense, ExpenseCategory, ExpenseTag


class ExpenseModelTest(TestCase):
    """Test cases for Expense model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_expense_creation(self):
        """Test basic expense creation"""
        expense = Expense.objects.create(
            user=self.user,
            amount=Decimal('100.50'),
            category='Food',
            vendor='Test Restaurant',
            description='Lunch',
            transaction_date=date.today()
        )
        
        self.assertEqual(expense.user, self.user)
        self.assertEqual(expense.amount, Decimal('100.50'))
        self.assertEqual(expense.category, 'Food')
        self.assertEqual(expense.vendor, 'Test Restaurant')
        self.assertTrue(expense.expense_id.startswith('EXP'))
        self.assertEqual(expense.display_id, 1)
    
    def test_expense_id_generation(self):
        """Test unique expense ID generation"""
        expense1 = Expense.objects.create(
            user=self.user,
            amount=Decimal('50.00'),
            category='Transport',
            transaction_date=date.today()
        )
        
        expense2 = Expense.objects.create(
            user=self.user,
            amount=Decimal('75.00'),
            category='Food',
            transaction_date=date.today()
        )
        
        self.assertNotEqual(expense1.expense_id, expense2.expense_id)
        self.assertEqual(expense1.display_id, 1)
        self.assertEqual(expense2.display_id, 2)
    
    def test_total_amount_calculation(self):
        """Test total amount property calculation"""
        expense = Expense.objects.create(
            user=self.user,
            amount=Decimal('100.00'),
            category='Food',
            tax_amount=Decimal('10.00'),
            tip_amount=Decimal('15.00'),
            discount_amount=Decimal('5.00'),
            transaction_date=date.today()
        )
        
        expected_total = Decimal('120.00')  # 100 + 10 + 15 - 5
        self.assertEqual(expense.total_amount, expected_total)
    
    def test_expense_string_representation(self):
        """Test expense string representation"""
        expense = Expense.objects.create(
            user=self.user,
            amount=Decimal('100.50'),
            category='Food',
            transaction_date=date.today()
        )
        
        expected_str = f"{self.user.username} - {expense.expense_id} - $100.50"
        self.assertEqual(str(expense), expected_str)


class ExpenseCategoryModelTest(TestCase):
    """Test cases for ExpenseCategory model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_category_creation(self):
        """Test expense category creation"""
        category = ExpenseCategory.objects.create(
            user=self.user,
            name='Custom Food',
            color='#FF5733',
            icon='utensils',
            budget_limit=Decimal('500.00')
        )
        
        self.assertEqual(category.user, self.user)
        self.assertEqual(category.name, 'Custom Food')
        self.assertEqual(category.color, '#FF5733')
        self.assertEqual(category.budget_limit, Decimal('500.00'))
        self.assertTrue(category.is_active)
    
    def test_category_unique_constraint(self):
        """Test unique constraint on user and category name"""
        ExpenseCategory.objects.create(
            user=self.user,
            name='Food',
            color='#FF5733'
        )
        
        with self.assertRaises(Exception):
            ExpenseCategory.objects.create(
                user=self.user,
                name='Food',  # Duplicate name for same user
                color='#33FF57'
            )


class ExpenseTagModelTest(TestCase):
    """Test cases for ExpenseTag model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_tag_creation(self):
        """Test expense tag creation"""
        tag = ExpenseTag.objects.create(
            user=self.user,
            name='business',
            color='#3366CC'
        )
        
        self.assertEqual(tag.user, self.user)
        self.assertEqual(tag.name, 'business')
        self.assertEqual(tag.color, '#3366CC')
    
    def test_tag_expense_relationship(self):
        """Test many-to-many relationship between tags and expenses"""
        tag1 = ExpenseTag.objects.create(user=self.user, name='business')
        tag2 = ExpenseTag.objects.create(user=self.user, name='urgent')
        
        expense = Expense.objects.create(
            user=self.user,
            amount=Decimal('100.00'),
            category='Office',
            transaction_date=date.today()
        )
        
        expense.tags.add(tag1, tag2)
        
        self.assertEqual(expense.tags.count(), 2)
        self.assertIn(tag1, expense.tags.all())
        self.assertIn(tag2, expense.tags.all())
