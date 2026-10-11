import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import { ROLE_OPTIONS, WORKER_LIST, ROLE_HOME } from '../../context/AuthContext'
import {
  Eye, EyeOff, Loader2, ArrowRight, Layers, ChevronDown,
  Boxes, Factory, Search, BarChart3, Shield, Package, Briefcase, User, ShoppingCart,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const FEATURES = [
  { icon: Boxes, title: 'End-to-End Traceability',  desc: 'Track every yarn lot to finished roll and dispatch' },
  { icon: Factory, title: 'Live Machine Monitoring',  desc: 'Real-time status for every machine on the floor'   },
  { icon: Search, title: 'Smart Quality Control',    desc: 'QR-based roll inspection with defect analytics'     },
  { icon: BarChart3, title: 'Admin Analytics',          desc: 'Revenue, P&L and order profitability at a glance'  },
]

const ROLE_ICONS = {
  shield: Shield,
  factory: Factory,
  search: Search,
  package: Package,
  briefcase: Briefcase,
  user: User,
  'shopping-cart': ShoppingCart,
}

function RoleIcon({ name }) {
  const Icon = ROLE_ICONS[name] || User
  return <Icon size={17} />
}

export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const roleRef      = useRef(null)
  const workerRef    = useRef(null)

  // Step 1: role selection (one of ROLE_OPTIONS)
  const [selectedRole, setSelectedRole]     = useState(ROLE_OPTIONS[0])
  const [showRoleMenu, setShowRoleMenu]     = useState(false)

  // Step 2: worker sub-picker (only when role = 'worker')
  const [selectedWorker, setSelectedWorker] = useState(WORKER_LIST[0])
  const [showWorkerMenu, setShowWorkerMenu] = useState(false)

  const [password, setPassword] = useState('Admin@123')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Derive the email to authenticate with
  const loginEmail = selectedRole.role === 'worker'
    ? (selectedWorker?.email || 'worker@textile.com')
    : `${selectedRole.role}@textile.com`

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (roleRef.current   && !roleRef.current.contains(e.target))   setShowRoleMenu(false)
      if (workerRef.current && !workerRef.current.contains(e.target)) setShowWorkerMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleRoleSelect = (opt) => {
    setSelectedRole(opt)
    setShowRoleMenu(false)
    setError('')
    // Reset worker to first when switching back to worker
    if (opt.role === 'worker') setSelectedWorker(WORKER_LIST[0])
  }

  const handleWorkerSelect = (w) => {
    setSelectedWorker(w)
    setShowWorkerMenu(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 300))
    
    const res = await login(loginEmail, password)
    setLoading(false)
    
    if (res.ok) {
      navigate(ROLE_HOME[res.role] || '/dashboard')
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      {/* ── Left hero ── */}
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
            <p className="font-bold text-zinc-50 text-base leading-tight">Textile ERP</p>
            <p className="text-2xs text-zinc-500 leading-tight uppercase tracking-widest">Management System</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/15 border border-primary-500/25 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-xs font-semibold text-primary-300 uppercase tracking-wider">Manufacturing ERP</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-zinc-50 leading-[1.1] tracking-tight mb-4">
            Streamline your<br />
            <span className="text-gradient-primary">textile operations</span><br />
            with ease.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-md">
            Complete manufacturing management - from inventory to production,
            quality control to dispatch.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            {FEATURES.map(({ icon: Icon, ...feature }) => (
              <div key={feature.title} className="card-glass p-4 rounded-2xl">
                <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15 text-primary-300">
                  <Icon size={17} />
                </span>
                <p className="text-xs font-semibold text-zinc-200">{feature.title}</p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative flex items-center gap-8">
          {[
            { value: '24/7', label: 'Support'  },
            { value: 'Secure',   label: 'Data protection' },
            { value: 'Fast',  label: 'Performance'    },
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
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-glow flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <p className="font-bold text-zinc-100">Textile ERP</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">Sign in</h2>
            <p className="text-sm text-zinc-500 mt-1">Choose your role and enter your password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Role dropdown ── */}
            <div ref={roleRef}>
              <label className="label">Role</label>
              <button
                type="button"
                onClick={() => { setShowRoleMenu(v => !v); setShowWorkerMenu(false) }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left',
                  'bg-zinc-900 hover:border-zinc-600 transition-all duration-150',
                  showRoleMenu
                    ? 'border-primary-500/60 ring-2 ring-primary-500/20'
                    : 'border-zinc-700/80',
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center text-white',
                  selectedRole.color,
                )}>
                  <RoleIcon name={selectedRole.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-100 leading-tight">{selectedRole.label}</p>
                  <p className="text-xs text-zinc-500 leading-tight mt-0.5">{selectedRole.desc}</p>
                </div>
                <ChevronDown size={16} className={cn('text-zinc-500 transition-transform duration-200 shrink-0', showRoleMenu && 'rotate-180')} />
              </button>

              {showRoleMenu && (
                <div className="mt-1.5 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-elevated z-50 overflow-hidden animate-scale-in">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => handleRoleSelect(opt)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-100',
                        'hover:bg-zinc-800/60 border-b border-zinc-800/30 last:border-0',
                        selectedRole.role === opt.role && 'bg-primary-500/10',
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center text-white',
                        opt.color,
                      )}>
                        <RoleIcon name={opt.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 leading-tight">{opt.label}</p>
                        <p className="text-xs text-zinc-500 leading-tight mt-0.5">{opt.desc}</p>
                      </div>
                      {selectedRole.role === opt.role && (
                        <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Worker sub-picker — only when Worker role is selected ── */}
            {selectedRole.role === 'worker' && (
              <div ref={workerRef} className="animate-fade-in">
                <label className="label">Select Worker ID</label>
                <button
                  type="button"
                  onClick={() => { setShowWorkerMenu(v => !v); setShowRoleMenu(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left',
                    'bg-zinc-900 hover:border-zinc-600 transition-all duration-150',
                    showWorkerMenu
                      ? 'border-primary-500/60 ring-2 ring-primary-500/20'
                      : 'border-zinc-700/80',
                  )}
                >
                  {/* Worker ID badge */}
                  <div className="w-9 h-9 rounded-xl bg-zinc-700 shrink-0 flex items-center justify-center text-xs font-black text-zinc-200 font-mono">
                    {selectedWorker.workerId?.replace('W-', '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-100 leading-tight">{selectedWorker.name}</p>
                    <p className="text-xs text-zinc-500 leading-tight mt-0.5 font-mono">{selectedWorker.workerId} · {selectedWorker.dept}</p>
                  </div>
                  <ChevronDown size={15} className={cn('text-zinc-500 transition-transform duration-200 shrink-0', showWorkerMenu && 'rotate-180')} />
                </button>

                {showWorkerMenu && (
                  <div className="mt-1.5 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-elevated z-50 overflow-hidden animate-scale-in max-h-56 overflow-y-auto scrollbar-thin">
                    {WORKER_LIST.map(w => (
                      <button
                        key={w.workerId}
                        type="button"
                        onClick={() => handleWorkerSelect(w)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-100',
                          'hover:bg-zinc-800/60 border-b border-zinc-800/30 last:border-0',
                          selectedWorker.workerId === w.workerId && 'bg-primary-500/10',
                        )}
                      >
                        <div className="w-8 h-8 rounded-xl bg-zinc-700 shrink-0 flex items-center justify-center text-xs font-black text-zinc-200 font-mono">
                          {w.workerId?.replace('W-', '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 leading-tight">{w.name}</p>
                          <p className="text-xs text-zinc-500 leading-tight font-mono">{w.workerId} · {w.dept}</p>
                        </div>
                        {selectedWorker.workerId === w.workerId && (
                          <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Password ── */}
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
                Password: <code className="text-primary-400 font-mono">Admin@123</code>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full btn-lg mt-2" disabled={loading}>
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : <>
                    Sign in as {selectedRole.role === 'worker' ? selectedWorker.name.split(' ')[0] : selectedRole.label.split(' ')[0]}
                    <ArrowRight size={15} />
                  </>
              }
            </button>
          </form>

          {/* Access summary */}
          <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800/80 rounded-2xl">
            <p className="text-2xs font-bold text-zinc-600 uppercase tracking-wider mb-3">Access levels</p>
            <div className="space-y-1">
              {ROLE_OPTIONS.map(r => (
                <div key={r.role} className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-colors',
                  selectedRole.role === r.role ? 'bg-primary-500/10' : '',
                )}>
                  <span className="text-base shrink-0">{r.icon}</span>
                  <span className={cn(
                    'text-xs font-semibold w-24 shrink-0',
                    selectedRole.role === r.role ? 'text-primary-300' : 'text-zinc-500',
                  )}>
                    {r.label.split(' ')[0]}
                  </span>
                  <span className="text-2xs text-zinc-600 truncate">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
