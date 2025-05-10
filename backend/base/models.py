from django.db import models
from django.contrib.auth.models import User
import random
import string
from django.utils import timezone

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

# --- Multiplayer Quiz Models ---

def generate_game_code():
    return ''.join(random.choices(string.digits, k=6))

class GameSession(models.Model):
    code = models.CharField(max_length=6, unique=True, default=generate_game_code)
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_games')
    quiz_data = models.JSONField()  # Store quiz questions and metadata

    status = models.CharField(
        max_length=20,
        choices=[
            ('WAITING', 'Waiting for players'),
            ('STARTING', 'Game starting'),
            ('IN_PROGRESS', 'Game in progress'),
            ('SHOWING_LEADERBOARD', 'Showing leaderboard'),
            ('FINISHED', 'Game finished')
        ],
        default='WAITING'
    )

    current_question = models.IntegerField(default=0)
    question_start_time = models.DateTimeField(null=True, blank=True)
    question_timer = models.IntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    leaderboard_data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Game {self.code} (Host: {self.host.username})"

    def start_question(self):
        self.question_start_time = timezone.now()
        self.save()

    def get_remaining_time(self):
        if not self.question_start_time:
            return self.question_timer
        elapsed = (timezone.now() - self.question_start_time).total_seconds()
        return max(0, self.question_timer - int(elapsed))

    def advance_question(self):
        if self.current_question + 1 < len(self.quiz_data['questions']):
            self.current_question += 1
            self.status = 'IN_PROGRESS'
            self.start_question()
        else:
            self.status = 'FINISHED'
        self.save()

class Player(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game = models.ForeignKey(GameSession, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    streak = models.IntegerField(default=0)
    is_host = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    last_answer_time = models.DateTimeField(null=True, blank=True)
    last_answer_correct = models.BooleanField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} in {self.game.code}"

    def submit_answer(self, question_index, answer, time_taken):
        if question_index != self.game.current_question:
            return False, "Wrong question"

        question = self.game.quiz_data['questions'][question_index]
        is_correct = answer == question['correctAnswer']

        base_points = 1000 if is_correct else 0
        time_bonus = max(0, int((self.game.question_timer - time_taken) * 10))
        streak_bonus = self.streak * 100 if is_correct else 0
        points = base_points + time_bonus + streak_bonus

        self.score += points
        self.streak = self.streak + 1 if is_correct else 0
        self.last_answer_time = timezone.now()
        self.last_answer_correct = is_correct
        self.save()

        # NEW: store in PlayerAnswer
        PlayerAnswer.objects.create(
            player=self,
            game=self.game,
            question_index=question_index,
            selected_option=answer,
            is_correct=is_correct
        )

        return True, {
            'correct': is_correct,
            'points': points,
            'total_score': self.score,
            'streak': self.streak
        }

class PlayerAnswer(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    game = models.ForeignKey(GameSession, on_delete=models.CASCADE)
    question_index = models.IntegerField()
    selected_option = models.CharField(max_length=5)
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.player.user.username} - Q{self.question_index} - {self.selected_option}"

class GameMessage(models.Model):
    game = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='messages')
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(
        max_length=20,
        choices=[
            ('CHAT', 'Chat message'),
            ('JOIN', 'Player joined'),
            ('LEAVE', 'Player left'),
            ('ANSWER', 'Answer submitted'),
            ('SYSTEM', 'System message')
        ],
        default='CHAT'
    )

    def __str__(self):
        return f"{self.player.user.username}: {self.content[:20]}..."

    class Meta:
        ordering = ['timestamp']

class Quiz(models.Model):
    topic = models.CharField(max_length=255)
    num_questions = models.IntegerField()
    difficulty_level = models.CharField(max_length=10) # easy, medium, hard

    def __str__(self):
        return f"{self.topic} - {self.num_questions} questions"

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    question_text = models.TextField()
    options = models.JSONField()  # list of options
    correct_answer = models.CharField(max_length=255)

    def __str__(self):
        return self.question_text
