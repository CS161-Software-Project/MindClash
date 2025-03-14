from django.urls import path
from .service import loginService, logoutService, registerService, homePage, llamafileService
from rest_framework.authtoken.views import ObtainAuthToken

urlpatterns = [
    path('', homePage.home, name='home'),
    
    path("login/", loginService.loginPage, name="login"),
    path("logout/", logoutService.logoutUser, name="logout"),
    path("register/", registerService.registerPage, name="register"),
    
    path('api/token-auth/', ObtainAuthToken.as_view(), name='token-auth'),  # Built-in token authentication
    
    # Quiz endpoints using llamafile
    path('api/quiz/generate/', llamafileService.generate_quiz_questions, name='generate_quiz'),
    path('api/quiz/<int:quiz_id>/', llamafileService.get_quiz_by_id, name='get_quiz'),
    path('api/quiz/<int:quiz_id>/check/', llamafileService.check_answers, name='check_answers'),
]
