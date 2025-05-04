from django.urls import path
from .service import loginService, logoutService, registerService, homePage
from rest_framework.authtoken.views import ObtainAuthToken
from . import views

urlpatterns = [
    path('', homePage.home, name='home'),
    
    path("login/", loginService.loginPage, name="login"),
    path("logout/", logoutService.logoutUser, name="logout"),
    path("register/", registerService.registerPage, name="register"),
    
    path('api/token-auth/', ObtainAuthToken.as_view(), name='token-auth'),  # Built-in token authentication
    
    path('api/groq-chat/', views.groq_chat, name='groq-chat'),  # GROQ AI endpoint
    path('api/generate-quiz/', views.generate_quiz, name='generate-quiz'),  # Quiz generation endpoint
    
    path('api/profile/', views.get_profile, name='get-profile'),  # Get user profile
    path('api/profile/update/', views.update_profile, name='update-profile'),  # Update user profile
]
