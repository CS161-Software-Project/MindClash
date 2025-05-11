from django.db import models
from django.contrib.auth.models import User
import random
import string

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class Quiz(models.Model):
    topic = models.CharField(max_length=255)
    num_questions = models.IntegerField()
    difficulty_level = models.CharField(max_length=10) # easy, medium, hard

    def __str__(self):
        return f"{self.topic} - {self.num_questions} questions"

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    question_text = models.TextField()
    options = models.JSONField() # list of options
    correct_answer = models.CharField(max_length=255)

    def __str__(self):
        return self.question_text

def generate_pin():
    return ''.join(random.choices(string.digits, k=6))

class GameRoom(models.Model):
    pin = models.CharField(max_length=6, unique=True, default=generate_pin)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_rooms')
    topic = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=50)
    question_count = models.IntegerField(default=5)
    quiz_data = models.JSONField()
    started = models.BooleanField(default=False)
    finished = models.BooleanField(default=False)
    current_question_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.topic} ({self.pin})"

class Player(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game_room = models.ForeignKey(GameRoom, on_delete=models.CASCADE, related_name='players')
    score = models.IntegerField(default=0)
    has_answered = models.BooleanField(default=False)
    avatar_url = models.URLField(default="https://api.dicebear.com/7.x/avataaars/svg?seed=default")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'game_room']

    def __str__(self):
        return f"{self.user.username} in {self.game_room.pin}"

class ChatMessage(models.Model):
    game_room = models.ForeignKey(GameRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.message[:50]}"