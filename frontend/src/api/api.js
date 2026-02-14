import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/',
})

// Adds access token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') // Or get from cookie
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handles access token expiration
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Check if the error is 401 (Unauthorized) and ensure we haven't retried this request yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')

        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: refreshToken,
        })

        // If successful, save the new token
        const newAccessToken = response.data.access
        localStorage.setItem('access_token', newAccessToken)

        // Update the header of the failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        // Retry the original request with the new token
        return api(originalRequest)
      } catch (refreshError) {
        // If the refresh token is also expired or invalid, log the user out
        console.error("Session expired", refreshError)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
