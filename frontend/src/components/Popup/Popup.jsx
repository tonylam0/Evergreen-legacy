import { createPortal } from 'react-dom'
import styles from './Popup.module.css'
import ExitButton from '../../assets/x.svg?react'

const Popup = ({ updateCallback, overrideStyle, children }) => {
  const content = (
    <div className={styles.container}>
      <div className={styles.closeArea} onClick={updateCallback} aria-hidden="true" />
      <div className={`${styles.modal} ${overrideStyle || ''}`} onClick={(e) => e.stopPropagation()}>
        <ExitButton onClick={updateCallback} className={styles.exitButton} />
        {children}
      </div>
    </div>
  )
  return createPortal(content, document.body)
}

export default Popup
