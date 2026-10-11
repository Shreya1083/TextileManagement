import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { PageHeader }         from '../../components/ui/PageHeader'
import { ExportMenu }         from '../../components/ui/ExportMenu'
import { formatCurrencyFull } from '../../lib/utils'
import { exportPDF, exportExcel } from '../../lib/exportUtils'
import { usePnL } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="text-zinc-500 text-xs mb-1.5 font-medium">{label} 2026</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {formatCurrencyFull(p.value)}
        </p>
      ))}
    </div>
  )
}

const PNL_COLUMNS = ['Month', 'Revenue (₹)', 'Material Cost (₹)', 'Labor Cost (₹)', 'Overhead (₹)', 'Total Cost (₹)', 'Net Profit (₹)', 'Margin %']

export default function PnLPage() {
  const { data: pnlData, isLoading, error } = usePnL('2026-04-01', '2026-09-30')
  const data = pnlData?.data || []
  
  const last = data.length > 0 ? data[data.length - 1] : { profit: 0, revenue: 0, cost: 0 }
  const marginPct = last.revenue > 0 ? ((last.profit / last.revenue) * 100).toFixed(1) : 0

  const buildRows = () => data.map(d => [
    `${d.month} 2026`,
    d.revenue,
    d.materialCost,
    d.laborCost,
    d.overheadCost,
    d.cost,
    d.profit,
    d.revenue > 0 ? `${((d.profit / d.revenue) * 100).toFixed(1)}%` : '0%'
  ])

  const handleExportPDF = () => exportPDF({
    title: 'Monthly P&L', subtitle: 'Profit and loss — last 6 months',
    columns: PNL_COLUMNS, rows: buildRows(), filename: 'PnL_Report',
  })
  const handleExportExcel = () => exportExcel({
    filename: 'PnL_Report', sheetName: 'P&L', columns: PNL_COLUMNS, rows: buildRows(),
  })

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader title="Monthly P&L" subtitle="Profit and loss — last 6 months"
        actions={<ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />}
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Revenue (Sep)', value: formatCurrencyFull(last.revenue), color: 'text-blue-400', accent: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
          { label: 'Total Cost (Sep)', value: formatCurrencyFull(last.cost), color: 'text-red-400', accent: 'bg-gradient-to-r from-red-500 to-orange-500' },
          {
            label: last.profit < 0 ? 'Net Loss (Sep)' : 'Net Profit (Sep)',
            value: last.profit < 0 ? `-${formatCurrencyFull(Math.abs(last.profit))}` : formatCurrencyFull(last.profit),
            color: last.profit < 0 ? 'text-red-400' : 'text-emerald-400',
            accent: last.profit < 0 ? 'bg-gradient-to-r from-red-600 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
          },
        ].map(c => (
          <div key={c.label} className="card p-5 relative overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-[2px] ${c.accent}`} />
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{c.label}</p>
            <p className={`text-2xl font-bold mt-2 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <p className="section-title">P&L Trend</p>
            <p className="text-xs text-zinc-500 mt-0.5">Revenue, cost and profit over 6 months</p>
          </div>
          <span className={`badge ${Number(marginPct) < 0 ? 'badge-red' : 'badge-green'}`}>
            Margin {marginPct}%
          </span>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fill:'#52525b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/100000).toFixed(0)}L`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="none"          strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="cost"    name="Cost"    stroke="#ef4444" fill="none"          strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#10b981" fill="url(#gProfit)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-head"><p className="section-title">Monthly Breakdown</p></div>
        <table className="table-base">
          <thead><tr><th>Month</th><th>Revenue</th><th>Material Cost</th><th>Labor Cost</th><th>Overhead</th><th>Total Cost</th><th>Net Profit / Loss</th><th>Margin</th></tr></thead>
          <tbody>
            {data.map(d => {
              const isLoss = d.profit < 0
              const margin = d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : 0
              return (
                <tr key={d.month}>
                  <td className="font-semibold text-zinc-200">{d.month} 2026</td>
                  <td className="text-blue-400 font-mono">{formatCurrencyFull(d.revenue)}</td>
                  <td className="text-red-400/80 font-mono text-xs">{formatCurrencyFull(d.materialCost)}</td>
                  <td className="text-red-400/80 font-mono text-xs">{formatCurrencyFull(d.laborCost)}</td>
                  <td className="text-red-400/80 font-mono text-xs">{formatCurrencyFull(d.overheadCost)}</td>
                  <td className="text-red-400 font-mono">{formatCurrencyFull(d.cost)}</td>
                  <td className={`font-bold font-mono ${isLoss ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isLoss ? `-${formatCurrencyFull(Math.abs(d.profit))}` : formatCurrencyFull(d.profit)}
                  </td>
                  <td>
                    <span className={`badge ${isLoss ? 'badge-red' : 'badge-green'}`}>
                      {margin}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
