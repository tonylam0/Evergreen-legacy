import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Homepage from './pages/Homepage/Homepage.jsx'
import About from './pages/About/About.jsx'
import Support from './pages/Support/Support.jsx'
import Contact from './pages/Contact/Contact.jsx'
import SignUp from './pages/SignUp/SignUp.jsx'
import Login from './pages/Login/Login.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />}></Route>
        <Route path="/about" element={<About />}></Route>
        <Route path="/support" element={<Support />}></Route>
        <Route path="/contact" element={<Contact />}></Route>
        <Route path="/signup" element={<SignUp />}></Route>
        <Route path="/login" element={<Login />}></Route>
      </Routes>
    </BrowserRouter>
  </StrictMode >
)
