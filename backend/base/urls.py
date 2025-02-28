from django.urls import path
from .service import loginService, logoutService, registerService, homePage
from rest_framework.authtoken.views import ObtainAuthToken

urlpatterns = [
    path('', homePage.home, name='home'),
    
    path("login/", loginService.loginPage, name="login"),
    path("logout/", logoutService.logoutUser, name="logout"),
    path("register/", registerService.registerPage, name="register"),
    
    path('api/token-auth/', ObtainAuthToken.as_view(), name='token-auth'),  # Built-in token authentication

]
