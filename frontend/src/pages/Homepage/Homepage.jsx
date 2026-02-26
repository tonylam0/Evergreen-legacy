import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Homepage.module.css'
import Header from '../../components/Header/Header.jsx'
import Star from '../../assets/star.svg?react'
import api from '../../api/api.js'

function Homepage() {
  const [feed, setFeed] = useState(null)

  useEffect(() => {
    api.get('api/feed/homepage/')
      .then(response => {
        setFeed(response.data)
      })
      .catch(error => {
        console.log(error.response?.data || error)
      })
  }, [])

  const renderVideoCard = (video) => (
    <Link to={`/video/${video.youtube_id}`} className={styles.videoLink} key={video.id}>
      <div className={styles.video}>
        <img src={video.thumbnail_url} alt="thumbnail" className={styles.thumbnail} />
        <h2 className={styles.videoTitle}>{video.title}</h2>
        <div className={styles.underTitle}>
          <p className={styles.nonTitle}>{video.channel_name}</p>
          {video.average_rating && (
            <div className={styles.rating}>
              <Star />
              <p className={styles.nonTitle}>{video.average_rating}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )

  const canon = feed?.canon || []
  const newAndEmerging = feed?.new_and_emerging || []

  return (
    <>
      <div className={styles.container}>
        <Header />

        <div className={styles.videoSection}>
          {canon.map(renderVideoCard)}
        </div>

        {newAndEmerging.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>New &amp; emerging</h2>
            <div className={styles.videoSection}>
              {newAndEmerging.map(renderVideoCard)}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default Homepage
