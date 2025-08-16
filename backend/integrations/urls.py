# integrations/urls.py
from django.urls import path
from .views import GoogleCalendarInitView, GoogleCalendarCallbackView, GoogleCalendarStatusView

urlpatterns = [
    path('google/connect/', GoogleCalendarInitView.as_view(), name='google_connect'),
    path('google/callback/', GoogleCalendarCallbackView.as_view(), name='google_callback'),
    path('google/status/', GoogleCalendarStatusView.as_view(), name='google_status'),
]