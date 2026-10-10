import { useState, useEffect, useCallback } from 'react'
import { Save, Loader2, CheckCircle, Building2, Phone, Mail, FileText, Globe } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast }   from '../../components/ui/Toast'
import api from '../../lib/api'

const DEFAULT_SETTINGS = {
  millName: 'Everest Textile Mills',
  millAddress: 'Plot 14, GIDC Industrial Estate, Surat, Gujarat — 395004',
  millGstin: '24AABCE1234F1Z2',
  invoicePrefix: 'EVR',
  millPhone: '+91 261 2456789',
  millEmail: 'info@everesttextile.com',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
}

export default function MillSettings() {
  const toast = useToast()

  const [form, setForm] = useState(DEFAULT_SETTINGS)
  const [initialData, setInitialData] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Fetch current mill settings from backend API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/settings/mill')
      if (res.data?.success && res.data.data) {
        const loaded = {
          millName: res.data.data.millName || DEFAULT_SETTINGS.millName,
          millAddress: res.data.data.millAddress || DEFAULT_SETTINGS.millAddress,
          millGstin: res.data.data.millGstin || DEFAULT_SETTINGS.millGstin,
          invoicePrefix: res.data.data.invoicePrefix || DEFAULT_SETTINGS.invoicePrefix,
          millPhone: res.data.data.millPhone || DEFAULT_SETTINGS.millPhone,
          millEmail: res.data.data.millEmail || DEFAULT_SETTINGS.millEmail,
          currency: res.data.data.currency || 'INR',
          timezone: res.data.data.timezone || 'Asia/Kolkata',
        }
        setForm(loaded)
        setInitialData(loaded)
      }
    } catch (err) {
      console.warn('Could not fetch mill settings from API, using defaults:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setSavedSuccess(false)
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.millName?.trim()) errs.millName = 'Mill Name is required'
    if (!form.millAddress?.trim()) errs.millAddress = 'Mill Address is required'
    if (!form.invoicePrefix?.trim()) errs.invoicePrefix = 'Invoice prefix is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    if (!validate() || saving) return

    setSaving(true)
    setSavedSuccess(false)
    try {
      const payload = {
        millName: form.millName.trim(),
        millAddress: form.millAddress.trim(),
        millGstin: form.millGstin.trim().toUpperCase(),
        invoicePrefix: form.invoicePrefix.trim().toUpperCase(),
        millPhone: form.millPhone.trim(),
        millEmail: form.millEmail.trim(),
        currency: form.currency,
        timezone: form.timezone,
      }

      const res = await api.put('/settings/mill', payload)
      if (res.data?.success) {
        setInitialData(payload)
        setSavedSuccess(true)
        toast('Mill settings saved successfully!', 'success')
      } else {
        toast(res.data?.message || 'Failed to update mill settings', 'error')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error saving mill settings'
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialData)

  const handleReset = () => {
    setForm(initialData)
    setErrors({})
    setSavedSuccess(false)
  }

  return (
    <div className="page-root max-w-3xl">
      <PageHeader
        title="Mill Settings"
        subtitle="Factory-wide configuration, business credentials, and document prefixes"
      />

      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary-400" />
            <p className="text-sm font-bold text-zinc-200">Company & Factory Information</p>
          </div>
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle size={12} /> Changes Saved
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <Loader2 size={24} className="animate-spin text-primary-400" />
            <p className="text-xs">Loading mill configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mill Name */}
              <div className="md:col-span-2">
                <label className="label">
                  Mill Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="setting-mill-name"
                  className={`input ${errors.millName ? 'border-red-500' : ''}`}
                  value={form.millName}
                  onChange={e => handleChange('millName', e.target.value)}
                  placeholder="e.g. Everest Textile Mills"
                />
                {errors.millName && (
                  <p className="text-xs text-red-400 mt-1">{errors.millName}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="label">
                  Factory & Registered Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="setting-mill-address"
                  className={`input ${errors.millAddress ? 'border-red-500' : ''}`}
                  rows={2}
                  value={form.millAddress}
                  onChange={e => handleChange('millAddress', e.target.value)}
                  placeholder="Factory plot, industrial estate, city, state, pin"
                />
                {errors.millAddress && (
                  <p className="text-xs text-red-400 mt-1">{errors.millAddress}</p>
                )}
              </div>

              {/* GSTIN */}
              <div>
                <label className="label">GSTIN / Tax ID</label>
                <input
                  id="setting-mill-gstin"
                  className="input font-mono uppercase"
                  value={form.millGstin}
                  onChange={e => handleChange('millGstin', e.target.value)}
                  placeholder="24AABCE1234F1Z2"
                />
              </div>

              {/* Invoice Prefix */}
              <div>
                <label className="label">
                  Invoice Prefix <span className="text-red-400">*</span>
                </label>
                <input
                  id="setting-invoice-prefix"
                  className={`input font-mono uppercase ${errors.invoicePrefix ? 'border-red-500' : ''}`}
                  value={form.invoicePrefix}
                  onChange={e => handleChange('invoicePrefix', e.target.value)}
                  placeholder="EVR or INV"
                />
                {errors.invoicePrefix && (
                  <p className="text-xs text-red-400 mt-1">{errors.invoicePrefix}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <Phone size={12} className="text-zinc-500" /> Factory Contact Phone
                </label>
                <input
                  id="setting-mill-phone"
                  className="input"
                  value={form.millPhone}
                  onChange={e => handleChange('millPhone', e.target.value)}
                  placeholder="+91 261 2456789"
                />
              </div>

              {/* Email */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <Mail size={12} className="text-zinc-500" /> Official Email
                </label>
                <input
                  id="setting-mill-email"
                  type="email"
                  className="input"
                  value={form.millEmail}
                  onChange={e => handleChange('millEmail', e.target.value)}
                  placeholder="contact@everesttextile.com"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <Globe size={12} className="text-zinc-500" /> Default Currency
                </label>
                <select
                  id="setting-mill-currency"
                  className="input"
                  value={form.currency}
                  onChange={e => handleChange('currency', e.target.value)}
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                </select>
              </div>

              {/* Time Zone */}
              <div>
                <label className="label">Time Zone</label>
                <select
                  id="setting-mill-timezone"
                  className="input"
                  value={form.timezone}
                  onChange={e => handleChange('timezone', e.target.value)}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <span className="text-xs text-zinc-500">
                {isDirty ? '● Unsaved changes pending' : 'All settings up to date'}
              </span>

              <div className="flex items-center gap-3">
                {isDirty && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={handleReset}
                    disabled={saving}
                  >
                    Reset
                  </button>
                )}

                <button
                  id="save-settings-btn"
                  type="submit"
                  className="btn-primary btn-sm flex items-center gap-2"
                  disabled={saving || !isDirty}
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
