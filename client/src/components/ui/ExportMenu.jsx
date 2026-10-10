/**
 * ExportMenu — dropdown button with PDF and Excel options.
 *
 * Props:
 *   onExportPDF   () => void
 *   onExportExcel () => void
 *   disabled      boolean  (optional)
 */
import { useState, useRef, useEffect } from 'react'
import { Download, FileText, Sheet, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ExportMenu({ onExportPDF, onExportExcel, onExportCSV, disabled = false }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(null) // 'pdf' | 'excel' | 'csv' | null
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handle = async (type) => {
    setOpen(false)
    setLoading(type)
    try {
      if (type === 'pdf' && onExportPDF)     await onExportPDF()
      if (type === 'excel' && onExportExcel) await onExportExcel()
      if (type === 'csv' && onExportCSV)     await onExportCSV()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled || loading !== null}
        onClick={() => setOpen(v => !v)}
        className={cn(
          'btn-secondary btn-sm gap-1.5',
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
        )}
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Download size={13} />
        )}
        Export
        <ChevronDown size={11} className={cn('transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-elevated z-50 animate-scale-in overflow-hidden">
          {onExportCSV && (
            <button
              onClick={() => handle('csv')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors text-left"
            >
              <FileText size={14} className="text-cyan-400 shrink-0" />
              Export as CSV
            </button>
          )}
          {onExportExcel && (
            <button
              onClick={() => handle('excel')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors text-left"
            >
              <Sheet size={14} className="text-emerald-400 shrink-0" />
              Export as Excel
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={() => handle('pdf')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors text-left"
            >
              <FileText size={14} className="text-red-400 shrink-0" />
              Export as PDF
            </button>
          )}
        </div>
      )}
    </div>
  )
}
