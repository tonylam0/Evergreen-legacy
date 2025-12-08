import styles from './Header.module.css'
import Button from '../Button/Button.jsx'

const Header = () => {
  return (
    <>
      <div className={styles.header}>
        <h2 id="logo" className={styles.logo}>EVERGREEN</h2>
        <div className={styles.tabs}>
          <h4 id="explore" className={styles.tabName}>Explore</h4>
          <h4 id="evergreenCollection" className={styles.tabName}>My Evergreen Collection</h4>
          <h4 id="about" className={styles.tabName}>About</h4>
          <h4 id="contact" className={styles.tabName}>Contact</h4>
          <h4 id="support" className={styles.tabName}>Support Us</h4>
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
