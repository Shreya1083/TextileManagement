import { PageHeader }         from '../../components/ui/PageHeader'
import { mockWorkers }        from '../../mocks/data'
import { formatCurrencyFull } from '../../lib/utils'

export default function WagesPage() {
  const total   = mockWorkers.reduce((s, w) => s + w.net, 0)
  const avgDays = (mockWorkers.reduce((s, w) => s + w.present, 0) / mockWorkers.length).toFixed(1)
  return (
    <div className="page-root">
      <PageHeader title="Wage Sheet" subtitle="September 2026 — Monthly payroll"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm">Export CSV</button>
            <button className="btn-primary btn-sm">Generate Payroll</button>
          </div>
        }
      />
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total Wages', value:formatCurrencyFull(total), color:'text-zinc-50',     accent:'bg-gradient-to-r from-primary-500 to-violet-500' },
          { label:'Workers',     value:mockWorkers.length,         color:'text-zinc-50',     accent:'bg-gradient-to-r from-cyan-500 to-blue-500'      },
          { label:'Avg Days',    value:avgDays,                    color:'text-emerald-400', accent:'bg-gradient-to-r from-emerald-500 to-teal-500'   },
        ].map(c => (
          <div key={c.label} className="card p-5 relative overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-[2px] ${c.accent}`} />
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{c.label}</p>
            <p className={`text-2xl font-bold mt-1.5 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Daily Rate</th><th>Days</th><th>Gross</th><th>Deductions</th><th>Net Pay</th></tr></thead>
          <tbody>
            {mockWorkers.map(w => (
              <tr key={w.id}>
                <td className="font-mono text-2xs text-zinc-600">{w.id}</td>
                <td className="font-semibold text-zinc-200">{w.name}</td>
                <td className="text-zinc-400 text-xs">{w.role}</td>
                <td className="font-mono text-xs text-zinc-300">₹{w.wage}/day</td>
                <td className="text-center font-bold text-emerald-400">{w.present}</td>
                <td className="font-mono text-xs">{formatCurrencyFull(w.wage * w.present)}</td>
                <td className="text-zinc-600 text-xs">₹0</td>
                <td className="font-bold text-zinc-100 font-mono">{formatCurrencyFull(w.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3.5 border-t border-zinc-800/80 flex justify-end">
          <p className="text-sm font-bold text-zinc-200">Total: <span className="text-primary-400 font-mono ml-1">{formatCurrencyFull(total)}</span></p>
        </div>
      </div>
    </div>
  )
}
