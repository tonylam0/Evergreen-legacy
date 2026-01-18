import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './Homepage.module.css'
import Header from '../../components/Header/Header.jsx'

function Homepage() {
  const [videos, setVideos] = useState()

  useEffect(() => {
    axios.get('http://localhost:8000/api/videos/')
      .then(response => {
        console.log(response.data)
        setVideos(response.data)
      })
      .catch(error => {
        console.log('bow')
        console.log(error.data)
      })
  }, [])

  return (
    <>
      <div className={styles.container}>
        <div className={styles.middle}>
        </div>
        <Header />

        <div className={styles.videoSection}>
          {videos && videos.map((key) => (
            <div className={styles.video} key={key.id}>
              <img src={key.thumbnail_url} alt="thumbnail" className={styles.thumbnail}></img>
              <h2 className={styles.videoTitle}>{key.title}</h2>
              <p className={styles.channelName}>{key.channel_name}</p>
            </div>
          ))}
        </div>

      </div >
    </>
  )
}

export default Homepage
