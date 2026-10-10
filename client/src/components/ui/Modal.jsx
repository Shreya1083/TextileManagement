import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Modal({ open, onClose, title, children, size = 'md', description }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizeClass = {
    xs: 'max-w-sm',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-lg'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={cn(
        'relative w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-modal animate-scale-in',
        sizeClass,
      )}>
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-zinc-800/80">
            <div>
              {title && <h2 className="text-base font-semibold text-zinc-50">{title}</h2>}
              {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="btn-ghost btn-xs ml-4 -mt-1 !px-1.5 !py-1.5"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
