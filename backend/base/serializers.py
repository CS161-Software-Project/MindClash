from rest_framework import serializers
from .models import GameRoom, Player

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['user_id', 'score', 'is_ready', 'has_answered']

class GameRoomSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    
    class Meta:
        model = GameRoom
        fields = [
            'code', 'status', 'host_id', 'current_question', 'current_question_data',
            'players', 'created_at', 'started_at', 'ended_at'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Transform host to use user_id instead of username
        data['host_id'] = instance.host.id
        return data
