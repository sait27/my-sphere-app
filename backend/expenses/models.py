# expenses/models.py

from django.db import models
from django.contrib.auth.models import User
import shortuuid

def generate_expense_id():
    # This now generates the all-caps version
    return f"EXP{shortuuid.random(length=22).upper()}"

class Expense(models.Model):
    expense_id = models.CharField(
        max_length=25,
        primary_key=True,
        default=generate_expense_id,
        editable=False
    )

    # --- NEW FIELD ---
    # This will store the simple, sequential ID (1, 2, 3...) for each user.
    display_id = models.IntegerField(editable=False)

    # --- (The rest of the fields are the same) ---
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    raw_text = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    vendor = models.CharField(max_length=100, blank=True, null=True)
    transaction_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.expense_id}"

    # --- NEW LOGIC ---
    # We override the save method to calculate the display_id before saving.
    def save(self, *args, **kwargs):
        if not self.display_id:
            # Find the highest display_id for this user and add 1
            last_expense = Expense.objects.filter(user=self.user).order_by('-display_id').first()
            if last_expense:
                self.display_id = last_expense.display_id + 1
            else:
                self.display_id = 1
        super().save(*args, **kwargs) # Call the original save method