import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header.jsx'
import FilledStar from '../../components/FilledStar/FilledStar.jsx'
import Star from '../../assets/star.svg?react'
import api from '../../api/api.js'
import styles from './Profile.module.css'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get('api/profile/')
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.response?.status === 401 ? 'Please log in.' : 'Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loading}>Loading profile...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.error}>{error || 'Profile not found.'}</div>
      </div>
    )
  }

  const { username, date_joined, stats, submitted_videos, top_reviews, reviewed_video_ids } = profile
  const reviewedSet = new Set(reviewed_video_ids || [])

  return (
    <div className={styles.container}>
      <Header />

      <section className={styles.profileHeader}>
        <div className={styles.avatar} aria-hidden>
          {username ? username.charAt(0).toUpperCase() : '?'}
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.username}>{username}</h1>
            <Link to="/profile/edit" className={styles.editAccount}>(edit account)</Link>
          </div>
          <p className={styles.joined}>Joined {formatDate(date_joined)}</p>
          <div className={styles.statsRow}>
            {stats.average_rating != null && (
              <div className={styles.avgRating}>
                <span className={styles.avgValue}>{stats.average_rating} (avg)</span>
                <FilledStar rating={stats.average_rating} />
              </div>
            )}
            <p className={styles.counts}>
              {stats.rating_count} ratings • {stats.review_text_count} reviews • {stats.submitted_video_count} submitted videos
            </p>
          </div>
        </div>
      </section>

      <hr className={styles.divider} />

      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <h2 className={styles.sectionTitle}>Submitted Videos</h2>
          <div className={styles.videoStrip}>
            {submitted_videos.length === 0 ? (
              <p className={styles.emptyMessage}>No submitted videos yet.</p>
            ) : (
              submitted_videos.map((video) => (
                <div key={video.id} className={styles.videoCard}>
                  <Link to={`/video/${video.youtube_id}`} className={styles.videoLink}>
                    <img
                      src={video.thumbnail_url}
                      alt=""
                      className={styles.thumbnail}
                    />
                    <h3 className={styles.videoTitle}>{video.title}</h3>
                    <div className={styles.videoMeta}>
                      {video.average_rating && (
                        <span className={styles.rating}>
                          <Star className={styles.starIcon} />
                          {video.average_rating}
                        </span>
                      )}
                    </div>
                    {reviewedSet.has(video.youtube_id) && (
                      <Link
                        to={`/video/${video.youtube_id}`}
                        className={styles.readReview}
                        onClick={(e) => e.stopPropagation()}
                      >
                        read review
                      </Link>
                    )}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className={styles.rightColumn}>
          <h2 className={styles.sectionTitle}>Top Reviews</h2>
          <div className={styles.reviewsList}>
            {top_reviews.length === 0 ? (
              <p className={styles.emptyMessage}>No reviews yet.</p>
            ) : (
              top_reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <h3 className={styles.reviewCardTitle}>{review.video_title}</h3>
                  <p className={styles.reviewDate}>Wrote on {formatDate(review.created_at)}</p>
                  <p className={styles.reviewText}>
                    {review.review_text.length > 150 ? (
                      <>
                        {review.review_text.substring(0, 150)}...{' '}
                        <Link to={`/video/${review.video_id}`} className={styles.readMore}>
                          (read more)
                        </Link>
                      </>
                    ) : (
                      review.review_text
                    )}
                  </p>
                  <div className={styles.reviewFooter}>
                    <div className={styles.reviewRating}>
                      <FilledStar rating={review.rating} />
                      <span className={styles.ratingValue}>{Number(review.rating).toFixed(1)}</span>
                    </div>
                    <div className={styles.upvotes}>
                      <span className={styles.upvoteIcon}>↑</span>
                      <span>{review.upvote_count} upvotes</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Profile
