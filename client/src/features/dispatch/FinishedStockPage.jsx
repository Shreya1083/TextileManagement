import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { mockRolls }  from '../../mocks/data'
import { formatDate } from '../../lib/utils'

export default function FinishedStockPage() {
  const stock = mockRolls.filter(r => r.status === 'PASSED')
  return (
    <div className="page-root">
      <PageHeader title="Finished Goods" subtitle={`${stock.length} rolls ready for dispatch`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Rolls in Stock', value:stock.length,                              color:'text-zinc-50' },
          { label:'Total Metres',   value:`${stock.reduce((s,r)=>s+r.length,0)} m`,  color:'text-emerald-400' },
          { label:'Orders',         value:[...new Set(stock.map(r=>r.order))].length, color:'text-primary-400' },
          { label:'All QC Passed',  value:'✓ Ready',                                 color:'text-emerald-400' },
        ].map(c => (
          <div key={c.label} className="card p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Roll ID</th><th>Order</th><th>Machine</th><th>Length</th><th>Produced</th><th>Inspector</th><th>Status</th></tr></thead>
          <tbody>
            {stock.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{r.id}</td>
                <td className="font-mono text-xs text-zinc-400">{r.order}</td>
                <td className="font-mono text-xs text-zinc-600">{r.machine}</td>
                <td className="font-bold text-emerald-400">{r.length} m</td>
                <td className="text-zinc-400 text-xs">{formatDate(r.produced)}</td>
                <td className="text-zinc-400">{r.inspector}</td>
                <td><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
