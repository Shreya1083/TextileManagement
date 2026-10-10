import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { mockWorkers } from '../../mocks/data'
import { formatCurrencyFull } from '../../lib/utils'

const DEPT_COLORS = { Production:'from-primary-500 to-violet-600', QC:'from-emerald-500 to-teal-600', Store:'from-cyan-500 to-blue-600' }

export default function WorkersPage() {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="page-root">
      <PageHeader
        title="Workers"
        subtitle={`${mockWorkers.length} employees registered`}
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />Add Worker</button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockWorkers.map(w => (
          <div key={w.id} className="card-hover p-5 cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${DEPT_COLORS[w.dept] || 'from-zinc-600 to-zinc-700'} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {w.name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-zinc-100 text-sm truncate">{w.name}</p>
                <p className="text-xs text-zinc-500 truncate">{w.role}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs border-t border-zinc-800/60 pt-3">
              <div className="flex justify-between"><span className="text-zinc-600">Dept</span><span className="badge badge-purple">{w.dept}</span></div>
              <div className="flex justify-between"><span className="text-zinc-600">Daily Wage</span><span className="text-zinc-300 font-mono">₹{w.wage}</span></div>
              <div className="flex justify-between"><span className="text-zinc-600">Days (Sep)</span><span className="text-emerald-400 font-bold">{w.present}</span></div>
              <div className="flex justify-between pt-1 border-t border-zinc-800/60">
                <span className="text-zinc-500 font-semibold">Net Pay</span>
                <span className="font-bold text-zinc-100">{formatCurrencyFull(w.net)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Worker">
        <div className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Role</label><input className="input" /></div>
            <div><label className="label">Department</label>
              <select className="input"><option>Production</option><option>QC</option><option>Store</option></select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Daily Wage (₹)</label><input className="input" type="number" /></div>
            <div><label className="label">Basis</label>
              <select className="input"><option>Daily</option><option>Piece Rate</option></select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary">Save Worker</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
