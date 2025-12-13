import styles from './SignUp.module.css'
import Logo from '../../assets/logo.svg?react'
import InputBox from '../../components/InputBox/InputBox'
import Button from '../../components/Button/Button.jsx'

function SignUp() {
  return (
    <>
      <div className={styles.container}>
        <Logo className={styles.logo}></Logo>
        <h1 className={styles.title}>Welcome to <span className={styles.evergreen}>Evergreen</span></h1>
        <p className={styles.message}>Discover memorable and long-lasting content</p>
        <form className={styles.form}>
          <InputBox input={styles.input} type="email" name="email" placeholder="Email"></InputBox>
          <InputBox input={styles.input} type="text" name="username" placeholder="Create a username"></InputBox>
          <InputBox input={styles.input} type="password" name="password" placeholder="Create a password"></InputBox>
          <Button>Sign up</Button>
        </form>
      </div>
    </>
  )
}

export default SignUp
