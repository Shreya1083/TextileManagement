import { useState } from 'react'
import { Search, Package, CheckCircle, Truck, Factory, Eye, Layers, Clock } from 'lucide-react'
import { mockOrders } from '../../mocks/data'
import { formatDate, cn } from '../../lib/utils'

const STAGES = [
  { key: 'CONFIRMED',    label: 'Order Confirmed',  icon: CheckCircle, color: 'emerald' },
  { key: 'IN_PRODUCTION',label: 'In Production',    icon: Factory,     color: 'primary' },
  { key: 'QUALITY_CHECK',label: 'Quality Check',    icon: Eye,         color: 'amber'   },
  { key: 'READY_TO_SHIP',label: 'Ready to Ship',    icon: Package,     color: 'cyan'    },
  { key: 'DISPATCHED',   label: 'Dispatched',       icon: Truck,       color: 'violet'  },
]
const IDX = { CONFIRMED:0, YARN_PENDING:0, IN_PRODUCTION:1, QUALITY_CHECK:2, READY_TO_SHIP:3, DISPATCHED:4, CLOSED:4 }

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-400', light: 'bg-emerald-500/15' },
  primary: { bg: 'bg-primary-500', ring: 'ring-primary-500/30', text: 'text-primary-400', light: 'bg-primary-500/15' },
  amber:   { bg: 'bg-amber-500',   ring: 'ring-amber-500/30',   text: 'text-amber-400',   light: 'bg-amber-500/15'   },
  cyan:    { bg: 'bg-cyan-500',    ring: 'ring-cyan-500/30',    text: 'text-cyan-400',    light: 'bg-cyan-500/15'    },
  violet:  { bg: 'bg-violet-500',  ring: 'ring-violet-500/30',  text: 'text-violet-400',  light: 'bg-violet-500/15'  },
}

export default function TrackingPage() {
  const [query, setQuery] = useState('')
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')

  const search = (e) => {
    e.preventDefault()
    const o = mockOrders.find(o => o.id.toLowerCase() === query.trim().toLowerCase())
    if (o) { setFound(o); setError('') }
    else   { setFound(null); setError('Order not found. Please check the order number.') }
  }

  const currentStep = found ? (IDX[found.status] ?? 0) : 0

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800/60 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-glow flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-zinc-100 text-sm">Everest Textile Mills</p>
              <p className="text-2xs text-zinc-600 uppercase tracking-widest">Order Tracking</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-14 pb-8">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-50 tracking-tight mb-2">Track Your Order</h1>
            <p className="text-zinc-500 text-sm">Enter your order number to check live production and delivery status</p>
          </div>

          <form onSubmit={search} className="flex gap-2 mb-8">
            <input
              className="input flex-1"
              placeholder="e.g. ORD-2024"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary px-6">
              <Search size={16} />Track
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-2xl text-sm text-red-400 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          {!found && !error && (
            <div className="text-center">
              <p className="text-xs text-zinc-600 mb-3">Demo orders to try:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {mockOrders.slice(0, 5).map(o => (
                  <button key={o.id} onClick={() => setQuery(o.id)}
                    className="btn-secondary btn-sm font-mono text-primary-400">
                    {o.id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {found && (
            <div className="card p-6 animate-slide-up space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xs text-zinc-600 uppercase tracking-widest mb-1">Order Number</p>
                  <p className="text-2xl font-bold font-mono text-primary-400">{found.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xs text-zinc-600 uppercase tracking-widest mb-1">Expected Delivery</p>
                  <p className={`font-bold text-sm ${new Date(found.deadline) < new Date() && found.status !== 'DISPATCHED' ? 'text-red-400' : 'text-zinc-200'}`}>
                    {formatDate(found.deadline)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {[['Fabric',found.fabric],['Colour',found.colour],['Quantity',`${found.qty.toLocaleString()} m`],['Progress',`${found.progress}% complete`]].map(([k,v]) => (
                  <div key={k} className="bg-zinc-800/60 rounded-xl p-3">
                    <p className="text-zinc-600 mb-0.5">{k}</p>
                    <p className="font-semibold text-zinc-100">{v}</p>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500 font-medium">Production progress</span>
                  <span className="font-mono text-primary-400">{found.progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${found.progress}%` }} />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-2xs text-zinc-600 uppercase tracking-widest mb-4 font-bold">Order Timeline</p>
                <div className="space-y-0">
                  {STAGES.map((stage, i) => {
                    const done    = i < currentStep
                    const current = i === currentStep
                    const c       = COLOR_MAP[stage.color]
                    return (
                      <div key={stage.key} className="relative flex items-start gap-3.5">
                        {/* Connector */}
                        {i < STAGES.length - 1 && (
                          <div className={cn('absolute left-4 top-8 w-0.5 h-6', done ? c.bg : 'bg-zinc-800')} />
                        )}
                        <div className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all',
                          done    ? cn(c.bg, 'shadow-glow-sm') :
                          current ? cn(c.light, 'ring-2', c.ring) :
                                    'bg-zinc-800/60',
                        )}>
                          <stage.icon size={13} className={done || current ? 'text-white' : 'text-zinc-700'} />
                        </div>
                        <div className="pb-5">
                          <p className={cn('text-sm font-semibold', done ? c.text : current ? c.text : 'text-zinc-700')}>
                            {stage.label}
                          </p>
                          {current && (
                            <span className="badge badge-primary animate-pulse-slow !text-[10px] mt-0.5">In Progress</span>
                          )}
                          {done && <p className={cn('text-2xs mt-0.5', c.text)}>Completed ✓</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
