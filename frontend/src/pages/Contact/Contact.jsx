import styles from './Contact.module.css'
import Header from '../../components/Header/Header'
import InputBox from '../../components/InputBox/InputBox.jsx'
import Button from '../../components/Button/Button.jsx'

function Contact() {
  return (
    <>
      <div className={styles.container}>
        <Header tabContact={styles.tabContact}></Header>
        <div className={styles.mainBox}>
          <h1 className={styles.title}>Get in touch!</h1>
          <p className={styles.paragraph}>
            Have a question, feedback, or just want to chat? Feel free to send a message! Fill out your first name, last name, email, leave your message, then click send. Thank you!
          </p>
          <form className={styles.form}>
            <div className={styles.nameInputs}>
              <InputBox input={styles.input} type="text" name="first name" placeholder="First name"></InputBox>
              <InputBox input={styles.input} type="text" name="last name" placeholder="Last name"></InputBox>
            </div>
            <InputBox input={styles.input} type="text" name="email" placeholder="Enter your email"></InputBox>
            <textarea className={styles.messageBox} placeholder="Leave us a message"></textarea>
            <Button overrideStyle={styles.buttonBase} childrenStyle={styles.childrenStyle}>
              Send message
            </Button>
          </form>
        </div >
      </div >
    </>
  )
}

export default Contact
