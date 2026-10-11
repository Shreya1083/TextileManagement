import { Activity, CalendarCheck, Factory } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/floor', label: 'Floor Monitor', icon: Factory },
  { to: '/eod', label: 'End-of-Day Report', icon: CalendarCheck },
]

export function DashboardSubheader() {
  return (
    <nav
      aria-label="Dashboard pages"
      className="flex w-fit items-center gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900 p-1"
    >
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-primary-500/15 text-primary-300 border-primary-500/30'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 border-transparent'
            }`
          }
        >
          <Icon size={14} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
