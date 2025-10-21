/**
 * Trial Countdown Component
 *
 * Displays remaining trial time and provides a quick path to billing when urgency increases.
 *
 * @module src/components/trial/TrialCountdown
 */

import { useEffect, useState } from 'react'
import { Clock, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Countdown = {
  days: number
  hours: number
  minutes: number
}

interface TrialCountdownProps {
  trialEndDate: Date
  tier: string
}

const formatTier = (tier: string) => tier.charAt(0).toUpperCase() + tier.slice(1)

const calculateCountdown = (end: Date): Countdown => {
  const diff = end.getTime() - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)

  return { days, hours, minutes }
}

const TrialCountdown = ({ trialEndDate, tier }: TrialCountdownProps) => {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState<Countdown>(() => calculateCountdown(trialEndDate))

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(calculateCountdown(trialEndDate))
    }, 60 * 1000)

    return () => window.clearInterval(interval)
  }, [trialEndDate])

  const handleUpgrade = () => {
    navigate('/billing')
  }

  const urgencyLabel = (() => {
    if (countdown.days <= 0 && countdown.hours <= 0) {
      return 'Trial ends today'
    }
    if (countdown.days === 0) {
      return 'Less than 24 hours remaining'
    }
    if (countdown.days <= 2) {
      return 'Trial ending soon'
    }
    return 'Active trial'
  })()

  return (
    <aside className="rounded-2xl border border-blue-100 bg-blue-50/70 p-6">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Clock className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-blue-700">Trial countdown</p>
          <p className="text-xs text-blue-600">{urgencyLabel}</p>
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <dt className="text-xs font-medium text-gray-500">Days</dt>
          <dd className="text-2xl font-bold text-gray-900">{countdown.days}</dd>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <dt className="text-xs font-medium text-gray-500">Hours</dt>
          <dd className="text-2xl font-bold text-gray-900">{countdown.hours}</dd>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <dt className="text-xs font-medium text-gray-500">Minutes</dt>
          <dd className="text-2xl font-bold text-gray-900">{countdown.minutes}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-gray-600">
        You're enjoying the <span className="font-semibold text-gray-900">{formatTier(tier)}</span> experience. Add a payment
        method to continue without interruption.
      </p>

      <button
        onClick={handleUpgrade}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <CreditCard className="h-4 w-4" />
        Upgrade now
      </button>
    </aside>
  )
}

export default TrialCountdown
