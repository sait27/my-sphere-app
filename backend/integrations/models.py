# integrations/models.py

from django.db import models
from django.contrib.auth.models import User

class GoogleCalendarToken(models.Model):
    # A one-to-one link to a user.
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # The user's specific access token (the short-lived "valet key")
    access_token = models.CharField(max_length=2048)

    # The user's specific refresh token (the long-lived key to get new access tokens)
    refresh_token = models.CharField(max_length=2048)

    # When the current access_token expires
    expires_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Google Calendar Token for {self.user.username}"