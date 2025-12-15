import { useState } from 'react'
import styles from './Homepage.module.css'
import Header from '../../components/Header/Header.jsx'
import Button from '../../components/Button/Button.jsx'
import InputBox from '../../components/InputBox/InputBox.jsx'
import Popup from '../../components/Popup/Popup.jsx'

function Homepage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

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
            <InputBox input={styles.searchBox} placeholder="Search"></InputBox>
          </div>
        </div>

        {isModalOpen && <div className={styles.modal}>
          <Popup updateCallback={onUpdate}></Popup>
        </div>
        }
      </div>
    </>
  )
}

export default Homepage
