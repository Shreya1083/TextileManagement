import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handleRes = (req) => req.then(res => res.data).catch(err => ({ success: false, error: err }));

// Support for useData.js which expects: dashboardAPI, ordersAPI, etc.
export const authAPI = {
  login: (credentials) => handleRes(apiClient.post('/auth/login', credentials)),
  getProfile: () => handleRes(apiClient.get('/auth/me')),
};

export const dashboardAPI = {
  getStats: () => handleRes(apiClient.get('/data/dashboard/stats')),
  getRevenueData: () => handleRes(apiClient.get('/data/dashboard/revenue')),
  getProductionData: () => handleRes(apiClient.get('/data/dashboard/production')),
  getQualityData: () => handleRes(apiClient.get('/data/dashboard/quality')),
  // EOD
  getEODSummary: (date) => handleRes(apiClient.get('/data/dashboard/eod/summary', { params: { date } })),
  getShiftData: (date) => handleRes(apiClient.get('/data/dashboard/eod/shifts', { params: { date } })),
  getHourlyOutput: (date) => handleRes(apiClient.get('/data/dashboard/eod/hourly', { params: { date } })),
  getMachineOutput: (date) => handleRes(apiClient.get('/data/dashboard/eod/machine-output', { params: { date } })),
  getTopPerformers: (date) => handleRes(apiClient.get('/data/dashboard/eod/performers', { params: { date } })),
  getTimeline: (date) => handleRes(apiClient.get('/data/dashboard/eod/timeline', { params: { date } })),
};

export const ordersAPI = {
  getAll: (filters) => handleRes(apiClient.get('/data/orders', { params: filters })),
  getById: (id) => handleRes(apiClient.get(`/data/orders/${id}`)),
  getOrders: (filters) => handleRes(apiClient.get('/data/orders', { params: filters })),
  getOrderById: (id) => handleRes(apiClient.get(`/data/orders/${id}`)),
  getBuyers: () => handleRes(apiClient.get('/data/customers')),
  createBuyer: (data) => handleRes(apiClient.post('/data/customers', data)),
  createOrder: (data) => handleRes(apiClient.post('/data/orders', data)),
  updateOrder: (id, data) => handleRes(apiClient.put(`/data/orders/${id}`, data)),
};

export const productionAPI = {
  getMachines: () => handleRes(apiClient.get('/data/machines')),
  getDowntimes: (filters) => handleRes(apiClient.get('/data/downtimes', { params: filters })),
  createDowntime: (data) => handleRes(apiClient.post('/data/downtimes', data)),
  updateDowntime: (id, data) => handleRes(apiClient.put(`/data/downtimes/${id}`, data)),
  getProductionEntries: (filters) => handleRes(apiClient.get('/data/production-entries', { params: filters })),
  createProductionEntry: (data) => handleRes(apiClient.post('/data/production-entries', data)),
  startMachine: (id, orderId, operatorId) => handleRes(apiClient.post(`/data/machines/${id}/start`, { orderId, operatorId })),
  stopMachine: (id, reason) => handleRes(apiClient.post(`/data/machines/${id}/stop`, { reason })),
};

export const inventoryAPI = {
  getStock: (filters) => handleRes(apiClient.get('/data/inventory', { params: filters })),
  getRolls: () => handleRes(apiClient.get('/data/rolls')),
  getLowStockItems: () => handleRes(apiClient.get('/data/inventory/low')),
  getSuppliers: () => handleRes(apiClient.get('/data/suppliers')),
  createSupplier: (data) => handleRes(apiClient.post('/data/suppliers', data)),
  getPurchaseOrders: (filters) => handleRes(apiClient.get('/data/purchase-orders', { params: filters })),
  createPurchaseOrder: (data) => handleRes(apiClient.post('/data/purchase-orders', data)),
  getGateEntries: (filters) => handleRes(apiClient.get('/data/gate-entries', { params: filters })),
  createGateEntry: (data) => handleRes(apiClient.post('/data/gate-entries', data)),
  getBOMs: (filters) => handleRes(apiClient.get('/data/boms', { params: filters })),
};

export const qualityAPI = {
  getQueue: () => handleRes(apiClient.get('/data/rolls')),
  getDefectReport: () => handleRes(apiClient.get('/data/defects')),
  getRolls: (filters) => handleRes(apiClient.get('/data/rolls', { params: filters })),
  inspectRoll: (id, data) => handleRes(apiClient.post(`/data/rolls/${id}/inspect`, data)),
};

export const hrAPI = {
  getWorkers: () => handleRes(apiClient.get('/data/workers')),
  getWorkerById: (id) => handleRes(apiClient.get(`/data/workers/${id}`)),
  createWorker: (data) => handleRes(apiClient.post('/data/workers', data)),
  getAttendance: (date) => handleRes(apiClient.get('/data/hr/attendance', { params: { date } })),
  markAttendance: (data) => handleRes(apiClient.post('/data/hr/attendance', data)),
  getWages: (month, year) => handleRes(apiClient.get('/data/hr/wages', { params: { month, year } })),
  getWorkerProfiles: () => handleRes(apiClient.get('/data/hr/profiles')),
  getWorkerDashboardStats: () => handleRes(apiClient.get('/data/hr/stats')),
  getAttendanceSummary: (months) => handleRes(apiClient.get('/data/hr/attendance-summary', { params: { months } })),
  getWageTrend: (months) => handleRes(apiClient.get('/data/hr/wage-trend', { params: { months } })),
};

export const dispatchAPI = {
  getQueue: () => handleRes(apiClient.get('/data/dispatch/queue')),
  getInvoices: () => handleRes(apiClient.get('/data/invoices')),
  getFinishedStock: (filters) => handleRes(apiClient.get('/data/rolls/finished', { params: filters })),
  getDispatches: (filters) => handleRes(apiClient.get('/data/dispatch', { params: filters })),
  createDispatch: (data) => handleRes(apiClient.post('/data/dispatch', data)),
  createInvoice: (data) => handleRes(apiClient.post('/data/invoices', data)),
};

export const financeAPI = {
  getCostingData: (start, end) => handleRes(apiClient.get('/data/finance/costing', { params: { start, end } })),
  getPnLData: (start, end) => handleRes(apiClient.get('/data/finance/pnl', { params: { start, end } })),
  getReceivables: () => handleRes(apiClient.get('/data/invoices/receivables')),
};

export const trackingAPI = {
  trackOrder: (id) => handleRes(apiClient.get(`/data/orders/${id}/track`)),
};

export const settingsAPI = {
  getUsers: () => handleRes(apiClient.get('/data/users')),
  createUser: (data) => handleRes(apiClient.post('/data/users', data)),
  updateUser: (id, data) => handleRes(apiClient.put(`/data/users/${id}`, data)),
  getMillSettings: () => handleRes(apiClient.get('/data/mill-settings')),
  createMillSetting: (data) => handleRes(apiClient.post('/data/mill-settings', data)),
  updateMillSetting: (id, data) => handleRes(apiClient.put(`/data/mill-settings/${id}`, data)),
  getSettings: () => handleRes(apiClient.get('/data/settings/singleton')),
  createSettings: (data) => handleRes(apiClient.post('/data/settings', { id: 'singleton', ...data })),
  updateSettings: (data) => handleRes(apiClient.put('/data/settings/singleton', data)),
};

export const notificationsAPI = {
  getAll: () => handleRes(apiClient.get('/data/notifications')),
  create: (data) => handleRes(apiClient.post('/data/notifications', data)),
};

export const handleAPIResponse = async (promise) => {
  try {
    const res = await promise;
    // Our handleRes already unpacks the response, but handleAPIResponse is used in useData.js
    if (res.success !== undefined) return res;
    return { success: true, data: res.data || res };
  } catch (err) {
    return { success: false, error: err };
  }
};

// Export default API object for useAPI.js
const API = {
  auth: authAPI,
  dashboard: dashboardAPI,
  orders: ordersAPI,
  production: productionAPI,
  inventory: inventoryAPI,
  quality: qualityAPI,
  hr: hrAPI,
  dispatch: dispatchAPI,
  finance: financeAPI,
  tracking: trackingAPI,
  settings: settingsAPI,
};

export default API;
