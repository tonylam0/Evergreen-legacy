import { useState } from 'react';
import styles from './Header.module.css'
import { IoIosMenu } from "react-icons/io";
import { Link } from 'react-router-dom'
import ExitButton from '../../assets/x.svg?react'
import InputBox from '../InputBox/InputBox.jsx'
import SearchIcon from '../../assets/search.svg?react'
import SubmitIcon from '../../assets/submit.svg?react'

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
        <Link to={"/"} className={styles.logoLink} reloadDocument>
          <h2 id="logo" className={styles.logo}>EVERGREEN</h2>
        </Link>


        <div className={styles.navRight}>
          <div className={styles.searchContainer}>
            <SearchIcon className={styles.searchIcon}></SearchIcon>
            <InputBox input={styles.searchBar} type="text" placeholder="Search"></InputBox>
          </div>

          <IoIosMenu className={styles.menuButton} onClick={openMenu} />
        </div>

        {isMenuOpen && <div className={styles.menuContainer}>
          <div className={styles.closeArea} onClick={openMenu}></div>
          <div className={styles.sideMenu}>
            <ExitButton className={styles.exitButton} onClick={openMenu} />

            <div className={styles.tabs}>
              <Link to={"/"} reloadDocument>
                <h2 className={styles.tabName}>Home</h2>
              </Link>

              <Link to={"/evergreen-collection"} reloadDocument>
                <h2 className={styles.tabName}>Evergreen Collection</h2>
              </Link>

              <Link to={"/about"} reloadDocument>
                <h2 className={styles.tabName}>About</h2>
              </Link>

              <Link to={"/contact"} reloadDocument>
                <h2 className={styles.tabName}>Contact</h2>
              </Link>

              <Link to={"/signup"} reloadDocument>
                <h2 className={styles.tabName}>Sign up</h2>
              </Link>

              <Link to={"/login"} reloadDocument>
                <h2 className={styles.tabName}>Log in</h2>
              </Link>
            </div>
          </div>
        </div>}
      </div >
    </>
  )
}

export default Header
