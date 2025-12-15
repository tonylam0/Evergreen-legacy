import styles from "./Button.module.css"

const Button = ({ children, variant, overrideStyle, childrenStyle, onClick }) => {
  // If a variant style is provided, pass it. 
  // if not, default to the green style.
  // overrideStyle is for changing the buttonBase 
  // while still keeping the defualt styling.
  const buttonBase = `${styles.buttonBase} ${overrideStyle}`
  const button = `${buttonBase} ${variant} || ${buttonBase} ${styles.green}`

  return (
    <>
      <div className={button} onClick={onClick}>
        <h4 className={`${styles.children} ${childrenStyle} `}>
          {children}
        </h4>
      </div >
    </>
  )
}

export default Button
