import styles from './Popup.module.css'
import ExitButton from '../../assets/x.svg?react'

const Popup = ({ updateCallback, overrideStyle, title }) => {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.closeArea} onClick={updateCallback}></div>
        <div className={`${styles.modal} ${overrideStyle}`}>
          <ExitButton onClick={updateCallback} className={styles.exitButton}></ExitButton>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div >
    </>
  )
}

export default Popup
