import { useState } from 'react'
import { Plus, Search, Building2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { mockSuppliers } from '../../mocks/data'

export default function SuppliersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch]   = useState('')
  const filtered = mockSuppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="page-root">
      <PageHeader title="Suppliers" subtitle="Yarn and material supplier management"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />Add Supplier</button>}
      />
      <div className="table-wrap">
        <div className="table-head">
          <p className="section-title">{filtered.length} Suppliers</p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input className="input-sm pl-8 w-48" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table className="table-base">
          <thead><tr><th>ID</th><th>Name</th><th>City</th><th>Contact</th><th>GSTIN</th><th>Active POs</th></tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td className="font-mono text-2xs text-zinc-600">{s.id}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary-500/15 flex items-center justify-center">
                      <Building2 size={13} className="text-primary-400" />
                    </div>
                    <span className="font-semibold text-zinc-200">{s.name}</span>
                  </div>
                </td>
                <td className="text-zinc-400">{s.city}</td>
                <td className="font-mono text-xs text-zinc-300">{s.contact}</td>
                <td className="font-mono text-2xs text-zinc-600">{s.gstin}</td>
                <td><span className={`badge ${s.activePos > 0 ? 'badge-blue' : 'badge-gray'}`}>{s.activePos} PO{s.activePos !== 1 ? 's' : ''}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Supplier">
        <div className="space-y-4">
          <div><label className="label">Company Name</label><input className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">City</label><input className="input" /></div>
            <div><label className="label">Contact</label><input className="input" /></div>
          </div>
          <div><label className="label">GSTIN</label><input className="input" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary">Save Supplier</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
