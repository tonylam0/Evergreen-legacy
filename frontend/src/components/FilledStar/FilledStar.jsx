import styles from './FilledStar.module.css'
import Star from '../../assets/star.svg?react'

const FilledStar = ({ rating }) => {
  // Rating is from 1-6, display up to 6 stars
  // Show filled stars up to the rating value (rounded)
  const displayRating = Math.round(rating * 10) / 10 // Round to 1 decimal
  const fullStars = Math.floor(displayRating)
  const hasPartialStar = displayRating % 1 > 0
  const emptyStars = 5 - fullStars - (hasPartialStar ? 1 : 0)

  return (
    <div className={styles.container}>
      {Array.from({ length: fullStars }).map((_, index) => (
        <Star key={`full-${index}`} className={styles.filledStar} />
      ))}
      {hasPartialStar && (
        <Star key="partial" className={styles.halfStar} />
      )}
      {Array.from({ length: Math.max(0, emptyStars) }).map((_, index) => (
        <Star key={`empty-${index}`} className={styles.emptyStar} />
      ))}
    </div>
  )
}

export default FilledStar
