from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render, redirect
from django.http import HttpResponse

# API - http://127.0.0.1:8000/home/  (GET request)
@api_view(['GET'])
def home(request):
    return render(request, 'base/home.html', {})