import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const DEMO_USERS = [
  { email: 'owner@everest.com',      password: 'demo123', role: 'owner',      name: 'Rajesh Sharma',  dept: 'Management'  },
  { email: 'store@everest.com',      password: 'demo123', role: 'store',      name: 'Kamla Devi',     dept: 'Store'        },
  { email: 'supervisor@everest.com', password: 'demo123', role: 'supervisor', name: 'Arvind Kumar',   dept: 'Production'   },
  { email: 'inspector@everest.com',  password: 'demo123', role: 'inspector',  name: 'Neha Shah',      dept: 'Quality'      },
  { email: 'accounts@everest.com',   password: 'demo123', role: 'accounts',   name: 'Pradeep Gupta',  dept: 'Accounts'     },
]

// Where each role lands after login
export const ROLE_HOME = {
  owner:      '/dashboard',
  supervisor: '/floor',
  inspector:  '/quality/queue',
  store:      '/inventory/stock',
  accounts:   '/orders',
}

// Human-readable role labels
export const ROLE_LABELS = {
  owner:      'Owner / Admin',
  store:      'Store Keeper',
  supervisor: 'Production Supervisor',
  inspector:  'Quality Inspector',
  accounts:   'Office / Accounts',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (email, password) => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (found) {
      setUser({ id: found.email, ...found })
      return { ok: true, role: found.role }
    }
    return { ok: false, error: 'Invalid email or password' }
  }

  const logout = () => setUser(null)

  const hasRole = (...roles) => roles.includes(user?.role)

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
