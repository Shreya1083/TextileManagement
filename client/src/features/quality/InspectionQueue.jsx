import { useState } from 'react'
import { Eye, ScanLine, CheckCircle, RotateCcw, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { Badge }      from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { useAuth }    from '../../context/AuthContext'
import { useRolls, useInspectRoll, useSettings }  from '../../hooks/useAPI'
import { formatDate, cn } from '../../lib/utils'

export default function InspectionQueue() {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [result, setResult]     = useState('PASSED')
  const [defects, setDefects]   = useState([])
  const [remarks, setRemarks]   = useState('')
  const [reason, setReason]     = useState('')

  const { data: rollsData, isLoading, error } = useRolls()
  const { data: settingsData } = useSettings()
  
  const DEFECTS = settingsData?.data?.defects || ['Colour Mismatch','Uneven Weave','Stain','Hole','Other']

  const inspectMutation = useInspectRoll()
  const allRolls = rollsData?.data || []
  
  const queue = allRolls.filter(r => r.status === 'AWAITING_QC')
  const done  = allRolls.filter(r => r.status !== 'AWAITING_QC')

  const toggleDefect = d => setDefects(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])

  const RESULT_CFG = {
    PASSED:   { bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300', icon: CheckCircle, active: 'bg-emerald-600 text-white border-emerald-600' },
    REWORK:   { bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',       icon: RotateCcw,  active: 'bg-amber-600 text-white border-amber-600'     },
    REJECTED: { bg: 'bg-red-500/15 border-red-500/40 text-red-300',             icon: XCircle,    active: 'bg-red-600 text-white border-red-600'          },
  }

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="Inspection Queue"
        subtitle={`Inspector: ${user?.name} · ${queue.length} rolls awaiting QC — sorted oldest first`}
        actions={<button className="btn-secondary btn-sm"><ScanLine size={13} />Scan Roll QR</button>}
      />

      <div className="table-wrap">
        <div className="table-head">
          <p className="section-title">
            Awaiting Inspection
            <span className="badge badge-yellow ml-2">{queue.length}</span>
          </p>
        </div>
        <table className="table-base">
          <thead><tr><th>Roll ID</th><th>Order</th><th>Machine</th><th>Length</th><th>Produced</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {queue.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{r.rollNumber}</td>
                <td className="font-mono text-xs text-zinc-400">{r.order?.orderNumber || '—'}</td>
                <td className="font-mono text-xs text-zinc-600">{r.machine?.machineId || '—'}</td>
                <td className="font-semibold text-zinc-200">{r.length} m</td>
                <td className="text-zinc-400 text-xs">{formatDate(r.producedAt)}</td>
                <td><Badge status={r.status} /></td>
                <td>
                  <button
                    className="btn-primary btn-sm gap-1.5"
                    onClick={() => { setSelected(r); setResult('PASSED'); setDefects([]); setRemarks(''); setReason('') }}
                  >
                    <Eye size={12} />Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <div className="table-head">
          <p className="section-title">Recent Inspections</p>
        </div>
        <table className="table-base">
          <thead><tr><th>Roll ID</th><th>Order</th><th>Length</th><th>Inspector</th><th>Produced</th><th>Result</th></tr></thead>
          <tbody>
            {done.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{r.rollNumber}</td>
                <td className="font-mono text-xs text-zinc-400">{r.order?.orderNumber || '—'}</td>
                <td className="text-zinc-300">{r.length} m</td>
                <td className="text-zinc-400">{r.inspector ?? '—'}</td>
                <td className="text-zinc-500 text-xs">{formatDate(r.producedAt)}</td>
                <td><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Inspect Roll`} description={selected?.rollNumber} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              {[['Order',selected.order?.orderNumber || '—'],['Machine',selected.machine?.machineId || '—'],['Length',`${selected.length} m`],['Produced',formatDate(selected.producedAt)]].map(([k,v]) => (
                <div key={k} className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-600 mb-0.5">{k}</p>
                  <p className="font-semibold text-zinc-100">{v}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="label">Defects found</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {DEFECTS.map(d => (
                  <button key={d} onClick={() => toggleDefect(d)}
                    className={cn('btn-secondary btn-sm', defects.includes(d) && 'bg-red-500/15 border-red-500/40 text-red-300')}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Inspection result</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {Object.entries(RESULT_CFG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setResult(key)}
                    className={cn(
                      'btn btn-sm border flex-col gap-0.5 h-14',
                      result === key ? cfg.active : `bg-zinc-900 ${cfg.bg}`,
                    )}
                  >
                    <cfg.icon size={14} />
                    <span className="text-xs font-bold">{key}</span>
                  </button>
                ))}
              </div>
            </div>

            {(result === 'REWORK' || result === 'REJECTED') && (
              <div>
                <label className="label">Reason <span className="text-red-400">*</span></label>
                <textarea className="input" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Required for rework/rejection…" />
              </div>
            )}

            <div>
              <label className="label">Remarks</label>
              <input className="input" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional inspector notes…" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button className={cn(
                'btn btn-sm px-5',
                result === 'PASSED' ? 'btn-success' : result === 'REWORK' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'btn-danger',
              )}
                disabled={inspectMutation.isPending}
                onClick={async () => {
                  try {
                    await inspectMutation.mutateAsync({
                      id: selected.id,
                      data: { 
                        status: result, 
                        defects: defects.join(','), 
                        remarks: remarks || reason, 
                        inspector: user?.name 
                      }
                    });
                    setSelected(null);
                  } catch(e) { console.error(e) }
                }}
              >
                Submit: {result}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
