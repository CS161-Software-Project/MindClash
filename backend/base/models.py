from django.db import models
from django.contrib.auth.models import User

from django.db import models

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
