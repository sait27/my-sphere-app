# MY SPHERE Database Schema Documentation

## Overview
This document provides a comprehensive overview of MY SPHERE's database schema, including all tables, relationships, and indexes. The schema is managed through Django's migration system based on models defined in each app.

## Version Information
- **Current Version**: 2.0
- **Last Updated**: August 25, 2025
- **Database Engine**: SQLite (Development), PostgreSQL (Production)
- **Character Set**: UTF-8
- **Collation**: utf8_general_ci

## Core Tables

### 1. Users Module (`users_*`)

#### Table: `auth_user`
Built-in Django table for user authentication and profile information.

| Column Name    | Data Type  | Constraints          | Description                    |
|---------------|------------|---------------------|--------------------------------|
| id            | INTEGER    | PK, AUTO_INCREMENT | Unique user identifier         |
| password      | VARCHAR(128)| NOT NULL          | Securely hashed password       |
| last_login    | DATETIME   | NULLABLE          | Last login timestamp           |
| is_superuser  | BOOLEAN    | NOT NULL          | Full permission access flag    |
| username      | VARCHAR(150)| UNIQUE, NOT NULL  | Unique username               |
| first_name    | VARCHAR(30)| NOT NULL          | User's first name             |
| last_name     | VARCHAR(30)| NOT NULL          | User's last name              |
| email         | VARCHAR(254)| UNIQUE, NOT NULL  | User's email address          |
| is_staff      | BOOLEAN    | NOT NULL          | Admin access flag             |
| is_active     | BOOLEAN    | NOT NULL          | Account status flag           |
| date_joined   | DATETIME   | NOT NULL          | Account creation timestamp     |

**Indexes:**
- `auth_user_username_idx` (username) - B-tree index for login performance
- `auth_user_email_idx` (email) - B-tree index for email lookups

#### Table: `users_profile`
Extended user profile information.

| Column Name     | Data Type   | Constraints        | Description                   |
|----------------|-------------|-------------------|-------------------------------|
| id             | INTEGER     | PK, AUTO_INCREMENT| Profile identifier           |
| user_id        | INTEGER     | FK (auth_user)    | Link to auth_user            |
| avatar_url     | VARCHAR(255)| NULLABLE         | Profile picture URL          |
| preferences    | JSON        | DEFAULT '{}'      | User preferences             |
| notification_settings | JSON  | DEFAULT '{}'      | Notification configuration   |
| created_at     | DATETIME    | NOT NULL         | Profile creation timestamp   |
| updated_at     | DATETIME    | NOT NULL         | Last update timestamp        |

**Indexes:**
- `users_profile_user_id_idx` (user_id) - Foreign key index

### 2. Expenses Module (`expenses_*`)

#### Table: `expenses_expense`
Core table for expense transactions.

| Column Name      | Data Type        | Constraints        | Description                    |
|-----------------|------------------|-------------------|--------------------------------|
| expense_id      | CHAR(25)         | PK                | Unique ID (EXP + 22 chars)     |
| display_id      | INTEGER          | NOT NULL          | User-friendly reference number |
| user_id         | INTEGER          | FK (auth_user)    | Link to user                  |
| raw_text        | TEXT             | NULLABLE          | Original input text           |
| amount          | DECIMAL(10,2)    | NOT NULL          | Transaction amount            |
| category        | VARCHAR(100)     | NOT NULL          | Expense category              |
| vendor          | VARCHAR(100)     | NULLABLE          | Merchant/vendor name          |
| description     | TEXT             | NULLABLE          | Detailed description          |
| transaction_date| DATE             | NOT NULL          | Date of transaction           |
| payment_method  | VARCHAR(20)      | NOT NULL          | Payment method used           |
| expense_type    | VARCHAR(20)      | NOT NULL          | Type of expense              |
| location        | VARCHAR(200)     | NULLABLE          | Transaction location          |
| tax_amount      | DECIMAL(10,2)    | DEFAULT 0         | Tax amount                    |
| discount_amount | DECIMAL(10,2)    | DEFAULT 0         | Discount applied              |
| tip_amount      | DECIMAL(10,2)    | DEFAULT 0         | Tip amount                    |
| ai_confidence   | FLOAT            | DEFAULT 0.0       | AI parsing confidence         |
| ai_suggestions  | JSON             | DEFAULT '{}'      | AI-generated suggestions      |
| is_verified     | BOOLEAN          | DEFAULT FALSE     | Manual verification flag      |
| created_at      | DATETIME         | NOT NULL          | Record creation timestamp     |
| updated_at      | DATETIME         | NOT NULL          | Last update timestamp         |

**Indexes:**
- `expenses_expense_user_id_idx` (user_id) - Foreign key index
- `expenses_expense_transaction_date_idx` (transaction_date) - Date range queries
- `expenses_expense_category_idx` (category) - Category filtering
- `expenses_expense_vendor_idx` (vendor) - Vendor searches

#### Table: `expenses_category`
Custom expense categories.

| Column Name   | Data Type    | Constraints        | Description                   |
|--------------|--------------|-------------------|-------------------------------|
| id           | INTEGER      | PK, AUTO_INCREMENT| Category identifier          |
| user_id      | INTEGER      | FK (auth_user)    | Link to user                 |
| name         | VARCHAR(100) | NOT NULL          | Category name                |
| color        | CHAR(7)      | DEFAULT '#3B82F6' | Display color (hex)          |
| icon         | VARCHAR(50)  | DEFAULT 'circle'  | Category icon name           |
| budget_limit | DECIMAL(10,2)| NULLABLE         | Monthly budget limit         |
| created_at   | DATETIME     | NOT NULL          | Creation timestamp           |
| updated_at   | DATETIME     | NOT NULL          | Last update timestamp        |

**Indexes:**
- `expenses_category_user_id_idx` (user_id) - Foreign key index
- `expenses_category_name_idx` (name) - Category name lookups

### 3. Lists Module (`lists_*`)

#### Table: `lists_list`
Core table for list management.

| Column Name           | Data Type        | Constraints        | Description                    |
|---------------------|------------------|-------------------|--------------------------------|
| id                  | CHAR(25)         | PK                | Unique ID (LST + 22 chars)     |
| user_id             | INTEGER          | FK (auth_user)    | Link to user                  |
| name                | VARCHAR(100)     | NOT NULL          | List name                     |
| description         | TEXT             | NULLABLE          | List description              |
| list_type          | VARCHAR(20)      | NOT NULL          | Type of list                  |
| category_id         | INTEGER          | FK (list_category)| Link to category              |
| priority           | VARCHAR(20)      | DEFAULT 'medium'  | List priority                 |
| is_shared          | BOOLEAN          | DEFAULT FALSE     | Sharing status                |
| auto_sort          | BOOLEAN          | DEFAULT FALSE     | Auto-sorting flag             |
| sort_by            | VARCHAR(20)      | DEFAULT 'created' | Sort criterion                |
| due_date           | DATETIME         | NULLABLE          | Due date if applicable        |
| is_archived        | BOOLEAN          | DEFAULT FALSE     | Archive status                |
| completion_percentage| FLOAT           | DEFAULT 0.0       | Completion progress           |
| ai_suggestions     | JSON             | DEFAULT '{}'      | AI-generated suggestions      |
| estimated_cost     | DECIMAL(10,2)    | NULLABLE          | Estimated total cost          |
| actual_cost        | DECIMAL(10,2)    | NULLABLE          | Actual total cost             |
| created_at         | DATETIME         | NOT NULL          | Creation timestamp            |
| updated_at         | DATETIME         | NOT NULL          | Last update timestamp         |

**Indexes:**
- `lists_list_user_id_idx` (user_id) - Foreign key index
- `lists_list_category_id_idx` (category_id) - Category filtering
- `lists_list_due_date_idx` (due_date) - Due date queries
- `lists_list_completion_percentage_idx` (completion_percentage) - Progress filtering

### 4. Todos Module (`todos_*`)

#### Table: `todos_task`
Core table for task management.

| Column Name         | Data Type        | Constraints        | Description                    |
|-------------------|------------------|-------------------|--------------------------------|
| id                | CHAR(25)         | PK                | Unique ID (TSK + 22 chars)     |
| user_id           | INTEGER          | FK (auth_user)    | Link to user                  |
| goal_id           | INTEGER          | FK (todos_goal)   | Link to parent goal           |
| title             | VARCHAR(200)     | NOT NULL          | Task title                    |
| description       | TEXT             | NULLABLE          | Task description              |
| priority          | VARCHAR(20)      | DEFAULT 'medium'  | Task priority                 |
| status            | VARCHAR(20)      | DEFAULT 'pending' | Current status                |
| due_date          | DATETIME         | NULLABLE          | Due date                      |
| completed_at      | DATETIME         | NULLABLE          | Completion timestamp          |
| ai_suggestions    | JSON             | DEFAULT '{}'      | AI-generated suggestions      |
| time_estimate     | INTEGER          | NULLABLE          | Estimated minutes             |
| time_spent        | INTEGER          | DEFAULT 0         | Actual minutes spent          |
| created_at        | DATETIME         | NOT NULL          | Creation timestamp            |
| updated_at        | DATETIME         | NOT NULL          | Last update timestamp         |

**Indexes:**
- `todos_task_user_id_idx` (user_id) - Foreign key index
- `todos_task_goal_id_idx` (goal_id) - Goal filtering
- `todos_task_due_date_idx` (due_date) - Due date queries
- `todos_task_status_idx` (status) - Status filtering

## Relationships

### User Relationships
- One `auth_user` has:
  - One `users_profile` (1:1)
  - Many `expenses_expense` (1:N)
  - Many `expenses_category` (1:N)
  - Many `lists_list` (1:N)
  - Many `todos_task` (1:N)
  - Many `todos_goal` (1:N)

### Expense Relationships
- Each `expenses_expense`:
  - Belongs to one `auth_user` (N:1)
  - Belongs to one `expenses_category` (N:1)

### List Relationships
- Each `lists_list`:
  - Belongs to one `auth_user` (N:1)
  - Has many `lists_item` (1:N)
  - Can be shared with many users through `lists_share` (M:N)
  - Can have many tags through `lists_tag_assignment` (M:N)

### Todo Relationships
- Each `todos_task`:
  - Belongs to one `auth_user` (N:1)
  - Can belong to one `todos_goal` (N:1)
  - Can have many subtasks (1:N)
  - Can have many comments (1:N)
  - Can have many attachments (1:N)

## Indexing Strategy
- Foreign keys are always indexed
- Frequently filtered fields have B-tree indexes
- Text fields used in search have trigram indexes
- Date fields used in range queries are indexed
- Composite indexes for common query patterns

## Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints validate field values
- Unique constraints prevent duplicates
- Default values ensure data consistency
- NOT NULL constraints for required fields

## Performance Considerations
- Denormalized fields for frequent calculations
- JSON fields for flexible data storage
- Appropriate index types for query patterns
- Optimized column types for storage efficiency
- Regular index maintenance recommended

---

*Note: This schema is managed through Django migrations. Always use migrations for schema changes.*