from django.urls import path
from .service import loginService, logoutService, registerService, homePage, gameService
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

    # Game-related endpoints
    path('api/game/create/', gameService.create_game, name='create-game'),
    path('api/game/join/', gameService.join_game, name='join-game'),
    path('api/game/<str:game_code>/status/', gameService.get_game_status, name='game-status'),
    path('api/game/<str:game_code>/start/', gameService.start_game, name='start-game'),
    path('api/game/<str:game_code>/answer/', gameService.submit_answer, name='submit-answer'),
    path('api/game/<str:game_code>/next/', gameService.next_question, name='next-question'),
    path('api/game/<str:game_code>/leaderboard/', gameService.get_leaderboard, name='leaderboard'),

    # Chat endpoints
    path('api/chat/send/', views.send_chat_message, name='send-chat-message'),
    path('api/chat/<str:pin>/', views.get_chat_messages, name='get-chat-messages'),
    
    # Leaderboard endpoint
    path('api/game/<str:game_code>/leaderboard/', views.get_leaderboard, name='get-leaderboard'),

    # Answer distribution endpoint
    path('api/answer_distribution/<str:pin>/', views.answer_distribution, name='answer_distribution'),
]
