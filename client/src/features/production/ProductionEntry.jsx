import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

const mockEntries = [
  { id:1, date:'2026-10-10', shift:'Morning',   machine:'M-01', order:'ORD-2024', output:320, waste:8,  operator:'Mohan Kumar',  rolls:3 },
  { id:2, date:'2026-10-10', shift:'Morning',   machine:'M-03', order:'ORD-2023', output:410, waste:12, operator:'Anil Verma',   rolls:4 },
  { id:3, date:'2026-10-10', shift:'Afternoon', machine:'M-05', order:'ORD-2026', output:380, waste:6,  operator:'Ravi Mehta',   rolls:3 },
  { id:4, date:'2026-10-09', shift:'Morning',   machine:'M-02', order:'ORD-2025', output:290, waste:10, operator:'Suresh Patil', rolls:2 },
]

export default function ProductionEntry() {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="page-root">
      <PageHeader title="Production Entry" subtitle="Shift-wise production logs"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />Add Entry</button>}
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Date</th><th>Shift</th><th>Machine</th><th>Order</th><th>Output (m)</th><th>Waste (m)</th><th>Rolls</th><th>Operator</th></tr></thead>
          <tbody>
            {mockEntries.map(e => (
              <tr key={e.id}>
                <td className="text-xs text-zinc-400">{formatDate(e.date)}</td>
                <td><span className="badge badge-purple">{e.shift}</span></td>
                <td className="font-mono text-xs text-zinc-500">{e.machine}</td>
                <td className="font-mono text-xs text-primary-400 font-semibold">{e.order}</td>
                <td className="font-bold text-emerald-400">{e.output} m</td>
                <td className="text-amber-400">{e.waste} m</td>
                <td><span className="badge badge-blue">{e.rolls}</span></td>
                <td className="text-zinc-400">{e.operator}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Production Entry" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Date</label><input className="input" type="date" /></div>
          <div><label className="label">Shift</label><select className="input"><option>Morning</option><option>Afternoon</option><option>Night</option></select></div>
          <div><label className="label">Machine</label><select className="input"><option>M-01</option><option>M-03</option></select></div>
          <div><label className="label">Order</label><select className="input"><option>ORD-2024</option><option>ORD-2025</option></select></div>
          <div><label className="label">Output (m)</label><input className="input" type="number" /></div>
          <div><label className="label">Waste (m)</label><input className="input" type="number" /></div>
          <div><label className="label">Operator</label><select className="input"><option>Mohan Kumar</option></select></div>
          <div><label className="label">Rolls Created</label><input className="input" type="number" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn-primary">Save Entry</button>
        </div>
      </Modal>
    </div>
  )
}
