import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './Homepage.module.css'
import Header from '../../components/Header/Header.jsx'
import Star from '../../assets/star.svg?react'

function Homepage() {
  const [videos, setVideos] = useState()

  useEffect(() => {
    axios.get('http://localhost:8000/api/videos/')
      .then(response => {
        setVideos(response.data)
      })
      .catch(error => {
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
              <div className={styles.underTitle}>
                <p className={styles.nonTitle}>{key.channel_name}</p>
                {key.average_rating ? (< div className={styles.rating}>
                  <Star />
                  <p className={styles.nonTitle}>{key.average_rating}</p>
                </div>) : (<div className={styles.rating}>
                  <p className={styles.unrated}>Unrated</p>
                </div>)
                }
              </div>
            </div>
          ))}
        </div>

      </div >
    </>
  )
}

export default Homepage
