import { useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { mockDispatches } from '../../mocks/data'
import { formatDate } from '../../lib/utils'
import { useDispatches, useCreateDispatch, useCreateInvoice, useBuyers, useOrders } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const ROLL_OPTIONS = ['EVR-2026-000185','EVR-2026-000183']
const BLANK = { buyer:'Patel Exports', order:'ORD-2024', vehicle:'', driver:'', date: new Date().toISOString().split('T')[0], rolls:[] }

export default function DispatchPage() {
  const toast = useToast()
  const [dispatches, setDispatches] = useState(mockDispatches)
  const [viewDispatch, setViewDispatch] = useState(null)
  const [showAdd, setShowAdd]       = useState(false)
  const [form, setForm]             = useState(BLANK)
  const [errors, setErrors]         = useState({})

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const toggleRoll = (id) => setForm(f => ({
    ...f,
    rolls: f.rolls.includes(id) ? f.rolls.filter(r => r !== id) : [...f.rolls, id]
  }))

  const validate = () => {
    const e = {}
    if (form.rolls.length === 0)  e.rolls   = 'Select at least one roll'
    if (!form.vehicle.trim())     e.vehicle  = 'Vehicle number required'
    if (!form.date)               e.date     = 'Date required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleConfirm = () => {
    if (!validate()) return
    const nextNum = Math.max(...dispatches.map(d => parseInt(d.id.replace('DSP-','')))) + 1
    const newDispatch = {
      id:      `DSP-${String(nextNum).padStart(4,'0')}`,
      buyer:   form.buyer,
      order:   form.order,
      rolls:   form.rolls.length,
      metres:  form.rolls.length * 115,   // approx avg
      date:    form.date,
      status:  'INVOICED',
      vehicle: form.vehicle.trim().toUpperCase(),
    }
    setDispatches(p => [newDispatch, ...p])
    setShowAdd(false)
    toast(`Dispatch ${newDispatch.id} confirmed`, 'success')
  }

  return (
    <div className="page-root">
      <PageHeader title="Dispatches" subtitle="Shipment records and packing lists"
        actions={
          <button className="btn-primary btn-sm" onClick={() => { setForm(BLANK); setErrors({}); setShowAdd(true) }}>
            <Plus size={14} />Create Dispatch
          </button>
        }
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Dispatch ID</th><th>Buyer</th><th>Order</th><th>Rolls</th><th>Metres</th><th>Date</th><th>Vehicle</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {dispatches.map(d => (
              <tr key={d.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{d.dispatchId}</td>
                <td className="font-semibold text-zinc-200">{d.buyer}</td>
                <td className="font-mono text-xs text-zinc-400">{d.order}</td>
                <td className="text-zinc-300">{d.rolls}</td>
                <td className="font-semibold text-zinc-200">{d.metres?.toLocaleString()} m</td>
                <td className="text-zinc-400 text-xs">{formatDate(d.date)}</td>
                <td className="font-mono text-xs text-zinc-400">{d.vehicle}</td>
                <td><Badge status={d.status} /></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-ghost btn-xs text-primary-400" onClick={() => setViewDispatch(d)}>View</button>
                    <button className="btn-ghost btn-xs text-zinc-500" onClick={() => toast(`Invoice for ${d.id} — go to Invoices page`, 'info')}>Invoice</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Dispatch Modal */}
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Create Dispatch" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Buyer</label>
            <select className="input" value={form.buyer} onChange={e=>set('buyer',e.target.value)}>
              <option>Patel Exports</option><option>Sharma Fabrics</option><option>Mehta Textiles</option><option>Sunrise Mills</option>
            </select>
          </div>
          <div>
            <label className="label">Order</label>
            <select className="input" value={form.order} onChange={e=>set('order',e.target.value)}>
              <option>ORD-2024</option><option>ORD-2023</option><option>ORD-2021</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Select Rolls (Passed &amp; Available)</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
              {ROLL_OPTIONS.map(id => (
                <label key={id} className="flex items-center gap-3 p-2.5 bg-zinc-800/60 rounded-xl cursor-pointer hover:bg-zinc-700/50">
                  <input type="checkbox" checked={form.rolls.includes(id)} onChange={()=>toggleRoll(id)} className="rounded accent-primary-500" />
                  <span className="font-mono text-xs text-primary-400">{id}</span>
                  <span className="badge badge-green ml-auto">PASSED</span>
                </label>
              ))}
            </div>
            {errors.rolls && <p className="text-xs text-red-400 mt-1">{errors.rolls}</p>}
          </div>
          <div>
            <label className="label">Vehicle Number</label>
            <input className={`input ${errors.vehicle?'border-red-500':''}`} value={form.vehicle} onChange={e=>set('vehicle',e.target.value)} placeholder="GJ05AB1234" />
            {errors.vehicle && <p className="text-xs text-red-400 mt-1">{errors.vehicle}</p>}
          </div>
          <div>
            <label className="label">Driver Name</label>
            <input className="input" value={form.driver} onChange={e=>set('driver',e.target.value)} placeholder="Ramesh" />
          </div>
          <div>
            <label className="label">Date</label>
            <input className={`input ${errors.date?'border-red-500':''}`} type="date" value={form.date} onChange={e=>set('date',e.target.value)} />
            {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm}><Truck size={14} />Confirm Dispatch</button>
        </div>
      </Modal>

      {/* View Dispatch Modal */}
      <Modal open={!!viewDispatch} onClose={()=>setViewDispatch(null)} title={viewDispatch?.id} description={`${viewDispatch?.buyer} · ${viewDispatch?.order}`} size="sm">
        {viewDispatch && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[['Rolls',viewDispatch.rolls],['Metres',`${viewDispatch.metres} m`],['Vehicle',viewDispatch.vehicle],['Date',formatDate(viewDispatch.date)]].map(([l,v])=>(
                <div key={l} className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1">{l}</p>
                  <p className="text-sm font-bold text-zinc-100">{v}</p>
                </div>
              ))}
            </div>
            <Badge status={viewDispatch.status} />
            <button className="w-full btn-ghost btn-sm mt-2" onClick={()=>setViewDispatch(null)}>Close</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
