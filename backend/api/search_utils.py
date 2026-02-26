"""
Search and suggestions logic with fuzzy matching (SQLite-compatible).
"""
from django.db.models import Q
from rapidfuzz import fuzz

from .models import Video


def get_search_candidates(query: str):
    """
    Return approved videos that match any word of the query in title, channel, or description.
    """
    q = (query or "").strip()
    if not q:
        return Video.objects.none()

    terms = [t.strip() for t in q.split() if t.strip()]
    if not terms:
        return Video.objects.none()

    base = Video.objects.filter(is_approved=True).select_related("evergreen_stats")
    for term in terms:
        base = base.filter(
            Q(title__icontains=term)
            | Q(channel_name__icontains=term)
            | Q(description__icontains=term)
        )
    return base


def fuzzy_score_video(video, query: str):
    """
    Combined relevance score from title and channel (0–100 scale).
    """
    q = (query or "").strip().lower()
    if not q:
        return 0.0
    title_score = fuzz.token_set_ratio(q, (video.title or "").lower())
    channel_score = fuzz.token_set_ratio(q, (video.channel_name or "").lower())
    # Weight title more than channel
    return 0.7 * title_score + 0.3 * channel_score


def search_videos(query: str, sort="relevance", page=1, page_size=24):
    """
    Return (list of videos, total count, next_page or None).
    page_size is capped at 50.
    """
    page_size = min(max(1, page_size), 50)
    page = max(1, page)

    candidates = list(get_search_candidates(query))
    if not candidates:
        return [], 0, None

    # Score and sort by relevance first
    scored = [(fuzzy_score_video(v, query), v) for v in candidates]

    if sort == "rating":
        scored.sort(
            key=lambda item: (item[1].get_avg_rating() or 0, item[0]),
            reverse=True,
        )
    elif sort == "newest":
        scored.sort(
            key=lambda item: (item[1].publish_date, item[0]),
            reverse=True,
        )
    else:
        scored.sort(key=lambda x: x[0], reverse=True)

    videos = [v for _s, v in scored]
    total = len(videos)
    start = (page - 1) * page_size
    end = start + page_size
    page_videos = videos[start:end]
    next_page = page + 1 if end < total else None
    return page_videos, total, next_page


def suggestion_videos(query: str, limit=8):
    """
    Return a short list of videos for typeahead suggestions.
    """
    limit = min(max(1, limit), 20)
    candidates = list(get_search_candidates(query)[:50])  # cap DB work
    if not candidates:
        return []
    scored = [(fuzzy_score_video(v, query), v) for v in candidates]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [v for _s, v in scored[:limit]]
