import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth }      from './context/AuthContext'
import { ROLE_HOME }    from './context/AuthContext'
import { ProtectedRoute } from './app/ProtectedRoute'
import { AppLayout }      from './components/layout/AppLayout'

// Public
import LoginPage          from './features/auth/LoginPage'
import SignInPage         from './features/auth/SignInPage'
import HomePage           from './features/home/HomePage'
import TrackingPage       from './features/tracking/TrackingPage'
import { NotFound, Forbidden } from './features/auth/NotFound'

// Dashboards
import OwnerDashboard   from './features/dashboard/OwnerDashboard'
import FloorDashboard   from './features/dashboard/FloorDashboard'
import EODDashboard     from './features/dashboard/EODDashboard'

// Inventory
import StockPage          from './features/inventory/StockPage'
import SuppliersPage      from './features/inventory/SuppliersPage'
import GateEntryPage      from './features/inventory/GateEntryPage'
import PurchaseOrdersPage from './features/inventory/PurchaseOrdersPage'

// Orders
import OrdersPage  from './features/orders/OrdersPage'
import BuyersPage  from './features/orders/BuyersPage'

// Production
import MachineBoard    from './features/production/MachineBoard'
import ProductionEntry from './features/production/ProductionEntry'
import DowntimePage    from './features/production/DowntimePage'

// Quality
import InspectionQueue from './features/quality/InspectionQueue'
import DefectReport    from './features/quality/DefectReport'

// Dispatch
import FinishedStockPage from './features/dispatch/FinishedStockPage'
import DispatchPage      from './features/dispatch/DispatchPage'
import InvoicesPage      from './features/dispatch/InvoicesPage'

// HR
import WorkersPage     from './features/hr/WorkersPage'
import AttendancePage  from './features/hr/AttendancePage'
import WagesPage       from './features/hr/WagesPage'
import WorkerDashboard from './features/hr/WorkerDashboard'
import MyDashboard     from './features/hr/MyDashboard'

// Finance
import CostingPage from './features/finance/CostingPage'
import PnLPage     from './features/finance/PnLPage'

// Settings
import MillSettings from './features/settings/MillSettings'
import MasterData   from './features/settings/MasterData'
import UsersPage    from './features/settings/UsersPage'

// Roles that have full internal ERP access (excludes external Buyer role)
const INTERNAL_ROLES = ['owner', 'store', 'supervisor', 'inspector', 'accounts']

/** Show the public landing page when unauthenticated; redirect authenticated users to their role home */
function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <HomePage />
  return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/track"  element={<TrackingPage />} />
        <Route path="/403"    element={<Forbidden />} />
        <Route path="/"       element={<RootRedirect />} />

        {/* Protected — inside AppLayout (any authenticated user) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Dashboards */}
            <Route path="/dashboard" element={<OwnerDashboard />} />
            <Route path="/floor"     element={<FloorDashboard />} />
            <Route path="/eod"       element={<EODDashboard />} />

            {/* Inventory */}
            <Route path="/inventory/stock"           element={<StockPage />} />
            <Route path="/inventory/suppliers"       element={<SuppliersPage />} />
            <Route path="/inventory/gate-entries"    element={<GateEntryPage />} />
            <Route path="/inventory/purchase-orders" element={<PurchaseOrdersPage />} />

            {/* Orders — accessible to all authenticated roles including Buyer */}
            <Route path="/buyers" element={<BuyersPage />} />
            <Route path="/orders" element={<OrdersPage />} />

            {/* Production */}
            <Route path="/production/machines"    element={<MachineBoard />} />
            <Route path="/production/assignments" element={<MachineBoard />} />
            <Route path="/production/entry"       element={<ProductionEntry />} />
            <Route path="/production/downtime"    element={<DowntimePage />} />

            {/* Quality */}
            <Route path="/quality/queue"   element={<InspectionQueue />} />
            <Route path="/quality/defects" element={<DefectReport />} />

            {/* Dispatch */}
            <Route path="/dispatch/stock" element={<FinishedStockPage />} />
            <Route path="/dispatch"       element={<DispatchPage />} />
            <Route path="/invoices"       element={<InvoicesPage />} />

            {/* HR — attendance and workers open to all authenticated roles; wages/dashboard restricted */}
            <Route path="/hr/workers"          element={<WorkersPage />} />
            <Route path="/hr/dashboard"        element={<WorkerDashboard />} />
            <Route path="/hr/attendance"       element={<AttendancePage />} />
            <Route path="/worker/my-dashboard" element={<MyDashboard />} />

            {/* Internal-only routes: Buyer is blocked, redirected to /403 */}
            <Route element={<ProtectedRoute roles={INTERNAL_ROLES} />}>
              {/* HR — wages contains payroll data */}
              <Route path="/hr/wages" element={<WagesPage />} />

              {/* Finance — P&L and costing are owner/internal only */}
              <Route path="/finance/costing" element={<CostingPage />} />
              <Route path="/finance/pnl"     element={<PnLPage />} />

              {/* Settings — admin/internal only */}
              <Route path="/settings/mill"        element={<MillSettings />} />
              <Route path="/settings/master-data" element={<MasterData />} />
              <Route path="/users"                element={<UsersPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
