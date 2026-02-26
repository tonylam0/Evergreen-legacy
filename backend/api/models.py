from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db.models import Avg
import uuid


class CustomUser(AbstractUser):  # Allows users to bypass submission checking
    is_trusted_curator = models.BooleanField(default=False)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username
    
class Video(models.Model):
    # Basic video information
    youtube_id = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    channel_name = models.CharField(max_length=200)
    publish_date = models.DateTimeField()
    description = models.TextField(blank=True, null=True)
    duration_seconds = models.IntegerField(blank=True, null=True)
    thumbnail_url = models.URLField(max_length=500, blank=True, null=True)

    # Submission information
    submit_date = models.DateTimeField(auto_now_add=True)
    submitted_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name="videos")

    # Moderation flag to make video public
    is_approved = models.BooleanField(default=False)

    reviews: models.QuerySet['Review']
    def get_avg_rating(self):
        result = self.reviews.aggregate(Avg('rating'))['rating__avg']
        return result or None

    def __str__(self):
        return self.title


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="reviews")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="reviews")
    review_text = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    rating = models.FloatField(
        validators=[MinValueValidator(1), MaxValueValidator(6)]
    )

    class Meta:
        unique_together = ('author', 'video')

    def __str__(self):
        return f"Review by {self.author.username} on {self.video.title}"


class ReviewUpvote(models.Model):
    # The user to upvoted the review
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="review_upvotes")
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="review_upvotes")

    class Meta:
        unique_together = ('user', 'review')


class Reply(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="replies")
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="replies")
    reply_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reply by {self.author.username} on {self.review.author}'s review"


class ReplyUpvote(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="reply_upvotes")
    reply = models.ForeignKey(Reply, on_delete=models.CASCADE, related_name="reply_upvotes")

    class Meta:
        unique_together = ('user', 'reply')


class EvergreenCollection(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="evergreen_collection")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="evergreen_collection")

    class Meta:
        unique_together = ('user', 'video')


class VideoWatchEvent(models.Model):
    """
    Atomic watch/session event emitted by the frontend.

    This captures per-session watch behaviour at a coarse level and is
    later aggregated into per-video and per-user metrics used for ranking.
    """

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="watch_events",
    )
    video = models.ForeignKey(
        Video,
        on_delete=models.CASCADE,
        related_name="watch_events",
    )

    # A logical session identifier generated client-side; allows grouping
    # multiple events belonging to the same viewing session.
    session_id = models.CharField(max_length=64, blank=True, null=True)

    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)

    # Total seconds watched during this session, as measured by the client.
    watch_seconds = models.PositiveIntegerField(default=0)

    # Whether the viewer reached (approximately) the end of the video.
    completed = models.BooleanField(default=False)

    # Optional coarse-grained source to help debug / slice metrics.
    SOURCE_CHOICES = [
        ("home", "Homepage"),
        ("video", "Direct video page"),
        ("search", "Search results"),
        ("topic", "Topic page"),
        ("external", "External / unknown"),
    ]
    source = models.CharField(
        max_length=16,
        choices=SOURCE_CHOICES,
        default="video",
    )


class VideoEvergreenStats(models.Model):
    """
    Pre-aggregated per-video statistics that power Evergreen ranking.

    This model is periodically recomputed from primary tables
    (Video, Review, EvergreenCollection, VideoWatchEvent, etc.).
    """

    video = models.OneToOneField(
        Video,
        on_delete=models.CASCADE,
        related_name="evergreen_stats",
    )

    # Quality / feedback signals
    avg_rating = models.FloatField(blank=True, null=True)
    rating_count = models.PositiveIntegerField(default=0)
    bookmark_count = models.PositiveIntegerField(default=0)
    review_count = models.PositiveIntegerField(default=0)
    review_upvote_count = models.PositiveIntegerField(default=0)
    reply_count = models.PositiveIntegerField(default=0)
    reply_upvote_count = models.PositiveIntegerField(default=0)

    # Watch / depth metrics (0–1 ratios where relevant)
    avg_watch_ratio_all_time = models.FloatField(blank=True, null=True)
    completion_rate_all_time = models.FloatField(blank=True, null=True)
    avg_watch_ratio_recent = models.FloatField(blank=True, null=True)
    completion_rate_recent = models.FloatField(blank=True, null=True)

    # Optional per-age-bucket completion rates
    completion_rate_0_3m = models.FloatField(blank=True, null=True)
    completion_rate_3_12m = models.FloatField(blank=True, null=True)
    completion_rate_12_36m = models.FloatField(blank=True, null=True)
    completion_rate_36m_plus = models.FloatField(blank=True, null=True)

    # Creator / trust
    creator_reputation_score = models.FloatField(blank=True, null=True)

    # Final global Evergreen score (0–1) for this video in a neutral context.
    global_evergreen_score = models.FloatField(default=0.0)

    updated_at = models.DateTimeField(auto_now=True)

