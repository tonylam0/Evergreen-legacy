import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './FeaturedReviews.module.css'
import FilledStar from '../FilledStar/FilledStar.jsx'

const FeaturedReviews = ({ videoID, onWriteReview }) => {
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    axios.get(`http://localhost:8000/api/reviews/?video_id=${videoID}&all_reviews=true`)
      .then(response => {
        // Filter to only show reviews with text
        const textReviews = response.data.filter(review =>
          review.review_text && review.review_text.trim().length > 0
        )
        setReviews(textReviews)
      })
      .catch(error => {
        console.log("Error fetching reviews:", error.response?.data || error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [videoID])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Featured Reviews</h2>
        <p>Loading reviews...</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Featured Reviews</h2>
        <button
          className={styles.firstReviewButton}
          onClick={onWriteReview}
        >
          Be the first one to write a review!
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Featured Reviews</h2>
      <div className={styles.reviewsList}>
        {reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <p className={styles.authorName}>{review.author_username}</p>
              <p className={styles.date}>Wrote on {formatDate(review.created_at)}</p>
            </div>
            <p className={styles.reviewText}>
              {review.review_text.length > 150 ? (
                <>
                  {review.review_text.substring(0, 150)}... <span className={styles.readMore}>(read more)</span>
                </>
              ) : (
                review.review_text
              )}
            </p>

            <div className={styles.reviewFooter}>
              <div className={styles.rating}>
                <FilledStar rating={review.rating} />
                <span className={styles.ratingValue}>{review.rating.toFixed(1)}</span>
              </div>

              <div className={styles.upvotes}>
                <span className={styles.upvoteIcon}>↑</span>
                <span className={styles.upvoteCount}>{review.upvote_count} upvotes</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeaturedReviews
