import { useState } from 'react'
import {
  Zap,
  AlertTriangle,
  Clock,
  Activity,
  RefreshCw,
  ChevronRight,
  Settings2,
  CheckCircle2,
  Play,
  Pause,
  AlertOctagon,
  Wrench,
  User,
  Package,
  Layers,
  Save,
  Check,
  X
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { useAuth, ROLE_LABELS } from '../../context/AuthContext'
import { useFloorStats, useMachines, useUpdateMachine, useOrders, useWorkers } from '../../hooks/useAPI'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

const STATUS = {
  RUNNING: {
    border: 'border-emerald-500/40 hover:border-emerald-500/80',
    bg: 'bg-emerald-950/10',
    dot: 'bg-emerald-400 animate-pulse',
    label: 'Running',
    text: 'text-emerald-400',
    badge: 'badge-green',
  },
  IDLE: {
    border: 'border-amber-500/30 hover:border-amber-500/70',
    bg: 'bg-amber-950/10',
    dot: 'bg-amber-400',
    label: 'Idle',
    text: 'text-amber-400',
    badge: 'badge-yellow',
  },
  BREAKDOWN: {
    border: 'border-red-500/50 hover:border-red-500/90',
    bg: 'bg-red-950/20',
    dot: 'bg-red-500 animate-pulse',
    label: 'Breakdown',
    text: 'text-red-400',
    badge: 'badge-red',
  },
}

const STAGES = ['SPINNING', 'WEAVING', 'DYEING', 'FINISHING', 'PRINTING', 'PACKING']

const BREAKDOWN_REASONS = [
  'Motor Overheat',
  'Yarn / Thread Break',
  'Roller / Belt Jam',
  'Electrical / Sensor Fault',
  'Hydraulic Pressure Drop',
  'Routine Maintenance',
]

function MachineCard({ m, onSelect, onQuickStatus, isPending }) {
  const s = STATUS[m.status] || STATUS.IDLE

  return (
    <div
      onClick={onSelect}
      className={cn(
        'card p-4.5 cursor-pointer transition-all duration-200 border-2 group relative flex flex-col justify-between hover:shadow-lg',
        s.border,
        s.bg
      )}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-2xs font-mono text-zinc-500 mb-0.5">{m.machineId || m.id}</p>
            <p className="text-base font-bold text-zinc-100 group-hover:text-primary-300 transition-colors">
              {m.name}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800">
            <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
            <span className={cn('text-xs font-semibold', s.text)}>{s.label}</span>
          </div>
        </div>

        {/* Machine Meta */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <Layers size={12} /> Stage
            </span>
            <span className="badge badge-purple !py-0.5 !text-2xs">{m.stage}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <Package size={12} /> Order
            </span>
            <span className={m.order ? 'font-mono text-primary-400 font-semibold text-xs' : 'text-zinc-600'}>
              {m.order || '—'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <User size={12} /> Operator
            </span>
            <span className="text-zinc-300 font-medium truncate max-w-[120px]">
              {m.operator || 'Unassigned'}
            </span>
          </div>

          <div className="pt-2 mt-1 border-t border-zinc-800/80 flex justify-between items-center">
            <span className="text-zinc-500">Output Today</span>
            <span className={cn('font-bold text-sm font-mono', m.output > 0 ? 'text-zinc-100' : 'text-zinc-600')}>
              {(m.output || 0).toLocaleString()} m
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Quick Status Switcher & Manage */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-1">
        {/* Quick Status Buttons */}
        <div
          className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800/80 shadow-inner"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Switch to Running"
            disabled={isPending}
            onClick={() => onQuickStatus(m, 'RUNNING')}
            className={cn(
              'px-2 py-0.5 rounded text-2xs font-bold transition-all flex items-center gap-1',
              m.status === 'RUNNING'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800'
            )}
          >
            <Play size={9} fill={m.status === 'RUNNING' ? 'currentColor' : 'none'} />
            Run
          </button>
          <button
            type="button"
            title="Switch to Idle"
            disabled={isPending}
            onClick={() => onQuickStatus(m, 'IDLE')}
            className={cn(
              'px-2 py-0.5 rounded text-2xs font-bold transition-all flex items-center gap-1',
              m.status === 'IDLE'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
            )}
          >
            <Pause size={9} fill={m.status === 'IDLE' ? 'currentColor' : 'none'} />
            Idle
          </button>
          <button
            type="button"
            title="Report Breakdown"
            disabled={isPending}
            onClick={() => onQuickStatus(m, 'BREAKDOWN')}
            className={cn(
              'px-2 py-0.5 rounded text-2xs font-bold transition-all flex items-center gap-1',
              m.status === 'BREAKDOWN'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
            )}
          >
            <AlertOctagon size={9} />
            Down
          </button>
        </div>

        <button
          type="button"
          className="text-2xs text-zinc-500 group-hover:text-primary-400 transition-colors flex items-center gap-0.5 font-medium px-2 py-1"
        >
          Manage <ChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}

export default function FloorDashboard() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [toast, setToast] = useState(null)

  // API hooks
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch } = useFloorStats()
  const { data: machinesData, isLoading: machinesLoading } = useMachines()
  const { data: ordersData } = useOrders()
  const { data: workersData } = useWorkers()
  const updateMachine = useUpdateMachine()

  const stats = statsData?.data || {}
  const allMachines = machinesData?.data || []
  const orders = ordersData?.data || []
  const workers = workersData?.data || []

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Open Edit Modal for a machine
  const handleOpenEdit = (machine) => {
    setSelected(machine)
    setEditForm({
      id: machine.id,
      machineId: machine.machineId || machine.id,
      name: machine.name || '',
      stage: machine.stage || 'WEAVING',
      status: machine.status || 'RUNNING',
      order: machine.order || '',
      operator: machine.operator || '',
      output: machine.output || 0,
      reason: '',
    })
  }

  // Quick 1-click status update from machine card
  const handleQuickStatus = async (machine, targetStatus) => {
    if (machine.status === targetStatus) return

    try {
      await updateMachine.mutateAsync({
        id: machine.id,
        data: {
          status: targetStatus,
          reason: targetStatus === 'BREAKDOWN' ? 'Quick breakdown reported from Floor Monitor' : undefined,
        },
      })
      showToast(`${machine.name} status updated to ${targetStatus}`)
    } catch (err) {
      showToast(err?.message || 'Failed to update machine status', 'error')
    }
  }

  // Save changes from full edit modal
  const handleSaveModal = async (e) => {
    e.preventDefault()
    if (!editForm) return

    try {
      await updateMachine.mutateAsync({
        id: editForm.id,
        data: {
          status: editForm.status,
          order: editForm.order || null,
          operator: editForm.operator || null,
          output: Number(editForm.output) || 0,
          stage: editForm.stage,
          name: editForm.name,
          reason: editForm.status === 'BREAKDOWN' ? editForm.reason || 'Reported breakdown' : undefined,
        },
      })
      showToast(`${editForm.name} updated successfully!`)
      setSelected(null)
      setEditForm(null)
    } catch (err) {
      showToast(err?.message || 'Failed to update machine', 'error')
    }
  }

  const counts = {
    RUNNING: allMachines.filter((m) => m.status === 'RUNNING').length,
    IDLE: allMachines.filter((m) => m.status === 'IDLE').length,
    BREAKDOWN: allMachines.filter((m) => m.status === 'BREAKDOWN').length,
  }
  const filtered = filter === 'ALL' ? allMachines : allMachines.filter((m) => m.status === filter)
  const totalOutput = allMachines.reduce((s, m) => s + (m.output || 0), 0)

  // Loading state
  if (statsLoading || machinesLoading) {
    return (
      <div className="page-root">
        <LoadingSpinner />
      </div>
    )
  }

  // Error state
  if (statsError) {
    return (
      <div className="page-root">
        <ErrorMessage message={statsError.message} />
      </div>
    )
  }

  return (
    <div className="page-root">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold flex items-center gap-2.5 animate-slide-in ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-700 text-red-200'
              : 'bg-emerald-950/95 border-emerald-600 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      <PageHeader
        title={`Floor Monitor — ${user?.name?.split(' ')[0] || 'Admin'}`}
        subtitle={`${ROLE_LABELS[user?.role] || user?.role || 'Admin'} · Live machine status, output tracking & controls`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetch()
                showToast('Floor data refreshed')
              }}
              className="btn-secondary btn-sm"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            icon: Zap,
            bg: 'bg-emerald-500/15',
            clr: 'text-emerald-400',
            val: counts.RUNNING,
            lbl: 'Running',
            sub: `of ${allMachines.length} machines`,
          },
          {
            icon: Clock,
            bg: 'bg-amber-500/15',
            clr: 'text-amber-400',
            val: counts.IDLE,
            lbl: 'Idle',
            sub: 'Standby / Ready',
          },
          {
            icon: AlertTriangle,
            bg: 'bg-red-500/15',
            clr: 'text-red-400',
            val: counts.BREAKDOWN,
            lbl: 'Breakdown',
            sub: 'Needs maintenance',
          },
          {
            icon: Activity,
            bg: 'bg-primary-500/15',
            clr: 'text-primary-400',
            val: `${totalOutput.toLocaleString()} m`,
            lbl: 'Total Output',
            sub: 'Recorded today across floor',
          },
        ].map((c) => (
          <div key={c.lbl} className="card p-5 flex items-center gap-4 hover:border-zinc-700/80 transition-colors">
            <div className={cn('stat-card-icon', c.bg)}>
              <c.icon size={20} className={c.clr} />
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-50">{c.val}</p>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">{c.lbl}</p>
              <p className="text-2xs text-zinc-500">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'ALL', label: `All Machines (${allMachines.length})` },
            { key: 'RUNNING', label: `Running (${counts.RUNNING})`, color: 'text-emerald-400' },
            { key: 'IDLE', label: `Idle (${counts.IDLE})`, color: 'text-amber-400' },
            { key: 'BREAKDOWN', label: `Breakdown (${counts.BREAKDOWN})`, color: 'text-red-400' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                'btn-secondary btn-sm',
                filter === t.key && 'bg-primary-500/15 border-primary-500/50 text-primary-300 font-semibold'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-zinc-500">
          Click any machine card to edit status, assign operator or order
        </div>
      </div>

      {/* Machine Grid */}
      {filtered.length === 0 ? (
        <div className="card py-16 text-center text-sm text-zinc-400">
          <Wrench size={32} className="mx-auto text-zinc-600 mb-2" />
          No machines found matching this status filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <MachineCard
              key={m.id}
              m={m}
              onSelect={() => handleOpenEdit(m)}
              onQuickStatus={handleQuickStatus}
              isPending={updateMachine.isPending}
            />
          ))}
        </div>
      )}

      {/* Machine Management & Status Update Modal */}
      <Modal
        open={!!selected}
        onClose={() => {
          setSelected(null)
          setEditForm(null)
        }}
        title={`Configure ${selected?.name || 'Machine'}`}
        description={`${selected?.machineId || selected?.id} · Production & operational controls`}
        size="lg"
      >
        {editForm && (
          <form onSubmit={handleSaveModal} className="space-y-5">
            {/* Status Selection Tiles */}
            <div>
              <label className="label mb-2 block font-semibold text-zinc-200">
                Machine Status <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    key: 'RUNNING',
                    label: 'Running',
                    desc: 'Active production',
                    icon: Play,
                    activeClass: 'border-emerald-500 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/50',
                    dot: 'bg-emerald-400',
                  },
                  {
                    key: 'IDLE',
                    label: 'Idle',
                    desc: 'Standby / Ready',
                    icon: Pause,
                    activeClass: 'border-amber-500 bg-amber-950/30 text-amber-300 ring-1 ring-amber-500/50',
                    dot: 'bg-amber-400',
                  },
                  {
                    key: 'BREAKDOWN',
                    label: 'Breakdown',
                    desc: 'Under maintenance',
                    icon: AlertOctagon,
                    activeClass: 'border-red-500 bg-red-950/30 text-red-300 ring-1 ring-red-500/50',
                    dot: 'bg-red-500',
                  },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, status: s.key }))}
                    className={cn(
                      'p-3.5 rounded-xl border-2 text-left transition-all duration-150 flex flex-col justify-between',
                      editForm.status === s.key
                        ? s.activeClass
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full', s.dot)} />
                      <s.icon size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-zinc-100">{s.label}</p>
                      <p className="text-2xs text-zinc-400 mt-0.5">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Breakdown Reason (shown only when BREAKDOWN is selected) */}
            {editForm.status === 'BREAKDOWN' && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2.5 animate-fade-in">
                <label className="label text-red-300 font-semibold block">
                  Breakdown Reason & Diagnostics
                </label>
                <input
                  type="text"
                  className="input w-full bg-zinc-900/90 border-red-500/40 focus:border-red-500"
                  placeholder="e.g. Motor fault, thread break, electrical malfunction..."
                  value={editForm.reason}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {BREAKDOWN_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, reason: r }))}
                      className="px-2 py-1 rounded bg-zinc-900 text-2xs text-zinc-300 border border-zinc-800 hover:border-red-500/50 hover:text-red-300 transition-colors"
                    >
                      + {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Machine Name */}
              <div>
                <label className="label">Machine Name</label>
                <input
                  type="text"
                  className="input w-full"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Stage */}
              <div>
                <label className="label">Department / Stage</label>
                <select
                  className="input w-full"
                  value={editForm.stage}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, stage: e.target.value }))}
                >
                  {STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Order Assignment */}
              <div>
                <label className="label">Active Order Assignment</label>
                <div className="space-y-1.5">
                  <select
                    className="input w-full font-mono text-xs"
                    value={editForm.order || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, order: e.target.value }))}
                  >
                    <option value="">— No Order Assigned (Standby) —</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.orderNumber || o.id}>
                        {o.orderNumber || o.id} — {o.buyer} ({o.fabric}, {o.qty}m)
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="input w-full font-mono text-xs"
                    placeholder="Or enter custom Order ID (e.g. ORD-2026-1001)"
                    value={editForm.order || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, order: e.target.value }))}
                  />
                </div>
              </div>

              {/* Operator Assignment */}
              <div>
                <label className="label">Assigned Operator</label>
                <div className="space-y-1.5">
                  <select
                    className="input w-full text-xs"
                    value={editForm.operator || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, operator: e.target.value }))}
                  >
                    <option value="">— Unassigned —</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name} ({w.role} · {w.dept})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="input w-full text-xs"
                    placeholder="Or type operator name"
                    value={editForm.operator || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, operator: e.target.value }))}
                  />
                </div>
              </div>

              {/* Output Meterage Today */}
              <div className="md:col-span-2">
                <label className="label">Today's Output (Metres)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input flex-1 font-mono text-base font-bold"
                    value={editForm.output}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, output: e.target.value }))}
                  />
                  {[100, 250, 500, 1000].map((add) => (
                    <button
                      key={add}
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          output: (Number(prev.output) || 0) + add,
                        }))
                      }
                      className="btn-secondary btn-xs font-mono"
                    >
                      +{add}m
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, output: 0 }))}
                    className="btn-ghost btn-xs text-zinc-500"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Current Status:</span>
                <span
                  className={cn(
                    'badge',
                    editForm.status === 'RUNNING'
                      ? 'badge-green'
                      : editForm.status === 'BREAKDOWN'
                      ? 'badge-red'
                      : 'badge-yellow'
                  )}
                >
                  {editForm.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    setSelected(null)
                    setEditForm(null)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMachine.isPending}
                  className="btn-primary btn-sm flex items-center gap-1.5"
                >
                  {updateMachine.isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save size={14} /> Update Machine
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
