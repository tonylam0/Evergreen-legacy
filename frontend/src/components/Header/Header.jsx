import { useState } from 'react';
import styles from './Header.module.css'
import Button from '../Button/Button.jsx'
import { IoIosMenu } from "react-icons/io";
import { Link } from 'react-router-dom'
import ExitButton from '../../assets/x.svg?react'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const openMenu = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false)
    } else {
      setIsMenuOpen(true)
    }
  }

  return (
    <>
      <div className={styles.header}>
        <Link to={"/"} className={styles.logoLink}>
          <h2 id="logo" className={styles.logo}>EVERGREEN</h2>
        </Link>

        <div className={styles.buttons}>
          <Link to={"/signup"}>
            <Button variant={styles.buttonTransparent}>
              Sign Up
            </Button>
          </Link>

          <Link to={"/login"}>
            <Button overrideStyle={styles.buttonGreen}>
              Log in
            </Button>
          </Link>

          <IoIosMenu className={styles.menuButton} onClick={openMenu} />
        </div>

        {isMenuOpen && <div className={styles.menuContainer}>
          <div className={styles.closeArea} onClick={openMenu}></div>
          <div className={styles.sideMenu}>
            <ExitButton className={styles.exitButton} onClick={openMenu} />

            <div className={styles.tabs}>
              <Link to={"/"}>
                <h2 className={styles.tabName}>Explore</h2>
              </Link>

              <Link to={"/evergreen-collection"}>
                <h2 className={styles.tabName}>Evergreen Collection</h2>
              </Link>

              <Link to={"/about"}>
                <h2 className={styles.tabName}>About</h2>
              </Link>

              <Link to={"/contact"}>
                <h2 className={styles.tabName}>Contact</h2>
              </Link>

            </div>
          </div>
        </div>}
      </div>
    </>
  )
}

export default Header
