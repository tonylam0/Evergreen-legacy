from datetime import timedelta

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from .models import EvergreenCollection, Review, Video, VideoEvergreenStats, VideoWatchEvent
from .ranking import apply_user_affinity
from .search_utils import search_videos, suggestion_videos
from .serializers import ReviewSerializer, VideoSerializer
from .utils import extract_video_id, parse_duration
import requests


from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView


class CustomGoogleOAuth2Client(OAuth2Client):
    def __init__(
        self,
        request,
        consumer_key,
        consumer_secret,
        access_token_method,
        access_token_url,
        callback_url,
        _scope,  
        scope_delimiter=" ",
        headers=None,
        basic_auth=False,
    ):
        super().__init__(
            request,
            consumer_key,
            consumer_secret,
            access_token_method,
            access_token_url,
            callback_url,
            scope_delimiter=scope_delimiter,
            headers=headers,
            basic_auth=basic_auth,
        )


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "postmessage"
    client_class = CustomGoogleOAuth2Client
    
@api_view(["GET"])
def video_list(request):
    videos = Video.objects.filter(is_approved=True).select_related("evergreen_stats")
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
    permission_classes = [permissions.IsAuthenticated]

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
                # Auto-approve if user is trusted curator
                is_approved = request.user.is_trusted_curator
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

        return queryset.order_by("-review_upvotes")

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


class GlobalRankView(APIView):
    """
    Return globally-ranked approved videos ordered by Evergreen score.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        limit = int(request.query_params.get("limit", 20))
        limit = max(1, min(limit, 100))

        queryset = (
            Video.objects.filter(is_approved=True, evergreen_stats__isnull=False)
            .select_related("evergreen_stats")
            .order_by("-evergreen_stats__global_evergreen_score")
        )[:limit]

        serializer = VideoSerializer(queryset, many=True)
        return Response(serializer.data)


class UserRankView(APIView):
    """
    Personalized ranking that gently adjusts global Evergreen scores
    with simple user affinity signals.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        limit = int(request.query_params.get("limit", 20))
        limit = max(1, min(limit, 100))

        base_qs = (
            Video.objects.filter(is_approved=True, evergreen_stats__isnull=False)
            .select_related("evergreen_stats")
        )

        # Preload simple affinity signals.
        saved_video_ids = set(
            EvergreenCollection.objects.filter(user=user).values_list("video_id", flat=True)
        )
        reviewed_video_ids = set(
            Review.objects.filter(author=user).values_list("video_id", flat=True)
        )

        scored = []
        for video in base_qs:
            base_score = float(getattr(video.evergreen_stats, "global_evergreen_score", 0.0) or 0.0)

            # Simple affinity: boost videos the user has saved or reviewed.
            affinity = 1.0
            if video.id in saved_video_ids:
                affinity += 0.3
            if video.id in reviewed_video_ids:
                affinity += 0.2

            personalized_score = apply_user_affinity(base_score, affinity)
            scored.append((personalized_score, video))

        scored.sort(key=lambda item: item[0], reverse=True)
        top_videos = [video for _score, video in scored[:limit]]

        serializer = VideoSerializer(top_videos, many=True)
        return Response(serializer.data)


class HomepageFeedView(APIView):
    """
    High-level homepage feed composed from Evergreen-ranked videos.

    This view returns sections but keeps the response structure simple so
    the frontend can iterate quickly.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None

        # Canon: top globally-ranked approved videos.
        canon_qs = (
            Video.objects.filter(is_approved=True, evergreen_stats__isnull=False)
            .select_related("evergreen_stats")
            .order_by("-evergreen_stats__global_evergreen_score")[:20]
        )

        # New & emerging: approved videos newer than 90 days, ordered by Evergreen score.
        cutoff_delta = timedelta(days=90)
        from django.utils import timezone

        now = timezone.now()
        new_qs = (
            Video.objects.filter(
                is_approved=True,
                evergreen_stats__isnull=False,
                publish_date__gte=now - cutoff_delta,
            )
            .select_related("evergreen_stats")
            .order_by("-evergreen_stats__global_evergreen_score")[:10]
        )

        # Continue watching: partially watched videos for this user.
        continue_qs = Video.objects.none()
        if user is not None:
            # Sessions where the user watched but did not mark completed.
            partial_events = (
                VideoWatchEvent.objects.filter(user=user, completed=False)
                .select_related("video")
                .order_by("-started_at")
            )
            video_ids = list(
                {
                    e.video_id
                    for e in partial_events
                    if e.video.is_approved and hasattr(e.video, "evergreen_stats")
                }
            )[:10]
            continue_qs = (
                Video.objects.filter(id__in=video_ids)
                .select_related("evergreen_stats")
            )

        data = {
            "canon": VideoSerializer(canon_qs, many=True).data,
            "new_and_emerging": VideoSerializer(new_qs, many=True).data,
            "continue_watching": VideoSerializer(continue_qs, many=True).data,
        }

        return Response(data)


class SearchView(APIView):
    """
    GET /api/search/?q=...&sort=relevance|rating|newest&page=1&page_size=24
    Returns { results, count, next }.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if not q:
            return Response(
                {"results": [], "count": 0, "next": None},
                status=status.HTTP_200_OK,
            )
        sort = request.query_params.get("sort", "relevance")
        if sort not in ("relevance", "rating", "newest"):
            sort = "relevance"
        try:
            page = int(request.query_params.get("page", 1))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = int(request.query_params.get("page_size", 24))
        except (TypeError, ValueError):
            page_size = 24

        videos, total, next_page = search_videos(q, sort=sort, page=page, page_size=page_size)
        serializer = VideoSerializer(videos, many=True)
        return Response({
            "results": serializer.data,
            "count": total,
            "next": next_page,
        })


class SearchSuggestionsView(APIView):
    """
    GET /api/search/suggestions/?q=...&limit=8
    Returns a short list of videos for typeahead.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if not q:
            return Response([])
        try:
            limit = int(request.query_params.get("limit", 8))
        except (TypeError, ValueError):
            limit = 8
        videos = suggestion_videos(q, limit=limit)
        serializer = VideoSerializer(videos, many=True)
        return Response(serializer.data)
