import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header/Header.jsx'
import VideoCardSkeleton from '../../components/VideoCardSkeleton/VideoCardSkeleton.jsx'
import Star from '../../assets/star.svg?react'
import api from '../../api/api.js'
import styles from './SearchPage.module.css'

const PAGE_SIZE = 24
const RECENT_SEARCHES_KEY = 'evergreen_recent_searches'
const RECENT_SEARCHES_MAX = 10

function saveRecentSearch(query) {
  const trimmed = (query || '').trim()
  if (!trimmed) return
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    const list = raw ? JSON.parse(raw) : []
    const filtered = list.filter((q) => q !== trimmed)
    filtered.unshift(trimmed)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered.slice(0, RECENT_SEARCHES_MAX)))
  } catch (_) {}
}

function SearchPage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'relevance'

  const [results, setResults] = useState([])
  const [count, setCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef(null)

  const loadPage = useCallback((page, append = false) => {
    if (!q.trim()) {
      setResults([])
      setCount(0)
      setNextPage(null)
      setLoading(false)
      return
    }
    const isFirst = page === 1
    if (isFirst) setLoading(true)
    else setLoadingMore(true)

    api.get('api/search/', {
      params: { q: q.trim(), sort, page, page_size: PAGE_SIZE },
    })
      .then((res) => {
        const list = res.data.results || []
        const total = res.data.count ?? 0
        const next = res.data.next ?? null
        setCount(total)
        setNextPage(next)
        setResults((prev) => (append ? [...prev, ...list] : list))
      })
      .catch(() => {
        setResults((prev) => (append ? prev : []))
        setNextPage(null)
      })
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }, [q, sort])

  useEffect(() => {
    loadPage(1, false)
  }, [loadPage])

  useEffect(() => {
    if (q.trim()) saveRecentSearch(q)
  }, [q])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting || loading || loadingMore || !nextPage) return
        loadPage(nextPage, true)
      },
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loading, loadingMore, nextPage, loadPage])

  const renderVideoCard = (video) => (
    <Link to={`/video/${video.youtube_id}`} className={styles.videoLink} key={video.id}>
      <div className={styles.video}>
        <img src={video.thumbnail_url} alt="" className={styles.thumbnail} />
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
  const skeletonCount = 12

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        {!q.trim() ? (
          <p className={styles.emptyMessage}>Enter a search query above.</p>
        ) : (
          <>
            <h1 className={styles.pageTitle}>
              Search results for &ldquo;{q}&rdquo;
              {count > 0 && (
                <span className={styles.count}> ({count})</span>
              )}
            </h1>

            {showSkeletons ? (
              <div className={styles.videoSection}>
                {Array.from({ length: skeletonCount }, (_, i) => (
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

            {!loading && results.length === 0 && q.trim() && (
              <p className={styles.emptyMessage}>No videos found.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SearchPage
