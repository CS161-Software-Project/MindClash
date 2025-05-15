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
    Get the current status of a game room, including player stats.
    """
    try:
        game = GameRoom.objects.get(code=game_code)
        players = Player.objects.filter(game=game).select_related('user')

        # Format player data with full stats
        player_data = []
        for player in players:
            player_data.append({
                'username': player.user.username,
                'score': player.score,
                'is_ready': player.is_ready,
                'has_answered': player.current_answer is not None,
                'is_host': player.user == game.host,
                'correct_answers': player.correct_answers,
                'current_streak': player.current_streak,
                'best_streak': player.best_streak,
                'average_time': round(player.average_time, 2),
                'total_questions': player.total_questions,
            })

        # Extract current question if valid
        current_question_data = None
        questions = game.quiz_data.get("questions", [])
        if game.status == 'in_progress' and game.current_question < len(questions):
            q = questions[game.current_question]
            current_question_data = {
                'question': q.get('question'),
                'options': q.get('options')
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
        
        print(f"[BACKEND] Received answer submission: answer={answer}, answer_time={answer_time}")
        
        if answer is None or answer_time is None:
            error_msg = 'Answer and answer time are required'
            print(f"[BACKEND] {error_msg}")
            return Response({'error': error_msg}, status=400)
        
        # Find the game
        try:
            game = GameRoom.objects.get(code=game_code)
            print(f"[BACKEND] Found game: {game_code}, status={game.status}, current_question={game.current_question}")
        except GameRoom.DoesNotExist:
            error_msg = f'Game not found: {game_code}'
            print(f"[BACKEND] {error_msg}")
            return Response({'error': error_msg}, status=404)
        
        # Check if the game is in progress
        if game.status != 'in_progress':
            error_msg = f'Game is not in progress. Current status: {game.status}'
            print(f"[BACKEND] {error_msg}")
            return Response({'error': error_msg}, status=400)
        
        # Get or create player
        player, created = Player.objects.get_or_create(
            user=request.user,
            game=game,
            defaults={'score': 0}
        )
        
        print(f"[BACKEND] Player {request.user.username} (existing: {not created}) - current score: {player.score}")
        
        # Check if player has already answered
        if player.current_answer is not None:
            print(f"[BACKEND] Player {request.user.username} has already answered: {player.current_answer}")
            return Response({
                'success': True,
                'message': 'You have already submitted an answer',
                'score': player.score,
                'correct': player.current_answer == answer
            })
        
        # Record the answer
        player.current_answer = answer
        
        try:
            # Get current question data with error handling
            questions = game.quiz_data.get('questions', [])
            if not questions:
                raise IndexError("No questions in quiz data")
            
            if game.current_question >= len(questions):
                raise IndexError("Current question index out of range")
                
            current_question = questions[game.current_question]
            
            # Check for both 'correct_answer' and 'correctAnswer' (case-sensitive)
            if 'correct_answer' not in current_question:
                # Check for 'correctAnswer' (capital A) which comes from the AI generator
                if 'correctAnswer' in current_question:
                    # Convert letter answer (A, B, C, D) to index (0, 1, 2, 3)
                    correct_letter = current_question['correctAnswer'].upper()
                    if correct_letter in ['A', 'B', 'C', 'D']:
                        current_question['correct_answer'] = ord(correct_letter) - ord('A')
                # Check for 'correct' (alternative format)
                elif 'correct' in current_question:
                    current_question['correct_answer'] = current_question['correct']
                # Try to find correct answer in options if not directly available
                elif 'options' in current_question and isinstance(current_question['options'], list):
                    for i, option in enumerate(current_question['options']):
                        if isinstance(option, dict) and option.get('isCorrect', False):
                            current_question['correct_answer'] = i
                            break
            
            # If still no correct_answer, default to 0 (first option)
            if 'correct_answer' not in current_question:
                current_question['correct_answer'] = 0
            
            correct_answer = current_question['correct_answer']
            is_correct = answer == correct_answer
            
            # Update score if correct
            if is_correct:
                max_time = game.quiz_data.get('timePerQuestion', 30)
                time_factor = max(0, 1 - (float(answer_time) / max_time))
                points = int(1000 * time_factor)
                player.score += points
        
        except (IndexError, KeyError) as e:
            return Response({
                'success': False,
                'error': 'Error processing question data',
                'details': str(e)
            }, status=500)
        print(f"[BACKEND] Stats updated: correct={player.correct_answers}, streak={player.current_streak}")

        player.update_stats(is_correct, float(answer_time))
        print(f"[BACKEND] Stats updated: correct={player.correct_answers}, streak={player.current_streak}")

            
        # Save player and game states
        player.save()
        game.save()
        print(player)
        
        return Response({
            'success': True,
            'message': 'Answer submitted successfully',
            'is_correct': is_correct,
            'score': player.score,
            'correct_answer': correct_answer
        }, status=200)
            
    except Exception as e:
        error_msg = f'Error in submit_answer: {str(e)}'
        print(f"[BACKEND] {error_msg}")
        import traceback
        traceback.print_exc()
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