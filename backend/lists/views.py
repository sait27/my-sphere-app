# lists/views.py

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from .models import List, ListItem
from .serializers import ListSerializer, ListItemSerializer

import os
import google.generativeai as genai
import json

# --- ViewSet for Managing Lists (Create, Read, Update, Delete) ---
class ListViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ListSerializer

    def get_queryset(self):
        # Ensure users can only see their own lists
        return List.objects.filter(user=self.request.user).prefetch_related('items')

    def perform_create(self, serializer):
        # Automatically assign the logged-in user when a new list is created
        serializer.save(user=self.request.user)

# --- Special View for AI-powered "Smart Add" ---
class SmartAddItemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, list_id):
        user_text = request.data.get('text')
        if not user_text:
            return Response({'error': 'Text field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_list = List.objects.get(id=list_id, user=request.user)
        except List.DoesNotExist:
            return Response({'error': 'List not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Configure the AI model
        try:
            genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
            model = genai.GenerativeModel('gemini-1.5-flash')
        except Exception:
            return Response({'error': 'AI Service not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        prompt = f"""
        You are a smart checklist parsing system.
        Analyze the user's text and extract all the distinct items for a list.
        For each item, extract its name and an optional quantity.
        Respond ONLY with a single JSON object containing one key: "items".
        The value of "items" must be a list of objects, where each object has a "name" and "quantity" key. The quantity should be null if not present.

        ---
        Example User Text: "milk 2 litres, bread 1 loaf, and a dozen eggs"
        Example JSON Response:
        {{
            "items": [
                {{"name": "milk", "quantity": "2 litres"}},
                {{"name": "bread", "quantity": "1 loaf"}},
                {{"name": "eggs", "quantity": "a dozen"}}
            ]
        }}
        ---

        User's Text: "{user_text}"
        Your JSON Response:
        """

        try:
            response = model.generate_content(prompt)
            cleaned_json = response.text.strip().replace('```json', '').replace('```', '')
            ai_data = json.loads(cleaned_json)
            
            items_to_create = []
            for item in ai_data.get('items', []):
                items_to_create.append(
                    ListItem(list=target_list, name=item.get('name'), quantity=item.get('quantity'))
                )
            
            ListItem.objects.bulk_create(items_to_create)
            target_list.save()
            
            return Response({'status': f'Successfully added {len(items_to_create)} items.'}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': 'Failed to process text with AI.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ListItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ListItemSerializer

    def get_queryset(self):
        # Ensure users can only modify items in their own lists
        return ListItem.objects.filter(list__user=self.request.user)
    
class AgendaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Find the user's most recently updated list
            latest_list = List.objects.filter(user=request.user).latest('updated_at')

            # Get the top 5 uncompleted items from that list
            agenda_items = ListItem.objects.filter(
                list=latest_list, 
                is_completed=False
            ).order_by('created_at')[:5]

            serializer = ListItemSerializer(agenda_items, many=True)

            response_data = {
                'list_name': latest_list.name,
                'items': serializer.data
            }
            return Response(response_data)

        except List.DoesNotExist:
            # If the user has no lists, return an empty state
            return Response({'list_name': None, 'items': []})