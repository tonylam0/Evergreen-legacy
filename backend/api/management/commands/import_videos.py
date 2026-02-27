"""
Bulk import YouTube videos from a file (one URL or video ID per line).

Efficiency:
- YouTube Data API: fetches up to 50 video IDs per request (batch).
- Database: uses bulk_create() in chunks to minimize round-trips.

Usage:
  python manage.py import_videos path/to/urls.txt
  python manage.py import_videos urls.txt --user admin --approve --batch-db 1000
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

import requests
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import CustomUser, Video, VideoEvergreenStats
from api.utils import extract_video_id, parse_duration


# YouTube Data API allows max 50 IDs per videos.list request
YOUTUBE_BATCH_SIZE = 50


def fetch_videos_batch(video_ids: list[str]) -> list[dict]:
    """Fetch video details from YouTube Data API for up to 50 IDs. Returns list of item dicts."""
    if not video_ids:
        return []
    api_url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet,contentDetails",
        "id": ",".join(video_ids),
        "key": settings.YOUTUBE_API_KEY,
    }
    resp = requests.get(api_url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data.get("items") or []


def build_video_from_item(item: dict, submitted_by: CustomUser | None, is_approved: bool) -> Video | None:
    """Build a Video instance (unsaved) from a YouTube API item. Returns None if missing required fields."""
    snippet = item.get("snippet")
    content_details = item.get("contentDetails") or {}
    if not snippet:
        return None
    video_id = item.get("id")
    if not video_id:
        return None
    duration_seconds = parse_duration(content_details.get("duration") or "")
    thumbnails = snippet.get("thumbnails") or {}
    thumbnail_url = (
        (thumbnails.get("high") or thumbnails.get("medium") or thumbnails.get("default")) or {}
    ).get("url")
    published = snippet.get("publishedAt")
    if not published:
        return None
    # Parse ISO 8601
    try:
        publish_date = datetime.fromisoformat(published.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None
    title = (snippet.get("title") or "")[:200]
    channel_name = (snippet.get("channelTitle") or "")[:200]
    description = (snippet.get("description") or "") or None

    return Video(
        youtube_id=video_id,
        title=title,
        channel_name=channel_name,
        publish_date=publish_date,
        description=description,
        duration_seconds=duration_seconds,
        thumbnail_url=thumbnail_url,
        submitted_by=submitted_by,
        is_approved=is_approved,
        submit_date=datetime.now(timezone.utc),
    )


class Command(BaseCommand):
    help = "Bulk import YouTube videos from a file (one URL or video ID per line)."

    def add_arguments(self, parser):
        parser.add_argument(
            "file",
            type=str,
            help="Path to file with one YouTube URL or video ID per line.",
        )
        parser.add_argument(
            "--user",
            type=str,
            default=None,
            help="Username for submitted_by. If omitted, submitted_by is null.",
        )
        parser.add_argument(
            "--approve",
            action="store_true",
            help="Set is_approved=True for all imported videos.",
        )
        parser.add_argument(
            "--batch-api",
            type=int,
            default=YOUTUBE_BATCH_SIZE,
            help=f"Number of video IDs per YouTube API request (max {YOUTUBE_BATCH_SIZE}). Default: {YOUTUBE_BATCH_SIZE}.",
        )
        parser.add_argument(
            "--batch-db",
            type=int,
            default=500,
            help="Number of Video rows per bulk_create. Default: 500.",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=0.0,
            help="Seconds to sleep between API batches (to avoid rate limits). Default: 0.",
        )
        parser.add_argument(
            "--create-stats",
            action="store_true",
            help="Create VideoEvergreenStats for each new video (default: run recompute_evergreen_stats after import).",
        )

    def handle(self, *args, **options):
        path = options["file"]
        username = options["user"]
        is_approved = options["approve"]
        batch_api = min(options["batch_api"], YOUTUBE_BATCH_SIZE)
        batch_db = options["batch_db"]
        delay = options["delay"]
        create_stats = options["create_stats"]

        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                lines = [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"File not found: {path}"))
            return

        # Resolve to video IDs and dedupe (YouTube IDs are 11 chars: alphanumeric, -, _)
        video_ids = []
        seen = set()
        for line in lines:
            if "youtube" in line or "youtu.be" in line:
                vid = extract_video_id(line)
            elif len(line) == 11 and all(c.isalnum() or c in "-_" for c in line):
                vid = line
            else:
                vid = None
            if vid and vid not in seen:
                seen.add(vid)
                video_ids.append(vid)

        self.stdout.write(f"Found {len(video_ids)} unique video IDs from {len(lines)} lines.")

        # Skip already-imported
        existing = set(Video.objects.filter(youtube_id__in=video_ids).values_list("youtube_id", flat=True))
        to_fetch = [vid for vid in video_ids if vid not in existing]
        skipped = len(video_ids) - len(to_fetch)
        if skipped:
            self.stdout.write(f"Skipping {skipped} already in DB.")
        if not to_fetch:
            self.stdout.write(self.style.SUCCESS("Nothing to import."))
            return

        submitted_by = None
        if username:
            try:
                submitted_by = CustomUser.objects.get(username=username)
            except CustomUser.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"User not found: {username}"))
                return

        if not settings.YOUTUBE_API_KEY:
            self.stderr.write(self.style.ERROR("YOUTUBE_API_KEY is not set."))
            return

        # Fetch from YouTube in batches
        all_items = []
        for i in range(0, len(to_fetch), batch_api):
            batch = to_fetch[i : i + batch_api]
            try:
                items = fetch_videos_batch(batch)
                all_items.extend(items)
                self.stdout.write(f"API batch {i // batch_api + 1}: got {len(items)} videos for {len(batch)} IDs.")
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"YouTube API error for batch: {e}"))
                # Continue with next batch
            if delay > 0 and i + batch_api < len(to_fetch):
                time.sleep(delay)

        # Build Video instances
        videos = []
        for item in all_items:
            v = build_video_from_item(item, submitted_by, is_approved)
            if v is not None:
                videos.append(v)

        self.stdout.write(f"Built {len(videos)} Video instances.")

        # Persist in DB chunks
        created_count = 0
        created_videos = []
        with transaction.atomic():
            for j in range(0, len(videos), batch_db):
                chunk = videos[j : j + batch_db]
                created = Video.objects.bulk_create(chunk)
                created_count += len(created)
                created_videos.extend(created)
                self.stdout.write(f"DB batch: inserted {len(created)} rows (total {created_count}).")

            if create_stats and created_videos:
                # Create VideoEvergreenStats from returned objects (PKs set on PostgreSQL/SQLite 3.35+)
                stats = [VideoEvergreenStats(video=v) for v in created_videos]
                VideoEvergreenStats.objects.bulk_create(stats)
                self.stdout.write(f"Created {len(stats)} VideoEvergreenStats rows.")

        self.stdout.write(
            self.style.SUCCESS(f"Import complete: {created_count} videos imported.")
        )
        if not create_stats and created_count > 0:
            self.stdout.write(
                "Run: python manage.py recompute_evergreen_stats to backfill Evergreen stats."
            )
