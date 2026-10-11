import { useState } from 'react'
import { Plus, Download, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import { exportCSV } from '../../lib/exportUtils'

import {
  useProductionEntries,
  useCreateProductionEntry,
  useProductionMachines,
  useOrders,
  useWorkers
} from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

export default function ProductionEntry() {
  const [showAdd, setShowAdd] = useState(false)
  const createProductionEntry = useCreateProductionEntry()
  
  const { data: entriesData, isLoading, error, refetch } = useProductionEntries()
  const entries = entriesData?.data || []

  const { data: machinesData } = useProductionMachines()
  const machines = machinesData?.data || []

  const { data: ordersData } = useOrders()
  const orders = ordersData?.data || []

  const { data: workersData } = useWorkers()
  const workers = workersData?.data || []

  const [calcRolls, setCalcRolls] = useState('')

  const handleExport = () => {
    exportCSV({
      filename: `Production_Entries_${new Date().toISOString().split('T')[0]}`,
      columns: ['Date', 'Shift', 'Machine', 'Order', 'Output (m)', 'Waste (m)', 'Rolls', 'Operator'],
      rows: entries.map(e => [
        formatDate(e.date),
        e.shift,
        e.machineId,
        e.orderId || '-',
        e.output,
        e.waste,
        e.rolls,
        e.operator
      ])
    })
  }

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="Production Entry"
        subtitle="Shift-wise production and output logs"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm gap-1.5" onClick={handleExport}>
              <Download size={13} />Export CSV
            </button>
            <button className="btn-secondary btn-sm gap-1.5" onClick={() => refetch()}>
              <RefreshCw size={13} />Refresh
            </button>
            <button className="btn-primary btn-sm gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus size={14} />Add Entry
            </button>
          </div>
        }
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead>
            <tr>
              <th>Date</th>
              <th>Shift</th>
              <th>Machine</th>
              <th>Order</th>
              <th>Output (m)</th>
              <th>Waste (m)</th>
              <th>Rolls</th>
              <th>Operator</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-zinc-500 text-xs">
                  No production entries logged yet. Click &quot;Add Entry&quot; to log your shift output.
                </td>
              </tr>
            ) : (
              entries.map(e => (
                <tr key={e.id}>
                  <td className="text-xs text-zinc-400">{formatDate(e.date)}</td>
                  <td><span className="badge badge-purple">{e.shift}</span></td>
                  <td className="font-mono text-xs text-zinc-300 font-semibold">{e.machineId || e.machine}</td>
                  <td className="font-mono text-xs text-primary-400 font-semibold">{e.orderId || e.order || '-'}</td>
                  <td className="font-bold text-emerald-400">{e.output?.toLocaleString()} m</td>
                  <td className="text-amber-400">{e.waste} m</td>
                  <td><span className="badge badge-blue">{e.rolls}</span></td>
                  <td className="text-zinc-300">{e.operator}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Production Entry" size="lg">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          try {
            await createProductionEntry.mutateAsync({
              date: new Date(fd.get('date')).toISOString(),
              shift: fd.get('shift'),
              machineId: fd.get('machine'),
              orderId: fd.get('order') || null,
              output: Number(fd.get('output')),
              waste: Number(fd.get('waste')),
              rolls: Number(fd.get('rolls')),
              operator: fd.get('operator')
            })
            await refetch()
            setShowAdd(false)
          } catch (err) {
            console.error('Failed to create production entry:', err)
            alert('Failed to save entry: ' + (err?.response?.data?.message || err?.message || err))
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input name="date" className="input" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label">Shift</label>
              <select name="shift" className="input">
                <option value="Morning">Morning (06:00 AM - 02:00 PM)</option>
                <option value="Afternoon">Afternoon (02:00 PM - 10:00 PM)</option>
                <option value="Night">Night (10:00 PM - 06:00 AM)</option>
              </select>
            </div>
            <div>
              <label className="label">Machine</label>
              {machines.length > 0 ? (
                <select name="machine" className="input" required defaultValue={machines[0]?.machineId || 'M-01'}>
                  {machines.map(m => (
                    <option key={m.id} value={m.machineId || m.id}>
                      {m.machineId} — {m.name} ({m.stage})
                    </option>
                  ))}
                </select>
              ) : (
                <input name="machine" className="input" required placeholder="M-01" defaultValue="M-01" />
              )}
            </div>
            <div>
              <label className="label">Order</label>
              {orders.length > 0 ? (
                <select name="order" className="input" defaultValue={orders[0]?.orderNumber || ''}>
                  <option value="">No specific order (Buffer stock)</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.orderNumber || o.id}>
                      {o.orderNumber || o.id} — {o.customer?.name || o.fabric || 'Order'}
                    </option>
                  ))}
                </select>
              ) : (
                <input name="order" className="input" placeholder="ORD-2028" />
              )}
            </div>
            <div>
              <label className="label">Output (m)</label>
              <input
                name="output"
                className="input"
                type="number"
                required
                placeholder="e.g. 1200"
                onChange={e => {
                  const val = Number(e.target.value)
                  if (val > 0) setCalcRolls(Math.max(1, Math.round(val / 100)))
                }}
              />
            </div>
            <div>
              <label className="label">Waste (m)</label>
              <input name="waste" className="input" type="number" required defaultValue="15" placeholder="e.g. 15" />
            </div>
            <div>
              <label className="label">Operator</label>
              {workers.length > 0 ? (
                <select name="operator" className="input" required defaultValue={workers[0]?.name || ''}>
                  {workers.map(w => (
                    <option key={w.id} value={w.name}>
                      {w.name} ({w.workerId}) — {w.role}
                    </option>
                  ))}
                </select>
              ) : (
                <input name="operator" className="input" required placeholder="Operator name" defaultValue="Rajesh Kumar" />
              )}
            </div>
            <div>
              <label className="label">Rolls Created</label>
              <input
                name="rolls"
                className="input"
                type="number"
                required
                value={calcRolls}
                onChange={e => setCalcRolls(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createProductionEntry.isPending}>
              {createProductionEntry.isPending ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
