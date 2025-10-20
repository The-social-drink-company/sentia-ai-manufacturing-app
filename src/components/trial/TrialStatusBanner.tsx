/**
 * Trial Status Banner Component
 *
 * Displays a persistent banner at the top of all pages during trial period.
 * Shows countdown, urgency level, and upgrade CTA.
 *
 * @module components/trial/TrialStatusBanner
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 2 (Trial Status UI Components)
 */

import { useState, useEffect } from 'react'
import { XMarkIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useTrialStatus, formatDaysRemaining, getUrgencyColor } from '../../hooks/useTrialStatus'
import { useNavigate } from 'react-router-dom'

interface TrialStatusBannerProps {
  onUpgrade?: () => void
  dismissible?: boolean
}

export function TrialStatusBanner({ onUpgrade, dismissible = true }: TrialStatusBannerProps) {
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()
  const [isDismissed, setIsDismissed] = useState(false)

  // Check if banner was dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('trial_banner_dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  // Don't show if not in trial or dismissed
  if (!trialStatus.isTrialActive || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('trial_banner_dismissed', 'true')
  }

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      navigate('/upgrade')
    }

    // Track upgrade click
    fetch('/api/trial/track-upgrade-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'banner' })
    }).catch(err => console.error('Failed to track upgrade click:', err))
  }

  const urgencyColorClasses = getUrgencyColor(trialStatus.urgencyLevel)
  const timeText = formatDaysRemaining(trialStatus.daysRemaining, trialStatus.hoursRemaining)

  return (
    <div className={`relative border-b ${urgencyColorClasses}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left section: Icon + Message */}
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold">
                {timeText} in your trial
              </span>
              {trialStatus.urgencyLevel === 'critical' && (
                <span className="text-sm">
                  ⚠️ Your trial expires soon!
                </span>
              )}
              {trialStatus.urgencyLevel === 'high' && (
                <span className="text-sm hidden sm:inline">
                  Upgrade now to keep your data and access.
                </span>
              )}
            </div>
          </div>

          {/* Right section: CTA + Dismiss */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpgradeClick}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200"
            >
              <SparklesIcon className="h-4 w-4" />
              Upgrade Now
            </button>

            {dismissible && (
              <button
                onClick={handleDismiss}
                className="rounded-md p-1 hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="Dismiss banner"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar (only show on medium/high/critical urgency) */}
        {trialStatus.urgencyLevel !== 'low' && (
          <div className="mt-3">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                style={{ width: `${trialStatus.percentComplete}%` }}
              />
            </div>
            <p className="mt-1 text-xs opacity-75">
              {Math.round(trialStatus.percentComplete)}% of trial used
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
