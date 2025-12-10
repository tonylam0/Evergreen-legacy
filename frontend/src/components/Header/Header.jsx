import styles from './Header.module.css'
import Button from '../Button/Button.jsx'

const Header = () => {
  return (
    <>
      <div className={styles.header}>
        <h2 id="logo" className={styles.logo}>EVERGREEN</h2>
        <div className={styles.tabs}>
          <h3 id="explore" className={`${styles.tabName} ${styles.tabExplore}`}>Explore</h3>
          <h3 id="evergreenCollection" className={`${styles.tabName} ${styles.tabEC}`}>My Evergreen Collection</h3>
          <h3 id="about" className={`${styles.tabName} ${styles.tabAbout}`}>About</h3>
          <h3 id="contact" className={`${styles.tabName} ${styles.tabContact}`}>Contact</h3>
          <h3 id="support" className={`${styles.tabName} ${styles.tabSupport}`}>Support Us</h3>
        </div>
        <div className={styles.buttons}>
          <Button overrideStyle={styles.buttonTransparent}>
            Sign Up
          </Button>
          <Button overrideStyle={styles.buttonGreen}>
            Log in
          </Button>
        </div>
      </div>
    </>
  )
}

export default Header
