import { useState } from 'react'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  Users, CheckCircle2, XCircle, Clock, DollarSign, TrendingUp,
  TrendingDown, Calendar, Zap, AlertTriangle, Search,
  ChevronRight, Download, UserCheck, Banknote, Award,
} from 'lucide-react'
import { PageHeader }  from '../../components/ui/PageHeader'
import { Modal }       from '../../components/ui/Modal'
import { useAuth }     from '../../context/AuthContext'
import { ROLE_LABELS } from '../../context/AuthContext'
import { formatCurrencyFull, cn } from '../../lib/utils'
import {
  mockWorkerProfiles, ATTENDANCE_LABELS,
  mockDeptAttendanceSummary, mockWageTrend,
} from '../../mocks/data'

/* ─── constants ──────────────────────────────────────────────────────────── */
const MONTH_DAYS = 30   // Sep 2026
const MONTH_LABEL = 'October 2026'

const DEPT_COLORS = {
  Production: 'from-primary-500 to-violet-600',
  QC:         'from-amber-500 to-orange-600',
  Store:      'from-cyan-500 to-blue-600',
}

/* ─── small helpers ─────────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="text-zinc-400 text-xs mb-1.5 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999
            ? `₹${p.value.toLocaleString('en-IN')}`
            : p.value}
        </p>
      ))}
    </div>
  )
}

function StatPill({ icon: Icon, value, label, color = 'text-zinc-50', bg = 'bg-zinc-800/60' }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl', bg)}>
      <Icon size={16} className={color} />
      <div>
        <p className={cn('text-lg font-bold leading-none', color)}>{value}</p>
        <p className="text-2xs text-zinc-600 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

/* ─── attendance calendar for a single worker ──────────────────────────── */
function AttendanceCalendar({ attendance }) {
  // Sep 2026 starts on Tuesday (day index 2)
  const startDay = 2
  const cells = []
  // empty leading cells
  for (let i = 0; i < startDay; i++) cells.push(null)
  attendance.forEach((s, i) => cells.push({ day: i + 1, status: s }))

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-2xs font-bold text-zinc-600">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />
          const cfg = ATTENDANCE_LABELS[cell.status] || ATTENDANCE_LABELS.S
          return (
            <div
              key={i}
              title={`${cell.day} Oct — ${cfg.label}`}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold',
                'border transition-all hover:scale-110 cursor-default',
                cfg.color, cfg.border,
                cell.status === 'S' ? 'opacity-40' : '',
                'text-white',
              )}
            >
              {cell.day}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {Object.entries(ATTENDANCE_LABELS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-2xs text-zinc-500">
            <span className={cn('w-2.5 h-2.5 rounded-sm', v.color)} />
            {v.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── wage breakdown card ───────────────────────────────────────────────── */
function WageBreakdown({ worker }) {
  const gross    = worker.wage * worker.daysPresent
  const halfPay  = worker.halfDays * (worker.wage / 2)
  const otPay    = worker.overtimeHrs * Math.round(worker.wage / 8 * 1.5)
  const net      = gross + halfPay + otPay - worker.deductions

  const rows = [
    { label: 'Basic (days × rate)',  value: gross,             color: 'text-zinc-200' },
    { label: `Half Days (${worker.halfDays})`, value: halfPay, color: 'text-amber-400' },
    { label: `Overtime (${worker.overtimeHrs} hrs)`, value: otPay, color: 'text-primary-400' },
    { label: 'Deductions',           value: -worker.deductions, color: 'text-red-400'   },
  ]

  return (
    <div className="space-y-2">
      <div className="bg-zinc-800/50 rounded-2xl p-4 space-y-2.5">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">{r.label}</span>
            <span className={cn('font-mono font-semibold', r.color)}>
              {r.value < 0 ? '−' : '+'} ₹{Math.abs(r.value).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
        <div className="border-t border-zinc-700/60 pt-2.5 flex justify-between items-center">
          <span className="text-sm font-bold text-zinc-200">Net Pay</span>
          <span className="text-base font-black text-emerald-400 font-mono">
            ₹{net.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-zinc-800/40 rounded-xl p-2.5">
          <p className="text-emerald-400 font-bold text-sm">{worker.daysPresent}</p>
          <p className="text-2xs text-zinc-600 mt-0.5">Days present</p>
        </div>
        <div className="bg-zinc-800/40 rounded-xl p-2.5">
          <p className="text-red-400 font-bold text-sm">{worker.daysAbsent}</p>
          <p className="text-2xs text-zinc-600 mt-0.5">Days absent</p>
        </div>
        <div className="bg-zinc-800/40 rounded-xl p-2.5">
          <p className="text-primary-400 font-bold text-sm">{worker.overtimeHrs}h</p>
          <p className="text-2xs text-zinc-600 mt-0.5">Overtime</p>
        </div>
      </div>
    </div>
  )
}

/* ─── worker detail modal ─────────────────────────────────────────────── */
function WorkerDetailModal({ worker, open, onClose }) {
  const [tab, setTab] = useState('attendance')
  if (!worker) return null

  const attendPct = Math.round((worker.daysPresent / (worker.daysPresent + worker.daysAbsent + worker.halfDays)) * 100)
  const wageData  = Object.entries(worker.monthlyWage).map(([m, v]) => ({ month: m, wage: v })).reverse()

  return (
    <Modal open={open} onClose={onClose} title={worker.name} description={`${worker.role} · ${worker.dept} · ${worker.id}`} size="xl">
      <div className="space-y-5">

        {/* Worker header */}
        <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/40">
          <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-black text-xl shadow-glow-sm shrink-0', worker.color)}>
            {worker.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-zinc-50">{worker.name}</p>
            <p className="text-sm text-zinc-400">{worker.role} — {worker.dept}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-2xs text-zinc-600 font-mono">{worker.phone}</span>
              <span className="text-2xs text-zinc-700">·</span>
              <span className="text-2xs text-zinc-600">Joined {new Date(worker.joined).toLocaleDateString('en-IN', { month:'short', year:'numeric' })}</span>
              <span className="text-2xs text-zinc-700">·</span>
              <span className="text-2xs text-zinc-600">{worker.shift} shift</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-emerald-400">₹{worker.wage}<span className="text-xs text-zinc-500 font-normal">/day</span></p>
            <p className="text-2xs text-zinc-500 mt-0.5">YTD: {formatCurrencyFull(worker.ytdEarnings)}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: CheckCircle2, value: `${attendPct}%`, label: 'Attendance rate', color: 'text-emerald-400' },
            { icon: Calendar,     value: worker.daysPresent, label: 'Days present',  color: 'text-zinc-100'   },
            { icon: Clock,        value: `${worker.overtimeHrs}h`, label: 'Overtime', color: 'text-primary-400' },
            { icon: Banknote,     value: formatCurrencyFull(Object.values(worker.monthlyWage)[0]), label: 'This month', color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-800/50 rounded-2xl p-3 text-center">
              <s.icon size={14} className={cn('mx-auto mb-1.5', s.color)} />
              <p className={cn('text-base font-bold', s.color)}>{s.value}</p>
              <p className="text-2xs text-zinc-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-800/80 pb-0">
          {[
            { key: 'attendance', label: 'Attendance Calendar' },
            { key: 'wages',      label: 'Wage Breakdown'      },
            { key: 'trend',      label: 'Monthly Trend'       },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'border-primary-500 text-primary-300'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'attendance' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400">{MONTH_LABEL}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 font-semibold">{worker.daysPresent} P</span>
                <span className="text-red-400 font-semibold">{worker.daysAbsent} A</span>
                <span className="text-amber-400 font-semibold">{worker.halfDays} H</span>
              </div>
            </div>
            <AttendanceCalendar attendance={worker.attendance} />
          </div>
        )}

        {tab === 'wages' && (
          <div className="animate-fade-in">
            <WageBreakdown worker={worker} />
          </div>
        )}

        {tab === 'trend' && (
          <div className="animate-fade-in">
            <p className="text-xs text-zinc-500 mb-3">Monthly net wages — last 6 months</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={wageData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="wage" name="Net Wage" stroke="#6366f1" fill="url(#wGrad)" strokeWidth={2.5} dot={{ fill:'#6366f1', r:3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className={cn('w-2 h-2 rounded-full',
              worker.todayStatus === 'PRESENT' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
            Today: {worker.todayStatus}
            {worker.todayOutput ? ` · ${worker.todayOutput} m output` : ''}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm gap-1.5"><Download size={12} />Slip</button>
            <button className="btn-primary btn-sm">Edit Worker</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ─── main dashboard ────────────────────────────────────────────────────── */
export default function WorkerDashboard() {
  const { user }              = useAuth()
  const [search, setSearch]   = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [selected, setSelected]     = useState(null)
  const [modalOpen, setModalOpen]   = useState(false)

  const depts   = ['ALL', ...new Set(mockWorkerProfiles.map(w => w.dept))]
  const filtered = mockWorkerProfiles.filter(w => {
    const matchDept   = deptFilter === 'ALL' || w.dept === deptFilter
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
                        w.role.toLowerCase().includes(search.toLowerCase()) ||
                        w.id.toLowerCase().includes(search.toLowerCase())
    return matchDept && matchSearch
  })

  // Dept-wide stats
  const totalWorkers  = mockWorkerProfiles.length
  const totalPresent  = mockWorkerProfiles.filter(w => w.todayStatus === 'PRESENT').length
  const totalAbsent   = mockWorkerProfiles.filter(w => w.todayStatus === 'ABSENT').length
  const totalWagesMon = mockWorkerProfiles.reduce((s, w) => s + Object.values(w.monthlyWage)[0], 0)
  const avgAttendance = (mockWorkerProfiles.reduce((s, w) => s + w.daysPresent, 0) / totalWorkers).toFixed(1)

  const openWorker = (w) => { setSelected(w); setModalOpen(true) }

  const TODAY = new Date().toLocaleDateString('en-IN', {
    weekday:'long', day:'numeric', month:'long', year:'numeric',
  })

  return (
    <div className="page-root">

      {/* ── Header ── */}
      <PageHeader
        title="Worker Dashboard"
        subtitle={`${ROLE_LABELS[user?.role] || user?.role} · ${TODAY}`}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm gap-1.5"><Download size={13} />Export</button>
            <button className="btn-primary btn-sm gap-1.5"><UserCheck size={13} />Mark Attendance</button>
          </div>
        }
      />

      {/* ── Hero summary strip ── */}
      <div className="card overflow-hidden">
        <div className="relative px-6 py-5 bg-gradient-to-r from-primary-950/60 via-zinc-900 to-zinc-900">
          <div className="absolute left-0 top-0 w-56 h-full bg-gradient-to-r from-primary-500/10 to-transparent pointer-events-none" />
          <div className="relative grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-6">
            <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center shrink-0">
                <Users size={20} className="text-primary-400" />
              </div>
              <div>
                <p className="text-3xl font-black text-zinc-50 leading-none">{totalPresent}</p>
                <p className="text-xs text-zinc-500 mt-0.5">of {totalWorkers} present today</p>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Absent Today</p>
              <p className="text-2xl font-bold text-red-400">{totalAbsent}</p>
              <p className="text-2xs text-zinc-600">{((totalAbsent/totalWorkers)*100).toFixed(0)}% of workforce</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Avg Days (Oct)</p>
              <p className="text-2xl font-bold text-emerald-400">{avgAttendance}</p>
              <p className="text-2xs text-zinc-600">days per worker</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Monthly Wages</p>
              <p className="text-2xl font-bold text-zinc-50">{formatCurrencyFull(totalWagesMon)}</p>
              <p className="text-2xs text-zinc-600">Oct 2026 total</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">On Overtime</p>
              <p className="text-2xl font-bold text-primary-400">
                {mockWorkerProfiles.filter(w => w.overtimeHrs > 0).length}
              </p>
              <p className="text-2xs text-zinc-600">workers this month</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid xl:grid-cols-2 gap-4">

        {/* Monthly attendance trend */}
        <div className="card">
          <div className="section-header">
            <div>
              <p className="section-title">Monthly Attendance Trend</p>
              <p className="text-xs text-zinc-500 mt-0.5">Department-wide — last 6 months</p>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={mockDeptAttendanceSummary} margin={{ top:4, right:4, left:-16, bottom:0 }} barGap={4}>
                <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="present"  name="Present"  fill="#10b981" radius={[4,4,0,0]} maxBarSize={24} />
                <Bar dataKey="absent"   name="Absent"   fill="#ef4444" radius={[4,4,0,0]} maxBarSize={24} />
                <Bar dataKey="halfDay"  name="Half Day" fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wages trend */}
        <div className="card">
          <div className="section-header">
            <div>
              <p className="section-title">Monthly Wage Trend</p>
              <p className="text-xs text-zinc-500 mt-0.5">Total payroll + overtime — last 6 months</p>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={mockWageTrend} margin={{ top:4, right:4, left:-10, bottom:0 }}>
                <defs>
                  <linearGradient id="gWage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="total"    name="Total Wages" stroke="#6366f1" fill="url(#gWage)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="overtime" name="Overtime"    stroke="#f59e0b" fill="url(#gOT)"   strokeWidth={2}   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Today's quick status row ── */}
      <div>
        <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
          <UserCheck size={14} className="text-zinc-500" />
          Today's Attendance — {new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
          {mockWorkerProfiles.map(w => {
            const isPresent = w.todayStatus === 'PRESENT'
            const isAbsent  = w.todayStatus === 'ABSENT'
            return (
              <button
                key={w.id}
                onClick={() => openWorker(w)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-2xl border cursor-pointer',
                  'transition-all duration-150 hover:scale-105 hover:shadow-glow-sm text-center',
                  isPresent ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60'
                            : isAbsent  ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/60'
                            : 'bg-amber-500/10 border-amber-500/30',
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs',
                  w.color,
                )}>
                  {w.initials}
                </div>
                <p className="text-2xs font-semibold text-zinc-300 leading-tight truncate w-full">{w.name.split(' ')[0]}</p>
                <span className={cn('text-[10px] font-bold',
                  isPresent ? 'text-emerald-400' : isAbsent ? 'text-red-400' : 'text-amber-400')}>
                  {w.todayStatus === 'PRESENT' ? '✓ In' : w.todayStatus === 'ABSENT' ? '✗ Out' : '½ Half'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Worker list with search/filter ── */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <Users size={14} className="text-zinc-500" />
            All Workers
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {depts.map(d => (
              <button key={d} onClick={() => setDeptFilter(d)}
                className={cn('btn-secondary btn-sm',
                  deptFilter === d && 'bg-primary-500/15 border-primary-500/50 text-primary-300')}>
                {d}
              </button>
            ))}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input className="input-sm pl-7 w-40" placeholder="Search…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(w => {
            const attendPct = Math.round((w.daysPresent / (w.daysPresent + w.daysAbsent + w.halfDays)) * 100)
            const netPay    = Object.values(w.monthlyWage)[0]
            const isPresent = w.todayStatus === 'PRESENT'

            return (
              <div
                key={w.id}
                onClick={() => openWorker(w)}
                className="card-hover p-5 cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative shrink-0">
                    <div className={cn('w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm', w.color)}>
                      {w.initials}
                    </div>
                    <span className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900',
                      isPresent ? 'bg-emerald-400' : 'bg-red-500',
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-100 text-sm truncate">{w.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{w.role}</p>
                    <span className="badge badge-purple text-[10px] mt-1">{w.dept}</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-700 mt-1 shrink-0" />
                </div>

                {/* Attendance bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-2xs mb-1">
                    <span className="text-zinc-500">Attendance</span>
                    <span className={cn('font-bold', attendPct >= 90 ? 'text-emerald-400' : attendPct >= 75 ? 'text-amber-400' : 'text-red-400')}>
                      {attendPct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500',
                        attendPct >= 90 ? 'bg-emerald-500' : attendPct >= 75 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{ width: `${attendPct}%` }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center border-t border-zinc-800/60 pt-3">
                  <div>
                    <p className="text-emerald-400 font-bold text-sm">{w.daysPresent}</p>
                    <p className="text-2xs text-zinc-600">Present</p>
                  </div>
                  <div>
                    <p className="text-primary-400 font-bold text-sm">{w.overtimeHrs}h</p>
                    <p className="text-2xs text-zinc-600">Overtime</p>
                  </div>
                  <div>
                    <p className="text-zinc-100 font-bold text-sm">
                      ₹{Math.round(netPay/1000)}K
                    </p>
                    <p className="text-2xs text-zinc-600">Net pay</p>
                  </div>
                </div>

                {/* Today status */}
                <div className={cn(
                  'mt-3 px-3 py-1.5 rounded-xl text-center text-xs font-semibold',
                  isPresent
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                    : 'bg-red-500/10 text-red-400 border border-red-500/25',
                )}>
                  {isPresent
                    ? `✓ Present today · ${w.todayShift} shift${w.todayOutput ? ` · ${w.todayOutput} m` : ''}`
                    : `✗ Absent today`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Worker detail modal */}
      <WorkerDetailModal
        worker={selected}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setTimeout(() => setSelected(null), 200) }}
      />
    </div>
  )
}
