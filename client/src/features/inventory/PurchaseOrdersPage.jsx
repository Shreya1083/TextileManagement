import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatDate, formatCurrencyFull } from '../../lib/utils'
import { exportCSV }  from '../../lib/exportUtils'

const initialPOs = [
  {
    id: 'PO-2026-018',
    supplier: 'Agarwal Yarns Pvt Ltd',
    yarn: 'Cotton 60s',
    qty: 600,
    rate: 340,
    total: 204000,
    expected: '2026-10-18',
    status: 'RAISED',
    notes: '',
  },
  {
    id: 'PO-2026-017',
    supplier: 'Bharat Silk House',
    yarn: 'Silk 2/120D',
    qty: 100,
    rate: 2200,
    total: 220000,
    expected: '2026-10-15',
    status: 'PARTIALLY_RECEIVED',
    notes: '',
  },
  {
    id: 'PO-2026-016',
    supplier: 'Krishna Fibers',
    yarn: 'Linen 20s',
    qty: 400,
    rate: 480,
    total: 192000,
    expected: '2026-10-10',
    status: 'RECEIVED',
    notes: '',
  },
]

const BLANK_FORM = {
  supplier: 'Agarwal Yarns Pvt Ltd',
  yarn: 'Cotton 60s',
  qty: '',
  rate: '',
  expected: new Date().toISOString().slice(0, 10),
  notes: '',
}

const SUPPLIERS = [
  'Agarwal Yarns Pvt Ltd',
  'Bharat Silk House',
  'Krishna Fibers',
]

const YARN_TYPES = ['Cotton 60s', 'Silk 2/120D', 'Linen 20s']

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState(initialPOs)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedPo, setSelectedPo] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(BLANK_FORM)
  const [errors, setErrors] = useState({})

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return purchaseOrders

    return purchaseOrders.filter((po) =>
      [po.id, po.supplier, po.yarn, po.status]
        .some((value) => String(value ?? '').toLowerCase().includes(query)),
    )
  }, [purchaseOrders, search])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const closeAddModal = () => {
    setShowAdd(false)
    setForm(BLANK_FORM)
    setErrors({})
  }

  const handleCreatePO = (event) => {
    event.preventDefault()

    const nextErrors = {}
    const qty = Number(form.qty)
    const rate = Number(form.rate)

    if (!form.supplier) nextErrors.supplier = 'Select a supplier'
    if (!form.yarn) nextErrors.yarn = 'Select a yarn type'
    if (!form.qty || !Number.isFinite(qty) || qty <= 0) {
      nextErrors.qty = 'Enter a quantity greater than zero'
    }
    if (!form.rate || !Number.isFinite(rate) || rate <= 0) {
      nextErrors.rate = 'Enter a rate greater than zero'
    }
    if (!form.expected) nextErrors.expected = 'Select an expected date'

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const nextNumber = Math.max(
      0,
      ...purchaseOrders.map((po) => {
        const match = po.id.match(/PO-\d{4}-(\d+)/)
        return match ? Number(match[1]) : 0
      }),
    ) + 1

    const newPO = {
      id: `PO-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
      supplier: form.supplier,
      yarn: form.yarn,
      qty,
      rate,
      total: qty * rate,
      expected: form.expected,
      status: 'RAISED',
      notes: form.notes.trim(),
    }

    setPurchaseOrders((current) => [newPO, ...current])
    closeAddModal()
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Purchase Orders"
        subtitle="Yarn and material procurement"
        actions={
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={14} />
            New PO
          </button>
        }
      />

      <div className="table-wrap">
        <div className="table-head">
          <div className="flex items-center gap-2">
            <p className="section-title">
              Active Orders{' '}
              <span className="text-zinc-600 font-normal text-xs ml-1">
                {filtered.length} orders
              </span>
            </p>
          </div>

          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              id="search-po-input"
              className="input-sm pl-8 w-52"
              placeholder="Search PO, supplier, yarn…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search purchase orders"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
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
              {filtered.length > 0 ? (
                filtered.map((po) => (
                  <tr key={po.id}>
                    <td className="font-mono text-xs text-primary-400 font-semibold">
                      {po.id}
                    </td>
                    <td className="font-semibold text-zinc-200">{po.supplier}</td>
                    <td>{po.yarn}</td>
                    <td className="font-mono text-xs text-zinc-300">
                      {po.qty.toLocaleString()} kg
                    </td>
                    <td className="text-zinc-400">₹{po.rate.toLocaleString('en-IN')}/kg</td>
                    <td className="font-bold">{formatCurrencyFull(po.total)}</td>
                    <td className="text-zinc-400 text-xs">{formatDate(po.expected)}</td>
                    <td><Badge status={po.status} /></td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost btn-xs text-primary-400"
                        onClick={() => setSelectedPo(po)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-zinc-500">
                    No purchase orders match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Order Modal */}
      <Modal
        open={showAdd}
        onClose={closeAddModal}
        title="New Purchase Order"
        size="lg"
      >
        <form onSubmit={handleCreatePO}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="po-supplier">Supplier</label>
              <select
                id="po-supplier"
                className="input"
                value={form.supplier}
                onChange={(event) => setField('supplier', event.target.value)}
              >
                {SUPPLIERS.map((supplier) => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
              {errors.supplier && <p className="mt-1 text-xs text-red-400">{errors.supplier}</p>}
            </div>

            <div>
              <label className="label" htmlFor="po-yarn">Yarn Type</label>
              <select
                id="po-yarn"
                className="input"
                value={form.yarn}
                onChange={(event) => setField('yarn', event.target.value)}
              >
                {YARN_TYPES.map((yarn) => (
                  <option key={yarn} value={yarn}>{yarn}</option>
                ))}
              </select>
              {errors.yarn && <p className="mt-1 text-xs text-red-400">{errors.yarn}</p>}
            </div>

            <div>
              <label className="label" htmlFor="po-qty">Quantity (kg)</label>
              <input
                id="po-qty"
                className={`input ${errors.qty ? 'border-red-500' : ''}`}
                type="number"
                min="0.01"
                step="any"
                value={form.qty}
                onChange={(event) => setField('qty', event.target.value)}
                placeholder="600"
              />
              {errors.qty && <p className="mt-1 text-xs text-red-400">{errors.qty}</p>}
            </div>

            <div>
              <label className="label" htmlFor="po-rate">Rate per kg (₹)</label>
              <input
                id="po-rate"
                className={`input ${errors.rate ? 'border-red-500' : ''}`}
                type="number"
                min="0.01"
                step="any"
                value={form.rate}
                onChange={(event) => setField('rate', event.target.value)}
                placeholder="340"
              />
              {errors.rate && <p className="mt-1 text-xs text-red-400">{errors.rate}</p>}
            </div>

            <div>
              <label className="label" htmlFor="po-expected">Expected Date</label>
              <input
                id="po-expected"
                className={`input ${errors.expected ? 'border-red-500' : ''}`}
                type="date"
                value={form.expected}
                onChange={(event) => setField('expected', event.target.value)}
              />
              {errors.expected && <p className="mt-1 text-xs text-red-400">{errors.expected}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="po-notes">Notes (optional)</label>
              <textarea
                id="po-notes"
                className="input min-h-20"
                rows={3}
                value={form.notes}
                onChange={(event) => setField('notes', event.target.value)}
                placeholder="Add delivery instructions or other notes"
              />
            </div>
          </div>

          {Number(form.qty) > 0 && Number(form.rate) > 0 && (
            <p className="text-sm text-zinc-300 mt-4">
              Estimated total:{' '}
              <span className="font-bold text-emerald-400">
                {formatCurrencyFull(Number(form.qty) * Number(form.rate))}
              </span>
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={closeAddModal}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Raise PO
            </button>
          </div>
        </form>
      </Modal>

      {/* Purchase Order Details Modal */}
      {selectedPo && (
        <Modal
          open={Boolean(selectedPo)}
          onClose={() => setSelectedPo(null)}
          title={`Purchase Order: ${selectedPo.id}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 block">Supplier</span>
                <span className="text-zinc-200 font-semibold">{selectedPo.supplier}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Yarn / Material</span>
                <span className="text-zinc-200 font-semibold">{selectedPo.yarn}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Quantity</span>
                <span className="text-zinc-200">{selectedPo.qty.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Rate</span>
                <span className="text-zinc-200">{formatCurrencyFull(selectedPo.rate)} / kg</span>
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

            {selectedPo.notes && (
              <div className="text-xs text-zinc-400 bg-zinc-800/30 p-2.5 rounded-lg border border-zinc-800">
                <span className="font-semibold text-zinc-300">Notes:</span>{' '}
                {selectedPo.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setSelectedPo(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
