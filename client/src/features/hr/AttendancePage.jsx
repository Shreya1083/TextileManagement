import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, ScanLine, Save } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { mockWorkers } from '../../mocks/data'
import { cn } from '../../lib/utils'

const STATUS_CFG = {
  PRESENT:  { label: 'Present',  short: 'P', bg: 'bg-emerald-500/15 border-emerald-500/40', text: 'text-emerald-300', icon: CheckCircle2, dot: 'bg-emerald-400' },
  ABSENT:   { label: 'Absent',   short: 'A', bg: 'bg-red-500/15 border-red-500/40',         text: 'text-red-300',     icon: XCircle,      dot: 'bg-red-400'     },
  HALF_DAY: { label: 'Half Day', short: 'H', bg: 'bg-amber-500/15 border-amber-500/40',     text: 'text-amber-300',   icon: Clock,        dot: 'bg-amber-400'   },
}
const CYCLE = ['PRESENT', 'ABSENT', 'HALF_DAY']

export default function AttendancePage() {
  const [shift, setShift] = useState('Morning')
  const [att, setAtt] = useState(Object.fromEntries(mockWorkers.map(w => [w.id, 'PRESENT'])))
  const cycle = id => setAtt(p => ({ ...p, [id]: CYCLE[(CYCLE.indexOf(p[id]) + 1) % CYCLE.length] }))
  const counts = {
    PRESENT:  Object.values(att).filter(v => v === 'PRESENT').length,
    ABSENT:   Object.values(att).filter(v => v === 'ABSENT').length,
    HALF_DAY: Object.values(att).filter(v => v === 'HALF_DAY').length,
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Attendance"
        subtitle={`${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'short', year:'numeric' })} — mark shift attendance`}
        actions={<button className="btn-secondary btn-sm"><ScanLine size={13} />QR Session</button>}
      />

      {/* Shift picker + summary */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {['Morning','Afternoon','Night'].map(s => (
            <button key={s} onClick={() => setShift(s)}
              className={cn('btn-secondary btn-sm', shift === s && 'bg-primary-500/15 border-primary-500/50 text-primary-300')}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5 text-xs">
          {Object.entries(STATUS_CFG).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', c.dot)} />
              <span className={c.text}>{counts[k]} {c.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Attendance grid */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <p className="section-title">{shift} Shift — {mockWorkers.length} workers</p>
          <p className="text-2xs text-zinc-600">Click status to toggle P → A → H</p>
        </div>
        <div className="divide-y divide-zinc-800/40">
          {mockWorkers.map(w => {
            const s = att[w.id]
            const cfg = STATUS_CFG[s]
            return (
              <div key={w.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-bold">
                    {w.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{w.name}</p>
                    <p className="text-xs text-zinc-600">{w.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => cycle(w.id)}
                  className={cn('flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-150 select-none', cfg.bg, cfg.text)}
                >
                  <cfg.icon size={12} />
                  {cfg.label}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary gap-2"><Save size={14} />Save Attendance</button>
      </div>
    </div>
  )
}
