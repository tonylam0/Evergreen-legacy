import { useState } from 'react'
import styles from './Homepage.module.css'
import Header from '../../components/Header/Header.jsx'

function Homepage() {
  const [count, setCount] = useState(0)

  return (
    <>
      <header></header>
      <div className={styles.text}>
        <h2>Message from founder</h2>
        <h4> </h4>
      </div >
    </>
  )
}

export default Homepage
