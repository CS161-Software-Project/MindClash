from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token  
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from ..models import UserProfile
from rest_framework.permissions import AllowAny

# Define the request body schema for login
login_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'email': openapi.Schema(type=openapi.TYPE_STRING, description='Email of the user', format='email'),
        'password': openapi.Schema(type=openapi.TYPE_STRING, description='Password of the user', format='password'),
    },
    required=['email', 'password']
)

# API - http://127.0.0.1:8000/login/ (POST request)
@csrf_exempt
@swagger_auto_schema(method='post', request_body=login_schema, responses={200: "Login successful", 400: "Invalid credentials"})
@api_view(['POST'])
@authentication_classes([])  # No auth required
@permission_classes([AllowAny])  # Public access
def loginPage(request):
    """ 
    User login API using Email instead of Username.
    """
    data = request.data
    email = data.get('email', '').lower()
    password = data.get('password', '')

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=400)

    try:
        # Retrieve user by email
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User with this email not found"}, status=400)

    # Authenticate using the username linked to the email
    user = authenticate(request, username=user.username, password=password)

    if user is not None:
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        return Response({
            "message": "Login successful",
            "user": {
                "username": user.username,
                "email": user.email,
                "profile": {
                    "avatar_url": profile.avatar_url,
                    "first_name": profile.first_name,
                    "last_name": profile.last_name,
                    "age": profile.age,
                    "bio": profile.bio
                }
            },
            "token": token.key
        }, status=200)
    else:
        return Response({"error": "Invalid credentials"}, status=400)