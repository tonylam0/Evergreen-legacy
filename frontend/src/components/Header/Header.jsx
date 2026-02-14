import { useState } from 'react';
import { IoIosMenu } from "react-icons/io";
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider.jsx';
import api from "../../api/api.js"
import styles from './Header.module.css'
import ExitButton from '../../assets/x.svg?react'
import InputBox from '../InputBox/InputBox.jsx'
import SearchIcon from '../../assets/search.svg?react'
import PlusIcon from '../../assets/plus.svg?react'
import Popup from '../../components/Popup/Popup.jsx'

const Header = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user, logout } = useAuth()
  const [videoLink, setVideoLink] = useState({
    "url": ""
  })

  const openModal = () => {
    if (user) {
      if (!isModalOpen) {
        setIsModalOpen(true)
      }
    } else {
      navigate("/login")
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const openMenu = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false)
    } else {
      setIsMenuOpen(true)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (user) {
      try {
        const response = await api.post("api/submit-video/", videoLink)
        console.log("success", response)
        window.location.reload();
      } catch (error) {
        console.log("error", error.response.data)
      }
    } else {
      navigate("/login")
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setVideoLink({
      [name]: value
    })
  }

  return (
    <>
      <div className={styles.header}>
        <Link to={"/"} className={styles.logoLink} reloadDocument>
          <h2 id="logo" className={styles.logo}>EVERGREEN</h2>
        </Link>

        <div className={styles.navRight}>
          <button className={styles.submitButton} onClick={openModal} aria-label='Submit new video'>
            <PlusIcon className={styles.submitIcon} />
          </button>

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

              {user ? (
                <h2 className={styles.tabName} onClick={logout}>Log out</h2>
              ) : (
                <div className={styles.authTabs}>
                  <Link to={"/signup"} reloadDocument>
                    <h2 className={styles.tabName}>Sign up</h2>
                  </Link>

                  <Link to={"/login"} reloadDocument>
                    <h2 className={styles.tabName}>Log in</h2>
                  </Link>
                </div>
              )
              }
            </div>
          </div>
        </div>}

        {isModalOpen && <div className={styles.modalContainer}>
          <Popup updateCallback={closeModal} overrideStyle={styles.modal}>
            <div className={styles.popupContent}>
              <h1 className={styles.title}>Submit a video</h1>
              <p className={styles.submitDescription}>Submit your favorite video essays from YouTube</p>

              <div className={styles.submission}>
                <form onSubmit={handleSubmit} className={styles.submitForm}>
                  <InputBox input={styles.importInput} name="url" placeholder="Paste a YouTube link" onChange={handleChange}></InputBox>
                  <button className={styles.importButton}>Import</button>
                </form>
              </div>
            </div>
          </Popup>
        </div >
        }
      </div >
    </>
  )
}

export default Header
