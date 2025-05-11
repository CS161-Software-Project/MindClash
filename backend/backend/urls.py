from django.contrib import admin
from django.urls import path, include
from base.swagger import schema_view

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Swagger API endpoint
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    
    # User-facing pages (no prefix)
    path('', include('base.public_urls')),

    # API-only endpoints
    path('', include('base.api_urls')),
]
