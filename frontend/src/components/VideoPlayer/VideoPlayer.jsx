import styles from "./VideoPlayer.module.css"
import axios from "axios"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Helmet } from "react-helmet-async";
import ReactPlayer from 'react-player';
import Header from '../Header/Header.jsx'

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

  const title = video ? video.title : ""

  return (
    <>
      <Helmet>
        <title>{title} | Evergreen</title>
      </Helmet>

      <div className={styles.container}>
        <Header />

        {!video && <div className={styles.pageNotFound}>
          <h1 className={styles.error}>404</h1>
          <h2 className={styles.errorDesc}>Page not found</h2>
          <p className={styles.errorMessage}>Sorry, the page you are looking for does not exist or an error has occured. Please go back, or head to our homepage at evergreenvideos.com.</p>
        </div>}

        <ReactPlayer
          src={`https://www.youtube.com/watch?v=${id}`}
          autoPlay={1}
          controls
          width="75%"
          height="75%"
          onError={(e) => console.log('ReactPlayer Error:', e)}

          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3
              }
            }
          }}
        />
      </div >
    </>
  )
}

export default VideoPlayer
