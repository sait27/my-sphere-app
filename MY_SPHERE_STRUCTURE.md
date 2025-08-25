# MY SPHERE Project Structure

This document provides a comprehensive overview of the MY SPHERE project architecture, organization, and key components. The project follows a modular, feature-based architecture with Django backend and React frontend.

## 📚 Documentation Overview
All documentation files are organized by feature and purpose:

### Core Documentation
- **MY_SPHERE_STRUCTURE.md** - This file, providing project structure overview
- **DATABASE_SCHEMA.md** - Database design and relationships
- **URL_FIXES_DOCUMENTATION.md** - URL routing and API endpoints guide

### Feature Documentation
- **ENHANCED_LISTIFY_FEATURES.md** - Advanced list management features
- **EXPENSES_V1_DOCUMENTATION.md** - Expense tracking system documentation
- **LISTS_V2_DOCUMENTATION.md** - List management v2 features
- **TODOS_FEATURE_DOCUMENTATION.md** - Task management system documentation
- **TODOS_FUNCTIONS_REFERENCE.md** - Detailed function reference for todos

### Setup & Testing
- **LISTIFY_SETUP.md** - Setup guide for list features
- **test_basic_features.md** - Basic feature testing guide

## 🗂️ Root Directory Structure
```
my-sphere-app/
├── package.json             # Project dependencies and scripts
├── MY SPHERE LOGO.png      # Project logo
└── Documentation Files     # As listed above

## 🔙 Backend Directory Structure
### Core Files
```
backend/
├── DATABASE_SCHEMA.md          # Database documentation
├── db.sqlite3                 # SQLite database
├── manage.py                  # Django management script
├── mysphere_postman_collection.json  # API collection for testing
├── requirements.txt           # Main Python dependencies
├── requirements_django.txt    # Django-specific dependencies
├── schema.json               # API schema definition
├── validate_urls.py          # URL validation script
└── Tests
    ├── test_ai.py           # AI feature tests
    ├── test_nl.py           # Natural language processing tests
    └── test_urls.py         # URL routing tests

### Feature Modules
#### budgets/ - Budget Management
```
budgets/
├── __init__.py              # Module initialization
├── admin.py                # Admin interface configuration
├── apps.py                 # App configuration
├── models.py              # Database models
├── serializers.py         # API serializers
├── tests.py              # Unit tests
├── urls.py               # URL routing
├── views.py             # View logic
└── migrations/          # Database migrations

#### expenses/ - Expense Tracking System
```
expenses/
├── __init__.py              # Module initialization
├── admin.py                # Admin interface
├── advanced_analytics.py   # Advanced analytics logic
├── advanced_views.py       # Enhanced view implementations
├── ai_insights.py         # AI-powered insights
├── apps.py                # App configuration
├── middleware.py          # Custom middleware
├── models.py             # Database models
├── serializers.py        # API serializers
├── services.py          # Business logic services
├── validators.py        # Data validation
├── views_refactored.py # Refactored view logic
├── views.py           # Main view logic
├── Tests
│   ├── test_models.py # Model tests
│   ├── test_views.py # View tests
│   └── tests.py      # General tests
└── migrations/       # Database migrations

#### integrations/ - Third-party Integrations
```
integrations/
├── __init__.py          # Module initialization
├── admin.py            # Admin interface
├── apps.py            # App configuration
├── models.py         # Integration models
├── tests.py         # Integration tests
├── urls.py         # Integration endpoints
├── views.py       # Integration logic
└── migrations/   # Database migrations

#### lists/ - List Management System
```
lists/
├── __init__.py           # Module initialization
├── admin.py             # Admin interface
├── advanced_views.py    # Enhanced view implementations
├── apps.py             # App configuration
├── bulk_operations.py  # Bulk action handling
├── models.py          # List models
├── serializers.py    # API serializers
├── services.py      # Business logic
├── sharing.py      # List sharing functionality
├── validators.py  # Data validation
├── views_refactored.py # Refactored views
├── views.py          # Main views
├── Tests
│   ├── test_enhanced.py # Enhanced feature tests
│   └── tests.py       # General tests
├── management/      # Custom management commands
└── migrations/    # Database migrations

#### mysphere_core/ - Core Project Configuration
```
mysphere_core/
├── __init__.py          # Package initialization
├── asgi.py            # ASGI configuration
├── openapi.py        # OpenAPI/Swagger configuration
├── settings_security.py # Security settings
├── settings.py      # Main Django settings
├── urls.py         # Main URL routing
└── wsgi.py       # WSGI configuration

#### todos/ - Task Management System
```
todos/
├── __init__.py       # Module initialization
├── admin.py        # Admin interface
├── ai_engine.py   # AI functionality
├── models.py     # Task models
├── serializers.py # API serializers
├── urls.py      # Task endpoints
├── views.py    # Task views
└── migrations/ # Database migrations

#### users/ - User Management
```
users/
├── __init__.py    # Module initialization
├── admin.py     # User admin interface
├── apps.py     # App configuration
├── models.py   # User models
├── tests.py   # User tests
├── urls.py   # User endpoints
├── views.py # User views
└── migrations/ # Database migrations

## 🎨 Frontend Directory Structure
### Core Configuration
```
frontend/
├── debug_api_mapping.cjs    # API debugging configuration
├── eslint.config.js        # ESLint configuration
├── index.html             # Main HTML template
├── package.json          # Dependencies and scripts
├── postcss.config.js    # PostCSS configuration
├── README.md          # Frontend documentation
├── tailwind.config.js # Tailwind CSS configuration
├── test_api_endpoints.html # API testing page
└── vite.config.js    # Vite build configuration

### Static Assets
```
public/
├── logo.png   # Application logo
└── vite.svg  # Vite logo

### Source Code
```
src/
├── App.jsx          # Main application component
├── index.css       # Global styles
├── main.jsx       # Application entry point
├── api/          # API client and services
├── components/  # Reusable UI components
├── hooks/      # Custom React hooks
├── pages/     # Page components
├── styles/   # Component styles
├── tests/   # Frontend tests
└── utils/  # Utility functions

## 🔧 Technical Stack Overview

### Backend Technologies
- **Framework**: Django 5.0.6 with Django REST Framework
- **Database**: SQLite (development), PostgreSQL (production)
- **AI Integration**: Google Gemini AI for natural language processing
- **Authentication**: JWT-based with token rotation
- **API Documentation**: OpenAPI/Swagger
- **Testing**: Pytest for unit and integration tests

### Frontend Technologies
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom components
- **State Management**: Custom hooks and Context API
- **HTTP Client**: Axios with interceptors
- **Testing**: Jest and React Testing Library
- **Build Tool**: Vite with optimized production builds

### Key Features
- **🔒 Authentication & Authorization**: JWT-based secure authentication
- **📋 List Management**: Advanced list organization with AI assistance
- **💰 Expense Tracking**: Smart expense tracking and analytics
- **✅ Task Management**: Comprehensive todo system with goals
- **💳 Budget Management**: Budget tracking and planning
- **🔌 Integrations**: Third-party service connections
- **📊 Analytics**: Advanced insights and reporting
- **🎯 AI Features**: Natural language processing and smart suggestions

### Development Practices
- **📝 Documentation**: Comprehensive markdown documentation for each feature
- **🧪 Testing**: Extensive test coverage for both backend and frontend
- **🔄 CI/CD**: Automated testing and deployment pipeline
- **🔍 Code Quality**: ESLint, Prettier, and Django's built-in checks
- **🔐 Security**: CORS, XSS protection, and secure headers
- **📈 Performance**: Optimized database queries and frontend builds

### Getting Started
1. Clone the repository
2. Install backend dependencies: `pip install -r requirements.txt`
3. Install frontend dependencies: `cd frontend && npm install`
4. Set up environment variables
5. Run migrations: `python manage.py migrate`
6. Start development servers:
   - Backend: `python manage.py runserver`
   - Frontend: `npm run dev`

### Documentation Structure
Each feature has its own detailed documentation:
- Setup guides
- API references
- Frontend components
- Testing instructions
- Troubleshooting guides

For detailed setup instructions and feature documentation, refer to the specific documentation files listed at the top of this document.
