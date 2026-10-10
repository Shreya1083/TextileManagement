/**
 * Axios instance for the Everest Textile ERP API.
 * Attaches the JWT stored in sessionStorage on every request.
 * On 401 it clears the token so the auth context can redirect to /login.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ──────────────────────────────────────
api.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem('erp_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error),
)

// ── Response interceptor: unwrap envelope, handle 401 ────────────────────
api.interceptors.response.use(
  response => response,   // leave unwrapping to each service
  error => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('erp_token')
      // Dispatch a custom event so the auth context can react
      window.dispatchEvent(new Event('erp:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default api
