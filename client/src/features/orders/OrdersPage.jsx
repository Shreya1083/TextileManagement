import { useState } from 'react'
import { Plus, Search, ArrowUpRight } from 'lucide-react'
import { Badge }      from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { useOrders, useCreateOrder, useUpdateOrder, useBuyers, useStock, useBOMs, useSettings } from '../../hooks/useAPI'
import { formatDate, formatCurrencyFull } from '../../lib/utils'
import { exportPDF, exportExcel } from '../../lib/exportUtils'
import { cn } from '../../lib/utils'

const STATUSES = ['ALL','CONFIRMED','IN_PRODUCTION','QUALITY_CHECK','READY_TO_SHIP','DISPATCHED']
const COLUMNS  = ['Order', 'Buyer', 'Fabric', 'Colour', 'Qty (m)', 'Deadline', 'Progress %', 'Status']

function buildRows(orders) {
  return orders.map(o => [
    o.orderNumber, o.customer?.name || 'Unknown', o.fabric, o.color, o.quantity, formatDate(o.deadline), `${o.progress}%`, o.status,
  ])
}

export default function OrdersPage() {
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState('ALL')
  const [showAdd, setShowAdd]     = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Fetch orders
  const { data: ordersData, isLoading, error } = useOrders()
  const allOrders = ordersData?.data || []

  const { data: buyersData } = useBuyers()
  const buyers = buyersData?.data || []

  const { data: stockData } = useStock()
  const inventory = stockData?.data || []
  
  const { data: bomsData } = useBOMs()
  const boms = bomsData?.data || []

  const { data: settingsData } = useSettings()

  const [orderFabric, setOrderFabric] = useState('Cotton Voile')
  const [orderColor, setOrderColor] = useState('')
  const [orderQty, setOrderQty] = useState('')

  const createOrderMutation = useCreateOrder()

  const filtered = allOrders.filter(o => {
    const matchS = o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
                   o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
                   o.fabric?.toLowerCase().includes(search.toLowerCase())
    return matchS && (tab === 'ALL' || o.status === tab)
  })

  const handleExportPDF = () => exportPDF({
    title: 'Orders', subtitle: tab === 'ALL' ? 'All orders' : tab.replace(/_/g, ' '),
    columns: COLUMNS, rows: buildRows(filtered), filename: 'Orders',
  })
  const handleExportExcel = () => exportExcel({
    filename: 'Orders', sheetName: 'Orders', columns: COLUMNS, rows: buildRows(filtered),
  })

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="Orders"
        subtitle={`${allOrders.length} total orders`}
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
                  <td className="font-mono text-xs text-primary-400 font-semibold">{o.orderNumber}</td>
                  <td className="font-semibold text-zinc-200">{o.customer?.name}</td>
                  <td className="text-zinc-400">{o.fabric}</td>
                  <td className="text-zinc-500">{o.color}</td>
                  <td className="font-mono text-xs text-zinc-300">{o.quantity?.toLocaleString()} m</td>
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
                    <button
                      className="btn-ghost btn-xs text-primary-400 gap-1 hover:text-primary-300"
                      onClick={() => setSelectedOrder(o)}
                    >
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
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const data = Object.fromEntries(fd.entries())
          try {
            await createOrderMutation.mutateAsync({
              orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              customerId: data.buyerId,
              fabric: orderFabric,
              color: orderColor,
              quantity: Math.round(Number(orderQty)),
              rate: Number(data.rate) || 85,
              deadline: new Date(data.deadline).toISOString(),
              status: 'CONFIRMED',
              progress: 0
            })
            setShowAdd(false)
            setOrderColor('')
            setOrderQty('')
          } catch (err) {
            console.error('Failed to create order', err)
            alert('Failed to create order: ' + (err?.message || err))
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Buyer <span className="text-red-400">*</span></label>
              <select name="buyerId" className="input" required defaultValue="">
                <option value="" disabled>Select Buyer...</option>
                {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div><label className="label">Fabric Type</label>
              <select name="fabric" className="input" value={orderFabric} onChange={(e) => setOrderFabric(e.target.value)}>
                {(settingsData?.data?.fabrics || ['Cotton Voile','Linen Blend','Silk Chiffon','Denim','Cotton 40s']).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Colour <span className="text-red-400">*</span></label>
              <input name="color" className="input" placeholder="e.g. Sky Blue" required value={orderColor} onChange={e => setOrderColor(e.target.value)} />
            </div>
            <div>
              <label className="label">Quantity (metres) <span className="text-red-400">*</span></label>
              <input name="quantity" className="input" type="number" placeholder="1000" required value={orderQty} onChange={e => setOrderQty(e.target.value)} />
            </div>
            
            {/* Yarn Availability Check with BOMs */}
            {orderColor && orderQty && (
              <div className="col-span-2 p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-xl space-y-2">
                <p className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <Search size={12} className="text-primary-400" />
                  BOM Material Check
                </p>
                {(() => {
                  const bom = boms.find(b => b.fabric?.toLowerCase() === orderFabric?.toLowerCase() && b.color?.toLowerCase() === orderColor?.toLowerCase());
                  
                  if (!bom || !bom.items || bom.items.length === 0) {
                    const requiredYarn = Number(orderQty) * 0.4;
                    const matchingStock = inventory.filter(i => i.color?.toLowerCase().includes(orderColor.toLowerCase()));
                    const availableYarn = matchingStock.reduce((sum, item) => sum + (item.current - item.reserved), 0);
                    const isEnough = availableYarn >= requiredYarn;
                    return (
                      <div className="text-xs flex items-center justify-between">
                        <span className="text-zinc-500">
                          (No BOM found) Requires ~<span className="font-mono text-zinc-300">{requiredYarn.toFixed(1)} kg</span> of {orderColor} yarn.
                          Available: <span className="font-mono text-zinc-300">{availableYarn.toFixed(1)} kg</span>.
                        </span>
                        {isEnough ? (
                          <span className="text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg">✓ Sufficient Stock</span>
                        ) : (
                          <span className="text-amber-400 font-semibold px-2 py-1 bg-amber-500/10 rounded-lg">⚠️ Warning: Stock Low</span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {bom.items.map(bomItem => {
                        const requiredAmount = Number(orderQty) * bomItem.quantity;
                        const itemInStock = inventory.find(i => i.id === bomItem.inventoryId);
                        const available = itemInStock ? (itemInStock.current - itemInStock.reserved) : 0;
                        const isEnough = available >= requiredAmount;
                        
                        return (
                          <div key={bomItem.id} className="text-xs flex items-center justify-between py-1 border-b border-zinc-800/50 last:border-0">
                            <span className="text-zinc-500 flex gap-2">
                              <span><span className="text-zinc-300">{itemInStock?.type || itemInStock?.item || 'Item'}</span> ({itemInStock?.color})</span>
                              <span>Req: <span className="font-mono text-zinc-300">{requiredAmount.toFixed(1)}</span></span>
                              <span>Avail: <span className="font-mono text-zinc-300">{available.toFixed(1)}</span></span>
                            </span>
                            {isEnough ? (
                              <span className="text-emerald-400 font-semibold text-[10px]">✓ OK</span>
                            ) : (
                              <span className="text-red-400 font-semibold text-[10px]">⚠️ SHORTAGE</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            <div><label className="label">Rate per Metre (₹)</label><input name="rate" className="input" type="number" defaultValue="85" placeholder="85" /></div>
            <div>
              <label className="label">Deadline <span className="text-red-400">*</span></label>
              <input name="deadline" className="input" type="date" required defaultValue={new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]} />
            </div>
            <div className="col-span-2"><label className="label">Notes</label><textarea name="notes" className="input" rows={2} placeholder="Export quality finishing requested..." /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createOrderMutation.isPending}>
              {createOrderMutation.isPending ? 'Saving...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Order Status View & Details ── */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order Details: ${selectedOrder?.orderNumber}`} size="lg">
        {selectedOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <span className="text-zinc-500">Buyer</span>
                <p className="font-semibold text-zinc-200 mt-0.5">{selectedOrder.customer?.name || 'Customer'}</p>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <span className="text-zinc-500">Fabric & Colour</span>
                <p className="font-semibold text-zinc-200 mt-0.5">{selectedOrder.fabric} · {selectedOrder.color}</p>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <span className="text-zinc-500">Quantity</span>
                <p className="font-semibold text-zinc-200 mt-0.5">{selectedOrder.quantity?.toLocaleString()} m</p>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <span className="text-zinc-500">Order Value</span>
                <p className="font-bold text-emerald-400 mt-0.5">{formatCurrencyFull((selectedOrder.quantity || 0) * (selectedOrder.rate || 85))}</p>
              </div>
            </div>

            {/* Production Progress Bar */}
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-semibold">Production Status & Progress</span>
                <span className="font-mono text-primary-400 font-bold">{selectedOrder.progress}% completed</span>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${selectedOrder.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-2xs text-zinc-500 pt-1">
                <span>Deadline: {formatDate(selectedOrder.deadline)}</span>
                <Badge status={selectedOrder.status} />
              </div>
            </div>

            {/* Status Update Pipeline */}
            <div>
              <label className="label">Update Order Status in Database</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
                {[
                  { key: 'CONFIRMED', pct: 0 },
                  { key: 'IN_PRODUCTION', pct: 40 },
                  { key: 'QUALITY_CHECK', pct: 75 },
                  { key: 'READY_TO_SHIP', pct: 90 },
                  { key: 'DISPATCHED', pct: 100 }
                ].map(({ key, pct }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={async () => {
                      try {
                        await updateOrderMutation.mutateAsync({
                          id: selectedOrder.id,
                          data: { status: key, progress: pct }
                        })
                        setSelectedOrder(prev => ({ ...prev, status: key, progress: pct }))
                      } catch (err) {
                        alert('Failed to update status: ' + (err?.message || err))
                      }
                    }}
                    className={`btn-sm text-xs rounded-xl border transition-all ${
                      selectedOrder.status === key
                        ? 'bg-primary-500/20 border-primary-500 text-primary-300 font-bold ring-1 ring-primary-500/50'
                        : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {key.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800/60">
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
