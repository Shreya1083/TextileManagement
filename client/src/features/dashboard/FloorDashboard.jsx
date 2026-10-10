import { useState, useCallback } from 'react'
import { Zap, AlertTriangle, Clock, Activity, RefreshCw, ChevronRight, X, CheckCircle, WrenchIcon } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { useAuth }    from '../../context/AuthContext'
import { ROLE_LABELS } from '../../context/AuthContext'
import { mockMachines, mockStats } from '../../mocks/data'
import { cn } from '../../lib/utils'

const STATUS_CFG = {
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

function MachineCard({ m, onClick }) {
  const s = STATUS_CFG[m.status] || STATUS_CFG.IDLE
  return (
    <button
      type="button"
      onClick={() => onClick(m)}
      className={cn(
        'card p-4 cursor-pointer transition-all duration-200 border-2 group text-left w-full',
        s.border, s.bg,
      )}
    >
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
    </button>
  )
}

export default function FloorDashboard() {
  const { user }  = useAuth()
  const toast     = useToast()

  const [machines, setMachines]       = useState(mockMachines)
  const [filter, setFilter]           = useState('ALL')
  const [refreshing, setRefreshing]   = useState(false)
  const [selectedMachine, setSelectedMachine] = useState(null)

  const counts = {
    RUNNING:   machines.filter(m => m.status === 'RUNNING').length,
    IDLE:      machines.filter(m => m.status === 'IDLE').length,
    BREAKDOWN: machines.filter(m => m.status === 'BREAKDOWN').length,
  }
  const filtered    = filter === 'ALL' ? machines : machines.filter(m => m.status === filter)
  const totalOutput = machines.reduce((s, m) => s + m.output, 0)

  // ── Refresh ──────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      toast('Floor data refreshed', 'success')
    }, 1200)
  }, [toast])

  // ── Status change (mark idle/running/breakdown) ──────────────────────────
  const changeStatus = useCallback((machineId, newStatus) => {
    setMachines(prev =>
      prev.map(m => m.id === machineId ? { ...m, status: newStatus } : m)
    )
    setSelectedMachine(prev => prev?.id === machineId ? { ...prev, status: newStatus } : prev)
    toast(
      `${machineId} marked as ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}`,
      newStatus === 'BREAKDOWN' ? 'warning' : newStatus === 'RUNNING' ? 'success' : 'info'
    )
  }, [toast])

  const FILTER_TABS = [
    { key: 'ALL',       label: `All Machines (${machines.length})` },
    { key: 'RUNNING',   label: `Running (${counts.RUNNING})` },
    { key: 'IDLE',      label: `Idle (${counts.IDLE})` },
    { key: 'BREAKDOWN', label: `Breakdown (${counts.BREAKDOWN})` },
  ]

  return (
    <div className="page-root">
      <PageHeader
        title={`Floor Monitor — ${user?.name?.split(' ')[0]}`}
        subtitle={`${ROLE_LABELS[user?.role] || user?.role} · Live machine board — production status`}
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary btn-sm gap-1.5"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      {/* Summary strip — clickable to set filter */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: Zap,           bg: 'bg-emerald-500/15', clr: 'text-emerald-400', val: counts.RUNNING,              lbl: 'Running',      sub: `of ${mockStats.machines.total} machines`, key: 'RUNNING' },
          { icon: Clock,         bg: 'bg-amber-500/15',   clr: 'text-amber-400',   val: counts.IDLE,                  lbl: 'Idle',         sub: 'Awaiting assignment',                     key: 'IDLE' },
          { icon: AlertTriangle, bg: 'bg-red-500/15',     clr: 'text-red-400',     val: counts.BREAKDOWN,             lbl: 'Breakdown',    sub: 'Needs maintenance',                       key: 'BREAKDOWN' },
          { icon: Activity,      bg: 'bg-primary-500/15', clr: 'text-primary-400', val: `${totalOutput.toLocaleString()} m`, lbl: 'Total output', sub: 'Today across all machines', key: 'ALL' },
        ].map(c => (
          <button
            key={c.lbl}
            onClick={() => setFilter(c.key)}
            className={cn(
              'card p-5 flex items-center gap-4 text-left transition-colors',
              filter === c.key && 'border-primary-500/40',
            )}
          >
            <div className={cn('stat-card-icon', c.bg)}>
              <c.icon size={18} className={c.clr} />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-50">{c.val}</p>
              <p className="text-xs font-semibold text-zinc-400">{c.lbl}</p>
              <p className="text-2xs text-zinc-600 mt-0.5">{c.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_TABS.map(t => (
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
        {filtered.map(m => (
          <MachineCard key={m.id} m={m} onClick={setSelectedMachine} />
        ))}
      </div>

      {/* ── Machine Detail Modal ── */}
      <Modal
        open={!!selectedMachine}
        onClose={() => setSelectedMachine(null)}
        title={`${selectedMachine?.name} (${selectedMachine?.id})`}
        description={`${selectedMachine?.stage} stage`}
        size="sm"
      >
        {selectedMachine && (() => {
          const s = STATUS_CFG[selectedMachine.status] || STATUS_CFG.IDLE
          return (
            <div className="space-y-4">
              {/* Status + output */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
                    <span className={cn('text-sm font-bold', s.text)}>{s.label}</span>
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1">Output Today</p>
                  <p className="text-sm font-bold text-zinc-100">
                    {selectedMachine.output > 0 ? `${selectedMachine.output} m` : '—'}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1">Assigned Order</p>
                  <p className="text-sm font-bold text-primary-400">
                    {selectedMachine.order ?? '—'}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1">Operator</p>
                  <p className="text-sm font-bold text-zinc-100">
                    {selectedMachine.operator ?? '—'}
                  </p>
                </div>
              </div>

              {/* Status change actions */}
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-2">Change Status</p>
                <div className="flex gap-2">
                  <button
                    disabled={selectedMachine.status === 'RUNNING'}
                    onClick={() => changeStatus(selectedMachine.id, 'RUNNING')}
                    className="btn-secondary btn-sm flex-1 gap-1.5 disabled:opacity-40"
                  >
                    <CheckCircle size={13} className="text-emerald-400" /> Running
                  </button>
                  <button
                    disabled={selectedMachine.status === 'IDLE'}
                    onClick={() => changeStatus(selectedMachine.id, 'IDLE')}
                    className="btn-secondary btn-sm flex-1 gap-1.5 disabled:opacity-40"
                  >
                    <Clock size={13} className="text-amber-400" /> Idle
                  </button>
                  <button
                    disabled={selectedMachine.status === 'BREAKDOWN'}
                    onClick={() => changeStatus(selectedMachine.id, 'BREAKDOWN')}
                    className="btn-secondary btn-sm flex-1 gap-1.5 disabled:opacity-40"
                  >
                    <AlertTriangle size={13} className="text-red-400" /> Breakdown
                  </button>
                </div>
              </div>

              <button
                className="w-full btn-ghost btn-sm"
                onClick={() => setSelectedMachine(null)}
              >
                Close
              </button>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
