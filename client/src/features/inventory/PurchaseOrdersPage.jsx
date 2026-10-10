import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { Modal }      from '../../components/ui/Modal'
import { formatDate, formatCurrencyFull } from '../../lib/utils'

const mockPOs = [
  { id:'PO-2026-018', supplier:'Agarwal Yarns Pvt Ltd', yarn:'Cotton 60s',  qty:600,  rate:340,  total:204000, expected:'2026-10-18', status:'RAISED'              },
  { id:'PO-2026-017', supplier:'Bharat Silk House',      yarn:'Silk 2/120D', qty:100,  rate:2200, total:220000, expected:'2026-10-15', status:'PARTIALLY_RECEIVED'   },
  { id:'PO-2026-016', supplier:'Krishna Fibers',          yarn:'Linen 20s',  qty:400,  rate:480,  total:192000, expected:'2026-10-10', status:'RECEIVED'             },
]

export default function PurchaseOrdersPage() {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="page-root">
      <PageHeader title="Purchase Orders" subtitle="Yarn and material procurement"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />New PO</button>}
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>PO ID</th><th>Supplier</th><th>Yarn</th><th>Qty</th><th>Rate</th><th>Total</th><th>Expected</th><th>Status</th></tr></thead>
          <tbody>
            {mockPOs.map(p => (
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
          <div><label className="label">Supplier</label><select className="input"><option>Agarwal Yarns Pvt Ltd</option></select></div>
          <div><label className="label">Yarn Type</label><select className="input"><option>Cotton 60s</option></select></div>
          <div><label className="label">Quantity (kg)</label><input className="input" type="number" /></div>
          <div><label className="label">Rate per kg (₹)</label><input className="input" type="number" /></div>
          <div><label className="label">Expected Date</label><input className="input" type="date" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn-primary">Raise PO</button>
        </div>
      </Modal>
    </div>
  )
}
