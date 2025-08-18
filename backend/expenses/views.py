from django.http import JsonResponse
from django.contrib.auth.models import User
from django.shortcuts import render
from .models import Expense
import json
import os
import google.generativeai as genai
from datetime import datetime,timedelta,date

# Import the new tools from Django REST Framework
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from django.db.models import Sum, DecimalField, Count, Avg, Q
from django.db.models.functions import TruncMonth, TruncDate
from .serializers import ExpenseSerializer
from budgets.models import Budget
from .ai_insights import AIInsightsEngine
from .advanced_analytics import AdvancedExpenseAnalytics

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

    def get(self, request):
        # Get all expenses that belong to the currently logged-in user
        expenses = Expense.objects.filter(user=request.user).order_by('display_id')
        # Use the serializer to convert the data to JSON
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        user = request.user
        user_text = request.data.get('text')
        if not user_text:
            return Response({'error': 'The "text" field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"""
        You are a highly intelligent expense parsing system. Your task is to analyze the user's text and extract ALL SEPARATE financial expenses mentioned.

        **CRITICAL INSTRUCTIONS:**
        1. CAREFULLY identify EVERY INDIVIDUAL expense mentioned in the text, even if they are in a single sentence.
        2. Look for patterns like "X on item1, Y on item2, Z on item3" - these are SEPARATE expenses.
        3. For each expense, extract: amount, category, vendor (if mentioned), description, and transaction_date.
        4. The transaction_date should be today ({datetime.now().strftime('%Y-%m-%d')}) unless specified otherwise.
        5. Categories: Food & Dining, Groceries, Shopping, Travel, Entertainment, Utilities, Health, Education, Other.
        6. Return ONLY valid JSON with "expenses" array.

        **EXAMPLES:**
        Input: "paid 40 on pickles, 100 on shirt, 50 on milk"
        Output:
        {{
            "expenses": [
                {{
                    "amount": 40.00,
                    "category": "Groceries",
                    "vendor": null,
                    "description": "pickles",
                    "transaction_date": "{datetime.now().strftime('%Y-%m-%d')}"
                }},
                {{
                    "amount": 100.00,
                    "category": "Shopping",
                    "vendor": null,
                    "description": "shirt",
                    "transaction_date": "{datetime.now().strftime('%Y-%m-%d')}"
                }},
                {{
                    "amount": 50.00,
                    "category": "Groceries",
                    "vendor": null,
                    "description": "milk",
                    "transaction_date": "{datetime.now().strftime('%Y-%m-%d')}"
                }}
            ]
        }}

        Input: "bought groceries for 200 at BigBazar and coffee for 150 at Starbucks"
        Output:
        {{
            "expenses": [
                {{
                    "amount": 200.00,
                    "category": "Groceries",
                    "vendor": "BigBazar",
                    "description": "groceries",
                    "transaction_date": "{datetime.now().strftime('%Y-%m-%d')}"
                }},
                {{
                    "amount": 150.00,
                    "category": "Food & Dining",
                    "vendor": "Starbucks",
                    "description": "coffee",
                    "transaction_date": "{datetime.now().strftime('%Y-%m-%d')}"
                }}
            ]
        }}

        **User's Text:** "{user_text}"
        **Your JSON Response:**
        """
        
        try:
            response = GEMINI_MODEL.generate_content(prompt)
            cleaned_json_string = response.text.strip().replace('```json', '').replace('```', '').strip()
            ai_data = json.loads(cleaned_json_string)
        except Exception as e:
            return Response({'error': 'Failed to process text with AI.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # --- UPDATED and MORE ROBUST saving logic ---
        expense_list = ai_data.get('expenses', [])
        
        if not expense_list:
            return Response({'error': 'AI did not find any expenses in the text.'}, status=status.HTTP_400_BAD_REQUEST)

        created_expenses_ids = []
        try:
            # Use a transaction to prevent race conditions
            from django.db import transaction
            
            with transaction.atomic():
                # Get the highest display_id for this user to ensure sequential numbering
                # Use select_for_update to lock the row and prevent race conditions
                highest_display_id = Expense.objects.filter(user=user).order_by('-display_id').select_for_update().first()
                next_display_id = 1  # Default starting ID
                if highest_display_id:
                    next_display_id = highest_display_id.display_id + 1
                    
                for i, expense_data in enumerate(expense_list):
                    # Use .get() with default values to prevent crashes if a key is missing
                    new_expense = Expense.objects.create(
                        user=user,
                        display_id=next_display_id + i,  # Increment for each expense in batch
                        raw_text=user_text,
                        amount=expense_data.get('amount'),
                        category=expense_data.get('category', 'Other'), # Default to 'Other'
                        vendor=expense_data.get('vendor'), # Allows vendor to be missing
                        description=expense_data.get('description'), # Add description field
                        transaction_date=expense_data.get('transaction_date', datetime.now().strftime('%Y-%m-%d'))
                    )
                    created_expenses_ids.append(new_expense.expense_id)
                    print(f"✅ Created expense ID: {new_expense.expense_id} with display_id: {new_expense.display_id}")
                
                print(f"✅ User '{user.username}' saved {len(created_expenses_ids)} new expenses.")

        except Exception as e:
            # If saving fails, this will now give us a much more detailed error
            print(f"🔴 DATABASE SAVE ERROR: {str(e)}")
            print(f"🔴 PROBLEMATIC AI DATA: {expense_data}")
            return Response({'error': 'Failed to save expense to database.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'status': 'success',
            'message': f'Successfully saved {len(created_expenses_ids)} expenses for user {user.username}.',
            'created_expense_ids': created_expenses_ids
        }, status=status.HTTP_201_CREATED)
    

class ExpenseDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    This view handles getting, updating, and deleting a single expense.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ExpenseSerializer
    queryset = Expense.objects.all()
    
    # This tells the view to use the 'expense_id' field in the URL for lookup,
    # instead of the default 'pk'.
    lookup_field = 'expense_id'

    # This is a security measure to ensure users can only affect their own expenses
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class ExpenseSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        # Calculate start of the week (assuming Monday is the first day)
        start_of_week = today - timedelta(days=today.weekday())

        # Calculate totals using Django's aggregation features
        today_sum = Expense.objects.filter(
            user=user, transaction_date=today
        ).aggregate(total=Sum('amount', output_field=DecimalField()))['total'] or 0.00

        week_sum = Expense.objects.filter(
            user=user, transaction_date__gte=start_of_week
        ).aggregate(total=Sum('amount', output_field=DecimalField()))['total'] or 0.00

        month_sum = Expense.objects.filter(
            user=user, transaction_date__year=today.year, transaction_date__month=today.month
        ).aggregate(total=Sum('amount', output_field=DecimalField()))['total'] or 0.00

        # --- THIS IS THE CORRECTED LOGIC ---
        current_budget_amount = 0.00
        try:
            # Find an active budget where today's date is between its start and end dates
            # This is more flexible than relying on year/month fields
            budget = Budget.objects.get(
                user=user,
                is_active=True,
                start_date__lte=today,
                end_date__gte=today
            )
            current_budget_amount = budget.amount
        except Budget.DoesNotExist:
            # It's okay if no budget is set for the current period. Don't crash.
            print(f"No active budget found for user {user.username} for today's date.")
        except Budget.MultipleObjectsReturned:
            # Handle case where user might have multiple overlapping budgets
            print(f"Warning: Multiple active budgets found for user {user.username}. Using the first one.")
            budget = Budget.objects.filter(
                user=user, is_active=True, start_date__lte=today, end_date__gte=today
            ).first()
            if budget:
                current_budget_amount = budget.amount

        summary_data = {
            'today': today_sum,
            'week': week_sum,
            'month': month_sum,
            'current_budget': current_budget_amount
        }

        return Response(summary_data, status=status.HTTP_200_OK)


class ExpenseAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        period = request.GET.get('period', 'month')
        
        # Get date range based on period
        now = datetime.now()
        if period == 'month':
            start_date = now.replace(day=1)
        elif period == 'quarter':
            quarter_start = ((now.month - 1) // 3) * 3 + 1
            start_date = now.replace(month=quarter_start, day=1)
        elif period == 'year':
            start_date = now.replace(month=1, day=1)
        else:
            start_date = now.replace(day=1)
        
        expenses = Expense.objects.filter(
            user=user,
            transaction_date__gte=start_date.date()
        )
        
        # Summary statistics
        summary = expenses.aggregate(
            total_amount=Sum('amount'),
            expense_count=Count('expense_id'),
            average_amount=Avg('amount')
        )
        
        # Calculate daily average
        days_in_period = (now.date() - start_date.date()).days + 1
        daily_average = summary['total_amount'] / days_in_period if summary['total_amount'] else 0
        
        # Category breakdown
        category_breakdown = expenses.values('category').annotate(
            total=Sum('amount'),
            count=Count('expense_id')
        ).order_by('-total')
        
        # Payment method breakdown
        payment_method_breakdown = expenses.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('expense_id')
        ).order_by('-total')
        
        return Response({
            'summary': {
                'total_amount': float(summary['total_amount'] or 0),
                'expense_count': summary['expense_count'],
                'average_amount': float(summary['average_amount'] or 0),
                'daily_average': float(daily_average)
            },
            'category_breakdown': [
                {
                    'category': item['category'],
                    'total': float(item['total']),
                    'count': item['count']
                }
                for item in category_breakdown
            ],
            'payment_method_breakdown': [
                {
                    'payment_method': item['payment_method'] or 'cash',
                    'total': float(item['total']),
                    'count': item['count']
                }
                for item in payment_method_breakdown
            ]
        })


class ExpenseTrendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        months = int(request.GET.get('months', 6))
        
        # Get expenses from the last N months
        start_date = datetime.now() - timedelta(days=months * 30)
        
        monthly_trends = Expense.objects.filter(
            user=user,
            transaction_date__gte=start_date.date()
        ).annotate(
            month=TruncMonth('transaction_date')
        ).values('month').annotate(
            total=Sum('amount'),
            count=Count('expense_id')
        ).order_by('month')
        
        return Response({
            'monthly_trends': [
                {
                    'month': trend['month'].strftime('%B %Y'),
                    'total': float(trend['total']),
                    'count': trend['count']
                }
                for trend in monthly_trends
            ]
        })


class ExpenseBudgetAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get current month's expenses by category
        now = datetime.now()
        start_of_month = now.replace(day=1)
        
        current_month_expenses = Expense.objects.filter(
            user=user,
            transaction_date__gte=start_of_month.date()
        ).values('category').annotate(
            spent=Sum('amount')
        )
        
        # Get user's budgets - Budget model doesn't have category field
        # For now, return empty budget analysis since Budget model needs category field
        budget_analysis = []
        
        return Response({
            'budget_analysis': budget_analysis,
            'message': 'Budget analysis requires Budget model to have category field'
        })

class ExpenseBulkOperationsView(APIView):
    """Handle bulk operations on expenses"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print(f"🔍 Bulk Operations Request Data: {request.data}")
        action = request.data.get('action') or request.data.get('operation')  # Support both
        expense_ids = request.data.get('expense_ids', [])
        
        print(f"🔍 Action: {action}")
        print(f"🔍 Expense IDs: {expense_ids}")
        
        if not action or not expense_ids:
            print(f"🔴 Missing required fields - Action: {action}, Expense IDs: {expense_ids}")
            return Response({'error': 'Action and expense_ids are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Filter expenses to only those belonging to the user
        expenses = Expense.objects.filter(expense_id__in=expense_ids, user=request.user)
        
        if action == 'delete':
            count = expenses.count()
            expenses.delete()
            return Response({'message': f'Successfully deleted {count} expenses'}, status=status.HTTP_200_OK)
        
        elif action == 'categorize':
            new_category = request.data.get('category')
            if not new_category:
                return Response({'error': 'Category is required for categorize'}, status=status.HTTP_400_BAD_REQUEST)
            
            count = expenses.update(category=new_category)
            return Response({'message': f'Successfully categorized {count} expenses'}, status=status.HTTP_200_OK)
        
        elif action == 'duplicate':
            duplicated_count = 0
            for expense in expenses:
                # Create a duplicate with a new ID
                expense.pk = None  # This will create a new instance
                expense.expense_id = None  # Let the model generate a new ID
                expense.save()
                duplicated_count += 1
            return Response({'message': f'Successfully duplicated {duplicated_count} expenses'}, status=status.HTTP_200_OK)
        
        else:
            return Response({'error': f'Invalid action: {action}'}, status=status.HTTP_400_BAD_REQUEST)


class ExpenseExportView(APIView):
    """Export expenses to CSV format"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print(f"🔍 Export request data: {request.data}")
        expense_ids = request.data.get('expense_ids', [])
        export_format = request.data.get('format', 'csv')
        
        print(f"🔍 Expense IDs: {expense_ids}")
        print(f"🔍 Format: {export_format}")
        
        if not expense_ids:
            print("🔴 No expense IDs provided")
            return Response({'error': 'expense_ids are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Filter expenses to only those belonging to the user
        expenses = Expense.objects.filter(expense_id__in=expense_ids, user=request.user).order_by('-transaction_date')
        print(f"🔍 Found {expenses.count()} expenses for user {request.user.username}")
        
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="expenses_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            
            writer = csv.writer(response)
            # Write header
            writer.writerow(['Date', 'Amount (₹)', 'Category', 'Vendor', 'Description', 'Payment Method'])
            
            # Write expense data
            for expense in expenses:
                row = [
                    expense.transaction_date.strftime('%Y-%m-%d') if expense.transaction_date else '',
                    f"₹{expense.amount}",
                    expense.category or '',
                    expense.vendor or '',
                    expense.description or '',
                    expense.payment_method or 'Not specified'
                ]
                writer.writerow(row)
                print(f"🔍 Writing row: {row}")
            
            print(f"✅ CSV export completed for {expenses.count()} expenses")
            return response
        
        return Response({'error': 'Unsupported export format'}, status=status.HTTP_400_BAD_REQUEST)


class AIInsightsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Generate AI-powered insights for the user"""
        try:
            insights_engine = AIInsightsEngine(request.user)
            insights_data = insights_engine.generate_insights()
            return Response(insights_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate AI insights: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdvancedAnalyticsView(APIView):
    """Advanced analytics endpoint with predictive insights"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'month')
        
        try:
            analytics_engine = AdvancedExpenseAnalytics(request.user)
            analytics_data = analytics_engine.get_comprehensive_analytics(period)
            return Response(analytics_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate advanced analytics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BudgetAnalysisView(APIView):
    """Budget analysis endpoint"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            analytics_engine = AdvancedExpenseAnalytics(request.user)
            budget_data = analytics_engine.get_budget_analysis()
            return Response(budget_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate budget analysis: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TrendsAnalysisView(APIView):
    """Trends analysis endpoint"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        months = request.query_params.get('months', 6)
        try:
            analytics_engine = AdvancedExpenseAnalytics(request.user)
            trends_data = analytics_engine.get_trends_analysis(int(months))
            return Response(trends_data)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate trends analysis: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )