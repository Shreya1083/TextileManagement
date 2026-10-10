import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../context/AuthContext'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard, Factory, Package, ShoppingCart, Cog, Eye,
  Truck, FileText, Users, DollarSign, Settings, LogOut,
  Sparkles, BarChart3, ClipboardCheck, Boxes, UserCheck,
  AlertTriangle, X, Layers, Wallet, CalendarCheck, Home,
} from 'lucide-react'

const NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/dashboard',          label: 'Dashboard',          icon: LayoutDashboard, roles: ['owner'] },
      { to: '/floor',              label: 'Floor Monitor',       icon: Factory,         roles: ['owner','supervisor','inspector'] },
      { to: '/eod',                label: 'End-of-Day Report',   icon: CalendarCheck,   roles: ['owner','supervisor','accounts'] },
      // Worker-only home
      { to: '/worker/my-dashboard', label: 'My Dashboard',       icon: Home,            roles: ['worker'] },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { to: '/inventory/stock',           label: 'Stock Levels',    icon: Boxes,        roles: ['owner','store','supervisor','accounts'] },
      { to: '/inventory/gate-entries',    label: 'Gate Entry',      icon: Package,       roles: ['owner','store'] },
      { to: '/inventory/suppliers',       label: 'Suppliers',       icon: Truck,         roles: ['owner','store','accounts'] },
      { to: '/inventory/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart,  roles: ['owner','store','accounts'] },
    ],
  },
  {
    group: 'Sales',
    items: [
      { to: '/buyers', label: 'Buyers', icon: Users,          roles: ['owner','accounts'] },
      { to: '/orders', label: 'Orders', icon: ClipboardCheck, roles: ['owner','store','supervisor','inspector','accounts'] },
    ],
  },
  {
    group: 'Production',
    items: [
      { to: '/production/machines', label: 'Machines',         icon: Cog,           roles: ['owner','supervisor','inspector'] },
      { to: '/production/entry',    label: 'Production Entry', icon: Layers,        roles: ['supervisor','owner'] },
      { to: '/production/downtime', label: 'Downtime',         icon: AlertTriangle, roles: ['supervisor','owner'] },
    ],
  },
  {
    group: 'Quality',
    items: [
      { to: '/quality/queue',   label: 'Inspection Queue', icon: Eye,      roles: ['inspector','owner','supervisor'] },
      { to: '/quality/defects', label: 'Defect Reports',   icon: BarChart3, roles: ['owner','supervisor','inspector'] },
    ],
  },
  {
    group: 'Dispatch',
    items: [
      { to: '/dispatch/stock', label: 'Finished Goods', icon: Boxes,    roles: ['owner','store'] },
      { to: '/dispatch',       label: 'Dispatches',     icon: Truck,     roles: ['owner','store','accounts'] },
      { to: '/invoices',       label: 'Invoices',        icon: FileText,  roles: ['owner','accounts'] },
    ],
  },
  {
    group: 'HR & Finance',
    items: [
      { to: '/hr/dashboard',    label: 'Worker Dashboard', icon: UserCheck,  roles: ['owner','supervisor','accounts'] },
      { to: '/hr/workers',      label: 'Workers',          icon: Users,      roles: ['owner','accounts'] },
      { to: '/hr/attendance',   label: 'Attendance',       icon: UserCheck,  roles: ['owner','supervisor','accounts'] },
      { to: '/hr/wages',        label: 'Wages',            icon: Wallet,     roles: ['owner','accounts'] },
      { to: '/finance/costing', label: 'Order Costing',    icon: BarChart3,  roles: ['owner'] },
      { to: '/finance/pnl',     label: 'P&L Report',    icon: DollarSign, roles: ['owner'] },
    ],
  },
  {
    group: 'Admin',
    items: [
      { to: '/settings/mill',        label: 'Mill Settings', icon: Settings, roles: ['owner'] },
      { to: '/settings/master-data', label: 'Master Data',   icon: Sparkles, roles: ['owner'] },
      { to: '/users',                label: 'Users',          icon: Users,    roles: ['owner'] },
    ],
  },
]

const ROLE_COLORS = {
  owner:      'from-primary-500 to-violet-600',
  store:      'from-cyan-500 to-blue-600',
  supervisor: 'from-amber-500 to-orange-600',
  inspector:  'from-emerald-500 to-teal-600',
  accounts:   'from-pink-500 to-rose-600',
}

export function Sidebar({ open, onClose }) {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full z-50 flex flex-col w-[240px]',
        'bg-zinc-950 border-r border-zinc-800/60',
        'transition-transform duration-300 ease-spring',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>

        {/* ── Logo ── */}
        <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-glow" />
              <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-sm tracking-tight">ET</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-50 leading-tight">Everest Textile</p>
              <p className="text-2xs text-zinc-600 leading-tight">ERP Platform</p>
            </div>
          </div>
          <button className="lg:hidden icon-btn !w-7 !h-7" onClick={onClose} aria-label="Close menu">
            <X size={14} />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2.5 space-y-5">
          {NAV.map(({ group, items }) => {
            const visible = items.filter(i => !i.roles || hasRole(...i.roles))
            if (!visible.length) return null
            return (
              <div key={group}>
                <p className="nav-group-label px-2 mb-1">{group}</p>
                <ul className="space-y-0.5">
                  {visible.map(({ to, label, icon: Icon }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) => cn('nav-item group', isActive && 'active')}
                      >
                        <Icon
                          size={15}
                          className="nav-icon shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors duration-150"
                        />
                        <span className="truncate">{label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* ── User footer — sign out always visible ── */}
        <div className="shrink-0 px-3 py-3 border-t border-zinc-800/60 space-y-1.5">
          {/* User info card */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
            <div className={cn(
              'w-9 h-9 rounded-xl bg-gradient-to-br shrink-0',
              'flex items-center justify-center text-white font-bold text-sm shadow-glow-sm',
              ROLE_COLORS[user?.role] || 'from-zinc-500 to-zinc-700',
            )}>
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-100 truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-2xs text-zinc-500 leading-tight mt-0.5 truncate">
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
          </div>

          {/* Sign out button — always visible */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                       text-sm font-semibold text-zinc-400 hover:text-red-400
                       hover:bg-red-500/10 border border-transparent hover:border-red-500/25
                       transition-all duration-150"
          >
            <LogOut size={15} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
