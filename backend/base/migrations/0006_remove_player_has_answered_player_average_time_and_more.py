# Generated by Django 4.2.20 on 2025-05-12 20:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0005_player_best_streak_player_current_streak_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='player',
            name='has_answered',
        ),
        migrations.AddField(
            model_name='player',
            name='average_time',
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name='player',
            name='correct_answers',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='player',
            name='total_questions',
            field=models.IntegerField(default=0),
        ),
    ]
