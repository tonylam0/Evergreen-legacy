import styles from "./Support.module.css"
import Header from "../../components/Header/Header.jsx"
import coffeeImg from "../../assets/coffee.png"

function Support() {
  return (
    <>
      <div className={styles.container}>
        <Header tabSupport={styles.tabSupport}></Header>
        <div className={styles.text}>
          <h2 className={styles.title}>
            Support Us
          </h2>
          <p className={styles.message}>
            If you find what we’re doing valuable, it would be greatly appreciated if you considered supporting us and the development of the platform through donating.
          </p>
          <img className={styles.coffee} src={coffeeImg} alt="buy me a coffee"></img>
        </div>
      </div>
    </>
  )
}

export default Support
