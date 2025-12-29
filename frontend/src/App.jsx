import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import Homepage from './pages/Homepage/Homepage.jsx'
import About from './pages/About/About.jsx'
import Support from './pages/Support/Support.jsx'
import Contact from './pages/Contact/Contact.jsx'
import SignUp from './pages/SignUp/SignUp.jsx'
import Login from './pages/Login/Login.jsx'

function App() {
  const element = useRoutes([
    { path: '/', element: <Homepage /> },
    { path: '/about', element: <About /> },
    { path: '/support', element: <Support /> },
    { path: '/contact', element: <Contact /> },
    { path: '/signup', element: <SignUp /> },
    { path: '/login', element: <Login /> },
  ])

  return (
    <Suspense fallback={<></>}>
      {element}
    </Suspense>
  )
}

export default App
