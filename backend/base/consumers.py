import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import GameRoom, Player
from django.utils import timezone
import asyncio

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_code = self.scope['url_route']['kwargs']['game_code']
        self.game_group_name = f'game_{self.game_code}'
        
        # Get user ID from query string
        query_string = self.scope.get('query_string', b'').decode()
        query_params = {}
        for param in query_string.split('&'):
            if '=' in param:
                key, value = param.split('=')
                query_params[key] = value
        
        # Store user ID for later use
        self.user_id = query_params.get('user_id')
        
        # Join room group
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial game state to the client
        game = await self.get_game()
        if game:
            game_state = await self.get_game_state()
            await self.send(text_data=json.dumps({
                'type': 'game_state',
                'game': game_state
            }))
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        
        # Check the message type
        if 'type' not in text_data_json:
            return
        
        message_type = text_data_json['type']
        
        if message_type == 'player_ready':
            # Update player ready status
            user_id = text_data_json.get('user_id', self.user_id)
            is_ready = text_data_json.get('is_ready', True)
            
            await self.update_player_ready_by_id(user_id, is_ready)
            game_state = await self.get_game_state()
            
            # Send updated game state to group
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    'type': 'game_state_update',
                    'game': game_state
                }
            )
            
        elif message_type == 'start_game':
            # Start the game (only host can do this)
            username = text_data_json.get('username', self.username)
            game = await self.get_game()
            host_user = await self.get_user_by_username(username)
            
            if game and host_user and game.host == host_user:
                await self.start_game()
                game_state = await self.get_game_state()
                
                # Send game started message to group
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'game_started',
                        'game': game_state
                    }
                )
                
        elif message_type == 'next_question':
            # Move to next question (only host can do this)
            username = text_data_json.get('username', self.username)
            game = await self.get_game()
            host_user = await self.get_user_by_username(username)
            
            if game and host_user and game.host == host_user:
                await self.next_question()
                game_state = await self.get_game_state()
                
                # Send next question message to group
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'next_question',
                        'game': game_state
                    }
                )
                
        elif message_type == 'submit_answer':
            # Submit player answer
            username = text_data_json.get('username', self.username)
            answer = text_data_json.get('answer')
            answer_time = text_data_json.get('answer_time')
            
            if username and answer is not None:
                # Update the player's answer and calculate score
                player = await self.update_player_answer_by_username(username, answer, answer_time)
                
                if player:
                    # Get the updated game state with scores
                    game_state = await self.get_game_state()
                    
                    # Send both the answer submission and updated game state
                    await self.channel_layer.group_send(
                        self.game_group_name,
                        [
                            {
                                'type': 'answer_submitted',
                                'player': player.user.username,
                                'answer': answer,
                                'is_correct': player.current_answer == answer  # Add this if needed
                            },
                            {
                                'type': 'game_state_update',
                                'game': game_state
                            }
                        ]
                    )
    
    # Handlers for different message types to send to WebSocket
    async def game_state_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_state_update',
            'game': event['game']
        }))
    
    async def game_started(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_started',
            'game': event['game']
        }))
    
    async def next_question(self, event):
        await self.send(text_data=json.dumps({
            'type': 'next_question',
            'game': event['game']
        }))
    
    async def answer_submitted(self, event):
        # If this is a game state update, send it directly
        if 'game' in event:
            await self.send(text_data=json.dumps({
                'type': 'game_state_update',
                'game': event['game']
            }))
        # Otherwise, send the answer submission
        else:
            await self.send(text_data=json.dumps({
                'type': 'answer_submitted',
                'player': event['player'],
                'answer': event['answer'],
                'is_correct': event.get('is_correct', False)
            }))
    
    # Database access methods
    @database_sync_to_async
    def get_game(self):
        try:
            return GameRoom.objects.get(code=self.game_code)
        except GameRoom.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_game_state(self):
        try:
            game = GameRoom.objects.get(code=self.game_code)
            players = Player.objects.filter(game=game).select_related('user')
            
            # Format the data for the frontend
            player_data = []
            for player in players:
                player_data.append({
                    'username': player.user.username,
                    'score': player.score,
                    'is_ready': player.is_ready,
                    'has_answered': player.current_answer is not None
                })
            
            # Return game state with current question
            return {
                'code': game.code,
                'status': game.status,
                'host': game.host.username,
                'current_question': game.current_question,
                'players': player_data,
                'quiz_data': game.quiz_data
            }
        except GameRoom.DoesNotExist:
            return None
    
    @database_sync_to_async
    def update_player_ready(self, user_id, is_ready):
        try:
            game = GameRoom.objects.get(code=self.game_code)
            user = User.objects.get(id=user_id)
            player, created = Player.objects.get_or_create(
                user=user,
                game=game,
                defaults={'is_ready': is_ready}
            )
            
            if not created:
                player.is_ready = is_ready
                player.save()
            
            return player
        except (GameRoom.DoesNotExist, User.DoesNotExist):
            return None
    
    @database_sync_to_async
    def start_game(self):
        try:
            game = GameRoom.objects.get(code=self.game_code)
            if game.status == 'waiting':
                game.status = 'in_progress'
                game.started_at = timezone.now()
                game.current_question = 0
                game.save()
            return game
        except GameRoom.DoesNotExist:
            return None
    
    @database_sync_to_async
    def next_question(self):
        try:
            game = GameRoom.objects.get(code=self.game_code)
            if game.status == 'in_progress':
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
            return game
        except GameRoom.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_user_by_username(self, username):
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None
            
    @database_sync_to_async
    def update_player_ready_by_username(self, username, is_ready):
        try:
            user = User.objects.get(username=username)
            game = GameRoom.objects.get(code=self.game_code)
            
            player, created = Player.objects.get_or_create(
                user=user,
                game=game,
                defaults={'is_ready': is_ready}
            )
            
            if not created:
                player.is_ready = is_ready
                player.save()
            
            return player
        except (GameRoom.DoesNotExist, User.DoesNotExist):
            return None
    
    @database_sync_to_async
    def update_player_answer_by_username(self, username, answer, answer_time):
        try:
            game = GameRoom.objects.get(code=self.game_code)
            user = User.objects.get(username=username)
            player = Player.objects.get(user=user, game=game)
            
            # Only update if the player hasn't answered yet
            if player.current_answer is None:
                player.current_answer = answer
                player.answer_time = answer_time
                
                # Update score if correct
                print(f"\n--- WEBSOCKET SCORE DEBUG ---")
                print(f"Player: {username}")
                print(f"Game status: {game.status}")
                print(f"Has quiz data: {bool(game.quiz_data)}")
                
                if game.status == 'in_progress' and game.quiz_data:
                    current_q_index = game.current_question
                    questions = game.quiz_data.get('questions', [])
                    print(f"Current question index: {current_q_index}, Total questions: {len(questions)}")
                    
                    if current_q_index < len(questions):
                        current_question = questions[current_q_index]
                        print(f"Current question data: {current_question}")
                        
                        # Handle both string and integer correct answers
                        correct_answer = current_question.get('correct_answer')
                        if correct_answer is None:
                            # Try alternative field names
                            correct_answer = current_question.get('correctAnswer')
                        
                        # Convert to int if it's a string number
                        if isinstance(correct_answer, str) and correct_answer.isdigit():
                            correct_answer = int(correct_answer)
                        
                        print(f"Correct answer: {correct_answer} (type: {type(correct_answer).__name__})")
                        print(f"Player's answer: {answer} (type: {type(answer).__name__})")
                        
                        # Convert answer to int for comparison if needed
                        try:
                            player_answer = int(answer) if answer is not None else None
                        except (ValueError, TypeError):
                            player_answer = answer
                            
                        print(f"Player answer (converted): {player_answer} (type: {type(player_answer).__name__})")
                        
                        if correct_answer is not None and player_answer is not None and player_answer == correct_answer:
                            # Calculate score based on answer time (faster = more points)
                            max_time = game.quiz_data.get('timePerQuestion', 30)
                            # Ensure answer_time is not None and is a number
                            answer_time_float = float(answer_time) if answer_time is not None else max_time
                            # Calculate time factor (1.0 for instant answer, decreasing to 0.1 for last second)
                            time_factor = max(0.1, 1.0 - (answer_time_float / max_time) * 0.9)
                            # Base points per question (1000) multiplied by time factor
                            points = int(1000 * time_factor)
                            print(f"Points calculation - time: {answer_time_float:.2f}s, factor: {time_factor:.2f}, points: {points}")
                            print(f"Previous score: {player.score}")
                            player.score = (player.score or 0) + points
                            print(f"New score for {username}: {player.score}")
                        else:
                            print(f"No points awarded. Correct: {correct_answer}, Player: {player_answer}")
                
                player.save()
            
            return player
        except Exception as e:
            print(f"Error in update_player_answer_by_username: {str(e)}")
            return None
    
    @database_sync_to_async
    def update_player_answer(self, user_id, answer, answer_time):
        try:
            game = GameRoom.objects.get(code=self.game_code)
            user = User.objects.get(id=user_id)
            player = Player.objects.get(user=user, game=game)
            
            # Only update if the player hasn't answered yet
            if player.current_answer is None:
                # Convert answer to number before saving to database
                player_answer_num = None
                if answer is not None:
                    if isinstance(answer, str):
                        if answer.isdigit():
                            player_answer_num = int(answer)
                        elif answer.isalpha() and len(answer) == 1:
                            # Convert letter to index (A=0, B=1, etc.)
                            player_answer_num = ord(answer.upper()) - ord('A')
                    elif isinstance(answer, (int, float)):
                        player_answer_num = int(answer)
                
                player.current_answer = player_answer_num
                player.answer_time = answer_time
                
                # Update score if correct
                if game.status == 'in_progress' and game.quiz_data:
                    current_q_index = game.current_question
                    questions = game.quiz_data.get('questions', [])
                    
                    if current_q_index < len(questions):
                        current_question = questions[current_q_index]
                        
                        # Handle both string and integer correct answers
                        correct_answer = current_question.get('correct_answer')
                        if correct_answer is None:
                            # Try alternative field names
                            correct_answer = current_question.get('correctAnswer')
                        
                        # Convert to int if it's a string number or letter
                        if isinstance(correct_answer, str):
                            if correct_answer.isdigit():
                                correct_answer = int(correct_answer)
                            elif correct_answer.isalpha() and len(correct_answer) == 1:
                                correct_answer = ord(correct_answer.upper()) - ord('A')
                        
                        if player_answer_num is not None and correct_answer is not None and player_answer_num == correct_answer:
                            # Calculate score based on answer time (faster = more points)
                            max_time = game.quiz_data.get('timePerQuestion', 30)
                            answer_time_float = float(answer_time) if answer_time is not None else max_time
                            time_factor = max(0.1, 1.0 - (answer_time_float / max_time) * 0.9)
                            points = int(1000 * time_factor)
                            player.score = (player.score or 0) + points
                
                player.save()
            
            return player
        except (GameRoom.DoesNotExist, User.DoesNotExist, Player.DoesNotExist):
            return None 