from .views import SubmitVideoView, CreateReviewView
from django.urls import path


urlpatterns = [
    path('submit-video/', SubmitVideoView.as_view(), name='submit-video'),  # Endpoint for submitting YouTube videos
    path('create-review/', CreateReviewView.as_view(), name='create-review')  # Endpoint for creating reviews
]
