from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('dj_rest_auth.urls')),  # Provides basic user account endpoints: login, logout, password reset, etc.
    path('api-auth/registration/', include('dj_rest_auth.registration.urls')),  # Independent from api-auth endpoint & requires allauth
    path('accounts/', include('allauth.urls')),  # Social login (Google, Apple, etc.)
    path('api/', include('api.urls')),  # Include URLs from the api app
]
