import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from '../../api/api.js'
import styles from './FiveStar.module.css'
import Star from '../../assets/star.svg?react'
import { useAuth } from '../AuthProvider.jsx';

const FiveStar = ({ videoID }) => {
  const navigate = useNavigate()

  const { user } = useAuth()
  const [rating, setRating] = useState(null)
  const [created, setCreated] = useState(false)

  const handleReview = async (value) => {
    if (!user) {
      navigate("/login")
    }

    try {
      if (!created) {
        const payload = { video_id: videoID, rating: value };
        const response = await api.post("api/create-review/", payload)
        console.log("success", response)
        setCreated(true)
      } else {
        const payload = { rating: value };
        const response = await api.patch(`api/edit-review/${reviewId}/`, payload)
        console.log("success", response)
      }

      setRating(value)
    } catch (error) {
      console.log("error", error.response.data)
    }
  }

  return (
    <>
      <div className={styles.container}>
        <Star className={styles.star} onClick={() => handleReview(1)} />
        <Star className={styles.star} onClick={() => handleReview(2)} />
        <Star className={styles.star} onClick={() => handleReview(3)} />
        <Star className={styles.star} onClick={() => handleReview(4)} />
        <Star className={styles.star} onClick={() => handleReview(5)} />
        <Star className={styles.star} onClick={() => handleReview(6)} />
      </div>
    </>
  )
}

export default FiveStar
