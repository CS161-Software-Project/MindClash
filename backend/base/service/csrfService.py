from django.http import JsonResponse
from django.middleware.csrf import get_token

def get_csrf_token(request):
    """
    View to get CSRF token for the session
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})
