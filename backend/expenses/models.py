# expenses/models.py

from django.db import models
from django.contrib.auth.models import User # To link expenses to users

class Expense(models.Model):
    # Link to the user who created the expense
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    # The original text the user entered
    raw_text = models.TextField(blank=True, null=True)
    
    # The structured data from the AI
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    vendor = models.CharField(max_length=100, blank=True, null=True)
    transaction_date = models.DateField()

    # Timestamps for when the record was created
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.vendor or self.category} - {self.amount}"