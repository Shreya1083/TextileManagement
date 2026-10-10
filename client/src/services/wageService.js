/**
 * wageService.js
 * Service for retrieving and formatting worker wage and payroll records from the backend API.
 */
import api from '../lib/api.js'

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const MONTH_FULL_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * Normalizes an API wage record from integer paise to rupees with date labels
 */
export function normalizeWageRecord(raw) {
  if (!raw) return null

  const month = Number(raw.month) || 1
  const year = Number(raw.year) || new Date().getFullYear()
  const monthName = MONTH_NAMES[month] || `M${month}`
  const monthFullName = MONTH_FULL_NAMES[month] || `Month ${month}`
  const sortKey = year * 100 + month

  // Backend stores money in integer paise (1 Rupee = 100 paise)
  const grossWage = typeof raw.grossWage === 'number' ? raw.grossWage / 100 : 0
  const overtime = typeof raw.overtime === 'number' ? raw.overtime / 100 : 0
  const deductions = typeof raw.deductions === 'number' ? raw.deductions / 100 : 0
  
  // Authoritative netWage calculation: grossWage + overtime - deductions
  const netWage = typeof raw.netWage === 'number'
    ? raw.netWage / 100
    : Math.max(0, grossWage + overtime - deductions)

  return {
    id: raw.id,
    workerId: raw.workerId,
    month,
    year,
    monthName,
    monthFullName,
    monthYearLabel: `${monthName} ${year}`,
    sortKey,
    daysPresent: Number(raw.daysPresent) || 0,
    grossWage,
    overtime,
    deductions,
    netWage,
    isLocked: Boolean(raw.isLocked),
    worker: raw.worker || null,
  }
}

/**
 * Fetches actual wage records for a worker from the backend API.
 * Deduplicates and sorts chronologically across years and months.
 */
export async function getWorkerWages(workerId) {
  if (!workerId) {
    return {
      records: [],
      latestRecord: null,
      monthlyTrend: [],
      ytdEarnings: 0,
    }
  }

  const response = await api.get('/hr/wages', {
    params: {
      workerId,
      limit: 100,
    },
  })

  const rawList = response.data?.data || []
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return {
      records: [],
      latestRecord: null,
      monthlyTrend: [],
      ytdEarnings: 0,
    }
  }

  // Normalize all records
  const normalized = rawList.map(normalizeWageRecord).filter(Boolean)

  // Deduplicate records by year and month (in case of duplicate month entries, keep the latest updated)
  const mapByMonthYear = new Map()
  for (const rec of normalized) {
    const key = `${rec.year}-${rec.month}`
    mapByMonthYear.set(key, rec)
  }

  // Sort chronologically (year ascending, then month ascending)
  const sorted = Array.from(mapByMonthYear.values()).sort((a, b) => a.sortKey - b.sortKey)

  // Determine if trend spans multiple distinct years
  const distinctYears = new Set(sorted.map(r => r.year))
  const isMultiYear = distinctYears.size > 1

  // Format monthly trend data for Recharts chart
  const monthlyTrend = sorted.map(r => ({
    key: `${r.year}-${r.month}`,
    // If multi-year, display "Nov '25", "Jan '26"; otherwise "Nov", "Jan"
    month: isMultiYear ? `${r.monthName} '${String(r.year).slice(-2)}` : r.monthName,
    fullLabel: `${r.monthFullName} ${r.year}`,
    year: r.year,
    monthNum: r.month,
    netWage: Math.round(r.netWage),
    grossWage: Math.round(r.grossWage),
    overtime: Math.round(r.overtime),
    deductions: Math.round(r.deductions),
    daysPresent: r.daysPresent,
  }))

  // The latest record is the last one in chronological order
  const latestRecord = sorted[sorted.length - 1] || null

  // Calculate Year-to-Date or total earnings
  const currentYear = latestRecord?.year || new Date().getFullYear()
  const ytdEarnings = sorted
    .filter(r => r.year === currentYear)
    .reduce((sum, r) => sum + r.netWage, 0)

  return {
    records: sorted,
    latestRecord,
    monthlyTrend,
    ytdEarnings: Math.round(ytdEarnings),
  }
}
