import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './components/AuthProvider.jsx'
import { HelmetProvider } from 'react-helmet-async'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <GoogleOAuthProvider clientId="536667772000-dpk5u98ksrg6v7ffj0n09p59fhgftdr6.apps.googleusercontent.com">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>
)
