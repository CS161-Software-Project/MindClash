from django.conf import settings
from groq import Groq
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import json
import re
import os
from .models import UserProfile, GameRoom, Player, ChatMessage
from .models import generate_pin
from .serializers import GameRoomSerializer, PlayerSerializer

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
        
        return Response({
            'success': True,
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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_game_room(request):
    topic = request.data.get("topic")
    difficulty = request.data.get("difficulty", "medium")
    question_count = request.data.get("count", 5)

    prompt = f"Generate a {difficulty} level quiz with {question_count} questions on the topic '{topic}'. Format the response as JSON with each question having 'question', 'options', and 'answer'."

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024
        )

        content = response.choices[0].message.content
        print("GROQ response:", content)

        # Try to extract JSON inside triple backticks if it exists
        match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
        if match:
            cleaned_json = match.group(1)
            loaded = json.loads(cleaned_json)
            if isinstance(loaded, dict) and "quiz" in loaded:
                quiz_json = loaded["quiz"]
            elif isinstance(loaded, list):
                quiz_json = loaded
            else:
                raise ValueError("Parsed JSON structure is invalid")
        else:
            raise ValueError("No valid JSON block found in GROQ response")

        if not topic:
            topic = "AI-generated"

    except Exception as e:
        return Response({"error": f"Failed to generate quiz: {str(e)}"}, status=500)

    game_room = GameRoom.objects.create(
        creator=request.user,
        topic=topic,
        difficulty=difficulty,
        question_count=question_count,
        quiz_data=quiz_json
    )

    # Create a Player record for the creator
    Player.objects.create(
        user=request.user,
        game_room=game_room,
        avatar_url=request.data.get("avatar_url", "https://api.dicebear.com/7.x/avataaars/svg?seed=default")
    )

    return Response({"pin": game_room.pin, "message": "Game created successfully"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_game_room(request):
    pin = request.data.get("pin")
    avatar_url = request.data.get("avatar_url")

    try:
        room = GameRoom.objects.get(pin=pin)
        Player.objects.create(user=request.user, game_room=room, avatar_url=avatar_url)
        return Response({"message": "Joined game", "room": room.pin})
    except GameRoom.DoesNotExist:
        return Response({"error": "Invalid PIN"}, status=404)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_game(request):
    pin = request.data.get("pin")
    try:
        room = GameRoom.objects.get(pin=pin, creator=request.user)
        if not room.started:
            room.started = True
            room.current_question_index = 0
            room.save()
            # Reset all players' answered status
            for player in room.players.all():
                player.has_answered = False
                player.save()
        return Response({
            "message": "Game started",
            "current_question": room.quiz_data[0] if room.quiz_data else None
        })
    except GameRoom.DoesNotExist:
        return Response({"error": "Room not found or unauthorized"}, status=403)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_answer(request):
    pin = request.data.get("pin")
    selected_option = request.data.get("answer")

    try:
        room = GameRoom.objects.get(pin=pin)
        player = Player.objects.get(user=request.user, game_room=room)

        if player.has_answered:
            return Response({"message": "Already answered"})

        index = room.current_question_index
        question = room.quiz_data[index]
        correct = question["options"][question["answer"]]  # Get the actual answer text

        # Update score if answer is correct
        if selected_option == correct:
            # Get current score and add 100
            current_score = player.score or 0
            player.score = current_score + 100
            print(f"Correct answer! Updated score for {player.user.username} from {current_score} to {player.score}")

        player.has_answered = True
        player.selected_answer = selected_option
        player.save()

        # Check if all players have answered
        all_answered = all(p.has_answered for p in room.players.all())

        # Mark game as finished if this is the last question
        if room.current_question_index >= room.question_count - 1:
            room.finished = True
            room.save()

        # Get updated player list with current scores
        players = Player.objects.filter(game_room=room)
        players_list = [{
            "id": p.id,
            "username": p.user.username,
            "score": p.score or 0,  # Ensure score is never null
            "has_answered": p.has_answered
        } for p in players]

        # Get answer distribution
        distribution = []
        for option in question["options"]:
            count = players.filter(selected_answer=option).count()
            distribution.append({
                "answer": option,
                "count": count
            })

        return Response({
            "all_answered": all_answered,
            "finished": room.finished,
            "score": player.score or 0,  # Ensure score is never null
            "player_id": player.id,
            "players": players_list,
            "distribution": distribution,
            "correct_answer": correct if all_answered else None,
            "current_answer": selected_option  # Send back the selected answer
        })
    except (GameRoom.DoesNotExist, Player.DoesNotExist):
        return Response({"error": "Invalid game or player"}, status=404)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leaderboard(request, pin):
    try:
        room = GameRoom.objects.get(pin=pin)
        players = Player.objects.filter(game_room=room).order_by("-score")
        
        # Check if all players have answered
        all_answered = all(p.has_answered for p in players)
        
        return Response({
            "leaderboard": [
                {
                    "id": player.id,
                    "username": player.user.username,
                    "score": player.score,
                    "has_answered": player.has_answered
                } for player in players
            ],
            "all_answered": all_answered,
            "current_question_index": room.current_question_index,
            "question_count": room.question_count,
            "finished": room.finished
        })
    except GameRoom.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def next_question(request):
    pin = request.data.get("pin")
    print(f"Received next_question request for room {pin}")  # Log request
    try:
        room = GameRoom.objects.get(pin=pin)
        print(f"Found room: {room.pin}, creator: {room.creator.id}, current user: {request.user.id}")  # Log room details
        
        # Only creator can move to next question
        if request.user != room.creator:
            print(f"User {request.user.id} is not the creator {room.creator.id}")  # Log unauthorized attempt
            return Response({"error": "Only creator can move to next question"}, status=403)
            
        # Check if all players have answered
        all_answered = all(p.has_answered for p in room.players.all())
        print(f"All players answered: {all_answered}")  # Log answer status
        
        if not all_answered:
            print("Not all players have answered yet")  # Log incomplete answers
            return Response({"error": "Not all players have answered"}, status=400)
            
        # Move to next question
        room.current_question_index += 1
        print(f"New question index: {room.current_question_index}")  # Log new index

        # Check if game is finished
        if room.current_question_index >= room.question_count:
            print("Game finished")  # Log game finished
            room.finished = True
            room.save()
            return Response({
                "message": "Game finished",
                "finished": True,
                "current_question": None
            })

        # Reset only has_answered and selected_answer, preserve scores
        Player.objects.filter(game_room=room).update(has_answered=False, selected_answer=None)
        print("Reset all players' answered status and selected answers")  # Log reset
        
        # Get the next question
        next_question = room.quiz_data[room.current_question_index]
        print(f"Next question: {next_question}")  # Log next question
        
        # Save room state
        room.save()
        print("Room state saved")  # Log save

        # Get updated player list with preserved scores
        players = Player.objects.filter(game_room=room)
        players_list = [{
            "id": p.id,
            "username": p.user.username,
            "avatar_url": p.avatar_url,
            "score": p.score,
            "has_answered": p.has_answered
        } for p in players]

        response_data = {
            "message": "Next question loaded",
            "current_question": next_question,
            "current_question_index": room.current_question_index,
            "question_count": room.question_count,
            "finished": room.finished,
            "all_answered": False,  # Reset this since we're starting a new question
            "players": players_list,
            "started": room.started,
            "quiz_data": room.quiz_data,
            "creator": room.creator.id,
            "topic": room.topic,
            "difficulty": room.difficulty
        }
        print(f"Response data: {response_data}")  # Log response data
        return Response(response_data)
    except GameRoom.DoesNotExist:
        print(f"Room {pin} not found")  # Log room not found
        return Response({"error": "Room not found"}, status=404)
    except Exception as e:
        print(f"Error in next_question: {str(e)}")  # Log any other errors
        return Response({"error": str(e)}, status=500)
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_chat_message(request):
    pin = request.data.get("pin")
    message = request.data.get("message")

    try:
        room = GameRoom.objects.get(pin=pin)
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
        room = GameRoom.objects.get(pin=pin)
        messages = ChatMessage.objects.filter(game_room=room).order_by("timestamp")
        return Response({"messages": [
            {
                "sender": m.sender.username,
                "message": m.message,
                "timestamp": m.timestamp
            } for m in messages
        ]})
    except GameRoom.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_game_room(request, pin):
    try:
        room = GameRoom.objects.get(pin=pin)
        player = Player.objects.get(user=request.user, game_room=room)
        
        # Get all players in the room
        players = Player.objects.filter(game_room=room)
        players_list = [{
            "id": p.id,
            "username": p.user.username,
            "avatar_url": p.avatar_url,
            "score": p.score,
            "has_answered": p.has_answered
        } for p in players]
        
        # Check if all players have answered
        all_answered = all(p.has_answered for p in players)
        
        # Get current question data
        current_question = None
        if room.started and not room.finished and room.quiz_data:
            try:
                current_question = room.quiz_data[room.current_question_index]
            except (IndexError, TypeError):
                current_question = None
        
        data = {
            "creator": room.creator.id,
            "topic": room.topic,
            "difficulty": room.difficulty,
            "question_count": room.question_count,
            "started": room.started,
            "finished": room.finished,
            "current_question_index": room.current_question_index,
            "current_question": current_question,
            "quiz_data": room.quiz_data,
            "has_answered": player.has_answered,
            "score": player.score,
            "players": players_list,
            "all_answered": all_answered,
            "current_user_id": request.user.id
        }
        return Response(data)
    except GameRoom.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)
    except Player.DoesNotExist:
        return Response({"error": "Player not found in game"}, status=404)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def answer_distribution(request, pin):
    try:
        room = GameRoom.objects.get(pin=pin)
        players = Player.objects.filter(game_room=room)
        
        # Get current question
        current_question = room.quiz_data[room.current_question_index]
        options = current_question["options"]
        
        # Count answers for each option
        distribution = []
        for option in options:
            count = players.filter(selected_answer=option).count()
            distribution.append({
                "answer": option,
                "count": count
            })
        
        # Only send correct answer if ALL players have answered
        all_answered = all(p.has_answered for p in players)
        
        return Response({
            "distribution": distribution,
            "correct_answer": current_question["answer"] if all_answered else None,
            "all_answered": all_answered
        })
    except GameRoom.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)