import { useState } from 'react'
import { Download } from 'lucide-react'
import { PageHeader }  from '../../components/ui/PageHeader'
import { Badge }       from '../../components/ui/Badge'
import { Modal }       from '../../components/ui/Modal'
import { ExportMenu }  from '../../components/ui/ExportMenu'
import { useToast }    from '../../components/ui/Toast'
import { mockInvoices } from '../../mocks/data'
import { formatDate, formatCurrencyFull } from '../../lib/utils'
import { exportPDF, exportExcel } from '../../lib/exportUtils'

const COLUMNS = ['Invoice', 'Buyer', 'Dispatch', 'Amount (₹)', 'Paid (₹)', 'Balance (₹)', 'Date', 'Status']
const BLANK_PAYMENT = { amount: '' }

function buildRows(invoices) {
  return invoices.map(i => [i.id, i.buyer, i.dispatch, i.amount, i.paid, i.balance, formatDate(i.date), i.status])
}

export default function InvoicesPage() {
  const toast = useToast()
  const [invoices, setInvoices]     = useState(mockInvoices)
  const [payInvoice, setPayInvoice] = useState(null)   // invoice to record payment on
  const [viewInvoice, setViewInvoice] = useState(null)
  const [payForm, setPayForm]       = useState(BLANK_PAYMENT)
  const [payError, setPayError]     = useState('')
  const [pdfLoading, setPdfLoading] = useState(null)   // id of invoice being downloaded

  const total       = invoices.reduce((s, i) => s + i.amount, 0)
  const collected   = invoices.reduce((s, i) => s + i.paid, 0)
  const outstanding = invoices.reduce((s, i) => s + i.balance, 0)

  const handleExportPDF = () => exportPDF({ title:'Invoices', subtitle:'Invoice and payment tracking', columns:COLUMNS, rows:buildRows(invoices), filename:'Invoices' })
  const handleExportExcel = () => exportExcel({ filename:'Invoices', sheetName:'Invoices', columns:COLUMNS, rows:buildRows(invoices) })

  const handleSinglePDF = async (inv) => {
    setPdfLoading(inv.id)
    try {
      await exportPDF({
        title: `Invoice ${inv.id}`,
        subtitle: `${inv.buyer} · ${formatDate(inv.date)}`,
        filename: inv.id,
        columns: ['Field', 'Value'],
        rows: [
          ['Invoice No',   inv.id],
          ['Buyer',        inv.buyer],
          ['Dispatch Ref', inv.dispatch],
          ['Invoice Date', formatDate(inv.date)],
          ['Amount',       formatCurrencyFull(inv.amount)],
          ['Paid',         formatCurrencyFull(inv.paid)],
          ['Balance',      formatCurrencyFull(inv.balance)],
          ['Status',       inv.status],
        ],
      })
      toast(`Invoice ${inv.id} downloaded`, 'success')
    } catch {
      toast('PDF download failed', 'error')
    } finally {
      setPdfLoading(null)
    }
  }

  const openPayment = (inv) => {
    setPayInvoice(inv)
    setPayForm({ amount: String(inv.balance) })
    setPayError('')
  }

  const handleRecordPayment = () => {
    const amt = Number(payForm.amount)
    if (!payForm.amount || isNaN(amt) || amt <= 0) { setPayError('Enter a valid amount'); return }
    if (amt > payInvoice.balance) { setPayError(`Cannot exceed balance of ${formatCurrencyFull(payInvoice.balance)}`); return }
    setInvoices(prev => prev.map(i => {
      if (i.id !== payInvoice.id) return i
      const newPaid    = i.paid + amt
      const newBalance = i.balance - amt
      const newStatus  = newBalance === 0 ? 'PAID' : 'PARTIAL'
      return { ...i, paid: newPaid, balance: newBalance, status: newStatus }
    }))
    setPayInvoice(null)
    toast(`Payment of ${formatCurrencyFull(amt)} recorded for ${payInvoice.id}`, 'success')
  }

  return (
    <div className="page-root">
      <PageHeader title="Invoices" subtitle="Invoice and payment tracking"
        actions={<ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />}
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total Invoiced',  value:formatCurrencyFull(total),       accent:'bg-gradient-to-r from-blue-500 to-cyan-500',    color:'text-blue-400'    },
          { label:'Collected',       value:formatCurrencyFull(collected),   accent:'bg-gradient-to-r from-emerald-500 to-teal-500', color:'text-emerald-400' },
          { label:'Outstanding',     value:formatCurrencyFull(outstanding), accent:'bg-gradient-to-r from-red-500 to-orange-500',   color:'text-red-400'     },
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
                <td className="font-mono text-xs text-primary-400 font-semibold">{i.id}</td>
                <td className="font-semibold text-zinc-200">{i.buyer}</td>
                <td className="font-mono text-xs text-zinc-400">{i.dispatch}</td>
                <td className="font-mono text-xs font-bold">{formatCurrencyFull(i.amount)}</td>
                <td className="text-emerald-400 font-mono text-xs">{formatCurrencyFull(i.paid)}</td>
                <td className={i.balance > 0 ? 'text-red-400 font-bold font-mono text-xs' : 'text-zinc-600 text-xs'}>{formatCurrencyFull(i.balance)}</td>
                <td className="text-zinc-400 text-xs">{formatDate(i.date)}</td>
                <td><Badge status={i.status} /></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-ghost btn-xs gap-1 text-zinc-400 hover:text-zinc-200"
                      onClick={() => setViewInvoice(i)}>View</button>
                    {i.balance > 0 && (
                      <button className="btn-ghost btn-xs gap-1 text-emerald-400 hover:text-emerald-300"
                        onClick={() => openPayment(i)}>Pay</button>
                    )}
                    <button
                      className="btn-ghost btn-xs gap-1 text-zinc-400 hover:text-primary-400 disabled:opacity-40"
                      disabled={pdfLoading === i.id}
                      onClick={() => handleSinglePDF(i)}
                    >
                      <Download size={11} />{pdfLoading === i.id ? '…' : 'PDF'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Invoice Modal */}
      <Modal open={!!viewInvoice} onClose={()=>setViewInvoice(null)} title={viewInvoice?.id} description={`${viewInvoice?.buyer} · ${formatDate(viewInvoice?.date)}`} size="sm">
        {viewInvoice && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[['Amount',formatCurrencyFull(viewInvoice.amount)],['Paid',formatCurrencyFull(viewInvoice.paid)],['Balance',formatCurrencyFull(viewInvoice.balance)],['Dispatch',viewInvoice.dispatch]].map(([l,v])=>(
                <div key={l} className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1">{l}</p>
                  <p className="text-sm font-bold text-zinc-100">{v}</p>
                </div>
              ))}
            </div>
            <Badge status={viewInvoice.status} />
            <div className="flex gap-2 pt-1">
              {viewInvoice.balance > 0 && (
                <button className="btn-primary btn-sm flex-1" onClick={()=>{ setViewInvoice(null); openPayment(viewInvoice) }}>Record Payment</button>
              )}
              <button className="btn-secondary btn-sm flex-1" onClick={()=>handleSinglePDF(viewInvoice)}>
                <Download size={13} />Download PDF
              </button>
            </div>
            <button className="w-full btn-ghost btn-sm" onClick={()=>setViewInvoice(null)}>Close</button>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={!!payInvoice} onClose={()=>setPayInvoice(null)} title="Record Payment" description={`${payInvoice?.id} · Balance: ${formatCurrencyFull(payInvoice?.balance ?? 0)}`} size="xs">
        <div className="space-y-4">
          <div>
            <label className="label">Payment Amount (₹)</label>
            <input className={`input ${payError?'border-red-500':''}`} type="number" value={payForm.amount}
              onChange={e=>{ setPayForm({amount:e.target.value}); setPayError('') }} placeholder="Enter amount" />
            {payError && <p className="text-xs text-red-400 mt-1">{payError}</p>}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm flex-1" onClick={()=>setPayInvoice(null)}>Cancel</button>
            <button className="btn-primary btn-sm flex-1" onClick={handleRecordPayment}>Record Payment</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
