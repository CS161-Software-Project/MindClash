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
    best_streak = models.IntegerField(default=0)  # Best streak in this game
    current_streak = models.IntegerField(default=0)  # Current streak
    total_questions = models.IntegerField(default=0)  # Total questions answered
    correct_answers = models.IntegerField(default=0)  # Total correct answers
    average_time = models.FloatField(default=0.0)  # Average time to answer

    class Meta:
        unique_together = ['user', 'game']

    def __str__(self):
        return f"{self.user.username} in game {self.game.code}"

    def update_stats(self, is_correct, answer_time):
        """Update player statistics based on answer"""
        self.total_questions += 1
        if is_correct:
            self.correct_answers += 1
            self.current_streak += 1
            self.best_streak = max(self.best_streak, self.current_streak)
        else:
            self.current_streak = 0
        
        # Update average time
        if self.total_questions > 0:
            self.average_time = ((self.average_time * (self.total_questions - 1)) + answer_time) / self.total_questions
        
        self.save()
class ChatMessage(models.Model):
    game_room = models.ForeignKey(GameRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.message[:50]}"