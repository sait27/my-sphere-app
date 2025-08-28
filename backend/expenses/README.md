# Expenses Feature Documentation

## Overview
The Expenses feature allows users to track, categorize, and analyze their financial expenses using AI-powered text parsing and comprehensive analytics.

## Core Features

### 1. **AI-Powered Expense Creation**
- Users input natural language text describing expenses
- AI parses and extracts multiple expenses from single input
- Automatic categorization and vendor detection
- Example: "paid 40 on pickles, 100 on shirt" → Creates 2 separate expenses

### 2. **Expense Management**
- CRUD operations for individual expenses
- Bulk operations (delete, categorize, duplicate)
- Custom categories and tags
- File attachments (receipts, invoices)

### 3. **Analytics & Insights**
- Spending summaries (today, week, month)
- Category and payment method breakdowns
- Spending trends over time
- Budget analysis and alerts
- AI-powered spending insights

### 4. **Advanced Features**
- Advanced search with multiple filters
- CSV export functionality
- Recurring expense tracking
- Location-based expenses

## Architecture

### Models (`models.py`)
```
Expense (Main Model)
├── Basic Info: amount, category, vendor, description, date
├── Advanced: payment_method, location, notes, tags
├── Financial: tax_amount, discount_amount, tip_amount
├── Recurring: is_recurring, frequency, next_occurrence
├── AI: ai_confidence, ai_suggestions, is_verified
└── Metadata: created_at, updated_at

ExpenseCategory (Custom Categories)
├── name, color, icon, budget_limit
└── User-specific categories

ExpenseTag (Tags)
├── name, color
└── Many-to-many with Expense

ExpenseAttachment (File Uploads)
├── file, filename, file_type, file_size
└── Linked to specific expense

ExpenseAnalytics (Cached Data)
├── Monthly aggregated data
└── Performance optimization

ExpenseAIInsight (AI Cache)
├── Generated insights
└── 1-hour cache duration
```

### Services (`services.py`)
```
ExpenseService
├── create_expense_from_ai() - AI parsing & creation
├── get_user_expenses() - Filtered expense retrieval
├── get_expense_summary() - Daily/weekly/monthly totals
├── get_analytics_data() - Basic analytics
├── bulk_update_expenses() - Bulk operations
└── export_expenses_csv() - CSV export

ExpenseCategoryService
├── get_user_categories() - User's custom categories
└── create_category() - New category creation

ExpenseTagService
├── get_user_tags() - User's tags
└── create_tag() - New tag creation

ExpenseAdvancedService
├── get_comprehensive_analytics() - Advanced analytics
├── get_spending_trends() - Trend analysis
├── get_budget_analysis() - Budget vs spending
├── bulk_categorize_expenses() - Bulk categorization
├── duplicate_expense() - Expense duplication
└── search_expenses() - Advanced search

AIExpenseParser
├── parse_expense_text() - AI text parsing
└── _build_prompt() - AI prompt construction

AIInsightsService
└── get_ai_insights() - AI-powered insights
```

### Views (`views.py`)
```
Core Views:
├── ExpenseAPIView - Basic CRUD
├── ExpenseDetailAPIView - Single expense operations
├── ExpenseSummaryView - Summary data
├── ExpenseAnalyticsView - Analytics
├── ExpenseTrendsView - Trends
├── ExpenseBulkOperationsView - Bulk operations
├── ExpenseExportView - CSV export
└── AIInsightsView - AI insights

Advanced Views (New):
├── ExpenseCategoryViewSet - Category management
├── ExpenseTagViewSet - Tag management
├── ExpenseAdvancedAnalyticsView - Advanced analytics
├── ExpenseAdvancedTrendsView - Advanced trends
├── ExpenseAdvancedBudgetAnalysisView - Budget analysis
├── ExpenseBulkCategorizeView - Bulk categorization
├── ExpenseDuplicateView - Expense duplication
└── ExpenseSearchView - Advanced search
```

## API Endpoints

### Core Operations
```
GET    /expenses/                    # List all expenses
POST   /expenses/                    # Create expense via AI
GET    /expenses/<id>/               # Get single expense
PUT    /expenses/<id>/               # Update expense
DELETE /expenses/<id>/               # Delete expense
GET    /expenses/list/               # Paginated list with filters
```

### Analytics & Reporting
```
GET    /expenses/summary/            # Today/week/month totals
GET    /expenses/analytics/          # Basic analytics
GET    /expenses/trends/             # Spending trends
GET    /expenses/advanced/analytics/ # Advanced analytics
GET    /expenses/advanced/trends/    # Advanced trends
GET    /expenses/advanced/budget-analysis/ # Budget analysis
```

### Management
```
GET    /expenses/categories/         # List categories
POST   /expenses/categories/         # Create category
GET    /expenses/tags/               # List tags
POST   /expenses/tags/               # Create tag
```

### Operations
```
POST   /expenses/bulk/               # Bulk operations
POST   /expenses/bulk-categorize/    # Bulk categorize
POST   /expenses/duplicate/          # Duplicate expense
GET    /expenses/search/             # Advanced search
POST   /expenses/export/             # Export CSV
```

### AI Features
```
GET    /expenses/ai-insights/        # AI insights
```

## Data Flow

### 1. Expense Creation Flow
```
User Input → AI Parser → Validation → Database → Response
    ↓
"paid 40 on milk, 100 on shirt"
    ↓
AI extracts: [
  {amount: 40, category: "Groceries", description: "milk"},
  {amount: 100, category: "Shopping", description: "shirt"}
]
    ↓
Validation & Database Save
    ↓
Return created expense IDs
```

### 2. Analytics Flow
```
Request → Service Layer → Database Query → Aggregation → Cache → Response
    ↓
GET /expenses/analytics/?period=month
    ↓
ExpenseService.get_analytics_data()
    ↓
Query expenses for last 30 days
    ↓
Calculate totals, averages, breakdowns
    ↓
Cache for 5 minutes
    ↓
Return analytics data
```

## Debugging Guide

### 1. **Common Issues & Solutions**

#### AI Parsing Fails
```bash
# Check logs
tail -f logs/django.log | grep "AI processing error"

# Verify API key
echo $GOOGLE_API_KEY

# Test AI manually
python manage.py shell
>>> from expenses.services import AIExpenseParser
>>> parser = AIExpenseParser(GEMINI_MODEL)
>>> result = parser.parse_expense_text("paid 100 for groceries")
```

#### Database Errors
```bash
# Check migrations
python manage.py showmigrations expenses

# Apply migrations
python manage.py migrate expenses

# Check model validation
python manage.py shell
>>> from expenses.models import Expense
>>> expense = Expense(amount=-10)  # Should fail validation
>>> expense.full_clean()
```

#### Performance Issues
```bash
# Check slow queries
python manage.py shell
>>> from django.db import connection
>>> print(connection.queries)

# Check cache
python manage.py shell
>>> from django.core.cache import cache
>>> cache.get('expense_analytics_user_1')
```

### 2. **Debug Steps by Feature**

#### Expense Creation
```python
# 1. Check AI response
print(f"AI Response: {response.text}")

# 2. Check JSON parsing
try:
    ai_data = json.loads(cleaned_json_string)
    print(f"Parsed Data: {ai_data}")
except json.JSONDecodeError as e:
    print(f"JSON Error: {e}")

# 3. Check database save
try:
    expense = Expense.objects.create(**expense_data)
    print(f"Created: {expense.expense_id}")
except Exception as e:
    print(f"DB Error: {e}")
```

#### Analytics Issues
```python
# 1. Check data exists
expenses = Expense.objects.filter(user=user)
print(f"Total expenses: {expenses.count()}")

# 2. Check date filters
from datetime import datetime, timedelta
start_date = datetime.now() - timedelta(days=30)
filtered = expenses.filter(transaction_date__gte=start_date)
print(f"Filtered expenses: {filtered.count()}")

# 3. Check aggregations
from django.db.models import Sum
total = filtered.aggregate(Sum('amount'))
print(f"Total amount: {total}")
```

#### Search Problems
```python
# 1. Check query construction
from django.db.models import Q
query = Q(description__icontains="test") | Q(vendor__icontains="test")
results = Expense.objects.filter(query)
print(f"Search results: {results.count()}")

# 2. Check filters
filters = {'category': 'Food', 'min_amount': 10}
filtered = Expense.objects.filter(**filters)
print(f"Filtered results: {filtered.count()}")
```

### 3. **Logging & Monitoring**

#### Enable Debug Logging
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'expenses_debug.log',
        },
    },
    'loggers': {
        'expenses': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

#### Add Debug Prints
```python
# In views.py
import logging
logger = logging.getLogger('expenses')

def post(self, request):
    logger.debug(f"Request data: {request.data}")
    # ... rest of code
    logger.debug(f"AI response: {ai_data}")
```

### 4. **Testing Commands**

#### Manual Testing
```bash
# Test API endpoints
curl -X GET "http://localhost:8000/expenses/" \
  -H "Authorization: Bearer <token>"

curl -X POST "http://localhost:8000/expenses/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"text": "paid 100 for groceries"}'

# Test with different data
curl -X POST "http://localhost:8000/expenses/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"text": "spent 50 on coffee at Starbucks and 200 on groceries at Walmart"}'
```

#### Database Queries
```python
# Check data integrity
python manage.py shell
>>> from expenses.models import Expense
>>> from django.contrib.auth.models import User

# Check user expenses
>>> user = User.objects.get(username='testuser')
>>> expenses = Expense.objects.filter(user=user)
>>> print(f"User has {expenses.count()} expenses")

# Check recent expenses
>>> recent = expenses.filter(created_at__gte=timezone.now() - timedelta(days=1))
>>> for exp in recent:
...     print(f"{exp.expense_id}: {exp.amount} - {exp.category}")

# Check analytics data
>>> from expenses.services import ExpenseService
>>> summary = ExpenseService.get_expense_summary(user)
>>> print(summary)
```

### 5. **Performance Optimization**

#### Database Optimization
```python
# Use select_related for foreign keys
expenses = Expense.objects.select_related('custom_category').filter(user=user)

# Use prefetch_related for many-to-many
expenses = Expense.objects.prefetch_related('tags').filter(user=user)

# Add database indexes
class Meta:
    indexes = [
        models.Index(fields=['user', 'transaction_date']),
        models.Index(fields=['user', 'category']),
    ]
```

#### Caching
```python
# Cache expensive operations
from django.core.cache import cache

def get_analytics(user):
    cache_key = f'analytics_{user.id}'
    data = cache.get(cache_key)
    if not data:
        data = calculate_analytics(user)
        cache.set(cache_key, data, 300)  # 5 minutes
    return data
```

## Environment Setup

### Required Environment Variables
```bash
# .env file
GOOGLE_API_KEY=your_gemini_api_key_here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
```

### Dependencies
```bash
# Install required packages
pip install django djangorestframework
pip install google-generativeai
pip install shortuuid
```

## Troubleshooting Checklist

- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] AI API key valid and working
- [ ] User authentication working
- [ ] Required permissions set
- [ ] Cache backend configured
- [ ] Logging enabled for debugging
- [ ] Test data available for debugging

## Quick Debug Commands

```bash
# Check system status
python manage.py check

# Test database connection
python manage.py dbshell

# Check migrations
python manage.py showmigrations

# Create test data
python manage.py shell
>>> from django.contrib.auth.models import User
>>> from expenses.models import Expense
>>> user = User.objects.create_user('testuser', 'test@example.com', 'password')
>>> Expense.objects.create(user=user, amount=100, category='Test', transaction_date='2024-01-01')

# Test AI parsing
python manage.py shell
>>> from expenses.services import AIExpenseParser
>>> # Test parsing logic
```

This documentation provides a comprehensive guide to understanding and debugging the expenses feature. Use the debugging steps and commands to quickly identify and resolve issues.