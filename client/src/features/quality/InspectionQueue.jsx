import { useState } from 'react'
import { Eye, CheckCircle, RotateCcw, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { Badge }      from '../../components/ui/Badge'
import { useToast }   from '../../components/ui/Toast'
import { useAuth }    from '../../context/AuthContext'
import { mockRolls }  from '../../mocks/data'
import { formatDate, cn } from '../../lib/utils'

const DEFECTS = ['Colour Mismatch','Uneven Weave','Stain','Hole','Other']

const RESULT_CFG = {
  PASSED:   { bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300', icon: CheckCircle, active: 'bg-emerald-600 text-white border-emerald-600' },
  REWORK:   { bg: 'bg-amber-500/15  border-amber-500/40  text-amber-300',     icon: RotateCcw,  active: 'bg-amber-600  text-white border-amber-600'     },
  REJECTED: { bg: 'bg-red-500/15    border-red-500/40    text-red-300',       icon: XCircle,    active: 'bg-red-600    text-white border-red-600'        },
}

export default function InspectionQueue() {
  const { user } = useAuth()
  const toast    = useToast()

  const [rolls, setRolls]     = useState(mockRolls)
  const [selected, setSelected] = useState(null)
  const [result, setResult]   = useState('PASSED')
  const [defects, setDefects] = useState([])
  const [remarks, setRemarks] = useState('')
  const [reason, setReason]   = useState('')
  const [reasonError, setReasonError] = useState('')

  const queue = rolls.filter(r => r.status === 'AWAITING_QC')
  const done  = rolls.filter(r => r.status !== 'AWAITING_QC')

  const openInspect = (r) => {
    setSelected(r)
    setResult('PASSED')
    setDefects([])
    setRemarks('')
    setReason('')
    setReasonError('')
  }

  const toggleDefect = d => setDefects(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])

  const handleSubmit = () => {
    if ((result === 'REWORK' || result === 'REJECTED') && !reason.trim()) {
      setReasonError('Reason is required for rework / rejection')
      return
    }
    setRolls(prev => prev.map(r =>
      r.id === selected.id
        ? { ...r, status: result, inspector: user?.name }
        : r
    ))
    setSelected(null)
    toast(
      `Roll ${selected.id} marked ${result}`,
      result === 'PASSED' ? 'success' : result === 'REWORK' ? 'warning' : 'error'
    )
  }

  return (
    <div className="page-root">
      <PageHeader
        title="Inspection Queue"
        subtitle={`Inspector: ${user?.name} · ${queue.length} rolls awaiting QC`}
      />

      <div className="table-wrap">
        <div className="table-head">
          <p className="section-title">Awaiting Inspection <span className="badge badge-yellow ml-2">{queue.length}</span></p>
        </div>
        <table className="table-base">
          <thead><tr><th>Roll ID</th><th>Order</th><th>Machine</th><th>Length</th><th>Produced</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {queue.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-zinc-600 py-8">No rolls awaiting inspection</td></tr>
            ) : queue.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{r.id}</td>
                <td className="font-mono text-xs text-zinc-400">{r.order}</td>
                <td className="font-mono text-xs text-zinc-600">{r.machine}</td>
                <td className="font-semibold text-zinc-200">{r.length} m</td>
                <td className="text-zinc-400 text-xs">{formatDate(r.produced)}</td>
                <td><Badge status={r.status} /></td>
                <td>
                  <button className="btn-primary btn-sm gap-1.5" onClick={() => openInspect(r)}>
                    <Eye size={12} />Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <div className="table-head"><p className="section-title">Recent Inspections</p></div>
        <table className="table-base">
          <thead><tr><th>Roll ID</th><th>Order</th><th>Length</th><th>Inspector</th><th>Produced</th><th>Result</th></tr></thead>
          <tbody>
            {done.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs text-primary-400 font-semibold">{r.id}</td>
                <td className="font-mono text-xs text-zinc-400">{r.order}</td>
                <td className="text-zinc-300">{r.length} m</td>
                <td className="text-zinc-400">{r.inspector ?? '—'}</td>
                <td className="text-zinc-500 text-xs">{formatDate(r.produced)}</td>
                <td><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Inspect Roll" description={selected?.id} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              {[['Order',selected.order],['Machine',selected.machine],['Length',`${selected.length} m`],['Produced',formatDate(selected.produced)]].map(([k,v]) => (
                <div key={k} className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-zinc-600 mb-0.5">{k}</p>
                  <p className="font-semibold text-zinc-100">{v}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="label">Defects found <span className="text-zinc-600">(click to select)</span></label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {DEFECTS.map(d => (
                  <button key={d} onClick={() => toggleDefect(d)}
                    className={cn('btn-secondary btn-sm', defects.includes(d) && 'bg-red-500/15 border-red-500/40 text-red-300')}>
                    {d}
                  </button>
                ))}
              </div>
              {defects.length > 0 && (
                <p className="text-xs text-zinc-500 mt-1.5">Selected: {defects.join(', ')}</p>
              )}
            </div>

            <div>
              <label className="label">Inspection result</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {Object.entries(RESULT_CFG).map(([key, cfg]) => (
                  <button key={key} onClick={() => { setResult(key); setReasonError('') }}
                    className={cn('border rounded-xl flex flex-col items-center gap-1 py-3 transition-all', result === key ? cfg.active : `bg-zinc-900 ${cfg.bg}`)}>
                    <cfg.icon size={16} />
                    <span className="text-xs font-bold">{key}</span>
                  </button>
                ))}
              </div>
            </div>

            {(result === 'REWORK' || result === 'REJECTED') && (
              <div>
                <label className="label">Reason <span className="text-red-400">*</span></label>
                <textarea className={`input ${reasonError?'border-red-500':''}`} rows={2} value={reason}
                  onChange={e => { setReason(e.target.value); setReasonError('') }}
                  placeholder="Required for rework / rejection…" />
                {reasonError && <p className="text-xs text-red-400 mt-1">{reasonError}</p>}
              </div>
            )}

            <div>
              <label className="label">Remarks <span className="text-zinc-600">(optional)</span></label>
              <input className="input" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Inspector notes…" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button
                onClick={handleSubmit}
                className={cn('btn btn-sm px-6 font-semibold text-white',
                  result === 'PASSED'   ? 'bg-emerald-600 hover:bg-emerald-500' :
                  result === 'REWORK'   ? 'bg-amber-600 hover:bg-amber-500'     :
                  'bg-red-600 hover:bg-red-500'
                )}
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
