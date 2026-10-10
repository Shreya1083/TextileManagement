import { createContext, useContext, useState } from 'react'

// TODO (backend): Replace client-side credential matching with a real API call before production use.
// Example: POST /api/auth/login with { email, password } → JWT token returned and stored securely.
// The DEMO_USERS array and its plaintext passwords must be removed entirely in production.

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null)

// ── All system users ──────────────────────────────────────────────────────
export const DEMO_USERS = [
  // Management / Office
  { email: 'owner@everest.com',      password: 'demo123', role: 'owner',      name: 'Rajesh Sharma',  dept: 'Management', workerId: null    },
  { email: 'store@everest.com',      password: 'demo123', role: 'store',      name: 'Kamla Devi',     dept: 'Store',      workerId: null    },
  { email: 'supervisor@everest.com', password: 'demo123', role: 'supervisor', name: 'Arvind Kumar',   dept: 'Production', workerId: null    },
  { email: 'inspector@everest.com',  password: 'demo123', role: 'inspector',  name: 'Neha Shah',      dept: 'QC',         workerId: null    },
  { email: 'accounts@everest.com',   password: 'demo123', role: 'accounts',   name: 'Pradeep Gupta',  dept: 'Accounts',   workerId: null    },
  { email: 'buyer@everest.com',      password: 'demo123', role: 'buyer',      name: 'Anita Desai',    dept: 'Buyer',      workerId: null    },
  // Floor Workers
  { email: 'mohan@everest.com',      password: 'demo123', role: 'worker',     name: 'Mohan Kumar',    dept: 'Production', workerId: 'W-001' },
  { email: 'suresh@everest.com',     password: 'demo123', role: 'worker',     name: 'Suresh Patil',   dept: 'Production', workerId: 'W-002' },
  { email: 'anil@everest.com',       password: 'demo123', role: 'worker',     name: 'Anil Verma',     dept: 'Production', workerId: 'W-003' },
  { email: 'neha@everest.com',       password: 'demo123', role: 'worker',     name: 'Neha Shah',      dept: 'QC',         workerId: 'W-004' },
  { email: 'priya@everest.com',      password: 'demo123', role: 'worker',     name: 'Priya Rao',      dept: 'Production', workerId: 'W-005' },
  { email: 'ravi@everest.com',       password: 'demo123', role: 'worker',     name: 'Ravi Mehta',     dept: 'Production', workerId: 'W-006' },
  { email: 'sanjay@everest.com',     password: 'demo123', role: 'worker',     name: 'Sanjay Tiwari',  dept: 'Production', workerId: 'W-007' },
  { email: 'deepak@everest.com',     password: 'demo123', role: 'worker',     name: 'Deepak Singh',   dept: 'Store',      workerId: 'W-008' },
]

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
export const WORKER_LIST = DEMO_USERS.filter(u => u.role === 'worker')

// ── Where each role lands after login ─────────────────────────────────────
export const ROLE_HOME = {
  owner:      '/dashboard',
  supervisor: '/floor',
  inspector:  '/quality/queue',
  store:      '/inventory/stock',
  accounts:   '/orders',
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

  const login = (email, password) => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (found) {
      setUser({ id: found.email, ...found })
      return { ok: true, role: found.role }
    }
    return { ok: false, error: 'Invalid credentials. Please try again.' }
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
