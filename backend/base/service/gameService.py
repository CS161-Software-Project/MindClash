from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from ..models import GameRoom, Player, Quiz, Question
import uuid
import random
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_game(request):
    """
    Create a new game room
    """
    try:
        # Check if quiz data is provided
        quiz_data = request.data.get('quiz_data')
        print(quiz_data)
        if not quiz_data:
            return Response({'error': 'Quiz data is required'}, status=400)
        
        # Create a new game
        game = GameRoom.objects.create(
            host=request.user,
            quiz_data=quiz_data
        )
        
        # Add the host as a player
        Player.objects.create(
            user=request.user,
            game=game,
            is_ready=True  # Host is automatically ready
        )
        
        return Response({
            'success': True,
            'message': 'Game created successfully',
            'game_code': game.code
        }, status=201)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_game(request):
    """
    Join an existing game using game code
    """
    try:
        game_code = request.data.get('game_code')
        if not game_code:
            return Response({'error': 'Game code is required'}, status=400)
        
        # Find the game
        try:
            game = GameRoom.objects.get(code=game_code)
        except GameRoom.DoesNotExist:
            return Response({'error': 'Game not found'}, status=404)
        
        # Check if game is joinable
        if game.status != 'waiting':
            return Response({'error': 'This game has already started or ended'}, status=400)
        
        # Check if the game is full
        if Player.objects.filter(game=game).count() >= game.max_players:
            return Response({'error': 'Game is full'}, status=400)
        
        # Check if player is already in the game
        if Player.objects.filter(user=request.user, game=game).exists():
            return Response({'error': 'You are already in this game'}, status=400)
        
        # Add player to the game
        Player.objects.create(
            user=request.user,
            game=game
        )
        
        return Response({
            'success': True,
            'message': 'Successfully joined the game',
            'game_code': game.code
        }, status=200)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_game_status(request, game_code):
    """
    Get the current status of a game
    """
    try:
        # Find the game
        try:
            game = GameRoom.objects.get(code=game_code)
        except GameRoom.DoesNotExist:
            return Response({'error': 'Game not found'}, status=404)
        
        players = Player.objects.filter(game=game).select_related('user')
        
        # Format player data
        player_data = []
        for player in players:
            player_data.append({
                'username': player.user.username,
                'score': player.score,
                'is_ready': player.is_ready,
                'has_answered': player.current_answer is not None
            })
        
        # Current question data
        current_question = None
        if game.status == 'in_progress' and game.current_question < len(game.quiz_data.get('questions', [])):
            question_data = game.quiz_data['questions'][game.current_question]
            current_question = {
                'question': question_data['question'],
                'options': question_data['options'],
                # Don't send correct_answer to client!
            }
        
        return Response({
            'success': True,
            'game': {
                'code': game.code,
                'status': game.status,
                'host': game.host.username,
                'current_question': game.current_question,
                'current_question_data': current_question,
                'players': player_data,
                'created_at': game.created_at,
                'started_at': game.started_at,
                'ended_at': game.ended_at
            }
        }, status=200)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_game(request, game_code):
    """
    Start a game (host only)
    """
    try:
        # Find the game
        try:
            game = GameRoom.objects.get(code=game_code)
        except GameRoom.DoesNotExist:
            return Response({'error': 'Game not found'}, status=404)
        
        # Check if user is the host
        if game.host != request.user:
            return Response({'error': 'Only the host can start the game'}, status=403)
        
        # Check if game can be started
        if game.status != 'waiting':
            return Response({'error': 'Game has already started or ended'}, status=400)
        
        # Start the game
        game.status = 'in_progress'
        game.started_at = timezone.now()
        game.save()
        
        return Response({
            'success': True,
            'message': 'Game started successfully'
        }, status=200)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_answer(request, game_code):
    """
    Submit an answer for the current question
    """
    try:
        # Get parameters
        answer = request.data.get('answer')
        answer_time = request.data.get('answer_time')
        
        if answer is None or answer_time is None:
            return Response({'error': 'Answer and answer time are required'}, status=400)
        
        # Find the game
        try:
            game = GameRoom.objects.get(code=game_code)
        except GameRoom.DoesNotExist:
            return Response({'error': 'Game not found'}, status=404)
        
        # Check if game is in progress
        if game.status != 'in_progress':
            return Response({'error': 'Game is not in progress'}, status=400)
        
        # Find the player
        try:
            player = Player.objects.get(user=request.user, game=game)
        except Player.DoesNotExist:
            return Response({'error': 'Player not found in this game'}, status=404)
        
        # Check if player has already answered
        if player.current_answer is not None:
            return Response({'error': 'You have already answered this question'}, status=400)
        
        # Update player answer
        player.current_answer = answer
        player.answer_time = answer_time
        
        # Calculate score if correct
        current_q_index = game.current_question
        if current_q_index < len(game.quiz_data.get('questions', [])):
            current_question = game.quiz_data['questions'][current_q_index]
            correct_answer = current_question.get('correct_answer')
            
            if answer == correct_answer:
                # Calculate score based on answer time (faster = more points)
                max_time = game.quiz_data.get('timePerQuestion', 30)
                time_factor = max(0, 1 - (float(answer_time) / max_time))
                points = int(1000 * time_factor)
                player.score += points
        
        player.save()
        
        return Response({
            'success': True,
            'message': 'Answer submitted successfully',
            'score': player.score
        }, status=200)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def next_question(request, game_code):
    """
    Move to the next question (host only)
    """
    try:
        # Find the game
        try:
            game = GameRoom.objects.get(code=game_code)
        except GameRoom.DoesNotExist:
            return Response({'error': 'Game not found'}, status=404)
        
        # Check if user is the host
        if game.host != request.user:
            return Response({'error': 'Only the host can move to the next question'}, status=403)
        
        # Check if game is in progress
        if game.status != 'in_progress':
            return Response({'error': 'Game is not in progress'}, status=400)
        
        # Reset all player answers for the next question
        Player.objects.filter(game=game).update(current_answer=None, answer_time=None)
        
        # Move to the next question
        total_questions = len(game.quiz_data.get('questions', []))
        game.current_question += 1
        
        # Check if the game is complete
        if game.current_question >= total_questions:
            game.status = 'completed'
            game.ended_at = timezone.now()
        
        game.save()
        
        return Response({
            'success': True,
            'message': 'Moved to next question',
            'current_question': game.current_question,
            'game_status': game.status
        }, status=200)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaderboard(request, game_code):
    """
    Get the leaderboard for a game
    """
    try:
        # Find the game
        try:
            game = GameRoom.objects.get(code=game_code)
        except GameRoom.DoesNotExist:
            return Response({'error': 'Game not found'}, status=404)
        
        # Get players sorted by score
        players = Player.objects.filter(game=game).select_related('user').order_by('-score')
        
        # Format player data
        leaderboard = []
        for player in players:
            leaderboard.append({
                'username': player.user.username,
                'score': player.score,
                'is_host': player.user == game.host
            })
        
        return Response({
            'success': True,
            'leaderboard': leaderboard
        }, status=200)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500) 