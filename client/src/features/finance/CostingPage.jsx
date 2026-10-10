import { PageHeader }  from '../../components/ui/PageHeader'
import { Badge }       from '../../components/ui/Badge'
import { ExportMenu }  from '../../components/ui/ExportMenu'
import { formatCurrencyFull } from '../../lib/utils'
import { exportPDF, exportExcel } from '../../lib/exportUtils'

const mockCosting = [
  { order:'ORD-2023', buyer:'Sharma Fabrics',  fabric:'Cotton Poplin', qty:900,  material:45000,  labour:18000, overhead:9000,  total:72000,  invoice:94500,  profit:22500, profitPct:23.8, status:'DISPATCHED'   },
  { order:'ORD-2021', buyer:'Kapoor Garments', fabric:'Georgette',     qty:1100, material:88000,  labour:33000, overhead:16500, total:137500, invoice:176000, profit:38500, profitPct:21.9, status:'READY_TO_SHIP' },
  { order:'ORD-2022', buyer:'Mehta Textiles',  fabric:'Rayon Crepe',   qty:600,  material:42000,  labour:15600, overhead:7800,  total:65400,  invoice:84000,  profit:18600, profitPct:22.1, status:'IN_PRODUCTION'  },
]

const COLUMNS = ['Order', 'Buyer', 'Fabric', 'Qty (m)', 'Material (₹)', 'Labour (₹)', 'Overhead (₹)', 'Total Cost (₹)', 'Invoice (₹)', 'Profit (₹)', 'Margin %', 'Status']

function buildRows() {
  return mockCosting.map(c => [
    c.order, c.buyer, c.fabric, c.qty,
    c.material, c.labour, c.overhead, c.total,
    c.invoice, c.profit, `${c.profitPct}%`, c.status,
  ])
}

export default function CostingPage() {
  const handleExportPDF = () => exportPDF({
    title: 'Order Costing', subtitle: 'Material + Labour + Overhead per order',
    columns: COLUMNS, rows: buildRows(), filename: 'OrderCosting',
  })
  const handleExportExcel = () => exportExcel({
    filename: 'OrderCosting', sheetName: 'Costing', columns: COLUMNS, rows: buildRows(),
  })

  return (
    <div className="page-root">
      <PageHeader title="Order Costing" subtitle="Material + Labour + Overhead analysis per order"
        actions={<ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />}
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Order</th><th>Buyer</th><th>Fabric</th><th>Qty</th><th>Material</th><th>Labour</th><th>Overhead</th><th>Total Cost</th><th>Invoice</th><th>Profit</th><th>Margin</th><th>Status</th></tr></thead>
          <tbody>
            {mockCosting.map(c => (
              <tr key={c.order}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{c.order}</td>
                <td className="font-semibold text-zinc-200">{c.buyer}</td>
                <td className="text-zinc-400">{c.fabric}</td>
                <td className="font-mono text-xs">{c.qty.toLocaleString()} m</td>
                <td className="font-mono text-xs">{formatCurrencyFull(c.material)}</td>
                <td className="font-mono text-xs">{formatCurrencyFull(c.labour)}</td>
                <td className="font-mono text-xs">{formatCurrencyFull(c.overhead)}</td>
                <td className="font-semibold font-mono text-xs">{formatCurrencyFull(c.total)}</td>
                <td className="text-emerald-400 font-mono text-xs">{formatCurrencyFull(c.invoice)}</td>
                <td className="text-emerald-400 font-bold font-mono text-xs">{formatCurrencyFull(c.profit)}</td>
                <td><span className="badge badge-green">{c.profitPct}%</span></td>
                <td><Badge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">Costing Formula</p>
        <div className="font-mono text-sm text-zinc-300 space-y-1.5 bg-zinc-800/40 rounded-xl p-4">
          <p><span className="text-primary-400">Order Cost</span> = Yarn/Material + Dyeing chemicals + Labour + Overhead + Wastage</p>
          <p><span className="text-primary-400">Cost per good roll</span> = Order Cost ÷ Number of good rolls produced</p>
          <p><span className="text-emerald-400">Order Profit</span> = Invoice Value − Order Cost</p>
        </div>
        <p className="text-xs text-zinc-600 mt-3">MVP method: average yarn rate · labour by output share · fixed overhead per metre.</p>
      </div>
    </div>
  )
}
