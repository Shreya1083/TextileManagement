import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './app/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

// Public pages
import LoginPage        from './features/auth/LoginPage'
import TrackingPage     from './features/tracking/TrackingPage'
import { NotFound, Forbidden } from './features/auth/NotFound'

// Dashboards
import OwnerDashboard   from './features/dashboard/OwnerDashboard'
import FloorDashboard   from './features/dashboard/FloorDashboard'

// Inventory
import StockPage        from './features/inventory/StockPage'
import SuppliersPage    from './features/inventory/SuppliersPage'
import GateEntryPage    from './features/inventory/GateEntryPage'
import PurchaseOrdersPage from './features/inventory/PurchaseOrdersPage'

// Orders
import OrdersPage       from './features/orders/OrdersPage'
import BuyersPage       from './features/orders/BuyersPage'

// Production
import MachineBoard     from './features/production/MachineBoard'
import ProductionEntry  from './features/production/ProductionEntry'
import DowntimePage     from './features/production/DowntimePage'

// Quality
import InspectionQueue  from './features/quality/InspectionQueue'
import DefectReport     from './features/quality/DefectReport'

// Dispatch
import FinishedStockPage from './features/dispatch/FinishedStockPage'
import DispatchPage      from './features/dispatch/DispatchPage'
import InvoicesPage      from './features/dispatch/InvoicesPage'

// HR
import WorkersPage      from './features/hr/WorkersPage'
import AttendancePage   from './features/hr/AttendancePage'
import WagesPage        from './features/hr/WagesPage'

// Finance
import CostingPage      from './features/finance/CostingPage'
import PnLPage          from './features/finance/PnLPage'

// Settings
import MillSettings     from './features/settings/MillSettings'
import MasterData       from './features/settings/MasterData'
import UsersPage        from './features/settings/UsersPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/track"  element={<TrackingPage />} />
        <Route path="/403"    element={<Forbidden />} />
        <Route path="/"       element={<Navigate to="/dashboard" replace />} />

        {/* Protected — inside AppLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Dashboards */}
            <Route path="/dashboard" element={<OwnerDashboard />} />
            <Route path="/floor"     element={<FloorDashboard />} />

            {/* Inventory */}
            <Route path="/inventory/stock"           element={<StockPage />} />
            <Route path="/inventory/suppliers"       element={<SuppliersPage />} />
            <Route path="/inventory/gate-entries"    element={<GateEntryPage />} />
            <Route path="/inventory/purchase-orders" element={<PurchaseOrdersPage />} />

            {/* Orders */}
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

            {/* HR */}
            <Route path="/hr/workers"    element={<WorkersPage />} />
            <Route path="/hr/attendance" element={<AttendancePage />} />
            <Route path="/hr/wages"      element={<WagesPage />} />

            {/* Finance */}
            <Route path="/finance/costing" element={<CostingPage />} />
            <Route path="/finance/pnl"     element={<PnLPage />} />

            {/* Settings */}
            <Route path="/settings/mill"        element={<MillSettings />} />
            <Route path="/settings/master-data" element={<MasterData />} />
            <Route path="/users"                element={<UsersPage />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
