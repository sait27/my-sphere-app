# budgets/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Budget
from .serializers import BudgetSerializer
from datetime import date

class BudgetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        try:
            budget = Budget.objects.get(user=request.user, year=today.year, month=today.month)
            serializer = BudgetSerializer(budget)
            return Response(serializer.data)
        except Budget.DoesNotExist:
            return Response({'message': 'No budget set for the current month.'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        today = date.today()
        data = {
            'user': request.user.id,
            'amount': request.data.get('amount'),
            'month': today.month,
            'year': today.year
        }

        # Update if exists, or create if it doesn't
        budget, created = Budget.objects.update_or_create(
            user=request.user, year=today.year, month=today.month,
            defaults={'amount': data['amount']}
        )
        serializer = BudgetSerializer(budget)

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)