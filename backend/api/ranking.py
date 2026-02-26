from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from math import exp, log
from typing import Optional


@dataclass
class VideoAggregates:
    """
    Precomputed per-video aggregates used for Evergreen scoring.

    This is intentionally decoupled from Django models so that the
    scoring logic can be unit-tested in isolation.
    """

    # Core identifiers / metadata
    video_id: int
    publish_date: datetime
    submit_date: datetime
    is_approved: bool
    submitted_by_trusted_curator: bool

    # Rating / quality signals
    avg_rating: Optional[float] = None
    rating_count: int = 0

    # Bookmark / save signals
    bookmark_count: int = 0

    # Comment / discussion signals
    review_count: int = 0
    review_upvote_count: int = 0
    reply_count: int = 0
    reply_upvote_count: int = 0

    # Watch / depth signals (aggregated elsewhere)
    avg_watch_ratio_all_time: Optional[float] = None  # fraction of video watched on avg, 0–1
    completion_rate_all_time: Optional[float] = None  # fraction of sessions reaching ~90%+
    avg_watch_ratio_recent: Optional[float] = None
    completion_rate_recent: Optional[float] = None

    # Longevity buckets (optional, can be None if not computed yet)
    completion_rate_0_3m: Optional[float] = None
    completion_rate_3_12m: Optional[float] = None
    completion_rate_12_36m: Optional[float] = None
    completion_rate_36m_plus: Optional[float] = None

    # Creator / trust signals
    creator_reputation_score: Optional[float] = None  # 0–1


def _safe(value: Optional[float], default: float = 0.0) -> float:
    return default if value is None else float(value)


def _logit(x: float) -> float:
    """Map (0, 1) → (-inf, +inf) in a numerically safe way."""
    eps = 1e-6
    x = max(eps, min(1 - eps, x))
    return log(x / (1 - x))


def _sigmoid(z: float) -> float:
    """Standard logistic; used to keep combined scores in [0, 1]."""
    # Guard against overflow for very large/small z
    if z > 20:
        return 1.0
    if z < -20:
        return 0.0
    return 1.0 / (1.0 + exp(-z))


def compute_quality_signal(agg: VideoAggregates) -> float:
    """
    QualitySignal: Bayesian-averaged rating with boosts for bookmarks
    and thoughtful discussion.

    Output: 0–1
    """
    # Bayesian rating: pull toward prior when rating_count is small.
    prior_mean = 0.7  # prior belief that most videos are "pretty good"
    prior_strength = 10.0

    avg_rating = _safe(agg.avg_rating, default=prior_mean)
    rating_count = max(0, agg.rating_count)

    # Normalise raw rating (1–6 in current model) to 0–1
    # If avg_rating is None, we fall back to prior_mean above.
    rating_min, rating_max = 1.0, 6.0
    rating_span = rating_max - rating_min
    rating_norm = (avg_rating - rating_min) / rating_span if rating_span > 0 else prior_mean
    rating_norm = max(0.0, min(1.0, rating_norm))

    bayesian_weight = rating_count / (rating_count + prior_strength)
    bayesian_rating = bayesian_weight * rating_norm + (1 - bayesian_weight) * prior_mean

    # Bookmark rate proxy: more bookmarks per rating suggest depth.
    # This uses counts only; an aggregation layer can turn this into a true rate.
    bookmark_bonus = min(agg.bookmark_count / 50.0, 0.2)  # cap at +0.2

    # Discussion quality proxy: upvotes dominate, replies are weaker.
    discussion_score = min(
        (agg.review_upvote_count * 1.0 + agg.reply_upvote_count * 0.5) / 100.0,
        0.3,
    )

    raw = bayesian_rating + bookmark_bonus + discussion_score
    return max(0.0, min(1.0, raw))


def compute_longevity_factor(agg: VideoAggregates, now: Optional[datetime] = None) -> float:
    """
    LongevityFactor: reward videos whose depth/completion stay strong
    over time, implementing the “inverse decay” idea.

    Output: 0.5–1.3 (multiplicative factor)
    """
    now = now or datetime.utcnow()
    age_days = max(0.0, (now - agg.publish_date).days)
    age_years = age_days / 365.0 if age_days > 0 else 0.0

    # Start near-neutral for very new videos (we don't yet know if they are evergreen).
    base = 1.0

    # Use recent vs all-time completion as a resilience signal.
    all_time = _safe(agg.completion_rate_all_time, default=0.5)
    recent = _safe(agg.completion_rate_recent, default=all_time)

    # If recent completion is close to or above all-time, we treat that as a sign of durability.
    if all_time <= 0:
        resilience = 0.0
    else:
        resilience = (recent - all_time) / max(all_time, 0.05)

    # Map resilience roughly into [-1, +1] regime.
    resilience = max(-1.0, min(1.0, resilience))

    # Older videos with positive resilience get a modest boost; young videos stay ~1.0.
    if age_years < 0.25:
        multiplier = 1.0 + 0.05 * resilience  # almost neutral for very new content
    elif age_years < 3.0:
        multiplier = 1.0 + 0.15 * resilience
    else:
        multiplier = 1.0 + 0.3 * resilience

    # Clamp to sensible bounds so old-but-mediocre content doesn't dominate.
    return max(0.5, min(1.3, multiplier))


def compute_depth_factor(agg: VideoAggregates) -> float:
    """
    DepthFactor: separate "signal" from "skim/clickbait" using watch behaviour.

    Output: 0.7–1.3 (multiplicative factor)
    """
    watch_ratio = _safe(agg.avg_watch_ratio_all_time, default=0.5)
    completion = _safe(agg.completion_rate_all_time, default=0.5)

    # Combine via log-odds so that improvements near the middle matter more than at extremes.
    z = 0.6 * _logit(watch_ratio) + 0.4 * _logit(completion)
    depth_score = _sigmoid(z)  # 0–1

    # Map 0–1 depth_score into 0.7–1.3 multiplier.
    return 0.7 + 0.6 * depth_score


def compute_relevance_factor(similarity: float) -> float:
    """
    RelevanceFactor: semantic / topical fit for a given context.

    Input:
        similarity: embedding similarity or 0–1 topical match score.

    Output: 0.1–1.0 (multiplicative factor)
    """
    similarity = max(0.0, min(1.0, similarity))
    # Mild non-linearity: penalise weak matches, keep strong matches close to 1.0.
    return 0.1 + 0.9 * (similarity ** 1.5)


def compute_trust_factor(agg: VideoAggregates) -> float:
    """
    TrustFactor: incorporate creator reputation and curator trust.

    Output: 0.8–1.2 (multiplicative factor)
    """
    creator_rep = _safe(agg.creator_reputation_score, default=0.5)
    creator_rep = max(0.0, min(1.0, creator_rep))

    base = 0.9 + 0.3 * creator_rep  # 0.9–1.2

    # Small bonus if submitted by a trusted curator account.
    if agg.submitted_by_trusted_curator:
        base += 0.05

    return max(0.8, min(1.2, base))


def compute_penalty_factor(
    sharp_dropoff_rate: Optional[float] = None,
    ctr: Optional[float] = None,
    completion_rate: Optional[float] = None,
    spam_score: Optional[float] = None,
) -> float:
    """
    PenaltyFactor: downrank clickbait and spammy content.

    Output: 0.3–1.0 (multiplicative factor)
    """
    sharp_dropoff_rate = _safe(sharp_dropoff_rate, default=0.0)
    ctr = _safe(ctr, default=0.0)
    completion_rate = _safe(completion_rate, default=0.5)
    spam_score = _safe(spam_score, default=0.0)  # 0 (clean) – 1 (very spammy)

    penalty = 1.0

    # Strong drop-off early in the video is a major red flag.
    if sharp_dropoff_rate > 0.5:
        penalty -= 0.3
    elif sharp_dropoff_rate > 0.3:
        penalty -= 0.15

    # High CTR but low completion suggests misleading thumbnails/titles.
    if ctr > 0.2 and completion_rate < 0.3:
        penalty -= 0.2

    # Spam / policy signals (e.g. from moderation or heuristic classifier).
    penalty -= 0.4 * spam_score

    return max(0.3, min(1.0, penalty))


def compute_global_evergreen_score(
    agg: VideoAggregates,
    *,
    similarity: float = 1.0,
    penalty_kwargs: Optional[dict] = None,
    now: Optional[datetime] = None,
) -> float:
    """
    Combine all components into a single Evergreen score in [0, 1].

    This is the main entrypoint for global (non-user-specific) scoring.
    """
    if not agg.is_approved:
        # Hard gate: unapproved videos should not be ranked on public surfaces.
        return 0.0

    quality = compute_quality_signal(agg)
    longevity = compute_longevity_factor(agg, now=now)
    depth = compute_depth_factor(agg)
    relevance = compute_relevance_factor(similarity)
    trust = compute_trust_factor(agg)
    penalty = compute_penalty_factor(**(penalty_kwargs or {}))

    # Work in log space to keep numbers stable.
    log_score = (
        log(max(quality, 1e-6))
        + log(longevity)
        + log(depth)
        + log(relevance)
        + log(trust)
        + log(penalty)
    )

    # Map log_score back into 0–1; the constant here can be tuned.
    return _sigmoid(log_score)


def apply_user_affinity(global_score: float, user_affinity: float) -> float:
    """
    Adjust a global evergreen score with bounded user affinity.

    - global_score: 0–1 Evergreen score.
    - user_affinity: recommended to be in [0, 2], where 1 is neutral.
    """
    global_score = max(0.0, min(1.0, global_score))

    # Constrain user affinity so personalization cannot overpower depth/quality.
    user_affinity = max(0.5, min(1.5, user_affinity))

    personalized = global_score * user_affinity
    return max(0.0, min(1.0, personalized))

