# integrations/urls.py
from django.urls import path
from .views import (
    GoogleCalendarInitView, GoogleCalendarCallbackView, GoogleCalendarStatusView,
    GoogleCalendarConnectView, GoogleCalendarDisconnectView, GoogleCalendarSyncView,
    GoogleCalendarSettingsView
)

urlpatterns = [
    path('google/connect/', GoogleCalendarInitView.as_view(), name='google_connect'),
    path('google/callback/', GoogleCalendarCallbackView.as_view(), name='google_callback'),
    path('google/status/', GoogleCalendarStatusView.as_view(), name='google_status'),
    path('google-calendar/status/', GoogleCalendarStatusView.as_view(), name='google-calendar-status'),
    path('google-calendar/connect/', GoogleCalendarConnectView.as_view(), name='google-calendar-connect'),
    path('google-calendar/disconnect/', GoogleCalendarDisconnectView.as_view(), name='google-calendar-disconnect'),
    path('google-calendar/sync/', GoogleCalendarSyncView.as_view(), name='google-calendar-sync'),
    path('google-calendar/settings/', GoogleCalendarSettingsView.as_view(), name='google-calendar-settings'),
]