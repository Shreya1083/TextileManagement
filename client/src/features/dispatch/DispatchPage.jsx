import { useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { Modal }      from '../../components/ui/Modal'
import { mockDispatches } from '../../mocks/data'
import { formatDate } from '../../lib/utils'

export default function DispatchPage() {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="page-root">
      <PageHeader title="Dispatches" subtitle="Shipment records and packing lists"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />Create Dispatch</button>}
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Dispatch ID</th><th>Buyer</th><th>Order</th><th>Rolls</th><th>Metres</th><th>Date</th><th>Vehicle</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {mockDispatches.map(d => (
              <tr key={d.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{d.id}</td>
                <td className="font-semibold text-zinc-200">{d.buyer}</td>
                <td className="font-mono text-xs text-zinc-400">{d.order}</td>
                <td className="text-zinc-300">{d.rolls}</td>
                <td className="font-semibold text-zinc-200">{d.metres} m</td>
                <td className="text-zinc-400 text-xs">{formatDate(d.date)}</td>
                <td className="font-mono text-xs text-zinc-400">{d.vehicle}</td>
                <td><Badge status={d.status} /></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-ghost btn-xs text-primary-400">View</button>
                    <button className="btn-ghost btn-xs text-zinc-500">Invoice</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Dispatch" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Buyer</label><select className="input"><option>Patel Exports</option></select></div>
          <div><label className="label">Order</label><select className="input"><option>ORD-2024</option></select></div>
          <div className="col-span-2">
            <label className="label">Select Rolls (Passed & Available)</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
              {['EVR-2026-000185','EVR-2026-000183'].map(id => (
                <label key={id} className="flex items-center gap-3 p-2.5 bg-zinc-800/60 rounded-xl cursor-pointer hover:bg-zinc-700/50">
                  <input type="checkbox" className="rounded" />
                  <span className="font-mono text-xs text-primary-400">{id}</span>
                  <span className="badge badge-green ml-auto">PASSED</span>
                </label>
              ))}
            </div>
          </div>
          <div><label className="label">Vehicle Number</label><input className="input" /></div>
          <div><label className="label">Driver Name</label><input className="input" /></div>
          <div><label className="label">Date</label><input className="input" type="date" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn-primary"><Truck size={14} />Confirm Dispatch</button>
        </div>
      </Modal>
    </div>
  )
}
