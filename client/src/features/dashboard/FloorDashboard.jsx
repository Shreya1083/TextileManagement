import { useState } from 'react'
import { Zap, AlertTriangle, Clock, Activity, RefreshCw, ChevronRight } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth }    from '../../context/AuthContext'
import { ROLE_LABELS } from '../../context/AuthContext'
import { mockMachines, mockStats } from '../../mocks/data'
import { cn } from '../../lib/utils'

const STATUS = {
  RUNNING:   {
    border: 'border-emerald-500/40', bg: 'hover:border-emerald-500/70',
    dot: 'bg-emerald-400 animate-pulse', label: 'Running', text: 'text-emerald-400',
    badge: 'badge-green',
  },
  IDLE: {
    border: 'border-zinc-700/60', bg: 'hover:border-zinc-600',
    dot: 'bg-amber-400', label: 'Idle', text: 'text-amber-400',
    badge: 'badge-yellow',
  },
  BREAKDOWN: {
    border: 'border-red-500/50', bg: 'hover:border-red-500/80',
    dot: 'bg-red-500 animate-pulse', label: 'Breakdown', text: 'text-red-400',
    badge: 'badge-red',
  },
}

function MachineCard({ m }) {
  const s = STATUS[m.status] || STATUS.IDLE
  return (
    <div className={cn(
      'card p-4 cursor-pointer transition-all duration-200 border-2 group',
      s.border, s.bg,
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-2xs font-mono text-zinc-600 mb-0.5">{m.id}</p>
          <p className="text-sm font-bold text-zinc-100">{m.name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
          <span className={cn('text-xs font-semibold', s.text)}>{s.label}</span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-zinc-600">Stage</span>
          <span className="badge badge-purple !py-0 !text-xs">{m.stage}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-600">Order</span>
          <span className={m.order ? 'font-mono text-primary-400 font-semibold' : 'text-zinc-700'}>
            {m.order ?? '—'}
          </span>
        </div>
        {m.operator && (
          <div className="flex justify-between items-center">
            <span className="text-zinc-600">Operator</span>
            <span className="text-zinc-300">{m.operator}</span>
          </div>
        )}
        <div className="pt-2 mt-1 border-t border-zinc-800/60 flex justify-between items-center">
          <span className="text-zinc-600">Output today</span>
          <span className={cn('font-bold text-sm', m.output > 0 ? 'text-zinc-100' : 'text-zinc-700')}>
            {m.output > 0 ? `${m.output} m` : '—'}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <span className="text-2xs text-zinc-700 group-hover:text-primary-400 transition-colors flex items-center gap-0.5">
          Details <ChevronRight size={10} />
        </span>
      </div>
    </div>
  )
}

export default function FloorDashboard() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('ALL')
  const counts = {
    RUNNING:   mockMachines.filter(m => m.status === 'RUNNING').length,
    IDLE:      mockMachines.filter(m => m.status === 'IDLE').length,
    BREAKDOWN: mockMachines.filter(m => m.status === 'BREAKDOWN').length,
  }
  const filtered     = filter === 'ALL' ? mockMachines : mockMachines.filter(m => m.status === filter)
  const totalOutput  = mockMachines.reduce((s, m) => s + m.output, 0)

  return (
    <div className="page-root">
      <PageHeader
        title={`Floor Monitor — ${user?.name?.split(' ')[0]}`}
        subtitle={`${ROLE_LABELS[user?.role] || user?.role} · Live machine board — production status`}
        actions={
          <button className="btn-secondary btn-sm">
            <RefreshCw size={13} />Refresh
          </button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: Zap,           bg: 'bg-emerald-500/15', clr: 'text-emerald-400', val: counts.RUNNING,              lbl: 'Running',        sub: `of ${mockStats.machines.total} machines` },
          { icon: Clock,         bg: 'bg-amber-500/15',   clr: 'text-amber-400',   val: counts.IDLE,                  lbl: 'Idle',           sub: 'Awaiting assignment' },
          { icon: AlertTriangle, bg: 'bg-red-500/15',     clr: 'text-red-400',     val: counts.BREAKDOWN,             lbl: 'Breakdown',      sub: 'Needs maintenance' },
          { icon: Activity,      bg: 'bg-primary-500/15', clr: 'text-primary-400', val: `${totalOutput.toLocaleString()} m`, lbl: 'Total output', sub: 'Today across all machines' },
        ].map(c => (
          <div key={c.lbl} className="card p-5 flex items-center gap-4">
            <div className={cn('stat-card-icon', c.bg)}>
              <c.icon size={18} className={c.clr} />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-50">{c.val}</p>
              <p className="text-xs font-semibold text-zinc-400">{c.lbl}</p>
              <p className="text-2xs text-zinc-600 mt-0.5">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'ALL', label: `All Machines (${mockMachines.length})` },
          { key: 'RUNNING',   label: `Running (${counts.RUNNING})` },
          { key: 'IDLE',      label: `Idle (${counts.IDLE})` },
          { key: 'BREAKDOWN', label: `Breakdown (${counts.BREAKDOWN})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              'btn-secondary btn-sm',
              filter === t.key && 'bg-primary-500/15 border-primary-500/50 text-primary-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Machine grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(m => <MachineCard key={m.id} m={m} />)}
      </div>
    </div>
  )
}
