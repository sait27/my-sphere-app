# budgets/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Budget
from .serializers import BudgetSerializer
from datetime import date
import calendar # Import the calendar module to find the last day of the month

class BudgetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        try:
            # CORRECTED LOGIC: Find an active budget where today is between the start and end dates.
            budget = Budget.objects.get(
                user=request.user, 
                is_active=True,
                start_date__lte=today, 
                end_date__gte=today
            )
            serializer = BudgetSerializer(budget)
            return Response(serializer.data)
        except Budget.DoesNotExist:
            return Response({'message': 'No budget set for the current month.'}, status=status.HTTP_404_NOT_FOUND)
        except Budget.MultipleObjectsReturned:
            # Handle cases where data might be messy with overlapping budgets
            budget = Budget.objects.filter(user=request.user, is_active=True, start_date__lte=today, end_date__gte=today).first()
            serializer = BudgetSerializer(budget)
            return Response(serializer.data)


    def post(self, request):
        today = date.today()
        amount = request.data.get('amount')

        if not amount or float(amount) <= 0:
            return Response({'error': 'A valid amount is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # CORRECTED LOGIC: Calculate the start and end of the current month
        start_of_month = today.replace(day=1)
        # Get the number of days in the current month to find the last day
        _, num_days = calendar.monthrange(today.year, today.month)
        end_of_month = today.replace(day=num_days)

        # Update if a budget for this month exists, or create a new one
        budget, created = Budget.objects.update_or_create(
            user=request.user, 
            start_date=start_of_month, # Use the correct lookup fields
            defaults={
                'amount': amount,
                'end_date': end_of_month,
                'is_active': True,
                # Set a category if your model requires it, otherwise remove this line
                'category': 'Overall' 
            }
        )
        serializer = BudgetSerializer(budget)

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)