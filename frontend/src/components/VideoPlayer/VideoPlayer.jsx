import styles from "./VideoPlayer.module.css"
import axios from "axios"
import api from "../../api/api.js"
import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Helmet } from "react-helmet-async";
import ReactPlayer from 'react-player';
import Header from '../Header/Header.jsx'
import FiveStar from '../FiveStar/FiveStar.jsx'
import FeaturedReviews from '../FeaturedReviews/FeaturedReviews.jsx'
import Popup from '../Popup/Popup.jsx'
import { useAuth } from '../AuthProvider.jsx'

const VideoPlayer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [video, setVideo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasRating, setHasRating] = useState(false)
  const [isReviewPopupOpen, setIsReviewPopupOpen] = useState(false)
  const [isDescriptionPopupOpen, setIsDescriptionPopupOpen] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [currentRating, setCurrentRating] = useState(null)
  const [reviewID, setReviewID] = useState(null)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  const openReviewPopup = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      const response = await api.get(`api/reviews/?video_id=${id}`)
      if (response.data.length > 0) {
        const review = response.data[0]
        setReviewID(review.id)
        setReviewText(review.review_text || '')
        setCurrentRating(review.rating)
        setHasRating(true)
        console.log(review)
      }
    } catch (error) {
      console.log(error.response?.data || error)
    }

    setIsReviewPopupOpen(true)
  }

  const closeReviewPopup = () => {
    setIsReviewPopupOpen(false)
  }

  const handleWriteReview = () => {
    openReviewPopup()
  }

  const openDescriptionPopup = () => {
    setIsDescriptionPopupOpen(true)
  }

  const closeDescriptionPopup = () => {
    setIsDescriptionPopupOpen(false)
  }

  useEffect(() => {
    setIsLoading(true)
    axios.get(`http://localhost:8000/api/videos/${id}/`)
      .then(response => {
        setVideo(response.data)
      })
      .catch(error => {
        console.log(error.data)
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id])

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (!video) {
    return <div className={styles.pageNotFound}>
      <Header />
      <div className={styles.errorContent}>
        <h1 className={styles.error}>404</h1>
        <h2 className={styles.errorDesc}>Page not found</h2>
        <p className={styles.errorMessage}>Sorry, the page you are looking for does not exist or an error has occured. Please go back, or head to our homepage at evergreenvideos.com.</p>
      </div>
    </div>
  }

  return (
    <>
      <Helmet>
        <title>{video.title} | Evergreen</title>
      </Helmet>

      <Header />
      <div className={styles.container}>
        {!video && <div className={styles.pageNotFound}>
          <h1 className={styles.error}>404</h1>
          <h2 className={styles.errorDesc}>Page not found</h2>
          <p className={styles.errorMessage}>Sorry, the page you are looking for does not exist or an error has occured. Please go back, or head to our homepage at evergreenvideos.com.</p>
        </div>}

        <div className={styles.contentWrapper}>
          <div className={styles.mainContent}>
            <div className={styles.videoHeader}>
              <h1 className={styles.videoTitle}>{video.title}</h1>
              <div className={styles.metadata}>
                <p className={styles.channel_name}>{video.channel_name}</p>
                <span className={styles.separator}>•</span>
                <p className={styles.publish_date}>{formatDate(video.publish_date)}</p>
                <span className={styles.separator}>•</span>
                <p className={styles.descLink} onClick={openDescriptionPopup}>Read description</p>
              </div>
            </div>

            <div className={styles.videoContainer}>
              <div className={styles.videoWrapper}>
                <ReactPlayer
                  src={`https://www.youtube.com/watch?v=${id}`}
                  autoPlay={1}
                  controls
                  width={"100%"}
                  height={"100%"}
                  onError={(e) => console.log('ReactPlayer Error:', e)}
                  className={styles.embeddedVideo}
                />
              </div>
            </div>

            <div className={styles.ratingSection}>
              <h2 className={styles.ratingText}>Rate this video essay</h2>
              <div className={styles.ratingContainer}>
                <FiveStar
                  videoID={id}
                  onRatingChange={(rating) => {
                    setHasRating(rating !== null)
                    setCurrentRating(rating)
                  }}
                />
                <button className={styles.writeReviewButton} onClick={openReviewPopup}>
                  {hasRating ? 'Edit your review' : 'Write a review'}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <FeaturedReviews videoID={id} onWriteReview={handleWriteReview} />
          </div>
        </div>
      </div >

      {isReviewPopupOpen && (
        <Popup updateCallback={closeReviewPopup} overrideStyle={styles.reviewModal}>
          <div className={styles.reviewPopupContent}>
            <div className={styles.reviewVideoInfo}>
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className={styles.reviewThumbnail}
              />
              <div className={styles.reviewTextInfo}>
                <p className={styles.reviewChannel}>{video.channel_name}</p>
                <h2 className={styles.reviewTitle}>{video.title}</h2>
              </div>
            </div>

            <div className={styles.reviewRatingRow}>
              <p className={styles.reviewRatingLabel}>Rate this video</p>
              <FiveStar
                videoID={id}
                onRatingChange={(rating) => {
                  setHasRating(rating !== null)
                  setCurrentRating(rating)
                }}
              />
            </div>

            <div className={styles.reviewFormArea}>
              <p className={styles.reviewPrompt}>What do you think about the video?</p>
              <textarea
                className={styles.reviewTextarea}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className={styles.reviewActions}>
              <button
                type="button"
                className={styles.reviewCancelButton}
                onClick={closeReviewPopup}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.reviewPostButton}
                onClick={async () => {
                  if (!user) {
                    navigate('/login')
                    return
                  }

                  try {
                    if (reviewID) {
                      await api.patch(`api/reviews/${reviewID}/`, {
                        rating: currentRating,
                        review_text: reviewText,
                      })
                    } else {
                      const payload = {
                        video_id: id,
                        rating: currentRating || 0,
                        review_text: reviewText,
                      }
                      const response = await api.post("api/reviews/", payload)
                      setReviewID(response.data.id)
                    }
                    setHasRating(currentRating != null)
                    closeReviewPopup()
                  } catch (error) {
                    console.log(error.response?.data || error)
                  }
                }}
              >
                Post
              </button>
            </div>
          </div>
        </Popup>
      )}

      {isDescriptionPopupOpen && (
        <Popup updateCallback={closeDescriptionPopup} overrideStyle={styles.descriptionModal}>
          <div className={styles.descriptionPopupContent}>
            <h2 className={styles.descriptionTitle}>Description</h2>

            <div className={styles.descriptionStats}>
              {video.average_rating && (
                <p className={styles.descriptionStat}>
                  <span className={styles.descriptionStatLabel}>Rating:</span> {video.average_rating}
                </p>
              )}
              {typeof video.evergreen_score === 'number' && (
                <p className={styles.descriptionStat}>
                  <span className={styles.descriptionStatLabel}>Evergreen score:</span>{" "}
                  {video.evergreen_score.toFixed(2)}
                </p>
              )}
            </div>

            <div className={styles.descriptionBody}>
              <p className={styles.descriptionLabel}>Creator's description</p>
              <div className={styles.descriptionText}>
                {video.description}
              </div>
            </div>
          </div>
        </Popup>
      )}
    </>
  )
}

export default VideoPlayer
