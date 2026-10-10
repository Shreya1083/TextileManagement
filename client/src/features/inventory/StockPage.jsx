import { useState } from 'react'
import { Search, AlertTriangle, Plus, TrendingDown } from 'lucide-react'
import { Badge }      from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { mockYarnStock } from '../../mocks/data'
import { cn } from '../../lib/utils'

function StockBar({ current, reserved, reorder }) {
  const available = current - reserved
  const usedPct   = Math.min(100, (reserved / current) * 100)
  const okPct     = Math.min(100, (available / (reorder * 2)) * 100)
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', available <= 0 ? 'bg-red-500' : available < reorder ? 'bg-amber-500' : 'bg-emerald-500')}
          style={{ width: `${Math.min(100, (available / (reorder * 2)) * 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function StockPage() {
  const [search, setSearch] = useState('')
  const filtered = mockYarnStock.filter(y =>
    y.type.toLowerCase().includes(search.toLowerCase()) ||
    y.colour.toLowerCase().includes(search.toLowerCase())
  )
  const lowCount = mockYarnStock.filter(y => y.status !== 'OK').length

  return (
    <div className="page-root">
      <PageHeader
        title="Stock Levels"
        subtitle="Current, reserved and available yarn inventory"
        actions={<button className="btn-primary btn-sm"><Plus size={14} />Add GRN</button>}
      />

      {lowCount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={14} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-300">{lowCount} items below reorder level</p>
            <p className="text-xs text-amber-500/80 mt-0.5">Raise purchase orders to avoid production delays.</p>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <div className="table-head">
          <p className="section-title">Yarn Inventory <span className="text-zinc-600 font-normal text-xs ml-1">{filtered.length} items</span></p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input className="input-sm pl-8 w-48" placeholder="Search yarn…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table className="table-base">
          <thead><tr>
            <th>Yarn Type</th><th>Colour</th><th>Current</th>
            <th>Reserved</th><th>Available</th><th>Reorder Level</th><th>Availability</th><th>Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(y => {
              const available = y.current - y.reserved
              return (
                <tr key={y.id}>
                  <td className="font-semibold text-zinc-200">{y.type}</td>
                  <td className="text-zinc-400">{y.colour}</td>
                  <td className="font-mono text-xs text-zinc-300">{y.current.toLocaleString()} {y.unit}</td>
                  <td className="font-mono text-xs text-amber-400">{y.reserved.toLocaleString()}</td>
                  <td className={cn('font-mono text-xs font-bold', available <= 0 ? 'text-red-400' : available < y.reorder ? 'text-amber-400' : 'text-emerald-400')}>
                    {available.toLocaleString()}
                  </td>
                  <td className="font-mono text-xs text-zinc-600">{y.reorder.toLocaleString()}</td>
                  <td><StockBar current={y.current} reserved={y.reserved} reorder={y.reorder} /></td>
                  <td><Badge status={y.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
