import { useState } from 'react'
import { Plus, Wrench, ChevronRight } from 'lucide-react'
import { Badge }      from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { mockMachines } from '../../mocks/data'
import { cn } from '../../lib/utils'

const STATUS_DOT = {
  RUNNING:   'bg-emerald-400 animate-pulse',
  IDLE:      'bg-amber-400',
  BREAKDOWN: 'bg-red-500 animate-pulse',
}

export default function MachineBoard() {
  const [selected, setSelected]   = useState(null)
  const [showAssign, setShowAssign] = useState(false)
  const [stageFilter, setStageFilter] = useState('ALL')
  const stages   = ['ALL', ...new Set(mockMachines.map(m => m.stage))]
  const filtered = stageFilter === 'ALL' ? mockMachines : mockMachines.filter(m => m.stage === stageFilter)

  return (
    <div className="page-root">
      <PageHeader
        title="Machine Board"
        subtitle="Machine status and work assignments"
        actions={
          <>
            <button className="btn-secondary btn-sm"><Wrench size={13} />Manage</button>
            <button className="btn-primary btn-sm" onClick={() => setShowAssign(true)}><Plus size={13} />Assign</button>
          </>
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
                  <button className="btn-ghost btn-xs text-primary-400 gap-1">
                    Details <ChevronRight size={10} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} description={selected?.id}>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[['Stage',selected.stage],['Operator',selected.operator??'Unassigned'],['Order',selected.order??'—'],['Output',selected.output>0?`${selected.output} m`:'—']].map(([k,v]) => (
                <div key={k} className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-600 mb-0.5">{k}</p>
                  <p className="font-semibold text-zinc-100">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Badge status={selected.status} />
            </div>
            {selected.status === 'BREAKDOWN' && (
              <button className="btn-primary w-full">Mark Resolved</button>
            )}
            {selected.status === 'RUNNING' && (
              <button className="btn-danger w-full">Log Breakdown</button>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="New Work Assignment" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Order</label>
            <select className="input"><option>ORD-2028</option><option>ORD-2027</option></select>
          </div>
          <div><label className="label">Machine</label>
            <select className="input"><option>M-04 — Weaver B2 (Idle)</option></select>
          </div>
          <div><label className="label">Stage</label>
            <select className="input"><option>Spinning</option><option>Weaving</option><option>Dyeing</option><option>Finishing</option></select>
          </div>
          <div><label className="label">Planned Qty (m)</label><input className="input" type="number" /></div>
          <div><label className="label">Start Date</label><input className="input" type="date" /></div>
          <div><label className="label">Shift</label>
            <select className="input"><option>Morning</option><option>Afternoon</option><option>Night</option></select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
          <button className="btn-primary">Assign Machine</button>
        </div>
      </Modal>
    </div>
  )
}
