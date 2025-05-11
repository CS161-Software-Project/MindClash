from django.urls import path
from .service import loginService, logoutService, registerService, homePage

urlpatterns = [
    path('', homePage.home, name='home'),
    path("login/", loginService.loginPage, name="login"),
    path("logout/", logoutService.logoutUser, name="logout"),
    path("register/", registerService.registerPage, name="register"),
]
