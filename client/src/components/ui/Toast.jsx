import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

/* ── Context ──────────────────────────────────────────────────────────────── */
const ToastCtx = createContext(null)

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error:   XCircle,
  info:    Info,
}
const COLORS = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-500/40  bg-amber-500/10  text-amber-300',
  error:   'border-red-500/40    bg-red-500/10    text-red-300',
  info:    'border-primary-500/40 bg-primary-500/10 text-primary-300',
}

let _toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = ICONS[t.type] || Info
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-elevated',
                'backdrop-blur-sm min-w-[260px] max-w-[360px]',
                'animate-scale-in pointer-events-auto',
                'bg-zinc-900/95',
                COLORS[t.type],
              )}
            >
              <Icon size={15} className="shrink-0" />
              <p className="text-sm font-medium flex-1 text-zinc-200">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
