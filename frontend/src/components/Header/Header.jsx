import styles from './Header.module.css'
import Button from '../Button/Button.jsx'
import { Link } from 'react-router-dom'

const Header = (props) => {
  return (
    <>
      <div className={styles.header}>
        <h2 id="logo" className={styles.logo}>EVERGREEN</h2>
        <div className={styles.tabs}>
          <Link to={"/"}>
            <h3 id="explore" className={`${styles.tabName} ${styles.tabExplore} ${props.tabExplore}`}>Explore</h3>
          </Link>

          <Link to={"/evergreencollection"}>
            <h3 id="evergreenCollection" className={`${styles.tabName} ${styles.tabEC} ${props.tabEC}`}>My Evergreen Collection</h3>
          </Link>

          <Link to={"/about"}>
            <h3 id="about" className={`${styles.tabName} ${styles.tabAbout} ${props.tabAbout}`}>About</h3>
          </Link>

          <Link to={"/contact"}>
            <h3 id="contact" className={`${styles.tabName} ${styles.tabContact} ${props.tabContact}`}>Contact</h3>
          </Link>

          <Link to={"/support"}>
            <h3 id="support" className={`${styles.tabName} ${styles.tabSupport} ${props.tabSupport}`}>Support Us</h3>
          </Link>
        </div>
        <div className={styles.buttons}>
          <Link to={"/signup"}>
            <Button overrideStyle={styles.buttonTransparent}>
              Sign Up
            </Button>
          </Link>

          <Link to={"/login"}>
            <Button overrideStyle={styles.buttonGreen}>
              Log in
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}

export default Header
