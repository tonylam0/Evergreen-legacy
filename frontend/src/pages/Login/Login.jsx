import { useState } from 'react'
import { useAuth } from '../../components/AuthProvider.jsx'
import styles from './Login.module.css'
import Logo from '../../assets/logo.svg?react'
import InputBox from '../../components/InputBox/InputBox.jsx'
import Email from '../../assets/email.svg?react'
import Lock from '../../assets/lock.svg?react'
import Show from '../../assets/show.svg?react'
import Unshow from '../../assets/unshow.svg?react'
import AppleLogo from '../../assets/apple.svg?react'
import GoogleLogo from '../../assets/google.svg?react'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const { user, login } = useAuth();

  const [showPassword, setShowPassword] = useState("password")
  const [passwordIcon, setPasswordIcon] = useState(Unshow)
  const passwordStyle = showPassword === "password" ? styles.hidePassword : styles.showPassword
  const [formData, setFormData] = useState({
    "email": "",
    "password": ""
  })

  const updatePassword = () => {
    if (showPassword === "password") {
      setShowPassword("text")
      setPasswordIcon(Show)
    } else {
      setShowPassword("password")
      setPasswordIcon(Unshow)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target  // Destructure the user input

    setFormData({
      ...formData,
      [name]: value  // Only update the field that was changed
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await login(formData.email, formData.password);
      navigate("/")
    } catch (error) {
      console.log("Error Data:", error.response?.data || "Network Error");
    }
  }

  return (
    <>
      <div className={styles.container}>
        <Logo className={styles.logo}></Logo>
        <h1 className={styles.title}>Welcome back to Evergreen!</h1>
        <p className={styles.message}>Discover memorable and long-lasting video essays</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputContainer}>
            <Email className={styles.icon}></Email>
            <InputBox input={styles.input} type="email" name="email" placeholder="Email" onChange={handleChange}></InputBox>
          </div>

          <div className={styles.inputContainer}>
            <Lock className={styles.icon}></Lock>
            <InputBox input={`${styles.input} ${passwordStyle}`} type={showPassword} name="password" placeholder="Password" onChange={handleChange}></InputBox>
            <button className={styles.showIcon} onClick={updatePassword} type="button">{passwordIcon}</button>
          </div>

          <button className={`${styles.buttonBase} ${styles.buttonGreen}`}>Log in</button>
        </form >


        <div className={styles.oauth}>
          <div className={styles.separator}>
            <div className={styles.leftLine}></div>
            <p className={styles.orText}>Or</p>
            <div className={styles.rightLine}></div>
          </div>

          <div className={styles.buttons}>
            <div className={styles.oauthButton}>
              <button className={`${styles.buttonBase} ${styles.buttonTransparent}`}>
                <AppleLogo className={styles.oauthLogo}></AppleLogo>
                <p className={styles.oauthText}>Continue with Apple</p>
              </button>
            </div>

            <div className={styles.oauthButton}>
              <button className={`${styles.buttonBase} ${styles.buttonTransparent}`}>
                <GoogleLogo className={styles.oauthLogo}></GoogleLogo>
                <p className={styles.oauthText}>Continue with Google</p>
              </button>
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
