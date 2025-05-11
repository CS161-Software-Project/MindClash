import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from .models import GameRoom, Player

class GameRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_pin = self.scope["url_route"]["kwargs"]["pin"]
        self.room_group_name = f"game_{self.room_pin}"
        self.user = self.scope["user"]

        # Add to room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Remove from room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Notify others that player left
        if not isinstance(self.user, AnonymousUser):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_message",
                    "data": {
                        "type": "player_left",
                        "player_id": self.user.id,
                        "username": self.user.username
                    }
                }
        )

    async def receive(self, text_data):
        try:
        data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "auth":
                # Handle authentication
                token = data.get("token")
                if token:
                    user = await self.get_user_from_token(token)
                    if user:
                        self.user = user
                        # Send auth success
                        await self.send(text_data=json.dumps({
                            "type": "auth_success",
                            "user": {
                                "id": user.id,
                                "username": user.username
                            }
                        }))
                        # Send current players
                        players = await self.get_room_players()
                        await self.send(text_data=json.dumps({
                            "type": "players_update",
                            "players": players
                        }))
                        # Notify others that player joined
                        await self.channel_layer.group_send(
                            self.room_group_name,
                            {
                                "type": "broadcast_message",
                                "data": {
                                    "type": "player_joined",
                                    "player": {
                                        "id": user.id,
                                        "username": user.username
                                    }
                                }
                            }
                        )
                    else:
                        await self.send(text_data=json.dumps({
                            "type": "auth_error",
                            "message": "Invalid token"
                        }))
            elif message_type == "chat":
                # Handle chat messages
                if not isinstance(self.user, AnonymousUser):
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "broadcast_message",
                            "data": {
                                "type": "chat",
                                "sender": self.user.username,
                                "message": data.get("message", "")
                            }
                        }
                    )
            else:
                # Broadcast other messages
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "broadcast_message",
                "data": data
            }
        )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid JSON"
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": str(e)
            }))

    async def broadcast_message(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            token = Token.objects.get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def get_room_players(self):
        try:
            room = GameRoom.objects.get(pin=self.room_pin)
            players = Player.objects.filter(game_room=room)
            return [{
                "id": player.user.id,
                "username": player.user.username,
                "avatar_url": player.avatar_url
            } for player in players]
        except GameRoom.DoesNotExist:
            return []
