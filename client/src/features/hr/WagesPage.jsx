import { useState } from 'react'
import { PageHeader }         from '../../components/ui/PageHeader'
import { Modal }              from '../../components/ui/Modal'
import { ExportMenu }         from '../../components/ui/ExportMenu'
import { useToast }           from '../../components/ui/Toast'
import { mockWorkers }        from '../../mocks/data'
import { formatCurrencyFull } from '../../lib/utils'
import { exportPDF, exportExcel } from '../../lib/exportUtils'

const TITLE    = 'Wage Sheet'
const SUBTITLE = 'September 2026 — Monthly payroll'
const COLUMNS  = ['ID', 'Name', 'Role', 'Daily Rate (₹)', 'Days Present', 'Gross (₹)', 'Deductions (₹)', 'Net Pay (₹)']

function buildRows(workers) {
  return workers.map(w => [w.id, w.name, w.role, w.wage, w.present, w.wage * w.present, 0, w.net])
}

export default function WagesPage() {
  const toast = useToast()
  const [workers] = useState(mockWorkers)
  const [generated, setGenerated]   = useState(false)
  const [showPayslip, setShowPayslip] = useState(null)
  const [generating, setGenerating] = useState(false)

  const total   = workers.reduce((s, w) => s + w.net, 0)
  const avgDays = (workers.reduce((s, w) => s + w.present, 0) / workers.length).toFixed(1)

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      toast('Payroll generated for September 2026', 'success')
    }, 1200)
  }

  const handleExportPDF = () => exportPDF({
    title: TITLE, subtitle: SUBTITLE, columns: COLUMNS, rows: buildRows(workers), filename: 'WageSheet_Sep2026',
  })
  const handleExportExcel = () => exportExcel({
    filename: 'WageSheet_Sep2026', sheetName: 'Wages', columns: COLUMNS, rows: buildRows(workers),
  })

  const handlePayslipPDF = async (w) => {
    await exportPDF({
      title: `Payslip — ${w.name}`,
      subtitle: `September 2026 · ${w.role}`,
      filename: `Payslip_${w.id}_Sep2026`,
      columns: ['Field', 'Value'],
      rows: [
        ['Worker ID',     w.id],
        ['Name',          w.name],
        ['Role',          w.role],
        ['Department',    w.dept],
        ['Daily Rate',    `₹${w.wage}`],
        ['Days Present',  String(w.present)],
        ['Gross Pay',     formatCurrencyFull(w.wage * w.present)],
        ['Deductions',    '₹0'],
        ['Net Pay',       formatCurrencyFull(w.net)],
      ],
    })
    toast(`Payslip for ${w.name} downloaded`, 'success')
  }

  return (
    <div className="page-root">
      <PageHeader title={TITLE} subtitle={SUBTITLE}
        actions={
          <div className="flex gap-2">
            <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
            <button
              className="btn-primary btn-sm"
              onClick={handleGenerate}
              disabled={generating || generated}
            >
              {generating ? 'Generating…' : generated ? '✓ Payroll Generated' : 'Generate Payroll'}
            </button>
          </div>
        }
      />

      {generated && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 text-sm">✓</span>
          </div>
          <p className="text-sm text-emerald-300 font-semibold">
            Payroll generated for September 2026 — {workers.length} workers · Total: {formatCurrencyFull(total)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total Wages', value:formatCurrencyFull(total), color:'text-zinc-50',     accent:'bg-gradient-to-r from-primary-500 to-violet-500' },
          { label:'Workers',     value:workers.length,             color:'text-zinc-50',     accent:'bg-gradient-to-r from-cyan-500 to-blue-500'      },
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
          <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Daily Rate</th><th>Days</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th></th></tr></thead>
          <tbody>
            {workers.map(w => (
              <tr key={w.id}>
                <td className="font-mono text-2xs text-zinc-600">{w.id}</td>
                <td className="font-semibold text-zinc-200">{w.name}</td>
                <td className="text-zinc-400 text-xs">{w.role}</td>
                <td className="font-mono text-xs text-zinc-300">₹{w.wage}/day</td>
                <td className="text-center font-bold text-emerald-400">{w.present}</td>
                <td className="font-mono text-xs">{formatCurrencyFull(w.wage * w.present)}</td>
                <td className="text-zinc-600 text-xs">₹0</td>
                <td className="font-bold text-zinc-100 font-mono">{formatCurrencyFull(w.net)}</td>
                <td>
                  <button className="btn-ghost btn-xs text-zinc-500 hover:text-primary-400"
                    onClick={() => setShowPayslip(w)}>
                    Payslip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3.5 border-t border-zinc-800/80 flex justify-end">
          <p className="text-sm font-bold text-zinc-200">Total: <span className="text-primary-400 font-mono ml-1">{formatCurrencyFull(total)}</span></p>
        </div>
      </div>

      {/* Payslip Modal */}
      <Modal open={!!showPayslip} onClose={()=>setShowPayslip(null)} title="Worker Payslip" description={`${showPayslip?.name} · September 2026`} size="sm">
        {showPayslip && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[['Worker ID',showPayslip.id],['Role',showPayslip.role],['Daily Rate',`₹${showPayslip.wage}`],['Days Present',String(showPayslip.present)],['Gross Pay',formatCurrencyFull(showPayslip.wage*showPayslip.present)],['Deductions','₹0']].map(([l,v])=>(
                <div key={l} className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1">{l}</p>
                  <p className="text-sm font-bold text-zinc-100">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-primary-500/10 border border-primary-500/25 rounded-xl px-4 py-3">
              <span className="text-sm font-bold text-zinc-200">Net Pay</span>
              <span className="text-xl font-black text-primary-300">{formatCurrencyFull(showPayslip.net)}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-primary btn-sm flex-1" onClick={()=>{ handlePayslipPDF(showPayslip); setShowPayslip(null) }}>
                Download PDF
              </button>
              <button className="btn-secondary btn-sm" onClick={()=>setShowPayslip(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
