import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { Badge }      from '../../components/ui/Badge'

const mockDowntime = [
  { id:1, machine:'M-07', name:'Dyer C2',   start:'2026-10-10 09:15', end:null,                reason:'Mechanical failure', notes:'Belt snapped',            status:'OPEN',   duration:'Ongoing' },
  { id:2, machine:'M-03', name:'Weaver B1', start:'2026-10-08 14:00', end:'2026-10-08 16:30', reason:'Maintenance',         notes:'Scheduled lubrication',   status:'CLOSED', duration:'2.5 hrs' },
  { id:3, machine:'M-01', name:'Spinner A1',start:'2026-10-07 10:00', end:'2026-10-07 11:45', reason:'Power outage',        notes:'Grid issue resolved',      status:'CLOSED', duration:'1.75 hrs'},
]

export default function DowntimePage() {
  const [showAdd, setShowAdd] = useState(false)
  const open = mockDowntime.filter(d => d.status === 'OPEN').length
  return (
    <div className="page-root">
      <PageHeader title="Downtime Log" subtitle="Machine breakdowns and maintenance events"
        actions={<button className="btn-danger btn-sm" onClick={() => setShowAdd(true)}><AlertTriangle size={13} />Log Breakdown</button>}
      />
      {open > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={14} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-300">{open} machine(s) currently down</p>
            <p className="text-xs text-red-500/70 mt-0.5">Production impact expected — resolve immediately.</p>
          </div>
        </div>
      )}
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Machine</th><th>Start</th><th>End</th><th>Duration</th><th>Reason</th><th>Notes</th><th>Status</th></tr></thead>
          <tbody>
            {mockDowntime.map(d => (
              <tr key={d.id}>
                <td>
                  <p className="font-mono text-2xs text-zinc-600">{d.machine}</p>
                  <p className="font-semibold text-zinc-200">{d.name}</p>
                </td>
                <td className="font-mono text-xs text-zinc-400">{d.start}</td>
                <td className="font-mono text-xs">{d.end ?? <span className="text-red-400 font-semibold">Ongoing</span>}</td>
                <td className={d.status === 'OPEN' ? 'text-red-400 font-bold' : 'text-zinc-400'}>{d.duration}</td>
                <td className="text-zinc-300">{d.reason}</td>
                <td className="text-zinc-500 text-xs">{d.notes}</td>
                <td><Badge>{d.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Breakdown / Downtime">
        <div className="space-y-4">
          <div><label className="label">Machine</label><select className="input"><option>M-07 — Dyer C2</option></select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date & Time</label><input className="input" type="datetime-local" /></div>
            <div><label className="label">Reason</label><select className="input"><option>Mechanical failure</option><option>Power outage</option><option>Maintenance</option></select></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-danger">Log Breakdown</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
