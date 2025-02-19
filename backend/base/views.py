from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from .forms import CustomUserCreationForm
import json

# Define the request body schema for login
login_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username of the user'),
        'password': openapi.Schema(type=openapi.TYPE_STRING, description='Password of the user', format='password'),
    },
    required=['username', 'password']
)

@csrf_exempt
@swagger_auto_schema(method='post', request_body=login_schema, responses={200: "Login successful", 400: "Invalid credentials"})
@api_view(['POST'])
def loginPage(request):
    """
    User login API.
    """
    data = request.data
    username = data.get('username', '').lower()
    password = data.get('password', '')

    if not username or not password:
        return Response({"error": "Username and password are required"}, status=400)

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({"message": "Login successful", "user": user.username}, status=200)
    else:
        return Response({"error": "Invalid credentials"}, status=400)

# Define request body schema for registration
register_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username of the user'),
        'email': openapi.Schema(type=openapi.TYPE_STRING, description='Email of the user', format='email'),
        'password1': openapi.Schema(type=openapi.TYPE_STRING, description='Password', format='password'),
        'password2': openapi.Schema(type=openapi.TYPE_STRING, description='Confirm Password', format='password'),
    },
    required=['username', 'email', 'password1', 'password2']
)

@csrf_exempt
@swagger_auto_schema(method='post', request_body=register_schema, responses={201: "Registration successful", 400: "Registration failed"})
@api_view(['POST'])
def registerPage(request):
    """
    User registration API.
    """
    data = request.data
    form = CustomUserCreationForm(data)

    if form.is_valid():
        user = form.save(commit=False)
        user.username = user.username.lower()
        user.save()
        login(request, user)
        return Response({"message": "Registration successful", "user": user.username}, status=201)
    else:
        errors = form.errors.as_json()
        return Response({"error": "Registration failed", "details": errors}, status=400)


@csrf_exempt
@api_view(['POST'])
def logoutUser(request):
    logout(request)
    return Response({"message": "Logout successful"}, status=200)


@api_view(['GET'])
def home(request):
    return Response({"message": "Welcome to the Home API"}, status=200)
