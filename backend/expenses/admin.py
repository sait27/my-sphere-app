# expenses/admin.py

from django.contrib import admin
from .models import Expense

# This line "registers" your Expense model with the Django admin site.
admin.site.register(Expense)