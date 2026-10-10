import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Trash2, Loader2, ArrowUpRight, Search, FileText, Calendar, Building, Package } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatDate, formatCurrencyFull } from '../../lib/utils'

const mockPOs = [
  { id: 'PO-2026-018', supplier: 'Agarwal Yarns Pvt Ltd', yarn: 'Cotton 60s', qty: 600, rate: 340, total: 204000, expected: '2026-10-18', status: 'RAISED' },
  { id: 'PO-2026-017', supplier: 'Bharat Silk House', yarn: 'Silk 2/120D', qty: 100, rate: 2200, total: 220000, expected: '2026-10-15', status: 'PARTIALLY_RECEIVED' },
  { id: 'PO-2026-016', supplier: 'Krishna Fibers', yarn: 'Linen 20s', qty: 400, rate: 480, total: 192000, expected: '2026-10-10', status: 'RECEIVED' },
]

export default function PurchaseOrdersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [selectedPo, setSelectedPo] = useState(nullreturn(
    <div className="page-root">
      <PageHeader title="Purchase Orders" subtitle="Yarn and material procurement"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />New PO</button>}
      />

      <div className="table-wrap">
        <div className="table-head">
          <div className="flex items-center gap-2">
            <p className="section-title">
              Active Orders <span className="text-zinc-600 font-normal text-xs ml-1">{filtered.length} orders</span>
            </p>
            {loading && <Loader2 size={13} className="animate-spin text-primary-400" />}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="search-po-input"
              className="input-sm pl-8 w-52"
              placeholder="Search PO, supplier, yarn…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="table-base">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Yarn / Materials</th>
              <th>Total Qty</th>
              <th>Est. Rate</th>
              <th>Total Value</th>
              <th>Expected Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockPOs.map(p => (
              <tr key={p.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{p.id}</td>
                <td className="font-semibold text-zinc-200">{p.supplier}</td>
                <td>{p.yarn}</td>
                <td className="font-mono text-xs text-zinc-300">{p.qty.toLocaleString()} kg</td>
                <td className="text-zinc-400">₹{p.rate}/kg</td>
                <td className="font-bold">{formatCurrencyFull(p.total)}</td>
                <td className="text-zinc-400 text-xs">{formatDate(p.expected)}</td>
                <td><Badge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Purchase Order" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Supplier</label><select className="input"><option>Agarwal Yarns Pvt Ltd</option></select></div>
          <div><label className="label">Yarn Type</label><select className="input"><option>Cotton 60s</option></select></div>
          <div><label className="label">Quantity (kg)</label><input className="input" type="number" /></div>
          <div><label className="label">Rate per kg (₹)</label><input className="input" type="number" /></div>
          <div><label className="label">Expected Date</label><input className="input" type="date" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn-primary">Raise PO</button>
        </div>
      </Modal>

      {/* PO View Modal */}
      {selectedPo && (
        <Modal
          open={Boolean(selectedPo)}
          onClose={() => setSelectedPo(null)}
          title={`Purchase Order: ${selectedPo.poNumber}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 block">Supplier</span>
                <span className="text-zinc-200 font-semibold">{selectedPo.supplier}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Status</span>
                <span className="mt-0.5 inline-block"><Badge status={selectedPo.status} /></span>
              </div>
              <div>
                <span className="text-zinc-500 block">Expected Date</span>
                <span className="text-zinc-200">{formatDate(selectedPo.expected)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Total Value</span>
                <span className="text-emerald-400 font-bold">{formatCurrencyFull(selectedPo.total)}</span>
              </div>
            </div>

            {selectedPo.items && selectedPo.items.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Item Breakdown</p>
                <div className="border border-zinc-800 rounded-lg overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-zinc-800/60 text-zinc-400">
                      <tr>
                        <th className="py-1.5 px-3 text-left">Item</th>
                        <th className="py-1.5 px-3 text-right">Quantity</th>
                        <th className="py-1.5 px-3 text-right">Unit Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {selectedPo.items.map((it, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 text-zinc-200">{it.yarnType?.name || 'Yarn'}</td>
                          <td className="py-2 px-3 text-right font-mono">{it.quantity} kg</td>
                          <td className="py-2 px-3 text-right font-mono">₹{(it.unitPrice / 100).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedPo.notes && (
              <div className="text-xs text-zinc-400 bg-zinc-800/30 p-2.5 rounded-lg border border-zinc-800">
                <span className="font-semibold text-zinc-300">Notes:</span> {selectedPo.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button className="btn-secondary btn-sm" onClick={() => setSelectedPo(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
