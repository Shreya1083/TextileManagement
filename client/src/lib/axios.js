import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Return only the data part of the response
    return response.data
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
          break
        
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden:', data.message)
          break
        
        case 404:
          // Not found
          console.error('Resource not found:', data.message)
          break
        
        case 429:
          // Too many requests
          console.error('Rate limit exceeded. Please try again later.')
          break
        
        case 500:
        case 502:
        case 503:
          // Server errors
          console.error('Server error. Please try again later.')
          break
      }

      // Throw error with message from server or default message
      const errorMessage = data?.message || error.message || 'Something went wrong'
      return Promise.reject(new Error(errorMessage))
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error. Please check your connection.')
      return Promise.reject(new Error('Network error. Please check your connection.'))
    } else {
      // Something else happened
      console.error('Error:', error.message)
      return Promise.reject(error)
    }
  }
)

export default api
