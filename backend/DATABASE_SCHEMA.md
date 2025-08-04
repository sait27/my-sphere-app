My Sphere - Database Schema (V1)
This document outlines the structure of the primary database tables for the MVP. The schema is managed automatically by Django's migration system based on the models defined in the code.

## Table: auth_user
This is a built-in Django table responsible for storing user account information, including securely hashed passwords.

Column Name	Data Type	Description
id	INTEGER	Primary Key. A unique number for each user.
password	VARCHAR	The user's securely hashed password.
last_login	DATETIME	Timestamp of the user's last login.
is_superuser	BOOLEAN	Designates if the user has all permissions.
username	VARCHAR	The user's unique username.
first_name	VARCHAR	The user's first name.
last_name	VARCHAR	The user's last name.
email	VARCHAR	The user's email address.
is_staff	BOOLEAN	Designates if the user can access the admin site.
is_active	BOOLEAN	Designates if the account is active.
date_joined	DATETIME	Timestamp of when the account was created.

## Table: expenses_expense
This is our custom table, created from the Expense model in the expenses app. It stores every expense transaction.

Column Name	Data Type	Description
id	INTEGER	Primary Key. A unique number for each expense record.
user_id	INTEGER	Foreign Key to auth_user.id. Links the expense to a specific user.
raw_text	TEXT	The original, unmodified sentence the user entered.
amount	DECIMAL	The monetary value of the expense, extracted by the AI.
category	VARCHAR	The category assigned by the AI (e.g., "Food & Dining").
vendor	VARCHAR	The vendor/store assigned by the AI (e.g., "Paradise").
transaction_date	DATE	The date the transaction occurred, as determined by the AI.
created_at	DATETIME	Timestamp for when the record was saved to the database.

## Relationships
There is a one-to-many relationship between auth_user and expenses_expense.

One User can have many Expense records.

Each Expense record belongs to exactly one User.