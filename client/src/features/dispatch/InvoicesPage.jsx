import { Download } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge }      from '../../components/ui/Badge'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { formatDate, formatCurrencyFull } from '../../lib/utils'
import { exportPDF, exportExcel } from '../../lib/exportUtils'
import { useInvoices } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

const COLUMNS = ['Invoice', 'Buyer', 'Dispatch', 'Amount (₹)', 'Paid (₹)', 'Balance (₹)', 'Date', 'Status']

function buildRows(invoices) {
  return invoices.map(i => [
    i.invoiceId, i.buyer, i.dispatch, i.amount, i.paid, i.balance, formatDate(i.date), i.status,
  ])
}

export default function InvoicesPage() {
  const { data: invoicesData, isLoading, error } = useInvoices()
  const invoices = invoicesData?.data || []

  const total       = invoices.reduce((s, i) => s + i.amount, 0)
  const collected   = invoices.reduce((s, i) => s + i.paid, 0)
  const outstanding = invoices.reduce((s, i) => s + i.balance, 0)

  const handleExportPDF = () => exportPDF({
    title: 'Invoices', subtitle: 'Invoice and payment tracking',
    columns: COLUMNS, rows: buildRows(invoices), filename: 'Invoices',
  })
  const handleExportExcel = () => exportExcel({
    filename: 'Invoices', sheetName: 'Invoices', columns: COLUMNS, rows: buildRows(invoices),
  })

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader title="Invoices" subtitle="Invoice and payment tracking"
        actions={<ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />}
      />
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Invoiced',  value: formatCurrencyFull(total),       accent: 'bg-gradient-to-r from-blue-500 to-cyan-500',    color: 'text-blue-400'    },
          { label: 'Collected',       value: formatCurrencyFull(collected),   accent: 'bg-gradient-to-r from-emerald-500 to-teal-500', color: 'text-emerald-400' },
          { label: 'Outstanding',     value: formatCurrencyFull(outstanding), accent: 'bg-gradient-to-r from-red-500 to-orange-500',   color: 'text-red-400'     },
        ].map(c => (
          <div key={c.label} className="card p-5 relative overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-[2px] ${c.accent}`} />
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{c.label}</p>
            <p className={`text-2xl font-bold mt-1.5 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <div className="table-head"><p className="section-title">All Invoices</p></div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Invoice</th><th>Buyer</th><th>Dispatch</th><th>Amount</th>
              <th>Paid</th><th>Balance</th><th>Date</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{i.invoiceId}</td>
                <td className="font-semibold text-zinc-200">{i.buyer}</td>
                <td className="font-mono text-xs text-zinc-400">{i.dispatch}</td>
                <td className="font-mono text-xs font-bold">{formatCurrencyFull(i.amount)}</td>
                <td className="text-emerald-400 font-mono text-xs">{formatCurrencyFull(i.paid)}</td>
                <td className={i.balance > 0 ? 'text-red-400 font-bold font-mono text-xs' : 'text-zinc-600 text-xs'}>
                  {formatCurrencyFull(i.balance)}
                </td>
                <td className="text-zinc-400 text-xs">{formatDate(i.date)}</td>
                <td><Badge status={i.status} /></td>
                <td>
                  <button onClick={() => {
                    exportPDF({
                      title: `Invoice - ${i.invoiceId}`,
                      subtitle: `Buyer: ${i.buyer} | Date: ${formatDate(i.date)}`,
                      columns: ['Description', 'Amount'],
                      rows: [['Total Amount', i.amount], ['Paid', i.paid], ['Balance', i.balance]],
                      filename: `Invoice_${i.invoiceId}`
                    })
                  }} className="btn-ghost btn-xs gap-1 text-zinc-400">
                    <Download size={11} />PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
