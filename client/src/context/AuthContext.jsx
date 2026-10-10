import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null)

// ── Role mapping between frontend and backend ─────────────────────────────
// Frontend uses lowercase roles for routing and UI state
// Backend uses UPPERCASE enum values (UserRole in Prisma schema)
const ROLE_MAPPING = {
  owner: 'OWNER',
  store: 'STOREKEEPER',
  supervisor: 'SUPERVISOR',
  inspector: 'INSPECTOR',
  accounts: 'ACCOUNTS',
  buyer: 'BUYER',
  worker: 'WORKER',
}

const REVERSE_ROLE_MAPPING = {
  OWNER: 'owner',
  STOREKEEPER: 'store',
  SUPERVISOR: 'supervisor',
  INSPECTOR: 'inspector',
  ACCOUNTS: 'accounts',
  BUYER: 'buyer',
  WORKER: 'worker',
}





// ── The roles shown in the login dropdown ─────────────────────────────────
export const ROLE_OPTIONS = [
  { role: 'owner',      label: 'Owner / Admin',          desc: 'Full access to all modules',           icon: '👑', color: 'from-primary-500 to-violet-600' },
  { role: 'supervisor', label: 'Production Supervisor',  desc: 'Machine board, production & downtime', icon: '🏭', color: 'from-amber-500 to-orange-600'   },
  { role: 'inspector',  label: 'Quality Inspector',      desc: 'Inspection queue & defect reports',    icon: '🔍', color: 'from-emerald-500 to-teal-600'   },
  { role: 'store',      label: 'Store Keeper',           desc: 'Inventory, gate entry & dispatch',     icon: '📦', color: 'from-cyan-500 to-blue-600'      },
  { role: 'accounts',   label: 'Office / Accounts',      desc: 'Orders, invoices, payroll & finance',  icon: '💼', color: 'from-pink-500 to-rose-600'      },
  { role: 'worker',     label: 'Worker',                 desc: 'Personal attendance & wages dashboard',icon: '👷', color: 'from-zinc-500 to-zinc-600'      },
  { role: 'buyer',      label: 'Buyer',                  desc: 'Track your own orders',                icon: '🛒', color: 'from-teal-500 to-cyan-600'      },
]

// ── Workers list for the secondary picker (shown when role = worker) ──────
// Note: Worker role not yet supported by backend - workers are tracked via HR module
export const WORKER_LIST = [] // Disabled until backend adds WORKER role
// export const WORKER_LIST = DEMO_USERS.filter(u => u.role === 'worker')

// ── Where each role lands after login ─────────────────────────────────────
export const ROLE_HOME = {
  owner:      '/dashboard',
  supervisor: '/dashboard',
  inspector:  '/dashboard',
  store:      '/dashboard',
  accounts:   '/dashboard',
  buyer:      '/orders',
  worker:     '/worker/my-dashboard',
}

// ── Human-readable role labels ────────────────────────────────────────────
export const ROLE_LABELS = {
  owner:      'Owner / Admin',
  store:      'Store Keeper',
  supervisor: 'Production Supervisor',
  inspector:  'Quality Inspector',
  accounts:   'Office / Accounts',
  buyer:      'Buyer',
  worker:     'Floor Worker',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore user session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await authAPI.getProfile()
          if (response?.success) {
            const userData = response.data
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: REVERSE_ROLE_MAPPING[userData.role] || userData.role.toLowerCase(),
              backendRole: userData.role,
              isActive: userData.isActive,
            })
          }
        } catch (error) {
          console.error('Session restore failed:', error)
          localStorage.removeItem('token')
        }
      }
      setLoading(false)
    }

    restoreSession()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      
      if (response?.success) {
        const { user: userData, token } = response.data
        
        // Store token
        localStorage.setItem('token', token)
        
        // Set user state with role mapping
        const frontendRole = REVERSE_ROLE_MAPPING[userData.role] || userData.role.toLowerCase()
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: frontendRole,
          backendRole: userData.role,
          isActive: userData.isActive,
        })
        
        return { ok: true, role: frontendRole }
      }
      
      return { ok: false, error: 'Login failed' }
    } catch (error) {
      const errorMessage = error.message || 'Invalid credentials. Please try again.'
      return { ok: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      // Backend handles JWT stateless, no need to call logout
      console.log('Logging out locally')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local state
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const hasRole = (...roles) => roles.includes(user?.role)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
