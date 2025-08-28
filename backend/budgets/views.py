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

class BudgetListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        budgets = Budget.objects.filter(user=request.user)
        serializer = BudgetSerializer(budgets, many=True)
        return Response(serializer.data)

    def post(self, request):
        category = request.data.get('category', 'Food & Dining')
        amount = request.data.get('amount', 5000)
        
        today = date.today()
        start_of_month = today.replace(day=1)
        _, num_days = calendar.monthrange(today.year, today.month)
        end_of_month = today.replace(day=num_days)
        
        budget = Budget.objects.create(
            user=request.user,
            category=category,
            amount=amount,
            start_date=start_of_month,
            end_date=end_of_month,
            is_active=True
        )
        
        serializer = BudgetSerializer(budget)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    def post(self, request):
        today = date.today()
        amount = request.data.get('amount')
        category = request.data.get('category', 'Overall')

        if not amount or float(amount) <= 0:
            return Response({'error': 'A valid amount is required.'}, status=status.HTTP_400_BAD_REQUEST)

        start_of_month = today.replace(day=1)
        _, num_days = calendar.monthrange(today.year, today.month)
        end_of_month = today.replace(day=num_days)

        budget, created = Budget.objects.update_or_create(
            user=request.user, 
            category=category,
            start_date=start_of_month,
            defaults={
                'amount': amount,
                'end_date': end_of_month,
                'is_active': True
            }
        )
        serializer = BudgetSerializer(budget)

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)