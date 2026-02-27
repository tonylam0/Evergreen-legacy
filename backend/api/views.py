import hashlib
import random
import time
from datetime import timedelta

from django.conf import settings
from django.db.models import Avg, Count
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
from .serializers import (
    AccountSettingsSerializer,
    ProfileReviewSerializer,
    ReviewSerializer,
    VideoSerializer,
)
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


class ProfileView(APIView):
    """GET current user profile: stats, submitted_videos, top_reviews."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        reviews_qs = Review.objects.filter(author=user)

        # Stats
        rating_agg = reviews_qs.aggregate(avg=Avg('rating'))
        average_rating = rating_agg['avg']
        if average_rating is not None:
            average_rating = round(float(average_rating), 1)
        stats = {
            'average_rating': average_rating,
            'rating_count': reviews_qs.count(),
            'review_text_count': reviews_qs.exclude(review_text='').count(),
            'submitted_video_count': user.videos.count(),
        }

        # Submitted videos (approved only)
        submitted_videos = Video.objects.filter(
            submitted_by=user, is_approved=True
        ).select_related('evergreen_stats')
        submitted_data = VideoSerializer(submitted_videos, many=True).data

        # Top reviews (with text, by upvote count), limit 10
        top_reviews_qs = (
            reviews_qs.exclude(review_text='')
            .annotate(upvote_count=Count('review_upvotes'))
            .select_related('video')
            .order_by('-upvote_count')[:10]
        )
        top_reviews_data = ProfileReviewSerializer(top_reviews_qs, many=True).data

        # Video IDs the user has reviewed (for "read review" links on submitted videos)
        reviewed_video_ids = list(
            reviews_qs.values_list('video__youtube_id', flat=True)
        )

        return Response({
            'username': user.username,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            'stats': stats,
            'submitted_videos': submitted_data,
            'top_reviews': top_reviews_data,
            'reviewed_video_ids': reviewed_video_ids,
        })


class AccountSettingsView(APIView):
    """GET/PATCH current user account settings (email, username, preferences)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = AccountSettingsSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = AccountSettingsSerializer(
            request.user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class DeleteAccountView(APIView):
    """POST with { username } to delete current user; requires username to match."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        entered = (request.data.get("username") or "").strip()
        if entered != request.user.username:
            return Response(
                {"error": "Username does not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
    Paginated homepage feed: single mixed list (continue watching, canon + new
    & emerging interleaved, then remaining by score). Feed order is shuffled with
    a per-request seed (different on refresh, different per user). Returns
    { results, next, seed }. Client sends seed for page >= 2 to keep order stable.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.utils import timezone

        user = request.user if request.user.is_authenticated else None
        try:
            page = int(request.query_params.get("page", 1))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = int(request.query_params.get("page_size", 24))
        except (TypeError, ValueError):
            page_size = 24
        page_size = min(max(1, page_size), 50)
        page = max(1, page)

        feed_videos = []
        seen_ids = set()
        feed_cap = 500

        # 1. Continue watching (for authenticated user), order by started_at desc.
        if user is not None:
            partial_events = (
                VideoWatchEvent.objects.filter(user=user, completed=False)
                .select_related("video__evergreen_stats")
                .order_by("-started_at")
            )
            for e in partial_events:
                if len(feed_videos) >= 10:
                    break
                v = e.video
                if v.id in seen_ids or not v.is_approved or not getattr(v, "evergreen_stats", None):
                    continue
                seen_ids.add(v.id)
                feed_videos.append(v)

        # 2. Canon and new & emerging: fetch then interleave (round-robin).
        cutoff_delta = timedelta(days=90)
        now = timezone.now()
        canon_list = list(
            Video.objects.filter(is_approved=True, evergreen_stats__isnull=False)
            .select_related("evergreen_stats")
            .order_by("-evergreen_stats__global_evergreen_score")[:50]
        )
        new_list = list(
            Video.objects.filter(
                is_approved=True,
                evergreen_stats__isnull=False,
                publish_date__gte=now - cutoff_delta,
            )
            .select_related("evergreen_stats")
            .order_by("-evergreen_stats__global_evergreen_score")[:30]
        )
        max_len = max(len(canon_list), len(new_list))
        for i in range(max_len):
            if len(feed_videos) >= feed_cap:
                break
            if i < len(canon_list) and canon_list[i].id not in seen_ids:
                seen_ids.add(canon_list[i].id)
                feed_videos.append(canon_list[i])
            if len(feed_videos) >= feed_cap:
                break
            if i < len(new_list) and new_list[i].id not in seen_ids:
                seen_ids.add(new_list[i].id)
                feed_videos.append(new_list[i])

        # 3. Remaining approved by score, cap total feed size.
        remaining = (
            Video.objects.filter(
                is_approved=True,
                evergreen_stats__isnull=False,
            )
            .exclude(id__in=seen_ids)
            .select_related("evergreen_stats")
            .order_by("-evergreen_stats__global_evergreen_score")[: feed_cap - len(feed_videos)]
        )
        for v in remaining:
            feed_videos.append(v)

        # Shuffle so feed changes on refresh and differs per user; use seed for stable pagination.
        seed_param = request.query_params.get("seed")
        if seed_param is not None:
            try:
                seed = int(seed_param)
            except (TypeError, ValueError):
                seed = None
        else:
            seed = None

        if seed is None and page == 1:
            user_id = getattr(user, "id", None) if user else None
            ident = str(user_id) if user_id is not None else (request.META.get("REMOTE_ADDR") or "anon")
            seed_input = f"{ident}-{time.time()}-{random.random()}"
            seed = int(hashlib.sha256(seed_input.encode()).hexdigest()[:8], 16)

        if seed is not None:
            rng = random.Random(seed)
            rng.shuffle(feed_videos)

        total = len(feed_videos)
        start = (page - 1) * page_size
        end = start + page_size
        page_videos = feed_videos[start:end]
        next_page = page + 1 if end < total else None

        serializer = VideoSerializer(page_videos, many=True)
        payload = {"results": serializer.data, "next": next_page}
        if seed is not None:
            payload["seed"] = seed
        return Response(payload)


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
