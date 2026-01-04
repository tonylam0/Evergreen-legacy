import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './Homepage.module.css'
import Header from '../../components/Header/Header.jsx'
import InputBox from '../../components/InputBox/InputBox.jsx'
import Popup from '../../components/Popup/Popup.jsx'
import SearchIcon from '../../assets/search.svg?react'
import Arrow from '../../assets/arrow.svg?react'

function Homepage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [videos, setVideos] = useState()

  const openModal = () => {
    if (!isModalOpen) {
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
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
        <Header></Header>

        {/* <div className={styles.hero}> */}
        {/*   <h2 className={styles.heroText}>Share, review, & discover video essays</h2> */}
        {/*   <div className={styles.interactiveHero}> */}
        {/*     <button variant={styles.submitButton} childrenStyle={styles.submitChildren} onClick={openModal}>Submit video</button> */}
        {/*     <div className={styles.searchBar}> */}
        {/*       <InputBox input={styles.searchBox} placeholder="Search"></InputBox> */}
        {/*       <SearchIcon className={styles.searchIcon}></SearchIcon> */}
        {/*     </div> */}
        {/*   </div> */}
        {/* </div> */}

        {isModalOpen && <div className={styles.modal}>
          <Popup updateCallback={closeModal}>
            <div className={styles.popupContent}>
              <h1 className={styles.title}>Submit a video</h1>
              <div className={styles.submission}>
                <InputBox input={styles.importInput} placeholder="Paste a YouTube link"></InputBox>
                <button variant={styles.importButton} childrenStyle={styles.importChildren}>Import</button>
              </div>
            </div>
          </Popup>
        </div>
        }

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
