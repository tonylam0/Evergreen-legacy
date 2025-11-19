from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator


class CustomUser(AbstractUser):
    # Allows users to bypass submission checking
    is_trusted_curator = models.BooleanField(default=False)

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

    def __str__(self):
        return self.title
    
class Review(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="reviews")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="reviews")
    review_text = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(6)]
    )

    class Meta:
        unique_together = ('author', 'video')

    def __str__(self):
        return f"Review by {self.author.username} on {self.video.title}"

# Used to upvote a review
class ReviewUpvote(models.Model):
    # The user to upvoted the review
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="review_upvotes")
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="review_upvotes")

    class Meta:
        unique_together = ('user', 'review')

# Replies to reviews
class Reply(models.Model):
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="replies")
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="replies")
    reply_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reply by {self.author.username} on {self.review.author}'s review"

# Used to upvote a reply
class ReplyUpvote(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="reply_upvotes")
    reply = models.ForeignKey(Reply, on_delete=models.CASCADE, related_name="reply_upvotes")

    class Meta:
        unique_together = ('user', 'reply')

# Used to save a video to their loved videos collection
class VideoSave(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="video_saves")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="video_saves")
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'video')