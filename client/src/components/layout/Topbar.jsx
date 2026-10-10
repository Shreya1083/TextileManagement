import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, Search, X, AlertTriangle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { mockAlerts } from '../../mocks/data'
import { cn } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

function AlertPanel({ onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-elevated z-50 animate-scale-in overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-200">Alerts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-red">{mockAlerts.length} new</span>
          <button onClick={onClose} className="icon-btn !w-6 !h-6 !rounded-lg">
            <X size={11} />
          </button>
        </div>
      </div>
      <ul className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto scrollbar-thin">
        {mockAlerts.map(a => (
          <li key={a.id} className="flex gap-3 px-4 py-3.5 hover:bg-zinc-800/40 transition-colors cursor-pointer">
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
              a.severity === 'danger' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400',
            )}>
              {a.severity === 'danger'
                ? <AlertCircle size={13} />
                : <AlertTriangle size={13} />}
            </div>
            <div className="min-w-0">
              <p className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                a.severity === 'danger' ? 'text-red-400' : 'text-amber-400',
              )}>
                {a.type.replace('-', ' ')}
              </p>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{a.message}</p>
              <p className="text-2xs text-zinc-600 mt-1">{a.time}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="px-4 py-3 border-t border-zinc-800/80">
        <button className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors">
          View all alerts →
        </button>
      </div>
    </div>
  )
}

export function Topbar({ onMenuClick }) {
  const { user } = useAuth()
  const [showAlerts, setShowAlerts] = useState(false)
  const [searchFocus, setSearchFocus] = useState(false)
  const unread = mockAlerts.filter(a => a.severity === 'danger').length

  return (
    <header className="h-16 flex items-center px-4 gap-3 shrink-0 bg-zinc-925 border-b border-zinc-800/60">
      {/* Hamburger — mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden icon-btn"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className={cn(
        'hidden md:flex items-center gap-2.5 flex-1 max-w-sm px-3.5 py-2 rounded-xl',
        'bg-zinc-800/60 border transition-all duration-150',
        searchFocus
          ? 'border-primary-500/50 ring-2 ring-primary-500/15'
          : 'border-zinc-700/50 hover:border-zinc-600/80',
      )}>
        <Search size={14} className={cn('transition-colors', searchFocus ? 'text-primary-400' : 'text-zinc-500')} />
        <input
          type="text"
          placeholder="Search orders, rolls, buyers…"
          className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
        />
        <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-zinc-700/60 text-2xs text-zinc-500 font-mono">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Live indicator */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-2xs font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
      </div>

      {/* Bell */}
      <div className="relative">
        <button
          className={cn('icon-btn relative', showAlerts && 'bg-zinc-700 text-zinc-200')}
          onClick={() => setShowAlerts(v => !v)}
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-zinc-925 flex items-center justify-center">
              <span className="text-[9px] font-bold text-white leading-none">{unread}</span>
            </span>
          )}
        </button>
        {showAlerts && <AlertPanel onClose={() => setShowAlerts(false)} />}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-zinc-800" />

      {/* User */}
      <button className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-glow-sm flex-shrink-0">
          {user?.name?.charAt(0) ?? 'U'}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-semibold text-zinc-200 leading-tight group-hover:text-zinc-50 transition-colors">
            {user?.name}
          </p>
          <p className="text-2xs text-zinc-500 capitalize leading-tight">{user?.role}</p>
        </div>
      </button>
    </header>
  )
}
