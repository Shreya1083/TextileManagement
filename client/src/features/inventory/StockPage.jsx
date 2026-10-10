
import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Loader2, ArrowUpRight } from 'lucide-react'

import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { mockSuppliers, mockYarnStock } from '../../mocks/data'
import { exportPDF, exportExcel } from '../../lib/exportUtils'
import { cn } from '../../lib/utils'
import api from '../../lib/api'

const COLUMNS = [
  'Yarn Type',
  'Colour',
  'Current',
  'Reserved',
  'Available',
  'Reorder Level',
  'Unit',
  'Status',
]

const getToday = () => new Date().toISOString().split('T')[0]

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
  receivedDate: getToday(),
}

function buildRows(stock) {
  return stock.map((item) => [
    item.type,
    item.colour,
    item.current,
    item.reserved,
    item.current - item.reserved,
    item.reorder,
    item.unit,
    item.status,
  ])
}

function computeStatus(available, reorder) {
  if (available <= 0) return 'OUT'
  if (available < reorder) return 'LOW'
  return 'OK'
}

function StockBar({ current, reserved, reorder }) {
  const available = current - reserved
  const safeReorder = reorder || 100
  const percentage = Math.min(
    100,
    Math.max(4, (available / (safeReorder * 2)) * 100),
  )

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            available <= 0
              ? 'bg-red-500'
              : available < safeReorder
                ? 'bg-amber-500'
                : 'bg-emerald-500',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function normalizeStockItem(item) {
  const yarnType = item.yarnType || {}
  const current = Number(item.totalQuantity ?? item.current ?? 0)
  const reserved = Number(item.reservedQuantity ?? item.reserved ?? 0)
  const available = Number(
    item.availableQuantity ?? current - reserved,
  )
  const reorder = Number(yarnType.reorderLevel ?? item.reorder ?? 100)

  return {
    id: yarnType.id || item.id,
    type: yarnType.name || item.type || 'Unknown Yarn',
    colour: yarnType.color || item.colour || 'Natural',
    current,
    reserved,
    available,
    reorder,
    unit: yarnType.unit || item.unit || 'kg',
    status: computeStatus(available, reorder),
    batches: item.batches || [],
  }
}

export default function StockPage() {
  const { user } = useAuth()
  const toast = useToast()

  const [stock, setStock] = useState(() =>
    mockYarnStock.map((item) => ({
      ...item,
      current: Number(item.current || 0),
      reserved: Number(item.reserved || 0),
      reorder: Number(item.reorder || 100),
      available: Number(item.current || 0) - Number(item.reserved || 0),
    })),
  )

  const [loadingStock, setLoadingStock] = useState(false)
  const [search, setSearch] = useState('')

  const [suppliers, setSuppliers] = useState([])
  const [yarnTypes, setYarnTypes] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])

  const [showAddGrn, setShowAddGrn] = useState(false)
  const [grnForm, setGrnForm] = useState(BLANK_GRN)
  const [grnErrors, setGrnErrors] = useState({})
  const [grnSubmitting, setGrnSubmitting] = useState(false)

  // Load current stock from the API.
  const fetchStock = useCallback(async () => {
    setLoadingStock(true)

    try {
      const response = await api.get('/inventory/stock')

      if (
        response.data?.success &&
        Array.isArray(response.data.data)
      ) {
        setStock(response.data.data.map(normalizeStockItem))
      }
    } catch (error) {
      console.warn(
        'Failed to fetch stock from API:',
        error.response?.data?.message || error.message,
      )
    } finally {
      setLoadingStock(false)
    }
  }, [])

  // Load suppliers, yarn types, and purchase orders for the GRN form.
  const fetchDropdownData = useCallback(async () => {
    const results = await Promise.allSettled([
      api.get('/inventory/suppliers'),
      api.get('/inventory/yarn-types'),
      api.get('/inventory/purchase-orders'),
    ])

    const [supplierResult, yarnResult, poResult] = results

    if (
      supplierResult.status === 'fulfilled' &&
      Array.isArray(supplierResult.value.data?.data)
    ) {
      setSuppliers(
        supplierResult.value.data.data.length > 0
          ? supplierResult.value.data.data
          : mockSuppliers,
      )
    } else {
      setSuppliers(mockSuppliers)
    }

    if (
      yarnResult.status === 'fulfilled' &&
      Array.isArray(yarnResult.value.data?.data)
    ) {
      setYarnTypes(
        yarnResult.value.data.data.length > 0
          ? yarnResult.value.data.data
          : mockYarnStock.map((item) => ({
              id: item.id,
              name: item.type,
              color: item.colour,
              unit: item.unit,
            })),
      )
    } else {
      setYarnTypes(
        mockYarnStock.map((item) => ({
          id: item.id,
          name: item.type,
          color: item.colour,
          unit: item.unit,
        })),
      )
    }

    if (
      poResult.status === 'fulfilled' &&
      Array.isArray(poResult.value.data?.data)
    ) {
      setPurchaseOrders(poResult.value.data.data)
    }
  }, [])

  useEffect(() => {
    fetchStock()
    fetchDropdownData()
  }, [fetchStock, fetchDropdownData])

  // Update a GRN field and clear its validation error.
  const setFormField = (field, value) => {
    setGrnForm((previous) => {
      const updated = { ...previous, [field]: value }

      if (field === 'poId' && value) {
        const selectedPO = purchaseOrders.find(
          (po) => po.id === value || po.poNumber === value,
        )

        if (selectedPO) {
          if (selectedPO.supplierId) {
            updated.supplierId = selectedPO.supplierId
          }

          const firstItem = selectedPO.items?.[0]

          if (firstItem) {
            updated.yarnTypeId =
              firstItem.yarnTypeId || updated.yarnTypeId

            if (firstItem.unitPrice != null) {
              updated.rate = String(
                Number(firstItem.unitPrice) / 100,
              )
            }
          }
        }
      }

      return updated
    })

    setGrnErrors((previous) => {
      const next = { ...previous }
      delete next[field]

      if (field === 'poId') {
        delete next.supplierId
        delete next.yarnTypeId
      }

      return next
    })
  }

  // Validate form data before submitting.
  const validateGrn = () => {
    const errors = {}

    if (!grnForm.supplierId) {
      errors.supplierId = 'Supplier is required'
    }

    if (!grnForm.yarnTypeId) {
      errors.yarnTypeId = 'Yarn type is required'
    }

    if (!grnForm.lotNumber.trim()) {
      errors.lotNumber = 'Lot number is required'
    }

    if (
      grnForm.quantity === '' ||
      !Number.isFinite(Number(grnForm.quantity)) ||
      Number(grnForm.quantity) <= 0
    ) {
      errors.quantity = 'Quantity must be greater than 0'
    }

    if (
      grnForm.rate !== '' &&
      (!Number.isFinite(Number(grnForm.rate)) ||
        Number(grnForm.rate) < 0)
    ) {
      errors.rate = 'Rate cannot be negative'
    }

    for (const field of ['bags', 'cones']) {
      if (
        grnForm[field] !== '' &&
        (!Number.isInteger(Number(grnForm[field])) ||
          Number(grnForm[field]) < 0)
      ) {
        errors[field] =
          'Enter a whole number greater than or equal to 0'
      }
    }

    setGrnErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit the Goods Received Note.
  const handleGrnSubmit = async (event) => {
    event.preventDefault()

    if (grnSubmitting || !validateGrn()) return

    setGrnSubmitting(true)

    try {
      const generatedGrnNumber =
        `GRN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

      const payload = {
        grnNumber: generatedGrnNumber,
        supplierId: grnForm.supplierId,
        yarnTypeId: grnForm.yarnTypeId,
        lotNumber: grnForm.lotNumber.trim().toUpperCase(),
        quantity: Number(grnForm.quantity),
        bags: grnForm.bags
          ? Number.parseInt(grnForm.bags, 10)
          : 0,
        cones: grnForm.cones
          ? Number.parseInt(grnForm.cones, 10)
          : 0,
        unitPrice:
          grnForm.rate !== ''
            ? Math.round(Number(grnForm.rate) * 100)
            : 100,
        vehicleNumber:
          grnForm.vehicle.trim().toUpperCase() || undefined,
        challanNumber:
          grnForm.challan.trim() || undefined,
        receivedDate: grnForm.receivedDate || undefined,
        purchaseOrderId: grnForm.poId || undefined,
      }

      const response = await api.post(
        '/inventory/gate-entries',
        payload,
      )

      if (!response.data?.success) {
        toast(
          response.data?.message || 'Failed to record GRN',
          'error',
        )
        return
      }

      const savedNumber =
        response.data.data?.grnNumber || generatedGrnNumber

      toast(
        `GRN ${savedNumber} recorded successfully! Stock levels updated.`,
        'success',
      )

      setShowAddGrn(false)
      setGrnForm({ ...BLANK_GRN, receivedDate: getToday() })
      setGrnErrors({})

      await fetchStock()
    } catch (error) {
      toast(
        error.response?.data?.message ||
          error.message ||
          'Error recording Goods Received Note',
        'error',
      )
    } finally {
      setGrnSubmitting(false)
    }
  }

  const filtered = stock.filter((item) => {
    const query = search.trim().toLowerCase()

    return (
      String(item.type || '').toLowerCase().includes(query) ||
      String(item.colour || '').toLowerCase().includes(query)
    )
  })

  const handleExportPDF = () => {
    exportPDF({
      title: 'Stock Levels',
      subtitle: 'Current, reserved and available yarn inventory',
      columns: COLUMNS,
      rows: buildRows(filtered),
      filename: 'YarnStock',
    })
  }

  const handleExportExcel = () => {
    exportExcel({
      filename: 'YarnStock',
      sheetName: 'Stock',
      columns: COLUMNS,
      rows: buildRows(filtered),
    })
  }

  const openGrnModal = () => {
    setGrnForm({ ...BLANK_GRN, receivedDate: getToday() })
    setGrnErrors({})
    setShowAddGrn(true)
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Stock Levels"
        subtitle={`Managed by ${user?.name || 'Store'} · Current, reserved and available yarn inventory`}
        actions={
          <div className="flex gap-2">
            <ExportMenu
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
            />

            <button
              id="add-grn-btn"
              type="button"
              className="btn-primary btn-sm flex items-center gap-1.5"
              onClick={openGrnModal}
            >
              <Plus size={14} />
              Add GRN
            </button>
          </div>
        }
      />

      <div className="table-wrap">
        <div className="table-head">
          <div className="flex items-center gap-2">
            <p className="section-title">
              Yarn Inventory{' '}
              <span className="text-zinc-600 font-normal text-xs ml-1">
                {filtered.length} items
              </span>
            </p>

            {loadingStock && (
              <Loader2
                size={13}
                className="animate-spin text-primary-400"
              />
            )}
          </div>

          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              id="search-yarn-input"
              className="input-sm pl-8 w-48"
              placeholder="Search yarn…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search yarn inventory"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
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
                  <td
                    colSpan={8}
                    className="text-center py-8 text-zinc-500 text-sm"
                  >
                    {loadingStock
                      ? 'Loading yarn inventory...'
                      : 'No stock records found matching your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const available = item.current - item.reserved

                  return (
                    <tr key={item.id}>
                      <td className="font-semibold text-zinc-200">
                        {item.type}
                      </td>

                      <td className="text-zinc-400">
                        {item.colour}
                      </td>

                      <td className="font-mono text-xs text-zinc-300 font-semibold">
                        {item.current.toLocaleString()} {item.unit}
                      </td>

                      <td className="font-mono text-xs text-amber-400">
                        {item.reserved.toLocaleString()}
                      </td>

                      <td
                        className={cn(
                          'font-mono text-xs font-bold',
                          available <= 0
                            ? 'text-red-400'
                            : available < item.reorder
                              ? 'text-amber-400'
                              : 'text-emerald-400',
                        )}
                      >
                        {available.toLocaleString()}
                      </td>

                      <td className="font-mono text-xs text-zinc-500">
                        {item.reorder.toLocaleString()}
                      </td>

                      <td>
                        <StockBar
                          current={item.current}
                          reserved={item.reserved}
                          reorder={item.reorder}
                        />
                      </td>

                      <td>
                        <Badge
                          status={computeStatus(
                            available,
                            item.reorder,
                          )}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add GRN modal */}
      <Modal
        open={showAddGrn}
        onClose={() => {
          if (!grnSubmitting) setShowAddGrn(false)
        }}
        title="Add Goods Received Note (GRN)"
        size="lg"
      >
        <form onSubmit={handleGrnSubmit} className="space-y-4">
          <p className="text-xs text-zinc-400">
            Record material inward to update stock inventory, lot batches,
            and warehouse registers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="grn-supplier-select">
                Supplier <span className="text-red-400">*</span>
              </label>

              <select
                id="grn-supplier-select"
                className={cn(
                  'input',
                  grnErrors.supplierId && 'border-red-500',
                )}
                value={grnForm.supplierId}
                onChange={(event) =>
                  setFormField('supplierId', event.target.value)
                }
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                    {supplier.contactName
                      ? ` (${supplier.contactName})`
                      : ''}
                  </option>
                ))}
              </select>

              {grnErrors.supplierId && (
                <p className="text-xs text-red-400 mt-1">
                  {grnErrors.supplierId}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="grn-po-select">
                Linked Purchase Order{' '}
                <span className="text-zinc-500 font-normal">
                  (Optional)
                </span>
              </label>

              <select
                id="grn-po-select"
                className="input"
                value={grnForm.poId}
                onChange={(event) =>
                  setFormField('poId', event.target.value)
                }
              >
                <option value="">Direct Inward / None</option>
                {purchaseOrders
                  .filter(
                    (po) =>
                      !grnForm.supplierId ||
                      po.supplierId === grnForm.supplierId,
                  )
                  .map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber || po.id} —{' '}
                      {po.supplier?.name || 'Supplier'} ({po.status})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="grn-yarn-select">
                Yarn Type / Material{' '}
                <span className="text-red-400">*</span>
              </label>

              <select
                id="grn-yarn-select"
                className={cn(
                  'input',
                  grnErrors.yarnTypeId && 'border-red-500',
                )}
                value={grnForm.yarnTypeId}
                onChange={(event) =>
                  setFormField('yarnTypeId', event.target.value)
                }
              >
                <option value="">Select Yarn Type</option>
                {yarnTypes.map((yarn) => (
                  <option key={yarn.id} value={yarn.id}>
                    {yarn.name} ({yarn.color || 'Natural'}) —{' '}
                    {yarn.unit || 'kg'}
                  </option>
                ))}
              </select>

              {grnErrors.yarnTypeId && (
                <p className="text-xs text-red-400 mt-1">
                  {grnErrors.yarnTypeId}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="grn-lot-input">
                Lot / Batch Number{' '}
                <span className="text-red-400">*</span>
              </label>

              <input
                id="grn-lot-input"
                className={cn(
                  'input font-mono',
                  grnErrors.lotNumber && 'border-red-500',
                )}
                placeholder="e.g. LOT-402, BATCH-88"
                value={grnForm.lotNumber}
                onChange={(event) =>
                  setFormField('lotNumber', event.target.value)
                }
              />

              {grnErrors.lotNumber && (
                <p className="text-xs text-red-400 mt-1">
                  {grnErrors.lotNumber}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="grn-qty-input">
                Received Quantity (kg){' '}
                <span className="text-red-400">*</span>
              </label>

              <input
                id="grn-qty-input"
                type="number"
                min="0.01"
                step="any"
                className={cn(
                  'input',
                  grnErrors.quantity && 'border-red-500',
                )}
                placeholder="e.g. 500"
                value={grnForm.quantity}
                onChange={(event) =>
                  setFormField('quantity', event.target.value)
                }
              />

              {grnErrors.quantity && (
                <p className="text-xs text-red-400 mt-1">
                  {grnErrors.quantity}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="grn-rate-input">
                Rate per kg (₹)
              </label>

              <input
                id="grn-rate-input"
                type="number"
                min="0"
                step="any"
                className={cn(
                  'input',
                  grnErrors.rate && 'border-red-500',
                )}
                placeholder="e.g. 280"
                value={grnForm.rate}
                onChange={(event) =>
                  setFormField('rate', event.target.value)
                }
              />

              {grnErrors.rate && (
                <p className="text-xs text-red-400 mt-1">
                  {grnErrors.rate}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="grn-bags-input">
                Bags Count
              </label>

              <input
                id="grn-bags-input"
                type="number"
                min="0"
                step="1"
                className={cn(
                  'input',
                  grnErrors.bags && 'border-red-500',
                )}
                placeholder="e.g. 10"
                value={grnForm.bags}
                onChange={(event) =>
                  setFormField('bags', event.target.value)
                }
              />

              {grnErrors.bags && (
                <p className="text-xs text-red-400 mt-1">
                  {grnErrors.bags}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="grn-cones-input">
                Cones Count
              </label>

              <input
                id="grn-cones-input"
                type="number"
                min="0"
                step="1"
                className={cn(
                  'input',
                  grnErrors.cones && 'border-red-500',
                )}
                placeholder="e.g. 240"
                value={grnForm.cones}
                onChange={(event) =>
                  setFormField('cones', event.target.value)
                }
              />

              {grnErrors.cones && (
                <p className="text-xs text-red-400 mt-1">
                  {grnErrors.cones}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="grn-challan-input">
                Delivery Challan / Invoice No.
              </label>

              <input
                id="grn-challan-input"
                className="input font-mono"
                placeholder="e.g. CH-9912"
                value={grnForm.challan}
                onChange={(event) =>
                  setFormField('challan', event.target.value)
                }
              />
            </div>

            <div>
              <label className="label" htmlFor="grn-vehicle-input">
                Vehicle Registration No.
              </label>

              <input
                id="grn-vehicle-input"
                className="input font-mono"
                placeholder="e.g. GJ05AB1234"
                value={grnForm.vehicle}
                onChange={(event) =>
                  setFormField('vehicle', event.target.value)
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="label" htmlFor="grn-date-input">
                Received Date
              </label>

              <input
                id="grn-date-input"
                type="date"
                className="input"
                value={grnForm.receivedDate}
                onChange={(event) =>
                  setFormField('receivedDate', event.target.value)
                }
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
                  Record GRN &amp; Update Stock
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
