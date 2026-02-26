import { createContext, useState, useEffect, useContext } from 'react'
import api from '../api/api.js'

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Track if we're checking storage

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      setUser({ token })
    }
    setLoading(false)
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('api-auth/login/', { email, password })
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      setUser(response.data.user)
    } catch (error) {
      console.error("Login failed", error)
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  };

  const googleLogin = async (code) => {
    try {
      const response = await api.post('api/auth/google/', { code });
      const { access, refresh, user: userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Update state immediately
      setUser(userData || { token: access });
      return response.data;
    } catch (error) {
      console.error("Google Auth failed", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser, googleLogin }}>
      {!loading && children} {/* Don't render the app until we've checked for the user */}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)
