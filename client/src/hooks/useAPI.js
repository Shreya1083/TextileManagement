import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import API from '../services/api'

// ========================================================================
// DASHBOARD HOOKS
// ========================================================================

export const useOwnerStats = () => {
  return useQuery({
    queryKey: queryKeys.ownerStats,
    queryFn: () => API.dashboard.getStats(),
  })
}

export const useRevenueData = (months = 6) => {
  return useQuery({
    queryKey: queryKeys.revenueData(months),
    queryFn: () => API.dashboard.getRevenueData(months),
  })
}

export const useProductionData = (days = 7) => {
  return useQuery({
    queryKey: queryKeys.productionData(days),
    queryFn: () => API.dashboard.getProductionData(days),
  })
}

export const useQualityData = () => {
  return useQuery({
    queryKey: queryKeys.qualityData,
    queryFn: () => API.dashboard.getQualityData(),
  })
}

export const useAlerts = () => {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => API.notifications.getAll(),
    refetchInterval: 10000,
  })
}

export const useCreateNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.notifications.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts })
    },
  })
}

export const useFloorStats = () => {
  return useQuery({
    queryKey: queryKeys.floorStats,
    queryFn: () => API.dashboard.getStats(), // Use getStats as a fallback for floor stats for now
    refetchInterval: 10000,
  })
}

export const useMachines = () => {
  return useQuery({
    queryKey: queryKeys.machines,
    queryFn: () => API.production.getMachines(),
    refetchInterval: 10000,
  })
}

export const useEODSummary = (date) => {
  return useQuery({
    queryKey: queryKeys.eodSummary(date),
    queryFn: () => API.dashboard.getEODSummary(date),
  })
}

export const useEODShifts = (date) => {
  return useQuery({
    queryKey: queryKeys.eodShifts(date),
    queryFn: () => API.dashboard.getShiftData(date),
  })
}

export const useEODHourlyOutput = (date) => {
  return useQuery({
    queryKey: queryKeys.eodHourlyOutput(date),
    queryFn: () => API.dashboard.getHourlyOutput(date),
  })
}

export const useEODMachineOutput = (date) => {
  return useQuery({
    queryKey: queryKeys.eodMachineOutput(date),
    queryFn: () => API.dashboard.getMachineOutput(date),
  })
}

export const useEODTopPerformers = (date) => {
  return useQuery({
    queryKey: queryKeys.eodTopPerformers(date),
    queryFn: () => API.dashboard.getTopPerformers(date),
  })
}

export const useEODTimeline = (date) => {
  return useQuery({
    queryKey: queryKeys.eodTimeline(date),
    queryFn: () => API.dashboard.getTimeline(date),
  })
}

// ========================================================================
// ORDERS HOOKS
// ========================================================================

export const useOrders = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.orders(filters),
    queryFn: () => API.orders.getOrders(filters),
  })
}

export const useOrder = (id) => {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => API.orders.getOrderById(id),
    enabled: !!id,
  })
}

export const useBuyers = () => {
  return useQuery({
    queryKey: queryKeys.buyers,
    queryFn: () => API.orders.getBuyers(),
  })
}

export const useCreateBuyer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.orders.createBuyer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buyers })
    },
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.orders.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => API.orders.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// ========================================================================
// PRODUCTION HOOKS
// ========================================================================

export const useProductionMachines = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.productionMachines(filters),
    queryFn: () => API.production.getMachines(filters),
  })
}

export const useDowntimes = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.downtime(filters),
    queryFn: () => API.production.getDowntimes(filters),
  })
}

export const useCreateDowntime = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.production.createDowntime(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'downtime'] })
    },
  })
}

export const useProductionEntries = (filters = {}) => {
  return useQuery({
    queryKey: ['production', 'entries', filters],
    queryFn: () => API.production.getProductionEntries(filters),
  })
}

export const useCreateProductionEntry = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.production.createProductionEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'entries'] })
    },
  })
}

export const useStartMachine = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, orderId, operatorId }) => 
      API.production.startMachine(id, orderId, operatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'machines'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useStopMachine = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => API.production.stopMachine(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'machines'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.machines })
      queryClient.invalidateQueries({ queryKey: queryKeys.floorStats })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useUpdateMachine = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => API.production.updateMachine(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.machines })
      const previousMachines = queryClient.getQueryData(queryKeys.machines)
      if (previousMachines?.data) {
        queryClient.setQueryData(queryKeys.machines, {
          ...previousMachines,
          data: previousMachines.data.map(m =>
            (m.id === id || m.machineId === id) ? { ...m, ...data } : m
          ),
        })
      }
      return { previousMachines }
    },
    onError: (err, variables, context) => {
      if (context?.previousMachines) {
        queryClient.setQueryData(queryKeys.machines, context.previousMachines)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.machines })
      queryClient.invalidateQueries({ queryKey: queryKeys.floorStats })
      queryClient.invalidateQueries({ queryKey: ['production', 'machines'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ========================================================================
// QUALITY HOOKS
// ========================================================================

export const useRolls = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.rolls(filters),
    queryFn: () => API.quality.getRolls(filters),
  })
}

export const useInspectRoll = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => API.quality.inspectRoll(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality', 'rolls'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useDefectReport = (startDate, endDate) => {
  return useQuery({
    queryKey: queryKeys.defectReport(startDate, endDate),
    queryFn: () => API.quality.getDefectReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

// ========================================================================
// INVENTORY HOOKS
// ========================================================================

export const useStock = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.stock(filters),
    queryFn: () => API.inventory.getStock(filters),
  })
}

export const useLowStock = () => {
  return useQuery({
    queryKey: queryKeys.lowStock,
    queryFn: () => API.inventory.getLowStockItems(),
  })
}

export const useBOMs = (filters = {}) => {
  return useQuery({
    queryKey: ['boms', filters],
    queryFn: () => API.inventory.getBOMs(filters),
  })
}

export const useSuppliers = () => {
  return useQuery({
    queryKey: queryKeys.suppliers,
    queryFn: () => API.inventory.getSuppliers(),
  })
}

export const useCreateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.inventory.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.refetchQueries({ queryKey: queryKeys.suppliers })
    },
  })
}

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => {
      const id = payload.id
      const data = payload.data ? payload.data : { ...payload }
      delete data.id
      return API.inventory.updateSupplier(id, data)
    },
    onSuccess: (res, vars) => {
      const id = vars.id
      const updatedItem = res?.data || res
      queryClient.setQueryData(queryKeys.suppliers, (old) => {
        if (!old) return old
        if (Array.isArray(old)) return old.map(s => s.id === id ? { ...s, ...updatedItem } : s)
        if (Array.isArray(old?.data)) return { ...old, data: old.data.map(s => s.id === id ? { ...s, ...updatedItem } : s) }
        return old
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.refetchQueries({ queryKey: queryKeys.suppliers })
    },
  })
}

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => API.inventory.deleteSupplier(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKeys.suppliers, (old) => {
        if (!old) return old
        if (Array.isArray(old)) return old.filter(s => s.id !== id)
        if (Array.isArray(old?.data)) return { ...old, data: old.data.filter(s => s.id !== id) }
        return old
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.refetchQueries({ queryKey: queryKeys.suppliers })
    },
  })
}

export const usePurchaseOrders = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.purchaseOrders(filters),
    queryFn: () => API.inventory.getPurchaseOrders(filters),
  })
}

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.inventory.createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders() })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'purchaseOrders'] })
    },
  })
}

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => API.inventory.updatePurchaseOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders() })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'purchaseOrders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] })
    },
  })
}

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => API.inventory.deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders() })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'purchaseOrders'] })
    },
  })
}

export const useGateEntries = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.gateEntries(filters),
    queryFn: () => API.inventory.getGateEntries(filters),
  })
}

export const useCreateGateEntry = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.inventory.createGateEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.stock({}) })
      queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
      queryClient.invalidateQueries({ queryKey: queryKeys.lowStock })
      queryClient.invalidateQueries({ queryKey: queryKeys.gateEntries() })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'gate-entries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.refetchQueries({ queryKey: ['inventory', 'stock'] })
      queryClient.refetchQueries({ queryKey: queryKeys.stock({}) })
    },
  })
}

export const useUpdateGateEntry = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => API.inventory.updateGateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gateEntries() })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'gate-entries'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'gateEntries'] })
    },
  })
}

export const useDeleteGateEntry = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => API.inventory.deleteGateEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gateEntries() })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'gate-entries'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'gateEntries'] })
    },
  })
}

export const useUpdateStockItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => API.inventory.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useCreateStockItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.inventory.createStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] })
    },
  })
}

// ========================================================================
// DISPATCH HOOKS
// ========================================================================

export const useFinishedStock = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.finishedStock(filters),
    queryFn: () => API.dispatch.getFinishedStock(filters),
  })
}

export const useDispatches = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.dispatches(filters),
    queryFn: () => API.dispatch.getDispatches(filters),
  })
}

export const useInvoices = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.invoices(filters),
    queryFn: () => API.dispatch.getInvoices(filters),
  })
}

export const useCreateDispatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.dispatch.createDispatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useUpdateDispatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => API.dispatch.updateDispatch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useDeleteDispatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => API.dispatch.deleteDispatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch'] })
    },
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.dispatch.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch'] })
      queryClient.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => API.dispatch.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch'] })
      queryClient.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => API.dispatch.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch'] })
      queryClient.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}

// ========================================================================
// FINANCE HOOKS
// ========================================================================

export const useCosting = (startDate, endDate) => {
  return useQuery({
    queryKey: queryKeys.costing(startDate, endDate),
    queryFn: () => API.finance.getCostingData(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

export const usePnL = (startDate, endDate) => {
  return useQuery({
    queryKey: queryKeys.pnl(startDate, endDate),
    queryFn: () => API.finance.getPnLData(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

export const useReceivables = () => {
  return useQuery({
    queryKey: queryKeys.receivables,
    queryFn: () => API.finance.getReceivables(),
  })
}

// ========================================================================
// HR HOOKS
// ========================================================================

export const useWorkers = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.workers(filters),
    queryFn: () => API.hr.getWorkers(filters),
  })
}

export const useCreateWorker = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.hr.createWorker(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers({}) })
    },
  })
}

export const useWorker = (id) => {
  return useQuery({
    queryKey: queryKeys.worker(id),
    queryFn: () => API.hr.getWorkerById(id),
    enabled: !!id,
  })
}

export const useAttendance = (date) => {
  return useQuery({
    queryKey: queryKeys.attendance(date),
    queryFn: () => API.hr.getAttendance(date),
  })
}

export const useMarkAttendance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.hr.markAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'attendance'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.workerProfiles })
    },
  })
}


export const useWages = (month, year) => {
  return useQuery({
    queryKey: queryKeys.wages(month, year),
    queryFn: () => API.hr.getWages(month, year),
    enabled: !!month && !!year,
  })
}

export const useGeneratePayroll = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ month, year }) => API.hr.generatePayroll(month, year),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wages(variables?.month, variables?.year) })
      queryClient.invalidateQueries({ queryKey: queryKeys.workerProfiles })
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts })
      queryClient.invalidateQueries({ queryKey: ['hr'] })
    },
  })
}

export const useWorkerProfiles = () => {
  return useQuery({
    queryKey: queryKeys.workerProfiles,
    queryFn: () => API.hr.getWorkerProfiles(),
  })
}

export const useWorkerDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.workerDashboardStats,
    queryFn: () => API.hr.getWorkerDashboardStats(),
  })
}

export const useAttendanceSummary = (months = 6) => {
  return useQuery({
    queryKey: queryKeys.attendanceSummary(months),
    queryFn: () => API.hr.getAttendanceSummary(months),
  })
}

export const useWageTrend = (months = 6) => {
  return useQuery({
    queryKey: queryKeys.wageTrend(months),
    queryFn: () => API.hr.getWageTrend(months),
  })
}

// ========================================================================
// TRACKING HOOKS
// ========================================================================

export const useOrderTracking = (orderId) => {
  return useQuery({
    queryKey: queryKeys.orderTracking(orderId),
    queryFn: () => API.tracking.trackOrder(orderId),
    enabled: !!orderId,
  })
}

// ========================================================================
// SETTINGS HOOKS
// ========================================================================

export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => API.settings.getUsers(),
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.settings.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => API.settings.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => API.settings.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export const useMillSettings = () => {
  return useQuery({
    queryKey: ['settings', 'mill'],
    queryFn: () => API.settings.getMillSettings(),
  })
}

export const useCreateMillSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.settings.createMillSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'mill'] })
    },
  })
}

export const useUpdateMillSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => API.settings.updateMillSetting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'mill'] })
    },
  })
}

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings', 'singleton'],
    queryFn: () => API.settings.getSettings(),
  })
}

export const useCreateSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.settings.createSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'singleton'] })
    },
  })
}

export const useUpdateSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => API.settings.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'singleton'] })
    },
  })
}
