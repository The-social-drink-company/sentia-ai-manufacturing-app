/**
 * useTrialStatus Hook
 *
 * Provides trial status information and helper functions for trial UI components.
 * Calculates days remaining, checks if trial is active, and determines when to show upgrade prompts.
 *
 * @module hooks/useTrialStatus
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 2 (Trial Status UI Components)
 */

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './useAuth'

interface TrialStatus {
  isTrialActive: boolean
  isTrial: boolean
  daysRemaining: number
  hoursRemaining: number
  trialEndsAt: Date | null
  trialStartedAt: Date | null
  percentComplete: number
  showUpgradePrompt: boolean
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  subscriptionTier: string
  subscriptionStatus: string
  trialActivated: boolean
  trialOnboarded: boolean
}

/**
 * Hook to get current trial status and calculations
 */
export function useTrialStatus(): TrialStatus {
  const { user, tenant } = useAuth()
  const [now, setNow] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const trialStatus = useMemo(() => {
    if (!tenant) {
      return {
        isTrialActive: false,
        isTrial: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        trialEndsAt: null,
        trialStartedAt: null,
        percentComplete: 0,
        showUpgradePrompt: false,
        urgencyLevel: 'low' as const,
        subscriptionTier: 'starter',
        subscriptionStatus: 'unknown',
        trialActivated: false,
        trialOnboarded: false
      }
    }

    const subscriptionStatus = tenant.subscriptionStatus || 'unknown'
    const isTrial = subscriptionStatus === 'trial'
    const trialEndsAt = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null
    const trialStartedAt = tenant.trialStartedAt ? new Date(tenant.trialStartedAt) : null

    // Calculate time remaining
    const timeRemaining = trialEndsAt ? trialEndsAt.getTime() - now.getTime() : 0
    const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)))
    const hoursRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60)))

    // Calculate trial progress (0-100%)
    const trialDuration = 14 * 24 * 60 * 60 * 1000 // 14 days in ms
    const elapsed = trialStartedAt ? now.getTime() - trialStartedAt.getTime() : 0
    const percentComplete = Math.min(100, Math.max(0, (elapsed / trialDuration) * 100))

    // Determine if trial is active (trial status + time remaining)
    const isTrialActive = isTrial && daysRemaining > 0

    // Determine when to show upgrade prompts
    const showUpgradePrompt = isTrialActive && (
      daysRemaining <= 7 || // Last 7 days
      percentComplete >= 50  // Over 50% complete
    )

    // Determine urgency level
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (daysRemaining <= 1) {
      urgencyLevel = 'critical' // Last 24 hours
    } else if (daysRemaining <= 3) {
      urgencyLevel = 'high' // Last 3 days
    } else if (daysRemaining <= 7) {
      urgencyLevel = 'medium' // Last 7 days
    }

    return {
      isTrialActive,
      isTrial,
      daysRemaining,
      hoursRemaining,
      trialEndsAt,
      trialStartedAt,
      percentComplete,
      showUpgradePrompt,
      urgencyLevel,
      subscriptionTier: tenant.subscriptionTier || 'starter',
      subscriptionStatus,
      trialActivated: tenant.trialActivated || false,
      trialOnboarded: tenant.trialOnboarded || false
    }
  }, [tenant, now])

  return trialStatus
}

/**
 * Get urgency badge color based on urgency level
 */
export function getUrgencyColor(urgencyLevel: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  }
  return colors[urgencyLevel] || colors.low
}

/**
 * Format days remaining text
 */
export function formatDaysRemaining(daysRemaining: number, hoursRemaining: number): string {
  if (daysRemaining > 1) {
    return `${daysRemaining} days left`
  } else if (daysRemaining === 1) {
    return '1 day left'
  } else if (hoursRemaining > 1) {
    return `${hoursRemaining} hours left`
  } else if (hoursRemaining === 1) {
    return '1 hour left'
  } else {
    return 'Trial expiring soon'
  }
}
