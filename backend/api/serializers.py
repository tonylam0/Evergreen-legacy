from dj_rest_auth.registration.serializers import RegisterSerializer
from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import CustomUser, EvergreenCollection, Review, Video

# Validates incoming video submission data and converts it into/from JSON
class VideoSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    evergreen_score = serializers.SerializerMethodField()

    def get_evergreen_score(self, obj):
        if obj.evergreen_stats is None:
            return None
        return getattr(obj.evergreen_stats, 'global_evergreen_score', None)
    save_count = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    view_count = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = "__all__"

    def get_average_rating(self, obj):
        rating = obj.get_avg_rating()
        if rating is not None:
            # ":.1f" forces 1 decimal place even for whole numbers
            return f"{float(rating):.1f}"
        return None

    def get_save_count(self, obj):
        return EvergreenCollection.objects.filter(video=obj).count()

    def get_review_count(self, obj):
        return Review.objects.filter(video=obj).count()

    def get_view_count(self, obj):
        # Use watch events if present; fall back to 0.
        return getattr(obj, "watch_events", None).count() if hasattr(obj, "watch_events") else 0

class ReviewSerializer(serializers.ModelSerializer):
    video_id = serializers.SlugRelatedField(
        queryset=Video.objects.all(),
        slug_field='youtube_id',
        source='video'  # Finds the corresponding video opject with passed video_id
    )
    author_username = serializers.CharField(source='author.username', read_only=True)
    upvote_count = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'rating', 'review_text', 'video_id', 'author', 'author_username', 'created_at', 'upvote_count']
        read_only_fields = ['author', 'author_username', 'upvote_count']

    def get_upvote_count(self, obj):
        return obj.review_upvotes.count()


class ProfileReviewSerializer(serializers.ModelSerializer):
    """Review with video_id and video_title for profile top reviews."""
    video_id = serializers.CharField(source='video.youtube_id', read_only=True)
    video_title = serializers.CharField(source='video.title', read_only=True)
    upvote_count = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'rating', 'review_text', 'created_at', 'video_id', 'video_title', 'upvote_count']

    def get_upvote_count(self, obj):
        return getattr(obj, 'upvote_count', obj.review_upvotes.count())


class CustomRegisterSerializer(RegisterSerializer):
    def validate_email(self, value):
        email = value.lower()

        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")

        return email

class CustomLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        trim_whitespace=False
    )

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Authenticate the user
            user = authenticate(request=self.context.get('request'),
                               email=email, password=password)

            print(f"Attempting auth for: {email}. Result: {user}")

            if not user:
                print(f"Attempting auth for: {email}. Result: {user}")
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        attrs['user'] = user
        return attrs


class AccountSettingsSerializer(serializers.ModelSerializer):
    """Read/write email, username, and notification/privacy preference booleans."""

    class Meta:
        model = CustomUser
        fields = [
            "email",
            "username",
            "notify_reply_to_review",
            "weekly_digest",
            "profile_private",
            "hide_reviews_ratings",
        ]

    def validate_email(self, value):
        value = value.lower().strip()
        user = self.context["request"].user
        if CustomUser.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        value = value.strip()
        user = self.context["request"].user
        if CustomUser.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
