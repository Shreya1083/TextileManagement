import { useState } from 'react'
import { Search, AlertTriangle, Plus, Edit2, Package, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge }      from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { useAuth }    from '../../context/AuthContext'
import { useStock, useSuppliers, useCreateGateEntry, useUpdateStockItem } from '../../hooks/useAPI'
import { exportPDF, exportExcel } from '../../lib/exportUtils'
import { cn } from '../../lib/utils'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const COLUMNS = ['Yarn Type', 'Colour', 'Current', 'Reserved', 'Available', 'Reorder Level', 'Unit', 'Status']

function buildRows(stock) {
  return stock.map(y => [
    y.type, y.color, y.current, y.reserved, y.current - y.reserved, y.reorder, y.unit, y.status,
  ])
}

function StockBar({ current, reserved, reorder }) {
  const available = current - reserved
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', available <= 0 ? 'bg-red-500' : available < reorder ? 'bg-amber-500' : 'bg-emerald-500')}
          style={{ width: `${Math.min(100, Math.max(5, (available / (reorder * 2 || 100)) * 100))}%` }}
        />
      </div>
    </div>
  )
}

export default function StockPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [showAddGRN, setShowAddGRN] = useState(false)
  const [editItem, setEditItem] = useState(null)
  
  const { data: stockData, isLoading, error } = useStock()
  const allStock = stockData?.data || []

  const { data: suppliersData } = useSuppliers()
  const suppliers = suppliersData?.data || []

  const createGateEntryMutation = useCreateGateEntry()
  const updateStockMutation = useUpdateStockItem()
  
  const filtered = allStock.filter(y =>
    y.type?.toLowerCase().includes(search.toLowerCase()) ||
    y.color?.toLowerCase().includes(search.toLowerCase())
  )
  const lowCount = allStock.filter(y => y.status !== 'OK').length

  const handleExportPDF = () => exportPDF({
    title: 'Stock Levels', subtitle: 'Current, reserved and available yarn inventory',
    columns: COLUMNS, rows: buildRows(filtered), filename: 'YarnStock',
  })
  const handleExportExcel = () => exportExcel({
    filename: 'YarnStock', sheetName: 'Stock', columns: COLUMNS, rows: buildRows(filtered),
  })

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="Stock Levels"
        subtitle={`Managed by ${user?.name} · Current, reserved and available yarn inventory`}
        actions={
          <div className="flex gap-2">
            <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
            <Link to="/inventory/gate-entries" className="btn-secondary btn-sm gap-1">
              View GRNs <ArrowRight size={13} />
            </Link>
            <button className="btn-primary btn-sm gap-1.5" onClick={() => setShowAddGRN(true)}>
              <Plus size={14} />Add GRN
            </button>
          </div>
        }
      />

      {lowCount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={14} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-300">{lowCount} items below reorder level</p>
            <p className="text-xs text-amber-500/80 mt-0.5">Raise purchase orders or add incoming GRN to avoid production delays.</p>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <div className="table-head">
          <p className="section-title">Yarn Inventory <span className="text-zinc-600 font-normal text-xs ml-1">{filtered.length} items</span></p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input className="input-sm pl-8 w-48" placeholder="Search yarn…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table className="table-base">
          <thead><tr>
            <th>Yarn Type</th><th>Colour</th><th>Current</th>
            <th>Reserved</th><th>Available</th><th>Reorder Level</th><th>Availability</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map(y => {
              const available = y.current - y.reserved
              return (
                <tr key={y.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="font-semibold text-zinc-200">{y.type}</td>
                  <td className="text-zinc-400">{y.color}</td>
                  <td className="font-mono text-xs text-zinc-300 font-bold">{y.current.toLocaleString()} {y.unit}</td>
                  <td className="font-mono text-xs text-amber-400">{y.reserved.toLocaleString()}</td>
                  <td className={cn('font-mono text-xs font-bold', available <= 0 ? 'text-red-400' : available < y.reorder ? 'text-amber-400' : 'text-emerald-400')}>
                    {available.toLocaleString()}
                  </td>
                  <td className="font-mono text-xs text-zinc-500">{y.reorder.toLocaleString()}</td>
                  <td><StockBar current={y.current} reserved={y.reserved} reorder={y.reorder} /></td>
                  <td><Badge status={y.status} /></td>
                  <td className="text-right">
                    <button
                      className="btn-ghost btn-xs text-primary-400 gap-1 hover:text-primary-300"
                      onClick={() => setEditItem(y)}
                      title="Edit stock or status"
                    >
                      <Edit2 size={12} /> Edit Status
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Add GRN ── */}
      <Modal open={showAddGRN} onClose={() => setShowAddGRN(false)} title="Add Goods Receipt Note (GRN)" size="lg">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const data = Object.fromEntries(fd.entries())
          try {
            await createGateEntryMutation.mutateAsync({
              grnId: `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              supplier: data.supplier,
              yarn: data.yarn,
              colour: data.colour,
              lotBatch: data.lotBatch || `LOT-${Date.now().toString().slice(-4)}`,
              qty: Number(data.qty),
              bags: Number(data.bags) || 1,
              challan: data.challan || `CH-${Math.floor(1000 + Math.random() * 9000)}`,
              vehicle: data.vehicle || 'GJ-05-AB-1234',
              notes: data.notes || '',
            })
            setShowAddGRN(false)
          } catch (err) {
            console.error('Failed to create GRN:', err)
            alert('Failed to add GRN: ' + (err?.message || err))
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Supplier</label>
              <select name="supplier" className="input" required defaultValue="">
                <option value="" disabled>Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name} ({s.city})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Yarn Stock Item</label>
              <select
                name="yarn"
                className="input"
                required
                onChange={e => {
                  const sel = allStock.find(s => s.type === e.target.value)
                  const colInput = document.getElementById('grn_color_input')
                  if (sel && colInput) colInput.value = sel.color
                }}
              >
                <option value="" disabled>Select or Match Yarn...</option>
                {allStock.map(s => <option key={s.id} value={s.type}>{s.type} ({s.color})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Colour</label>
              <input id="grn_color_input" name="colour" className="input" required placeholder="White / Raw / Dyed" />
            </div>
            <div>
              <label className="label">Quantity Received (kg)</label>
              <input name="qty" className="input" type="number" step="any" required placeholder="e.g. 500" />
            </div>
            <div>
              <label className="label">Bags / Cartons</label>
              <input name="bags" className="input" type="number" defaultValue="10" required />
            </div>
            <div>
              <label className="label">Challan / Invoice No.</label>
              <input name="challan" className="input" required placeholder="e.g. CH-2026-99" />
            </div>
            <div>
              <label className="label">Vehicle No.</label>
              <input name="vehicle" className="input" required placeholder="e.g. GJ-05-XY-8822" />
            </div>
            <div>
              <label className="label">Lot / Batch No.</label>
              <input name="lotBatch" className="input" placeholder="e.g. LOT-40S-09" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes / Storage Rack</label>
              <textarea name="notes" className="input" rows={2} placeholder="Stored in Bay-3, Rack A2..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowAddGRN(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createGateEntryMutation.isPending}>
              <Package size={14} />
              {createGateEntryMutation.isPending ? 'Adding GRN...' : 'Save GRN & Update Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Edit Stock Item / Status ── */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={`Edit Stock: ${editItem?.type} (${editItem?.color})`} size="md">
        {editItem && (
          <form onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.target)
            const current = Number(fd.get('current'))
            const reserved = Number(fd.get('reserved'))
            const reorder = Number(fd.get('reorder'))
            const status = fd.get('status')
            try {
              await updateStockMutation.mutateAsync({
                id: editItem.id,
                current,
                reserved,
                reorder,
                status
              })
              setEditItem(null)
            } catch (err) {
              alert('Failed to update stock: ' + (err?.message || err))
            }
          }}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Current Stock ({editItem.unit})</label>
                  <input name="current" className="input font-mono" type="number" defaultValue={editItem.current} required />
                </div>
                <div>
                  <label className="label">Reserved ({editItem.unit})</label>
                  <input name="reserved" className="input font-mono" type="number" defaultValue={editItem.reserved} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Reorder Level ({editItem.unit})</label>
                  <input name="reorder" className="input font-mono" type="number" defaultValue={editItem.reorder} required />
                </div>
                <div>
                  <label className="label">Inventory Status</label>
                  <select name="status" className="input" defaultValue={editItem.status}>
                    <option value="OK">OK (In Stock)</option>
                    <option value="LOW">LOW (Below Reorder)</option>
                    <option value="OUT">OUT (Out of Stock)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800/60">
                <button type="button" className="btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={updateStockMutation.isPending}>
                  <CheckCircle2 size={14} />
                  {updateStockMutation.isPending ? 'Saving...' : 'Save Stock Status'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
