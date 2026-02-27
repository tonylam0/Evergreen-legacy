import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Homepage.module.css'
import Header from '../../components/Header/Header.jsx'
import VideoCardSkeleton from '../../components/VideoCardSkeleton/VideoCardSkeleton.jsx'
import Star from '../../assets/star.svg?react'
import api from '../../api/api.js'

const PAGE_SIZE = 24
const SKELETON_COUNT = 12

function Homepage() {
  const [results, setResults] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [feedSeed, setFeedSeed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef(null)

  const loadPage = useCallback((page, append = false, seedForPagination = null) => {
    const isFirst = page === 1
    if (isFirst) setLoading(true)
    else setLoadingMore(true)

    const params = { page, page_size: PAGE_SIZE }
    if (page > 1 && seedForPagination != null) params.seed = seedForPagination

    api.get('api/feed/homepage/', { params })
      .then((res) => {
        const list = res.data.results || []
        const next = res.data.next ?? null
        if (res.data.seed != null) setFeedSeed(res.data.seed)
        setNextPage(next)
        setResults((prev) => (append ? [...prev, ...list] : list))
      })
      .catch(() => {
        setNextPage(null)
        setResults((prev) => (append ? prev : []))
      })
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }, [])

  useEffect(() => {
    loadPage(1, false)
  }, [loadPage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting || loading || loadingMore || !nextPage) return
        loadPage(nextPage, true, feedSeed)
      },
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loading, loadingMore, nextPage, feedSeed, loadPage])

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

  const showSkeletons = loading && results.length === 0

  return (
    <>
      <div className={styles.container}>
        <Header />

        {showSkeletons ? (
          <div className={styles.videoSection}>
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className={styles.videoSection}>
              {results.map(renderVideoCard)}
            </div>
            {loadingMore && (
              <div className={styles.loadMoreSkeletons}>
                {Array.from({ length: 6 }, (_, i) => (
                  <VideoCardSkeleton key={`more-${i}`} />
                ))}
              </div>
            )}
            <div ref={sentinelRef} className={styles.sentinel} aria-hidden />
          </>
        )}
      </div>
    </>
  )
}

export default Homepage
