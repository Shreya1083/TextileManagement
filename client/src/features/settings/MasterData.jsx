import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'

const initStages  = ['Spinning', 'Weaving', 'Dyeing', 'Finishing']
const initFabrics = ['Cotton Voile', 'Linen Blend', 'Silk Chiffon', 'Denim', 'Poly Cotton', 'Georgette']
const initDefects = ['Colour Mismatch', 'Uneven Weave', 'Stain', 'Hole', 'Other']

function ListEditor({ title, items }) {
  const [list, setList] = useState(items)
  const [input, setInput] = useState('')
  const add = () => { if (input.trim()) { setList(l => [...l, input.trim()]); setInput('') } }
  return (
    <div className="card p-5">
      <p className="text-sm font-bold text-zinc-200 mb-4">{title}</p>
      <div className="flex gap-2 mb-3">
        <input className="input flex-1 text-xs" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} placeholder={`Add ${title.toLowerCase()}…`} />
        <button className="btn-primary btn-sm" onClick={add}><Plus size={12} />Add</button>
      </div>
      <ul className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
        {list.map((item, i) => (
          <li key={i} className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-3 py-2 text-sm">
            <span className="text-zinc-300">{item}</span>
            <button className="text-zinc-700 hover:text-red-400 transition-colors p-1" onClick={() => setList(l => l.filter((_,j)=>j!==i))}>
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MasterData() {
  return (
    <div className="page-root">
      <PageHeader title="Master Data" subtitle="Configurable stages, fabric types, defect types and shifts" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ListEditor title="Production Stages" items={initStages} />
        <ListEditor title="Fabric Types"      items={initFabrics} />
        <ListEditor title="Defect Types"      items={initDefects} />
      </div>
      <div className="card p-5">
        <p className="text-sm font-bold text-zinc-200 mb-4">Shifts</p>
        <div className="space-y-2">
          {[{name:'Morning',start:'06:00',end:'14:00'},{name:'Afternoon',start:'14:00',end:'22:00'},{name:'Night',start:'22:00',end:'06:00'}].map(s => (
            <div key={s.name} className="flex items-center gap-4 bg-zinc-800/60 rounded-xl px-4 py-3">
              <span className="font-semibold text-zinc-200 w-24 text-sm">{s.name}</span>
              <input className="input-sm flex-1" defaultValue={s.start} />
              <span className="text-zinc-600 text-xs">to</span>
              <input className="input-sm flex-1" defaultValue={s.end} />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button className="btn-primary btn-sm">Save Shifts</button>
        </div>
      </div>
    </div>
  )
}
