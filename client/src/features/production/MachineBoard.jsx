import { useState } from 'react'
import { Plus, Wrench, ChevronRight, CheckCircle2, AlertOctagon } from 'lucide-react'
import { Badge }      from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { useAuth }    from '../../context/AuthContext'
import { useProductionMachines, useStartMachine, useStopMachine, useOrders, useWorkers } from '../../hooks/useAPI'
import { cn } from '../../lib/utils'

const STATUS_DOT = {
  RUNNING:   'bg-emerald-400 animate-pulse',
  IDLE:      'bg-amber-400',
  BREAKDOWN: 'bg-red-500 animate-pulse',
}

export default function MachineBoard() {
  const { user } = useAuth()
  const [selected, setSelected]   = useState(null)
  const [showAssign, setShowAssign] = useState(false)
  const [stageFilter, setStageFilter] = useState('ALL')
  
  const { data: machinesData, isLoading, error } = useProductionMachines()
  const allMachines = machinesData?.data || []

  const { data: ordersData } = useOrders()
  const orders = ordersData?.data || []

  const { data: workersData } = useWorkers()
  const workers = workersData?.data || []

  const startMachine = useStartMachine()
  const stopMachine = useStopMachine()
  
  const stages   = ['ALL', ...new Set(allMachines.map(m => m.stage))]
  const filtered = stageFilter === 'ALL' ? allMachines : allMachines.filter(m => m.stage === stageFilter)

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="Machine Board"
        subtitle={`Supervised by ${user?.name} · Machine status and work assignments`}
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={() => window.location.reload()}><Wrench size={13} />Refresh</button>
            <button className="btn-primary btn-sm" onClick={() => setShowAssign(true)}><Plus size={13} />Assign</button>
          </>
        }
      />
      <div className="flex gap-2 flex-wrap">
        {stages.map(s => (
          <button key={s} onClick={() => setStageFilter(s)}
            className={cn('btn-secondary btn-sm', stageFilter === s && 'bg-primary-500/15 border-primary-500/50 text-primary-300')}>
            {s}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Machine</th><th>Stage</th><th>Status</th><th>Active Order</th><th>Operator</th><th>Output Today</th><th></th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} onClick={() => setSelected(m)} className="cursor-pointer">
                <td>
                  <p className="font-mono text-2xs text-zinc-600">{m.machineId}</p>
                  <p className="font-semibold text-zinc-200">{m.name}</p>
                </td>
                <td><span className="badge badge-purple">{m.stage}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[m.status])} />
                    <Badge status={m.status} />
                  </div>
                </td>
                <td className="font-mono text-xs text-primary-400 font-semibold">{m.order ?? <span className="text-zinc-700">—</span>}</td>
                <td className="text-zinc-400">{m.operator ?? <span className="text-zinc-700">—</span>}</td>
                <td className="font-bold text-zinc-200">{m.output > 0 ? `${m.output} m` : <span className="text-zinc-700">—</span>}</td>
                <td>
                  <button className="btn-ghost btn-xs text-primary-400 gap-1">
                    Details <ChevronRight size={10} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} description={selected?.machineId || selected?.id}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[['Stage',selected.stage],['Operator',selected.operator??'Unassigned'],['Order',selected.order??'—'],['Output',selected.output>0?`${selected.output} m`:'—']].map(([k,v]) => (
                <div key={k} className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-600 mb-0.5">{k}</p>
                  <p className="font-semibold text-zinc-100">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Badge status={selected.status} />
            </div>
            {selected.status === 'BREAKDOWN' && (
              <button
                className="btn-primary w-full gap-2"
                disabled={startMachine.isPending}
                onClick={async () => {
                  try {
                    await startMachine.mutateAsync({
                      id: selected.machineId || selected.id,
                      orderId: selected.order,
                      operatorId: selected.operator
                    })
                    setSelected(null)
                  } catch (err) {
                    alert('Failed to resolve machine: ' + (err?.message || err))
                  }
                }}
              >
                <CheckCircle2 size={15} />Mark Resolved (Resume)
              </button>
            )}
            {selected.status === 'RUNNING' && (
              <button
                className="btn-danger w-full gap-2"
                disabled={stopMachine.isPending}
                onClick={async () => {
                  try {
                    await stopMachine.mutateAsync({
                      id: selected.machineId || selected.id,
                      reason: 'Emergency Breakdown reported by supervisor'
                    })
                    setSelected(null)
                  } catch (err) {
                    alert('Failed to log breakdown: ' + (err?.message || err))
                  }
                }}
              >
                <AlertOctagon size={15} />Log Breakdown
              </button>
            )}
            {selected.status === 'IDLE' && (
              <button
                className="btn-secondary w-full gap-2"
                onClick={() => {
                  setSelected(null)
                  setShowAssign(true)
                }}
              >
                <Plus size={15} />Assign Work to this Machine
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="New Work Assignment" size="lg">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          const data = Object.fromEntries(fd.entries())
          try {
            await startMachine.mutateAsync({
              id: data.machineId,
              orderId: data.orderId,
              operatorId: data.operatorId
            })
            setShowAssign(false)
          } catch(err) {
            console.error('Failed to assign machine:', err)
            alert('Failed to assign machine: ' + (err?.message || err))
          }
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Machine</label>
              <select name="machineId" className="input" required defaultValue="">
                <option value="" disabled>Select machine...</option>
                {allMachines.map(m => (
                  <option key={m.id} value={m.machineId || m.id}>
                    {m.name} ({m.machineId}) — {m.stage} [{m.status}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Order Number</label>
              {orders.length > 0 ? (
                <select name="orderId" className="input" required defaultValue="">
                  <option value="" disabled>Select order...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.orderNumber || o.id}>
                      {o.orderNumber || o.id} — {o.customer?.name || o.fabric || 'Textile Order'} ({o.quantity || 0} m)
                    </option>
                  ))}
                </select>
              ) : (
                <input name="orderId" className="input" placeholder="e.g. ORD-2028" required />
              )}
            </div>
            <div>
              <label className="label">Operator</label>
              {workers.length > 0 ? (
                <select name="operatorId" className="input" required defaultValue="">
                  <option value="" disabled>Select operator...</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.name}>
                      {w.name} ({w.workerId}) — {w.dept || w.role}
                    </option>
                  ))}
                </select>
              ) : (
                <input name="operatorId" className="input" placeholder="e.g. Rajesh Kumar" required />
              )}
            </div>
            <div>
              <label className="label">Planned Qty (m)</label>
              <input name="plannedQty" className="input" type="number" defaultValue="1500" placeholder="e.g. 1500" />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input name="startDate" className="input" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label">Shift</label>
              <select name="shift" className="input">
                <option value="Morning">Morning (06:00 AM - 02:00 PM)</option>
                <option value="Afternoon">Afternoon (02:00 PM - 10:00 PM)</option>
                <option value="Night">Night (10:00 PM - 06:00 AM)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={startMachine.isPending}>
              {startMachine.isPending ? 'Assigning...' : 'Assign Machine'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
