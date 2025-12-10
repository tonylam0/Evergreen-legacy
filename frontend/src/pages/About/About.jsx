import styles from './About.module.css'
import Header from '../../components/Header/Header.jsx'

function Homepage() {
  return (
    <>
      <div className={styles.container}>
      <Header></Header>
      <div className={styles.text}>
        <h2>Message from founder</h2>
        <h4> </h4>
      </div>
      </div>
    </>
  )
}

export default Homepage
