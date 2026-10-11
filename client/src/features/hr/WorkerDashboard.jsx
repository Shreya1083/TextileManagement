import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  Users, CheckCircle2, Clock,
  Calendar, Search,
  ChevronRight, Download, Banknote,
  TrendingUp, AlertCircle, AlertTriangle, Loader2, RefreshCw,
  FileText, Lock, Check,
} from 'lucide-react'
import { PageHeader }  from '../../components/ui/PageHeader'
import { Modal }       from '../../components/ui/Modal'
import { useToast }    from '../../components/ui/Toast'
import { useAuth, ROLE_LABELS } from '../../context/AuthContext'
import { formatCurrencyFull, cn } from '../../lib/utils'
import { exportCSV }   from '../../lib/exportUtils'
import {
  mockWorkerProfiles, ATTENDANCE_LABELS,
  mockDeptAttendanceSummary, mockWageTrend,
} from '../../mocks/data'
import { getStoredWorkers } from '../../services/hrStorage'
import { getWorkerWages }   from '../../services/wageService'

/* ─── constants ──────────────────────────────────────────────────────────── */
const MONTH_LABEL = 'October 2026'

/* ─── Custom Tooltip for Charts ─────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const fullTitle = payload[0]?.payload?.fullLabel || label
  return (
    <div className="chart-tooltip bg-zinc-900 border border-zinc-700/80 p-2.5 rounded-xl shadow-elevated">
      <p className="text-zinc-300 text-xs mb-1.5 font-bold">{fullTitle}</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number'
            ? `₹${p.value.toLocaleString('en-IN')}`
            : p.value}
        </p>
      ))}
    </div>
  )
}

/* ─── attendance calendar for a single worker ──────────────────────────── */
function AttendanceCalendar({ attendance = [] }) {
  // Oct 2026 starts on Thursday (day index 4) or standard month grid
  const startDay = 4
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  
  // Default attendance if empty
  const defaultAtt = [
    'S','P','P','P','P','P','S',
    'S','P','P','P','P','P','S',
    'S','P','P','P','P','P','S',
    'S','P','P','P','P','P','S',
    'S','P','P',
  ]
  const attList = attendance && attendance.length > 0 ? attendance : defaultAtt
  attList.forEach((s, i) => cells.push({ day: i + 1, status: s }))

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-2xs font-bold text-zinc-600">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />
          const cfg = ATTENDANCE_LABELS[cell.status] || ATTENDANCE_LABELS.P
          return (
            <div
              key={i}
              title={`${cell.day} Oct — ${cfg.label}`}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold',
                'border transition-all hover:scale-110 cursor-default select-none',
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

/* ─── Wage Breakdown Component ──────────────────────────────────────────── */
function WageBreakdown({ worker, wageData, loading, error, onRetry }) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(null)

  // Choose currently displayed record
  const records = wageData?.records || []
  const currentRecord = useMemo(() => {
    if (!records.length) return null
    if (selectedMonthKey) {
      return records.find(r => `${r.year}-${r.month}` === selectedMonthKey) || records[records.length - 1]
    }
    return records[records.length - 1] // latest
  }, [records, selectedMonthKey])

  // 1. Loading State
  if (loading) {
    return (
      <div className="p-8 text-center space-y-3 bg-zinc-800/30 rounded-2xl border border-zinc-800 animate-pulse">
        <Loader2 size={24} className="mx-auto text-primary-400 animate-spin" />
        <p className="text-xs font-semibold text-zinc-300">Fetching wage breakdown from server…</p>
        <p className="text-2xs text-zinc-500">Retrieving official wage and payroll components</p>
      </div>
    )
  }

  // 2. Error State
  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/25 rounded-2xl space-y-3 text-center">
        <AlertTriangle size={24} className="mx-auto text-red-400" />
        <p className="text-xs font-semibold text-red-300">Unable to load wage data</p>
        <p className="text-2xs text-zinc-400 max-w-sm mx-auto">{error}</p>
        <button
          onClick={onRetry}
          className="btn-secondary btn-xs gap-1.5 mx-auto text-zinc-200"
        >
          <RefreshCw size={12} />
          Retry Request
        </button>
      </div>
    )
  }

  // 3. Empty State (No wage records in database)
  if (!currentRecord) {
    const dailyWageRate = worker?.dailyWage || worker?.wage || 0
    return (
      <div className="p-8 text-center space-y-3 bg-zinc-800/20 border border-zinc-800 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-500">
          <Banknote size={22} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-zinc-200">No wage data available</p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            No payroll or wage disbursements have been recorded for <span className="text-zinc-300 font-medium">{worker?.name}</span> ({worker?.id || worker?.employeeId}).
          </p>
        </div>
        {dailyWageRate > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-400">
            <span>Configured Base Rate:</span>
            <span className="font-mono font-bold text-emerald-400">₹{dailyWageRate}/day</span>
          </div>
        )}
      </div>
    )
  }

  // 4. Data State (Supported database wage components)
  const gross     = currentRecord.grossWage
  const overtime  = currentRecord.overtime
  const deductions = currentRecord.deductions
  const netWage   = currentRecord.netWage
  const days      = currentRecord.daysPresent

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Month selector header if multiple months exist */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-primary-400" />
          <p className="text-xs font-bold text-zinc-200">
            {currentRecord.monthFullName} {currentRecord.year} Payroll Statement
          </p>
          {currentRecord.isLocked && (
            <span className="badge badge-gray text-2xs flex items-center gap-1">
              <Lock size={10} /> Closed
            </span>
          )}
        </div>

        {records.length > 1 && (
          <select
            className="input-sm text-xs bg-zinc-800/80 border-zinc-700/60 py-1"
            value={`${currentRecord.year}-${currentRecord.month}`}
            onChange={e => setSelectedMonthKey(e.target.value)}
          >
            {records.slice().reverse().map(r => (
              <option key={`${r.year}-${r.month}`} value={`${r.year}-${r.month}`}>
                {r.monthFullName} {r.year}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Breakdown Breakdown Breakdown Rows */}
      <div className="bg-zinc-800/50 rounded-2xl p-4 space-y-3 border border-zinc-700/40">
        {/* Base Wage Component */}
        <div className="flex justify-between items-start text-xs gap-3">
          <div>
            <p className="text-zinc-200 font-medium">Base Salary / Attendance Earnings</p>
            <p className="text-2xs text-zinc-500">
              {days > 0 ? `${days} payable days recorded` : 'Standard monthly base'}
            </p>
          </div>
          <span className="font-mono font-semibold text-zinc-200 shrink-0">
            + ₹{Math.round(gross).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Overtime Component */}
        <div className="flex justify-between items-start text-xs gap-3 border-t border-zinc-800/80 pt-2.5">
          <div>
            <p className="text-zinc-200 font-medium">Overtime Earnings</p>
            <p className="text-2xs text-zinc-500">Overtime hours calculated at approved multiplier</p>
          </div>
          <span className="font-mono font-semibold text-amber-400 shrink-0">
            + ₹{Math.round(overtime).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Deductions Component */}
        <div className="flex justify-between items-start text-xs gap-3 border-t border-zinc-800/80 pt-2.5">
          <div>
            <p className="text-zinc-200 font-medium">Statutory & Policy Deductions</p>
            <p className="text-2xs text-zinc-500">Taxes, advances, or policy withholdings</p>
          </div>
          <span className="font-mono font-semibold text-red-400 shrink-0">
            {deductions > 0 ? `− ₹${Math.round(deductions).toLocaleString('en-IN')}` : '₹0'}
          </span>
        </div>

        {/* Net Wages Total (gross + overtime - deductions) */}
        <div className="border-t border-zinc-700/80 pt-3 flex justify-between items-center">
          <div>
            <span className="text-sm font-bold text-zinc-100 block">Net Wages Payable</span>
            <span className="text-2xs text-zinc-500 font-mono">
              ₹{Math.round(gross).toLocaleString('en-IN')} + ₹{Math.round(overtime).toLocaleString('en-IN')} − ₹{Math.round(deductions).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-lg font-black text-emerald-400 font-mono">
            ₹{Math.round(netWage).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-zinc-800/40 rounded-xl p-2.5 border border-zinc-700/30">
          <p className="text-emerald-400 font-bold text-sm">{days}</p>
          <p className="text-2xs text-zinc-500 mt-0.5">Days Present</p>
        </div>
        <div className="bg-zinc-800/40 rounded-xl p-2.5 border border-zinc-700/30">
          <p className="text-amber-400 font-bold text-sm">₹{Math.round(overtime)}</p>
          <p className="text-2xs text-zinc-500 mt-0.5">Overtime Pay</p>
        </div>
        <div className="bg-zinc-800/40 rounded-xl p-2.5 border border-zinc-700/30">
          <p className="text-zinc-200 font-bold text-sm font-mono">
            {currentRecord.isLocked ? 'Closed' : 'Approved'}
          </p>
          <p className="text-2xs text-zinc-500 mt-0.5">Audit Status</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Monthly Trend Component ───────────────────────────────────────────── */
function MonthlyTrend({ wageData, loading, error, onRetry }) {
  // 1. Loading State
  if (loading) {
    return (
      <div className="p-8 text-center space-y-3 bg-zinc-800/30 rounded-2xl border border-zinc-800 animate-pulse">
        <Loader2 size={24} className="mx-auto text-primary-400 animate-spin" />
        <p className="text-xs font-semibold text-zinc-300">Loading wage history trend…</p>
        <p className="text-2xs text-zinc-500">Aggregating historical monthly wage records</p>
      </div>
    )
  }

  // 2. Error State
  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/25 rounded-2xl space-y-3 text-center">
        <AlertTriangle size={24} className="mx-auto text-red-400" />
        <p className="text-xs font-semibold text-red-300">Unable to load trend data</p>
        <p className="text-2xs text-zinc-400 max-w-sm mx-auto">{error}</p>
        <button
          onClick={onRetry}
          className="btn-secondary btn-xs gap-1.5 mx-auto text-zinc-200"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    )
  }

  const trend = wageData?.monthlyTrend || []

  // 3. Empty State (No monthly history)
  if (trend.length === 0) {
    return (
      <div className="p-8 text-center space-y-3 bg-zinc-800/20 border border-zinc-800 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-500">
          <TrendingUp size={22} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-zinc-200">No monthly wage history</p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            There are no recorded historical wage records across months for this worker yet. Monthly history will generate automatically as muster rolls are completed.
          </p>
        </div>
      </div>
    )
  }

  // 4. Data State with Recharts Chart
  const ytdTotal = wageData?.ytdEarnings || trend.reduce((s, r) => s + r.netWage, 0)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-300">Monthly Net Wages Trend</p>
          <p className="text-2xs text-zinc-500 mt-0.5">
            Chronological earnings history across {trend.length} recorded months
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xs text-zinc-500 block uppercase font-bold tracking-wider">Total Recorded</span>
          <span className="text-sm font-mono font-black text-emerald-400">
            ₹{Math.round(ytdTotal).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-zinc-800/30 p-3 rounded-2xl border border-zinc-800/80">
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={trend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="workerWageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="workerOtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={{ stroke: '#27272a' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`}
            />
            <Tooltip content={<ChartTip />} />
            <Area
              type="monotone"
              dataKey="netWage"
              name="Net Wage"
              stroke="#6366f1"
              fill="url(#workerWageGrad)"
              strokeWidth={2.5}
              dot={{ fill: '#6366f1', r: 3 }}
            />
            <Area
              type="monotone"
              dataKey="overtime"
              name="Overtime"
              stroke="#f59e0b"
              fill="url(#workerOtGrad)"
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chronological Table Summary */}
      <div className="rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="max-h-40 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-800/60 text-zinc-400 text-2xs sticky top-0 border-b border-zinc-700/60">
              <tr>
                <th className="py-2 px-3">Month</th>
                <th className="py-2 px-2 text-center">Days</th>
                <th className="py-2 px-2 text-right">Base</th>
                <th className="py-2 px-2 text-right">Overtime</th>
                <th className="py-2 px-3 text-right">Net Wages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-2xs">
              {trend.slice().reverse().map(r => (
                <tr key={r.key} className="hover:bg-zinc-800/40">
                  <td className="py-1.5 px-3 font-sans text-zinc-300 font-medium">{r.fullLabel}</td>
                  <td className="py-1.5 px-2 text-center text-zinc-400">{r.daysPresent}</td>
                  <td className="py-1.5 px-2 text-right text-zinc-400">₹{r.grossWage.toLocaleString('en-IN')}</td>
                  <td className="py-1.5 px-2 text-right text-amber-400">₹{r.overtime.toLocaleString('en-IN')}</td>
                  <td className="py-1.5 px-3 text-right text-emerald-400 font-bold">₹{r.netWage.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── Worker Detail Modal ─────────────────────────────────────────────── */
function WorkerDetailModal({ worker, open, onClose }) {
  const [tab, setTab]             = useState('attendance')
  const [wageState, setWageState] = useState({
    loading: true,
    error: null,
    records: [],
    latestRecord: null,
    monthlyTrend: [],
    ytdEarnings: 0,
  })

  // Fetch real wage records whenever selected worker changes or modal opens
  const fetchWages = async () => {
    if (!worker) return
    const idToQuery = worker.employeeId || worker.id
    setWageState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await getWorkerWages(idToQuery)
      setWageState({
        loading: false,
        error: null,
        ...data,
      })
    } catch (err) {
      setWageState(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || err.message || 'Failed to load wage records from server',
      }))
    }
  }

  useEffect(() => {
    if (open && worker) {
      fetchWages()
    }
  }, [open, worker?.id, worker?.employeeId])

  if (!worker) return null

  const daysPresent = wageState.latestRecord?.daysPresent || worker.daysPresent || worker.present || 24
  const daysAbsent  = worker.daysAbsent || 1
  const halfDays    = worker.halfDays || 0
  const totalDays   = daysPresent + daysAbsent + halfDays
  const attendPct   = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 95

  const dailyWageRate = worker.dailyWage || worker.wage || 650
  const latestNet = wageState.latestRecord?.netWage
    ? Math.round(wageState.latestRecord.netWage)
    : (worker.monthlyWage ? Object.values(worker.monthlyWage)[0] : daysPresent * dailyWageRate)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={worker.name}
      description={`${worker.role} · ${worker.department || worker.dept || 'Production'} · ${worker.employeeId || worker.id}`}
      size="xl"
    >
      <div className="space-y-5">
        {/* Worker Header Card */}
        <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/40">
          <div className={cn(
            'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-black text-xl shadow-glow-sm shrink-0',
            worker.color || 'from-primary-500 to-violet-600'
          )}>
            {worker.initials || (worker.name ? worker.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'W')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-zinc-50 truncate">{worker.name}</p>
            <p className="text-sm text-zinc-400 truncate">
              {worker.role} — {worker.department || worker.dept || 'Production'}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {worker.phone && <span className="text-2xs text-zinc-500 font-mono">{worker.phone}</span>}
              <span className="text-2xs text-zinc-700">·</span>
              <span className="text-2xs text-zinc-500">
                Joined {worker.joined || worker.joinDate ? new Date(worker.joined || worker.joinDate).toLocaleDateString('en-IN', { month:'short', year:'numeric' }) : '2021'}
              </span>
              <span className="text-2xs text-zinc-700">·</span>
              <span className="text-2xs text-zinc-500">{worker.shift || 'Morning'} shift</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-emerald-400 font-mono">
              ₹{dailyWageRate}<span className="text-xs text-zinc-500 font-normal">/day</span>
            </p>
            <p className="text-2xs text-zinc-500 mt-0.5 font-mono">
              YTD: {wageState.ytdEarnings > 0 ? formatCurrencyFull(wageState.ytdEarnings) : '—'}
            </p>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: CheckCircle2, value: `${attendPct}%`, label: 'Attendance rate', color: 'text-emerald-400' },
            { icon: Calendar,     value: daysPresent, label: 'Days present',  color: 'text-zinc-100' },
            { icon: Clock,        value: `${wageState.latestRecord?.overtime ? 'OT Pay' : (worker.overtimeHrs ? `${worker.overtimeHrs}h` : '0h')}`, label: 'Overtime', color: 'text-primary-400' },
            { icon: Banknote,     value: formatCurrencyFull(latestNet), label: 'Latest Net Pay', color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-800/50 rounded-2xl p-3 text-center border border-zinc-700/30">
              <s.icon size={14} className={cn('mx-auto mb-1.5', s.color)} />
              <p className={cn('text-base font-bold font-mono', s.color)}>{s.value}</p>
              <p className="text-2xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-zinc-800/80 pb-0">
          {[
            { key: 'attendance', label: 'Attendance Calendar' },
            { key: 'wages',      label: 'Wage Breakdown' },
            { key: 'trend',      label: 'Monthly Trend' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'border-primary-500 text-primary-300'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'attendance' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400">{MONTH_LABEL}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 font-semibold">{daysPresent} P</span>
                <span className="text-red-400 font-semibold">{daysAbsent} A</span>
                <span className="text-amber-400 font-semibold">{halfDays} H</span>
              </div>
            </div>
            <AttendanceCalendar attendance={worker.attendance} />
          </div>
        )}

        {tab === 'wages' && (
          <div className="animate-fade-in">
            <WageBreakdown
              worker={worker}
              wageData={wageState}
              loading={wageState.loading}
              error={wageState.error}
              onRetry={fetchWages}
            />
          </div>
        )}

        {tab === 'trend' && (
          <div className="animate-fade-in">
            <MonthlyTrend
              worker={worker}
              wageData={wageState}
              loading={wageState.loading}
              error={wageState.error}
              onRetry={fetchWages}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-800/60">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className={cn('w-2 h-2 rounded-full',
              worker.todayStatus === 'ABSENT' ? 'bg-red-400' : 'bg-emerald-400 animate-pulse')} />
            <span>Today: {worker.todayStatus || 'PRESENT'}</span>
            {worker.todayOutput ? ` · ${worker.todayOutput} m output` : ''}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary btn-sm"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Main Worker Dashboard ─────────────────────────────────────────────── */
export default function WorkerDashboard() {
  const { user }              = useAuth()
  const toast                 = useToast()
  const [search, setSearch]   = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [selected, setSelected]     = useState(null)
  const [modalOpen, setModalOpen]   = useState(false)

  // Use stored / DB workers merged with profiles for complete data
  const [workersList, setWorkersList] = useState(() => {
    const stored = getStoredWorkers()
    if (stored && stored.length > 0) {
      // Merge with mockWorkerProfiles to retain color and initials if present
      const profileMap = new Map(mockWorkerProfiles.map(p => [p.id, p]))
      return stored.map(w => {
        const prof = profileMap.get(w.id || w.employeeId)
        return {
          ...w,
          id: w.id || w.employeeId,
          employeeId: w.employeeId || w.id,
          wage: w.dailyWage || w.wage || 650,
          initials: prof?.initials || w.name.split(' ').map(n => n[0]).join('').slice(0, 2),
          color: prof?.color || 'from-primary-500 to-violet-600',
          attendance: prof?.attendance || [],
          daysPresent: w.present || prof?.daysPresent || 24,
          daysAbsent: prof?.daysAbsent || 1,
          halfDays: prof?.halfDays || 0,
          overtimeHrs: prof?.overtimeHrs || 0,
          todayStatus: prof?.todayStatus || 'PRESENT',
          todayShift: w.shift || 'Morning',
        }
      })
    }
    return mockWorkerProfiles
  })

  // Listen to workers storage updates
  useEffect(() => {
    const onWorkersUpdated = () => {
      const stored = getStoredWorkers()
      const profileMap = new Map(mockWorkerProfiles.map(p => [p.id, p]))
      setWorkersList(stored.map(w => {
        const prof = profileMap.get(w.id || w.employeeId)
        return {
          ...w,
          id: w.id || w.employeeId,
          employeeId: w.employeeId || w.id,
          wage: w.dailyWage || w.wage || 650,
          initials: prof?.initials || w.name.split(' ').map(n => n[0]).join('').slice(0, 2),
          color: prof?.color || 'from-primary-500 to-violet-600',
          attendance: prof?.attendance || [],
          daysPresent: w.present || prof?.daysPresent || 24,
          daysAbsent: prof?.daysAbsent || 1,
          halfDays: prof?.halfDays || 0,
          overtimeHrs: prof?.overtimeHrs || 0,
          todayStatus: prof?.todayStatus || 'PRESENT',
          todayShift: w.shift || 'Morning',
        }
      }))
    }
    window.addEventListener('everest:workers-updated', onWorkersUpdated)
    return () => window.removeEventListener('everest:workers-updated', onWorkersUpdated)
  }, [])

  const depts = ['ALL', ...new Set(workersList.map(w => w.department || w.dept || 'Production'))]
  const filtered = workersList.filter(w => {
    const dept = w.department || w.dept || 'Production'
    const matchDept = deptFilter === 'ALL' || dept.toLowerCase() === deptFilter.toLowerCase()
    const query = search.toLowerCase()
    const matchSearch =
      (w.name || '').toLowerCase().includes(query) ||
      (w.role || '').toLowerCase().includes(query) ||
      (w.id || '').toLowerCase().includes(query)
    return matchDept && matchSearch
  })

  // Dept-wide stats
  const totalWorkers  = workersList.length
  const totalPresent  = workersList.filter(w => w.todayStatus !== 'ABSENT').length
  const totalAbsent   = workersList.filter(w => w.todayStatus === 'ABSENT').length
  const totalWagesMon = workersList.reduce((s, w) => s + (w.daysPresent * (w.wage || 650)), 0)
  const avgAttendance = (workersList.reduce((s, w) => s + (w.daysPresent || 24), 0) / (totalWorkers || 1)).toFixed(1)

  const openWorker = (w) => {
    setSelected(w)
    setModalOpen(true)
  }

  const handleExport = () => {
    try {
      if (!filtered || filtered.length === 0) {
        toast('No workers match the selected filters to export', 'error')
        return
      }
      exportCSV({
        filename: 'workers_export.csv',
        columns: [
          'Worker ID',
          'Name',
          'Role',
          'Department',
          'Shift',
          'Daily Wage (₹)',
          'Days Present',
          'Status',
        ],
        rows: filtered.map(w => [
          w.id || w.employeeId,
          w.name,
          w.role,
          w.department || w.dept,
          w.shift || 'Morning',
          w.wage || w.dailyWage || 650,
          w.daysPresent || w.present || 24,
          w.isActive === false ? 'INACTIVE' : 'ACTIVE',
        ]),
      })
      toast(`Exported ${filtered.length} workers to workers_export.csv`, 'success')
    } catch (err) {
      toast(err.message || 'Failed to export workers', 'error')
    }
  }

  const TODAY = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="page-root">
      {/* ── Header ── */}
      <PageHeader
        title="Worker Dashboard"
        subtitle={`${ROLE_LABELS[user?.role] || user?.role} · ${TODAY}`}
        actions={
          <button className="btn-secondary btn-sm gap-1.5" onClick={handleExport}>
            <Download size={13} />Export
          </button>
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
                <p className="text-xs text-zinc-500 mt-0.5">of {totalWorkers} active workers</p>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Absent Today</p>
              <p className="text-2xl font-bold text-red-400">{totalAbsent}</p>
              <p className="text-2xs text-zinc-600">{((totalAbsent / (totalWorkers || 1)) * 100).toFixed(0)}% of workforce</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Avg Days (Oct)</p>
              <p className="text-2xl font-bold text-emerald-400">{avgAttendance}</p>
              <p className="text-2xs text-zinc-600">days per worker</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Est. Monthly Payroll</p>
              <p className="text-2xl font-bold text-zinc-50">{formatCurrencyFull(totalWagesMon)}</p>
              <p className="text-2xs text-zinc-600">Base salary liability</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-2xs text-zinc-500 font-semibold uppercase tracking-wide">Workforce</p>
              <p className="text-2xl font-bold text-primary-400">{totalWorkers}</p>
              <p className="text-2xs text-zinc-600">registered employees</p>
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
              <p className="section-title">Department Attendance Overview</p>
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
              <p className="section-title">Factory Payroll & Overtime Trend</p>
              <p className="text-xs text-zinc-500 mt-0.5">Total factory disbursement — last 6 months</p>
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

      {/* ── Worker List with Search & Department Filters ── */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <Users size={14} className="text-zinc-500" />
            Workers & Supervisors Directory
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {depts.map(d => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className={cn('btn-secondary btn-sm text-xs',
                  deptFilter === d && 'bg-primary-500/15 border-primary-500/50 text-primary-300 font-bold')}
              >
                {d}
              </button>
            ))}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                className="input-sm pl-7 w-40 text-xs"
                placeholder="Search worker…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(w => {
            const daysP = w.daysPresent || w.present || 24
            const daysA = w.daysAbsent || 1
            const halfD = w.halfDays || 0
            const totalD = daysP + daysA + halfD
            const attendPct = totalD > 0 ? Math.round((daysP / totalD) * 100) : 92
            const estWage = daysP * (w.wage || w.dailyWage || 650)
            const isPresent = w.todayStatus !== 'ABSENT'

            return (
              <div
                key={w.id}
                onClick={() => openWorker(w)}
                className="card-hover p-5 cursor-pointer relative group flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative shrink-0">
                      <div className={cn(
                        'w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow',
                        w.color || 'from-primary-500 to-violet-600'
                      )}>
                        {w.initials || w.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900',
                        isPresent ? 'bg-emerald-400' : 'bg-red-500',
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-100 text-sm truncate">{w.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{w.role}</p>
                      <span className="badge badge-purple text-2xs mt-1">
                        {w.department || w.dept || 'Production'}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 mt-1 shrink-0 transition-colors" />
                  </div>

                  {/* Attendance Bar */}
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

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-zinc-800/60 pt-3">
                    <div>
                      <p className="text-emerald-400 font-bold text-sm">{daysP}</p>
                      <p className="text-2xs text-zinc-500">Present</p>
                    </div>
                    <div>
                      <p className="text-zinc-200 font-bold text-sm font-mono">₹{w.wage || w.dailyWage || 650}</p>
                      <p className="text-2xs text-zinc-500">Daily Rate</p>
                    </div>
                    <div>
                      <p className="text-zinc-100 font-bold text-sm font-mono">
                        ₹{Math.round(estWage / 1000)}K
                      </p>
                      <p className="text-2xs text-zinc-500">Est. Wages</p>
                    </div>
                  </div>
                </div>

                {/* Footer Chip */}
                <div className={cn(
                  'mt-3 px-3 py-1.5 rounded-xl text-center text-xs font-semibold select-none',
                  isPresent
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                    : 'bg-red-500/10 text-red-400 border border-red-500/25',
                )}>
                  {isPresent
                    ? `✓ Active · ${w.shift || 'Morning'} Shift`
                    : `✗ Absent today`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Worker Detail Modal with Wage Breakdown & Monthly Trend */}
      <WorkerDetailModal
        worker={selected}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setTimeout(() => setSelected(null), 200)
        }}
      />
    </div>
  )
}
