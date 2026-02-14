from .views import SubmitVideoView, CreateReviewView, ListReviewView, ReadReviewView, EditReviewView, DeleteReviewView, video_list, VideoView, CustomTokenObtainView
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('submit-video/', SubmitVideoView.as_view(), name='submit-video'), 
    path('create-review/', CreateReviewView.as_view(), name='create-review'),
    path('reviews/video/<str:video_id>/', ListReviewView.as_view(), name='review-list-by-video'), 
    path('review/<str:review_id>/', ReadReviewView.as_view(), name='read-review'), 
    path('edit-review/<str:review_id>/', EditReviewView.as_view(), name='edit-review'),  
    path('delete-review/<int:pk>/', DeleteReviewView.as_view(), name='delete-review'), 
    path('videos/', video_list, name='video_list'), 
    path('videos/<str:video_id>/', VideoView.as_view(), name='video'), 
    path('token/', CustomTokenObtainView.as_view(), name='token_obtain_pair'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 
]
