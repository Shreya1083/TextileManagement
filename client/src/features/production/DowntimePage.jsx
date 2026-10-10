import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { Badge }      from '../../components/ui/Badge'

import { useDowntimes, useCreateDowntime } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { formatDate } from '../../lib/utils'

export default function DowntimePage() {
  const [showAdd, setShowAdd] = useState(false)
  const createDowntime = useCreateDowntime()
  
  const { data: downtimeData, isLoading, error } = useDowntimes()
  const downtimes = downtimeData?.data || []
  
  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  const open = downtimes.filter(d => d.status === 'OPEN').length

  return (
    <div className="page-root">
      <PageHeader title="Downtime Log" subtitle="Machine breakdowns and maintenance events"
        actions={<button className="btn-danger btn-sm" onClick={() => setShowAdd(true)}><AlertTriangle size={13} />Log Breakdown</button>}
      />
      {open > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={14} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-300">{open} machine(s) currently down</p>
            <p className="text-xs text-red-500/70 mt-0.5">Production impact expected — resolve immediately.</p>
          </div>
        </div>
      )}
      <div className="table-wrap">
        <table className="table-base">
          <thead><tr><th>Machine</th><th>Start</th><th>End</th><th>Duration</th><th>Reason</th><th>Notes</th><th>Status</th></tr></thead>
          <tbody>
            {downtimes.map(d => (
              <tr key={d.id}>
                <td>
                  <p className="font-mono text-xs text-zinc-300">{d.machineId}</p>
                </td>
                <td className="font-mono text-xs text-zinc-400">{formatDate(d.start)}</td>
                <td className="font-mono text-xs">{d.end ? formatDate(d.end) : <span className="text-red-400 font-semibold">Ongoing</span>}</td>
                <td className={d.status === 'OPEN' ? 'text-red-400 font-bold' : 'text-zinc-400'}>{d.status === 'OPEN' ? 'Ongoing' : 'Resolved'}</td>
                <td className="text-zinc-300">{d.reason}</td>
                <td className="text-zinc-500 text-xs">{d.notes}</td>
                <td><Badge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Breakdown / Downtime">
        <form onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          try {
            await createDowntime.mutateAsync({
              machineId: fd.get('machine'),
              start: new Date(fd.get('start')).toISOString(),
              reason: fd.get('reason'),
              notes: fd.get('notes'),
              status: 'OPEN'
            })
            setShowAdd(false)
          } catch (err) {
            console.error(err)
          }
        }}>
          <div className="space-y-4">
            <div><label className="label">Machine</label><input name="machine" className="input" required placeholder="M-01" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Start Date & Time</label><input name="start" className="input" type="datetime-local" required /></div>
              <div><label className="label">Reason</label><select name="reason" className="input"><option>Mechanical failure</option><option>Power outage</option><option>Maintenance</option></select></div>
            </div>
            <div><label className="label">Notes</label><textarea name="notes" className="input" rows={2} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-danger" disabled={createDowntime.isPending}>Log Breakdown</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
