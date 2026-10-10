import { useState, useEffect, useCallback } from 'react'
import { Plus, Package, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { formatDate } from '../../lib/utils'
import api from '../../lib/api'

const initGRNs = [
  { id:'GRN-2026-042', supplier:'Agarwal Yarns Pvt Ltd', yarn:'Cotton 40s',  colour:'White',   qty:500,  bags:10, challan:'CH-8821', vehicle:'GJ05AB1234', date:'2026-10-08' },
  { id:'GRN-2026-041', supplier:'Krishna Fibers',         yarn:'Poly 150D',   colour:'Natural', qty:800,  bags:16, challan:'CH-7734', vehicle:'MH02CD5678', date:'2026-10-06' },
  { id:'GRN-2026-040', supplier:'Rajasthan Denim Supply', yarn:'Denim 7oz',   colour:'Indigo',  qty:2100, bags:21, challan:'CH-5529', vehicle:'RJ14EF9012', date:'2026-10-03' },
]

const BLANK = {
  supplierId: '',
  yarnTypeId: '',
  lot: '',
  qty: '',
  bags: '',
  cones: '',
  challan: '',
  vehicle: '',
  notes: '',
}

function normalizeGateEntry(ge) {
  return {
    id: ge.grnNumber || ge.id,
    supplier: ge.supplier?.name || ge.supplier || 'Supplier',
    yarn: ge.yarnType?.name || ge.yarn || 'Yarn',
    colour: ge.yarnType?.color || ge.colour || 'White',
    qty: Number(ge.quantity ?? ge.qty ?? 0),
    bags: Number(ge.bags ?? 0),
    challan: ge.challanNumber || ge.challan || '—',
    vehicle: ge.vehicleNumber || ge.vehicle || '—',
    date: ge.receivedAt || ge.createdAt || ge.date || new Date().toISOString(),
  }
}

export default function GateEntryPage() {
  const toast = useToast()
  const [grns, setGrns]       = useState(initGRNs)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState(BLANK)
  const [errors, setErrors]   = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Dynamic dropdowns
  const [suppliers, setSuppliers] = useState([])
  const [yarnTypes, setYarnTypes] = useState([])

  const fetchGRNs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/inventory/gate-entries')
      if (res.data?.success && Array.isArray(res.data.data)) {
        if (res.data.data.length > 0) {
          setGrns(res.data.data.map(normalizeGateEntry))
        }
      }
    } catch (err) {
      console.warn('Failed to fetch gate entries:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDropdowns = useCallback(async () => {
    try {
      const [sRes, yRes] = await Promise.allSettled([
        api.get('/inventory/suppliers'),
        api.get('/inventory/yarn-types'),
      ])
      if (sRes.status === 'fulfilled' && sRes.value.data?.data) {
        setSuppliers(sRes.value.data.data)
      }
      if (yRes.status === 'fulfilled' && yRes.value.data?.data) {
        setYarnTypes(yRes.value.data.data)
      }
    } catch (err) {
      console.warn('Failed to load dropdowns:', err.message)
    }
  }, [])

  useEffect(() => {
    fetchGRNs()
    fetchDropdowns()
  }, [fetchGRNs, fetchDropdowns])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) {
      setErrors(e => { const next = { ...e }; delete next[k]; return next })
    }
  }

  const validate = () => {
    const e = {}
    if (!form.supplierId) e.supplierId = 'Required'
    if (!form.yarnTypeId) e.yarnTypeId = 'Required'
    if (!form.lot.trim()) e.lot = 'Required'
    if (!form.qty || isNaN(form.qty) || Number(form.qty) <= 0) e.qty = 'Enter valid qty'
    if (!form.challan.trim()) e.challan = 'Required'
    if (!form.vehicle.trim()) e.vehicle = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate() || submitting) return
    setSubmitting(true)
    try {
      const nextNum = Date.now().toString().slice(-4)
      const generatedId = `GRN-${new Date().getFullYear()}-${nextNum}`

      const payload = {
        grnNumber: generatedId,
        supplierId: form.supplierId,
        yarnTypeId: form.yarnTypeId,
        lotNumber: form.lot.trim().toUpperCase(),
        quantity: Math.round(Number(form.qty)),
        bags: form.bags ? Number(form.bags) : 0,
        cones: form.cones ? Number(form.cones) : 0,
        unitPrice: 100,
        challanNumber: form.challan.trim(),
        vehicleNumber: form.vehicle.trim().toUpperCase(),
      }

      const res = await api.post('/inventory/gate-entries', payload)
      if (res.data?.success) {
        toast(`GRN ${res.data.data.grnNumber || generatedId} recorded successfully`, 'success')
        setShowAdd(false)
        setForm(BLANK)
        await fetchGRNs()
      } else {
        toast(res.data?.message || 'Failed to save GRN', 'error')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error recording GRN'
      toast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Gate Entry / GRN"
        subtitle="Goods Receipt Notes — yarn and material inward"
        actions={
          <button
            className="btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => {
              setForm({
                ...BLANK,
                supplierId: suppliers[0]?.id || '',
                yarnTypeId: yarnTypes[0]?.id || '',
              })
              setErrors({})
              setShowAdd(true)
            }}
          >
            <Plus size={14} />New GRN
          </button>
        }
      />

      <div className="table-wrap">
        <div className="table-head">
          <div className="flex items-center gap-2">
            <p className="section-title">
              Recent GRNs <span className="text-zinc-600 font-normal text-xs ml-1">{grns.length} entries</span>
            </p>
            {loading && <Loader2 size={13} className="animate-spin text-primary-400" />}
          </div>
        </div>

        <table className="table-base">
          <thead>
            <tr>
              <th>GRN ID</th>
              <th>Supplier</th>
              <th>Yarn Type</th>
              <th>Colour</th>
              <th>Qty</th>
              <th>Bags</th>
              <th>Challan</th>
              <th>Vehicle</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {grns.map(g => (
              <tr key={g.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{g.id}</td>
                <td className="font-semibold text-zinc-200">{g.supplier}</td>
                <td>{g.yarn}</td>
                <td className="text-zinc-400">{g.colour}</td>
                <td className="font-bold text-emerald-400">+{g.qty.toLocaleString()} kg</td>
                <td className="text-zinc-300">{g.bags}</td>
                <td className="font-mono text-xs text-zinc-400">{g.challan}</td>
                <td className="font-mono text-xs text-zinc-400">{g.vehicle}</td>
                <td className="text-zinc-400 text-xs">{formatDate(g.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showAdd} onClose={() => !submitting && setShowAdd(false)} title="New Gate Entry / GRN" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Supplier <span className="text-red-400">*</span></label>
            <select
              className={`input ${errors.supplierId ? 'border-red-500' : ''}`}
              value={form.supplierId}
              onChange={e => set('supplierId', e.target.value)}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.supplierId && <p className="text-xs text-red-400 mt-1">{errors.supplierId}</p>}
          </div>

          <div>
            <label className="label">Yarn Type <span className="text-red-400">*</span></label>
            <select
              className={`input ${errors.yarnTypeId ? 'border-red-500' : ''}`}
              value={form.yarnTypeId}
              onChange={e => set('yarnTypeId', e.target.value)}
            >
              <option value="">Select Yarn Type</option>
              {yarnTypes.map(y => (
                <option key={y.id} value={y.id}>{y.name} ({y.color || 'White'})</option>
              ))}
            </select>
            {errors.yarnTypeId && <p className="text-xs text-red-400 mt-1">{errors.yarnTypeId}</p>}
          </div>

          <div>
            <label className="label">Lot / Batch Number <span className="text-red-400">*</span></label>
            <input
              className={`input font-mono ${errors.lot ? 'border-red-500' : ''}`}
              value={form.lot}
              onChange={e => set('lot', e.target.value)}
              placeholder="LOT-001"
            />
            {errors.lot && <p className="text-xs text-red-400 mt-1">{errors.lot}</p>}
          </div>

          <div>
            <label className="label">Quantity (kg) <span className="text-red-400">*</span></label>
            <input
              className={`input ${errors.qty ? 'border-red-500' : ''}`}
              type="number"
              min="1"
              value={form.qty}
              onChange={e => set('qty', e.target.value)}
              placeholder="500"
            />
            {errors.qty && <p className="text-xs text-red-400 mt-1">{errors.qty}</p>}
          </div>

          <div>
            <label className="label">Bags Count</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.bags}
              onChange={e => set('bags', e.target.value)}
              placeholder="10"
            />
          </div>

          <div>
            <label className="label">Cones Count</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.cones}
              onChange={e => set('cones', e.target.value)}
              placeholder="200"
            />
          </div>

          <div>
            <label className="label">Challan Number <span className="text-red-400">*</span></label>
            <input
              className={`input font-mono ${errors.challan ? 'border-red-500' : ''}`}
              value={form.challan}
              onChange={e => set('challan', e.target.value)}
              placeholder="CH-0001"
            />
            {errors.challan && <p className="text-xs text-red-400 mt-1">{errors.challan}</p>}
          </div>

          <div>
            <label className="label">Vehicle Number <span className="text-red-400">*</span></label>
            <input
              className={`input font-mono ${errors.vehicle ? 'border-red-500' : ''}`}
              value={form.vehicle}
              onChange={e => set('vehicle', e.target.value)}
              placeholder="GJ05AB1234"
            />
            {errors.vehicle && <p className="text-xs text-red-400 mt-1">{errors.vehicle}</p>}
          </div>

          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea
              className="input text-xs"
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Driver notes, unloading bay details..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
          <button className="btn-secondary" onClick={() => setShowAdd(false)} disabled={submitting}>
            Cancel
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving GRN...
              </>
            ) : (
              <>
                <Package size={14} />Save GRN
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}
