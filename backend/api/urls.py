from .views import SubmitVideoView, video_list, VideoView, CustomTokenObtainView, ReviewViewSet
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

# Creates CRUD routes
router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('submit-video/', SubmitVideoView.as_view(), name='submit-video'), 
    path('videos/', video_list, name='video_list'), 
    path('videos/<str:video_id>/', VideoView.as_view(), name='video'), 

    # Review endpoints
    path('', include(router.urls)),

    path('token/', CustomTokenObtainView.as_view(), name='token_obtain_pair'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 
]
