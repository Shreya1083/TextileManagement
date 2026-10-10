import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { Modal }      from '../../components/ui/Modal'
import { formatDate, formatCurrencyFull } from '../../lib/utils'



import { usePurchaseOrders, useCreatePurchaseOrder, useSuppliers } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

export default function PurchaseOrdersPage() {
  const [showAdd, setShowAdd] = useState(false)
  
  const { data: posData, isLoading, error } = usePurchaseOrders()
  const pos = posData?.data || []

  const { data: suppliersData } = useSuppliers()
  const suppliers = suppliersData?.data || []

  const createPOMutation = useCreatePurchaseOrder()

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader title="Purchase Orders" subtitle="Yarn and material procurement"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />New PO</button>}
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>PO ID</th><th>Supplier</th><th>Yarn</th><th>Qty</th><th>Rate</th><th>Total</th><th>Expected</th><th>Status</th></tr></thead>
          <tbody>
            {pos.map(p => (
              <tr key={p.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{p.poId}</td>
                <td className="font-semibold text-zinc-200">{p.supplier}</td>
                <td>{p.yarn}</td>
                <td className="font-mono text-xs text-zinc-300">{p.qty?.toLocaleString()} kg</td>
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
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const data = Object.fromEntries(fd.entries())
          try {
            await createPOMutation.mutateAsync({
              poId: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
              supplier: data.supplier,
              yarn: data.yarn,
              qty: Number(data.qty),
              rate: Number(data.rate),
              total: Number(data.qty) * Number(data.rate),
              expected: new Date(data.expected).toISOString(),
              status: 'RAISED'
            })
            setShowAdd(false)
          } catch (err) {
            console.error('Failed to create PO', err)
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Supplier</label>
              <select name="supplier" className="input" required>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="label">Yarn Type</label><input name="yarn" className="input" placeholder="e.g. Cotton 60s" required /></div>
            <div><label className="label">Quantity (kg)</label><input name="qty" className="input" type="number" required /></div>
            <div><label className="label">Rate per kg (₹)</label><input name="rate" className="input" type="number" required /></div>
            <div><label className="label">Expected Date</label><input name="expected" className="input" type="date" required /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createPOMutation.isPending}>Raise PO</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
