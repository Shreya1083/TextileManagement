import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  CheckCircle2, XCircle, Clock,
  Banknote, TrendingUp, Zap, Download,
  UserCheck, Loader2, AlertTriangle, RefreshCw, FileText, Lock,
  CalendarDays, Star, Award, ClipboardList, Sparkles,
} from 'lucide-react'
import { PageHeader }  from '../../components/ui/PageHeader'
import { useAuth }     from '../../context/AuthContext'
import { formatCurrencyFull, cn } from '../../lib/utils'
import { mockWorkerProfiles, ATTENDANCE_LABELS } from '../../mocks/data'
import { getWorkerWages } from '../../services/wageService'

/* ── colour per worker ────────────────────────────────────────────────── */
const WORKER_COLORS = [
  'from-primary-500 to-violet-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-indigo-500 to-blue-600',
]

function getWorkerColor(workerId) {
  const idx = parseInt((workerId || 'W-001').replace(/W-0*/g, ''), 10) - 1
  return WORKER_COLORS[Math.abs(idx) % WORKER_COLORS.length]
}

/* ── small reusable card ─────────────────────────────────────────────── */
function KpiCard({ icon: Icon, value, label, sub, color = 'text-zinc-50', bg = 'bg-zinc-800/50' }) {
  return (
    <div className={cn('rounded-2xl p-4', bg)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">{label}</p>
        <Icon size={14} className={color} />
      </div>
      <p className={cn('text-2xl font-black leading-none', color)}>{value}</p>
      {sub && <p className="text-2xs text-zinc-600 mt-1.5">{sub}</p>}
    </div>
  )
}

/* ── attendance mini-calendar ─────────────────────────────────────────── */
function MiniCalendar({ attendance }) {
  const startDay = 4
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  const attList = attendance && attendance.length > 0 ? attendance : [
    'S','P','P','P','P','P','S',
    'S','P','P','P','P','P','S',
    'S','P','P','P','P','P','S',
    'S','P','P','P','P','P','S',
    'S','P','P',
  ]
  attList.forEach((s, i) => cells.push({ day: i + 1, status: s }))

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-2xs font-bold text-zinc-600">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />
          const cfg = ATTENDANCE_LABELS[cell.status] || ATTENDANCE_LABELS.P
          return (
            <div
              key={i}
              title={`${cell.day} — ${cfg.label}`}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold text-white',
                'border transition-all hover:scale-110 cursor-default',
                cfg.color, cfg.border,
                cell.status === 'S' ? 'opacity-30' : '',
              )}
            >
              {cell.day}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {Object.entries(ATTENDANCE_LABELS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1 text-2xs text-zinc-500">
            <span className={cn('w-2 h-2 rounded-sm', v.color)} />
            {v.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── wage breakdown ──────────────────────────────────────────────────── */
function WageCard({ worker, wageState, onRetry }) {
  if (wageState.loading) {
    return (
      <div className="p-8 text-center space-y-3 bg-zinc-800/30 rounded-2xl border border-zinc-800 animate-pulse">
        <Loader2 size={24} className="mx-auto text-primary-400 animate-spin" />
        <p className="text-xs font-semibold text-zinc-300">Fetching wage breakdown from server…</p>
      </div>
    )
  }

  if (wageState.error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/25 rounded-2xl space-y-3 text-center">
        <AlertTriangle size={24} className="mx-auto text-red-400" />
        <p className="text-xs font-semibold text-red-300">Unable to load wage data</p>
        <p className="text-2xs text-zinc-400 max-w-sm mx-auto">{wageState.error}</p>
        <button onClick={onRetry} className="btn-secondary btn-xs gap-1.5 mx-auto text-zinc-200">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    )
  }

  const record = wageState.latestRecord
  if (!record) {
    return (
      <div className="p-8 text-center space-y-3 bg-zinc-800/20 border border-zinc-800 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-500">
          <Banknote size={22} />
        </div>
        <p className="text-sm font-bold text-zinc-200">No wage data available</p>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          No payroll or wage disbursements have been recorded for {worker?.name} yet.
        </p>
      </div>
    )
  }

  const basic      = record.grossWage
  const overtime   = record.overtime
  const deductions = record.deductions
  const net        = record.netWage

  return (
    <div className="space-y-3">
      <div className="bg-zinc-800/50 rounded-2xl p-5 space-y-3 border border-zinc-700/40">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-700/40">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <FileText size={13} className="text-primary-400" />
            {record.monthFullName} {record.year} Statement
          </span>
          {record.isLocked && (
            <span className="badge badge-gray text-2xs flex items-center gap-1">
              <Lock size={10} /> Locked
            </span>
          )}
        </div>

        <div className="flex justify-between items-start text-xs gap-3">
          <span className="text-zinc-400">Base salary / Attendance ({record.daysPresent} days)</span>
          <span className="font-mono font-bold text-zinc-200">+ ₹{Math.round(basic).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between items-start text-xs gap-3">
          <span className="text-zinc-400">Overtime earnings</span>
          <span className="font-mono font-bold text-amber-400">+ ₹{Math.round(overtime).toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between items-start text-xs gap-3">
          <span className="text-zinc-400">Deductions</span>
          <span className="font-mono font-bold text-red-400">
            {deductions > 0 ? `− ₹${Math.round(deductions).toLocaleString('en-IN')}` : '₹0'}
          </span>
        </div>

        {/* Total Net */}
        <div className="border-t border-zinc-700/60 pt-3 flex justify-between items-center">
          <span className="text-sm font-bold text-zinc-200">Net Pay — {record.monthName} {record.year}</span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            ₹{Math.round(net).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <button className="btn-secondary w-full gap-2">
        <Download size={13} />Download Pay Slip
      </button>
    </div>
  )
}

/* ── chart tooltip ────────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const fullTitle = payload[0]?.payload?.fullLabel || label
  return (
    <div className="chart-tooltip bg-zinc-900 border border-zinc-700/80 p-2.5 rounded-xl shadow-elevated">
      <p className="text-zinc-300 text-xs mb-1 font-bold">{fullTitle}</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: ₹{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
        </p>
      ))}
    </div>
  )
}

/* ── main component ──────────────────────────────────────────────────── */
export default function MyDashboard() {
  const { user }     = useAuth()
  const [tab, setTab] = useState('attendance')

  // Find this worker's full profile using workerId from the logged-in user
  const profile = mockWorkerProfiles.find(w => w.id === user?.workerId)
    || mockWorkerProfiles[0] // fallback for demo

  const [wageState, setWageState] = useState({
    loading: true,
    error: null,
    records: [],
    latestRecord: null,
    monthlyTrend: [],
    ytdEarnings: 0,
  })

  const loadWages = async () => {
    setWageState(p => ({ ...p, loading: true, error: null }))
    try {
      const data = await getWorkerWages(user?.workerId || profile.id)
      setWageState({ loading: false, error: null, ...data })
    } catch (err) {
      setWageState(p => ({
        ...p,
        loading: false,
        error: err.response?.data?.message || err.message || 'Failed to fetch wages from server',
      }))
    }
  }

  useEffect(() => {
    loadWages()
  }, [user?.workerId, profile.id])

  const color       = getWorkerColor(profile.id)
  const daysPresent = wageState.latestRecord?.daysPresent || profile.daysPresent || 24
  const daysAbsent  = profile.daysAbsent || 1
  const halfDays    = profile.halfDays || 0
  const attendPct   = Math.round((daysPresent / (daysPresent + daysAbsent + halfDays)) * 100)
  const netPay      = wageState.latestRecord?.netWage ? Math.round(wageState.latestRecord.netWage) : (profile.wage * daysPresent)

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="page-root">

      {/* ── Header ── */}
      <PageHeader
        title={`${greeting()}, ${profile.name.split(' ')[0]}`}
        subtitle={`Floor Worker · ${profile.role} · ${profile.dept} · ${today}`}
      />

      {/* ── Hero identity card ── */}
      <div className="card overflow-hidden">
        <div className="relative p-6 bg-gradient-to-r from-primary-950/50 via-zinc-900 to-zinc-900">
          <div className="absolute left-0 top-0 w-48 h-full bg-gradient-to-r from-primary-500/10 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-5 flex-wrap">
            {/* Big avatar */}
            <div className={cn(
              'w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-black text-3xl shadow-glow shrink-0',
              color,
            )}>
              {profile.initials}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-black text-zinc-50">{profile.name}</p>
              <p className="text-sm text-zinc-400 mt-0.5">{profile.role} — {profile.dept} Department</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-xs text-zinc-500 font-mono">{profile.id}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">{profile.shift} shift</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">
                  Joined {new Date(profile.joined).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
                {profile.machine && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500 font-mono">{profile.machine}</span>
                  </>
                )}
              </div>
            </div>

            {/* Today's status chip */}
            <div className={cn(
              'shrink-0 px-5 py-3 rounded-2xl border text-center',
              profile.todayStatus === 'PRESENT'
                ? 'bg-emerald-500/15 border-emerald-500/30'
                : 'bg-red-500/15 border-red-500/30',
            )}>
              <p className={cn('text-2xl font-black', profile.todayStatus === 'PRESENT' ? 'text-emerald-400' : 'text-red-400')}>
                {profile.todayStatus === 'PRESENT' ? '✓' : '✗'}
              </p>
              <p className={cn('text-xs font-bold mt-0.5', profile.todayStatus === 'PRESENT' ? 'text-emerald-400' : 'text-red-400')}>
                {profile.todayStatus === 'PRESENT' ? 'Present Today' : 'Absent Today'}
              </p>
              {profile.todayOutput && (
                <p className="text-2xs text-zinc-500 mt-0.5">{profile.todayOutput} m output</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={CheckCircle2} value={profile.daysPresent}          label="Days Present"  sub="This month"           color="text-emerald-400" bg="bg-emerald-500/10 border border-emerald-500/20" />
        <KpiCard icon={XCircle}      value={profile.daysAbsent}           label="Days Absent"   sub="This month"           color="text-red-400"     bg="bg-red-500/10 border border-red-500/20"         />
        <KpiCard icon={Clock}        value={`${profile.halfDays} H`}      label="Half Days"     sub="Counted as 0.5 day"   color="text-amber-400"   bg="bg-amber-500/10 border border-amber-500/20"     />
        <KpiCard icon={Zap}          value={`${profile.overtimeHrs}h`}    label="Overtime"      sub="Extra hours worked"   color="text-primary-400" bg="bg-primary-500/10 border border-primary-500/20" />
        <KpiCard icon={UserCheck}    value={`${attendPct}%`}              label="Attendance"    sub="This month rate"      color={attendPct >= 90 ? 'text-emerald-400' : 'text-amber-400'} bg="bg-zinc-800/50" />
        <KpiCard icon={Banknote}     value={`₹${Math.round(netPay/1000)}K`} label="Net Pay"     sub="October 2026"         color="text-zinc-50"     bg="bg-zinc-800/50"                                  />
      </div>

      {/* ── Main content: tabs ── */}
      <div className="card overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-zinc-800/80 px-1 pt-1">
          {[
            { key: 'attendance', label: 'Attendance Calendar', icon: CalendarDays },
            { key: 'wages',      label: 'Wage Breakdown', icon: Banknote },
            { key: 'trend',      label: 'Earnings Trend', icon: TrendingUp },
            { key: 'performance',label: 'Performance', icon: Star },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-5 py-3.5 text-xs font-semibold border-b-2 -mb-px transition-all duration-150',
                tab === t.key
                  ? 'border-primary-500 text-primary-300'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300',
              )}
            >
              <t.icon size={14} className="inline-block mr-2" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── Attendance Calendar ── */}
          {tab === 'attendance' && (
            <div className="animate-fade-in space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-200">October 2026</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />{profile.daysPresent} Present
                  </span>
                  <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-red-500" />{profile.daysAbsent} Absent
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />{profile.halfDays} Half
                  </span>
                </div>
              </div>

              <MiniCalendar attendance={profile.attendance} />

              {/* Summary bar */}
              <div className="pt-4 border-t border-zinc-800/60">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-500 font-medium">Monthly attendance rate</span>
                  <span className={cn('font-bold', attendPct >= 90 ? 'text-emerald-400' : 'text-amber-400')}>{attendPct}%</span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', attendPct >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400')}
                    style={{ width: `${attendPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-2xs text-zinc-600">
                  <span>0%</span><span>Target 90%</span><span>100%</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Wage Breakdown ── */}
          {tab === 'wages' && (
            <div className="animate-fade-in max-w-lg">
              <p className="text-sm font-bold text-zinc-200 mb-5">Current Wage Statement</p>
              <WageCard worker={profile} wageState={wageState} onRetry={loadWages} />
            </div>
          )}

          {/* ── Earnings Trend ── */}
          {tab === 'trend' && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-zinc-200">Net Earnings History</p>
                  <p className="text-2xs text-zinc-500 mt-0.5">Chronological wage records across months</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold font-mono">
                  <TrendingUp size={12} />
                  Total: {formatCurrencyFull(wageState.ytdEarnings || 0)}
                </span>
              </div>

              {wageState.loading && (
                <div className="p-8 text-center space-y-3 bg-zinc-800/30 rounded-2xl border border-zinc-800 animate-pulse">
                  <Loader2 size={24} className="mx-auto text-primary-400 animate-spin" />
                  <p className="text-xs font-semibold text-zinc-300">Loading wage history trend…</p>
                </div>
              )}

              {wageState.error && (
                <div className="p-6 bg-red-500/10 border border-red-500/25 rounded-2xl space-y-3 text-center">
                  <AlertTriangle size={24} className="mx-auto text-red-400" />
                  <p className="text-xs font-semibold text-red-300">Unable to load trend data</p>
                  <p className="text-2xs text-zinc-400">{wageState.error}</p>
                  <button onClick={loadWages} className="btn-secondary btn-xs gap-1.5 mx-auto text-zinc-200">
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              )}

              {!wageState.loading && !wageState.error && (!wageState.monthlyTrend || wageState.monthlyTrend.length === 0) && (
                <div className="p-8 text-center space-y-3 bg-zinc-800/20 border border-zinc-800 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-500">
                    <TrendingUp size={22} />
                  </div>
                  <p className="text-sm font-bold text-zinc-200">No monthly wage history</p>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    No historical wage records found for this worker across months.
                  </p>
                </div>
              )}

              {!wageState.loading && !wageState.error && wageState.monthlyTrend && wageState.monthlyTrend.length > 0 && (
                <>
                  <div className="bg-zinc-800/30 p-3 rounded-2xl border border-zinc-800/80">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={wageState.monthlyTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="myWageGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false}
                          tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
                        <Tooltip content={<ChartTip />} />
                        <Area type="monotone" dataKey="netWage" name="Net Wage" stroke="#6366f1" fill="url(#myWageGrad)" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3.5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Monthly wage history table */}
                  <div className="mt-2 divide-y divide-zinc-800/50">
                    {wageState.monthlyTrend.slice().reverse().map(m => (
                      <div key={m.key} className="flex items-center justify-between py-2.5 text-xs">
                        <span className="text-zinc-300 font-medium">{m.fullLabel}</span>
                        <div className="flex items-center gap-3 font-mono">
                          {m.overtime > 0 && <span className="text-amber-400 text-2xs">+OT ₹{m.overtime.toLocaleString('en-IN')}</span>}
                          <span className="font-bold text-zinc-100">₹{m.netWage.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3 text-sm font-bold border-t border-zinc-700/60">
                      <span className="text-zinc-300">Total Recorded</span>
                      <span className="text-emerald-400 font-mono">₹{Math.round(wageState.ytdEarnings).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Performance ── */}
          {tab === 'performance' && (
            <div className="animate-fade-in space-y-5">
              <p className="text-sm font-bold text-zinc-200">Performance — October 2026</p>

              {/* Today's output */}
              {profile.todayOutput && (
                <div className="bg-primary-500/10 border border-primary-500/25 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center shrink-0">
                    <Zap size={20} className="text-primary-400" />
                  </div>
                  <div>
                    <p className="text-2xs text-primary-400 uppercase tracking-wider font-bold">Today's Output</p>
                    <p className="text-2xl font-black text-zinc-50 mt-0.5">{profile.todayOutput} <span className="text-sm font-normal text-zinc-400">metres</span></p>
                  </div>
                </div>
              )}

              {/* Machine assignment */}
              {profile.machine && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/50 rounded-2xl p-4">
                    <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1.5">Assigned Machine</p>
                    <p className="text-lg font-bold text-zinc-100 font-mono">{profile.machine}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{profile.shift} shift</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-2xl p-4">
                    <p className="text-2xs text-zinc-500 uppercase tracking-wide mb-1.5">Department</p>
                    <p className="text-lg font-bold text-zinc-100">{profile.dept}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{profile.role}</p>
                  </div>
                </div>
              )}

              {/* Achievements */}
              <div>
                <p className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wide">Month Highlights</p>
                <div className="space-y-2.5">
                  {[
                    {
                      icon: Award,
                      title: `${attendPct}% attendance rate`,
                      sub: attendPct >= 95 ? 'Excellent! Top performer' : attendPct >= 90 ? 'Good attendance' : 'Can improve',
                      color: attendPct >= 95 ? 'text-emerald-400' : attendPct >= 90 ? 'text-amber-400' : 'text-zinc-400',
                    },
                    {
                      icon: profile.overtimeHrs > 5 ? Zap : ClipboardList,
                      title: `${profile.overtimeHrs} overtime hours`,
                      sub: profile.overtimeHrs > 5 ? 'Extra dedication this month' : 'Standard hours',
                      color: 'text-primary-400',
                    },
                    {
                      icon: profile.daysAbsent === 0 ? Sparkles : CalendarDays,
                      title: profile.daysAbsent === 0 ? 'Perfect attendance!' : `${profile.daysAbsent} absent day(s)`,
                      sub: profile.daysAbsent === 0 ? 'Zero absences this month' : 'Please inform supervisor in advance',
                      color: profile.daysAbsent === 0 ? 'text-emerald-400' : 'text-amber-400',
                    },
                  ].map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/40 rounded-xl">
                      <span className={cn('mt-0.5 shrink-0', a.color)}>
                        <a.icon size={17} />
                      </span>
                      <div>
                        <p className={cn('text-sm font-semibold', a.color)}>{a.title}</p>
                        <p className="text-2xs text-zinc-500 mt-0.5">{a.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
