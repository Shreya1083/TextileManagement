import { Save } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'

export default function MillSettings() {
  return (
    <div className="page-root max-w-2xl">
      <PageHeader title="Mill Settings" subtitle="Factory-wide configuration and preferences" />
      <div className="card p-6 space-y-5">
        <p className="text-sm font-bold text-zinc-200 border-b border-zinc-800/80 pb-3">Company Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Mill Name</label><input className="input" defaultValue="Everest Textile Mills" /></div>
          <div className="col-span-2"><label className="label">Address</label><textarea className="input" rows={2} defaultValue="Plot 14, GIDC Industrial Estate, Surat, Gujarat — 395004" /></div>
          <div><label className="label">GSTIN</label><input className="input" defaultValue="24AABCE1234F1Z2" /></div>
          <div><label className="label">Invoice Prefix</label><input className="input" defaultValue="INV" /></div>
          <div><label className="label">Currency</label><input className="input opacity-50 cursor-not-allowed" defaultValue="INR (₹)" readOnly /></div>
          <div><label className="label">Time Zone</label><select className="input"><option>Asia/Kolkata (IST +05:30)</option></select></div>
        </div>
        <div className="flex justify-end pt-2">
          <button className="btn-primary"><Save size={14} />Save Settings</button>
        </div>
      </div>
    </div>
  )
}
