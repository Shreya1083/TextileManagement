import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Trash2, Loader2, ArrowUpRight, Search, FileText, Calendar, Building, Package } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { formatDate, formatCurrencyFull, cn } from '../../lib/utils'
import api from '../../lib/api'

const initialPOs = [
  { id:'PO-2026-018', poNumber:'PO-2026-018', supplier:'Agarwal Yarns Pvt Ltd', yarn:'Cotton 60s',  qty:600,  rate:340,  total:204000, expected:'2026-10-18', status:'RAISED' },
  { id:'PO-2026-017', poNumber:'PO-2026-017', supplier:'Bharat Silk House',      yarn:'Silk 2/120D', qty:100,  rate:2200, total:220000, expected:'2026-10-15', status:'PARTIALLY_RECEIVED' },
  { id:'PO-2026-016', poNumber:'PO-2026-016', supplier:'Krishna Fibers',          yarn:'Linen 20s',  qty:400,  rate:480,  total:192000, expected:'2026-10-10', status:'RECEIVED' },
]

function getFutureDate(days = 7) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const BLANK_ITEM = { yarnTypeId: '', quantity: '', unitPrice: '' }

const BLANK_PO = {
  supplierId: '',
  expectedDate: getFutureDate(7),
  notes: '',
  items: [{ ...BLANK_ITEM }],
}

function normalizePo(po) {
  const items = po.items || []
  const firstItem = items[0] || {}
  const totalQty = items.length > 0
    ? items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
    : (Number(po.qty) || 0)

  let yarnLabel = 'N/A'
  if (items.length > 1) {
    yarnLabel = `${firstItem.yarnType?.name || 'Item'} (+${items.length - 1} more)`
  } else if (items.length === 1) {
    yarnLabel = firstItem.yarnType?.name || po.yarn || 'Yarn'
  } else if (po.yarn) {
    yarnLabel = po.yarn
  }

  const rate = firstItem.unitPrice ? firstItem.unitPrice / 100 : (po.rate || 0)
  const total = po.totalAmount ? po.totalAmount / 100 : (po.total || 0)

  return {
    id: po.id,
    poNumber: po.poNumber || po.id,
    supplierId: po.supplierId,
    supplier: po.supplier?.name || po.supplier || 'Unknown Supplier',
    items,
    yarn: yarnLabel,
    qty: totalQty,
    rate,
    total,
    expected: po.expectedDate || po.expected || getFutureDate(7),
    status: po.status || 'RAISED',
    notes: po.notes,
    createdAt: po.createdAt,
  }
}

export default function PurchaseOrdersPage() {
  const toast = useToast()

  const [pos, setPos] = useState(() => initialPOs.map(normalizePo))
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Form metadata
  const [suppliers, setSuppliers] = useState([])
  const [yarnTypes, setYarnTypes] = useState([])

  // Modal & Form State
  const [showAdd, setShowAdd] = useState(false)
  const [selectedPo, setSelectedPo] = useState(null)
  const [form, setForm] = useState(BLANK_PO)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const fetchPOs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/inventory/purchase-orders')
      if (res.data?.success && Array.isArray(res.data.data)) {
        if (res.data.data.length > 0) {
          setPos(res.data.data.map(normalizePo))
        }
      }
    } catch (err) {
      console.warn('Failed to fetch purchase orders from API:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDropdowns = useCallback(async () => {
    try {
      const [supRes, yarnRes] = await Promise.allSettled([
        api.get('/inventory/suppliers'),
        api.get('/inventory/yarn-types'),
      ])

      if (supRes.status === 'fulfilled' && supRes.value.data?.data) {
        setSuppliers(supRes.value.data.data)
      }
      if (yarnRes.status === 'fulfilled' && yarnRes.value.data?.data) {
        setYarnTypes(yarnRes.value.data.data)
      }
    } catch (err) {
      console.warn('Failed to load PO dropdown data:', err.message)
    }
  }, [])

  useEffect(() => {
    fetchPOs()
    fetchDropdowns()
  }, [fetchPOs, fetchDropdowns])

  // Line item management
  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...BLANK_ITEM }],
    }))
  }

  const handleRemoveItem = (index) => {
    if (form.items.length <= 1) return
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleItemChange = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i === index ? { ...it, [field]: value } : it),
    }))

    // Clear item error if present
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[`item_${index}_${field}`]
        return next
      })
    }
  }

  const calculatedTotal = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0
      const p = Number(item.unitPrice) || 0
      return sum + (q * p)
    }, 0)
  }, [form.items])

  const validateForm = () => {
    const errs = {}
    if (!form.supplierId) errs.supplierId = 'Supplier is required'
    if (!form.expectedDate) errs.expectedDate = 'Expected delivery date is required'

    if (!form.items || form.items.length === 0) {
      errs.items = 'At least one line item is required'
    } else {
      form.items.forEach((item, idx) => {
        if (!item.yarnTypeId) {
          errs[`item_${idx}_yarnTypeId`] = 'Select yarn'
        }
        if (!item.quantity || isNaN(item.quantity) || Number(item.quantity) <= 0) {
          errs[`item_${idx}_quantity`] = '> 0'
        }
        if (!item.unitPrice || isNaN(item.unitPrice) || Number(item.unitPrice) <= 0) {
          errs[`item_${idx}_unitPrice`] = '> 0'
        }
      })
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!validateForm() || submitting) return

    setSubmitting(true)
    try {
      const generatedPoNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
      const payload = {
        poNumber: generatedPoNumber,
        supplierId: form.supplierId,
        expectedDate: new Date(form.expectedDate).toISOString(),
        notes: form.notes?.trim() || undefined,
        items: form.items.map(it => ({
          yarnTypeId: it.yarnTypeId,
          quantity: Math.round(Number(it.quantity)),
          unitPrice: Math.round(Number(it.unitPrice) * 100), // convert rupees to integer paise
        })),
      }

      const res = await api.post('/inventory/purchase-orders', payload)
      if (res.data?.success) {
        toast(`Purchase Order ${res.data.data.poNumber || generatedPoNumber} created successfully!`, 'success')
        setShowAdd(false)
        setForm(BLANK_PO)
        setErrors({})
        // Re-fetch to immediately display new PO in the list
        await fetchPOs()
      } else {
        toast(res.data?.message || 'Failed to create purchase order', 'error')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error saving purchase order'
      toast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = pos.filter(p =>
    p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.toLowerCase().includes(search.toLowerCase()) ||
    p.yarn.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-root">
      <PageHeader
        title="Purchase Orders"
        subtitle="Yarn procurement, supplier requisitions, and delivery tracking"
        actions={
          <button
            id="new-po-btn"
            className="btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => {
              setForm(BLANK_PO)
              setErrors({})
              setShowAdd(true)
            }}
          >
            <Plus size={14} />New PO
          </button>
        }
      />

      <div className="table-wrap">
        <div className="table-head">
          <div className="flex items-center gap-2">
            <p className="section-title">
              Active Orders <span className="text-zinc-600 font-normal text-xs ml-1">{filtered.length} orders</span>
            </p>
            {loading && <Loader2 size={13} className="animate-spin text-primary-400" />}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="search-po-input"
              className="input-sm pl-8 w-52"
              placeholder="Search PO, supplier, yarn…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="table-base">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Yarn / Materials</th>
              <th>Total Qty</th>
              <th>Est. Rate</th>
              <th>Total Value</th>
              <th>Expected Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-zinc-500 text-sm">
                  {loading ? 'Loading purchase orders...' : 'No purchase orders found matching your search.'}
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id || p.poNumber} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="font-mono text-xs text-primary-400 font-semibold">{p.poNumber}</td>
                  <td className="font-semibold text-zinc-200">{p.supplier}</td>
                  <td className="text-zinc-300">{p.yarn}</td>
                  <td className="font-mono text-xs text-zinc-300 font-medium">{p.qty.toLocaleString()} kg</td>
                  <td className="text-zinc-400 font-mono text-xs">₹{p.rate.toLocaleString()}/kg</td>
                  <td className="font-bold text-zinc-100 font-mono text-xs">{formatCurrencyFull(p.total)}</td>
                  <td className="text-zinc-400 text-xs">{formatDate(p.expected)}</td>
                  <td><Badge status={p.status} /></td>
                  <td>
                    <button
                      className="btn-ghost btn-xs text-zinc-400 hover:text-primary-300"
                      onClick={() => setSelectedPo(p)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Purchase Order Creation Modal */}
      <Modal
        open={showAdd}
        onClose={() => !submitting && setShowAdd(false)}
        title="Raise New Purchase Order"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-zinc-400">
            Create an official purchase requisition for yarn raw materials with itemized quantities and unit rates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier Selection */}
            <div>
              <label className="label">
                Supplier <span className="text-red-400">*</span>
              </label>
              <select
                id="po-supplier-select"
                className={cn('input', errors.supplierId && 'border-red-500')}
                value={form.supplierId}
                onChange={e => {
                  setForm(f => ({ ...f, supplierId: e.target.value }))
                  if (errors.supplierId) {
                    setErrors(errs => { const next = { ...errs }; delete next.supplierId; return next })
                  }
                }}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.contactName ? `(${s.contactName})` : ''}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="text-xs text-red-400 mt-1">{errors.supplierId}</p>
              )}
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="label">
                Expected Delivery Date <span className="text-red-400">*</span>
              </label>
              <input
                id="po-expected-date"
                type="date"
                className={cn('input', errors.expectedDate && 'border-red-500')}
                value={form.expectedDate}
                onChange={e => {
                  setForm(f => ({ ...f, expectedDate: e.target.value }))
                  if (errors.expectedDate) {
                    setErrors(errs => { const next = { ...errs }; delete next.expectedDate; return next })
                  }
                }}
              />
              {errors.expectedDate && (
                <p className="text-xs text-red-400 mt-1">{errors.expectedDate}</p>
              )}
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border border-zinc-800 rounded-xl p-3.5 bg-zinc-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Order Line Items ({form.items.length})
              </span>
              <button
                id="po-add-item-btn"
                type="button"
                className="btn-secondary btn-xs flex items-center gap-1 text-primary-300 border-primary-500/30 hover:bg-primary-500/10"
                onClick={handleAddItem}
              >
                <Plus size={12} />Add Item
              </button>
            </div>

            {errors.items && (
              <p className="text-xs text-red-400">{errors.items}</p>
            )}

            <div className="space-y-2.5">
              {form.items.map((item, idx) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-800/80">
                    {/* Yarn Type */}
                    <div className="col-span-5">
                      <select
                        id={`po-item-yarn-${idx}`}
                        className={cn('input text-xs h-9', errors[`item_${idx}_yarnTypeId`] && 'border-red-500')}
                        value={item.yarnTypeId}
                        onChange={e => handleItemChange(idx, 'yarnTypeId', e.target.value)}
                      >
                        <option value="">Select Yarn Material</option>
                        {yarnTypes.map(y => (
                          <option key={y.id} value={y.id}>
                            {y.name} ({y.color || 'White'}) — {y.unit || 'kg'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-3">
                      <input
                        id={`po-item-qty-${idx}`}
                        type="number"
                        min="1"
                        step="any"
                        placeholder="Qty (kg)"
                        className={cn('input text-xs h-9', errors[`item_${idx}_quantity`] && 'border-red-500')}
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-3">
                      <input
                        id={`po-item-rate-${idx}`}
                        type="number"
                        min="1"
                        step="any"
                        placeholder="Rate ₹/kg"
                        className={cn('input text-xs h-9', errors[`item_${idx}_unitPrice`] && 'border-red-500')}
                        value={item.unitPrice}
                        onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                      />
                    </div>

                    {/* Delete action */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        className="text-zinc-500 hover:text-red-400 disabled:opacity-30 p-1 rounded"
                        disabled={form.items.length <= 1}
                        onClick={() => handleRemoveItem(idx)}
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Line Total snippet */}
                    {lineTotal > 0 && (
                      <div className="col-span-12 text-right pr-3 text-[11px] text-zinc-400 font-mono">
                        Line subtotal: <span className="text-zinc-200 font-semibold">{formatCurrencyFull(lineTotal)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Calculated Order Summary Banner */}
            <div className="flex justify-between items-center px-3 py-2 bg-zinc-800/70 rounded-lg border border-zinc-700/50 mt-2">
              <span className="text-xs text-zinc-400 font-medium">Estimated Purchase Total</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {formatCurrencyFull(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">
              Special Instructions / Terms <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <input
              id="po-notes"
              className="input text-xs"
              placeholder="e.g. Delivery at Factory Gate 2, Net 30 days payment terms"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAdd(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              id="po-submit-btn"
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving Purchase Order...
                </>
              ) : (
                <>
                  <ArrowUpRight size={14} />
                  Raise Purchase Order
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* PO View Modal */}
      {selectedPo && (
        <Modal
          open={Boolean(selectedPo)}
          onClose={() => setSelectedPo(null)}
          title={`Purchase Order: ${selectedPo.poNumber}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 block">Supplier</span>
                <span className="text-zinc-200 font-semibold">{selectedPo.supplier}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Status</span>
                <span className="mt-0.5 inline-block"><Badge status={selectedPo.status} /></span>
              </div>
              <div>
                <span className="text-zinc-500 block">Expected Date</span>
                <span className="text-zinc-200">{formatDate(selectedPo.expected)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Total Value</span>
                <span className="text-emerald-400 font-bold">{formatCurrencyFull(selectedPo.total)}</span>
              </div>
            </div>

            {selectedPo.items && selectedPo.items.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Item Breakdown</p>
                <div className="border border-zinc-800 rounded-lg overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-zinc-800/60 text-zinc-400">
                      <tr>
                        <th className="py-1.5 px-3 text-left">Item</th>
                        <th className="py-1.5 px-3 text-right">Quantity</th>
                        <th className="py-1.5 px-3 text-right">Unit Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {selectedPo.items.map((it, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 text-zinc-200">{it.yarnType?.name || 'Yarn'}</td>
                          <td className="py-2 px-3 text-right font-mono">{it.quantity} kg</td>
                          <td className="py-2 px-3 text-right font-mono">₹{(it.unitPrice / 100).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedPo.notes && (
              <div className="text-xs text-zinc-400 bg-zinc-800/30 p-2.5 rounded-lg border border-zinc-800">
                <span className="font-semibold text-zinc-300">Notes:</span> {selectedPo.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button className="btn-secondary btn-sm" onClick={() => setSelectedPo(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
