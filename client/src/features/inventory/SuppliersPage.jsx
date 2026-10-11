import { useState, useEffect } from 'react'
import {
  Plus, Search, Building2, Phone, MapPin,
  FileText, Mail, Globe, Hash,
  Edit2, Trash2, AlertTriangle, Package,
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { cn } from '../../lib/utils'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

/* ── colour cycle for supplier avatars ──────────────────────────────── */
const AVATAR_COLORS = [
  'from-primary-500 to-violet-600',
  'from-cyan-500    to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500   to-orange-600',
  'from-pink-500    to-rose-600',
  'from-violet-500  to-purple-600',
]

/* ── blank form template ─────────────────────────────────────────────── */
const BLANK = {
  name:        '',
  contactPerson:'',
  city:        '',
  state:       '',
  phone:       '',
  altPhone:    '',
  email:       '',
  gstin:       '',
  pan:         '',
  website:     '',
  yarnTypes:   '',
  leadDays:    '',
  paymentTerms:'Net 30',
  notes:       '',
}

/* ── validation ──────────────────────────────────────────────────────── */
function validate(form) {
  const errors = {}
  if (!form.name?.trim())    errors.name  = 'Company name is required'
  if (!form.city?.trim())    errors.city  = 'City is required'
  if (!form.phone?.trim())   errors.phone = 'Contact number is required'
  return errors
}

/* ── AddEditModal ────────────────────────────────────────────────────── */
function SupplierModal({ open, onClose, onSave, initial, editMode, isSubmitting }) {
  const [form,   setForm]   = useState(initial || BLANK)
  const [errors, setErrors] = useState({})

  // Sync when initial changes (editing different rows)
  useEffect(() => {
    if (open) {
      setForm(initial || BLANK)
      setErrors({})
    }
  }, [open, initial])

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => { const e = { ...p }; delete e[k]; return e })
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      await onSave(form)
    } catch (err) {
      setErrors({ form: err?.message || 'Failed to save supplier' })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editMode ? `Edit Supplier — ${form.name}` : 'Add New Supplier'}
      description={editMode ? 'Update supplier details' : 'Register a new yarn or material supplier'}
      size="lg"
    >
      <div className="space-y-5">

        {/* ── Company ── */}
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Company Information</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Company / Firm Name <span className="text-red-400">*</span></label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  className={cn('input pl-9', errors.name && 'border-red-500/60 ring-2 ring-red-500/20')}
                  placeholder="e.g. Agarwal Yarns Pvt Ltd"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Contact Person</label>
              <input className="input" placeholder="Owner / Manager name"
                value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
            </div>

            <div>
              <label className="label">Yarn / Material Types Supplied</label>
              <input className="input" placeholder="e.g. Cotton 40s, Poly 150D"
                value={form.yarnTypes} onChange={e => set('yarnTypes', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="border-t border-zinc-800/80 pt-5">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Contact Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone <span className="text-red-400">*</span></label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  className={cn('input pl-9', errors.phone && 'border-red-500/60 ring-2 ring-red-500/20')}
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="label">Alternate Phone</label>
              <input className="input" placeholder="+91 97XXX XXXXX"
                value={form.altPhone} onChange={e => set('altPhone', e.target.value)} />
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="supplier@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Website</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="https://..."
                  value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Address ── */}
        <div className="border-t border-zinc-800/80 pt-5">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Address</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  className={cn('input pl-9', errors.city && 'border-red-500/60 ring-2 ring-red-500/20')}
                  placeholder="Surat"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                />
              </div>
              {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="label">State</label>
              <input className="input" placeholder="Gujarat"
                value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Legal & Terms ── */}
        <div className="border-t border-zinc-800/80 pt-5">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Legal & Terms</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GSTIN</label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  className={cn('input pl-9 font-mono uppercase', errors.gstin && 'border-red-500/60 ring-2 ring-red-500/20')}
                  placeholder="27AABCA1234B1Z5"
                  maxLength={15}
                  value={form.gstin}
                  onChange={e => set('gstin', e.target.value.toUpperCase())}
                />
              </div>
              {errors.gstin && <p className="text-xs text-red-400 mt-1">{errors.gstin}</p>}
            </div>

            <div>
              <label className="label">PAN</label>
              <input className="input font-mono uppercase" placeholder="AABCA1234B"
                maxLength={10}
                value={form.pan}
                onChange={e => set('pan', e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="label">Lead Time (days)</label>
              <input className="input font-mono" type="number" placeholder="7"
                value={form.leadDays} onChange={e => set('leadDays', e.target.value)} />
            </div>

            <div>
              <label className="label">Payment Terms</label>
              <select className="input" value={form.paymentTerms}
                onChange={e => set('paymentTerms', e.target.value)}>
                <option>Advance</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
                <option>Cash on Delivery</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} placeholder="Any remarks about this supplier…"
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-800/60">
          <p className="text-2xs text-zinc-600">
            <span className="text-red-400">*</span> Required fields
          </p>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button
              className="btn-primary gap-2"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (editMode ? 'Save Changes' : 'Add Supplier')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ── Delete confirm modal ─────────────────────────────────────────────── */
function DeleteModal({ open, supplier, onConfirm, onClose, isDeleting }) {
  return (
    <Modal open={open} onClose={onClose} title="Remove Supplier" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Remove {supplier?.name}?</p>
            <p className="text-xs text-red-400/80 mt-0.5">
              This will permanently remove the supplier from the database.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button className="btn-danger flex items-center gap-1.5" onClick={onConfirm} disabled={isDeleting}>
            <Trash2 size={13} /> {isDeleting ? 'Removing...' : 'Yes, Remove'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── main page ───────────────────────────────────────────────────────── */
export default function SuppliersPage() {
  const { data: suppliersData, isLoading, error } = useSuppliers()
  const suppliers = suppliersData?.data || []
  const createSupplierMutation = useCreateSupplier()
  const updateSupplierMutation = useUpdateSupplier()
  const deleteSupplierMutation = useDeleteSupplier()

  const [search,       setSearch]       = useState('')
  const [showAdd,      setShowAdd]      = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast,        setToast]        = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase()) ||
    (s.yarnTypes || '').toLowerCase().includes(search.toLowerCase())
  )

  /* ── handlers ── */
  const handleAdd = async (form) => {
    try {
      await createSupplierMutation.mutateAsync({
        name: form.name || form.companyName,
        contactPerson: form.contactPerson,
        city: form.city,
        state: form.state,
        phone: form.phone,
        altPhone: form.altPhone,
        email: form.email,
        gstin: form.gstin,
        pan: form.pan,
        website: form.website,
        yarnTypes: form.yarnTypes,
        leadDays: form.leadDays,
        paymentTerms: form.paymentTerms,
        notes: form.notes,
        activePos: 0,
      })
      setShowAdd(false)
      showToast(`Supplier "${form.name}" added successfully!`)
    } catch (err) {
      showToast('Failed to add supplier: ' + (err?.message || err), 'error')
      throw err
    }
  }

  const handleEdit = async (form) => {
    const target = editTarget
    if (!target) return
    try {
      await updateSupplierMutation.mutateAsync({
        id: target.id,
        name: form.name || form.companyName,
        contactPerson: form.contactPerson,
        city: form.city,
        state: form.state,
        phone: form.phone,
        altPhone: form.altPhone,
        email: form.email,
        gstin: form.gstin,
        pan: form.pan,
        website: form.website,
        yarnTypes: form.yarnTypes,
        leadDays: form.leadDays,
        paymentTerms: form.paymentTerms,
        notes: form.notes,
      })
      setEditTarget(null)
      showToast(`Supplier "${form.name}" updated successfully!`)
    } catch (err) {
      showToast('Failed to update supplier: ' + (err?.message || err), 'error')
      throw err
    }
  }

  const handleDelete = async () => {
    const target = deleteTarget
    if (!target) return
    try {
      await deleteSupplierMutation.mutateAsync(target.id)
      setDeleteTarget(null)
      showToast(`Supplier "${target.name}" removed successfully!`)
    } catch (err) {
      showToast('Failed to delete supplier: ' + (err?.message || err), 'error')
    }
  }

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      {/* Visual Feedback Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-xl border text-sm font-semibold flex items-center gap-2 ${
          toast.type === 'error'
            ? 'bg-red-950/95 border-red-700 text-red-200'
            : 'bg-emerald-950/95 border-emerald-700 text-emerald-200'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''} registered`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input className="input-sm pl-8 w-48" placeholder="Search suppliers…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary btn-sm gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus size={14} />Add Supplier
            </button>
          </div>
        }
      />

      {/* ── Supplier cards grid ── */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Building2 size={32} className="text-zinc-700 mb-3" />
          <p className="text-sm font-semibold text-zinc-400">
            {search ? 'No suppliers match your search' : 'No suppliers yet'}
          </p>
          {!search && (
            <button className="btn-primary btn-sm mt-4" onClick={() => setShowAdd(true)}>
              <Plus size={13} />Add first supplier
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => {
            const color = AVATAR_COLORS[s.colorIdx % AVATAR_COLORS.length]
            return (
              <div key={s.id} className="card-hover p-5 group">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn(
                    'w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-base shrink-0 shadow-glow-sm',
                    color,
                  )}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-100 leading-tight">{s.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-zinc-600 shrink-0" />
                      <p className="text-xs text-zinc-500 truncate">{s.city}{s.state ? `, ${s.state}` : ''}</p>
                    </div>
                    {s.yarnTypes && (
                      <p className="text-2xs text-zinc-600 mt-0.5 truncate">
                        <Package size={9} className="inline mr-1" />{s.yarnTypes}
                      </p>
                    )}
                  </div>
                  {/* Actions — always visible */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      className="icon-btn !w-7 !h-7 !rounded-lg hover:!bg-primary-500/20 text-zinc-400 hover:text-primary-300 transition-colors"
                      title="Edit supplier"
                      onClick={() => setEditTarget(s)}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="icon-btn !w-7 !h-7 !rounded-lg hover:!bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Remove supplier"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs border-t border-zinc-800/60 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-zinc-600"><Phone size={10} />Phone</span>
                    <span className="font-mono text-zinc-300">{s.contact || s.phone}</span>
                  </div>

                  {s.email && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-zinc-600"><Mail size={10} />Email</span>
                      <span className="text-zinc-400 text-[10px] truncate max-w-[140px]">{s.email}</span>
                    </div>
                  )}

                  {s.gstin && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-zinc-600"><FileText size={10} />GSTIN</span>
                      <span className="font-mono text-2xs text-zinc-500">{s.gstin}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600">Active POs</span>
                    <span className={`badge ${s.activePos > 0 ? 'badge-blue' : 'badge-gray'}`}>
                      {s.activePos} PO{s.activePos !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {s.paymentTerms && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Terms</span>
                      <span className="text-zinc-400">{s.paymentTerms}</span>
                    </div>
                  )}

                  {s.leadDays && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Lead time</span>
                      <span className="text-zinc-400">{s.leadDays} days</span>
                    </div>
                  )}
                </div>

                {/* Footer with Edit / Delete buttons */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/40 flex justify-between items-center">
                  <span className="font-mono text-2xs text-zinc-600 truncate max-w-[100px]">{s.id}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="btn-secondary btn-xs text-xs px-2 py-1 gap-1 text-zinc-300 hover:text-white"
                      onClick={() => setEditTarget(s)}
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      className="btn-ghost btn-xs text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add modal ── */}
      <SupplierModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAdd}
        initial={BLANK}
        editMode={false}
        isSubmitting={createSupplierMutation.isPending}
      />

      {/* ── Edit modal ── */}
      <SupplierModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEdit}
        initial={editTarget
          ? {
              name:          editTarget.name,
              contactPerson: editTarget.contactPerson || '',
              city:          editTarget.city,
              state:         editTarget.state || '',
              phone:         editTarget.contact || editTarget.phone || '',
              altPhone:      editTarget.altPhone || '',
              email:         editTarget.email || '',
              gstin:         editTarget.gstin || '',
              pan:           editTarget.pan || '',
              website:       editTarget.website || '',
              yarnTypes:     editTarget.yarnTypes || '',
              leadDays:      editTarget.leadDays || '',
              paymentTerms:  editTarget.paymentTerms || 'Net 30',
              notes:         editTarget.notes || '',
            }
          : BLANK
        }
        editMode
        isSubmitting={updateSupplierMutation.isPending}
      />

      {/* ── Delete confirm ── */}
      <DeleteModal
        open={!!deleteTarget}
        supplier={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        isDeleting={deleteSupplierMutation.isPending}
      />
    </div>
  )
}
