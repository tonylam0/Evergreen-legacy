from django.contrib import admin
from django.urls import path, include
from api.views import SubmitVideoView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('dj_rest_auth.urls')),  # Provides basic API endpoints: login, logout, password reset, etc.
    path('api-auth/registration/', include('dj_rest_auth.registration.urls')),  # Requires allauth
    path('api/submit-video/', SubmitVideoView.as_view(), name='submit-video'),  # Endpoint for submitting YouTube videos
]
