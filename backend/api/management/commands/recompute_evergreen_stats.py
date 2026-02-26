from __future__ import annotations

from datetime import datetime, timedelta, timezone

from django.core.management.base import BaseCommand
from django.db import models, transaction

from api.models import (
    EvergreenCollection,
    Reply,
    ReplyUpvote,
    Review,
    ReviewUpvote,
    Video,
    VideoEvergreenStats,
    VideoWatchEvent,
)
from api.ranking import VideoAggregates, compute_global_evergreen_score


class Command(BaseCommand):
    help = "Recompute per-video Evergreen statistics and global Evergreen scores."

    def handle(self, *args, **options):
        now = datetime.now(timezone.utc)
        recent_window = now - timedelta(days=90)

        videos = (
            Video.objects.select_related("submitted_by")
            .prefetch_related("reviews", "evergreen_collection", "watch_events")
            .all()
        )

        total = videos.count()
        self.stdout.write(f"Recomputing Evergreen stats for {total} videos...")

        with transaction.atomic():
            for idx, video in enumerate(videos, start=1):
                stats, _created = VideoEvergreenStats.objects.select_for_update().get_or_create(
                    video=video
                )

                # Quality / feedback signals
                reviews_qs = Review.objects.filter(video=video)
                rating_agg = reviews_qs.aggregate(avg_rating=models.Avg("rating"), count=models.Count("id"))
                avg_rating = rating_agg["avg_rating"]
                rating_count = rating_agg["count"] or 0

                bookmark_count = EvergreenCollection.objects.filter(video=video).count()
                review_count = reviews_qs.count()
                review_upvote_count = ReviewUpvote.objects.filter(review__video=video).count()
                reply_count = Reply.objects.filter(review__video=video).count()
                reply_upvote_count = ReplyUpvote.objects.filter(reply__review__video=video).count()

                # Watch / depth metrics
                watch_events_all = VideoWatchEvent.objects.filter(video=video)
                session_count_all = watch_events_all.count()
                duration = video.duration_seconds or 0

                if session_count_all > 0 and duration > 0:
                    total_watch_seconds_all = sum(e.watch_seconds for e in watch_events_all)
                    avg_watch_ratio_all_time = min(
                        total_watch_seconds_all / (session_count_all * duration),
                        1.5,  # allow slight overshoot due to rewinds
                    )
                    completion_rate_all_time = (
                        watch_events_all.filter(completed=True).count() / session_count_all
                    )
                else:
                    avg_watch_ratio_all_time = None
                    completion_rate_all_time = None

                watch_events_recent = watch_events_all.filter(started_at__gte=recent_window)
                session_count_recent = watch_events_recent.count()

                if session_count_recent > 0 and duration > 0:
                    total_watch_seconds_recent = sum(e.watch_seconds for e in watch_events_recent)
                    avg_watch_ratio_recent = min(
                        total_watch_seconds_recent / (session_count_recent * duration),
                        1.5,
                    )
                    completion_rate_recent = (
                        watch_events_recent.filter(completed=True).count() / session_count_recent
                    )
                else:
                    avg_watch_ratio_recent = None
                    completion_rate_recent = None

                # Age-bucketed completion rates (optional but useful for longevity)
                completion_rate_0_3m = None
                completion_rate_3_12m = None
                completion_rate_12_36m = None
                completion_rate_36m_plus = None

                if duration > 0 and session_count_all > 0:
                    # Calculate age at time of watch event to assign to bucket.
                    buckets = {
                        "0_3m": {"completed": 0, "count": 0},
                        "3_12m": {"completed": 0, "count": 0},
                        "12_36m": {"completed": 0, "count": 0},
                        "36m_plus": {"completed": 0, "count": 0},
                    }

                    for e in watch_events_all:
                        event_time = e.started_at or now
                        age_days = (event_time - video.publish_date).days
                        age_months = age_days / 30.0 if age_days > 0 else 0.0

                        if age_months < 3:
                            bucket_key = "0_3m"
                        elif age_months < 12:
                            bucket_key = "3_12m"
                        elif age_months < 36:
                            bucket_key = "12_36m"
                        else:
                            bucket_key = "36m_plus"

                        buckets[bucket_key]["count"] += 1
                        if e.completed:
                            buckets[bucket_key]["completed"] += 1

                    def _rate(bucket_name: str) -> float | None:
                        completed = buckets[bucket_name]["completed"]
                        count = buckets[bucket_name]["count"]
                        if count == 0:
                            return None
                        return completed / count

                    completion_rate_0_3m = _rate("0_3m")
                    completion_rate_3_12m = _rate("3_12m")
                    completion_rate_12_36m = _rate("12_36m")
                    completion_rate_36m_plus = _rate("36m_plus")

                # Creator reputation: simple heuristic based on their catalog on Evergreen.
                creator = video.submitted_by
                if creator is not None:
                    creator_videos = Video.objects.filter(submitted_by=creator)
                    creator_video_ids = creator_videos.values_list("id", flat=True)
                    creator_reviews = Review.objects.filter(video_id__in=creator_video_ids)
                    creator_rating_agg = creator_reviews.aggregate(avg=models.Avg("rating"))
                    creator_avg_rating = creator_rating_agg["avg"] or 0.0
                    # Map 1–6 rating to 0–1 and clamp.
                    creator_rep = max(0.0, min((creator_avg_rating - 1.0) / 5.0, 1.0))
                else:
                    creator_rep = None

                # Persist aggregates.
                stats.avg_rating = avg_rating
                stats.rating_count = rating_count
                stats.bookmark_count = bookmark_count
                stats.review_count = review_count
                stats.review_upvote_count = review_upvote_count
                stats.reply_count = reply_count
                stats.reply_upvote_count = reply_upvote_count

                stats.avg_watch_ratio_all_time = avg_watch_ratio_all_time
                stats.completion_rate_all_time = completion_rate_all_time
                stats.avg_watch_ratio_recent = avg_watch_ratio_recent
                stats.completion_rate_recent = completion_rate_recent

                stats.completion_rate_0_3m = completion_rate_0_3m
                stats.completion_rate_3_12m = completion_rate_3_12m
                stats.completion_rate_12_36m = completion_rate_12_36m
                stats.completion_rate_36m_plus = completion_rate_36m_plus

                stats.creator_reputation_score = creator_rep

                # Build ranking aggregates and compute global Evergreen score.
                agg = VideoAggregates(
                    video_id=video.id,
                    publish_date=video.publish_date,
                    submit_date=video.submit_date,
                    is_approved=video.is_approved,
                    submitted_by_trusted_curator=bool(
                        getattr(video.submitted_by, "is_trusted_curator", False)
                    ),
                    avg_rating=avg_rating,
                    rating_count=rating_count,
                    bookmark_count=bookmark_count,
                    review_count=review_count,
                    review_upvote_count=review_upvote_count,
                    reply_count=reply_count,
                    reply_upvote_count=reply_upvote_count,
                    avg_watch_ratio_all_time=avg_watch_ratio_all_time,
                    completion_rate_all_time=completion_rate_all_time,
                    avg_watch_ratio_recent=avg_watch_ratio_recent,
                    completion_rate_recent=completion_rate_recent,
                    completion_rate_0_3m=completion_rate_0_3m,
                    completion_rate_3_12m=completion_rate_3_12m,
                    completion_rate_12_36m=completion_rate_12_36m,
                    completion_rate_36m_plus=completion_rate_36m_plus,
                    creator_reputation_score=creator_rep,
                )

                stats.global_evergreen_score = compute_global_evergreen_score(agg, now=now)
                stats.save()

                if idx % 50 == 0 or idx == total:
                    self.stdout.write(f"Processed {idx}/{total} videos")

        self.stdout.write(self.style.SUCCESS("Evergreen stats recomputation completed."))

