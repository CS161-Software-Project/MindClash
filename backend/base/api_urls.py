from django.urls import path
from .service import loginService, logoutService, registerService, homePage
from rest_framework.authtoken.views import ObtainAuthToken
from . import views

urlpatterns = [

    # Auth token
    path('api/token-auth/', ObtainAuthToken.as_view(), name='token-auth'),

    # AI endpoints
    path('api/groq-chat/', views.groq_chat, name='groq-chat'),
    path('api/generate-quiz/', views.generate_quiz, name='generate-quiz'),

    # Profile
    path('api/profile/', views.get_profile, name='get-profile'),
    path('api/profile/update/', views.update_profile, name='update-profile'),

    # Multiplayer Quiz Game
    path('api/create_game_room/', views.create_game_room, name='create-game-room'),
    path('api/join_game_room/', views.join_game_room, name='join-game-room'),
    path('api/start_game/', views.start_game, name='start-game'),
    path('api/submit_answer/', views.submit_answer, name='submit-answer'),
    path('api/next_question/', views.next_question, name='next-question'),
    path('api/leaderboard/<str:pin>/', views.leaderboard, name='leaderboard'),
    path('api/game-room/<str:pin>/', views.get_game_room, name='get-game-room'),

    # Chat
    path('api/send_message/', views.send_chat_message, name='send-chat-message'),
    path('api/get_messages/<str:pin>/', views.get_chat_messages, name='get-chat-messages'),

    # Authenticated user info
    path('api/current_user/', views.current_user, name='current-user'),
    
    path('api/answer_distribution/<str:pin>/', views.answer_distribution, name='answer_distribution'),
]
