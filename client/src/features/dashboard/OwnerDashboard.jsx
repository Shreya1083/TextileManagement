import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  DollarSign, Package, Factory, CheckCircle, AlertTriangle,
  Clock, TrendingUp, Zap, ArrowRight, Activity, CalendarCheck,
} from 'lucide-react'
import { StatCard }    from '../../components/ui/StatCard'
import { Badge }       from '../../components/ui/Badge'
import { PageHeader }  from '../../components/ui/PageHeader'
import { formatCurrency, formatDate } from '../../lib/utils'
import { useAuth }     from '../../context/AuthContext'
import { ROLE_LABELS } from '../../context/AuthContext'
import {
  mockStats, mockRevenueData, mockProductionData, mockQualityData,
  mockOrders, mockAlerts, mockMachines,
} from '../../mocks/data'
import { Link } from 'react-router-dom'

/* ── Chart tooltip ─────────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="text-zinc-400 text-xs mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 9999 ? formatCurrency(p.value) : p.value?.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

const CHART_STYLE = {
  axis:  { fill: '#52525b', fontSize: 11 },
  grid:  '#27272a',
}

export default function OwnerDashboard() {
  const { user } = useAuth()
  const running = mockMachines.filter(m => m.status === 'RUNNING').length
  const delayed = mockOrders.filter(
    o => !['DISPATCHED','CLOSED'].includes(o.status) && new Date(o.deadline) < new Date()
  ).length

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="page-root">

      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={`${ROLE_LABELS[user?.role] || user?.role} · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/eod" className="btn-secondary btn-sm gap-1.5">
              <CalendarCheck size={13} />EOD Report
            </Link>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-2xs font-bold text-emerald-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live data
            </span>
          </div>
        }
      />

      {/* ── Primary KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Revenue (Sep)"
          value={formatCurrency(mockStats.revenue.value)}
          icon={DollarSign}
          theme="green"
          change={mockStats.revenue.change}
          accent="bg-gradient-to-r from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Active Orders"
          value={mockStats.orders.value}
          icon={Package}
          theme="primary"
          change={mockStats.orders.change}
          changeSuffix=" orders"
          accent="bg-gradient-to-r from-primary-500 to-violet-500"
        />
        <StatCard
          title="Today's Output"
          value={`${mockStats.production.value.toLocaleString()} m`}
          icon={Factory}
          theme="purple"
          change={mockStats.production.change}
          accent="bg-gradient-to-r from-purple-500 to-pink-500"
        />
        <StatCard
          title="Quality Pass Rate"
          value={`${mockStats.quality.value}%`}
          icon={CheckCircle}
          theme="teal"
          change={mockStats.quality.change}
          changeSuffix="%"
          accent="bg-gradient-to-r from-teal-500 to-cyan-500"
        />
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            icon: Zap, iconBg: 'bg-emerald-500/15', iconClr: 'text-emerald-400',
            value: `${running}/${mockStats.machines.total}`,
            label: 'Machines running',
            sub: `${mockStats.machines.idle} idle · ${mockStats.machines.breakdown} breakdown`,
          },
          {
            icon: AlertTriangle, iconBg: 'bg-amber-500/15', iconClr: 'text-amber-400',
            value: mockStats.lowStock.count,
            label: 'Low stock items',
            sub: 'Below reorder level',
          },
          {
            icon: Clock, iconBg: 'bg-red-500/15', iconClr: 'text-red-400',
            value: delayed,
            label: 'Delayed orders',
            sub: 'Past deadline',
          },
          {
            icon: DollarSign, iconBg: 'bg-orange-500/15', iconClr: 'text-orange-400',
            value: formatCurrency(mockStats.receivables.value),
            label: 'Receivables',
            sub: 'Outstanding from buyers',
          },
        ].map((c, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div className={`stat-card-icon ${c.iconBg}`}>
              <c.icon size={18} className={c.iconClr} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-zinc-50">{c.value}</p>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">{c.label}</p>
              {c.sub && <p className="text-2xs text-zinc-600 mt-0.5">{c.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid xl:grid-cols-3 gap-4">

        {/* Revenue vs Cost area chart */}
        <div className="card xl:col-span-2">
          <div className="section-header">
            <div>
              <p className="section-title">Revenue vs Cost</p>
              <p className="text-xs text-zinc-500 mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2.5 h-[2px] bg-blue-400 rounded" />Revenue</span>
              <span className="flex items-center gap-1.5 text-red-400"><span className="w-2.5 h-[2px] bg-red-400 rounded" />Cost</span>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockRevenueData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_STYLE.grid} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_STYLE.axis} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#gRev)"  strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="cost"    name="Cost"    stroke="#ef4444" fill="url(#gCost)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality donut */}
        <div className="card">
          <div className="section-header">
            <div>
              <p className="section-title">Quality Results</p>
              <p className="text-xs text-zinc-500 mt-0.5">This month — {mockQualityData.reduce((s,d)=>s+d.value,0)} rolls</p>
            </div>
          </div>
          <div className="p-5">
            <div className="relative flex justify-center">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={mockQualityData}
                    cx="50%" cy="50%"
                    innerRadius={46} outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {mockQualityData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [`${v} rolls`, n]}
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2.5 mt-1">
              {mockQualityData.map(d => {
                const total = mockQualityData.reduce((s,x)=>s+x.value,0)
                const pct   = ((d.value / total) * 100).toFixed(1)
                return (
                  <li key={d.name} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-zinc-400 flex-1">{d.name}</span>
                    <span className="text-xs font-bold text-zinc-200">{d.value}</span>
                    <span className="text-2xs text-zinc-600 w-10 text-right">{pct}%</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Production + Alerts ── */}
      <div className="grid xl:grid-cols-3 gap-4">

        <div className="card xl:col-span-2">
          <div className="section-header">
            <div>
              <p className="section-title">Daily Production</p>
              <p className="text-xs text-zinc-500 mt-0.5">Output vs target (metres)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-primary-400"><span className="w-2 h-2 rounded-sm bg-primary-500" />Output</span>
              <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2 h-2 rounded-sm bg-zinc-700" />Target</span>
            </div>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={mockProductionData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke={CHART_STYLE.grid} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_STYLE.axis} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="output" name="Output" fill="#6366f1" radius={[5,5,0,0]} maxBarSize={36} />
                <Bar dataKey="target" name="Target" fill="#27272a" radius={[5,5,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Alerts */}
        <div className="card flex flex-col overflow-hidden">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-zinc-500" />
              <p className="section-title">Live Alerts</p>
            </div>
            <span className="badge badge-red">{mockAlerts.length}</span>
          </div>
          <ul className="flex-1 divide-y divide-zinc-800/40 overflow-y-auto scrollbar-thin">
            {mockAlerts.map(a => (
              <li key={a.id} className="flex gap-3 px-5 py-3.5 hover:bg-zinc-800/30 transition-colors cursor-pointer">
                <div className={`w-1.5 shrink-0 rounded-full self-stretch ${a.severity === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="min-w-0">
                  <p className={`text-2xs font-bold uppercase tracking-wider ${a.severity === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
                    {a.type.replace('-', ' ')}
                  </p>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{a.message}</p>
                  <p className="text-2xs text-zinc-600 mt-1">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="table-wrap">
        <div className="table-head">
          <p className="section-title">Recent Orders</p>
          <Link to="/orders" className="btn-ghost btn-sm gap-1 text-primary-400">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Order ID</th><th>Buyer</th><th>Fabric</th><th>Qty</th>
              <th>Deadline</th><th>Progress</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockOrders.slice(0, 6).map(o => {
              const overdue = !['DISPATCHED','CLOSED'].includes(o.status) && new Date(o.deadline) < new Date()
              return (
                <tr key={o.id}>
                  <td className="font-mono text-xs text-primary-400 font-semibold">{o.id}</td>
                  <td className="font-medium text-zinc-200">{o.buyer}</td>
                  <td className="text-zinc-400">{o.fabric}</td>
                  <td className="text-zinc-300">{o.qty.toLocaleString()} m</td>
                  <td className={overdue ? 'text-red-400 font-semibold' : 'text-zinc-400'}>
                    {formatDate(o.deadline)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5 min-w-[120px]">
                      <div className="progress-track flex-1">
                        <div className="progress-fill" style={{ width: `${o.progress}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500 w-8 text-right font-mono">{o.progress}%</span>
                    </div>
                  </td>
                  <td><Badge status={o.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
