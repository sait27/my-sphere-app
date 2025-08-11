# lists/models.py

from django.db import models
from django.contrib.auth.models import User
import shortuuid

# --- List Model ---
def generate_list_id():
    """Generates a unique, prefixed ID for a List."""
    return f"LST{shortuuid.random(length=22).upper()}"

class List(models.Model):
    id = models.CharField(
        max_length=25,
        primary_key=True,
        default=generate_list_id,
        editable=False
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lists')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

# --- ListItem Model ---
def generate_list_item_id():
    """Generates a unique, prefixed ID for a ListItem."""
    return f"ITM{shortuuid.random(length=22).upper()}"

class ListItem(models.Model):
    id = models.CharField(
        max_length=25,
        primary_key=True,
        default=generate_list_item_id,
        editable=False
    )
    # This links the item back to its parent list
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    quantity = models.CharField(max_length=50, blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name