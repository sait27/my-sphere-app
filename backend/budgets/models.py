# budgets/models.py

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.exceptions import ValidationError

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=100)
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(0.01)]
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'category', 'start_date', 'end_date')
        ordering = ['-start_date', 'category']

    def __str__(self):
        return f'{self.user.username} - {self.category} Budget ({self.start_date} to {self.end_date})'

    def clean(self):
        if self.start_date > self.end_date:
            raise ValidationError('Start date cannot be after end date.')

    @property
    def is_expired(self):
        return timezone.now().date() > self.end_date