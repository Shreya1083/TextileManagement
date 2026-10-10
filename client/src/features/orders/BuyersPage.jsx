import { useState } from 'react'
import { Plus, MapPin, Phone, TrendingUp } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'

const mockBuyers = [
  { id:'B-01', name:'Sharma Fabrics',  city:'Mumbai',    contact:'+91 98000 11111', gstin:'27AABCS1234B1Z1', orders:8, outstanding:107000 },
  { id:'B-02', name:'Mehta Textiles',  city:'Surat',     contact:'+91 98000 22222', gstin:'24AABCM5678C1Z3', orders:5, outstanding:0      },
  { id:'B-03', name:'Patel Exports',   city:'Jaipur',    contact:'+91 98000 33333', gstin:'08AABCP9012D1Z5', orders:4, outstanding:0      },
  { id:'B-04', name:'Global Garments', city:'Delhi',     contact:'+91 98000 44444', gstin:'07AABCG3456E1Z7', orders:3, outstanding:0      },
  { id:'B-05', name:'Sunrise Mills',   city:'Ahmedabad', contact:'+91 98000 55555', gstin:'24AABCSR789F1Z9', orders:6, outstanding:85000  },
  { id:'B-06', name:'Kapoor Garments', city:'Ludhiana',  contact:'+91 98000 66666', gstin:'03AABCK2345G1Z1', orders:2, outstanding:0      },
]

const COLORS = ['from-primary-500 to-violet-600','from-cyan-500 to-blue-600','from-emerald-500 to-teal-600','from-amber-500 to-orange-600','from-pink-500 to-rose-600','from-purple-500 to-violet-600']

export default function BuyersPage() {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div className="page-root">
      <PageHeader
        title="Buyers"
        subtitle={`${mockBuyers.length} registered buyers`}
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />Add Buyer</button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockBuyers.map((b, i) => (
          <div key={b.id} className="card-hover p-5 cursor-pointer">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-glow-sm`}>
                {b.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-zinc-100">{b.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-zinc-600" />
                  <p className="text-xs text-zinc-500">{b.city}</p>
                </div>
              </div>
              {b.outstanding > 0 && <span className="badge badge-red shrink-0">Overdue</span>}
            </div>
            <div className="space-y-2 text-xs pt-3 border-t border-zinc-800/60">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-zinc-600"><Phone size={10} />Contact</span>
                <span className="font-mono text-zinc-300">{b.contact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Total Orders</span>
                <span className="font-bold text-zinc-200 flex items-center gap-1"><TrendingUp size={10} className="text-emerald-400" />{b.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Outstanding</span>
                <span className={b.outstanding > 0 ? 'font-bold text-red-400' : 'text-emerald-400 font-semibold'}>
                  {b.outstanding > 0 ? `₹${b.outstanding.toLocaleString('en-IN')}` : 'Cleared'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Buyer">
        <div className="space-y-4">
          <div><label className="label">Company Name</label><input className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">City</label><input className="input" /></div>
            <div><label className="label">Contact</label><input className="input" /></div>
          </div>
          <div><label className="label">GSTIN</label><input className="input" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary">Save Buyer</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
