<<<<<<< HEAD
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle, Plus } from 'lucide-react'
=======
import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Loader2, ArrowUpRight } from 'lucide-react'
>>>>>>> 97ed768d65e0702d2c6c46f110b1afc59861571f
import { Badge }      from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { useAuth }    from '../../context/AuthContext'
import { mockYarnStock } from '../../mocks/data'
import { exportPDF, exportExcel } from '../../lib/exportUtils'
import { cn, formatDate } from '../../lib/utils'
import api from '../../lib/api'

const COLUMNS = ['Yarn Type', 'Colour', 'Current', 'Reserved', 'Available', 'Reorder Level', 'Unit', 'Status']

function buildRows(stock) {
  return stock.map(y => [
    y.type, y.colour, y.current, y.reserved, y.current - y.reserved, y.reorder, y.unit, y.status,
  ])
}

function StockBar({ current, reserved, reorder }) {
  const available = current - reserved
  const safeReorder = reorder || 100
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            available <= 0 ? 'bg-red-500' : available < safeReorder ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          style={{ width: `${Math.min(100, Math.max(4, (available / (safeReorder * 2)) * 100))}%` }}
        />
      </div>
    </div>
  )
}

function computeStatus(available, reorder) {
  if (available <= 0) return 'OUT'
  if (available < reorder) return 'LOW'
  return 'OK'
}

function normalizeStockItem(item) {
  const yt = item.yarnType || {}
  const current = Number(item.totalQuantity || 0)
  const reserved = Number(item.reservedQuantity || 0)
  const available = Number(item.availableQuantity !== undefined ? item.availableQuantity : current - reserved)
  const reorder = Number(yt.reorderLevel || 100)
  return {
    id: yt.id || item.id,
    type: yt.name || 'Unknown Yarn',
    colour: yt.color || 'Natural',
    current,
    reserved,
    available,
    reorder,
    unit: yt.unit || 'kg',
    status: computeStatus(available, reorder),
    batches: item.batches || [],
  }
}

const BLANK_GRN = {
  supplierId: '',
  poId: '',
  yarnTypeId: '',
  lotNumber: '',
  quantity: '',
  bags: '',
  cones: '',
  rate: '',
  challan: '',
  vehicle: '',
  receivedDate: new Date().toISOString().split('T')[0],
}

export default function StockPage() {
  const { user } = useAuth()
<<<<<<< HEAD
  const navigate = useNavigate()
=======
  const toast = useToast()

  const [stock, setStock] = useState(() => mockYarnStock.map(y => ({
    ...y,
    available: y.current - y.reserved,
  })))
  const [loadingStock, setLoadingStock] = useState(false)
>>>>>>> 97ed768d65e0702d2c6c46f110b1afc59861571f
  const [search, setSearch] = useState('')

  // Metadata for GRN form
  const [suppliers, setSuppliers] = useState([])
  const [yarnTypes, setYarnTypes] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])

  // GRN Dialog State
  const [showAddGrn, setShowAddGrn] = useState(false)
  const [grnForm, setGrnForm] = useState(BLANK_GRN)
  const [grnErrors, setGrnErrors] = useState({})
  const [grnSubmitting, setGrnSubmitting] = useState(false)

  const fetchStock = useCallback(async () => {
    try {
      setLoadingStock(true)
      const res = await api.get('/inventory/stock')
      if (res.data?.success && Array.isArray(res.data.data)) {
        if (res.data.data.length > 0) {
          setStock(res.data.data.map(normalizeStockItem))
        }
      }
    } catch (err) {
      console.warn('Failed to fetch stock from API:', err.message)
    } finally {
      setLoadingStock(false)
    }
  }, [])

  const fetchDropdownData = useCallback(async () => {
    try {
      const [supRes, yarnRes, poRes] = await Promise.allSettled([
        api.get('/inventory/suppliers'),
        api.get('/inventory/yarn-types'),
        api.get('/inventory/purchase-orders'),
      ])

      if (supRes.status === 'fulfilled' && supRes.value.data?.data) {
        setSuppliers(supRes.value.data.data)
      }
      if (yarnRes.status === 'fulfilled' && yarnRes.value.data?.data) {
        setYarnTypes(yarnRes.value.data.data)
      }
      if (poRes.status === 'fulfilled' && poRes.value.data?.data) {
        setPurchaseOrders(poRes.value.data.data)
      }
    } catch (err) {
      console.warn('Error loading inventory dropdown data:', err.message)
    }
  }, [])

  useEffect(() => {
    fetchStock()
    fetchDropdownData()
  }, [fetchStock, fetchDropdownData])

  const setFormField = (field, value) => {
    setGrnForm(prev => {
      const updated = { ...prev, [field]: value }

      // If user selected a PO, auto-populate supplier and yarn type if available
      if (field === 'poId' && value) {
        const selectedPo = purchaseOrders.find(p => p.id === value || p.poNumber === value)
        if (selectedPo) {
          if (selectedPo.supplierId) updated.supplierId = selectedPo.supplierId
          if (selectedPo.items && selectedPo.items.length > 0) {
            updated.yarnTypeId = selectedPo.items[0].yarnTypeId || updated.yarnTypeId
            if (selectedPo.items[0].unitPrice) {
              updated.rate = String(selectedPo.items[0].unitPrice / 100)
            }
          }
        }
      }

      return updated
    })

    if (grnErrors[field]) {
      setGrnErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateGrn = () => {
    const errs = {}
    if (!grnForm.supplierId) errs.supplierId = 'Supplier is required'
    if (!grnForm.yarnTypeId) errs.yarnTypeId = 'Yarn type is required'
    if (!grnForm.lotNumber.trim()) errs.lotNumber = 'Lot number is required'
    if (!grnForm.quantity || isNaN(grnForm.quantity) || Number(grnForm.quantity) <= 0) {
      errs.quantity = 'Quantity must be greater than 0'
    }
    if (grnForm.rate && (isNaN(grnForm.rate) || Number(grnForm.rate) < 0)) {
      errs.rate = 'Rate cannot be negative'
    }
    setGrnErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleGrnSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!validateGrn() || grnSubmitting) return

    setGrnSubmitting(true)
    try {
      const generatedGrnNumber = `GRN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
      const payload = {
        grnNumber: generatedGrnNumber,
        supplierId: grnForm.supplierId,
        yarnTypeId: grnForm.yarnTypeId,
        lotNumber: grnForm.lotNumber.trim().toUpperCase(),
        quantity: Math.round(Number(grnForm.quantity)),
        bags: grnForm.bags ? Math.max(0, parseInt(grnForm.bags, 10)) : 0,
        cones: grnForm.cones ? Math.max(0, parseInt(grnForm.cones, 10)) : 0,
        unitPrice: grnForm.rate ? Math.round(Number(grnForm.rate) * 100) : 100, // paise
        vehicleNumber: grnForm.vehicle?.trim().toUpperCase() || undefined,
        challanNumber: grnForm.challan?.trim() || undefined,
      }

      const res = await api.post('/inventory/gate-entries', payload)
      if (res.data?.success) {
        toast(`GRN ${res.data.data.grnNumber || generatedGrnNumber} recorded successfully! Stock levels updated.`, 'success')
        setShowAddGrn(false)
        setGrnForm(BLANK_GRN)
        // Refresh stock table after successful submission
        await fetchStock()
      } else {
        toast(res.data?.message || 'Failed to record GRN', 'error')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error recording Goods Received Note'
      toast(errorMsg, 'error')
    } finally {
      setGrnSubmitting(false)
    }
  }

  const filtered = stock.filter(y =>
    y.type.toLowerCase().includes(search.toLowerCase()) ||
    y.colour.toLowerCase().includes(search.toLowerCase())
  )

  const handleExportPDF = () => exportPDF({
    title: 'Stock Levels',
    subtitle: 'Current, reserved and available yarn inventory',
    columns: COLUMNS,
    rows: buildRows(filtered),
    filename: 'YarnStock',
  })

  const handleExportExcel = () => exportExcel({
    filename: 'YarnStock',
    sheetName: 'Stock',
    columns: COLUMNS,
    rows: buildRows(filtered),
  })

  return (
    <div className="page-root">
      <PageHeader
        title="Stock Levels"
        subtitle={`Managed by ${user?.name || 'Store'} · Current, reserved and available yarn inventory`}
        actions={
          <div className="flex gap-2">
            <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
<<<<<<< HEAD
            <button className="btn-primary btn-sm" onClick={() => navigate('/inventory/gate-entries')}><Plus size={14} />Add GRN</button>
=======
            <button
              id="add-grn-btn"
              className="btn-primary btn-sm flex items-center gap-1.5"
              onClick={() => {
                setGrnForm(BLANK_GRN)
                setGrnErrors({})
                setShowAddGrn(true)
              }}
            >
              <Plus size={14} />Add GRN
            </button>
>>>>>>> 97ed768d65e0702d2c6c46f110b1afc59861571f
          </div>
        }
      />

<<<<<<< HEAD


=======
>>>>>>> 97ed768d65e0702d2c6c46f110b1afc59861571f
      <div className="table-wrap">
        <div className="table-head">
          <div className="flex items-center gap-2">
            <p className="section-title">
              Yarn Inventory <span className="text-zinc-600 font-normal text-xs ml-1">{filtered.length} items</span>
            </p>
            {loadingStock && (
              <Loader2 size={13} className="animate-spin text-primary-400" />
            )}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="search-yarn-input"
              className="input-sm pl-8 w-48"
              placeholder="Search yarn…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="table-base">
          <thead>
            <tr>
              <th>Yarn Type</th>
              <th>Colour</th>
              <th>Current</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Reorder Level</th>
              <th>Availability</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-zinc-500 text-sm">
                  {loadingStock ? 'Loading yarn inventory...' : 'No stock records found matching your search.'}
                </td>
              </tr>
            ) : (
              filtered.map(y => {
                const available = y.current - y.reserved
                return (
                  <tr key={y.id}>
                    <td className="font-semibold text-zinc-200">{y.type}</td>
                    <td className="text-zinc-400">{y.colour}</td>
                    <td className="font-mono text-xs text-zinc-300 font-semibold">
                      {y.current.toLocaleString()} {y.unit}
                    </td>
                    <td className="font-mono text-xs text-amber-400">
                      {y.reserved.toLocaleString()}
                    </td>
                    <td className={cn(
                      'font-mono text-xs font-bold',
                      available <= 0 ? 'text-red-400' : available < y.reorder ? 'text-amber-400' : 'text-emerald-400'
                    )}>
                      {available.toLocaleString()}
                    </td>
                    <td className="font-mono text-xs text-zinc-500">
                      {y.reorder.toLocaleString()}
                    </td>
                    <td><StockBar current={y.current} reserved={y.reserved} reorder={y.reorder} /></td>
                    <td><Badge status={y.status} /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add GRN Dialog / Modal */}
      <Modal
        open={showAddGrn}
        onClose={() => !grnSubmitting && setShowAddGrn(false)}
        title="Add Goods Received Note (GRN)"
        size="lg"
      >
        <form onSubmit={handleGrnSubmit} className="space-y-4">
          <p className="text-xs text-zinc-400">
            Record material inward to update stock inventory, lot batches, and warehouse registers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <label className="label">
                Supplier <span className="text-red-400">*</span>
              </label>
              <select
                id="grn-supplier-select"
                className={cn('input', grnErrors.supplierId && 'border-red-500')}
                value={grnForm.supplierId}
                onChange={e => setFormField('supplierId', e.target.value)}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.contactName ? `(${s.contactName})` : ''}
                  </option>
                ))}
              </select>
              {grnErrors.supplierId && (
                <p className="text-xs text-red-400 mt-1">{grnErrors.supplierId}</p>
              )}
            </div>

            {/* Purchase Order (Optional link) */}
            <div>
              <label className="label">
                Linked Purchase Order <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <select
                id="grn-po-select"
                className="input"
                value={grnForm.poId}
                onChange={e => setFormField('poId', e.target.value)}
              >
                <option value="">Direct Inward / None</option>
                {purchaseOrders
                  .filter(p => !grnForm.supplierId || p.supplierId === grnForm.supplierId)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.poNumber} — {p.supplier?.name || 'Supplier'} ({p.status})
                    </option>
                  ))}
              </select>
            </div>

            {/* Yarn Type / Material */}
            <div>
              <label className="label">
                Yarn Type / Material <span className="text-red-400">*</span>
              </label>
              <select
                id="grn-yarn-select"
                className={cn('input', grnErrors.yarnTypeId && 'border-red-500')}
                value={grnForm.yarnTypeId}
                onChange={e => setFormField('yarnTypeId', e.target.value)}
              >
                <option value="">Select Yarn Type</option>
                {yarnTypes.map(y => (
                  <option key={y.id} value={y.id}>
                    {y.name} ({y.color || 'Natural'}) — {y.unit || 'kg'}
                  </option>
                ))}
              </select>
              {grnErrors.yarnTypeId && (
                <p className="text-xs text-red-400 mt-1">{grnErrors.yarnTypeId}</p>
              )}
            </div>

            {/* Lot Number */}
            <div>
              <label className="label">
                Lot / Batch Number <span className="text-red-400">*</span>
              </label>
              <input
                id="grn-lot-input"
                className={cn('input font-mono', grnErrors.lotNumber && 'border-red-500')}
                placeholder="e.g. LOT-402, BATCH-88"
                value={grnForm.lotNumber}
                onChange={e => setFormField('lotNumber', e.target.value)}
              />
              {grnErrors.lotNumber && (
                <p className="text-xs text-red-400 mt-1">{grnErrors.lotNumber}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="label">
                Received Quantity (kg) <span className="text-red-400">*</span>
              </label>
              <input
                id="grn-qty-input"
                type="number"
                min="1"
                step="any"
                className={cn('input', grnErrors.quantity && 'border-red-500')}
                placeholder="e.g. 500"
                value={grnForm.quantity}
                onChange={e => setFormField('quantity', e.target.value)}
              />
              {grnErrors.quantity && (
                <p className="text-xs text-red-400 mt-1">{grnErrors.quantity}</p>
              )}
            </div>

            {/* Rate / Unit Price */}
            <div>
              <label className="label">Rate per kg (₹)</label>
              <input
                id="grn-rate-input"
                type="number"
                min="0"
                step="any"
                className={cn('input', grnErrors.rate && 'border-red-500')}
                placeholder="e.g. 280"
                value={grnForm.rate}
                onChange={e => setFormField('rate', e.target.value)}
              />
              {grnErrors.rate && (
                <p className="text-xs text-red-400 mt-1">{grnErrors.rate}</p>
              )}
            </div>

            {/* Bags */}
            <div>
              <label className="label">Bags Count</label>
              <input
                id="grn-bags-input"
                type="number"
                min="0"
                className="input"
                placeholder="e.g. 10"
                value={grnForm.bags}
                onChange={e => setFormField('bags', e.target.value)}
              />
            </div>

            {/* Cones */}
            <div>
              <label className="label">Cones Count</label>
              <input
                id="grn-cones-input"
                type="number"
                min="0"
                className="input"
                placeholder="e.g. 240"
                value={grnForm.cones}
                onChange={e => setFormField('cones', e.target.value)}
              />
            </div>

            {/* Challan Number */}
            <div>
              <label className="label">Delivery Challan / Invoice No.</label>
              <input
                id="grn-challan-input"
                className="input font-mono"
                placeholder="e.g. CH-9912"
                value={grnForm.challan}
                onChange={e => setFormField('challan', e.target.value)}
              />
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="label">Vehicle Registration No.</label>
              <input
                id="grn-vehicle-input"
                className="input font-mono"
                placeholder="e.g. GJ05AB1234"
                value={grnForm.vehicle}
                onChange={e => setFormField('vehicle', e.target.value)}
              />
            </div>

            {/* Received Date */}
            <div className="md:col-span-2">
              <label className="label">Received Date</label>
              <input
                id="grn-date-input"
                type="date"
                className="input"
                value={grnForm.receivedDate}
                onChange={e => setFormField('receivedDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAddGrn(false)}
              disabled={grnSubmitting}
            >
              Cancel
            </button>
            <button
              id="grn-submit-btn"
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={grnSubmitting}
            >
              {grnSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving GRN...
                </>
              ) : (
                <>
                  <ArrowUpRight size={14} />
                  Record GRN & Update Stock
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
