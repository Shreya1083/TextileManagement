import { useState } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  Factory, CheckCircle, AlertTriangle, Clock, Users,
  DollarSign, Package, Truck, FileText, Zap,
  ArrowRight, BarChart3, Activity, Star, RefreshCw, Download,
  CalendarDays, Moon, Sun, Sunset,
} from 'lucide-react'
import { PageHeader }  from '../../components/ui/PageHeader'
import { Badge }       from '../../components/ui/Badge'
import { useAuth }     from '../../context/AuthContext'
import { ROLE_LABELS } from '../../context/AuthContext'
import { formatCurrency, formatCurrencyFull, cn } from '../../lib/utils'
import {
  useEODSummary, useEODShifts, useEODHourlyOutput,
  useEODMachineOutput, useEODTopPerformers, useEODTimeline
} from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

/* ─── helpers ─────────────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="text-zinc-400 text-xs mb-1.5 font-medium">{label}:00</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString('en-IN')} m
        </p>
      ))}
    </div>
  )
}

const TIMELINE_CFG = {
  shift:     { bg: 'bg-primary-500/20', icon: Clock,         clr: 'text-primary-400',  bar: 'bg-primary-500'  },
  stock:     { bg: 'bg-amber-500/20',   icon: Package,        clr: 'text-amber-400',    bar: 'bg-amber-500'    },
  order:     { bg: 'bg-blue-500/20',    icon: FileText,       clr: 'text-blue-400',     bar: 'bg-blue-500'     },
  breakdown: { bg: 'bg-red-500/20',     icon: AlertTriangle,  clr: 'text-red-400',      bar: 'bg-red-500'      },
  quality:   { bg: 'bg-emerald-500/20', icon: CheckCircle,    clr: 'text-emerald-400',  bar: 'bg-emerald-500'  },
  dispatch:  { bg: 'bg-teal-500/20',    icon: Truck,          clr: 'text-teal-400',     bar: 'bg-teal-500'     },
  invoice:   { bg: 'bg-violet-500/20',  icon: DollarSign,     clr: 'text-violet-400',   bar: 'bg-violet-500'   },
  close:     { bg: 'bg-zinc-700/50',    icon: CalendarDays,   clr: 'text-zinc-400',     bar: 'bg-zinc-600'     },
}

const SEVERITY_BAR = { info: 'bg-primary-500', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-red-500' }

const SHIFT_ICONS = { Morning: Sun, Afternoon: Sunset, Evening: Sunset, Night: Moon }

function KpiMini({ label, value, sub, color = 'text-zinc-50' }) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-3">
      <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
      {sub && <p className="text-2xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

function ProgressRing({ pct, size = 64, stroke = 6, color = '#6366f1' }) {
  const r   = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

/* ─── main component ──────────────────────────────────────────────────── */
export default function EODDashboard() {
  const { user }    = useAuth()
  
  const { data: summaryData, isLoading, error } = useEODSummary()
  const s = summaryData?.data || { totalOutput: 0, totalTarget: 0, rollsPassed: 0, rollsProduced: 0, totalPresent: 0, totalWorkers: 0, machineUptime: 0, downtimeEvents: 0, estimatedRevenue: 0, estimatedCost: 0, estimatedProfit: 0, dispatchesToday: 0, metresDispatched: 0, invoiceValue: 0 }

  const { data: shiftsData } = useEODShifts()
  const dailyShifts = shiftsData?.data || []

  const { data: hourlyData } = useEODHourlyOutput()
  const hourlyOutput = hourlyData?.data || []

  const { data: machineOutData } = useEODMachineOutput()
  const machineOutput = machineOutData?.data || []

  const { data: topPerfData } = useEODTopPerformers()
  const topPerformers = topPerfData?.data || []

  const { data: timelineData } = useEODTimeline()
  const timeline = timelineData?.data || []

  const [activeShift, setActiveShift] = useState('Morning')
  const shift       = dailyShifts.find(sh => sh.shift === activeShift) || dailyShifts[0]

  const achievePct  = s.totalTarget ? Math.round((s.totalOutput / s.totalTarget) * 100) : 0
  const passRate    = s.rollsProduced ? Math.round((s.rollsPassed / s.rollsProduced) * 100) : 0
  const attendPct   = s.totalWorkers ? Math.round((s.totalPresent / s.totalWorkers) * 100) : 0

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">

      {/* ── Page header ── */}
      <PageHeader
        title="End-of-Day Summary"
        subtitle={`${ROLE_LABELS[user?.role] || user?.role} · ${today}`}
        badge={
          <span className="badge badge-purple">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Post-shift Report
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm gap-1.5">
              <Download size={13} />Export PDF
            </button>
            <button className="btn-ghost btn-sm gap-1.5">
              <RefreshCw size={13} />Refresh
            </button>
          </div>
        }
      />

      {/* ── Day hero strip ── */}
      <div className="card overflow-hidden">
        <div className="relative px-6 py-5 bg-gradient-to-r from-primary-950/60 via-zinc-900 to-zinc-900">
          {/* Background glow */}
          <div className="absolute left-0 top-0 w-64 h-full bg-gradient-to-r from-primary-500/10 to-transparent pointer-events-none" />

          <div className="relative grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-6">

            {/* Output ring */}
            <div className="flex items-center gap-4 col-span-2 sm:col-span-1">
              <div className="relative shrink-0">
                <ProgressRing pct={achievePct} size={64} color="#6366f1" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-300">{achievePct}%</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-zinc-50 leading-none">
                  {s.totalOutput.toLocaleString()} <span className="text-sm font-semibold text-zinc-400">m</span>
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">of {s.totalTarget.toLocaleString()} m target</p>
                <p className="text-2xs text-zinc-600 mt-1">Total output today</p>
              </div>
            </div>

            {/* Rolls */}
            <div className="flex flex-col gap-1">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Rolls Today</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-zinc-50">{s.rollsProduced}</span>
                <span className="text-xs text-zinc-600">produced</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" />{s.rollsPassed} passed</span>
                <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500" />{s.rollsRework}</span>
                <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" />{s.rollsRejected}</span>
              </div>
            </div>

            {/* Workforce */}
            <div className="flex flex-col gap-1">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Workforce</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-zinc-50">{s.totalPresent}</span>
                <span className="text-xs text-zinc-600">/ {s.totalWorkers}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle size={11} />{attendPct}% attendance
              </div>
              {s.totalAbsent > 0 && (
                <p className="text-2xs text-red-400">{s.totalAbsent} absent</p>
              )}
            </div>

            {/* Machine uptime */}
            <div className="flex flex-col gap-1">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Machine Uptime</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-zinc-50">{s.machineUptime}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle size={11} />{s.downtimeEvents} breakdown
              </div>
              <p className="text-2xs text-zinc-600">{s.downtimeMachine}</p>
            </div>

            {/* Revenue */}
            <div className="flex flex-col gap-1">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Est. Revenue</p>
              <div className="mt-1">
                <span className="text-xl font-bold text-emerald-400">{formatCurrency(s.estimatedRevenue)}</span>
              </div>
              <p className="text-2xs text-zinc-600">Cost: {formatCurrency(s.estimatedCost)}</p>
              <p className="text-xs text-emerald-400 font-semibold">+{formatCurrency(s.estimatedProfit)} profit</p>
            </div>

            {/* Dispatch */}
            <div className="flex flex-col gap-1">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Dispatches</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-zinc-50">{s.dispatchesToday}</span>
                <span className="text-xs text-zinc-600">today</span>
              </div>
              <p className="text-xs text-zinc-300">{s.metresDispatched.toLocaleString()} m shipped</p>
              <p className="text-2xs text-violet-400">{formatCurrency(s.invoiceValue)} invoiced</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hourly output chart ── */}
      <div className="card">
        <div className="section-header">
          <div>
            <p className="section-title">Hourly Production Output</p>
            <p className="text-xs text-zinc-500 mt-0.5">Output vs target metre-by-hour — all shifts</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-primary-400"><span className="w-2 h-2 rounded-sm bg-primary-500" />Output</span>
            <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2 h-2 rounded-sm bg-zinc-700" />Target</span>
          </div>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyOutput} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gHourly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
              {/* Shift dividers */}
              <XAxis dataKey="hour" tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={h => `${h}h`} />
              <YAxis tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="target" name="Target" stroke="#3f3f46" fill="none" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="output" name="Output" stroke="#6366f1" fill="url(#gHourly)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Shift labels */}
          <div className="flex mt-2 text-2xs text-zinc-600 font-semibold">
            <div className="flex-1 border-l border-zinc-700/50 pl-2">Morning (06–14)</div>
            <div className="flex-1 border-l border-zinc-700/50 pl-2">Afternoon (14–22)</div>
            <div className="w-24 border-l border-zinc-700/50 pl-2">Night (22–06)</div>
          </div>
        </div>
      </div>

      {/* ── Shift breakdown ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
          <Activity size={14} className="text-zinc-500" />
          Shift-Wise Breakdown
        </h2>
        {/* Shift selector tabs */}
        <div className="flex gap-2">
          {dailyShifts.map(sh => {
            const Icon = SHIFT_ICONS[sh.shift] || Clock
            return (
              <button key={sh.shift} onClick={() => setActiveShift(sh.shift)}
                className={cn('btn-secondary btn-sm gap-2',
                  activeShift === sh.shift && 'bg-primary-500/15 border-primary-500/50 text-primary-300')}>
                <Icon size={13} />{sh.shift}
              </button>
            )
          })}
        </div>

        {shift && (
          <div className="card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-base font-bold text-zinc-100">{shift.shift} Shift</p>
                <p className="text-xs text-zinc-500 mt-0.5">{shift.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('badge',
                  shift.output >= shift.target ? 'badge-green' : 'badge-yellow')}>
                  {Math.round((shift.output / shift.target) * 100)}% of target
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
              <KpiMini label="Output"         value={`${shift.output.toLocaleString()} m`} sub={`Target ${shift.target.toLocaleString()} m`} color="text-primary-300" />
              <KpiMini label="Waste"          value={`${shift.waste} m`}  sub={`${((shift.waste/shift.output)*100).toFixed(1)}% waste rate`} color="text-amber-400" />
              <KpiMini label="Rolls Produced" value={shift.rollsProduced} sub={`${shift.rollsPassed} passed · ${shift.rollsRework} rework`} />
              <KpiMini label="Workers Present" value={`${shift.present}/${shift.workers}`} sub={shift.absent > 0 ? `${shift.absent} absent` : 'Full attendance'} color={shift.absent ? 'text-amber-400' : 'text-emerald-400'} />
              <KpiMini label="Machines"        value={`${shift.machinesRunning} running`} sub={`${shift.machinesIdle} idle · ${shift.machinesBreakdown} down`} color="text-emerald-400" />
              <KpiMini label="Quality Pass"   value={`${Math.round((shift.rollsPassed/shift.rollsProduced)*100)}%`} sub={`${shift.rollsRejected} rejected`} color="text-teal-400" />
            </div>

            {/* Output progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-500">Output achievement</span>
                <span className="font-mono text-zinc-300">{shift.output.toLocaleString()} / {shift.target.toLocaleString()} m</span>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700',
                    shift.output >= shift.target
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-primary-600 to-primary-400')}
                  style={{ width: `${Math.min(100, (shift.output / shift.target) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Machine performance table + Top performers ── */}
      <div className="grid xl:grid-cols-3 gap-4">

        {/* Machine output table */}
        <div className="table-wrap xl:col-span-2">
          <div className="table-head">
            <p className="section-title">Machine Output Today</p>
            <span className="badge badge-gray">{machineOutput.length} machines</span>
          </div>
          <table className="table-base">
            <thead>
              <tr><th>Machine</th><th>Output (m)</th><th>Target</th><th>Efficiency</th><th>Status</th></tr>
            </thead>
            <tbody>
              {machineOutput.map(m => {
                const eff = m.eff
                return (
                  <tr key={m.machine}>
                    <td>
                      <p className="font-mono text-2xs text-zinc-600">{m.machine}</p>
                      <p className="font-semibold text-zinc-200">{m.name}</p>
                    </td>
                    <td className="font-bold font-mono text-zinc-200">{m.output > 0 ? `${m.output} m` : <span className="text-zinc-700">—</span>}</td>
                    <td className="text-zinc-500 text-xs">{m.target} m</td>
                    <td>
                      {eff > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', eff >= 100 ? 'bg-emerald-500' : eff >= 85 ? 'bg-primary-500' : 'bg-amber-500')}
                              style={{ width: `${Math.min(100, eff)}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-bold font-mono',
                            eff >= 100 ? 'text-emerald-400' : eff >= 85 ? 'text-primary-400' : 'text-amber-400')}>
                            {eff}%
                          </span>
                        </div>
                      ) : <span className="text-zinc-700 text-xs">—</span>}
                    </td>
                    <td><Badge status={m.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Top performers */}
        <div className="card flex flex-col">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-amber-400" />
              <p className="section-title">Top Performers</p>
            </div>
            <span className="text-2xs text-zinc-600">By output</span>
          </div>
          <ul className="flex-1 divide-y divide-zinc-800/40 overflow-y-auto scrollbar-thin">
            {topPerformers.map(p => (
              <li key={p.rank} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-800/30 transition-colors">
                <div className="w-7 h-7 rounded-xl bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                  {p.badge || <span className="text-zinc-600 font-bold text-xs">#{p.rank}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 truncate">{p.name}</p>
                  <p className="text-2xs text-zinc-600">{p.role} · {p.machine}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary-300">{p.output} m</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Daily totals card */}
          <div className="m-4 p-4 bg-zinc-800/50 rounded-2xl space-y-2.5 border border-zinc-700/40">
            <p className="text-2xs text-zinc-500 uppercase tracking-widest font-bold">Day Totals</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-zinc-600">Waste</p>
                <p className="font-bold text-amber-400">{s.totalWaste} m</p>
              </div>
              <div>
                <p className="text-zinc-600">Defects</p>
                <p className="font-bold text-red-400">{s.defectsFound} found</p>
              </div>
              <div>
                <p className="text-zinc-600">Overtime</p>
                <p className="font-bold text-violet-400">{s.overtimeHrs} hrs</p>
              </div>
              <div>
                <p className="text-zinc-600">Downtime</p>
                <p className="font-bold text-red-400">{s.downtimeMins} mins</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Day summary KPI cards ── */}
      <div>
        <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-zinc-500" />
          Full Day Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label:'Total Output',    value:`${s.totalOutput.toLocaleString()} m`, icon: Factory,      color:'text-primary-300',  sub:`${achievePct}% of target` },
            { label:'Quality Pass',    value:`${passRate}%`,                         icon: CheckCircle,  color:'text-emerald-400',  sub:`${s.rollsPassed}/${s.rollsProduced} rolls` },
            { label:'Attendance',      value:`${attendPct}%`,                        icon: Users,        color:'text-cyan-400',     sub:`${s.totalPresent}/${s.totalWorkers} workers` },
            { label:'Machine Uptime',  value:`${s.machineUptime}%`,                  icon: Zap,          color:'text-amber-400',    sub:`${s.downtimeMins} min downtime` },
            { label:'Est. Revenue',    value:formatCurrency(s.estimatedRevenue),     icon: DollarSign,   color:'text-emerald-400',  sub:`Profit ${formatCurrency(s.estimatedProfit)}` },
            { label:'Stock Warnings',  value:s.stockWarnings,                        icon: AlertTriangle,color:'text-red-400',      sub:'Items below reorder' },
          ].map((c, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">{c.label}</p>
                <c.icon size={13} className={c.color} />
              </div>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-2xs text-zinc-600 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Day timeline ── */}
      <div className="card">
        <div className="section-header">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-zinc-500" />
            <p className="section-title">Day Timeline</p>
          </div>
          <span className="text-xs text-zinc-600">{timeline.length} events</span>
        </div>

        <div className="px-5 py-4">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-3 bottom-3 w-px bg-zinc-800" />

            <ul className="space-y-1">
              {timeline.map((ev, i) => {
                const cfg  = TIMELINE_CFG[ev.icon] || TIMELINE_CFG.close
                const Icon = cfg.icon
                return (
                  <li key={i} className="flex items-start gap-4 group">
                    <div className={cn('w-9 h-9 rounded-xl shrink-0 flex items-center justify-center z-10', cfg.bg)}>
                      <Icon size={14} className={cfg.clr} />
                    </div>
                    <div className="flex-1 flex items-start justify-between py-2 border-b border-zinc-800/40 group-last:border-0">
                      <div>
                        <p className={cn('text-sm font-medium leading-snug',
                          ev.type === 'danger'  ? 'text-red-300'     :
                          ev.type === 'warning' ? 'text-amber-300'   :
                          ev.type === 'success' ? 'text-emerald-300' : 'text-zinc-300')}>
                          {ev.event}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5', SEVERITY_BAR[ev.type])} />
                        <span className="font-mono text-xs text-zinc-600">{ev.time}</span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* ── EOD sign-off ── */}
      <div className="card p-6 bg-gradient-to-r from-primary-950/40 via-zinc-900 to-zinc-900 border-primary-500/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-bold text-zinc-200">Day Closed — {new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</p>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">
              Total production: <span className="text-zinc-300 font-semibold">{s.totalOutput.toLocaleString()} m</span> ·
              Pass rate: <span className="text-emerald-400 font-semibold">{passRate}%</span> ·
              Attendance: <span className="text-cyan-400 font-semibold">{attendPct}%</span> ·
              Est. profit: <span className="text-emerald-400 font-semibold">{formatCurrencyFull(s.estimatedProfit)}</span> ·
              Top defect: <span className="text-amber-400 font-semibold">{s.topDefect}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary btn-sm gap-1.5">
              <FileText size={13} />Full Report
            </button>
            <button className="btn-secondary btn-sm gap-1.5">
              Share <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
