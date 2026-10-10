
import { useState, useRef, useEffect } from 'react'
import {
  Menu,
  Bell,
  AlertTriangle,
  AlertCircle,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react'

import { useAuth, ROLE_LABELS } from '../../context/AuthContext'
import { mockAlerts } from '../../mocks/data'
import { cn } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'

const ROLE_COLORS = {
  owner: 'from-primary-500 to-violet-600',
  store: 'from-cyan-500 to-blue-600',
  supervisor: 'from-amber-500 to-orange-600',
  inspector: 'from-emerald-500 to-teal-600',
  accounts: 'from-pink-500 to-rose-600',
}

/* ── Alerts dropdown ── */
function AlertPanel({ onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handler)

    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-elevated z-50 animate-scale-in overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-200">
            Alerts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge badge-red">
            {mockAlerts.length} new
          </span>

          <button
            type="button"
            onClick={onClose}
            className="icon-btn !w-6 !h-6 !rounded-lg"
            aria-label="Close alerts"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Alert list */}
      <ul className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto scrollbar-thin">
        {mockAlerts.length > 0 ? (
          mockAlerts.map((alert) => (
            <li
              key={alert.id}
              className="flex gap-3 px-4 py-3.5 hover:bg-zinc-800/40 transition-colors cursor-pointer"
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  alert.severity === 'danger'
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-amber-500/15 text-amber-400',
                )}
              >
                {alert.severity === 'danger' ? (
                  <AlertCircle size={13} />
                ) : (
                  <AlertTriangle size={13} />
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wider',
                    alert.severity === 'danger'
                      ? 'text-red-400'
                      : 'text-amber-400',
                  )}
                >
                  {alert.type.replace('-', ' ')}
                </p>

                <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                  {alert.message}
                </p>

                <p className="text-2xs text-zinc-600 mt-1">
                  {alert.time}
                </p>
              </div>
            </li>
          ))
        ) : (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">
            No alerts at the moment.
          </li>
        )}
      </ul>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          View all alerts →
        </button>
      </div>
    </div>
  )
}

/* ── User menu dropdown ── */
function UserMenu({ user, onClose, onLogout }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handler)

    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-elevated z-50 animate-scale-in overflow-hidden"
    >
      {/* User information */}
      <div className="px-4 py-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-base shadow-glow-sm shrink-0',
              ROLE_COLORS[user?.role] ||
                'from-zinc-500 to-zinc-700',
            )}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-100 truncate">
              {user?.name || 'User'}
            </p>

            <p className="text-xs text-zinc-500 capitalize truncate">
              {ROLE_LABELS[user?.role] || user?.role || 'Unknown role'}
            </p>

            <p className="text-2xs text-zinc-600 truncate font-mono mt-0.5">
              {user?.email || ''}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/25 transition-all duration-150 text-left"
        >
          <LogOut size={14} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

/* ── Main Topbar ── */
export function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [showAlerts, setShowAlerts] = useState(false)
  const [showUser, setShowUser] = useState(false)

  const unread = mockAlerts.filter(
    (alert) => alert.severity === 'danger',
  ).length

  const handleLogout = () => {
    setShowUser(false)
    setShowAlerts(false)
    logout()
    navigate('/signin', { replace: true })
  }

  return (
    <header className="relative z-30 h-16 flex items-center px-4 gap-3 shrink-0 bg-zinc-950 border-b border-zinc-800/60">
      {/* Mobile navigation */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden icon-btn"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Live indicator */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-2xs font-bold text-emerald-400 uppercase tracking-wider">
          Live
        </span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          type="button"
          className={cn(
            'icon-btn relative',
            showAlerts && 'bg-zinc-800 text-zinc-200',
          )}
          onClick={() => {
            setShowAlerts((previous) => !previous)
            setShowUser(false)
          }}
          aria-label={`Notifications, ${unread} unread`}
          aria-expanded={showAlerts}
        >
          <Bell size={16} />

          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-zinc-950 flex items-center justify-center">
              <span className="text-[9px] font-bold text-white leading-none">
                {unread}
              </span>
            </span>
          )}
        </button>

        {showAlerts && (
          <AlertPanel
            onClose={() => setShowAlerts(false)}
          />
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-zinc-800" />

      {/* User profile */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowUser((previous) => !previous)
            setShowAlerts(false)
          }}
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-150',
            'hover:bg-zinc-800/60 border border-transparent',
            showUser && 'bg-zinc-800/60 border-zinc-700/60',
          )}
          aria-label="Open user menu"
          aria-expanded={showUser}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shadow-glow-sm shrink-0',
              ROLE_COLORS[user?.role] ||
                'from-zinc-500 to-zinc-700',
            )}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>

          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-zinc-200 leading-tight">
              {user?.name || 'User'}
            </p>

            <p className="text-2xs text-zinc-500 capitalize leading-tight">
              {ROLE_LABELS[user?.role] || user?.role || 'Unknown role'}
            </p>
          </div>

          <ChevronDown
            size={13}
            className={cn(
              'hidden md:block text-zinc-600 transition-transform duration-150',
              showUser && 'rotate-180',
            )}
          />
        </button>

        {showUser && (
          <UserMenu
            user={user}
            onClose={() => setShowUser(false)}
            onLogout={handleLogout}
          />
        )}
      </div>
    </header>
  )
}
