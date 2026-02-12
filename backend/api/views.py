from django.http import response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.decorators import api_view
from rest_framework import status, generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.conf import settings
from django.shortcuts import get_object_or_404
from .models import EvergreenCollection, Video, Review
from .serializers import VideoSerializer, ReviewSerializer
import requests
import re


# Extract video ID from YouTube URL
def extract_video_id(url):
    youtube_regex = (
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*'  # Valid YouTube video ID format
    )

    match = re.search(youtube_regex, url)
    if match:
        return match.group(1)  # Returns only the video ID from the URL
    return None

# Parse YouTube duration into seconds
def parse_duration(duration):
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)

    if not match:
        return None
    
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    return hours * 3600 + minutes * 60 + seconds

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

# CRUD operations for reviews
class CreateReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):        
        video_id_str = request.data.get('video_id')
    
        if not video_id_str:
            return Response({"error": "Video ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Checks for valid integer video ID
        try:
            video_id = int(video_id_str)
        except ValueError:
            return Response({"error": "Video ID must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        video = get_object_or_404(Video, pk=video_id)  # pk is primary key
        
        if Review.objects.filter(author=request.user, video=video).exists():
            return Response({"error": "You have already a review for the video"}, status=status.HTTP_400_BAD_REQUEST)
        
        rating = request.data.get('rating')
        if not rating:
            return Response({"error": "Review must have a rating"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Checks if rating is a number
        try:
            rating = int(rating) # Ensure it's a number
            if not (1 <= rating <= 6):
                return Response({"error": "Rating must be between 1 and 6"}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
             return Response({"error": "Rating must be a number"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Review text does not require check because review does not require text (only rating is required)
        review_text = request.data.get('review_text', "")   # Default to "" if user does not send review text

        try:
            review = Review.objects.create(
                author = request.user,
                video = video,
                review_text = review_text,
                rating = rating
            )

            serializer = ReviewSerializer(review)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Read all reviews for a specific video
class ListReviewView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ReviewSerializer
    
    def get_queryset(self):
        video_id = self.kwargs.get('video_id')

        # Double underscore traversal allows you to access the id of the related video object
        return Review.objects.filter(video__id=video_id).order_by('-review_upvotes')  # Most liked reviews first
    
# Reads a single review
# Don't need a get_object method because generics.RetrieveAPIView does it automatically
class ReadReviewView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ReviewSerializer
        
class EditReviewView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReviewSerializer

    def get_object(self):
        pk = self.kwargs.get('pk')
        review = get_object_or_404(Review, pk=pk)
        if review.author != self.request.user:
            raise PermissionDenied("You do not have permission to edit this review.")
        
        return review

class DeleteReviewView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        pk = self.kwargs.get('pk')
        review = get_object_or_404(Review, pk=pk)
        if review.author != self.request.user:
            raise PermissionDenied("You do not have permission to delete this review.")
        
        return review

class VideoSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        pk = self.kwargs.get('pk') 
        video = get_object_or_404(Video, pk)

        try:
            EvergreenCollection.objects.create(user=self.request.user, video=video)
            return Response({"message": "Video is saved!"}, status=status.HTTP_201_CREATED)
        except: 
            return Response({"error": "Error occured while trying to save video"}, status=status.HTTP_400_BAD_REQUEST)

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
