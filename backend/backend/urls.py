from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),
    # Routing the urls to base urls
    path('', include('base.urls')),
]
