import styles from './InputBox.module.css'

const InputBox = (props) => {
  return (
    <>
      <input className={`${styles.input} ${props.input}`} type={props.type} name={props.name} placeholder={props.placeholder} required></input>
    </>
  )
}

export default InputBox
