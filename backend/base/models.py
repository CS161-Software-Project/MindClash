from django.db import models
from django.contrib.auth.models import User
import uuid

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

# New models for multiplayer functionality
class GameRoom(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting for Players'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    code = models.CharField(max_length=6, unique=True, default='')
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_games')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    max_players = models.IntegerField(default=10)
    current_question = models.IntegerField(default=0)
    quiz_data = models.JSONField(default=dict)  # Store the quiz questions

    def __str__(self):
        return f"Game {self.code} by {self.host.username}"
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Generate a unique 6-character game code
            self.code = self.generate_unique_code()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_unique_code():
        code = str(uuid.uuid4())[:6].upper()
        while GameRoom.objects.filter(code=code).exists():
            code = str(uuid.uuid4())[:6].upper()
        return code

class Player(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game = models.ForeignKey(GameRoom, on_delete=models.CASCADE, related_name='players')
    score = models.IntegerField(default=0)
    is_ready = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    current_answer = models.IntegerField(null=True, blank=True)
    answer_time = models.FloatField(null=True, blank=True)  # Time taken to answer in seconds

    class Meta:
        unique_together = ['user', 'game']

    def __str__(self):
        return f"{self.user.username} in game {self.game.code}"
