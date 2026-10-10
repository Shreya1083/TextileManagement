import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

import { useProductionEntries, useCreateProductionEntry } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

export default function ProductionEntry() {
  const [showAdd, setShowAdd] = useState(false)
  const createProductionEntry = useCreateProductionEntry()
  
  const { data: entriesData, isLoading, error } = useProductionEntries()
  const entries = entriesData?.data || []

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader title="Production Entry" subtitle="Shift-wise production logs"
        actions={<button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} />Add Entry</button>}
      />
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Date</th><th>Shift</th><th>Machine</th><th>Order</th><th>Output (m)</th><th>Waste (m)</th><th>Rolls</th><th>Operator</th></tr></thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id}>
                <td className="text-xs text-zinc-400">{formatDate(e.date)}</td>
                <td><span className="badge badge-purple">{e.shift}</span></td>
                <td className="font-mono text-xs text-zinc-500">{e.machineId}</td>
                <td className="font-mono text-xs text-primary-400 font-semibold">{e.orderId || '-'}</td>
                <td className="font-bold text-emerald-400">{e.output} m</td>
                <td className="text-amber-400">{e.waste} m</td>
                <td><span className="badge badge-blue">{e.rolls}</span></td>
                <td className="text-zinc-400">{e.operator}</td>
              </tr>
            ))}
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
            setShowAdd(false)
          } catch (err) {
            console.error(err)
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Date</label><input name="date" className="input" type="date" required /></div>
            <div><label className="label">Shift</label><select name="shift" className="input"><option>Morning</option><option>Afternoon</option><option>Night</option></select></div>
            <div><label className="label">Machine</label><input name="machine" className="input" required placeholder="M-01" /></div>
            <div><label className="label">Order</label><input name="order" className="input" required placeholder="ORD-..." /></div>
            <div><label className="label">Output (m)</label><input name="output" className="input" type="number" required /></div>
            <div><label className="label">Waste (m)</label><input name="waste" className="input" type="number" required /></div>
            <div><label className="label">Operator</label><input name="operator" className="input" required placeholder="Name" /></div>
            <div><label className="label">Rolls Created</label><input name="rolls" className="input" type="number" required /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createProductionEntry.isPending}>Save Entry</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
