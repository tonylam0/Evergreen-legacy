import { useState } from 'react'
import { useAuth } from '../../components/AuthProvider.jsx'
import { useGoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/api.js'
import styles from './SignUp.module.css'
import Logo from '../../assets/logo.svg?react'
import InputBox from '../../components/InputBox/InputBox'
import Email from '../../assets/email.svg?react'
import Username from '../../assets/username.svg?react'
import Lock from '../../assets/lock.svg?react'
import Show from '../../assets/show.svg?react'
import Unshow from '../../assets/unshow.svg?react'
import GoogleLogo from '../../assets/google.svg?react'

function SignUp() {
  const navigate = useNavigate()
  const { login, googleLogin } = useAuth()

  const [showPassword, setShowPassword] = useState("password")
  const [passwordIcon, setPasswordIcon] = useState(Unshow)
  const [formData, setFormData] = useState({
    "email": "",
    "username": "",
    "password1": "",
    "password2": ""
  })

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

  const handleChange = (event) => {
    const { name, value } = event.target  // Destructure the user input

    // Accounts for the registration requiring a password confirmation
    if (name == "password") {
      setFormData({
        ...formData,
        password1: value,
        password2: value,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value  // Only update the field that was changed
      })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const response = await api.post("api-auth/registration/", formData)
      await login(formData.email, formData.password1)
      navigate("/")
    } catch (error) {
      console.log("error", error.response.data)
    }
  }

  const handleGoogleSignup = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (tokenResponse) => {
      try {
        await googleLogin(tokenResponse.code);
        console.log("Account created/accessed successfully!");
        navigate("/");
      } catch (error) {
        console.error("Signup failed:", error.response?.data || error);
      }
    },
  })

  return (
    <>
      <div className={styles.container} >
        <Logo className={styles.logo}></Logo>
        <h1 className={styles.title}>Welcome to Evergreen!</h1>
        <p className={styles.message}>Discover memorable and long-lasting video essays</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputContainer}>
            <Email className={styles.icon}></Email>
            <InputBox input={styles.input} type="email" name="email" placeholder="Email" onChange={handleChange}></InputBox>
          </div>

          <div className={styles.inputContainer}>
            <Username className={styles.icon}></Username>
            <InputBox input={styles.input} type="text" name="username" placeholder="Create a username" onChange={handleChange}></InputBox>
          </div>

          <div className={styles.inputContainer}>
            <Lock className={styles.icon}></Lock>
            <InputBox input={`${styles.input} ${passwordStyle}`} type={showPassword} name="password" placeholder="Create a password" onChange={handleChange}></InputBox>
            <button className={styles.showIcon} onClick={updatePassword} type="button">{passwordIcon}</button>
          </div>

          <button className={`${styles.buttonBase} ${styles.buttonGreen}`}>Sign up</button>
        </form >


        <div className={styles.oauth}>
          <div className={styles.separator}>
            <div className={styles.leftLine}></div>
            <p className={styles.orText}>Or</p>
            <div className={styles.rightLine}></div>
          </div>

          <div className={styles.buttons}>
            <div className={styles.oauthButton}>
              <button
                type="button"
                className={`${styles.buttonBase} ${styles.buttonTransparent}`}
                onClick={() => handleGoogleSignup()}
              >
                <GoogleLogo className={styles.oauthLogo}></GoogleLogo>
                <p className={styles.oauthText}>Continue with Google</p>
              </button>
            </div>
          </div>
        </div>

        <p className={styles.loginMessage}>
          Already have an account?&nbsp;
          <Link to={"/login"} className={styles.link}>
            Log in
          </Link>
        </p>

      </div >
    </>
  )
}

export default SignUp
