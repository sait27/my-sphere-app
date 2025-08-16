# integrations/views.py
import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from .models import GoogleCalendarToken
from django.contrib.auth.models import User
from django.core.signing import Signer, BadSignature

# --- This is the configuration for our connection ---
# The SCOPES define what we are allowed to ask for. Here, we ask for read-only calendar access.
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
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
        
        return redirect('http://localhost:5173/settings')

class GoogleCalendarStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_connected = GoogleCalendarToken.objects.filter(user=request.user).exists()
        return Response({'is_connected': is_connected})

    def delete(self, request):
        GoogleCalendarToken.objects.filter(user=request.user).delete()
        return Response({'status': 'disconnected'}, status=status.HTTP_204_NO_CONTENT)


