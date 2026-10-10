import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const DEMO_USERS = [
  // ── Management / Office ──────────────────────────────────────────────────
  { email: 'owner@everest.com',      password: 'demo123', role: 'owner',      name: 'Rajesh Sharma',  dept: 'Management', workerId: null  },
  { email: 'store@everest.com',      password: 'demo123', role: 'store',      name: 'Kamla Devi',     dept: 'Store',      workerId: null  },
  { email: 'supervisor@everest.com', password: 'demo123', role: 'supervisor', name: 'Arvind Kumar',   dept: 'Production', workerId: null  },
  { email: 'inspector@everest.com',  password: 'demo123', role: 'inspector',  name: 'Neha Shah',      dept: 'QC',         workerId: null  },
  { email: 'accounts@everest.com',   password: 'demo123', role: 'accounts',   name: 'Pradeep Gupta',  dept: 'Accounts',   workerId: null  },
  // ── Workers (floor employees) ────────────────────────────────────────────
  { email: 'mohan@everest.com',      password: 'demo123', role: 'worker',     name: 'Mohan Kumar',    dept: 'Production', workerId: 'W-001' },
  { email: 'suresh@everest.com',     password: 'demo123', role: 'worker',     name: 'Suresh Patil',   dept: 'Production', workerId: 'W-002' },
  { email: 'anil@everest.com',       password: 'demo123', role: 'worker',     name: 'Anil Verma',     dept: 'Production', workerId: 'W-003' },
  { email: 'neha@everest.com',       password: 'demo123', role: 'worker',     name: 'Neha Shah',      dept: 'QC',         workerId: 'W-004' },
  { email: 'priya@everest.com',      password: 'demo123', role: 'worker',     name: 'Priya Rao',      dept: 'Production', workerId: 'W-005' },
  { email: 'ravi@everest.com',       password: 'demo123', role: 'worker',     name: 'Ravi Mehta',     dept: 'Production', workerId: 'W-006' },
  { email: 'sanjay@everest.com',     password: 'demo123', role: 'worker',     name: 'Sanjay Tiwari',  dept: 'Production', workerId: 'W-007' },
  { email: 'deepak@everest.com',     password: 'demo123', role: 'worker',     name: 'Deepak Singh',   dept: 'Store',      workerId: 'W-008' },
]

// Where each role lands after login
export const ROLE_HOME = {
  owner:      '/dashboard',
  supervisor: '/floor',
  inspector:  '/quality/queue',
  store:      '/inventory/stock',
  accounts:   '/orders',
  worker:     '/worker/my-dashboard',
}

// Human-readable role labels
export const ROLE_LABELS = {
  owner:      'Owner / Admin',
  store:      'Store Keeper',
  supervisor: 'Production Supervisor',
  inspector:  'Quality Inspector',
  accounts:   'Office / Accounts',
  worker:     'Floor Worker',
}

// Group users for the login dropdown
export const USER_GROUPS = [
  {
    group: 'Management & Office',
    users: DEMO_USERS.filter(u => u.role !== 'worker'),
  },
  {
    group: 'Floor Workers',
    users: DEMO_USERS.filter(u => u.role === 'worker'),
  },
]

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
