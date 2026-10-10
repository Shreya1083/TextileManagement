import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROLE_HOME } from '../../context/AuthContext'
import { Eye, EyeOff, Loader2, ArrowRight, Layers } from 'lucide-react'
import { cn } from '../../lib/utils'

// TODO (backend): This page uses client-side demo authentication only.
// Before production: remove the demo credentials hint block, connect onSubmit to
// a real API endpoint (e.g. POST /api/auth/login), and verify credentials server-side.
// The backend must validate email, password, and assigned role before issuing a session token.

const FEATURES = [
  { icon: '🧵', title: 'End-to-End Traceability',  desc: 'Track every yarn lot to finished fabric roll and dispatch' },
  { icon: '⚙️', title: 'Live Machine Monitoring',  desc: 'Real-time status for every machine on the production floor' },
  { icon: '🔍', title: 'Smart Quality Control',    desc: 'QR-based roll inspection with full defect analytics' },
  { icon: '📊', title: 'Owner Analytics',          desc: 'Revenue, P&L and order profitability in one dashboard' },
]

export default function SignInPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [showPw,    setShowPw]    = useState(false)
  const [authError, setAuthError] = useState('')
  const [loading,   setLoading]   = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '', role: '' } })

  const onSubmit = async ({ email, password, role }) => {
    setAuthError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const res = login(email, password)
    setLoading(false)
    if (res.ok) {
      // Cross-check: the submitted role must match the role assigned to this account.
      // This prevents a user from entering owner credentials while selecting a different role.
      if (res.role !== role) {
        setAuthError('The selected role does not match this account. Please choose the correct role.')
        return
      }
      navigate(ROLE_HOME[res.role] || '/dashboard')
    } else {
      setAuthError(res.error || 'Authentication failed. Check your credentials.')
    }
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">

      {/* ── Left hero panel (desktop only) ── */}
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

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-glow flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <p className="font-bold text-zinc-100">Everest Textile ERP</p>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">Sign in</h2>
              <p className="text-sm text-zinc-500 mt-1">Enter your credentials and select your role</p>
            </div>
            <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 mt-1">
              ← Back to Home
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label className="label" htmlFor="signin-email">Email Address</label>
              <input
                id="signin-email"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                className={cn('input', errors.email && 'border-red-500/70 focus:border-red-500')}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="signin-password">Password</label>
              <div className="relative">
                <input
                  id="signin-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={cn('input pr-11', errors.password && 'border-red-500/70 focus:border-red-500')}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 3, message: 'Password must be at least 3 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn !w-7 !h-7 !border-0 !bg-transparent"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Role dropdown */}
            <div>
              <label className="label" htmlFor="signin-role">Select Your Role</label>
              <select
                id="signin-role"
                className={cn('input', errors.role && 'border-red-500/70 focus:border-red-500')}
                {...register('role', { required: 'Please select your role' })}
                defaultValue=""
              >
                <option value="" disabled>Select your role</option>
                <option value="owner">Owner / Admin</option>
                <option value="store">Store Keeper</option>
                <option value="supervisor">Production Supervisor</option>
                <option value="inspector">Quality Inspector</option>
                <option value="accounts">Office / Accounts</option>
                <option value="buyer">Buyer</option>
              </select>
              {errors.role && (
                <p className="text-xs text-red-400 mt-1">{errors.role.message}</p>
              )}
            </div>

            {/* Auth error */}
            {authError && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {authError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full btn-lg mt-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Demo credentials hint — only shown in development builds, excluded from production */}
          {import.meta.env.DEV && (
          <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800/80 rounded-2xl">
            <p className="text-2xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Demo Credentials</p>
            <p className="text-xs text-zinc-500 mb-2">
              Use any email below with password{' '}
              <code className="text-primary-400 font-mono">demo123</code>
            </p>
            <div className="space-y-1">
              {[
                { email: 'owner@everest.com',      role: 'Owner / Admin' },
                { email: 'store@everest.com',       role: 'Store Keeper' },
                { email: 'supervisor@everest.com',  role: 'Production Supervisor' },
                { email: 'inspector@everest.com',   role: 'Quality Inspector' },
                { email: 'accounts@everest.com',    role: 'Office / Accounts' },
                { email: 'buyer@everest.com',       role: 'Buyer' },
              ].map(({ email, role }) => (
                <div key={email} className="flex items-center justify-between gap-2">
                  <code className="text-2xs text-zinc-600 font-mono">{email}</code>
                  <span className="text-2xs text-zinc-700 shrink-0">{role}</span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
