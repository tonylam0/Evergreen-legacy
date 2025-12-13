import styles from "./Button.module.css"

const Button = ({ children, variant, overrideStyle, childrenStyle }) => {
  // If a variant style is provided, pass it. 
  // if not, default to the green style.
  const buttonBase = `${styles.buttonBase} ${overrideStyle}`
  const button = `${buttonBase} ${variant} || ${buttonBase} ${styles.green}`

  return (
    <>
      <div className={button}>
        <h4 className={`${styles.children} ${childrenStyle} `}>
          {children}
        </h4>
      </div >
    </>
  )
}

export default Button
