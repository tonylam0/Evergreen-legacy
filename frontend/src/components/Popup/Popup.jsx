import styles from './Popup.module.css'
import ExitButton from '../../assets/x.svg?react'

const Popup = ({ updateCallback, overrideStyle, children }) => {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.closeArea} onClick={updateCallback}></div>
        <div className={`${styles.modal} ${overrideStyle}`}>
          <ExitButton onClick={updateCallback} className={styles.exitButton}></ExitButton>
          {children}
        </div>
      </div >
    </>
  )
}

export default Popup
