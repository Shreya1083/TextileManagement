import { useState } from 'react'
import { Plus, Package, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

import { useGateEntries, useCreateGateEntry, useSuppliers } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

export default function GateEntryPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState(null)
  
  const { data: grnData, isLoading, error, refetch: refetchGRNs } = useGateEntries()
  const grns = grnData?.data || []

  const { data: suppliersData } = useSuppliers()
  const suppliers = suppliersData?.data || []

  const createGateEntryMutation = useCreateGateEntry()

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold flex items-center gap-2.5 animate-slide-in ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-700 text-red-200'
              : 'bg-emerald-950/95 border-emerald-600 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      <PageHeader title="Gate Entry / GRN" subtitle="Goods Receipt Notes — yarn and material inward"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />New GRN</button>}
      />
      <div className="table-wrap">
        <div className="table-head"><p className="section-title">Recent GRNs</p></div>
        <table className="table-base">
          <thead><tr><th>GRN ID</th><th>Supplier</th><th>Yarn Type</th><th>Colour</th><th>Qty</th><th>Bags</th><th>Challan</th><th>Vehicle</th><th>Date</th></tr></thead>
          <tbody>
            {grns.map(g => (
              <tr key={g.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{g.grnId}</td>
                <td className="font-semibold text-zinc-200">{g.supplier}</td>
                <td>{g.yarn}</td>
                <td className="text-zinc-400">{g.colour}</td>
                <td className="font-bold text-emerald-400">+{g.qty?.toLocaleString()}</td>
                <td className="text-zinc-300">{g.bags}</td>
                <td className="font-mono text-xs text-zinc-400">{g.challan}</td>
                <td className="font-mono text-xs text-zinc-400">{g.vehicle}</td>
                <td className="text-zinc-400 text-xs">{formatDate(g.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Gate Entry / GRN" size="lg">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const data = Object.fromEntries(fd.entries())
          try {
            const grnId = `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
            const qtyNum = Number(data.qty) || 0
            await createGateEntryMutation.mutateAsync({
              grnId,
              supplier: data.supplier,
              yarn: data.yarn,
              colour: data.colour || 'White',
              lotBatch: data.lotBatch || `LOT-${Date.now().toString().slice(-4)}`,
              qty: qtyNum,
              bags: Number(data.bags) || 1,
              challan: data.challan || `CH-${Math.floor(1000 + Math.random() * 9000)}`,
              vehicle: data.vehicle || 'GJ-05-AB-1234',
              notes: data.notes || '',
            })
            await refetchGRNs()
            showToast(`GRN ${grnId} created! Added +${qtyNum} kg to inventory stock.`)
            setShowAdd(false)
          } catch (err) {
            console.error('Failed to create Gate Entry', err)
            showToast('Failed to create GRN: ' + (err?.message || err), 'error')
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Supplier</label>
              <select name="supplier" className="input" required>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="label">Yarn Type</label><input name="yarn" className="input" required /></div>
            <div><label className="label">Colour</label><input name="colour" className="input" required /></div>
            <div><label className="label">Lot / Batch</label><input name="lotBatch" className="input" /></div>
            <div><label className="label">Quantity (kg)</label><input name="qty" className="input" type="number" required /></div>
            <div><label className="label">Bags / Cones</label><input name="bags" className="input" type="number" required /></div>
            <div><label className="label">Challan Number</label><input name="challan" className="input" required /></div>
            <div><label className="label">Vehicle Number</label><input name="vehicle" className="input" required /></div>
            <div className="col-span-2"><label className="label">Notes</label><textarea name="notes" className="input" rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createGateEntryMutation.isPending}><Package size={14} />Save GRN</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
