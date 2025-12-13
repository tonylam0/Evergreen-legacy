import { useState } from 'react'
import styles from './Login.module.css'
import Logo from '../../assets/logo.svg?react'
import InputBox from '../../components/InputBox/InputBox.jsx'
import Button from '../../components/Button/Button.jsx'
import Email from '../../assets/email.svg?react'
import Username from '../../assets/username.svg?react'
import Lock from '../../assets/lock.svg?react'
import Show from '../../assets/show.svg?react'
import Unshow from '../../assets/unshow.svg?react'
import AppleLogo from '../../assets/apple.svg?react'
import GoogleLogo from '../../assets/google.svg?react'
import { Link } from 'react-router-dom'

function Login() {
  const [showPassword, setShowPassword] = useState("password")
  const [passwordIcon, setPasswordIcon] = useState(Unshow)
  const passwordStyle = showPassword === "password" ? styles.hidePassword : styles.showPassword

  const updatePassword = () => {
    if (showPassword === "password") {
      setShowPassword("text")
      setPasswordIcon(Show)
    } else {
      setShowPassword("password")
      setPasswordIcon(Unshow)
    }
  }

  return (
    <>
      <div className={styles.container}>
        <Logo className={styles.logo}></Logo>
        <h1 className={styles.title}>Welcome back to Evergreen</h1>
        <p className={styles.message}>Discover memorable and long-lasting video essays</p>

        <form className={styles.form}>
          <div className={styles.inputContainer}>
            <Email className={styles.icon}></Email>
            <InputBox input={styles.input} type="email" name="email" placeholder="Email"></InputBox>
          </div>

          <div className={styles.inputContainer}>
            <Lock className={styles.icon}></Lock>
            <InputBox input={`${styles.input} ${passwordStyle}`} type={showPassword} name="password" placeholder="Password"></InputBox>
            <button className={styles.showIcon} onClick={updatePassword} type="button">{passwordIcon}</button>
          </div>

          <Button>Log in</Button>

        </form >


        <div className={styles.oauth}>
          <div className={styles.separator}>
            <div className={styles.leftLine}></div>
            <p className={styles.orText}>Or</p>
            <div className={styles.rightLine}></div>
          </div>

          <div className={styles.buttons}>
            <div className={styles.oauthButton}>
              <Button childrenStyle={styles.oauthText} variant={styles.buttonTransparent}>
                <AppleLogo className={styles.oauthLogo}></AppleLogo>
                Continue with Apple
              </Button>
            </div>

            <div className={styles.oauthButton}>
              <Button childrenStyle={styles.oauthText} variant={styles.buttonTransparent}>
                <GoogleLogo className={styles.oauthLogo}></GoogleLogo>
                Continue with Google
              </Button>
            </div>
          </div>
        </div>

        <p className={styles.loginMessage}>
          Don't have an account?&nbsp;
          <Link to={"/signup"} className={styles.link}>
            Sign up
          </Link>
        </p>

      </div >
    </>
  )
}

export default Login
