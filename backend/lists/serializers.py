# lists/serializers.py

from rest_framework import serializers
from .models import ListItem, List

class ListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListItem
        fields = ['id', 'name', 'quantity', 'is_completed']

class ListSerializer(serializers.ModelSerializer):
    # This nests the item details within the list's API response
    items = ListItemSerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = ['id', 'name', 'created_at', 'items']