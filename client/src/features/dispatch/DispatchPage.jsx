import { useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { Modal }      from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import { useDispatches, useCreateDispatch, useCreateInvoice, useBuyers, useOrders } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

export default function DispatchPage() {
  const [showAdd, setShowAdd] = useState(false)
  const { data: dispatchesData, isLoading, error } = useDispatches()
  const dispatches = dispatchesData?.data || []
  
  const { data: buyersData } = useBuyers()
  const buyers = buyersData?.data || []
  
  const { data: ordersData } = useOrders()
  const orders = ordersData?.data || []

  const createDispatchMutation = useCreateDispatch()
  const createInvoiceMutation = useCreateInvoice()

  const handleCreateInvoice = async (d) => {
    try {
      await createInvoiceMutation.mutateAsync({
        invoiceId: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        buyer: d.buyer,
        dispatch: d.dispatchId,
        amount: d.metres * 85, // Dummy rate
        paid: 0,
        balance: d.metres * 85,
        status: 'UNPAID',
        date: new Date().toISOString()
      })
      alert('Invoice created successfully!')
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader title="Dispatches" subtitle="Shipment records and packing lists"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />Create Dispatch</button>}
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
                    <button className="btn-ghost btn-xs text-primary-400">View</button>
                    <button className="btn-ghost btn-xs text-zinc-500" onClick={() => handleCreateInvoice(d)}>Invoice</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Dispatch" size="lg">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const data = Object.fromEntries(fd.entries())
          try {
            await createDispatchMutation.mutateAsync({
              dispatchId: `DSP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
              buyer: data.buyer,
              order: data.order,
              rolls: Number(data.rolls),
              metres: Number(data.metres),
              vehicle: data.vehicle,
              driver: data.driver,
              date: new Date(data.date).toISOString(),
              status: 'IN_TRANSIT'
            })
            setShowAdd(false)
          } catch (err) {
            console.error('Failed to create Dispatch', err)
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Buyer</label>
              <select name="buyer" className="input" required>
                <option value="">Select Buyer...</option>
                {buyers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div><label className="label">Order</label>
              <select name="order" className="input" required>
                <option value="">Select Order...</option>
                {orders.map(o => <option key={o.id} value={o.orderNumber}>{o.orderNumber}</option>)}
              </select>
            </div>
            <div><label className="label">Total Rolls</label><input name="rolls" className="input" type="number" required /></div>
            <div><label className="label">Total Metres</label><input name="metres" className="input" type="number" required /></div>
            <div><label className="label">Vehicle Number</label><input name="vehicle" className="input" required /></div>
            <div><label className="label">Driver Name</label><input name="driver" className="input" /></div>
            <div><label className="label">Date</label><input name="date" className="input" type="date" required /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createDispatchMutation.isPending}><Truck size={14} />Confirm Dispatch</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
