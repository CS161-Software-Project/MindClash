from django.conf import settings
from groq import Groq
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import json
import os
from .models import UserProfile, GameSession, Player, GameMessage, PlayerAnswer
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status

# Initialize GROQ client with API key from settings
client = Groq(
    api_key=settings.GROQ_API_KEY,
)

# Define the request body schema for GROQ chat
groq_chat_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'prompt': openapi.Schema(type=openapi.TYPE_STRING, description='The prompt to send to GROQ AI'),
        'model': openapi.Schema(type=openapi.TYPE_STRING, description='GROQ model to use', default="meta-llama/llama-4-scout-17b-16e-instruct"),
        'max_tokens': openapi.Schema(type=openapi.TYPE_INTEGER, description='Maximum tokens for completion', default=1024),
        'temperature': openapi.Schema(type=openapi.TYPE_NUMBER, description='Temperature for generation', default=1.0),
    },
    required=['prompt']
)

# Define the request body schema for quiz generation
quiz_generation_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'topic': openapi.Schema(type=openapi.TYPE_STRING, description='Quiz topic'),
        'difficulty': openapi.Schema(type=openapi.TYPE_STRING, description='Quiz difficulty level', default="medium"),
        'count': openapi.Schema(type=openapi.TYPE_INTEGER, description='Number of questions', default=5),
        'model': openapi.Schema(type=openapi.TYPE_STRING, description='GROQ model to use', default="meta-llama/llama-4-scout-17b-16e-instruct"),
    },
    required=['topic']
)

# Define request body schema for profile update
profile_update_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'avatar_url': openapi.Schema(type=openapi.TYPE_STRING, description='URL of the user avatar'),
        'first_name': openapi.Schema(type=openapi.TYPE_STRING, description='First name of the user'),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING, description='Last name of the user'),
        'age': openapi.Schema(type=openapi.TYPE_INTEGER, description='Age of the user'),
        'bio': openapi.Schema(type=openapi.TYPE_STRING, description='User bio'),
    }
)

# API - http://127.0.0.1:8000/api/groq-chat/ (POST request)
@swagger_auto_schema(
    method='post', 
    request_body=groq_chat_schema, 
    responses={200: "GROQ response successful", 400: "Invalid request", 500: "GROQ API error"}
)
@api_view(['POST'])
def groq_chat(request):
    """
    Endpoint to interact with GROQ AI.
    """
    try:
        data = request.data
        prompt = data.get('prompt')
        model = data.get('model', "meta-llama/llama-4-scout-17b-16e-instruct")
        max_tokens = data.get('max_tokens', 1024)
        temperature = data.get('temperature', 1.0)
        
        if not prompt:
            return Response({"error": "Prompt is required"}, status=400)
            
        # Create GROQ completion
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=temperature,
            max_completion_tokens=max_tokens,
            top_p=1,
            stream=False,
            stop=None,
        )
        
        # Extract response content
        response_content = completion.choices[0].message.content
        
        return Response({
            "success": True,
            "response": response_content,
            "model": model,
            "usage": {
                "input_tokens": completion.usage.prompt_tokens,
                "output_tokens": completion.usage.completion_tokens,
                "total_tokens": completion.usage.total_tokens
            }
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# API - http://127.0.0.1:8000/api/generate-quiz/ (POST request)
@swagger_auto_schema(
    method='post', 
    request_body=quiz_generation_schema, 
    responses={200: "Quiz generated successfully", 400: "Invalid request", 500: "Quiz generation error"}
)
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def generate_quiz(request):
    """
    Endpoint to generate a quiz using GROQ AI.
    """
    try:
        data = request.data
        topic = data.get('topic')
        difficulty = data.get('difficulty', 'medium')
        count = data.get('count', 5)
        model = data.get('model', "meta-llama/llama-4-scout-17b-16e-instruct")
        
        if not topic:
            return Response({"error": "Topic is required"}, status=400)
        
        # Create the prompt for quiz generation
        prompt = f"""Generate a timed quiz of {count} multiple-choice questions on the topic "{topic}" with difficulty level {difficulty}.
        
        Format the response as a JSON object with the following structure:
        {{
          "title": "Quiz title",
          "questions": [
            {{
              "question": "Question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "Correct option letter (A, B, C, or D)",
              "explanation": "Brief explanation of the answer"
            }},
            ... more questions
          ],
          "recommendedTimeInMinutes": recommended time to complete this quiz
        }}
        
        Make sure all questions are factually accurate and each has exactly 4 answer options.
        """
            
        # Create GROQ completion
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_completion_tokens=2048,
            top_p=1,
            stream=False,
            stop=None,
        )
        
        # Extract response content
        response_content = completion.choices[0].message.content
        
        # Try to extract JSON from the response
        try:
            # Look for JSON in code blocks or in the entire response
            json_match = response_content.strip()
            if "```json" in json_match:
                json_match = json_match.split("```json")[1].split("```")[0].strip()
            elif "```" in json_match:
                json_match = json_match.split("```")[1].split("```")[0].strip()
            
            # Parse the JSON
            quiz_data = json.loads(json_match)
            
            # Validate the quiz data structure
            if "title" not in quiz_data or "questions" not in quiz_data:
                raise ValueError("Invalid quiz data structure")
                
            # Return the quiz data
            return Response({
                "success": True,
                "quiz": quiz_data,
                "topic": topic,
                "difficulty": difficulty,
                "count": count
            })
            
        except Exception as json_error:
            # If JSON parsing failed, return the raw response
            return Response({
                "success": False,
                "error": f"Failed to parse quiz data: {str(json_error)}",
                "raw_response": response_content
            }, status=400)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@swagger_auto_schema(
    method='post',
    request_body=profile_update_schema,
    responses={200: "Profile updated successfully", 400: "Invalid request"}
)
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Update user profile information including avatar URL
    """
    try:
        profile = UserProfile.objects.get(user=request.user)
        data = request.data
        
        # Update fields if provided in request
        if 'avatar_url' in data:
            profile.avatar_url = data['avatar_url']
        if 'first_name' in data:
            profile.first_name = data['first_name']
        if 'last_name' in data:
            profile.last_name = data['last_name']
        if 'age' in data:
            profile.age = data['age']
        if 'bio' in data:
            profile.bio = data['bio']
            
        profile.save()
        
        return Response({
            "success": True,
            "message": "Profile updated successfully",
            "profile": {
                "username": request.user.username,
                "email": request.user.email,
                "avatar_url": profile.avatar_url,
                "first_name": profile.first_name,
                "last_name": profile.last_name,
                "age": profile.age,
                "bio": profile.bio
            }
        })
        
    except UserProfile.DoesNotExist:
        return Response({
            "error": "User profile not found"
        }, status=400)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=400)

@swagger_auto_schema(
    method='get',
    responses={200: "Profile retrieved successfully", 404: "Profile not found"}
)
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Get user profile information
    """
    try:
        profile = UserProfile.objects.get(user=request.user)
        return Response({
            "success": True,
            "profile": {
                "username": request.user.username,
                "email": request.user.email,
                "avatar_url": profile.avatar_url,
                "first_name": profile.first_name,
                "last_name": profile.last_name,
                "age": profile.age,
                "bio": profile.bio
            }
        })
    except UserProfile.DoesNotExist:
        return Response({
            "error": "User profile not found"
        }, status=404)

# --- Multiplayer Quiz REST API Endpoints ---

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_game(request):
    """
    Host creates a new game session with quiz data (from AI quiz generator)
    """
    quiz_data = request.data.get('quiz_data')
    if not quiz_data:
        return Response({'error': 'Quiz data required'}, status=400)
    game = GameSession.objects.create(
        host=request.user,
        quiz_data=quiz_data,
        status='WAITING',
        current_question=0,
        question_timer=30,
        question_start_time=None
    )
    Player.objects.create(user=request.user, game=game, is_host=True)
    return Response({'success': True, 'code': game.code, 'game_id': game.id})

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def join_game(request):
    """
    Player joins a game session using a 6-digit code
    """
    code = request.data.get('code')
    if not code:
        return Response({'error': 'Game code required'}, status=400)
    try:
        game = GameSession.objects.filter(code=code, status='WAITING').first()
        if not game:
            return Response({'detail': 'Game not found or already started.'}, status=404)

    except GameSession.DoesNotExist:
        return Response({'error': 'Game not found or not waiting for players'}, status=404)
    if game.status == 'FINISHED':
        return Response({'error': 'Game already finished'}, status=400)
    if Player.objects.filter(user=request.user, game=game).exists():
        return Response({'error': 'Already joined'}, status=400)
    Player.objects.create(user=request.user, game=game, is_host=False)
    return Response({'success': True, 'game_id': game.id})

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_game_info(request, code):
    game = get_object_or_404(GameSession, code=code)
    user = request.user

    player = Player.objects.get(user=user, game=game)
    question_index = game.current_question

    # Count how many have answered the current question
    answered_count = PlayerAnswer.objects.filter(game=game, question_index=question_index).count()
    total_players = Player.objects.filter(game=game).count()

    return Response({
        "code": game.code,
        "status": game.status,
        "timer": game.get_remaining_time(),
        "question_index": question_index,
        "total_questions": len(game.quiz_data['questions']),
        "current_question": game.quiz_data['questions'][question_index],
        "messages": list(game.messages.values('player__user__username', 'content', 'message_type', 'timestamp')),
        "answered_count": answered_count,         # ✅ for WaitingRoomPage
        "total_players": total_players            # ✅ for WaitingRoomPage
    })
    
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def start_game(request, code):
    try:
        game = GameSession.objects.get(code=code)
    except GameSession.DoesNotExist:
        return Response({'detail': 'Game not found.'}, status=404)

    if game.status != 'WAITING':
        return Response({'detail': 'Game already started or invalid state.'}, status=400)

    game.status = 'IN_PROGRESS'
    game.current_question = 0
    game.start_question()  # This sets question_start_time
    game.save()

    return Response({'detail': f'Game {code} started.', 'question': game.current_question}, status=200)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def submit_answer(request, code):
    """
    Submit an answer and get immediate feedback
    """
    game = get_object_or_404(GameSession, code=code)
    player = get_object_or_404(Player, user=request.user, game=game)
    
    if game.status != 'IN_PROGRESS':
        return Response({'error': 'Game is not in progress'}, status=400)
    
    question_index = request.data.get('question_index')
    answer = request.data.get('answer')
    time_taken = request.data.get('time_taken', 0)
    
    if question_index is None or answer is None:
        return Response({'error': 'Question index and answer required'}, status=400)
    
    success, result = player.submit_answer(question_index, answer, time_taken)
    if not success:
        return Response({'error': result}, status=400)
    
    # Create a message about the answer
    GameMessage.objects.create(
        game=game,
        player=player,
        content=f"answered {'correctly' if result['correct'] else 'incorrectly'}",
        message_type='ANSWER'
    )
    
    return Response(result)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def send_chat_message(request, code):
    """
    Send a chat message
    """
    game = get_object_or_404(GameSession, code=code)
    player = get_object_or_404(Player, user=request.user, game=game)
    content = request.data.get('content')
    
    if not content:
        return Response({'error': 'Message content required'}, status=400)
    
    message = GameMessage.objects.create(
        game=game,
        player=player,
        content=content,
        message_type='CHAT'
    )
    
    return Response({
        'success': True,
        'message': {
            'username': player.user.username,
            'content': message.content,
            'timestamp': message.timestamp,
            'type': message.message_type
        }
    })

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def advance_game(request, code):
    """
    Host advances the game to next question or leaderboard
    """
    game = get_object_or_404(GameSession, code=code)
    if game.host != request.user:
        return Response({'error': 'Only host can advance the game'}, status=403)
    
    if game.status == 'IN_PROGRESS':
        game.status = 'SHOWING_LEADERBOARD'
        game.save()
    elif game.status == 'SHOWING_LEADERBOARD':
        game.advance_question()
    
    return Response({'success': True})

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def join_game_with_code(request, code):
    user = request.user

    # Check if game with this code and status WAITING exists
    try:
        game = GameSession.objects.get(code=code, status='WAITING')
    except GameSession.DoesNotExist:
        return Response({'detail': 'Invalid or unavailable game code.'}, status=404)

    # Check if user already joined
    if Player.objects.filter(user=user, game=game).exists():
        return Response({'detail': 'You have already joined this game.'}, status=400)

    # Create new player entry
    Player.objects.create(user=user, game=game)

    return Response({'detail': f'Joined game {code} successfully.'}, status=200)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def finalize_question(request, code):
    game = get_object_or_404(GameSession, code=code)

    if game.status != 'IN_PROGRESS':
        return Response({'detail': 'Game is not in progress.'}, status=400)

    question_index = game.current_question
    correct_answer = game.quiz_data['questions'][question_index]['correctAnswer']

    # Count how many players selected each option
    option_counts = {opt: 0 for opt in ['A', 'B', 'C', 'D']}
    answers = PlayerAnswer.objects.filter(game=game, question_index=question_index)
    for ans in answers:
        option_counts[ans.selected_option] += 1

    # Save results to leaderboard_data field
    game.status = 'SHOWING_LEADERBOARD'
    game.leaderboard_data = {
        'question_index': question_index,
        'correct': correct_answer,
        'stats': option_counts
    }
    game.save()

    return Response({'detail': 'Leaderboard data generated.'})
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_leaderboard(request, code):
    game = get_object_or_404(GameSession, code=code)

    if game.status != 'SHOWING_LEADERBOARD':
        return Response({'detail': 'Leaderboard not available yet.'}, status=400)

    # Get all players sorted by score
    players = Player.objects.filter(game=game).order_by('-score')
    player_data = [{
        'username': p.user.username,
        'score': p.score,
        'last_correct': p.last_answer_correct,
        'avatar': getattr(p.user.userprofile, 'avatar_url', None)
    } for p in players]

    return Response({
        'question_index': game.leaderboard_data.get('question_index'),
        'correct': game.leaderboard_data.get('correct'),
        'stats': game.leaderboard_data.get('stats'),
        'players': player_data
    })


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def go_to_next_question(request, code):
    game = get_object_or_404(GameSession, code=code)

    if game.status != 'SHOWING_LEADERBOARD':
        return Response({'detail': 'Cannot move to next question yet.'}, status=400)

    game.advance_question()

    return Response({'detail': 'Moved to next question', 'status': game.status})

