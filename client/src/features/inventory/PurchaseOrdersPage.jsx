import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { formatDate, formatCurrencyFull } from '../../lib/utils'

const initPOs = [
  { id:'PO-2026-018', supplier:'Agarwal Yarns Pvt Ltd', yarn:'Cotton 60s',  qty:600,  rate:340,  total:204000, expected:'2026-10-18', status:'RAISED'              },
  { id:'PO-2026-017', supplier:'Bharat Silk House',      yarn:'Silk 2/120D', qty:100,  rate:2200, total:220000, expected:'2026-10-15', status:'PARTIALLY_RECEIVED'   },
  { id:'PO-2026-016', supplier:'Krishna Fibers',          yarn:'Linen 20s',  qty:400,  rate:480,  total:192000, expected:'2026-10-10', status:'RECEIVED'             },
]

const SUPPLIERS = ['Agarwal Yarns Pvt Ltd', 'Bharat Silk House', 'Krishna Fibers', 'Rajasthan Denim Supply']
const YARNS = ['Cotton 40s', 'Cotton 60s', 'Poly 150D', 'Linen 20s', 'Silk 2/120D', 'Denim 7oz', 'Viscose 30s']
const BLANK = { supplier: 'Agarwal Yarns Pvt Ltd', yarn: 'Cotton 60s', qty: '', rate: '', expected: '' }

export default function PurchaseOrdersPage() {
  const toast = useToast()
  const [pos, setPos] = useState(initPOs)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.qty || isNaN(form.qty) || +form.qty <= 0) e.qty = 'Enter a valid quantity'
    if (!form.rate || isNaN(form.rate) || +form.rate <= 0) e.rate = 'Enter a valid rate'
    if (!form.expected) e.expected = 'Select expected date'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = () => {
    if (!validate()) return
    const nextNum = Math.max(...pos.map(p => parseInt(p.id.split('-')[2]))) + 1
    const qty = Number(form.qty)
    const rate = Number(form.rate)
    const newPO = {
      id: `PO-2026-${String(nextNum).padStart(3, '0')}`,
      supplier: form.supplier,
      yarn: form.yarn,
      qty,
      rate,
      total: qty * rate,
      expected: form.expected,
      status: 'RAISED',
    }
    setPos(prev => [newPO, ...prev])
    setShowAdd(false)
    setForm(BLANK)
    setErrors({})
    toast(`Purchase Order ${newPO.id} raised — ₹${(newPO.total).toLocaleString('en-IN')}`, 'success')
  }

  return (
    <div className="page-root">
      <PageHeader title="Purchase Orders" subtitle="Yarn and material procurement"
        actions={<button className="btn-primary btn-sm" onClick={() => { setForm(BLANK); setErrors({}); setShowAdd(true) }}><Plus size={14} />New PO</button>}
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>PO ID</th><th>Supplier</th><th>Yarn</th><th>Qty</th><th>Rate</th><th>Total</th><th>Expected</th><th>Status</th></tr></thead>
          <tbody>
            {pos.map(p => (
              <tr key={p.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{p.id}</td>
                <td className="font-semibold text-zinc-200">{p.supplier}</td>
                <td>{p.yarn}</td>
                <td className="font-mono text-xs text-zinc-300">{p.qty.toLocaleString()} kg</td>
                <td className="text-zinc-400">₹{p.rate}/kg</td>
                <td className="font-bold">{formatCurrencyFull(p.total)}</td>
                <td className="text-zinc-400 text-xs">{formatDate(p.expected)}</td>
                <td><Badge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Purchase Order" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Supplier</label>
            <select className="input" value={form.supplier} onChange={e => set('supplier', e.target.value)}>
              {SUPPLIERS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Yarn Type</label>
            <select className="input" value={form.yarn} onChange={e => set('yarn', e.target.value)}>
              {YARNS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity (kg)</label>
            <input className={`input ${errors.qty ? 'border-red-500' : ''}`} type="number" value={form.qty} onChange={e => set('qty', e.target.value)} placeholder="500" />
            {errors.qty && <p className="text-xs text-red-400 mt-1">{errors.qty}</p>}
          </div>
          <div>
            <label className="label">Rate per kg (₹)</label>
            <input className={`input ${errors.rate ? 'border-red-500' : ''}`} type="number" value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="340" />
            {errors.rate && <p className="text-xs text-red-400 mt-1">{errors.rate}</p>}
          </div>
          <div>
            <label className="label">Expected Date</label>
            <input className={`input ${errors.expected ? 'border-red-500' : ''}`} type="date" value={form.expected} onChange={e => set('expected', e.target.value)} />
            {errors.expected && <p className="text-xs text-red-400 mt-1">{errors.expected}</p>}
          </div>
          <div className="flex items-end">
            <div className="card p-3 flex-1">
              <p className="text-2xs text-zinc-500 mb-1">Estimated Total</p>
              <p className="text-lg font-bold text-emerald-400">
                {form.qty && form.rate ? `₹${(Number(form.qty) * Number(form.rate)).toLocaleString('en-IN')}` : '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Raise PO</button>
        </div>
      </Modal>
    </div>
  )
}
