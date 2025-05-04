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
from .models import UserProfile

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
