import styles from './Homepage.module.css'
import Header from '../../components/Header/Header.jsx'

function Homepage() {
  return (
    <>
      <div className={styles.container}>
        <Header></Header>
      </div>
    </>
  )
}

export default Homepage
