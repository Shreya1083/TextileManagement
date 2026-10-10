import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Loader2, ArrowRight, Layers } from 'lucide-react'
import { cn } from '../../lib/utils'

const DEMO_ROLES = [
  { label: 'Owner',      email: 'owner@everest.com',      color: 'from-primary-500 to-violet-600',  desc: 'Full access'          },
  { label: 'Supervisor', email: 'supervisor@everest.com', color: 'from-amber-500 to-orange-600',    desc: 'Production floor'     },
  { label: 'Inspector',  email: 'inspector@everest.com',  color: 'from-emerald-500 to-teal-600',    desc: 'Quality control'      },
  { label: 'Store',      email: 'store@everest.com',      color: 'from-cyan-500 to-blue-600',       desc: 'Inventory & dispatch' },
  { label: 'Accounts',   email: 'accounts@everest.com',   color: 'from-pink-500 to-rose-600',       desc: 'Finance & orders'     },
]

const FEATURES = [
  { icon: '🧵', title: 'End-to-End Traceability',    desc: 'Track every yarn lot to finished fabric roll to dispatch' },
  { icon: '⚙️', title: 'Live Machine Monitoring',    desc: 'Real-time status for every machine on the production floor' },
  { icon: '🔍', title: 'Smart Quality Control',      desc: 'QR-based roll inspection with defect analytics' },
  { icon: '📊', title: 'Owner Analytics',            desc: 'Revenue, P&L, order profitability in one dashboard' },
]

export default function LoginPage() {
  const { login }     = useAuth()
  const navigate      = useNavigate()
  const [email, setEmail]       = useState('owner@everest.com')
  const [password, setPassword] = useState('demo123')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const res = login(email, password)
    setLoading(false)
    if (res.ok) navigate('/dashboard')
    else setError(res.error)
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-grid opacity-100" />
        {/* Glow orbs */}
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

        {/* Hero text */}
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

        {/* Bottom stats */}
        <div className="relative flex items-center gap-8">
          {[
            { value: '12,400+', label: 'Rolls tracked' },
            { value: '94.2%',   label: 'Machine uptime' },
            { value: '₹18.4L',  label: 'Sep revenue' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xl font-bold text-zinc-50">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-glow flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <p className="font-bold text-zinc-100">Everest Textile ERP</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">Sign in</h2>
            <p className="text-sm text-zinc-500 mt-1">Welcome back — enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>
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
                : <>Sign in <ArrowRight size={15} /></>
              }
            </button>
          </form>

          {/* Demo quick-login */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-zinc-800" />
              <p className="text-xs text-zinc-600 font-medium">Demo accounts</p>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
            <div className="space-y-1.5">
              {DEMO_ROLES.map(r => (
                <button
                  key={r.email}
                  type="button"
                  onClick={() => { setEmail(r.email); setPassword('demo123') }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-150',
                    email === r.email
                      ? 'border-primary-500/50 bg-primary-500/10 text-zinc-200'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-zinc-300',
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shrink-0',
                    r.color,
                  )}>
                    {r.label[0]}
                  </div>
                  <span className="text-xs font-semibold flex-1 text-left">{r.label}</span>
                  <span className="text-2xs text-zinc-600">{r.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-2xs text-zinc-600 mt-3">
              All demo accounts use password <code className="text-primary-400 font-mono">demo123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
