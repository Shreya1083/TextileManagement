import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { formatDate } from '../../lib/utils'

const initEntries = [
  { id:1, date:'2026-10-10', shift:'Morning',   machine:'M-01', order:'ORD-2024', output:320, waste:8,  operator:'Mohan Kumar',  rolls:3 },
  { id:2, date:'2026-10-10', shift:'Morning',   machine:'M-03', order:'ORD-2023', output:410, waste:12, operator:'Anil Verma',   rolls:4 },
  { id:3, date:'2026-10-10', shift:'Afternoon', machine:'M-05', order:'ORD-2026', output:380, waste:6,  operator:'Ravi Mehta',   rolls:3 },
  { id:4, date:'2026-10-09', shift:'Morning',   machine:'M-02', order:'ORD-2025', output:290, waste:10, operator:'Suresh Patil', rolls:2 },
]
const BLANK = { date: new Date().toISOString().split('T')[0], shift:'Morning', machine:'M-01', order:'ORD-2024', output:'', waste:'', operator:'Mohan Kumar', rolls:'' }

export default function ProductionEntry() {
  const toast = useToast()
  const [entries, setEntries]     = useState(initEntries)
  const [showAdd, setShowAdd]     = useState(false)
  const [form, setForm]           = useState(BLANK)
  const [errors, setErrors]       = useState({})

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.output || isNaN(form.output) || +form.output < 0) e.output = 'Enter valid output'
    if (form.waste === '' || isNaN(form.waste) || +form.waste < 0) e.waste = 'Enter valid waste'
    if (!form.rolls || isNaN(form.rolls) || +form.rolls < 0) e.rolls = 'Enter valid rolls'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = () => {
    if (!validate()) return
    const newEntry = {
      id:       entries.length + 1,
      date:     form.date,
      shift:    form.shift,
      machine:  form.machine,
      order:    form.order,
      output:   Number(form.output),
      waste:    Number(form.waste),
      operator: form.operator,
      rolls:    Number(form.rolls),
    }
    setEntries(p => [newEntry, ...p])
    setShowAdd(false)
    toast('Production entry saved', 'success')
  }

  return (
    <div className="page-root">
      <PageHeader title="Production Entry" subtitle="Shift-wise production logs"
        actions={
          <button className="btn-primary btn-sm" onClick={() => { setForm(BLANK); setErrors({}); setShowAdd(true) }}>
            <Plus size={14} />Add Entry
          </button>
        }
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Date</th><th>Shift</th><th>Machine</th><th>Order</th><th>Output (m)</th><th>Waste (m)</th><th>Rolls</th><th>Operator</th></tr></thead>
          <tbody>
            {entries.map(e => (
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

      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add Production Entry" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e=>set('date',e.target.value)} />
          </div>
          <div>
            <label className="label">Shift</label>
            <select className="input" value={form.shift} onChange={e=>set('shift',e.target.value)}>
              <option>Morning</option><option>Afternoon</option><option>Night</option>
            </select>
          </div>
          <div>
            <label className="label">Machine</label>
            <select className="input" value={form.machine} onChange={e=>set('machine',e.target.value)}>
              <option>M-01</option><option>M-02</option><option>M-03</option><option>M-05</option>
              <option>M-06</option><option>M-08</option><option>M-10</option><option>M-11</option>
            </select>
          </div>
          <div>
            <label className="label">Order</label>
            <select className="input" value={form.order} onChange={e=>set('order',e.target.value)}>
              <option>ORD-2028</option><option>ORD-2027</option><option>ORD-2026</option>
              <option>ORD-2025</option><option>ORD-2024</option><option>ORD-2023</option>
            </select>
          </div>
          <div>
            <label className="label">Output (m)</label>
            <input className={`input ${errors.output?'border-red-500':''}`} type="number" value={form.output} onChange={e=>set('output',e.target.value)} placeholder="320" />
            {errors.output && <p className="text-xs text-red-400 mt-1">{errors.output}</p>}
          </div>
          <div>
            <label className="label">Waste (m)</label>
            <input className={`input ${errors.waste?'border-red-500':''}`} type="number" value={form.waste} onChange={e=>set('waste',e.target.value)} placeholder="8" />
            {errors.waste && <p className="text-xs text-red-400 mt-1">{errors.waste}</p>}
          </div>
          <div>
            <label className="label">Operator</label>
            <select className="input" value={form.operator} onChange={e=>set('operator',e.target.value)}>
              <option>Mohan Kumar</option><option>Suresh Patil</option><option>Anil Verma</option>
              <option>Ravi Mehta</option><option>Sanjay Tiwari</option><option>Priya Rao</option><option>Deepak Singh</option>
            </select>
          </div>
          <div>
            <label className="label">Rolls Created</label>
            <input className={`input ${errors.rolls?'border-red-500':''}`} type="number" value={form.rolls} onChange={e=>set('rolls',e.target.value)} placeholder="3" />
            {errors.rolls && <p className="text-xs text-red-400 mt-1">{errors.rolls}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Entry</button>
        </div>
      </Modal>
    </div>
  )
}
