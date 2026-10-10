import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { formatDate } from '../../lib/utils'

const initGRNs = [
  { id:'GRN-2026-042', supplier:'Agarwal Yarns Pvt Ltd', yarn:'Cotton 40s',  colour:'White',   qty:500,  bags:10, challan:'CH-8821', vehicle:'GJ05AB1234', date:'2026-10-08' },
  { id:'GRN-2026-041', supplier:'Krishna Fibers',         yarn:'Poly 150D',   colour:'Natural', qty:800,  bags:16, challan:'CH-7734', vehicle:'MH02CD5678', date:'2026-10-06' },
  { id:'GRN-2026-040', supplier:'Rajasthan Denim Supply', yarn:'Denim 7oz',   colour:'Indigo',  qty:2100, bags:21, challan:'CH-5529', vehicle:'RJ14EF9012', date:'2026-10-03' },
]

const BLANK = { supplier:'Agarwal Yarns Pvt Ltd', yarn:'Cotton 40s', colour:'', lot:'', qty:'', bags:'', challan:'', vehicle:'', notes:'' }

export default function GateEntryPage() {
  const toast = useToast()
  const [grns, setGrns]       = useState(initGRNs)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState(BLANK)
  const [errors, setErrors]   = useState({})

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.colour.trim())                             e.colour  = 'Required'
    if (!form.qty || isNaN(form.qty) || +form.qty <= 0) e.qty     = 'Enter valid qty'
    if (!form.challan.trim())                            e.challan = 'Required'
    if (!form.vehicle.trim())                            e.vehicle = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = () => {
    if (!validate()) return
    const nextNum = Math.max(...grns.map(g => parseInt(g.id.split('-')[2]))) + 1
    const newGrn = {
      id:       `GRN-2026-${String(nextNum).padStart(3,'0')}`,
      supplier: form.supplier,
      yarn:     form.yarn,
      colour:   form.colour.trim(),
      qty:      Number(form.qty),
      bags:     Number(form.bags) || 0,
      challan:  form.challan.trim(),
      vehicle:  form.vehicle.trim().toUpperCase(),
      date:     new Date().toISOString().split('T')[0],
    }
    setGrns(p => [newGrn, ...p])
    setShowAdd(false)
    toast(`GRN ${newGrn.id} recorded`, 'success')
  }

  return (
    <div className="page-root">
      <PageHeader title="Gate Entry / GRN" subtitle="Goods Receipt Notes — yarn and material inward"
        actions={
          <button className="btn-primary btn-sm" onClick={() => { setForm(BLANK); setErrors({}); setShowAdd(true) }}>
            <Plus size={14} />New GRN
          </button>
        }
      />
      <div className="table-wrap">
        <div className="table-head"><p className="section-title">Recent GRNs <span className="text-zinc-600 font-normal text-xs ml-1">{grns.length} entries</span></p></div>
        <table className="table-base">
          <thead><tr><th>GRN ID</th><th>Supplier</th><th>Yarn Type</th><th>Colour</th><th>Qty</th><th>Bags</th><th>Challan</th><th>Vehicle</th><th>Date</th></tr></thead>
          <tbody>
            {grns.map(g => (
              <tr key={g.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{g.id}</td>
                <td className="font-semibold text-zinc-200">{g.supplier}</td>
                <td>{g.yarn}</td>
                <td className="text-zinc-400">{g.colour}</td>
                <td className="font-bold text-emerald-400">+{g.qty.toLocaleString()}</td>
                <td className="text-zinc-300">{g.bags}</td>
                <td className="font-mono text-xs text-zinc-400">{g.challan}</td>
                <td className="font-mono text-xs text-zinc-400">{g.vehicle}</td>
                <td className="text-zinc-400 text-xs">{formatDate(g.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="New Gate Entry / GRN" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Supplier</label>
            <select className="input" value={form.supplier} onChange={e=>set('supplier',e.target.value)}>
              <option>Agarwal Yarns Pvt Ltd</option><option>Krishna Fibers</option>
              <option>Bharat Silk House</option><option>Rajasthan Denim Supply</option>
            </select>
          </div>
          <div>
            <label className="label">Yarn Type</label>
            <select className="input" value={form.yarn} onChange={e=>set('yarn',e.target.value)}>
              <option>Cotton 40s</option><option>Cotton 60s</option><option>Poly 150D</option>
              <option>Linen 20s</option><option>Silk 2/120D</option><option>Denim 7oz</option>
            </select>
          </div>
          <div>
            <label className="label">Colour</label>
            <input className={`input ${errors.colour?'border-red-500':''}`} value={form.colour} onChange={e=>set('colour',e.target.value)} placeholder="White" />
            {errors.colour && <p className="text-xs text-red-400 mt-1">{errors.colour}</p>}
          </div>
          <div>
            <label className="label">Lot / Batch</label>
            <input className="input" value={form.lot} onChange={e=>set('lot',e.target.value)} placeholder="LOT-001" />
          </div>
          <div>
            <label className="label">Quantity (kg / m)</label>
            <input className={`input ${errors.qty?'border-red-500':''}`} type="number" value={form.qty} onChange={e=>set('qty',e.target.value)} placeholder="500" />
            {errors.qty && <p className="text-xs text-red-400 mt-1">{errors.qty}</p>}
          </div>
          <div>
            <label className="label">Bags / Cones</label>
            <input className="input" type="number" value={form.bags} onChange={e=>set('bags',e.target.value)} placeholder="10" />
          </div>
          <div>
            <label className="label">Challan Number</label>
            <input className={`input ${errors.challan?'border-red-500':''}`} value={form.challan} onChange={e=>set('challan',e.target.value)} placeholder="CH-0001" />
            {errors.challan && <p className="text-xs text-red-400 mt-1">{errors.challan}</p>}
          </div>
          <div>
            <label className="label">Vehicle Number</label>
            <input className={`input ${errors.vehicle?'border-red-500':''}`} value={form.vehicle} onChange={e=>set('vehicle',e.target.value)} placeholder="GJ05AB1234" />
            {errors.vehicle && <p className="text-xs text-red-400 mt-1">{errors.vehicle}</p>}
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}><Package size={14} />Save GRN</button>
        </div>
      </Modal>
    </div>
  )
}
