import { useState } from 'react'
import { Plus, Download, Edit2, CheckCircle2, XCircle, Clock, Check } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { Modal }      from '../../components/ui/Modal'
import { formatDate, formatCurrencyFull } from '../../lib/utils'
import { exportCSV }  from '../../lib/exportUtils'

import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useSuppliers
} from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const PO_STATUSES = ['RAISED', 'APPROVED', 'RECEIVED', 'CANCELLED']

export default function PurchaseOrdersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  
  const { data: posData, isLoading, error, refetch } = usePurchaseOrders()
  const pos = posData?.data || []

  const { data: suppliersData } = useSuppliers()
  const suppliers = suppliersData?.data || []

  const createPOMutation = useCreatePurchaseOrder()
  const updatePOMutation = useUpdatePurchaseOrder()

  const [formQty, setFormQty] = useState('')
  const [formRate, setFormRate] = useState('')

  const handleExport = () => {
    exportCSV({
      filename: `PurchaseOrders_${new Date().toISOString().split('T')[0]}`,
      columns: ['PO ID', 'Supplier', 'Yarn', 'Qty (kg)', 'Rate (Rs/kg)', 'Total (Rs)', 'Expected Date', 'Status'],
      rows: pos.map(p => [
        p.poId,
        p.supplier,
        p.yarn,
        p.qty,
        p.rate,
        p.total,
        formatDate(p.expected),
        p.status
      ])
    })
  }

  const handleStatusChange = async (po, newStatus) => {
    try {
      await updatePOMutation.mutateAsync({
        id: po.id,
        status: newStatus
      })
      if (selectedPO?.id === po.id) {
        setSelectedPO(prev => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      alert('Failed to update PO status: ' + (err?.message || err))
    }
  }

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  const calculatedTotal = Number(formQty) * Number(formRate)

  return (
    <div className="page-root">
      <PageHeader
        title="Purchase Orders"
        subtitle="Yarn and material procurement orders"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm gap-1.5" onClick={handleExport}>
              <Download size={13} />Export CSV
            </button>
            <button className="btn-primary btn-sm gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus size={14} />New PO
            </button>
          </div>
        }
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead>
            <tr>
              <th>PO ID</th>
              <th>Supplier</th>
              <th>Yarn</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Total</th>
              <th>Expected</th>
              <th>Status</th>
              <th>Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {pos.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-zinc-500 text-xs">
                  No purchase orders found. Click &quot;New PO&quot; to raise a purchase order.
                </td>
              </tr>
            ) : (
              pos.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="font-mono text-xs text-primary-400 font-semibold">{p.poId}</td>
                  <td className="font-semibold text-zinc-200">{p.supplier}</td>
                  <td>{p.yarn}</td>
                  <td className="font-mono text-xs text-zinc-300">{p.qty?.toLocaleString()} kg</td>
                  <td className="text-zinc-400">₹{p.rate}/kg</td>
                  <td className="font-bold text-emerald-400">{formatCurrencyFull(p.total)}</td>
                  <td className="text-zinc-400 text-xs">{formatDate(p.expected)}</td>
                  <td>
                    <select
                      className="input !py-1 !px-2 !text-xs !bg-zinc-800/80 !w-auto cursor-pointer"
                      value={p.status}
                      disabled={updatePOMutation.isPending}
                      onChange={(e) => handleStatusChange(p, e.target.value)}
                    >
                      {PO_STATUSES.map(st => (
                        <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {p.status !== 'RECEIVED' && (
                        <button
                          className="btn-ghost btn-xs text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 gap-1"
                          title="Mark as Received"
                          onClick={() => handleStatusChange(p, 'RECEIVED')}
                        >
                          <Check size={12} /> Received
                        </button>
                      )}
                      <button
                        className="btn-ghost btn-xs text-zinc-400 hover:text-zinc-200 px-2 py-1"
                        onClick={() => setSelectedPO(p)}
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: New Purchase Order ── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Purchase Order" size="lg">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const data = Object.fromEntries(fd.entries())
          try {
            await createPOMutation.mutateAsync({
              poId: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              supplier: data.supplier,
              yarn: data.yarn,
              qty: Number(data.qty),
              rate: Number(data.rate),
              total: Number(data.qty) * Number(data.rate),
              expected: new Date(data.expected || new Date()).toISOString(),
              status: 'RAISED'
            })
            setShowAdd(false)
            setFormQty('')
            setFormRate('')
          } catch (err) {
            console.error('Failed to create PO', err)
            alert('Failed to raise PO: ' + (err?.message || err))
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Supplier <span className="text-red-400">*</span></label>
              <select name="supplier" className="input" required defaultValue="">
                <option value="" disabled>Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name} ({s.city})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Yarn / Material Type <span className="text-red-400">*</span></label>
              <input name="yarn" className="input" placeholder="e.g. Cotton 40s Combed" required />
            </div>
            <div>
              <label className="label">Quantity (kg) <span className="text-red-400">*</span></label>
              <input
                name="qty"
                className="input"
                type="number"
                step="any"
                required
                placeholder="e.g. 500"
                value={formQty}
                onChange={e => setFormQty(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Rate per kg (₹) <span className="text-red-400">*</span></label>
              <input
                name="rate"
                className="input"
                type="number"
                step="any"
                required
                placeholder="e.g. 260"
                value={formRate}
                onChange={e => setFormRate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Expected Delivery Date <span className="text-red-400">*</span></label>
              <input
                name="expected"
                className="input"
                type="date"
                required
                defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="label">Estimated Total Amount</label>
              <div className="input bg-zinc-800/40 text-emerald-400 font-bold flex items-center">
                {calculatedTotal > 0 ? formatCurrencyFull(calculatedTotal) : '₹0'}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800/60 mt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createPOMutation.isPending}>
              {createPOMutation.isPending ? 'Raising PO...' : 'Raise Purchase Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: PO Details & Status Edit ── */}
      <Modal open={!!selectedPO} onClose={() => setSelectedPO(null)} title={`Purchase Order: ${selectedPO?.poId}`} size="md">
        {selectedPO && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <span className="text-zinc-500">Supplier</span>
                <p className="font-semibold text-zinc-200 mt-0.5">{selectedPO.supplier}</p>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <span className="text-zinc-500">Material</span>
                <p className="font-semibold text-zinc-200 mt-0.5">{selectedPO.yarn}</p>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <span className="text-zinc-500">Order Quantity</span>
                <p className="font-semibold text-zinc-200 mt-0.5">{selectedPO.qty?.toLocaleString()} kg</p>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <span className="text-zinc-500">Total Value</span>
                <p className="font-bold text-emerald-400 mt-0.5">{formatCurrencyFull(selectedPO.total)}</p>
              </div>
            </div>

            <div>
              <label className="label">Change Status</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {PO_STATUSES.map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(selectedPO, st)}
                    className={`btn-sm text-xs rounded-xl border ${
                      selectedPO.status === st
                        ? 'bg-primary-500/20 border-primary-500 text-primary-300 font-bold'
                        : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800/60">
              <button className="btn-secondary" onClick={() => setSelectedPO(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
