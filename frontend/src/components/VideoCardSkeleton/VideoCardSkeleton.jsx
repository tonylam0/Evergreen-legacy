import styles from './VideoCardSkeleton.module.css'

export default function VideoCardSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.thumbnail} />
      <div className={styles.titleLine1} />
      <div className={styles.titleLine2} />
      <div className={styles.meta}>
        <div className={styles.channel} />
        <div className={styles.rating} />
      </div>
    </div>
  )
}
