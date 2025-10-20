/**
 * useTrial Hook
 *
 * Fetches and manages trial status for the current tenant.
 * Provides real-time trial information for countdown components.
 *
 * @module src/hooks/useTrial
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'

interface TrialData {
  isInTrial: boolean
  trialStartDate: string | null
  trialEndDate: string | null
  trialDaysRemaining: number | null
  subscriptionTier: string
  subscriptionStatus: string
  gracePeriodEnd: string | null
}

interface TrialResponse {
  success: boolean
  data: TrialData
}

/**
 * Fetch trial status from API
 */
async function fetchTrialStatus(tenantSlug: string): Promise<TrialData> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

  const response = await fetch(`${apiBaseUrl}/trial/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': tenantSlug,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch trial status: ${response.statusText}`)
  }

  const result: TrialResponse = await response.json()

  if (!result.success) {
    throw new Error('Failed to fetch trial status')
  }

  return result.data
}

/**
 * useTrial Hook
 *
 * @returns Trial data and loading/error states
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { trial, isLoading, error } = useTrial()
 *
 *   if (isLoading) return <div>Loading trial status...</div>
 *   if (error) return <div>Error loading trial</div>
 *   if (!trial.isInTrial) return null
 *
 *   return (
 *     <TrialCountdown
 *       trialEndDate={trial.trialEndDate!}
 *       tier={trial.subscriptionTier}
 *     />
 *   )
 * }
 * ```
 */
export function useTrial() {
  const { user } = useAuth()

  // Extract tenant slug from user metadata
  // In production, this would come from Clerk user metadata or organization
  const tenantSlug = user?.organizationId || user?.publicMetadata?.tenantSlug || 'default'

  const {
    data: trial,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trial', tenantSlug],
    queryFn: () => fetchTrialStatus(tenantSlug as string),
    enabled: !!tenantSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
    retry: 2,
  })

  return {
    trial: trial || null,
    isLoading,
    error,
    refetch,
    // Convenience computed properties
    isInTrial: trial?.isInTrial || false,
    daysRemaining: trial?.trialDaysRemaining || 0,
    hasEnded: trial?.isInTrial && trial?.trialDaysRemaining !== null && trial.trialDaysRemaining <= 0,
    isUrgent: trial?.trialDaysRemaining !== null && trial.trialDaysRemaining <= 3,
  }
}

/**
 * Calculate days remaining from trial end date
 */
export function calculateDaysRemaining(trialEndDate: string | Date): number {
  const now = new Date()
  const end = new Date(trialEndDate)
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Check if trial is in grace period
 */
export function isInGracePeriod(
  trialEndDate: string | Date,
  gracePeriodEnd: string | Date | null
): boolean {
  if (!gracePeriodEnd) return false

  const now = new Date()
  const trialEnd = new Date(trialEndDate)
  const graceEnd = new Date(gracePeriodEnd)

  return now > trialEnd && now <= graceEnd
}
