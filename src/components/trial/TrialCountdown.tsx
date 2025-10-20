/**
 * Trial Countdown Component
 *
 * Real-time countdown display showing trial days/hours remaining.
 * Color-coded urgency indicators:
 * - Blue: >7 days remaining
 * - Yellow: 4-7 days remaining
 * - Red: ≤3 days remaining
 *
 * @module src/components/trial/TrialCountdown
 */

import { useState, useEffect } from 'react'
import { Clock, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface TrialCountdownProps {
  trialEndDate: string | Date
  tier: string
  onAddPayment?: () => void
}

export default function TrialCountdown({
  trialEndDate,
  tier,
  onAddPayment,
}: TrialCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    isExpired: false,
  })

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const end = new Date(trialEndDate).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          isExpired: true,
        })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeRemaining({
        days,
        hours,
        minutes,
        isExpired: false,
      })
    }

    // Calculate immediately
    calculateTimeRemaining()

    // Update every minute
    const interval = setInterval(calculateTimeRemaining, 60000)

    return () => clearInterval(interval)
  }, [trialEndDate])

  // Determine urgency level
  const getUrgencyConfig = () => {
    if (timeRemaining.isExpired) {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900',
        accentColor: 'text-red-600',
        badgeColor: 'bg-red-100 text-red-800',
        buttonColor: 'bg-red-600 hover:bg-red-700',
        icon: AlertTriangle,
        message: 'Trial Expired',
      }
    }

    if (timeRemaining.days <= 3) {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900',
        accentColor: 'text-red-600',
        badgeColor: 'bg-red-100 text-red-800',
        buttonColor: 'bg-red-600 hover:bg-red-700',
        icon: AlertTriangle,
        message: 'Trial Ending Soon',
      }
    }

    if (timeRemaining.days <= 7) {
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-900',
        accentColor: 'text-yellow-600',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
        icon: Clock,
        message: 'Trial Active',
      }
    }

    return {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      accentColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-800',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      icon: CheckCircle,
      message: 'Trial Active',
    }
  }

  const config = getUrgencyConfig()
  const Icon = config.icon

  // Don't show if trial expired (should show grace period banner instead)
  if (timeRemaining.isExpired) {
    return (
      <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-6 mb-6`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`${config.accentColor} mt-1`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${config.textColor} text-lg mb-1`}>
                Your Trial Has Ended
              </h3>
              <p className={`${config.textColor} text-sm mb-3`}>
                Add a payment method to continue using CapLiquify
              </p>
              <Link
                to="/billing/payment"
                className={`inline-flex items-center gap-2 px-4 py-2 ${config.buttonColor} text-white rounded-lg font-semibold transition-colors`}
              >
                <CreditCard className="w-4 h-4" />
                Add Payment Method
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-6 mb-6`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`${config.accentColor} mt-1`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold ${config.textColor} text-lg`}>
                {config.message}
              </h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.badgeColor}`}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
              </span>
            </div>

            {/* Countdown Display */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${config.textColor}`}>
                  {timeRemaining.days}
                </span>
                <span className={`text-sm ${config.textColor}`}>
                  {timeRemaining.days === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${config.textColor}`}>
                  {timeRemaining.hours}
                </span>
                <span className={`text-sm ${config.textColor}`}>
                  {timeRemaining.hours === 1 ? 'hour' : 'hours'}
                </span>
              </div>
              <span className={`text-sm ${config.textColor}`}>remaining</span>
            </div>

            <p className={`${config.textColor} text-sm mb-4`}>
              {timeRemaining.days <= 3 ? (
                <>
                  Your trial is ending soon! Add a payment method now to avoid
                  any interruption.
                </>
              ) : timeRemaining.days <= 7 ? (
                <>
                  You have {timeRemaining.days} days left to explore all features.
                  Add payment before trial ends.
                </>
              ) : (
                <>
                  Enjoying CapLiquify? Add a payment method anytime to continue
                  after your trial.
                </>
              )}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {onAddPayment ? (
                <button
                  onClick={onAddPayment}
                  className={`inline-flex items-center gap-2 px-4 py-2 ${config.buttonColor} text-white rounded-lg font-semibold transition-colors`}
                >
                  <CreditCard className="w-4 h-4" />
                  Add Payment Method
                </button>
              ) : (
                <Link
                  to="/billing/payment"
                  className={`inline-flex items-center gap-2 px-4 py-2 ${config.buttonColor} text-white rounded-lg font-semibold transition-colors`}
                >
                  <CreditCard className="w-4 h-4" />
                  Add Payment Method
                </Link>
              )}

              {timeRemaining.days > 3 && (
                <Link
                  to="/pricing"
                  className={`${config.textColor} text-sm font-semibold hover:underline`}
                >
                  View Pricing
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Dismiss Button (only for non-urgent) */}
        {timeRemaining.days > 7 && (
          <button
            onClick={() => {
              // In production, save dismissed state to prevent showing again for 24 hours
              const countdown = document.querySelector('[data-trial-countdown]')
              if (countdown) {
                countdown.classList.add('hidden')
              }
            }}
            className={`${config.textColor} hover:${config.accentColor} transition-colors`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
