import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

const mockGRNs = [
  { id:'GRN-2026-042', supplier:'Agarwal Yarns Pvt Ltd', yarn:'Cotton 40s',  colour:'White',   qty:500,  bags:10, challan:'CH-8821', vehicle:'GJ05AB1234', date:'2026-10-08' },
  { id:'GRN-2026-041', supplier:'Krishna Fibers',         yarn:'Poly 150D',   colour:'Natural', qty:800,  bags:16, challan:'CH-7734', vehicle:'MH02CD5678', date:'2026-10-06' },
  { id:'GRN-2026-040', supplier:'Rajasthan Denim Supply', yarn:'Denim 7oz',   colour:'Indigo',  qty:2100, bags:21, challan:'CH-5529', vehicle:'RJ14EF9012', date:'2026-10-03' },
]

export default function GateEntryPage() {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="page-root">
      <PageHeader title="Gate Entry / GRN" subtitle="Goods Receipt Notes — yarn and material inward"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />New GRN</button>}
      />
      <div className="table-wrap">
        <div className="table-head"><p className="section-title">Recent GRNs</p></div>
        <table className="table-base">
          <thead><tr><th>GRN ID</th><th>Supplier</th><th>Yarn Type</th><th>Colour</th><th>Qty</th><th>Bags</th><th>Challan</th><th>Vehicle</th><th>Date</th></tr></thead>
          <tbody>
            {mockGRNs.map(g => (
              <tr key={g.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{g.id}</td>
                <td className="font-semibold text-zinc-200">{g.supplier}</td>
                <td>{g.yarn}</td>
                <td className="text-zinc-400">{g.colour}</td>
                <td className="font-bold text-emerald-400">+{g.qty.toLocaleString()}</td>
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
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Supplier</label><select className="input"><option>Agarwal Yarns Pvt Ltd</option><option>Krishna Fibers</option></select></div>
          <div><label className="label">Yarn Type</label><select className="input"><option>Cotton 40s</option><option>Poly 150D</option></select></div>
          <div><label className="label">Colour</label><input className="input" /></div>
          <div><label className="label">Lot / Batch</label><input className="input" /></div>
          <div><label className="label">Quantity (kg)</label><input className="input" type="number" /></div>
          <div><label className="label">Bags / Cones</label><input className="input" type="number" /></div>
          <div><label className="label">Challan Number</label><input className="input" /></div>
          <div><label className="label">Vehicle Number</label><input className="input" /></div>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn-primary"><Package size={14} />Save GRN</button>
        </div>
      </Modal>
    </div>
  )
}
