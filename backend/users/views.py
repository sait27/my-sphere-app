# users/views.py

from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if not username or not password or not email:
            return Response(
                {'error': 'All fields (username, password, email) are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # .create_user() handles password hashing automatically
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email
        )

        return Response(
            {'success': f'User "{user.username}" created successfully.'},
            status=status.HTTP_201_CREATED
        )