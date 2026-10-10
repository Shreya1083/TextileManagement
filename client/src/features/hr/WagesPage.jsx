import { PageHeader }         from '../../components/ui/PageHeader'
import { ExportMenu }         from '../../components/ui/ExportMenu'
import { formatCurrencyFull } from '../../lib/utils'
import { exportPDF, exportExcel } from '../../lib/exportUtils'
import { useWages } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const TITLE    = 'Wage Sheet'
const SUBTITLE = 'September 2026 — Monthly payroll'
const COLUMNS  = ['ID', 'Name', 'Role', 'Daily Rate (₹)', 'Days Present', 'Gross (₹)', 'Deductions (₹)', 'Net Pay (₹)']

function buildRows(workers) {
  return workers.map(w => {
    const present = w.present || 26
    const net = w.wage * present
    return [
      w.workerId,
      w.name,
      w.role,
      w.wage,
      present,
      w.wage * present,
      0,
      net,
    ]
  })
}

export default function WagesPage() {
  const { data: wagesData, isLoading, error } = useWages('09', '2026')
  const wages = wagesData?.data || []

  // Map to workersWithAttendance
  const workersWithAttendance = wages.map(w => ({
    workerId: w.workerId,
    name: w.name,
    role: w.role,
    wage: w.wage,
    present: w.daysPresent,
    net: w.netPay
  }))

  const total   = workersWithAttendance.reduce((s, w) => s + w.net, 0)
  const avgDays = workersWithAttendance.length ? (workersWithAttendance.reduce((s, w) => s + w.present, 0) / workersWithAttendance.length).toFixed(1) : 0

  const handleExportPDF = () => exportPDF({
    title: TITLE, subtitle: SUBTITLE, columns: COLUMNS, rows: buildRows(workersWithAttendance),
    filename: 'WageSheet_Sep2026',
  })
  const handleExportExcel = () => exportExcel({
    filename: 'WageSheet_Sep2026', sheetName: 'Wages', columns: COLUMNS, rows: buildRows(workersWithAttendance),
  })

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader title={TITLE} subtitle={SUBTITLE}
        actions={
          <div className="flex gap-2">
            <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
            <button className="btn-primary btn-sm">Generate Payroll</button>
          </div>
        }
      />
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total Wages', value:formatCurrencyFull(total), color:'text-zinc-50',     accent:'bg-gradient-to-r from-primary-500 to-violet-500' },
          { label:'Workers',     value:workersWithAttendance.length,         color:'text-zinc-50',     accent:'bg-gradient-to-r from-cyan-500 to-blue-500'      },
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
            {workersWithAttendance.map(w => (
              <tr key={w.workerId}>
                <td className="font-mono text-2xs text-zinc-600">{w.workerId}</td>
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
