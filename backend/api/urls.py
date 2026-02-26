from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainView,
    GlobalRankView,
    HomepageFeedView,
    ReviewViewSet,
    SearchView,
    SearchSuggestionsView,
    SubmitVideoView,
    UserRankView,
    VideoView,
    video_list,
    GoogleLogin,
)

# Creates CRUD routes
router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path("submit-video/", SubmitVideoView.as_view(), name="submit-video"),
    path("videos/", video_list, name="video_list"),
    path("videos/<str:video_id>/", VideoView.as_view(), name="video"),

    # Ranking / feed endpoints
    path("rank/global/", GlobalRankView.as_view(), name="rank-global"),
    path("rank/user/", UserRankView.as_view(), name="rank-user"),
    path("feed/homepage/", HomepageFeedView.as_view(), name="homepage-feed"),

    # Search
    path("search/", SearchView.as_view(), name="search"),
    path("search/suggestions/", SearchSuggestionsView.as_view(), name="search-suggestions"),

    # Review endpoints
    path("", include(router.urls)),

    path("token/", CustomTokenObtainView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path('auth/google/', GoogleLogin.as_view(), name='google_login'),
]
