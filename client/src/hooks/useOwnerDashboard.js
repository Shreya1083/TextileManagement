/**
 * useOwnerDashboard — TanStack Query hook for the owner dashboard.
 *
 * Usage:
 *   const { data, isLoading, isError, error, refetch, dataUpdatedAt } =
 *     useOwnerDashboard({ from: '2026-10-01', to: '2026-10-31' })
 *
 * Behaviour:
 *  - staleTime 60 s  — avoids thundering-herd on fast navigation
 *  - refetchInterval 60 s — auto-refreshes while the tab is active
 *  - refetchOnWindowFocus true  — refreshes when the user returns to the tab
 *  - retry 1  — one automatic retry on transient failure, then surface error
 */
import { useQuery } from '@tanstack/react-query'
import { fetchOwnerDashboard } from '../services/dashboardService.js'

const STALE_MS    = 60_000   // 60 s
const REFRESH_MS  = 60_000   // 60 s

export function useOwnerDashboard({ from, to } = {}) {
  return useQuery({
    queryKey:        ['ownerDashboard', from ?? '', to ?? ''],
    queryFn:         () => fetchOwnerDashboard({ from, to }),
    staleTime:       STALE_MS,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
