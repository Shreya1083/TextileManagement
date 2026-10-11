import { useState } from 'react'
import { Plus, Search, ArrowUpRight } from 'lucide-react'
import { Badge }      from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { useToast }   from '../../components/ui/Toast'
import { mockOrders } from '../../mocks/data'
import { formatDate, cn } from '../../lib/utils'
import { exportPDF, exportExcel } from '../../lib/exportUtils'

const STATUSES = ['ALL','CONFIRMED','IN_PRODUCTION','QUALITY_CHECK','READY_TO_SHIP','DISPATCHED']
const COLUMNS  = ['Order', 'Buyer', 'Fabric', 'Colour', 'Qty (m)', 'Deadline', 'Progress %', 'Status']
const BLANK    = { buyer:'Sharma Fabrics', fabric:'Cotton Voile', colour:'', qty:'', rate:'', deadline:'', notes:'' }

function buildRows(orders) {
  return orders.map(o => [o.id, o.buyer, o.fabric, o.colour, o.qty, formatDate(o.deadline), `${o.progress}%`, o.status])
}

export default function OrdersPage() {
  const toast = useToast()
  const [orders, setOrders]       = useState(mockOrders)
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState('ALL')
  const [showAdd, setShowAdd]     = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const [form, setForm]           = useState(BLANK)
  const [errors, setErrors]       = useState({})

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const filtered = orders.filter(o => {
    const m = o.id.toLowerCase().includes(search.toLowerCase()) ||
              o.buyer.toLowerCase().includes(search.toLowerCase()) ||
              o.fabric.toLowerCase().includes(search.toLowerCase())
    return m && (tab === 'ALL' || o.status === tab)
  })

  const validate = () => {
    const e = {}
    if (!form.colour.trim())                              e.colour   = 'Required'
    if (!form.qty || isNaN(form.qty) || +form.qty <= 0)  e.qty      = 'Enter valid qty'
    if (!form.deadline)                                   e.deadline = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleCreate = () => {
    if (!validate()) return
    const nextNum = Math.max(...orders.map(o => parseInt(o.id.replace('ORD-','')))) + 1
    const newOrder = {
      id:       `ORD-${nextNum}`,
      buyer:    form.buyer,
      fabric:   form.fabric,
      colour:   form.colour.trim(),
      qty:      Number(form.qty),
      status:   'CONFIRMED',
      deadline: form.deadline,
      progress: 0,
    }
    setOrders(p => [newOrder, ...p])
    setShowAdd(false)
    toast(`Order ${newOrder.id} created`, 'success')
  }

  const handleExportPDF = () => exportPDF({ title:'Orders', subtitle: tab === 'ALL' ? 'All orders' : tab.replace(/_/g,' '), columns:COLUMNS, rows:buildRows(filtered), filename:'Orders' })
  const handleExportExcel = () => exportExcel({ filename:'Orders', sheetName:'Orders', columns:COLUMNS, rows:buildRows(filtered) })

  return (
    <div className="page-root">
      <PageHeader title="Orders" subtitle={`${orders.length} total orders`}
        actions={
          <div className="flex gap-2">
            <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
            <button className="btn-primary btn-sm" onClick={() => { setForm(BLANK); setErrors({}); setShowAdd(true) }}>
              <Plus size={14} />New Order
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input className="input-sm pl-8 w-56" placeholder="Search orders, buyers…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={()=>setTab(s)}
              className={cn('btn-secondary btn-sm !px-3', tab===s && 'bg-primary-500/15 border-primary-500/50 text-primary-300')}>
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
                  <td className={cn('text-xs', overdue ? 'text-red-400 font-semibold' : 'text-zinc-400')}>{formatDate(o.deadline)}</td>
                  <td>
                    <div className="flex items-center gap-2 min-w-[110px]">
                      <div className="progress-track flex-1">
                        <div className="progress-fill" style={{ width:`${o.progress}%` }} />
                      </div>
                      <span className="text-2xs text-zinc-600 font-mono w-7 text-right">{o.progress}%</span>
                    </div>
                  </td>
                  <td><Badge status={o.status} /></td>
                  <td>
                    <button className="btn-ghost btn-xs text-primary-400 gap-1" onClick={() => setViewOrder(o)}>
                      View <ArrowUpRight size={10} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* New Order Modal */}
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="New Order" description="Create a new fabric production order" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Buyer</label>
            <select className="input" value={form.buyer} onChange={e=>set('buyer',e.target.value)}>
              <option>Sharma Fabrics</option><option>Mehta Textiles</option><option>Patel Exports</option>
              <option>Global Garments</option><option>Sunrise Mills</option><option>Kapoor Garments</option>
            </select>
          </div>
          <div>
            <label className="label">Fabric Type</label>
            <select className="input" value={form.fabric} onChange={e=>set('fabric',e.target.value)}>
              <option>Cotton Voile</option><option>Linen Blend</option><option>Silk Chiffon</option>
              <option>Denim</option><option>Poly Cotton</option><option>Cotton Poplin</option>
            </select>
          </div>
          <div>
            <label className="label">Colour</label>
            <input className={`input ${errors.colour?'border-red-500':''}`} value={form.colour} onChange={e=>set('colour',e.target.value)} placeholder="Sky Blue" />
            {errors.colour && <p className="text-xs text-red-400 mt-1">{errors.colour}</p>}
          </div>
          <div>
            <label className="label">Quantity (metres)</label>
            <input className={`input ${errors.qty?'border-red-500':''}`} type="number" value={form.qty} onChange={e=>set('qty',e.target.value)} placeholder="1000" />
            {errors.qty && <p className="text-xs text-red-400 mt-1">{errors.qty}</p>}
          </div>
          <div>
            <label className="label">Rate per Metre (₹)</label>
            <input className="input" type="number" value={form.rate} onChange={e=>set('rate',e.target.value)} placeholder="85" />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input className={`input ${errors.deadline?'border-red-500':''}`} type="date" value={form.deadline} onChange={e=>set('deadline',e.target.value)} />
            {errors.deadline && <p className="text-xs text-red-400 mt-1">{errors.deadline}</p>}
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate}>Create Order</button>
        </div>
      </Modal>

      {/* View Order Modal */}
      <Modal open={!!viewOrder} onClose={()=>setViewOrder(null)} title={viewOrder?.id} description={`${viewOrder?.buyer} · ${viewOrder?.fabric}`} size="sm">
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['Colour',viewOrder.colour],['Quantity',`${viewOrder.qty.toLocaleString()} m`],['Deadline',formatDate(viewOrder.deadline)],['Progress',`${viewOrder.progress}%`]].map(([l,v]) => (
                <div key={l} className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1">{l}</p>
                  <p className="text-sm font-bold text-zinc-100">{v}</p>
                </div>
              ))}
            </div>
            <Badge status={viewOrder.status} />
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-500">Production progress</span>
                <span className="font-mono text-zinc-300">{viewOrder.progress}%</span>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400" style={{ width:`${viewOrder.progress}%` }} />
              </div>
            </div>
            <button className="w-full btn-ghost btn-sm" onClick={()=>setViewOrder(null)}>Close</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
