import styles from './InputBox.module.css'

const InputBox = (props) => {
  return (
    <>
      <input className={`${styles.input} ${props.input}`} type={props.type} name={props.name} placeholder={props.placeholder} onChange={props.onChange} required></input>
    </>
  )
}

export default InputBox
