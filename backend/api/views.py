from rest_framework import status, generics, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.decorators import api_view
from rest_framework.exceptions import PermissionDenied
from django.conf import settings
from django.shortcuts import get_object_or_404
from .models import EvergreenCollection, Video, Review
from .serializers import VideoSerializer, ReviewSerializer
from .utils import extract_video_id, parse_duration
import requests


@api_view(['GET'])
def video_list(request):
    videos = Video.objects.all()
    serializer = VideoSerializer(videos, many=True)  # Converts videos to JSON
    return Response(serializer.data)

class VideoView(APIView):
    def get(self, request, video_id):
        try:
            video = Video.objects.get(youtube_id=video_id)
            serializer = VideoSerializer(video)
            return Response(serializer.data)
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=404)

# Handles video submission requests
class SubmitVideoView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Only allows authenticated users to submit videos

    def post(self, request):
        # Get the YouTube URL from the request data
        youtube_url = request.data.get('url')  # Get the YouTube URL from the request data
        if not youtube_url:
            return Response({"error": "URL is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for a valid YouTube video ID
        video_id = extract_video_id(youtube_url)
        if not video_id:
            return Response({"error": "Invalid YouTube URL."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the video has already been submitted
        if Video.objects.filter(youtube_id=video_id).exists():
            return Response({"error": "Video has already been submitted."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Call the YouTube Data API to fetch video details
        api_url = "https://www.googleapis.com/youtube/v3/videos"  # Google YouTube Data API endpoint
        params = {
            'part': 'snippet, contentDetails',  # Snippet contains video details (title, description, etc.)
            'id': video_id,
            'key': settings.YOUTUBE_API_KEY  # API key from Django settings
        }

        try:
            response = requests.get(api_url, params=params)
            data = response.json()

            if not data['items']:
                return Response({"error": "Video not found on YouTube"}, status=status.HTTP_404_NOT_FOUND)
            
            snippet = data['items'][0]['snippet']
            contentDetails = data['items'][0]['contentDetails']

            duration_in_seconds = parse_duration(contentDetails['duration'])

            # Create the video object inside the database
            video = Video.objects.create(
                youtube_id = video_id,
                title = snippet['title'],
                channel_name = snippet['channelTitle'],
                publish_date = snippet['publishedAt'],
                description = snippet['description'],
                duration_seconds = duration_in_seconds,
                thumbnail_url = snippet['thumbnails']['high']['url'],
                submitted_by = request.user,
                is_approved = request.user.is_trusted_curator  # Auto-approve if user is trusted curator
            )

            serializer = VideoSerializer(video)  # Converts video object into JSON format
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VideoSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        pk = self.kwargs.get('pk') 
        video = get_object_or_404(Video, pk=pk)

        try:
            EvergreenCollection.objects.create(user=self.request.user, video=video)
            return Response({"message": "Video is saved!"}, status=status.HTTP_201_CREATED)
        except: 
            return Response({"error": "Error occured while trying to save video"}, status=status.HTTP_400_BAD_REQUEST)


# Handles review CRUD operations in one class
class ReviewViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        queryset = Review.objects.all()
        
        # If video_id is provided and all_reviews=true, return all reviews for that video
        video_id = self.request.query_params.get('video_id')
        all_reviews = self.request.query_params.get('all_reviews', 'false').lower() == 'true'
        
        if video_id and all_reviews:
            # Return all reviews for the video, ordered by upvotes
            queryset = queryset.filter(video__youtube_id=video_id)
        else:
            # Default behavior: return only user's reviews
            if self.request.user.is_authenticated:
                queryset = queryset.filter(author=self.request.user)
            else:
                queryset = Review.objects.none()
            
            if video_id:
                queryset = queryset.filter(video__youtube_id=video_id) 

        return queryset.order_by('-review_upvotes')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class CustomTokenObtainView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        # Pull out the refresh token out of the standard response data
        refresh_token = response.data['refresh']

        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite='Lax',  # Protects against CSRF
            path='/api/token/refresh/'
        )

        del response.data['refresh']  # Remove the refresh token from the response

        return response
