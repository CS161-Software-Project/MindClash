from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from django.contrib.auth import logout

@api_view(['POST'])  # Logout should be a POST request for security
@authentication_classes([TokenAuthentication])  # Ensure Token Authentication is used
@permission_classes([IsAuthenticated])  # User must be logged in
def logoutUser(request):
    # Delete the token instead of using request.auth
    Token.objects.filter(user=request.user).delete()
    logout(request)
    return Response({"message": "Successfully logged out"}, status=200)
