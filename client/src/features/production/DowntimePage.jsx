import { useState } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { Badge }      from '../../components/ui/Badge'
import { useToast }   from '../../components/ui/Toast'

const initDowntime = [
  { id:1, machine:'M-07', name:'Dyer C2',    start:'2026-10-10 09:15', end:null,                reason:'Mechanical failure', notes:'Belt snapped',          status:'OPEN',   duration:'Ongoing' },
  { id:2, machine:'M-03', name:'Weaver B1',  start:'2026-10-08 14:00', end:'2026-10-08 16:30', reason:'Maintenance',         notes:'Scheduled lubrication', status:'CLOSED', duration:'2.5 hrs' },
  { id:3, machine:'M-01', name:'Spinner A1', start:'2026-10-07 10:00', end:'2026-10-07 11:45', reason:'Power outage',        notes:'Grid issue resolved',    status:'CLOSED', duration:'1.75 hrs'},
]
const BLANK = { machine:'M-07 — Dyer C2', startTime: new Date().toISOString().slice(0,16), reason:'Mechanical failure', notes:'' }

export default function DowntimePage() {
  const toast = useToast()
  const [events, setEvents]       = useState(initDowntime)
  const [showAdd, setShowAdd]     = useState(false)
  const [resolveId, setResolveId] = useState(null)
  const [form, setForm]           = useState(BLANK)
  const [errors, setErrors]       = useState({})

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))
  const open = events.filter(d => d.status === 'OPEN').length

  const validate = () => {
    const e = {}
    if (!form.startTime) e.startTime = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleLog = () => {
    if (!validate()) return
    const [machineId, machineName] = form.machine.split(' — ')
    const newEvent = {
      id:       events.length + 1,
      machine:  machineId,
      name:     machineName,
      start:    form.startTime.replace('T',' '),
      end:      null,
      reason:   form.reason,
      notes:    form.notes.trim(),
      status:   'OPEN',
      duration: 'Ongoing',
    }
    setEvents(p => [newEvent, ...p])
    setShowAdd(false)
    toast(`Breakdown logged for ${machineName}`, 'warning')
  }

  const handleResolve = (id) => {
    const now = new Date().toISOString().replace('T',' ').slice(0,16)
    setEvents(p => p.map(d => {
      if (d.id !== id) return d
      const startMs = new Date(d.start).getTime()
      const endMs   = new Date(now).getTime()
      const hrs     = ((endMs - startMs) / 3600000).toFixed(1)
      return { ...d, end: now, status: 'CLOSED', duration: `${hrs} hrs` }
    }))
    setResolveId(null)
    toast('Breakdown resolved', 'success')
  }

  return (
    <div className="page-root">
      <PageHeader title="Downtime Log" subtitle="Machine breakdowns and maintenance events"
        actions={
          <button className="btn-danger btn-sm" onClick={() => { setForm(BLANK); setErrors({}); setShowAdd(true) }}>
            <AlertTriangle size={13} />Log Breakdown
          </button>
        }
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
          <thead><tr><th>Machine</th><th>Start</th><th>End</th><th>Duration</th><th>Reason</th><th>Notes</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {events.map(d => (
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
                <td><Badge status={d.status} /></td>
                <td>
                  {d.status === 'OPEN' && (
                    <button className="btn-secondary btn-xs gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      onClick={() => setResolveId(d.id)}>
                      <CheckCircle size={11} />Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log Breakdown Modal */}
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Log Breakdown / Downtime">
        <div className="space-y-4">
          <div>
            <label className="label">Machine</label>
            <select className="input" value={form.machine} onChange={e=>set('machine',e.target.value)}>
              <option>M-07 — Dyer C2</option><option>M-01 — Spinner A1</option><option>M-02 — Spinner A2</option>
              <option>M-03 — Weaver B1</option><option>M-04 — Weaver B2</option><option>M-05 — Weaver B3</option>
              <option>M-06 — Dyer C1</option><option>M-08 — Finisher D1</option><option>M-09 — Finisher D2</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date & Time</label>
              <input className={`input ${errors.startTime?'border-red-500':''}`} type="datetime-local" value={form.startTime} onChange={e=>set('startTime',e.target.value)} />
              {errors.startTime && <p className="text-xs text-red-400 mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="label">Reason</label>
              <select className="input" value={form.reason} onChange={e=>set('reason',e.target.value)}>
                <option>Mechanical failure</option><option>Power outage</option><option>Maintenance</option><option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Describe the issue…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
            <button className="btn-danger" onClick={handleLog}>Log Breakdown</button>
          </div>
        </div>
      </Modal>

      {/* Resolve Confirm Modal */}
      <Modal open={!!resolveId} onClose={()=>setResolveId(null)} title="Resolve Breakdown" size="xs">
        <p className="text-sm text-zinc-400 mb-4">
          Mark <span className="text-zinc-100 font-semibold">{events.find(d=>d.id===resolveId)?.name}</span> as resolved? This will log the current time as the end time.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={()=>setResolveId(null)}>Cancel</button>
          <button className="btn-primary" onClick={()=>handleResolve(resolveId)}>
            <CheckCircle size={13} />Mark Resolved
          </button>
        </div>
      </Modal>
    </div>
  )
}
