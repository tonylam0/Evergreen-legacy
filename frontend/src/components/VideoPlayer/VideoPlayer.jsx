import styles from "./VideoPlayer.module.css"
import axios from "axios"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Helmet } from "react-helmet-async";
import ReactPlayer from 'react-player';
import Header from '../Header/Header.jsx'
import FiveStar from '../FiveStar/FiveStar.jsx'
import FeaturedReviews from '../FeaturedReviews/FeaturedReviews.jsx'

const VideoPlayer = () => {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasRating, setHasRating] = useState(false)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  const handleWriteReview = () => {
    // Scroll to the write review button or focus on it
    const writeReviewButton = document.querySelector(`.${styles.writeReviewButton}`)
    if (writeReviewButton) {
      writeReviewButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
      writeReviewButton.focus()
    }
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
                <p className={styles.descLink}>Read description</p>
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
                <FiveStar videoID={id} onRatingChange={(rating) => setHasRating(rating !== null)} />
                <button className={styles.writeReviewButton}>
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
    </>
  )
}

export default VideoPlayer
