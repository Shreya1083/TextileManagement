import { useState, useMemo } from 'react'
import { Plus, Truck, Search, Eye, Edit2, Trash2, FileText, CheckCircle2, Clock, MapPin, Printer, ArrowRight, Download } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatDate, formatCurrencyFull } from '../../lib/utils'
import { exportCSV } from '../../lib/exportUtils'
import {
  useDispatches,
  useCreateDispatch,
  useUpdateDispatch,
  useDeleteDispatch,
  useCreateInvoice,
  useInvoices,
  useBuyers,
  useOrders
} from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const STATUS_OPTIONS = ['PENDING', 'DISPATCHED', 'DELIVERED']

export default function DispatchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [editingDispatch, setEditingDispatch] = useState(null)
  const [viewingDispatch, setViewingDispatch] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [notification, setNotification] = useState(null)

  const { data: dispatchesData, isLoading, error } = useDispatches()
  const dispatches = useMemo(() => dispatchesData?.data || [], [dispatchesData])

  const { data: buyersData } = useBuyers()
  const buyers = useMemo(() => buyersData?.data || [], [buyersData])

  const { data: ordersData } = useOrders()
  const orders = useMemo(() => ordersData?.data || [], [ordersData])

  const { data: invoicesData } = useInvoices()
  const invoices = useMemo(() => invoicesData?.data || [], [invoicesData])

  const createDispatchMutation = useCreateDispatch()
  const updateDispatchMutation = useUpdateDispatch()
  const deleteDispatchMutation = useDeleteDispatch()
  const createInvoiceMutation = useCreateInvoice()

  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      const matchesSearch =
        (d.dispatchId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.buyer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.order || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [dispatches, searchTerm, statusFilter])

  // Summary Metrics
  const stats = useMemo(() => {
    const total = dispatches.length
    const pending = dispatches.filter(d => d.status === 'PENDING').length
    const inTransit = dispatches.filter(d => d.status === 'DISPATCHED').length
    const delivered = dispatches.filter(d => d.status === 'DELIVERED').length
    const totalMetres = dispatches.reduce((acc, d) => acc + (Number(d.metres) || 0), 0)
    return { total, pending, inTransit, delivered, totalMetres }
  }, [dispatches])

  const handleCreateInvoice = async (d) => {
    try {
      const invId = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 89999 + 10000)}`
      const calculatedAmount = Math.round((Number(d.metres) || 0) * 85)
      await createInvoiceMutation.mutateAsync({
        invoiceId: invId,
        buyer: d.buyer,
        dispatch: d.dispatchId,
        amount: calculatedAmount,
        paid: 0,
        balance: calculatedAmount,
        status: 'UNPAID',
        date: new Date().toISOString()
      })
      showToast(`Invoice ${invId} created successfully for ${d.buyer}!`)
    } catch (err) {
      showToast(err.message || 'Failed to create invoice', 'error')
    }
  }

  const handleStatusChange = async (dispatchItem, newStatus) => {
    try {
      await updateDispatchMutation.mutateAsync({
        id: dispatchItem.id,
        data: { status: newStatus }
      })
      if (viewingDispatch && viewingDispatch.id === dispatchItem.id) {
        setViewingDispatch(prev => ({ ...prev, status: newStatus }))
      }
      showToast(`Dispatch ${dispatchItem.dispatchId} status updated to ${newStatus}`)
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDispatchMutation.mutateAsync(id)
      setDeleteConfirm(null)
      if (viewingDispatch?.id === id) setViewingDispatch(null)
      showToast('Dispatch deleted successfully')
    } catch (err) {
      showToast(err.message || 'Failed to delete dispatch', 'error')
    }
  }

  const handleExportCSV = () => {
    const columns = ['Dispatch ID', 'Buyer', 'Order', 'Rolls', 'Metres', 'Date', 'Vehicle', 'Driver', 'Status']
    const rows = filteredDispatches.map(d => [
      d.dispatchId,
      d.buyer,
      d.order,
      d.rolls,
      d.metres,
      formatDate(d.date),
      d.vehicle || '—',
      d.driver || '—',
      d.status
    ])
    exportCSV('dispatches_export.csv', columns, rows)
  }

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm border font-medium ${
          notification.type === 'error'
            ? 'bg-rose-950/90 border-rose-700 text-rose-200'
            : 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
        }`}>
          <span>{notification.message}</span>
        </div>
      )}

      <PageHeader
        title="Dispatches"
        subtitle="Manage end-to-end shipment records, packing lists & delivery challans"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </button>
            <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Create Dispatch
            </button>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500" />
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Dispatches</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{stats.total}</p>
          <p className="text-xs text-zinc-500 mt-1">{stats.totalMetres.toLocaleString()} m total shipped</p>
        </div>
        <div className="card p-4 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-500 to-orange-500" />
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Pending Shipment</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pending}</p>
          <p className="text-xs text-zinc-500 mt-1">Ready at loading dock</p>
        </div>
        <div className="card p-4 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500" />
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">In Transit</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.inTransit}</p>
          <p className="text-xs text-zinc-500 mt-1">Dispatched to logistics</p>
        </div>
        <div className="card p-4 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500" />
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Delivered</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.delivered}</p>
          <p className="text-xs text-zinc-500 mt-1">Confirmed received</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search dispatch, buyer, order, vehicle..."
            className="input pl-9 py-1.5 text-xs w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['ALL', 'PENDING', 'DISPATCHED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="table-wrap">
        <table className="table-base">
          <thead>
            <tr>
              <th>Dispatch ID</th>
              <th>Buyer</th>
              <th>Order</th>
              <th>Rolls</th>
              <th>Metres</th>
              <th>Date</th>
              <th>Vehicle & Driver</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDispatches.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-zinc-500">
                  No dispatches found matching your search.
                </td>
              </tr>
            ) : (
              filteredDispatches.map((d) => {
                const linkedInvoice = invoices.find(inv => inv.dispatch === d.dispatchId)
                return (
                  <tr key={d.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-zinc-800 text-primary-400">
                          <Truck size={13} />
                        </div>
                        <span className="font-mono text-xs text-primary-400 font-semibold">{d.dispatchId}</span>
                      </div>
                    </td>
                    <td className="font-semibold text-zinc-200">{d.buyer}</td>
                    <td className="font-mono text-xs text-zinc-400">{d.order}</td>
                    <td className="text-zinc-300 font-medium">{d.rolls}</td>
                    <td className="font-semibold text-zinc-200">{(Number(d.metres) || 0).toLocaleString()} m</td>
                    <td className="text-zinc-400 text-xs">{formatDate(d.date)}</td>
                    <td>
                      <div className="text-xs">
                        <span className="font-mono text-zinc-300">{d.vehicle || '—'}</span>
                        {d.driver && <span className="text-zinc-500 block text-[11px]">{d.driver}</span>}
                      </div>
                    </td>
                    <td>
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-md border bg-zinc-900 cursor-pointer ${
                          d.status === 'DELIVERED'
                            ? 'text-emerald-400 border-emerald-800'
                            : d.status === 'DISPATCHED'
                            ? 'text-blue-400 border-blue-800'
                            : 'text-amber-400 border-amber-800'
                        }`}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className="bg-zinc-900 text-zinc-200">{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="btn-ghost btn-xs text-primary-400 flex items-center gap-1"
                          onClick={() => setViewingDispatch(d)}
                          title="View Details"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          className="btn-ghost btn-xs text-zinc-400 hover:text-zinc-200"
                          onClick={() => setEditingDispatch(d)}
                          title="Edit Dispatch"
                        >
                          <Edit2 size={12} />
                        </button>
                        {linkedInvoice ? (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800" title={`Invoice: ${linkedInvoice.invoiceId}`}>
                            INV #{linkedInvoice.invoiceId.split('-').pop()}
                          </span>
                        ) : (
                          <button
                            className="btn-ghost btn-xs text-amber-400 hover:text-amber-300"
                            onClick={() => handleCreateInvoice(d)}
                            title="Generate Invoice"
                          >
                            + Invoice
                          </button>
                        )}
                        <button
                          className="btn-ghost btn-xs text-rose-400 hover:text-rose-300"
                          onClick={() => setDeleteConfirm(d)}
                          title="Delete Dispatch"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE DISPATCH MODAL */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create New Dispatch" size="lg">
        <DispatchForm
          initialData={null}
          buyers={buyers}
          orders={orders}
          onSubmit={async (formData) => {
            try {
              await createDispatchMutation.mutateAsync({
                dispatchId: `DSP-${new Date().getFullYear()}-${Math.floor(Math.random() * 89999 + 10000)}`,
                buyer: formData.buyer,
                order: formData.order,
                rolls: Number(formData.rolls),
                metres: Number(formData.metres),
                vehicle: formData.vehicle,
                driver: formData.driver,
                date: new Date(formData.date).toISOString(),
                status: formData.status || 'DISPATCHED'
              })
              setShowAdd(false)
              showToast('Dispatch created successfully!')
            } catch (err) {
              showToast(err.message || 'Failed to create dispatch', 'error')
            }
          }}
          isSubmitting={createDispatchMutation.isPending}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* EDIT DISPATCH MODAL */}
      <Modal open={!!editingDispatch} onClose={() => setEditingDispatch(null)} title={`Edit Dispatch: ${editingDispatch?.dispatchId}`} size="lg">
        {editingDispatch && (
          <DispatchForm
            initialData={editingDispatch}
            buyers={buyers}
            orders={orders}
            onSubmit={async (formData) => {
              try {
                await updateDispatchMutation.mutateAsync({
                  id: editingDispatch.id,
                  data: {
                    buyer: formData.buyer,
                    order: formData.order,
                    rolls: Number(formData.rolls),
                    metres: Number(formData.metres),
                    vehicle: formData.vehicle,
                    driver: formData.driver,
                    date: new Date(formData.date).toISOString(),
                    status: formData.status
                  }
                })
                setEditingDispatch(null)
                showToast('Dispatch updated successfully!')
              } catch (err) {
                showToast(err.message || 'Failed to update dispatch', 'error')
              }
            }}
            isSubmitting={updateDispatchMutation.isPending}
            onCancel={() => setEditingDispatch(null)}
          />
        )}
      </Modal>

      {/* VIEW DISPATCH & DELIVERY CHALLAN MODAL */}
      <Modal open={!!viewingDispatch} onClose={() => setViewingDispatch(null)} title="Dispatch Details & Delivery Challan" size="lg">
        {viewingDispatch && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-950 border border-primary-700/50 flex items-center justify-center text-primary-400">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-base">{viewingDispatch.dispatchId}</h3>
                  <p className="text-xs text-zinc-400">Buyer: <span className="text-zinc-200 font-semibold">{viewingDispatch.buyer}</span></p>
                </div>
              </div>
              <Badge status={viewingDispatch.status} />
            </div>

            {/* Interactive Stepper */}
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Shipment Progress</p>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((step, idx) => {
                  const currentIdx = STATUS_OPTIONS.indexOf(viewingDispatch.status)
                  const isDone = currentIdx >= idx
                  const isCurrent = viewingDispatch.status === step
                  return (
                    <button
                      key={step}
                      onClick={() => handleStatusChange(viewingDispatch, step)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isCurrent
                          ? 'bg-primary-950/70 border-primary-500 text-primary-200 shadow-md ring-1 ring-primary-500'
                          : isDone
                          ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-300'
                          : 'bg-zinc-800/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold opacity-70">STAGE {idx + 1}</span>
                        {isDone && <CheckCircle2 size={13} className="text-emerald-400" />}
                      </div>
                      <p className="text-xs font-bold capitalize">{step.replace('_', ' ')}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Shipment Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-500 font-medium">Order Number</span>
                <p className="font-mono text-xs font-bold text-zinc-200 mt-1">{viewingDispatch.order || '—'}</p>
              </div>
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-500 font-medium">Total Quantity</span>
                <p className="font-bold text-zinc-100 mt-1">{(Number(viewingDispatch.metres) || 0).toLocaleString()} m</p>
              </div>
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-500 font-medium">Rolls Packed</span>
                <p className="font-bold text-zinc-100 mt-1">{viewingDispatch.rolls || 0} Rolls</p>
              </div>
              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-500 font-medium">Dispatch Date</span>
                <p className="text-xs font-semibold text-zinc-200 mt-1">{formatDate(viewingDispatch.date)}</p>
              </div>
            </div>

            {/* Vehicle & Logistics Details */}
            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-300">
                <MapPin size={14} className="text-primary-400" /> Logistics & Transport
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-zinc-500">Vehicle / Truck No:</span>
                  <p className="font-mono font-bold text-zinc-200 mt-0.5">{viewingDispatch.vehicle || 'Not assigned'}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Driver / Transporter:</span>
                  <p className="font-medium text-zinc-200 mt-0.5">{viewingDispatch.driver || 'Direct Transport'}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary btn-sm flex items-center gap-1.5"
                  onClick={() => window.print()}
                >
                  <Printer size={13} /> Print Challan
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm flex items-center gap-1.5 text-amber-400"
                  onClick={() => handleCreateInvoice(viewingDispatch)}
                >
                  <FileText size={13} /> Generate Invoice
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    setEditingDispatch(viewingDispatch)
                    setViewingDispatch(null)
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => setViewingDispatch(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete Dispatch" size="sm">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Are you sure you want to permanently delete dispatch <span className="font-mono text-rose-400 font-bold">{deleteConfirm.dispatchId}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn-danger flex items-center gap-1"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleteDispatchMutation.isPending}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function DispatchForm({ initialData, buyers, orders, onSubmit, isSubmitting, onCancel }) {
  const [selectedOrder, setSelectedOrder] = useState(initialData?.order || '')
  const [buyer, setBuyer] = useState(initialData?.buyer || '')
  const [rolls, setRolls] = useState(initialData?.rolls || '')
  const [metres, setMetres] = useState(initialData?.metres || '')
  const [vehicle, setVehicle] = useState(initialData?.vehicle || '')
  const [driver, setDriver] = useState(initialData?.driver || '')
  const [date, setDate] = useState(
    initialData?.date
      ? new Date(initialData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [status, setStatus] = useState(initialData?.status || 'DISPATCHED')

  const handleOrderSelect = (orderNumber) => {
    setSelectedOrder(orderNumber)
    const ord = orders.find(o => o.orderNumber === orderNumber)
    if (ord) {
      if (ord.customer?.name) setBuyer(ord.customer.name)
      else if (ord.buyer) setBuyer(ord.buyer)
      if (ord.quantity) {
        setMetres(ord.quantity)
        setRolls(Math.max(1, Math.round(ord.quantity / 100)))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!buyer.trim()) {
      alert('Please provide or select a Buyer')
      return
    }
    onSubmit({
      buyer,
      order: selectedOrder || 'ORD-DIRECT',
      rolls: Number(rolls) || 1,
      metres: Number(metres) || 100,
      vehicle: vehicle.trim() || 'TRUCK-01',
      driver: driver.trim() || 'Direct Driver',
      date,
      status
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Selector */}
        <div>
          <label className="label">Link Order (Optional)</label>
          <select
            className="input"
            value={selectedOrder}
            onChange={(e) => handleOrderSelect(e.target.value)}
          >
            <option value="">Select Existing Order...</option>
            {orders.map(o => (
              <option key={o.id} value={o.orderNumber}>
                {o.orderNumber} - {o.customer?.name || o.fabric || 'Order'} ({o.quantity}m)
              </option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-500 mt-1">Selecting an order auto-fills buyer and metres</p>
        </div>

        {/* Buyer Selection or Custom Input */}
        <div>
          <label className="label">Buyer / Customer <span className="text-rose-500">*</span></label>
          <div className="space-y-2">
            <input
              type="text"
              className="input"
              placeholder="Enter Buyer Name"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              required
            />
            {buyers.length > 0 && (
              <select
                className="input text-xs text-zinc-400 py-1"
                onChange={(e) => { if (e.target.value) setBuyer(e.target.value) }}
                defaultValue=""
              >
                <option value="">Or choose from registered buyers...</option>
                {buyers.map(b => (
                  <option key={b.id} value={b.name}>{b.name} ({b.city || 'India'})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Total Rolls */}
        <div>
          <label className="label">Total Rolls Packed <span className="text-rose-500">*</span></label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 12"
            value={rolls}
            onChange={(e) => setRolls(e.target.value)}
            min="1"
            required
          />
        </div>

        {/* Total Metres */}
        <div>
          <label className="label">Total Metres (m) <span className="text-rose-500">*</span></label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 1200"
            value={metres}
            onChange={(e) => setMetres(e.target.value)}
            min="1"
            required
          />
        </div>

        {/* Vehicle Number */}
        <div>
          <label className="label">Vehicle / Truck Number <span className="text-rose-500">*</span></label>
          <input
            type="text"
            className="input"
            placeholder="e.g. MH-04-AB-1234"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            required
          />
        </div>

        {/* Driver Name */}
        <div>
          <label className="label">Driver / Transporter Name</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Ramesh Kumar"
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
          />
        </div>

        {/* Date */}
        <div>
          <label className="label">Dispatch Date <span className="text-rose-500">*</span></label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="label">Initial Status</label>
          <select
            className="input font-semibold"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary flex items-center gap-1.5" disabled={isSubmitting}>
          <Truck size={14} /> {initialData ? 'Update Dispatch' : 'Confirm Dispatch'}
        </button>
      </div>
    </form>
  )
}

