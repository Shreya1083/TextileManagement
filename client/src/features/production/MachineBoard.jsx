import { useState } from 'react'
import { Plus, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react'
import { Badge }      from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { useAuth }    from '../../context/AuthContext'
import { mockMachines } from '../../mocks/data'
import { cn } from '../../lib/utils'

const STATUS_DOT = {
  RUNNING:   'bg-emerald-400 animate-pulse',
  IDLE:      'bg-amber-400',
  BREAKDOWN: 'bg-red-500 animate-pulse',
}

const BLANK_ASSIGN = { order:'ORD-2028', machine:'M-04 — Weaver B2 (Idle)', stage:'Weaving', plannedQty:'', startDate: new Date().toISOString().split('T')[0], shift:'Morning' }

export default function MachineBoard() {
  const { user }  = useAuth()
  const toast     = useToast()

  const [machines, setMachines]       = useState(mockMachines)
  const [selected, setSelected]       = useState(null)
  const [showAssign, setShowAssign]   = useState(false)
  const [stageFilter, setStageFilter] = useState('ALL')
  const [assignForm, setAssignForm]   = useState(BLANK_ASSIGN)
  const [assignErrors, setAssignErrors] = useState({})

  const stages   = ['ALL', ...new Set(machines.map(m => m.stage))]
  const filtered = stageFilter === 'ALL' ? machines : machines.filter(m => m.stage === stageFilter)

  const setA = (k,v) => setAssignForm(f => ({ ...f, [k]: v }))

  // Change machine status directly from the detail modal
  const changeStatus = (machineId, newStatus) => {
    setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status: newStatus } : m))
    setSelected(prev => prev?.id === machineId ? { ...prev, status: newStatus } : prev)
    toast(
      `${machineId} marked as ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}`,
      newStatus === 'BREAKDOWN' ? 'warning' : newStatus === 'RUNNING' ? 'success' : 'info'
    )
  }

  const validateAssign = () => {
    const e = {}
    if (!assignForm.plannedQty || isNaN(assignForm.plannedQty) || +assignForm.plannedQty <= 0) e.plannedQty = 'Enter valid quantity'
    if (!assignForm.startDate) e.startDate = 'Required'
    setAssignErrors(e)
    return !Object.keys(e).length
  }

  const handleAssign = () => {
    if (!validateAssign()) return
    const [machineId] = assignForm.machine.split(' — ')
    setMachines(prev => prev.map(m =>
      m.id === machineId
        ? { ...m, status: 'RUNNING', order: assignForm.order }
        : m
    ))
    setShowAssign(false)
    toast(`Machine ${machineId} assigned to ${assignForm.order}`, 'success')
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Machine Board"
        subtitle={`Supervised by ${user?.name} · Machine status and work assignments`}
        actions={
<<<<<<< HEAD
          <div className="flex gap-2">
            <button className="btn-primary btn-sm" onClick={() => { setAssignForm(BLANK_ASSIGN); setAssignErrors({}); setShowAssign(true) }}>
              <Plus size={13} />Assign
            </button>
          </div>
=======
          <button className="btn-primary btn-sm" onClick={() => { setAssignForm(BLANK_ASSIGN); setAssignErrors({}); setShowAssign(true) }}>
            <Plus size={13} />Assign
          </button>
>>>>>>> 97ed768d65e0702d2c6c46f110b1afc59861571f
        }
      />

      <div className="flex gap-2 flex-wrap">
        {stages.map(s => (
          <button key={s} onClick={() => setStageFilter(s)}
            className={cn('btn-secondary btn-sm', stageFilter === s && 'bg-primary-500/15 border-primary-500/50 text-primary-300')}>
            {s}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Machine</th><th>Stage</th><th>Status</th><th>Active Order</th><th>Operator</th><th>Output Today</th><th></th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} onClick={() => setSelected(m)} className="cursor-pointer">
                <td>
                  <p className="font-mono text-2xs text-zinc-600">{m.id}</p>
                  <p className="font-semibold text-zinc-200">{m.name}</p>
                </td>
                <td><span className="badge badge-purple">{m.stage}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[m.status])} />
                    <Badge status={m.status} />
                  </div>
                </td>
                <td className="font-mono text-xs text-primary-400 font-semibold">{m.order ?? <span className="text-zinc-700">—</span>}</td>
                <td className="text-zinc-400">{m.operator ?? <span className="text-zinc-700">—</span>}</td>
                <td className="font-bold text-zinc-200">{m.output > 0 ? `${m.output} m` : <span className="text-zinc-700">—</span>}</td>
                <td>
                  <button className="btn-ghost btn-xs text-primary-400 gap-1" onClick={e => { e.stopPropagation(); setSelected(m) }}>
                    Details <ChevronRight size={10} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Machine Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} description={selected?.id}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[['Stage',selected.stage],['Operator',selected.operator??'Unassigned'],['Order',selected.order??'—'],['Output',selected.output>0?`${selected.output} m`:'—']].map(([k,v]) => (
                <div key={k} className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-600 mb-0.5">{k}</p>
                  <p className="font-semibold text-zinc-100">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2"><Badge status={selected.status} /></div>

            {/* Status change buttons */}
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-2">Change Status</p>
              <div className="flex gap-2">
                <button disabled={selected.status==='RUNNING'} onClick={()=>changeStatus(selected.id,'RUNNING')}
                  className="btn-secondary btn-sm flex-1 gap-1 disabled:opacity-40">
                  <CheckCircle size={12} className="text-emerald-400" />Running
                </button>
                <button disabled={selected.status==='IDLE'} onClick={()=>changeStatus(selected.id,'IDLE')}
                  className="btn-secondary btn-sm flex-1 disabled:opacity-40">Idle</button>
                <button disabled={selected.status==='BREAKDOWN'} onClick={()=>changeStatus(selected.id,'BREAKDOWN')}
                  className="btn-secondary btn-sm flex-1 gap-1 disabled:opacity-40 text-red-400 border-red-500/30 hover:bg-red-500/10">
                  <AlertTriangle size={12} />Breakdown
                </button>
              </div>
            </div>

            <button className="w-full btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
        )}
      </Modal>

      {/* Assign Modal */}
      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="New Work Assignment" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Order</label>
            <select className="input" value={assignForm.order} onChange={e=>setA('order',e.target.value)}>
              <option>ORD-2028</option><option>ORD-2027</option><option>ORD-2026</option><option>ORD-2025</option>
            </select>
          </div>
          <div>
            <label className="label">Machine</label>
            <select className="input" value={assignForm.machine} onChange={e=>setA('machine',e.target.value)}>
              <option>M-04 — Weaver B2 (Idle)</option><option>M-09 — Finisher D2 (Idle)</option>
            </select>
          </div>
          <div>
            <label className="label">Stage</label>
            <select className="input" value={assignForm.stage} onChange={e=>setA('stage',e.target.value)}>
              <option>Spinning</option><option>Weaving</option><option>Dyeing</option><option>Finishing</option>
            </select>
          </div>
          <div>
            <label className="label">Planned Qty (m)</label>
            <input className={`input ${assignErrors.plannedQty?'border-red-500':''}`} type="number" value={assignForm.plannedQty} onChange={e=>setA('plannedQty',e.target.value)} placeholder="500" />
            {assignErrors.plannedQty && <p className="text-xs text-red-400 mt-1">{assignErrors.plannedQty}</p>}
          </div>
          <div>
            <label className="label">Start Date</label>
            <input className={`input ${assignErrors.startDate?'border-red-500':''}`} type="date" value={assignForm.startDate} onChange={e=>setA('startDate',e.target.value)} />
            {assignErrors.startDate && <p className="text-xs text-red-400 mt-1">{assignErrors.startDate}</p>}
          </div>
          <div>
            <label className="label">Shift</label>
            <select className="input" value={assignForm.shift} onChange={e=>setA('shift',e.target.value)}>
              <option>Morning</option><option>Afternoon</option><option>Night</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleAssign}>Assign Machine</button>
        </div>
      </Modal>
    </div>
  )
}
