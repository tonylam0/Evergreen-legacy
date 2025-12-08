import styles from "./Button.module.css"

const Button = ({ children, overrideStyle }) => {
  return (
    <>
      <div className={`${styles.background} ${overrideStyle}`}>
        <h4>
          {children}
        </h4>
      </div >
    </>
  )
}

export default Button
