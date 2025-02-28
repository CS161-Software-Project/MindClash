from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authtoken.models import Token  
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt

# Define the request body schema for login
login_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username of the user'),
        'password': openapi.Schema(type=openapi.TYPE_STRING, description='Password of the user', format='password'),
    },
    required=['username', 'password']
)

# API - http://127.0.0.1:8000/login/ (POST request)
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
        token, created = Token.objects.get_or_create(user=user)  
        return Response({"message": "Login successful", "user": user.username, "token": token.key}, status=200)
    else:
        return Response({"error": "Invalid credentials"}, status=400)
