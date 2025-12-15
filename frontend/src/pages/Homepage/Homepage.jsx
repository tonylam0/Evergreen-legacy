import { useState } from 'react'
import styles from './Homepage.module.css'
import Header from '../../components/Header/Header.jsx'
import Button from '../../components/Button/Button.jsx'
import InputBox from '../../components/InputBox/InputBox.jsx'
import Popup from '../../components/Popup/Popup.jsx'
import SearchIcon from '../../assets/search.svg?react'
import Arrow from '../../assets/arrow.svg?react'

function Homepage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [feedType, setFeedType] = useState("Top rated")

  const openModal = () => {
    if (!isModalOpen) {
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const onUpdate = () => {
    closeModal()
  }

  const openMenu = () => {
    if (!isMenuOpen) {
      setIsMenuOpen(true)
    }
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const changeFeedType = () => {
    if (feedType === "Top rated") {
      setFeedType("Newest")
    } else {
      setFeedType("Top rated")
    }
  }


  return (
    <>
      <div className={styles.container}>
        <div className={styles.middle}>
        </div>
        <Header tabExplore={styles.tabExplore}></Header>

        <div className={styles.hero}>
          <h2 className={styles.heroText}>Share, review, & discover video essays</h2>
          <div className={styles.interactiveHero}>
            <Button variant={styles.submitButton} childrenStyle={styles.submitChildren} onClick={openModal}>Submit video</Button>
            <div className={styles.searchBar}>
              <InputBox input={styles.searchBox} placeholder="Search"></InputBox>
              <SearchIcon className={styles.searchIcon}></SearchIcon>
            </div>
          </div>
        </div>

        {isModalOpen && <div className={styles.modal}>
          <Popup updateCallback={onUpdate}>
            <div className={styles.popupContent}>
              <h1 className={styles.title}>Submit a video</h1>
              <div className={styles.submission}>
                <InputBox input={styles.importInput} placeholder="Paste a YouTube link"></InputBox>
                <Button variant={styles.importButton} childrenStyle={styles.importChildren}>Import</Button>
              </div>
            </div>
          </Popup>
        </div>
        }

        <div className={styles.menu}>
          <Button variant={styles.menuButton} childrenStyle={styles.menuChildren} onClick={openMenu}>
            <div className={styles.buttonContainer}>
              {feedType}
              <Arrow className={styles.menuArrow}></Arrow>
            </div>
          </Button>

          {isMenuOpen && <div className={styles.menuOptions}>

          </div>
          }
        </div>

      </div >
    </>
  )
}

export default Homepage
