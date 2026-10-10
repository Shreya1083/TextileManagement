import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { useMillSettings, useUpdateMillSetting, useCreateMillSetting } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

export default function MillSettings() {
  const { data: settingsData, isLoading, error } = useMillSettings()
  const settings = settingsData?.data?.[0] || null

  const createMutation = useCreateMillSetting()
  const updateMutation = useUpdateMillSetting()

  const [formData, setFormData] = useState({
    name: 'Everest Textile Mills',
    address: 'Plot 14, GIDC Industrial Estate, Surat, Gujarat — 395004',
    gstin: '24AABCE1234F1Z2',
    invoicePrefix: 'INV',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST +05:30)',
  })

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleSave = async () => {
    try {
      if (settings?.id) {
        await updateMutation.mutateAsync({ id: settings.id, data: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      alert('Settings saved successfully!')
    } catch (err) {
      console.error(err)
    }
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root max-w-2xl">
      <PageHeader title="Mill Settings" subtitle="Factory-wide configuration and preferences" />
      <div className="card p-6 space-y-5">
        <p className="text-sm font-bold text-zinc-200 border-b border-zinc-800/80 pb-3">Company Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Mill Name</label><input name="name" className="input" value={formData.name} onChange={handleChange} /></div>
          <div className="col-span-2"><label className="label">Address</label><textarea name="address" className="input" rows={2} value={formData.address} onChange={handleChange} /></div>
          <div><label className="label">GSTIN</label><input name="gstin" className="input" value={formData.gstin} onChange={handleChange} /></div>
          <div><label className="label">Invoice Prefix</label><input name="invoicePrefix" className="input" value={formData.invoicePrefix} onChange={handleChange} /></div>
          <div><label className="label">Currency</label><input name="currency" className="input opacity-50 cursor-not-allowed" value={formData.currency} readOnly /></div>
          <div><label className="label">Time Zone</label>
            <select name="timezone" className="input" value={formData.timezone} onChange={handleChange}>
              <option value="Asia/Kolkata (IST +05:30)">Asia/Kolkata (IST +05:30)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button className="btn-primary" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
            <Save size={14} />Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
