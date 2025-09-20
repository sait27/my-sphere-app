# MY SPHERE Backend Development Rule Book

## Table of Contents
1. [Project Structure](#project-structure)
2. [Feature Development Guidelines](#feature-development-guidelines)
3. [Coding Standards](#coding-standards)
4. [API Design Guidelines](#api-design-guidelines)
5. [Database Guidelines](#database-guidelines)
6. [Security Best Practices](#security-best-practices)
7. [Error Handling](#error-handling)
8. [Testing Standards](#testing-standards)
9. [Documentation Requirements](#documentation-requirements)
10. [Performance Guidelines](#performance-guidelines)
11. [Deployment & Environment](#deployment--environment)

---

## Project Structure

### MY SPHERE Feature-Based Directory Layout
```
backend/
├── expenses/                  # Expense Management Feature
│   ├── migrations/           # Database migrations for expenses
│   ├── models.py            # Expense data models
│   ├── views.py             # API endpoints
│   ├── serializers.py       # Data serialization
│   ├── services.py          # Business logic
│   ├── validators.py        # Input validation
│   ├── ai_insights.py       # AI-powered insights
│   ├── advanced_analytics.py # Analytics features
│   ├── urls.py              # URL routing
│   ├── tests.py             # Feature tests
│   └── README.md            # Feature documentation
├── budgets/                  # Budget Management Feature
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── tests.py
├── subscriptions/            # Subscription Management Feature
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── ai_insights.py
│   ├── nlp_parser.py
│   ├── urls.py
│   └── tests.py
├── todos/                    # Task Management Feature
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── ai_engine.py
│   ├── urls.py
│   └── tests.py
├── lists/                    # List Management Feature
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── services.py
│   ├── validators.py
│   ├── urls.py
│   └── tests.py
├── lending/                  # Lending Management Feature
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── services.py
│   ├── validators.py
│   ├── ai_insights.py
│   ├── urls.py
│   └── tests.py
├── users/                    # User Management Feature
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   └── tests.py
├── integrations/             # Third-party Integrations
│   ├── migrations/
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   └── tests.py
├── mysphere_core/            # Core Django Settings
│   ├── settings.py          # Main settings
│   ├── settings_security.py # Security configurations
│   ├── urls.py              # Main URL routing
│   ├── health.py            # Health check endpoints
│   └── openapi.py           # API documentation config
├── requirements.txt          # Python dependencies
├── .env                     # Environment variables
├── manage.py                # Django management
└── db.sqlite3               # Database file
```

---

## Feature Development Guidelines

### When Creating a New Feature
1. **Create feature folder** in backend/ directory
2. **Follow the standard Django app structure**
3. **Include all required files** for the feature
4. **Add feature to INSTALLED_APPS** in settings.py
5. **Create URL routing** and include in main urls.py

### Standard MY SPHERE Feature Structure
Every feature folder MUST contain exactly these files:
```
feature_name/
├── migrations/              # Database migrations
├── __init__.py             # Python package marker
├── models.py               # Data models
├── views.py                # API endpoints (minimal logic)
├── serializers.py          # Data serialization
├── services.py             # ALL business logic (MANDATORY)
├── urls.py                 # URL routing with health check
├── tests.py                # Unit tests
├── admin.py                # Django admin config
├── apps.py                 # App configuration
├── ai_insights.py          # AI features (if applicable)
└── README.md               # Feature documentation
```

### MY SPHERE Feature Requirements
1. **services.py is MANDATORY** - All business logic goes here
2. **Health check endpoint** in every feature's urls.py
3. **AI insights caching** implemented in services.py
4. **Same file structure** across all features
5. **All API keys** in .env file only

### MY SPHERE File Naming Conventions
- **Feature Folders**: Use lowercase (e.g., `expenses/`, `budgets/`)
- **Python Files**: Use snake_case (e.g., `ai_insights.py`, `advanced_analytics.py`)
- **Classes**: Use PascalCase (e.g., `ExpenseModel`, `BudgetSerializer`)
- **Functions/Variables**: Use snake_case (e.g., `get_user_expenses`, `calculate_budget`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_EXPENSE_AMOUNT`, `DEFAULT_CATEGORIES`)

### Feature Naming Rules
- **Models**: `{Feature}Model` (e.g., `ExpenseModel`, `BudgetModel`)
- **Serializers**: `{Feature}Serializer` (e.g., `ExpenseSerializer`)
- **Views**: `{Feature}ViewSet` or `{Feature}APIView`
- **Services**: `{Feature}Service` (e.g., `ExpenseService`)
- **AI Components**: `{Feature}AIInsights` (e.g., `ExpenseAIInsights`)

---

## Coding Standards

### Django & Python Style Guide
- Follow **PEP 8** standards
- Use **Django best practices** for models, views, and serializers
- Maximum line length: **88 characters** (Black formatter standard)
- Use **type hints** for all function parameters and return values
- Use **docstrings** for all classes and functions
- Follow **Django REST Framework** patterns for API development

### MY SPHERE Django Model Example
```python
# expenses/models.py
from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

class ExpenseModel(models.Model):
    """
    Model for tracking user expenses in MY SPHERE.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    vendor = models.CharField(max_length=200, blank=True, null=True)
    transaction_date = models.DateField()
    raw_text = models.TextField()  # Original expense text
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'expenses'
        ordering = ['-transaction_date']
    
    def __str__(self):
        return f"{self.user.username} - {self.amount} - {self.category}"
```

### MY SPHERE Service Layer Example
```python
# expenses/services.py
from typing import List, Optional
from decimal import Decimal
from .models import ExpenseModel

class ExpenseService:
    """
    Business logic service for expense operations.
    """
    
    @staticmethod
    def calculate_total_by_category(
        user_id: int, 
        category: Optional[str] = None
    ) -> Decimal:
        """
        Calculate total expenses for user by category.
        
        Args:
            user_id: User ID
            category: Optional category filter
            
        Returns:
            Total amount as Decimal
        """
        queryset = ExpenseModel.objects.filter(user_id=user_id)
        
        if category:
            queryset = queryset.filter(category=category)
        
        total = queryset.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        
        return total
```

### MY SPHERE Import Organization
```python
# Standard library imports
import os
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from decimal import Decimal

# Django imports
from django.db import models
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Q

# Django REST Framework imports
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# Local MY SPHERE imports
from .models import ExpenseModel
from .serializers import ExpenseSerializer
from .services import ExpenseService
from .ai_insights import ExpenseAIInsights
```

---

## API Design Guidelines

### MY SPHERE RESTful Endpoints
- Use **plural nouns** for resources: `/api/expenses/`
- Follow **Django REST Framework** ViewSet patterns
- Use **HTTP methods** correctly:
  - `GET` - Retrieve data
  - `POST` - Create new resource
  - `PUT` - Update entire resource
  - `PATCH` - Partial update
  - `DELETE` - Remove resource

### MY SPHERE URL Structure
```
# Expenses Feature
GET    /api/expenses/              # List user expenses
POST   /api/expenses/              # Create new expense
GET    /api/expenses/{id}/         # Get specific expense
PUT    /api/expenses/{id}/         # Update expense
DELETE /api/expenses/{id}/         # Delete expense
GET    /api/expenses/analytics/    # Get expense analytics
POST   /api/expenses/bulk_create/  # Bulk create expenses

# Budgets Feature
GET    /api/budgets/               # List user budgets
POST   /api/budgets/               # Create new budget
GET    /api/budgets/{id}/          # Get specific budget

# Subscriptions Feature
GET    /api/subscriptions/         # List user subscriptions
POST   /api/subscriptions/         # Create new subscription
GET    /api/subscriptions/insights/ # Get AI insights

# Todos Feature
GET    /api/todos/                 # List user todos
POST   /api/todos/                 # Create new todo
GET    /api/todos/ai_suggestions/  # Get AI suggestions

# Lists Feature
GET    /api/lists/                 # List user lists
POST   /api/lists/                 # Create new list
GET    /api/lists/{id}/items/      # Get list items

# Lending Feature
GET    /api/lending/               # List lending records
POST   /api/lending/               # Create lending record
GET    /api/lending/insights/      # Get lending insights
```

### MY SPHERE Django REST Response Format
```json
// Success Response (Django REST Framework standard)
{
  "expense_id": 123,
  "amount": "25.50",
  "category": "Food & Dining",
  "vendor": "Restaurant ABC",
  "transaction_date": "2024-01-15",
  "created_at": "2024-01-15T10:30:00Z",
  "user": 1
}

// List Response with Pagination
{
  "count": 150,
  "next": "http://localhost:8000/api/expenses/?page=2",
  "previous": null,
  "results": [
    {
      "expense_id": 123,
      "amount": "25.50",
      "category": "Food & Dining"
    }
  ]
}
```

### MY SPHERE Error Response Format
```json
// Validation Error
{
  "amount": ["This field is required."],
  "category": ["This field may not be blank."]
}

// Custom Error Response
{
  "detail": "Expense not found.",
  "code": "not_found"
}

// AI Service Error
{
  "error": "AI service temporarily unavailable",
  "fallback_used": true
}
```

---

## Database Guidelines

### MY SPHERE Django Model Structure
```python
# Base model pattern for MY SPHERE
from django.db import models
from django.contrib.auth.models import User

class BaseModel(models.Model):
    """Base model with common fields for all MY SPHERE features"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        abstract = True

# Feature-specific model example
class ExpenseModel(BaseModel):
    """Expense model for MY SPHERE expense tracking"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    vendor = models.CharField(max_length=200, blank=True, null=True)
    transaction_date = models.DateField()
    raw_text = models.TextField()  # For AI parsing
    payment_method = models.CharField(max_length=50, blank=True)
    expense_type = models.CharField(max_length=50, default='expense')
    
    class Meta:
        db_table = 'expenses'
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'transaction_date']),
            models.Index(fields=['category']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - ${self.amount} - {self.category}"
```

### MY SPHERE Database Rules
1. **Always use Django migrations** for schema changes
2. **Add database indexes** on frequently queried fields (user, dates, categories)
3. **Use foreign keys** with proper `related_name` attributes
4. **Soft delete** using `is_active` flag (never hard delete user data)
5. **Validate data** in both serializers and models
6. **Use proper field types** (DecimalField for money, DateField for dates)
7. **Add Meta class** with `db_table` and `ordering` for each model
8. **Include `__str__` method** for better admin interface

---

## Security Best Practices

### Authentication & Authorization
- Use **JWT tokens** for API authentication
- Implement **role-based access control** (RBAC)
- **Hash passwords** using bcrypt with salt
- **Validate all inputs** to prevent injection attacks

### MY SPHERE Environment Variables
```python
# mysphere_core/settings.py
import os
from pathlib import Path

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# MY SPHERE AI Configuration - Using Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
AI_INSIGHTS_ENABLED = os.getenv('AI_INSIGHTS_ENABLED', 'True').lower() == 'true'
AI_MODEL = 'gemini-1.5-flash'  # Using Gemini 1.5 Flash
MAX_EXPENSE_AMOUNT = float(os.getenv('MAX_EXPENSE_AMOUNT', '10000.00'))

# AI Caching Configuration
AI_CACHE_TIMEOUT = int(os.getenv('AI_CACHE_TIMEOUT', '86400'))  # 24 hours
AI_MAX_CALLS_PER_DAY = int(os.getenv('AI_MAX_CALLS_PER_DAY', '3'))  # Max 3 calls per day per user

# Feature flags
FEATURE_FLAGS = {
    'EXPENSE_AI_INSIGHTS': os.getenv('EXPENSE_AI_INSIGHTS', 'True').lower() == 'true',
    'SUBSCRIPTION_TRACKING': os.getenv('SUBSCRIPTION_TRACKING', 'True').lower() == 'true',
    'LENDING_FEATURE': os.getenv('LENDING_FEATURE', 'True').lower() == 'true',
}
```

### MY SPHERE Input Validation
```python
# expenses/serializers.py
from rest_framework import serializers
from decimal import Decimal
from .models import ExpenseModel
from .validators import validate_expense_amount, validate_category

class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for MY SPHERE expense data"""
    
    class Meta:
        model = ExpenseModel
        fields = ['expense_id', 'amount', 'category', 'vendor', 
                 'transaction_date', 'raw_text', 'payment_method']
        read_only_fields = ['expense_id', 'created_at', 'updated_at']
    
    def validate_amount(self, value):
        """Validate expense amount"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        if value > Decimal('10000.00'):
            raise serializers.ValidationError("Amount cannot exceed $10,000")
        return value
    
    def validate_category(self, value):
        """Validate expense category"""
        valid_categories = [
            'Food & Dining', 'Groceries', 'Shopping', 'Travel',
            'Entertainment', 'Utilities', 'Health', 'Education', 'Other'
        ]
        if value not in valid_categories:
            raise serializers.ValidationError(
                f'Category must be one of: {", ".join(valid_categories)}'
            )
        return value

# expenses/validators.py
from django.core.exceptions import ValidationError
from decimal import Decimal

def validate_expense_amount(value):
    """Custom validator for expense amounts"""
    if value <= 0:
        raise ValidationError('Amount must be greater than 0')
    if value > Decimal('10000.00'):
        raise ValidationError('Amount cannot exceed $10,000')

def validate_category(value):
    """Custom validator for expense categories"""
    valid_categories = [
        'Food & Dining', 'Groceries', 'Shopping', 'Travel',
        'Entertainment', 'Utilities', 'Health', 'Education', 'Other'
    ]
    if value not in valid_categories:
        raise ValidationError(f'Invalid category: {value}')
```

---

## Error Handling

### Custom Exception Classes
```python
class BaseAPIException(Exception):
    """Base exception for API errors"""
    def __init__(self, message: str, code: str, status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)

class ValidationError(BaseAPIException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "VALIDATION_ERROR", 400)
        self.details = details or {}

class NotFoundError(BaseAPIException):
    def __init__(self, resource: str, identifier: str):
        message = f"{resource} with id '{identifier}' not found"
        super().__init__(message, "NOT_FOUND", 404)
```

### Error Handler
```python
@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": getattr(exc, 'details', {})
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

---

## Testing Standards

### MY SPHERE Test Structure
```
# Feature-based testing in MY SPHERE
expenses/
├── tests.py                   # Main test file
├── test_models.py            # Model tests
├── test_views.py             # API endpoint tests
└── test_ai_insights.py       # AI feature tests

budgets/
├── tests.py
└── test_models.py

subscriptions/
├── tests.py
└── test_nlp_parser.py

# Global test utilities
tests/
├── fixtures/                 # Test data
│   ├── expense_fixtures.py
│   ├── user_fixtures.py
│   └── budget_fixtures.py
└── utils/                    # Test utilities
    ├── test_helpers.py
    └── api_test_client.py
```

### MY SPHERE Django Test Example
```python
# expenses/test_models.py
from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import date
from .models import ExpenseModel

class ExpenseModelTest(TestCase):
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_expense_success(self):
        """Test creating a valid expense"""
        expense = ExpenseModel.objects.create(
            user=self.user,
            amount=Decimal('25.50'),
            category='Food & Dining',
            vendor='Restaurant ABC',
            transaction_date=date.today(),
            raw_text='Lunch at Restaurant ABC $25.50'
        )
        
        self.assertEqual(expense.amount, Decimal('25.50'))
        self.assertEqual(expense.category, 'Food & Dining')
        self.assertEqual(expense.vendor, 'Restaurant ABC')
        self.assertEqual(expense.user, self.user)
        self.assertTrue(expense.is_active)
    
    def test_expense_str_representation(self):
        """Test string representation of expense"""
        expense = ExpenseModel.objects.create(
            user=self.user,
            amount=Decimal('25.50'),
            category='Food & Dining',
            transaction_date=date.today(),
            raw_text='Test expense'
        )
        
        expected_str = f"{self.user.username} - $25.50 - Food & Dining"
        self.assertEqual(str(expense), expected_str)

# expenses/test_views.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date
from .models import ExpenseModel

class ExpenseAPITest(TestCase):
    
    def setUp(self):
        """Set up test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_expense_api(self):
        """Test creating expense via API"""
        data = {
            'amount': '25.50',
            'category': 'Food & Dining',
            'vendor': 'Restaurant ABC',
            'transaction_date': date.today().isoformat(),
            'raw_text': 'Lunch at Restaurant ABC $25.50'
        }
        
        response = self.client.post('/api/expenses/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ExpenseModel.objects.count(), 1)
        
        expense = ExpenseModel.objects.first()
        self.assertEqual(expense.amount, Decimal('25.50'))
        self.assertEqual(expense.user, self.user)
    
    def test_list_user_expenses(self):
        """Test listing user's expenses"""
        # Create test expenses
        ExpenseModel.objects.create(
            user=self.user,
            amount=Decimal('25.50'),
            category='Food & Dining',
            transaction_date=date.today(),
            raw_text='Test expense 1'
        )
        
        response = self.client.get('/api/expenses/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_invalid_amount_validation(self):
        """Test validation for invalid amount"""
        data = {
            'amount': '-10.00',  # Invalid negative amount
            'category': 'Food & Dining',
            'transaction_date': date.today().isoformat(),
            'raw_text': 'Invalid expense'
        }
        
        response = self.client.post('/api/expenses/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount', response.data)
```

---

## Documentation Requirements

### API Documentation
- Use **OpenAPI/Swagger** for API documentation
- Document **all endpoints** with examples
- Include **request/response schemas**
- Provide **authentication details**

### MY SPHERE Code Documentation
```python
# expenses/services.py
class ExpenseService:
    """
    Service class for managing MY SPHERE expense operations.
    
    This service handles all business logic related to expenses including
    creation, AI-powered parsing, analytics, and retrieval operations.
    
    Features:
    - Natural language expense parsing
    - Category auto-detection
    - Expense analytics and insights
    - Bulk operations
    """
    
    def create_expense_from_text(self, user_id: int, expense_text: str) -> ExpenseModel:
        """
        Create expense from natural language text using AI parsing.
        
        This method uses OpenAI to parse natural language expense descriptions
        and extract structured data like amount, category, vendor, and date.
        
        Args:
            user_id (int): ID of the user creating the expense
            expense_text (str): Natural language expense description
                Examples:
                - "Spent $25.50 on lunch at McDonald's today"
                - "Coffee at Starbucks for $4.75 yesterday"
                - "Grocery shopping at Walmart $85.20 on 2024-01-15"
        
        Returns:
            ExpenseModel: Created expense object with parsed data
            
        Raises:
            ValidationError: If expense text cannot be parsed
            AIServiceError: If AI parsing service is unavailable
            DatabaseError: If database operation fails
            
        Example:
            >>> service = ExpenseService()
            >>> expense = service.create_expense_from_text(
            ...     user_id=1, 
            ...     expense_text="Lunch at Pizza Hut $15.99"
            ... )
            >>> print(expense.amount)  # Decimal('15.99')
            >>> print(expense.category)  # 'Food & Dining'
        """
        
# expenses/ai_insights.py
class ExpenseAIInsights:
    """
    AI-powered insights and analytics for MY SPHERE expenses.
    
    Provides intelligent analysis of spending patterns, budget recommendations,
    and personalized financial insights using OpenAI.
    """
    
    def generate_spending_insights(self, user_id: int, period: str = 'month') -> dict:
        """
        Generate AI-powered spending insights for user.
        
        Args:
            user_id (int): User ID to analyze
            period (str): Analysis period ('week', 'month', 'quarter', 'year')
            
        Returns:
            dict: Insights containing:
                - spending_trends: Analysis of spending patterns
                - budget_recommendations: Suggested budget adjustments
                - category_insights: Category-specific recommendations
                - alerts: Important spending alerts
                
        Example:
            >>> insights = ExpenseAIInsights()
            >>> result = insights.generate_spending_insights(user_id=1)
            >>> print(result['spending_trends'])
        """
```

---

## Performance Guidelines

### Database Optimization
1. **Use database indexes** on frequently queried columns
2. **Implement pagination** for list endpoints
3. **Use select_related/prefetch_related** to avoid N+1 queries
4. **Cache frequently accessed data** using Redis

### MY SPHERE API Performance
```python
# expenses/views.py - Django REST Framework ViewSet
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from django.db.models import Q, Sum, Count
from .models import ExpenseModel
from .serializers import ExpenseSerializer
from .services import ExpenseService

class ExpenseViewSet(viewsets.ModelViewSet):
    """
    MY SPHERE Expense ViewSet with optimized performance.
    
    Provides CRUD operations for expenses with:
    - Automatic pagination
    - Query optimization
    - Caching for analytics
    - Bulk operations
    """
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Optimized queryset for user expenses"""
        return ExpenseModel.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related('user').order_by('-transaction_date', '-created_at')
    
    def list(self, request):
        """List expenses with filtering and pagination"""
        queryset = self.get_queryset()
        
        # Apply filters
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from and date_to:
            queryset = queryset.filter(
                transaction_date__range=[date_from, date_to]
            )
        
        # Search functionality
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(vendor__icontains=search) |
                Q(category__icontains=search) |
                Q(raw_text__icontains=search)
            )
        
        # Paginate results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get cached expense analytics"""
        user_id = request.user.id
        cache_key = f'expense_analytics_{user_id}'
        
        # Try to get from cache first
        analytics_data = cache.get(cache_key)
        if analytics_data:
            return Response(analytics_data)
        
        # Calculate analytics
        queryset = self.get_queryset()
        analytics_data = {
            'total_expenses': queryset.count(),
            'total_amount': queryset.aggregate(Sum('amount'))['amount__sum'] or 0,
            'categories': queryset.values('category').annotate(
                count=Count('id'),
                total=Sum('amount')
            ).order_by('-total'),
            'monthly_trend': self._get_monthly_trend(queryset)
        }
        
        # Cache for 1 hour
        cache.set(cache_key, analytics_data, 3600)
        
        return Response(analytics_data)
    
    def _get_monthly_trend(self, queryset):
        """Helper method to calculate monthly spending trend"""
        from django.db.models import TruncMonth
        
        return queryset.annotate(
            month=TruncMonth('transaction_date')
        ).values('month').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('month')
```

### MY SPHERE Caching Strategy
```python
# expenses/services.py - Django caching
from django.core.cache import cache
from django.db.models import Count, Sum
from .models import ExpenseModel

class ExpenseService:
    
    @staticmethod
    def get_user_categories(user_id: int) -> list:
        """Get cached list of user's expense categories"""
        cache_key = f'user_categories_{user_id}'
        categories = cache.get(cache_key)
        
        if categories is None:
            categories = list(
                ExpenseModel.objects.filter(
                    user_id=user_id, 
                    is_active=True
                ).values_list('category', flat=True).distinct()
            )
            # Cache for 30 minutes
            cache.set(cache_key, categories, 1800)
        
        return categories
    
    @staticmethod
    def get_spending_summary(user_id: int, period: str = 'month') -> dict:
        """Get cached spending summary for user"""
        cache_key = f'spending_summary_{user_id}_{period}'
        summary = cache.get(cache_key)
        
        if summary is None:
            queryset = ExpenseModel.objects.filter(
                user_id=user_id,
                is_active=True
            )
            
            # Apply period filter
            if period == 'month':
                from datetime import datetime, timedelta
                start_date = datetime.now().replace(day=1).date()
                queryset = queryset.filter(transaction_date__gte=start_date)
            
            summary = {
                'total_amount': queryset.aggregate(Sum('amount'))['amount__sum'] or 0,
                'total_count': queryset.count(),
                'categories': list(
                    queryset.values('category').annotate(
                        total=Sum('amount'),
                        count=Count('id')
                    ).order_by('-total')
                )
            }
            
            # Cache for 1 hour
            cache.set(cache_key, summary, 3600)
        
        return summary
    
    @staticmethod
    def invalidate_user_cache(user_id: int):
        """Invalidate all cached data for a user"""
        cache_keys = [
            f'user_categories_{user_id}',
            f'spending_summary_{user_id}_month',
            f'spending_summary_{user_id}_year',
            f'expense_analytics_{user_id}'
        ]
        
        for key in cache_keys:
            cache.delete(key)

# mysphere_core/settings.py - Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 3600,  # 1 hour default
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}
```

---

## MY SPHERE Mandatory Rules

### Rule 1: Business Logic in Services
```python
# ✅ CORRECT - All logic in services.py
class FeatureService:
    @staticmethod
    def create_item(user, data):
        # All business logic here
        pass

# ❌ WRONG - Logic in views.py
class FeatureViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        # Business logic here - WRONG!
        pass
```

### Rule 2: AI Insights Caching (Mandatory)
```python
# ✅ CORRECT - Cached AI insights
@staticmethod
def get_ai_insights(user):
    cache_key = f'ai_insights_feature_{user.id}_{datetime.now().date()}'
    cached = cache.get(cache_key)
    if cached:
        return cached
    # Generate and cache insights
    cache.set(cache_key, insights, 86400)
    return insights
```

### Rule 3: Health Check (Mandatory)
```python
# ✅ CORRECT - Every feature must have health check
def feature_health_check(request):
    return JsonResponse({
        'feature': 'feature_name',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })
```

### Rule 4: Same File Structure (Mandatory)
```
# ✅ CORRECT - Every feature has same files
feature_name/
├── models.py
├── views.py
├── serializers.py
├── services.py      # MANDATORY
├── urls.py          # with health check
├── ai_insights.py   # if AI features
└── README.md
```

### Rule 5: API Keys in .env (Mandatory)
```bash
# ✅ CORRECT - All keys in .env
GEMINI_API_KEY=your-key
STRIPE_API_KEY=your-key

# ❌ WRONG - Keys in code
api_key = "hardcoded-key"  # NEVER DO THIS
```

### MY SPHERE Environment Configuration
```bash
# .env file for MY SPHERE
SECRET_KEY=your-django-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database (SQLite for development)
DATABASE_URL=sqlite:///db.sqlite3

# AI Services - Using Gemini 1.5 Flash
GEMINI_API_KEY=your-gemini-api-key-here
AI_INSIGHTS_ENABLED=True
AI_MODEL=gemini-1.5-flash

# AI Caching & Rate Limiting
AI_CACHE_TIMEOUT=86400
AI_MAX_CALLS_PER_DAY=3

# MY SPHERE Feature Flags
EXPENSE_AI_INSIGHTS=True
SUBSCRIPTION_TRACKING=True
LENDING_FEATURE=True
TODO_AI_SUGGESTIONS=True
LIST_SMART_CATEGORIZATION=True

# Security Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000

# Performance Settings
MAX_EXPENSE_AMOUNT=10000.00
PAGINATION_PAGE_SIZE=20
CACHE_TIMEOUT=3600

# Email Settings (for notifications)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### MY SPHERE Docker Configuration
```dockerfile
# Dockerfile for MY SPHERE Backend
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Run migrations
RUN python manage.py migrate

# Expose port
EXPOSE 8000

# Run server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

```yaml
# docker-compose.yml for MY SPHERE
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    environment:
      - DEBUG=True
      - SECRET_KEY=your-secret-key
      - OPENAI_API_KEY=your-openai-key
    depends_on:
      - db
  
  db:
    image: postgres:13
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_DB=mysphere
      - POSTGRES_USER=mysphere_user
      - POSTGRES_PASSWORD=mysphere_pass
    ports:
      - "5432:5432"
  
  frontend:
    build: ../frontend
    ports:
      - "3000:3000"
    volumes:
      - ../frontend:/app
    depends_on:
      - backend

volumes:
  postgres_data:
```

### MY SPHERE Health Check Endpoint
```python
# mysphere_core/health.py
from django.http import JsonResponse
from django.db import connection
from django.conf import settings
from datetime import datetime
import os

def health_check(request):
    """
    Health check endpoint for MY SPHERE monitoring.
    
    Checks:
    - Database connectivity
    - AI service availability
    - Feature flags status
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "service": "MY SPHERE Backend",
        "checks": {}
    }
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # AI service check
    if hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
        health_status["checks"]["ai_service"] = "configured"
    else:
        health_status["checks"]["ai_service"] = "not_configured"
    
    # Feature flags status
    health_status["checks"]["features"] = {
        "expense_ai_insights": getattr(settings, 'EXPENSE_AI_INSIGHTS', False),
        "subscription_tracking": getattr(settings, 'SUBSCRIPTION_TRACKING', False),
        "lending_feature": getattr(settings, 'LENDING_FEATURE', False),
    }
    
    # System info
    health_status["system"] = {
        "python_version": os.sys.version.split()[0],
        "django_version": getattr(settings, 'DJANGO_VERSION', 'unknown'),
        "debug_mode": settings.DEBUG
    }
    
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JsonResponse(health_status, status=status_code)

def ready_check(request):
    """Readiness check for container orchestration"""
    return JsonResponse({
        "status": "ready",
        "timestamp": datetime.now().isoformat()
    })

# mysphere_core/urls.py - Add health endpoints
from django.urls import path, include
from . import health

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/expenses/', include('expenses.urls')),
    path('api/budgets/', include('budgets.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/todos/', include('todos.urls')),
    path('api/lists/', include('lists.urls')),
    path('api/lending/', include('lending.urls')),
    path('api/users/', include('users.urls')),
    path('api/integrations/', include('integrations.urls')),
    
    # Health check endpoints
    path('health/', health.health_check, name='health'),
    path('ready/', health.ready_check, name='ready'),
]
```

---

## Quick Reference Checklist

### Before Starting MY SPHERE Development
- [ ] Set up Python virtual environment (`python -m venv venv`)
- [ ] Activate virtual environment (`venv\Scripts\activate` on Windows)
- [ ] Install dependencies (`pip install -r requirements.txt`)
- [ ] Configure .env file with required settings
- [ ] Run Django migrations (`python manage.py migrate`)
- [ ] Create superuser (`python manage.py createsuperuser`)
- [ ] Run development server (`python manage.py runserver`)
- [ ] Test API endpoints at http://localhost:8000/api/

### Before Committing Code to MY SPHERE
- [ ] Run Django tests (`python manage.py test`)
- [ ] Run feature-specific tests (`python manage.py test expenses`)
- [ ] Check code formatting (use Black: `black .`)
- [ ] Validate Django models (`python manage.py check`)
- [ ] Update feature documentation if needed
- [ ] Test AI features if modified
- [ ] Ensure no hardcoded API keys or secrets

### Before Deploying MY SPHERE
- [ ] All Django tests pass
- [ ] Environment variables configured for production
- [ ] Database migrations applied (`python manage.py migrate`)
- [ ] Static files collected (`python manage.py collectstatic`)
- [ ] Health check endpoint working (`/health/`)
- [ ] AI services configured and tested
- [ ] CORS settings configured for frontend
- [ ] Security settings reviewed

---

## MY SPHERE Mandatory Patterns

### 1. Views Pattern (Minimal Logic Only)
```python
# expenses/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ExpenseModel
from .serializers import ExpenseSerializer
from .services import ExpenseService

class ExpenseViewSet(viewsets.ModelViewSet):
    """MY SPHERE ViewSet - NO business logic, delegates to service"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ExpenseModel.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        # Delegate to service layer
        ExpenseService.create_expense(self.request.user, serializer.validated_data)
    
    @action(detail=False, methods=['get'])
    def ai_insights(self, request):
        """Get AI insights - delegates to service"""
        insights = ExpenseService.get_ai_insights(request.user)
        return Response(insights)
    
    @action(detail=False, methods=['post'])
    def parse_text(self, request):
        """Parse text - delegates to service"""
        text = request.data.get('text', '')
        result = ExpenseService.parse_expense_text(request.user, text)
        return Response(result)
```

### 2. Services Pattern (ALL Business Logic)
```python
# expenses/services.py
from django.core.cache import cache
from django.contrib.auth.models import User
from django.conf import settings
from typing import Dict, Any
from datetime import datetime, timedelta
import google.generativeai as genai
from .models import ExpenseModel

class ExpenseService:
    """ALL business logic for expenses - MANDATORY for every feature"""
    
    @staticmethod
    def create_expense(user: User, validated_data: dict) -> ExpenseModel:
        """Create expense with business logic"""
        # All creation logic here
        expense = ExpenseModel.objects.create(user=user, **validated_data)
        # Invalidate cache after creation
        ExpenseService._invalidate_user_cache(user)
        return expense
    
    @staticmethod
    def get_ai_insights(user: User) -> Dict[str, Any]:
        """Get AI insights with MANDATORY caching"""
        cache_key = f'ai_insights_expenses_{user.id}_{datetime.now().date()}'
        cached_insights = cache.get(cache_key)
        
        if cached_insights:
            return {'insights': cached_insights, 'from_cache': True}
        
        # Check daily limit (3 calls)
        if not ExpenseService._can_make_ai_call(user):
            return {
                'error': 'Daily AI limit reached',
                'fallback': ExpenseService._get_fallback_insights(user)
            }
        
        # Make AI call
        insights = ExpenseService._generate_ai_insights(user)
        cache.set(cache_key, insights, 86400)  # 24 hours
        ExpenseService._increment_ai_calls(user)
        
        return {'insights': insights, 'from_cache': False}
    
    @staticmethod
    def parse_expense_text(user: User, text: str) -> Dict[str, Any]:
        """Parse text - caching optional for NLP"""
        try:
            # AI parsing (no mandatory caching for NLP)
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"Parse expense: {text}. Return JSON with amount, category, vendor, date."
            response = model.generate_content(prompt)
            
            return {'success': True, 'data': response.text, 'ai_used': True}
            
        except Exception as e:
            # Fallback parsing
            return ExpenseService._fallback_parsing(text)
    
    @staticmethod
    def _can_make_ai_call(user: User) -> bool:
        """Check daily AI limit"""
        call_key = f'ai_calls_expenses_{user.id}_{datetime.now().date()}'
        return cache.get(call_key, 0) < 3
    
    @staticmethod
    def _increment_ai_calls(user: User) -> None:
        """Increment AI call counter"""
        call_key = f'ai_calls_expenses_{user.id}_{datetime.now().date()}'
        cache.set(call_key, cache.get(call_key, 0) + 1, 86400)
    
    @staticmethod
    def _generate_ai_insights(user: User) -> Dict[str, Any]:
        """Generate insights using Gemini"""
        # AI logic here
        pass
    
    @staticmethod
    def _get_fallback_insights(user: User) -> Dict[str, Any]:
        """Fallback insights without AI"""
        # Basic analytics without AI
        pass
    
    @staticmethod
    def _fallback_parsing(text: str) -> Dict[str, Any]:
        """Fallback parsing without AI"""
        # Basic regex parsing
        pass
    
    @staticmethod
    def _invalidate_user_cache(user: User) -> None:
        """Invalidate user's cached data"""
        cache_keys = [
            f'ai_insights_expenses_{user.id}_{datetime.now().date()}',
            # Add other cache keys
        ]
        for key in cache_keys:
            cache.delete(key)
```

### 3. AI Insights Pattern (If Feature Has AI)
```python
# expenses/ai_insights.py
import google.generativeai as genai
from django.conf import settings
from typing import Dict, Any

class ExpenseAIInsights:
    """AI insights for expenses - called from services.py only"""
    
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    def generate_insights(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI insights - called from service layer"""
        try:
            prompt = f"Analyze expense data and provide insights: {user_data}"
            response = self.model.generate_content(prompt)
            return {'success': True, 'insights': response.text}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def parse_text(self, text: str) -> Dict[str, Any]:
        """Parse text - no mandatory caching for NLP"""
        try:
            prompt = f"Parse expense: {text}. Return JSON."
            response = self.model.generate_content(prompt)
            return {'success': True, 'data': response.text}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
```

### 4. URLs Pattern (MANDATORY Health Check)
```python
# expenses/urls.py
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet
from .services import ExpenseService

def expense_health_check(request):
    """MANDATORY health check for expenses feature"""
    try:
        # Test database connection
        from .models import ExpenseModel
        ExpenseModel.objects.first()
        
        # Test AI service if enabled
        ai_status = 'enabled' if hasattr(settings, 'GEMINI_API_KEY') else 'disabled'
        
        return JsonResponse({
            'feature': 'expenses',
            'status': 'healthy',
            'database': 'connected',
            'ai_service': ai_status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return JsonResponse({
            'feature': 'expenses',
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=503)

router = DefaultRouter()
router.register(r'', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('health/', expense_health_check, name='expense_health'),  # MANDATORY
    path('', include(router.urls)),
]
```

### 5. Environment Variables (.env file MANDATORY)
```bash
# .env file for MY SPHERE - ALL API keys here
SECRET_KEY=your-django-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database
DATABASE_URL=sqlite:///db.sqlite3

# AI Services - ALL API keys in .env only
GEMINI_API_KEY=your-gemini-api-key-here
AI_INSIGHTS_ENABLED=True
AI_MODEL=gemini-1.5-flash
AI_CACHE_TIMEOUT=86400
AI_MAX_CALLS_PER_DAY=3

# Third-party API keys (examples)
OPENAI_API_KEY=your-openai-key-here
STRIPE_API_KEY=your-stripe-key-here
TWILIO_API_KEY=your-twilio-key-here
SENDGRID_API_KEY=your-sendgrid-key-here

# Feature Flags
EXPENSE_AI_INSIGHTS=True
SUBSCRIPTION_TRACKING=True
LENDING_FEATURE=True
TODO_AI_SUGGESTIONS=True
LIST_SMART_CATEGORIZATION=True

# Security
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000

# Performance
MAX_EXPENSE_AMOUNT=10000.00
PAGINATION_PAGE_SIZE=20
CACHE_TIMEOUT=3600
```

## MY SPHERE Feature Template

### Complete Feature Implementation Example
```python
# budgets/services.py - MANDATORY for every feature
class BudgetService:
    """ALL business logic for budgets"""
    
    @staticmethod
    def create_budget(user, data):
        # All creation logic here
        pass
    
    @staticmethod
    def get_ai_insights(user):
        """MANDATORY caching for AI insights"""
        cache_key = f'ai_insights_budgets_{user.id}_{datetime.now().date()}'
        # Implement caching logic
        pass
    
    @staticmethod
    def parse_budget_text(user, text):
        """Optional caching for NLP parsing"""
        # NLP logic here
        pass

# budgets/urls.py - MANDATORY health check
def budget_health_check(request):
    return JsonResponse({
        'feature': 'budgets',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

urlpatterns = [
    path('health/', budget_health_check, name='budget_health'),  # MANDATORY
    path('', include(router.urls)),
]

# budgets/views.py - Minimal logic only
class BudgetViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        BudgetService.create_budget(self.request.user, serializer.validated_data)
    
    @action(detail=False, methods=['get'])
    def ai_insights(self, request):
        insights = BudgetService.get_ai_insights(request.user)
        return Response(insights)
```

### View Layer (Minimal - Delegates to Service)
```python
# expenses/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ExpenseModel
from .serializers import ExpenseSerializer
from .services import ExpenseService

class ExpenseViewSet(viewsets.ModelViewSet):
    """Expense ViewSet - Delegates business logic to service layer"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ExpenseModel.objects.filter(user=self.request.user, is_active=True)
    
    @action(detail=False, methods=['get'])
    def ai_insights(self, request):
        """Get AI insights - delegates to service layer"""
        insights = ExpenseService.get_ai_insights(request.user)
        return Response(insights)
    
    @action(detail=False, methods=['post'])
    def parse_expense(self, request):
        """Parse expense text - delegates to service layer"""
        expense_text = request.data.get('text', '')
        result = ExpenseService.parse_and_create_expense(request.user, expense_text)
        return Response(result, status=status.HTTP_201_CREATED)
```

### Service Layer (All Business Logic + AI)
```python
# expenses/services.py
from django.core.cache import cache
from django.contrib.auth.models import User
from django.conf import settings
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import google.generativeai as genai
import json
from .models import ExpenseModel

class ExpenseService:
    """All business logic and AI operations for expenses"""
    
    @staticmethod
    def get_ai_insights(user: User) -> Dict[str, Any]:
        """Get AI insights with caching - max 3 calls per day"""
        # Check cache first
        cache_key = f'ai_insights_{user.id}_{datetime.now().date()}'
        cached_insights = cache.get(cache_key)
        
        if cached_insights:
            return {
                'insights': cached_insights,
                'from_cache': True,
                'calls_remaining': ExpenseService._get_remaining_calls(user)
            }
        
        # Check daily call limit
        if not ExpenseService._can_make_ai_call(user):
            return {
                'error': 'Daily AI call limit reached (3 calls per day)',
                'calls_remaining': 0,
                'fallback_insights': ExpenseService._get_fallback_insights(user)
            }
        
        # Make AI call
        try:
            insights = ExpenseService._generate_ai_insights(user)
            
            # Cache for 24 hours
            cache.set(cache_key, insights, settings.AI_CACHE_TIMEOUT)
            
            # Increment call counter
            ExpenseService._increment_ai_calls(user)
            
            return {
                'insights': insights,
                'from_cache': False,
                'calls_remaining': ExpenseService._get_remaining_calls(user)
            }
            
        except Exception as e:
            return {
                'error': f'AI service error: {str(e)}',
                'fallback_insights': ExpenseService._get_fallback_insights(user)
            }
    
    @staticmethod
    def parse_and_create_expense(user: User, expense_text: str) -> Dict[str, Any]:
        """Parse expense text using AI and create expense"""
        try:
            # Try AI parsing first
            parsed_data = ExpenseService._parse_expense_with_ai(expense_text)
            
            # Create expense
            expense = ExpenseModel.objects.create(
                user=user,
                amount=parsed_data['amount'],
                category=parsed_data['category'],
                vendor=parsed_data.get('vendor', ''),
                transaction_date=parsed_data['date'],
                raw_text=expense_text
            )
            
            return {
                'success': True,
                'expense_id': expense.id,
                'parsed_data': parsed_data,
                'ai_used': True
            }
            
        except Exception as e:
            # Fallback to manual parsing
            parsed_data = ExpenseService._fallback_parsing(expense_text)
            
            expense = ExpenseModel.objects.create(
                user=user,
                amount=parsed_data['amount'],
                category=parsed_data['category'],
                vendor=parsed_data.get('vendor', ''),
                transaction_date=parsed_data['date'],
                raw_text=expense_text
            )
            
            return {
                'success': True,
                'expense_id': expense.id,
                'parsed_data': parsed_data,
                'ai_used': False,
                'fallback_reason': str(e)
            }
    
    @staticmethod
    def _can_make_ai_call(user: User) -> bool:
        """Check if user can make AI call (max 3 per day)"""
        today = datetime.now().date()
        call_count_key = f'ai_calls_{user.id}_{today}'
        current_calls = cache.get(call_count_key, 0)
        return current_calls < settings.AI_MAX_CALLS_PER_DAY
    
    @staticmethod
    def _increment_ai_calls(user: User) -> None:
        """Increment AI call counter for user"""
        today = datetime.now().date()
        call_count_key = f'ai_calls_{user.id}_{today}'
        current_calls = cache.get(call_count_key, 0)
        cache.set(call_count_key, current_calls + 1, 86400)  # 24 hours
    
    @staticmethod
    def _get_remaining_calls(user: User) -> int:
        """Get remaining AI calls for user today"""
        today = datetime.now().date()
        call_count_key = f'ai_calls_{user.id}_{today}'
        current_calls = cache.get(call_count_key, 0)
        return max(0, settings.AI_MAX_CALLS_PER_DAY - current_calls)
    
    @staticmethod
    def _generate_ai_insights(user: User) -> Dict[str, Any]:
        """Generate AI insights using Gemini 1.5 Flash"""
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Get user's expense data
        expenses = ExpenseModel.objects.filter(
            user=user, 
            is_active=True,
            transaction_date__gte=datetime.now().date() - timedelta(days=30)
        )
        
        # Prepare data for AI
        expense_data = [{
            'amount': float(exp.amount),
            'category': exp.category,
            'vendor': exp.vendor,
            'date': exp.transaction_date.isoformat()
        } for exp in expenses]
        
        prompt = f"""
        Analyze this user's expense data and provide insights in JSON format:
        {json.dumps(expense_data)}
        
        Return JSON with:
        - spending_trends: analysis of spending patterns
        - budget_recommendations: suggested budget adjustments
        - category_insights: category-specific recommendations
        - alerts: important spending alerts
        """
        
        response = model.generate_content(prompt)
        return json.loads(response.text)
    
    @staticmethod
    def _parse_expense_with_ai(expense_text: str) -> Dict[str, Any]:
        """Parse expense text using Gemini AI"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Parse this expense text and return JSON:
        "{expense_text}"
        
        Return JSON with:
        - amount: decimal amount
        - category: expense category
        - vendor: vendor name (if mentioned)
        - date: transaction date (today if not specified)
        """
        
        response = model.generate_content(prompt)
        return json.loads(response.text)
    
    @staticmethod
    def _get_fallback_insights(user: User) -> Dict[str, Any]:
        """Generate basic insights without AI"""
        expenses = ExpenseModel.objects.filter(
            user=user,
            is_active=True,
            transaction_date__gte=datetime.now().date() - timedelta(days=30)
        )
        
        total_amount = sum(exp.amount for exp in expenses)
        categories = {}
        
        for exp in expenses:
            if exp.category not in categories:
                categories[exp.category] = 0
            categories[exp.category] += float(exp.amount)
        
        return {
            'total_spent': float(total_amount),
            'top_category': max(categories.items(), key=lambda x: x[1])[0] if categories else 'None',
            'expense_count': expenses.count(),
            'note': 'Basic insights - AI limit reached'
        }
    
    @staticmethod
    def _fallback_parsing(expense_text: str) -> Dict[str, Any]:
        """Basic parsing without AI"""
        import re
        from datetime import date
        
        # Extract amount using regex
        amount_match = re.search(r'\$?([0-9]+\.?[0-9]*)', expense_text)
        amount = float(amount_match.group(1)) if amount_match else 0.0
        
        # Basic category detection
        category = 'Other'
        if any(word in expense_text.lower() for word in ['food', 'lunch', 'dinner', 'restaurant']):
            category = 'Food & Dining'
        elif any(word in expense_text.lower() for word in ['gas', 'fuel', 'uber', 'taxi']):
            category = 'Travel'
        
        return {
            'amount': amount,
            'category': category,
            'vendor': '',
            'date': date.today()
        }
```

---

## Getting Help with MY SPHERE

### When You're Stuck
1. **Check this rule book** first
2. **Look at existing feature code** (expenses/ is the most complete)
3. **Check feature-specific README.md** files
4. **Test endpoints** using Django admin or Postman
5. **Check Django logs** for detailed error messages
6. **Review AI service logs** if AI features aren't working

### MY SPHERE Resources
- **Main Documentation**: `MY_SPHERE_STRUCTURE.md`
- **Feature Documentation**: Each feature has its own README.md
- **API Testing**: Use Django admin at `/admin/`
- **Database Schema**: `DATABASE_SCHEMA.md`
- **Postman Collection**: `mysphere_postman_collection.json`
- **Health Check**: http://localhost:8000/health/

### Common MY SPHERE Issues

#### Common Issues & Solutions

**AI Features Not Working:**
- Check `GEMINI_API_KEY` in .env file
- Verify daily AI call limit (3) not reached
- Clear cache: `python manage.py shell -c "from django.core.cache import cache; cache.clear()"`
- Check Django logs for Gemini API errors
- Test fallback functionality

**Health Check Failing:**
- Verify health check endpoint exists in urls.py
- Test: `curl http://localhost:8000/api/feature_name/health/`
- Check database connectivity
- Verify feature is in INSTALLED_APPS

**Business Logic Issues:**
- Ensure ALL logic is in services.py
- Views should only handle HTTP requests/responses
- No business logic in views.py or serializers.py

**Missing Files:**
- Every feature must have same file structure
- services.py is MANDATORY
- Health check in urls.py is MANDATORY
- README.md is MANDATORY

#### Database Issues
- Run `python manage.py migrate`
- Check if models are registered in admin.py
- Verify foreign key relationships

#### API Endpoint Issues
- Check if URLs are included in main urls.py
- Verify authentication is working
- Test with Django admin interface first

#### Frontend Integration Issues
- Check CORS settings in settings.py
- Verify API endpoints return expected format
- Test endpoints with Postman first

---

---

## MY SPHERE Development Workflow

### Adding a New Feature
1. **Create feature folder** in backend/ directory
2. **Copy structure** from existing feature (like expenses/)
3. **Update INSTALLED_APPS** in mysphere_core/settings.py
4. **Create URLs** and include in main urls.py
5. **Run migrations** after creating models
6. **Add to admin.py** for easy testing
7. **Write tests** following existing patterns
8. **Update documentation**

### Modifying Existing Features
1. **Check existing tests** before making changes
2. **Update models** and create migrations if needed
3. **Update serializers** if model changes
4. **Update views** and business logic
5. **Update AI components** if applicable
6. **Run tests** to ensure nothing breaks
7. **Update feature documentation**

### MY SPHERE Implementation Checklist

#### Before Creating Any Feature:
- [ ] Create all mandatory files (models, views, serializers, services, urls, ai_insights, README)
- [ ] Add health check endpoint in urls.py
- [ ] Put ALL business logic in services.py
- [ ] Add AI insights caching (if feature has AI)
- [ ] Put all API keys in .env file
- [ ] Test health check endpoint

#### AI Features Implementation:
- [ ] AI insights: MANDATORY caching (24 hours)
- [ ] NLP parsing: Optional caching
- [ ] Max 3 AI calls per day per user per feature
- [ ] Fallback when AI fails or limit reached
- [ ] All AI logic in services.py only
- [ ] Use Gemini 1.5 Flash model

#### Cache Strategy:
```python
# MANDATORY for AI insights
ai_insights_{feature}_{user_id}_{date}  # 24h cache
ai_calls_{feature}_{user_id}_{date}     # Call counter

# OPTIONAL for NLP parsing
ai_parsing_{feature}_{text_hash}        # 7 days cache
```

---

---

## MY SPHERE Compliance Checklist

### New Feature Checklist:
- [ ] All business logic in services.py
- [ ] AI insights caching implemented (if applicable)
- [ ] Health check endpoint in urls.py
- [ ] Same file structure as other features
- [ ] All API keys in .env file
- [ ] Views.py has minimal logic only
- [ ] README.md documentation complete
- [ ] Tests cover service layer logic

### Code Review Checklist:
- [ ] No business logic in views.py
- [ ] AI insights are cached (24h)
- [ ] Health check returns proper JSON
- [ ] No hardcoded API keys
- [ ] Service methods are static
- [ ] Proper error handling with fallbacks
- [ ] Cache invalidation implemented

---

*This MY SPHERE Backend Rule Book is MANDATORY for all features. Every feature must follow these exact patterns. No exceptions.*