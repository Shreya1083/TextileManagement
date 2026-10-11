/**
 * dashboardService.js
 *
 * API calls for the Owner Dashboard.
 * Endpoint: GET /api/finance/dashboard/owner?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * The server always returns money in integer paise (no floats).
 * This service returns the raw server payload unchanged — the
 * display layer (formatPaise) converts to ₹ for rendering only.
 */
import api from '../lib/api.js'

/**
 * Fetch owner dashboard data for a date range.
 * @param {{ from: string, to: string }} params  ISO date strings YYYY-MM-DD
 * @returns {Promise<import('./dashboardService.types').OwnerDashboardData>}
 */
export async function fetchOwnerDashboard({ from, to } = {}) {
  const params = {}
  if (from) params.from = from
  if (to)   params.to   = to

  const res = await api.get('/finance/dashboard/owner', { params })

  if (!res.data?.success) {
    throw new Error(res.data?.message ?? 'Dashboard request failed')
  }

  return res.data.data   // unwrap the { success, message, data } envelope
}
