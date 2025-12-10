import styles from "./Button.module.css"

const Button = ({ children, overrideStyle }) => {
  return (
    <>
      <div className={`${styles.background} ${overrideStyle}`}>
        <h4 className={styles.children}>
          {children}
        </h4>
      </div >
    </>
  )
}

export default Button
