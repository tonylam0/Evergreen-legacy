import styles from "./Button.module.css"

const Button = ({ children, overrideStyle, childrenStyle }) => {
  return (
    <>
      <div className={`${styles.background} ${overrideStyle}`}>
        <h4 className={`${styles.children} ${childrenStyle}`}>
          {children}
        </h4>
      </div >
    </>
  )
}

export default Button
