import { useState, useEffect } from 'react'
import axios from 'axios'
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
  const [topRatedStyle, setTopRatedStyle] = useState(styles.selected)
  const [newestStyle, setNewestStyle] = useState(styles.notSelected)
  const [arrowRotation, setArrowRotation] = useState('0deg')

  const [videos, setVideos] = useState()

  const openModal = () => {
    if (!isModalOpen) {
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const updateMenu = () => {
    if (!isMenuOpen) {
      setIsMenuOpen(true)
      setArrowRotation('270deg')
    } else {
      setIsMenuOpen(false)
      setArrowRotation('0deg')
    }
  }

  const changeFeedType = () => {
    if (feedType === "Top rated") {
      setFeedType("Newest")
      setTopRatedStyle(styles.notSelected)
      setNewestStyle(styles.selected)
    } else {
      setFeedType("Top rated")
      setTopRatedStyle(styles.selected)
      setNewestStyle(styles.notSelected)
    }
  }

  useEffect(() => {
    axios.get('http://localhost:8000/api/videos/')
      .then(response => {
        console.log(response.data)
        setVideos(response.data)
      })
      .catch(error => {
        console.log('bow')
        console.log(error.data)
      })
  }, [])

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
          <Popup updateCallback={closeModal}>
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

        {/* <div className={styles.menu}> */}
        {/*   <Button variant={styles.menuButton} childrenStyle={styles.menuChildren} onClick={updateMenu}> */}
        {/*     <div className={styles.buttonContainer}> */}
        {/*       {feedType} */}
        {/*       <Arrow className={styles.menuArrow} style={{ */}
        {/*         transform: `rotate(${arrowRotation})` */}
        {/*       }}></Arrow> */}
        {/*     </div> */}
        {/*   </Button> */}
        {/**/}
        {/*   {isMenuOpen && <div className={styles.menuOptions}> */}
        {/*     <button className={topRatedStyle} onClick={changeFeedType}>Top rated</button> */}
        {/*     <button className={newestStyle} onClick={changeFeedType}>Newest</button> */}
        {/*   </div> */}
        {/*   } */}
        {/* </div> */}

        {/* <div className={styles.videoSection}> */}
        {/*   {videos && videos.map((key) => ( */}
        {/*     <div className={styles.video} key={key.id}> */}
        {/*       <img src={key.thumbnail_url} alt="thumbnail" className={styles.thumbnail}></img> */}
        {/*       <h2>{key.title}</h2> */}
        {/*     </div> */}
        {/*   ))} */}
        {/* </div> */}
      </div>
    </>
  )
}

export default Homepage
