import React, { createContext, useContext, useState } from 'react'
import { mockUser } from '../mocks/data'

const AuthContext = createContext(null)

const DEMO_USERS = [
  { email: 'owner@everest.com',      password: 'demo123', role: 'owner',      name: 'Rajesh Sharma'  },
  { email: 'store@everest.com',      password: 'demo123', role: 'store',      name: 'Kamla Devi'     },
  { email: 'supervisor@everest.com', password: 'demo123', role: 'supervisor', name: 'Arvind Kumar'   },
  { email: 'inspector@everest.com',  password: 'demo123', role: 'inspector',  name: 'Neha Shah'      },
  { email: 'accounts@everest.com',   password: 'demo123', role: 'accounts',   name: 'Pradeep Gupta'  },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (email, password) => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (found) {
      setUser({ id: 1, ...found })
      return { ok: true }
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
