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
                player = await self.update_player_answer_by_username(username, answer, answer_time)
                
                if player:
                    # Send answer submitted message to group
                    await self.channel_layer.group_send(
                        self.game_group_name,
                        {
                            'type': 'answer_submitted',
                            'player': player.user.username,
                            'answer': answer
                        }
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
        await self.send(text_data=json.dumps({
            'type': 'answer_submitted',
            'player': event['player'],
            'answer': event['answer']
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
                if game.status == 'in_progress':
                    current_q_index = game.current_question
                    if current_q_index < len(game.quiz_data.get('questions', [])):
                        current_question = game.quiz_data['questions'][current_q_index]
                        correct_answer = current_question.get('correct_answer')
                        
                        if answer == correct_answer:
                            # Calculate score based on answer time (faster = more points)
                            # For example, max 1000 points, decreasing with time
                            max_time = game.quiz_data.get('timePerQuestion', 30)
                            time_factor = max(0, 1 - (answer_time / max_time))
                            points = int(1000 * time_factor)
                            player.score += points
                
                player.save()
            
            return player
        except (GameRoom.DoesNotExist, User.DoesNotExist, Player.DoesNotExist):
            return None
    
    @database_sync_to_async
    def update_player_answer(self, user_id, answer, answer_time):
        try:
            game = GameRoom.objects.get(code=self.game_code)
            user = User.objects.get(id=user_id)
            player = Player.objects.get(user=user, game=game)
            
            # Only update if the player hasn't answered yet
            if player.current_answer is None:
                player.current_answer = answer
                player.answer_time = answer_time
                
                # Update score if correct
                if game.status == 'in_progress':
                    current_q_index = game.current_question
                    if current_q_index < len(game.quiz_data.get('questions', [])):
                        current_question = game.quiz_data['questions'][current_q_index]
                        correct_answer = current_question.get('correct_answer')
                        
                        if answer == correct_answer:
                            # Calculate score based on answer time (faster = more points)
                            # For example, max 1000 points, decreasing with time
                            max_time = game.quiz_data.get('timePerQuestion', 30)
                            time_factor = max(0, 1 - (answer_time / max_time))
                            points = int(1000 * time_factor)
                            player.score += points
                
                player.save()
            
            return player
        except (GameRoom.DoesNotExist, User.DoesNotExist, Player.DoesNotExist):
            return None 