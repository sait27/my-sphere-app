# integrations/views.py
import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from .models import GoogleCalendarToken
from .calendar_service import GoogleCalendarService
from django.contrib.auth.models import User
from django.core.signing import Signer, BadSignature
import json

# Enhanced scopes for full calendar integration
SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
]
REDIRECT_URI = 'http://localhost:8000/api/v1/integrations/google/callback/'

def get_google_flow():
    """
    Helper function to create the Google OAuth Flow object
    using credentials from the .env file.
    """
    client_config = {
        "web": {
            "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI],
        }
    }

    return Flow.from_client_config(
        client_config=client_config,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )


class GoogleCalendarInitView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # --- UPDATED: Create a secure, signed state ---
        signer = Signer()
        # We are securely signing the user's ID to use as the state
        state = signer.sign(str(request.user.id))
        
        flow = get_google_flow()
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            prompt='consent',
            include_granted_scopes='true',
            state=state # <-- Use our new signed state
        )
        return Response({'authorization_url': authorization_url})


class GoogleCalendarCallbackView(APIView):
    def get(self, request):
        # --- UPDATED: Get the user ID from the signed state ---
        state = request.GET.get('state')
        signer = Signer()
        try:
            # Unsign the state to get the original user ID back.
            # If it's been tampered with, this will fail with an error.
            user_id = signer.unsign(state)
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, BadSignature):
            return Response("Error: Invalid state or user.", status=400)

        flow = get_google_flow()
        try:
            flow.fetch_token(authorization_response=str(request.get_full_path()))
        except Exception as e:
            return Response(f"Error fetching token: {e}", status=400)

        credentials = flow.credentials
        
        GoogleCalendarToken.objects.update_or_create(
            user=user, # <-- Use the user we securely retrieved from the state
            defaults={
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'expires_at': credentials.expiry,
            }
        )
        
        # Close the popup window with success message
        return redirect('http://localhost:5173/settings?calendar_connected=true')

class GoogleCalendarStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            token = GoogleCalendarToken.objects.get(user=request.user)
            calendar_service = GoogleCalendarService(request.user)
            calendars = calendar_service.get_calendars()
            
            return Response({
                'connected': True,
                'status': 'connected',
                'calendars': [{
                    'id': cal['id'],
                    'summary': cal['summary'],
                    'primary': cal.get('primary', False)
                } for cal in calendars],
                'settings': {
                    'syncTasks': True,
                    'syncExpenses': True,
                    'syncLists': False,
                    'autoSync': True
                }
            })
        except GoogleCalendarToken.DoesNotExist:
            return Response({
                'connected': False,
                'status': 'disconnected',
                'calendars': [],
                'settings': {}
            })
        except Exception as e:
            return Response({
                'connected': False,
                'status': 'error',
                'error': str(e),
                'calendars': [],
                'settings': {}
            })

    def delete(self, request):
        GoogleCalendarToken.objects.filter(user=request.user).delete()
        return Response({'status': 'disconnected'}, status=status.HTTP_204_NO_CONTENT)


class GoogleCalendarConnectView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        signer = Signer()
        state = signer.sign(str(request.user.id))
        
        flow = get_google_flow()
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            prompt='consent',
            include_granted_scopes='true',
            state=state
        )
        return Response({'auth_url': authorization_url})


class GoogleCalendarDisconnectView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        GoogleCalendarToken.objects.filter(user=request.user).delete()
        return Response({'status': 'disconnected'})


class GoogleCalendarSyncView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            calendar_service = GoogleCalendarService(request.user)
            calendar_id = request.data.get('calendar_id', 'primary')
            
            result = calendar_service.sync_tasks_to_calendar(calendar_id)
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': f"Synced {result['synced_count']} tasks to calendar",
                    'synced_count': result['synced_count'],
                    'errors': result.get('errors', [])
                })
            else:
                return Response({
                    'success': False,
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleCalendarSettingsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Store user's calendar sync preferences
        # You might want to create a separate model for this
        settings_data = request.data
        
        # For now, just return success
        # In a full implementation, you'd save these settings to a model
        return Response({
            'success': True,
            'message': 'Settings saved successfully',
            'settings': settings_data
        })


