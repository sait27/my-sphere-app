# budgets/models.py

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from datetime import date

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(0.01)]
    )
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()

    class Meta:
        # Ensures a user can only have one budget per month
        unique_together = ('user', 'month', 'year')

    def __str__(self):
        return f"{self.user.username}'s Budget for {date(self.year, self.month, 1).strftime('%B %Y')}"