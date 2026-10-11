// ─── Data Fetching Hooks - Replace mock data with real API calls ──────────────────

import { useState, useEffect } from 'react'
import { 
  dashboardAPI, 
  ordersAPI, 
  productionAPI, 
  inventoryAPI, 
  qualityAPI, 
  hrAPI,
  dispatchAPI,
  notificationsAPI,
  handleAPIResponse 
} from '../services/api'

// Generic data fetching hook
export const useAPIData = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      const result = await handleAPIResponse(apiCall())
      
      if (!isMounted) return;

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
        console.error('Data fetch error:', result.error)
      }
      
      setLoading(false)
    }

    fetchData()

    return () => { isMounted = false; }
  }, [...dependencies, refresh])

  return { data, loading, error, refetch: () => setRefresh(prev => prev + 1) }
}

// Dashboard specific hooks
export const useDashboardStats = () => {
  return useAPIData(() => dashboardAPI.getStats())
}

export const useRevenueData = () => {
  return useAPIData(() => dashboardAPI.getRevenueData())
}

export const useProductionData = () => {
  return useAPIData(() => dashboardAPI.getProductionData())
}

export const useQualityData = () => {
  return useAPIData(() => dashboardAPI.getQualityData())
}

// Production hooks
export const useMachines = () => {
  return useAPIData(() => productionAPI.getMachines())
}

export const useDowntime = () => {
  return useAPIData(() => productionAPI.getDowntime())
}

// Inventory hooks
export const useStock = (filters = {}) => {
  return useAPIData(() => inventoryAPI.getStock(filters), [JSON.stringify(filters)])
}

export const useRolls = () => {
  return useAPIData(() => inventoryAPI.getRolls())
}

// Quality hooks
export const useQualityQueue = () => {
  return useAPIData(() => qualityAPI.getQueue())
}

export const useDefectReport = () => {
  return useAPIData(() => qualityAPI.getDefectReport())
}

// Orders hooks
export const useOrders = (filters = {}) => {
  return useAPIData(() => ordersAPI.getAll(filters), [JSON.stringify(filters)])
}

export const useOrder = (orderId) => {
  return useAPIData(() => ordersAPI.getById(orderId), [orderId])
}

// HR hooks
export const useWorkers = () => {
  return useAPIData(() => hrAPI.getWorkers())
}

export const useAttendance = (date) => {
  return useAPIData(() => hrAPI.getAttendance(date), [date])
}

// Dispatch hooks
export const useDispatchQueue = () => {
  return useAPIData(() => dispatchAPI.getQueue())
}

export const useInvoices = () => {
  return useAPIData(() => dispatchAPI.getInvoices())
}

// Notifications hook
export const useNotifications = () => {
  return useAPIData(() => notificationsAPI.getAll())
}