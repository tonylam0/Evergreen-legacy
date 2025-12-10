import styles from './About.module.css'
import Header from '../../components/Header/Header.jsx'

function Homepage() {
  return (
    <>
      <div className={styles.container}>
        <Header></Header>
        <div className={styles.text}>
          <h2 className={styles.title}>
            Message from founder
          </h2>
          <p className={styles.message}>
            For a few years now, I’ve been a HUGE fan of video essays. I believe I was first introduced to them through either a&nbsp;
            <span className={styles.name}><a href='https://www.youtube.com/channel/UCtGoikgbxP4F3rgI9PldI9g' target="_blank" rel="noopener noreferrer">Super Eyepatch Wolf</a></span> 
            &nbsp;or <span className={styles.name}><a href='https://www.youtube.com/@SchaffrillasProductions' target="_blank" rel="noopener noreferrer">Schaffrillas Productions</a></span> 
            &nbsp;video, but honestly, my memory is a little hazy. But, even now, I still remember how entertained and immersed in those videos I was and the many more that came after them. <br /> <br />

            So, I wanted to create a website that allowed people to discover video essays that make their jaws drop just as much as mine did all those years ago. On this platform, you can import your favorite video essays from YouTube for other people to enjoy and review! <br /> <br />

            We want to prioritize long-lasting or Evergreen content, so we designed the discovery system to reflect this through rewarding videos based on quality-based metrics rather than solely clickability or recency. Whenever you do find a video that you absolutely adore, you can add that video to your Evergreen Collection in order to come back to it later. <br /> <br />

            Sincerely, <br /> 
            Tony Lam
          </p>
        </div>
      </div>
    </>
  )
}

export default Homepage
