import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Homepage from './pages/Homepage/Homepage.jsx'
import About from './pages/About/About.jsx'
import Support from './pages/Support/Support.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />}></Route>
        <Route path="/about" element={<About />}></Route>
        <Route path="/support" element={<Support />}></Route>
      </Routes>
    </BrowserRouter>
  </StrictMode >,
)
