import { useState } from 'react'
import { Plus, Search, ArrowUpRight } from 'lucide-react'
import { Badge }      from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { mockOrders } from '../../mocks/data'
import { formatDate } from '../../lib/utils'
import { exportPDF, exportExcel } from '../../lib/exportUtils'
import { cn } from '../../lib/utils'

const STATUSES = ['ALL','CONFIRMED','IN_PRODUCTION','QUALITY_CHECK','READY_TO_SHIP','DISPATCHED']
const COLUMNS  = ['Order', 'Buyer', 'Fabric', 'Colour', 'Qty (m)', 'Deadline', 'Progress %', 'Status']

function buildRows(orders) {
  return orders.map(o => [
    o.id, o.buyer, o.fabric, o.colour, o.qty, formatDate(o.deadline), `${o.progress}%`, o.status,
  ])
}

export default function OrdersPage() {
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState('ALL')
  const [showAdd, setShowAdd] = useState(false)

  const filtered = mockOrders.filter(o => {
    const matchS = o.id.toLowerCase().includes(search.toLowerCase()) ||
                   o.buyer.toLowerCase().includes(search.toLowerCase()) ||
                   o.fabric.toLowerCase().includes(search.toLowerCase())
    return matchS && (tab === 'ALL' || o.status === tab)
  })

  const handleExportPDF = () => exportPDF({
    title: 'Orders', subtitle: tab === 'ALL' ? 'All orders' : tab.replace(/_/g, ' '),
    columns: COLUMNS, rows: buildRows(filtered), filename: 'Orders',
  })
  const handleExportExcel = () => exportExcel({
    filename: 'Orders', sheetName: 'Orders', columns: COLUMNS, rows: buildRows(filtered),
  })

  return (
    <div className="page-root">
      <PageHeader
        title="Orders"
        subtitle={`${mockOrders.length} total orders`}
        actions={
          <div className="flex gap-2">
            <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
            <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />New Order</button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input className="input-sm pl-8 w-56" placeholder="Search orders, buyers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setTab(s)}
              className={cn('btn-secondary btn-sm !px-3',
                tab === s && 'bg-primary-500/15 border-primary-500/50 text-primary-300'
              )}>
              {s === 'ALL' ? 'All' : s.replace(/_/g,' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table-base">
          <thead><tr>
            <th>Order</th><th>Buyer</th><th>Fabric</th><th>Colour</th>
            <th>Qty</th><th>Deadline</th><th>Progress</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map(o => {
              const overdue = !['DISPATCHED','CLOSED'].includes(o.status) && new Date(o.deadline) < new Date()
              return (
                <tr key={o.id}>
                  <td className="font-mono text-xs text-primary-400 font-semibold">{o.id}</td>
                  <td className="font-semibold text-zinc-200">{o.buyer}</td>
                  <td className="text-zinc-400">{o.fabric}</td>
                  <td className="text-zinc-500">{o.colour}</td>
                  <td className="font-mono text-xs text-zinc-300">{o.qty.toLocaleString()} m</td>
                  <td className={cn('text-xs', overdue ? 'text-red-400 font-semibold' : 'text-zinc-400')}>
                    {formatDate(o.deadline)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2 min-w-[110px]">
                      <div className="progress-track flex-1">
                        <div className="progress-fill" style={{ width: `${o.progress}%` }} />
                      </div>
                      <span className="text-2xs text-zinc-600 font-mono w-7 text-right">{o.progress}%</span>
                    </div>
                  </td>
                  <td><Badge status={o.status} /></td>
                  <td>
                    <button className="btn-ghost btn-xs text-primary-400 gap-1">
                      View <ArrowUpRight size={10} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Order" description="Create a new fabric production order" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Buyer</label>
            <select className="input"><option>Sharma Fabrics</option><option>Mehta Textiles</option><option>Patel Exports</option></select>
          </div>
          <div><label className="label">Fabric Type</label>
            <select className="input"><option>Cotton Voile</option><option>Linen Blend</option><option>Silk Chiffon</option><option>Denim</option></select>
          </div>
          <div><label className="label">Colour</label><input className="input" placeholder="Sky Blue" /></div>
          <div><label className="label">Quantity (metres)</label><input className="input" type="number" placeholder="1000" /></div>
          <div><label className="label">Rate per Metre (₹)</label><input className="input" type="number" placeholder="85" /></div>
          <div><label className="label">Deadline</label><input className="input" type="date" /></div>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn-primary">Create Order</button>
        </div>
      </Modal>
    </div>
  )
}
