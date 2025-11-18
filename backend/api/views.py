from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import requests
import re
from .models import Video
from .serializers import VideoSerializer


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

# Handles video submission requests
class SubmitVideoView(APIView):
    permission_classes = [IsAuthenticated]  # Only allows authenticated users to submit videos

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