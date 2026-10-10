import { QueryClient } from '@tanstack/react-query'

// Create QueryClient with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error('Query error:', error.message)
      },
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        console.error('Mutation error:', error.message)
      },
    },
  },
})

// Query keys for consistent cache management
export const queryKeys = {
  // Auth
  currentUser: ['auth', 'me'],
  
  // Dashboard
  ownerStats: ['dashboard', 'owner', 'stats'],
  revenueData: (months) => ['dashboard', 'owner', 'revenue', months],
  productionData: (days) => ['dashboard', 'owner', 'production', days],
  qualityData: ['dashboard', 'owner', 'quality'],
  alerts: ['dashboard', 'alerts'],
  floorStats: ['dashboard', 'floor', 'stats'],
  machines: ['dashboard', 'floor', 'machines'],
  eodSummary: (date) => ['dashboard', 'eod', 'summary', date],
  eodShifts: (date) => ['dashboard', 'eod', 'shifts', date],
  eodHourlyOutput: (date) => ['dashboard', 'eod', 'hourly', date],
  eodMachineOutput: (date) => ['dashboard', 'eod', 'machines', date],
  eodTopPerformers: (date) => ['dashboard', 'eod', 'performers', date],
  eodTimeline: (date) => ['dashboard', 'eod', 'timeline', date],
  
  // Orders
  orders: (filters) => ['orders', filters],
  order: (id) => ['orders', id],
  buyers: ['buyers'],
  
  // Production
  productionMachines: (filters) => ['production', 'machines', filters],
  productionMachine: (id) => ['production', 'machines', id],
  downtime: (filters) => ['production', 'downtime', filters],
  
  // Quality
  rolls: (filters) => ['quality', 'rolls', filters],
  roll: (id) => ['quality', 'rolls', id],
  defectReport: (startDate, endDate) => ['quality', 'defects', startDate, endDate],
  qualityStats: ['quality', 'stats'],
  
  // Inventory
  stock: (filters) => ['inventory', 'stock', filters],
  stockItem: (id) => ['inventory', 'stock', id],
  lowStock: ['inventory', 'stock', 'low'],
  suppliers: ['inventory', 'suppliers'],
  supplier: (id) => ['inventory', 'suppliers', id],
  purchaseOrders: (filters) => ['inventory', 'purchase-orders', filters],
  gateEntries: (filters) => ['inventory', 'gate-entries', filters],
  
  // Dispatch
  finishedStock: (filters) => ['dispatch', 'finished-stock', filters],
  dispatches: (filters) => ['dispatch', 'dispatches', filters],
  dispatch: (id) => ['dispatch', 'dispatches', id],
  invoices: (filters) => ['dispatch', 'invoices', filters],
  invoice: (id) => ['dispatch', 'invoices', id],
  
  // Finance
  costing: (startDate, endDate) => ['finance', 'costing', startDate, endDate],
  pnl: (startDate, endDate) => ['finance', 'pnl', startDate, endDate],
  receivables: ['finance', 'receivables'],
  payables: ['finance', 'payables'],
  
  // HR
  workers: (filters) => ['hr', 'workers', filters],
  worker: (id) => ['hr', 'workers', id],
  attendance: (date) => ['hr', 'attendance', date],
  wages: (month, year) => ['hr', 'wages', month, year],
  workerDashboardStats: ['hr', 'dashboard', 'stats'],
  attendanceSummary: (months) => ['hr', 'dashboard', 'attendance', months],
  wageTrend: (months) => ['hr', 'dashboard', 'wages', months],
  workerProfiles: ['hr', 'worker-profiles'],
  workerProfile: (id) => ['hr', 'worker-profiles', id],
  
  // Tracking
  orderTracking: (orderId) => ['tracking', 'orders', orderId],
  
  // Settings
  users: ['settings', 'users'],
}
