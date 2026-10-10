import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../../context/AuthContext'
import { DEMO_USERS, USER_GROUPS, ROLE_HOME, ROLE_LABELS } from '../../context/AuthContext'
import { Eye, EyeOff, Loader2, ArrowRight, Layers, ChevronDown, Users, Briefcase } from 'lucide-react'
import { cn } from '../../lib/utils'

const ROLE_COLORS = {
  owner:      'from-primary-500 to-violet-600',
  supervisor: 'from-amber-500 to-orange-600',
  inspector:  'from-emerald-500 to-teal-600',
  store:      'from-cyan-500 to-blue-600',
  accounts:   'from-pink-500 to-rose-600',
  worker:     'from-zinc-500 to-zinc-700',
}

// Give each worker a distinct colour to distinguish them
const WORKER_COLORS = [
  'from-primary-500 to-violet-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-indigo-500 to-blue-600',
]

function getUserColor(user) {
  if (user.role !== 'worker') return ROLE_COLORS[user.role] || 'from-zinc-500 to-zinc-700'
  // consistent colour by workerId
  const idx = parseInt((user.workerId || 'W-000').replace('W-00', '').replace('W-0', '')) - 1
  return WORKER_COLORS[idx % WORKER_COLORS.length]
}

const FEATURES = [
  { icon: '🧵', title: 'End-to-End Traceability',  desc: 'Track every yarn lot to finished fabric roll and dispatch' },
  { icon: '⚙️', title: 'Live Machine Monitoring',  desc: 'Real-time status for every machine on the production floor' },
  { icon: '🔍', title: 'Smart Quality Control',    desc: 'QR-based roll inspection with full defect analytics' },
  { icon: '📊', title: 'Owner Analytics',          desc: 'Revenue, P&L and order profitability in one dashboard' },
]

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const dropdownRef = useRef(null)

  const [selectedEmail, setSelectedEmail] = useState('owner@everest.com')
  const [password, setPassword]           = useState('demo123')
  const [showPw, setShowPw]               = useState(false)
  const [showDropdown, setShowDropdown]   = useState(false)
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)

  const currentUser = DEMO_USERS.find(u => u.email === selectedEmail) || DEMO_USERS[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (email) => {
    setSelectedEmail(email)
    setShowDropdown(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const res = login(currentUser.email, password)
    setLoading(false)
    if (res.ok) {
      navigate(ROLE_HOME[res.role] || '/dashboard')
    } else {
      setError(res.error)
    }
  }

  const userColor = getUserColor(currentUser)

  return (
    <div className="min-h-screen flex bg-zinc-950">

      {/* ── Left hero panel ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-glow flex items-center justify-center">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-zinc-50 text-base leading-tight">Everest Textile Mills</p>
            <p className="text-2xs text-zinc-500 leading-tight uppercase tracking-widest">ERP Platform</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/15 border border-primary-500/25 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-xs font-semibold text-primary-300 uppercase tracking-wider">Smart Manufacturing ERP</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-zinc-50 leading-[1.1] tracking-tight mb-4">
            One platform for<br />
            <span className="text-gradient-primary">every thread</span><br />
            of your factory.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-md">
            From raw yarn at the gate to invoiced dispatch — complete traceability,
            real-time production visibility and smart workforce management.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            {FEATURES.map(f => (
              <div key={f.title} className="card-glass p-4 rounded-2xl">
                <span className="text-xl mb-2 block">{f.icon}</span>
                <p className="text-xs font-semibold text-zinc-200">{f.title}</p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative flex items-center gap-8">
          {[
            { value: '12,400+', label: 'Rolls tracked'  },
            { value: '94.2%',   label: 'Machine uptime' },
            { value: '₹18.4L',  label: 'Sep revenue'    },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xl font-bold text-zinc-50">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right sign-in panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-glow flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <p className="font-bold text-zinc-100">Everest Textile ERP</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">Sign in</h2>
            <p className="text-sm text-zinc-500 mt-1">Select your account and enter your password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── User / Role dropdown ── */}
            <div ref={dropdownRef}>
              <label className="label">Sign in as</label>
              <button
                type="button"
                onClick={() => setShowDropdown(v => !v)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150',
                  'bg-zinc-900 hover:border-zinc-600',
                  showDropdown
                    ? 'border-primary-500/60 ring-2 ring-primary-500/20'
                    : 'border-zinc-700/80',
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-9 h-9 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center text-white font-bold text-sm',
                  userColor,
                )}>
                  {currentUser?.name?.charAt(0) ?? 'U'}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-100 leading-tight">{currentUser?.name}</p>
                  <p className="text-xs text-zinc-500 leading-tight mt-0.5">
                    {ROLE_LABELS[currentUser?.role]}
                    {currentUser?.workerId && (
                      <span className="ml-1.5 font-mono text-zinc-600">· {currentUser.workerId}</span>
                    )}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={cn('text-zinc-500 transition-transform duration-200 shrink-0', showDropdown && 'rotate-180')}
                />
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="mt-1.5 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-elevated z-50 overflow-hidden animate-scale-in max-h-80 overflow-y-auto scrollbar-thin">
                  {USER_GROUPS.map((group, gi) => (
                    <div key={group.group}>
                      {/* Group header */}
                      <div className={cn(
                        'flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/80',
                        gi > 0 && 'border-t border-zinc-700/40',
                        'bg-zinc-800/40',
                      )}>
                        {group.group === 'Floor Workers'
                          ? <Users size={11} className="text-zinc-500" />
                          : <Briefcase size={11} className="text-zinc-500" />
                        }
                        <p className="text-2xs font-bold text-zinc-500 uppercase tracking-widest">{group.group}</p>
                        <span className="ml-auto text-2xs text-zinc-700">{group.users.length} accounts</span>
                      </div>

                      {/* Users in group */}
                      {group.users.map(u => {
                        const uColor = getUserColor(u)
                        const isSelected = u.email === selectedEmail
                        return (
                          <button
                            key={u.email}
                            type="button"
                            onClick={() => handleSelect(u.email)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-100',
                              'hover:bg-zinc-800/60 border-b border-zinc-800/30 last:border-0',
                              isSelected && 'bg-primary-500/10',
                            )}
                          >
                            <div className={cn(
                              'w-8 h-8 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center text-white font-bold text-xs',
                              uColor,
                            )}>
                              {u.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-200 leading-tight">{u.name}</p>
                              <p className="text-xs text-zinc-500 leading-tight">
                                {ROLE_LABELS[u.role]}
                                {u.workerId && (
                                  <span className="ml-1.5 font-mono text-zinc-600">{u.workerId}</span>
                                )}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email — read only, derived from selection */}
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input opacity-60 cursor-default select-none"
                value={currentUser?.email ?? ''}
                readOnly
                tabIndex={-1}
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn !w-7 !h-7 !border-0 !bg-transparent"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-2xs text-zinc-600 mt-1.5">
                All demo accounts use password <code className="text-primary-400 font-mono">demo123</code>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full btn-lg mt-2"
              disabled={loading}
            >
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : <>Sign in as {currentUser?.name?.split(' ')[0]} <ArrowRight size={15} /></>
              }
            </button>
          </form>

          {/* Access summary table */}
          <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800/80 rounded-2xl">
            <p className="text-2xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Access Summary</p>
            <div className="space-y-1.5">
              {[
                { role: 'owner',      icon: '👑', desc: 'Full access — all modules'              },
                { role: 'supervisor', icon: '🏭', desc: 'Floor, machines, production'             },
                { role: 'inspector',  icon: '🔍', desc: 'Quality control & defects'               },
                { role: 'store',      icon: '📦', desc: 'Inventory & dispatch'                    },
                { role: 'accounts',   icon: '💼', desc: 'Orders, finance & payroll'               },
                { role: 'worker',     icon: '👷', desc: 'Personal attendance & wages dashboard'   },
              ].map(r => (
                <div key={r.role} className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-colors',
                  currentUser?.role === r.role ? 'bg-primary-500/10' : '',
                )}>
                  <span className="text-sm shrink-0">{r.icon}</span>
                  <span className={cn(
                    'text-xs font-semibold w-20 shrink-0 capitalize',
                    currentUser?.role === r.role ? 'text-primary-300' : 'text-zinc-400',
                  )}>
                    {r.role}
                  </span>
                  <span className="text-2xs text-zinc-600">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
