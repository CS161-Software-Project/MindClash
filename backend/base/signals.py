# For User Authentication using token

from django.contrib.auth.models import User  
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token
from .models import UserProfile

@receiver(post_save, sender=User)  
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance=None, created=False, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)