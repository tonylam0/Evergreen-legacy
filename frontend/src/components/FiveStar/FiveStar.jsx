import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from '../../api/api.js'
import styles from './FiveStar.module.css'
import Star from '../../assets/star.svg?react'
import { useAuth } from '../AuthProvider.jsx'

const FiveStar = ({ videoID, onRatingChange }) => {
  const navigate = useNavigate()

  const { user } = useAuth()
  const [rating, setRating] = useState(null)
  const [created, setCreated] = useState(false)
  const [reviewID, setReviewID] = useState("")
  const [hoverValue, setHoverValue] = useState(null)

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        try {
          const response = await api.get(`api/reviews/?video_id=${videoID}`)

          if (response.data.length > 0) {
            setCreated(true)
            setRating(response.data[0].rating)  // Get the user's star rating
            setReviewID(response.data[0].id)  // Get the reviewID
            if (onRatingChange) {
              onRatingChange(response.data[0].rating)
            }
          } else {
            if (onRatingChange) {
              onRatingChange(null)
            }
          }
        } catch (error) {
          console.log("error", error.response.data)
          if (onRatingChange) {
            onRatingChange(null)
          }
        }
      } else {
        // User not logged in, no rating
        if (onRatingChange) {
          onRatingChange(null)
        }
      }
    }
    checkStatus()
  }, [videoID, user])

  const handleReview = async (value) => {
    if (!user) {
      navigate("/login")
      return
    }

    // If clicking the same star as current rating, unrate (delete the review)
    if (rating === value && created) {
      try {
        await api.delete(`api/reviews/${reviewID}/`)
        setRating(null)
        setCreated(false)
        setReviewID("")
        if (onRatingChange) {
          onRatingChange(null)
        }
        console.log("success", "Rating removed")
      } catch (error) {
        console.log("error", error.response?.data)
      }
      return
    }

    try {
      if (!created) {
        const payload = { video_id: videoID, rating: value }
        const response = await api.post("api/reviews/", payload)
        console.log("success", response.data)
        setCreated(true)
        setReviewID(response.data.id)
      } else {
        const payload = { rating: value }
        const response = await api.patch(`api/reviews/${reviewID}/`, payload)
        console.log("success", response.data)
      }

      setRating(value)
      if (onRatingChange) {
        onRatingChange(value)
      }
    } catch (error) {
      console.log("error", error.response?.data)
    }
  }

  return (
    <>
      <div
        className={styles.container}
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = rating != null && value <= rating
          const isHoverLit = hoverValue != null && value <= hoverValue
          return (
            <Star
              key={value}
              className={`${styles.star} ${isFilled ? styles.filled : ''} ${isHoverLit ? styles.hoverLit : ''}`}
              onClick={() => handleReview(value)}
              onMouseEnter={() => setHoverValue(value)}
            />
          )
        })}
      </div>
    </>
  )
}

export default FiveStar
