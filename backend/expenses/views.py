from django.http import JsonResponse
from django.contrib.auth.models import User
from .models import Expense
import json
import os
import google.generativeai as genai
from datetime import datetime

# Import the new tools from Django REST Framework
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# --- AI Configuration (No changes here) ---
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    GEMINI_MODEL = genai.GenerativeModel('gemini-1.5-flash')
    print("✅ Gemini AI Model configured successfully.")
except KeyError:
    GEMINI_MODEL = None
    print("🔴 ERROR: GOOGLE_API_KEY environment variable not set. The AI will not work.")


class ExpenseAPIView(APIView):
    # This line is the security guard. It ensures only authenticated users can access this view.
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # The user object is now automatically available from the valid token!
        user = request.user 
        
        user_text = request.data.get('text')
        if not user_text:
            return Response({'error': 'The "text" field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"""
        You are a highly intelligent expense parsing system. Your task is to analyze the user's text and extract all distinct financial expenses.

        **Your Instructions:**
        1.  Identify every separate expense mentioned in the text.
        2.  For each expense, extract the amount, category, vendor, a short description, and the transaction_date.
        3.  The transaction_date should be today ({datetime.now().strftime('%Y-%m-%d')}) unless a different date like "yesterday" is mentioned.
        4.  The possible categories are: Food & Dining, Groceries, Shopping, Travel, Entertainment, Utilities, Health, Education, and Other.
        5.  Your final output MUST be a single, valid JSON object.
        6.  This JSON object must contain one key: "expenses".
        7.  The value for "expenses" must be a list of objects, one for each expense you found.
        8.  **CRITICAL RULE:** If you find NO expenses in the text, you MUST return an empty list, like this: {{"expenses": []}}. Do not return an error or a sentence.

        ---
        **Example:**
        User's Text: "shopping for a 1200rs shirt at Pantaloons and a coffee for 250 at Starbucks"
        Your JSON Response:
        {{
            "expenses": [
                {{
                    "amount": 1200.00,
                    "category": "Shopping",
                    "vendor": "Pantaloons",
                    "description": "a shirt",
                    "transaction_date": "2025-08-03"
                }},
                {{
                    "amount": 250.00,
                    "category": "Food & Dining",
                    "vendor": "Starbucks",
                    "description": "a coffee",
                    "transaction_date": "2025-08-03"
                }}
            ]
        }}
        ---

        **User's Text:** "{user_text}"
        **Your JSON Response:**
        """
        try:
            response = GEMINI_MODEL.generate_content(prompt)
            cleaned_json_string = response.text.strip().replace('```json', '').replace('```', '').strip()
            ai_data = json.loads(cleaned_json_string)
        except Exception as e:
            return Response({'error': 'Failed to process text with AI.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # --- Save to Database using the REAL logged-in user ---
        try:
            expense_list = ai_data.get('expenses', [])
            if not expense_list:
                return Response({'error': 'AI did not find any expenses in the text.'}, status=status.HTTP_400_BAD_REQUEST)

            created_expenses_ids = []
            for expense_data in expense_list:
                new_expense = Expense.objects.create(
                    user=user, # <-- Use the logged-in user from the request
                    raw_text=user_text,
                    amount=expense_data.get('amount'),
                    category=expense_data.get('category'),
                    vendor=expense_data.get('vendor'),
                    transaction_date=expense_data.get('transaction_date', datetime.now().strftime('%Y-%m-%d'))
                )
                created_expenses_ids.append(new_expense.id)
            
            print(f"✅ User '{user.username}' saved {len(created_expenses_ids)} new expenses.")

        except Exception as e:
            return Response({'error': 'Failed to save expenses to database.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # --- FINAL SUCCESS RESPONSE ---
        return Response({
            'status': 'success',
            'message': f'Successfully saved {len(created_expenses_ids)} expenses for user {user.username}.',
            'created_expense_ids': created_expenses_ids
        }, status=status.HTTP_201_CREATED)