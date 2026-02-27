import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header.jsx'
import InputBox from '../../components/InputBox/InputBox.jsx'
import Toggle from '../../components/Toggle/Toggle.jsx'
import { useAuth } from '../../components/AuthProvider.jsx'
import api from '../../api/api.js'
import styles from './ProfileEdit.module.css'
import Show from '../../assets/show.svg?react'
import Unshow from '../../assets/unshow.svg?react'

const PASSWORD_PLACEHOLDER = '••••••••••'

function ProfileEdit() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [settings, setSettings] = useState(null)

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [notifyReplyToReview, setNotifyReplyToReview] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [profilePrivate, setProfilePrivate] = useState(false)
  const [hideReviewsRatings, setHideReviewsRatings] = useState(false)

  const [emailError, setEmailError] = useState(null)
  const [usernameError, setUsernameError] = useState(null)
  const [emailSaving, setEmailSaving] = useState(false)
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [passwordFormOpen, setPasswordFormOpen] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword1, setNewPassword1] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [showPassword, setShowPassword] = useState('password')
  const [passwordIcon, setPasswordIcon] = useState(Unshow)

  const [deleteUsername, setDeleteUsername] = useState('')
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    api
      .get('api/account/settings/')
      .then((res) => {
        const d = res.data
        setSettings(d)
        setEmail(d.email ?? '')
        setUsername(d.username ?? '')
        setNotifyReplyToReview(!!d.notify_reply_to_review)
        setWeeklyDigest(!!d.weekly_digest)
        setProfilePrivate(!!d.profile_private)
        setHideReviewsRatings(!!d.hide_reviews_ratings)
        setDeleteUsername(d.username ?? '')
      })
      .catch((err) =>
        setError(err.response?.status === 401 ? 'Please log in.' : 'Failed to load settings.')
      )
      .finally(() => setLoading(false))
  }, [])

  const patchPrefs = (updates) => {
    api
      .patch('api/account/settings/', updates)
      .then((res) => {
        setSettings(res.data)
        if (res.data.email !== undefined) setEmail(res.data.email)
        if (res.data.username !== undefined) {
          setUsername(res.data.username)
          setDeleteUsername(res.data.username)
        }
        if (res.data.notify_reply_to_review !== undefined)
          setNotifyReplyToReview(res.data.notify_reply_to_review)
        if (res.data.weekly_digest !== undefined) setWeeklyDigest(res.data.weekly_digest)
        if (res.data.profile_private !== undefined) setProfilePrivate(res.data.profile_private)
        if (res.data.hide_reviews_ratings !== undefined)
          setHideReviewsRatings(res.data.hide_reviews_ratings)
      })
      .catch(() => {})
  }

  const handleChangeEmail = () => {
    setEmailError(null)
    setEmailSaving(true)
    api
      .patch('api/account/settings/', { email: email.trim() })
      .then((res) => {
        setSettings(res.data)
        setEmail(res.data.email)
      })
      .catch((err) => {
        const msg = err.response?.data?.email?.[0] || err.response?.data?.detail || 'Failed to update email.'
        setEmailError(msg)
      })
      .finally(() => setEmailSaving(false))
  }

  const handleChangeUsername = () => {
    setUsernameError(null)
    setUsernameSaving(true)
    api
      .patch('api/account/settings/', { username: username.trim() })
      .then((res) => {
        setSettings(res.data)
        setUsername(res.data.username)
        setDeleteUsername(res.data.username)
      })
      .catch((err) => {
        const msg = err.response?.data?.username?.[0] || err.response?.data?.detail || 'Failed to update username.'
        setUsernameError(msg)
      })
      .finally(() => setUsernameSaving(false))
  }

  const togglePasswordVisibility = () => {
    setShowPassword((p) => (p === 'password' ? 'text' : 'password'))
    setPasswordIcon((i) => (i === Unshow ? Show : Unshow))
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    setPasswordError(null)
    if (newPassword1 !== newPassword2) {
      setPasswordError('New passwords do not match.')
      return
    }
    setPasswordSaving(true)
    api
      .post('api-auth/password/change/', {
        old_password: oldPassword,
        new_password1: newPassword1,
        new_password2: newPassword2,
      })
      .then(() => {
        setPasswordFormOpen(false)
        setOldPassword('')
        setNewPassword1('')
        setNewPassword2('')
      })
      .catch((err) => {
        const data = err.response?.data
        const msg =
          data?.old_password?.[0] ||
          data?.new_password1?.[0] ||
          data?.new_password2?.[0] ||
          data?.detail ||
          'Failed to change password.'
        setPasswordError(msg)
      })
      .finally(() => setPasswordSaving(false))
  }

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const handleDeleteAccount = (e) => {
    e.preventDefault()
    setDeleteError(null)
    setDeleteSaving(true)
    api
      .post('api/account/delete/', { username: deleteUsername })
      .then(() => {
        logout()
        navigate('/')
      })
      .catch((err) => {
        setDeleteError(err.response?.data?.error || 'Failed to delete account.')
      })
      .finally(() => setDeleteSaving(false))
  }

  const handleToggle = (key, value) => {
    patchPrefs({ [key]: value })
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (error && !settings) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Account Settings</h1>

        <section className={styles.section}>
          <div className={styles.profileRow}>
            <div className={styles.avatarPlaceholder} aria-hidden>
              {username ? username.charAt(0).toUpperCase() : '?'}
            </div>
            <div className={styles.profileLinks}>
              <button type="button" className={styles.linkButton}>
                Change picture
              </button>
              <button type="button" className={styles.linkButton}>
                Delete photo
              </button>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.label}>Email</label>
            <div className={styles.inputWithButton}>
              <InputBox
                input={styles.input}
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="button"
                className={styles.changeButton}
                onClick={handleChangeEmail}
                disabled={emailSaving}
              >
                Change
              </button>
            </div>
            {emailError && <p className={styles.inlineError}>{emailError}</p>}
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputWithButton}>
              <InputBox
                input={styles.input}
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button
                type="button"
                className={styles.changeButton}
                onClick={handleChangeUsername}
                disabled={usernameSaving}
              >
                Change
              </button>
            </div>
            {usernameError && <p className={styles.inlineError}>{usernameError}</p>}
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWithButton}>
              <div className={styles.passwordWrap}>
                <input
                  type={showPassword}
                  className={styles.input}
                  value={passwordFormOpen ? oldPassword : PASSWORD_PLACEHOLDER}
                  readOnly={!passwordFormOpen}
                  onChange={passwordFormOpen ? (e) => setOldPassword(e.target.value) : undefined}
                  aria-label="Password"
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword === 'password' ? 'Show password' : 'Hide password'}
                >
                  {passwordIcon}
                </button>
              </div>
              <button
                type="button"
                className={styles.changeButton}
                onClick={() => setPasswordFormOpen(true)}
                disabled={passwordFormOpen}
              >
                Change
              </button>
            </div>
            {passwordFormOpen && (
              <form className={styles.passwordForm} onSubmit={handleChangePassword}>
                <label className={styles.label}>Current password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <label className={styles.label}>New password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={newPassword1}
                  onChange={(e) => setNewPassword1(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <label className={styles.label}>Confirm new password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {passwordError && <p className={styles.inlineError}>{passwordError}</p>}
                <div className={styles.passwordFormActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => {
                      setPasswordFormOpen(false)
                      setPasswordError(null)
                      setOldPassword('')
                      setNewPassword1('')
                      setNewPassword2('')
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.changeButton} disabled={passwordSaving}>
                    {passwordSaving ? 'Saving...' : 'Save password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className={styles.signOutWrap}>
            <button type="button" className={styles.signOutButton} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications Preferences</h2>
          <h3 className={styles.subsectionTitle}>Email Notifications</h3>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>
              Notify me when someone replies to my review
            </span>
            <Toggle
              id="notify-reply"
              checked={notifyReplyToReview}
              onChange={(v) => handleToggle('notify_reply_to_review', v)}
              aria-label="Notify me when someone replies to my review"
            />
          </div>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>
              Send me a weekly digest of top-rated video essays
            </span>
            <Toggle
              id="weekly-digest"
              checked={weeklyDigest}
              onChange={(v) => handleToggle('weekly_digest', v)}
              aria-label="Send me a weekly digest of top-rated video essays"
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Privacy Settings</h2>
          <h3 className={styles.subsectionTitle}>Profile Privacy</h3>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>
              Make my profile private (only visible to me)
            </span>
            <Toggle
              id="profile-private"
              checked={profilePrivate}
              onChange={(v) => handleToggle('profile_private', v)}
              aria-label="Make my profile private"
            />
          </div>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>
              Hide my reviews and ratings from my public profile
            </span>
            <Toggle
              id="hide-reviews"
              checked={hideReviewsRatings}
              onChange={(v) => handleToggle('hide_reviews_ratings', v)}
              aria-label="Hide my reviews and ratings from my public profile"
            />
          </div>
        </section>

        <section className={styles.deleteSection}>
          <h2 className={styles.deleteTitle}>Delete Account</h2>
          <p className={styles.deleteWarning}>
            Deleting your account is permanent and undo-able, so please be certain.
          </p>
          <form onSubmit={handleDeleteAccount}>
            <label className={styles.label}>Enter your username</label>
            <input
              type="text"
              className={styles.input}
              value={deleteUsername}
              onChange={(e) => setDeleteUsername(e.target.value)}
              autoComplete="username"
            />
            {deleteError && <p className={styles.inlineError}>{deleteError}</p>}
            <button
              type="submit"
              className={styles.deleteButton}
              disabled={deleteSaving}
            >
              {deleteSaving ? 'Deleting...' : 'Delete your account'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default ProfileEdit
