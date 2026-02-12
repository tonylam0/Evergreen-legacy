import styles from "./VideoPlayer.module.css"
import axios from "axios"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Helmet } from "react-helmet-async";
import ReactPlayer from 'react-player';
import Header from '../Header/Header.jsx'
import FiveStar from '../FiveStar/FiveStar.jsx'

const VideoPlayer = () => {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

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

        <div className={styles.mainContent}>
          <div className={styles.videoHeader}>
            <h1 className={styles.videoTitle}>{video.title}</h1>
            <div className={styles.metadata}>
              <p className={styles.channel_name}>{video.channel_name}</p>
              <p className={styles.publish_date}>{video.publish_date}</p>
              <p className={styles.descLink}>Read description</p>
            </div>
          </div>

          <div className={styles.videoContainer}>
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

          <div className={styles.actionRow}>
            <div className={styles.rating}>
              <h2 className={styles.ratingText}>Rate this video essay</h2>
              <FiveStar />
            </div>
            <button>Write a review</button>
          </div>
        </div>
      </div >
    </>
  )
}

export default VideoPlayer
