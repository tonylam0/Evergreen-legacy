import styles from './Toggle.module.css'

function Toggle({ checked, onChange, id, 'aria-label': ariaLabel }) {
  return (
    <label className={styles.wrapper} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className={styles.input}
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <span className={styles.track} aria-hidden />
    </label>
  )
}

export default Toggle
