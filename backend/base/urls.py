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

    # Multiplayer Quiz Endpoints
    path('api/game/create/', views.create_game, name='create-game'),
   # path('api/game/<str:code>/join/', views.join_game, name='join-game'),
    path('api/game/<str:code>/info/', views.get_game_info, name='get-game-info'),

    path('api/game/<str:code>/answer/', views.submit_answer, name='submit-answer'),
    path('api/game/<str:code>/chat/', views.send_chat_message, name='send-chat-message'),
    path('api/game/<str:code>/advance/', views.advance_game, name='advance-game'),
    
    path('api/game/<str:code>/join/', views.join_game_with_code, name='join-game-code'),
    path('api/game/<str:code>/start/', views.start_game, name='start-game'),

    path('api/game/<str:code>/finalize/', views.finalize_question, name='finalize-question'),
    path('api/game/<str:code>/leaderboard/', views.get_leaderboard, name='get-leaderboard'),

    path('api/game/<str:code>/next/', views.go_to_next_question, name='next-question'),
    path('api/game/<str:code>/info/', views.get_game_info, name='game-info'),

]
