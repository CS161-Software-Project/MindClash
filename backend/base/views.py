import json
import os
from django.conf import settings
from groq import Groq
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema

# Initialize GROQ client
try:
    client = Groq(
        api_key=os.environ.get("GROQ_API_KEY") or settings.GROQ_API_KEY
    )
except Exception as e:
    print(f"Error initializing GROQ client: {e}")
    client = None
from rest_framework.authentication import TokenAuthentication
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import json
import os
from .models import UserProfile, GameRoom, Player,ChatMessage
from .serializers import GameRoomSerializer

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

# API - http://127.0.0.1:8000/api/game/{game_code}/status/ (GET request)
@swagger_auto_schema(
    method='get',
    responses={200: GameRoomSerializer}
)
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_game_status(request, game_code):
    """
    Get the current status of a game room, including player stats.
    """
    try:
        game = GameRoom.objects.get(code=game_code)
        players = Player.objects.filter(game=game).select_related('user')

        # Format player data with stats
        player_data = []
        for player in players:
            player_data.append({
                'username': player.user.username,
                'score': player.score,
                'is_ready': player.is_ready,
                'has_answered': player.current_answer is not None,
                'correct_answers': player.correct_answers,
                'current_streak': player.current_streak,
                'best_streak': player.best_streak,
                'average_time': round(player.average_time, 2),
                'total_questions': player.total_questions,
            })

        # Current question data
        current_question_data = None
        questions = game.quiz_data.get("questions", [])
        if game.status == 'in_progress' and game.current_question < len(questions):
            q = questions[game.current_question]
            current_question_data = {
                'question': q.get('question'),
                'options': q.get('options'),
            }

        return Response({
            'success': True,
            'game': {
                'code': game.code,
                'status': game.status,
                'host': game.host.username,
                'current_question': game.current_question,
                'current_question_data': current_question_data,
                'players': player_data,
                'created_at': game.created_at,
                'started_at': game.started_at,
                'ended_at': game.ended_at
            }
        })

    except GameRoom.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Game not found'
        }, status=404)

# API - http://127.0.0.1:8000/api/game/{game_code}/player/ready/ (POST request)
@swagger_auto_schema(
    method='post',
    responses={200: "Player ready status updated successfully"}
)
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def set_player_ready(request, game_code):
    """
    Set player's ready status in a game room.
    """
    try:
        game = GameRoom.objects.get(code=game_code)
        player = Player.objects.get(game=game, user=request.user)
        player.is_ready = request.data.get('is_ready', True)
        player.save()
        
        # Update game status if all players are ready
        if game.status == 'waiting':
            players = Player.objects.filter(game=game)
            if all(p.is_ready for p in players):
                game.status = 'ready_to_start'
                game.save()
        
        return Response({
            'success': True,
            'message': 'Ready status updated'
        })
    except GameRoom.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Game not found'
        }, status=404)
    except Player.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Player not found in game'
        }, status=404)

# API - http://127.0.0.1:8000/api/game/{game_code}/start/ (POST request)
@swagger_auto_schema(
    method='post',
    responses={200: "Game started successfully"}
)
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def start_game(request, game_code):
    """
    Start the game (only host can do this).
    """
    try:
        game = GameRoom.objects.get(code=game_code)
        if game.host != request.user:
            return Response({
                'success': False,
                'error': 'Only host can start the game'
            }, status=403)
            
        if game.status != 'ready_to_start':
            return Response({
                'success': False,
                'error': 'Game is not ready to start'
            }, status=400)
            
        game.status = 'in_progress'
        game.started_at = timezone.now()
        game.current_question = 0
        game.save()
        
        return Response({
            'success': True,
            'message': 'Game started'
        })
    except GameRoom.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Game not found'
        }, status=404)

# API - http://127.0.0.1:8000/api/generate-quiz/ (POST request)
@swagger_auto_schema(
    method='post', 
    request_body=quiz_generation_schema, 
    responses={200: "Quiz generated successfully", 400: "Invalid request", 500: "Quiz generation error"}
)
@api_view(['POST'])
def generate_quiz(request):
    """
    Endpoint to generate a quiz using GROQ AI.
    """
    if client is None:
        return Response({"error": "GROQ client is not properly configured"}, status=500)
        
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

# Example of the streaming version (for testing in the terminal)
def test_groq_streaming():
    """
    Test function for GROQ AI with streaming.
    This is not exposed via API but can be called for testing.
    """
    try:
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": "Create a quiz of 5 questions on harry potter with difficulty level medium\n "
                }
            ],
            temperature=1,
            max_completion_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )

        for chunk in completion:
            print(chunk.choices[0].delta.content or "", end="")
            
    except Exception as e:
        print(f"Error: {str(e)}")

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
    Update user profile information.
    """
    try:
        user = request.user
        profile = UserProfile.objects.get(user=user)
        
        # Update profile fields
        if 'first_name' in request.data:
            profile.first_name = request.data['first_name']
        if 'last_name' in request.data:
            profile.last_name = request.data['last_name']
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        if 'avatar_url' in request.data:
            profile.avatar_url = request.data['avatar_url']
            
        profile.save()
        
        # Update user's first and last name if provided
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']

        # Handle password update
        if 'currentPassword' in request.data and 'newPassword' in request.data:
            if not user.check_password(request.data['currentPassword']):
                return Response({
                    'success': False,
                    'message': 'Current password is incorrect'
                }, status=400)
            
            user.set_password(request.data['newPassword'])
            user.save()
            
        user.save()
        
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'profile': {
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'bio': profile.bio,
                'avatar_url': profile.avatar_url,
                'username': user.username
            }
        })
        
    except UserProfile.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Profile not found'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
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
    Get user profile information.
    """
    try:
        user = request.user
        profile = UserProfile.objects.get(user=user)

        # Fetch stats across all games
        player_entries = Player.objects.filter(user=user)
        total_correct = sum(p.correct_answers for p in player_entries)
        total_questions = sum(p.total_questions for p in player_entries)
        best_streak = max((p.best_streak for p in player_entries), default=0)

        # Compute global average time
        total_time = sum(p.average_time * p.total_questions for p in player_entries)
        average_time = (total_time / total_questions) if total_questions else 0.0
        
        return Response({
            'success': True,
            'profile': {
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'bio': profile.bio,
                'avatar_url': profile.avatar_url,
                'username': user.username,
                'correct_answers': total_correct,
                'total_questions': total_questions,
                'best_streak': best_streak,
                'average_time': round(average_time, 2),
            }
        })
        
    except UserProfile.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Profile not found'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=400)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_chat_message(request):
    pin = request.data.get("pin")
    message = request.data.get("message")

    try:
        room = GameRoom.objects.get(code=pin)
        chat = ChatMessage.objects.create(
            game_room=room,
            sender=request.user,
            message=message
        )
        return Response({"message": "Sent"})
    except GameRoom.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_chat_messages(request, pin):
    try:
        room = GameRoom.objects.get(code=pin)
        
        # Check if user is a player in this game
        if not room.players.filter(user=request.user).exists():
            return Response({"error": "You are not a player in this game"}, status=403)
            
        messages = ChatMessage.objects.filter(game_room=room).order_by("timestamp")
        return Response({
            "success": True,
            "messages": [{
                "id": m.id,
                "sender": m.sender.username,
                "message": m.message,
                "timestamp": m.timestamp
            } for m in messages]
        })
    except GameRoom.DoesNotExist:
        return Response({"error": "Game room not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_leaderboard(request, game_code):
    try:
        # Get the game room
        game_room = GameRoom.objects.get(pin=game_code)
        
        # Check if user is a player in this game
        if not game_room.players.filter(user=request.user).exists():
            return Response({"error": "You are not a player in this game"}, status=403)
        
        # Get all players in the game with their stats
        players = []
        for player in game_room.players.all():
            players.append({
                'user_id': player.user.id,
                'username': player.user.username,
                'score': player.score,
                'best_streak': player.best_streak,
                'correct_answers': player.correct_answers,
                'average_time': player.average_time
            })
        
        # Sort by score descending
        players = sorted(players, key=lambda x: x['score'], reverse=True)
        
        return Response({
            'success': True,
            'players': players,
            'game_title': game_room.quiz_data.get('title', 'Quiz Game') if game_room.quiz_data else 'Quiz Game'
        })
        
    except GameRoom.DoesNotExist:
        return Response({"error": "Game room not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def answer_distribution(request, pin):
    try:
        room = GameRoom.objects.get(code=pin)
        players = Player.objects.filter(game=room)

        # ✅ FIXED: Use the correct field name
        current_question_index = room.current_question

        # Safely extract question from quiz_data
        questions = room.quiz_data.get("questions", [])
        if current_question_index >= len(questions):
            return Response({"error": "Invalid question index"}, status=400)

        current_question = questions[current_question_index]
        options = current_question.get("options", [])
        correct_index = current_question.get("correct_answer")

        # Build distribution
        distribution = []
        for idx, option_text in enumerate(options):
            count = players.filter(current_answer=idx).count()
            distribution.append({
                "answer": option_text,
                "count": count
            })

        all_answered = all(p.current_answer is not None for p in players)
        correct_answer_text = options[correct_index] if all_answered else None

        return Response({
            "distribution": distribution,
            "correct_answer": correct_answer_text,
            "all_answered": all_answered
        })

    except GameRoom.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)