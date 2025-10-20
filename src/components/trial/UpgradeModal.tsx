/**
 * Upgrade Modal Component
 *
 * Auto-shows on Day 7, 11, 13 of trial with tier comparison and upgrade CTA.
 * Dismissible but re-appears based on schedule.
 *
 * @module components/trial/UpgradeModal
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 2 (Trial Status UI Components)
 */

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CheckIcon, SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { useNavigate } from 'react-router-dom'

interface UpgradeModalProps {
  trigger?: 'day_7' | 'day_11' | 'day_13' | 'manual'
  onClose?: () => void
}

const TIER_FEATURES = {
  starter: [
    'Basic forecasting',
    'API integrations (Xero, Shopify)',
    'Standard reports',
    'Email support',
    '5 users, 500 entities'
  ],
  professional: [
    'Everything in Starter, plus:',
    'AI-powered forecasting (>85% accuracy)',
    'What-if scenario analysis',
    'Advanced reports & analytics',
    'Priority support',
    '25 users, 5,000 entities'
  ],
  enterprise: [
    'Everything in Professional, plus:',
    'Custom integrations',
    'Dedicated account manager',
    'Advanced security & compliance',
    'Custom training & onboarding',
    '100 users, unlimited entities'
  ]
}

const TIER_PRICING = {
  starter: { monthly: 49, annual: 470 },
  professional: { monthly: 149, annual: 1518 },
  enterprise: { monthly: 499, annual: 5088 }
}

export function UpgradeModal({ trigger = 'manual', onClose }: UpgradeModalProps) {
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional' | 'enterprise'>('professional')
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('monthly')

  // Auto-show modal based on trigger and trial day
  useEffect(() => {
    if (!trialStatus.isTrialActive) return

    const shouldShow = checkShouldShow()
    if (shouldShow) {
      setIsOpen(true)
      trackModalShown()
    }
  }, [trialStatus.daysRemaining, trigger])

  const checkShouldShow = (): boolean => {
    // Don't show if already shown today
    const shownToday = localStorage.getItem(`upgrade_modal_shown_${new Date().toDateString()}`)
    if (shownToday) return false

    // Check if should show based on trigger
    const daysRemaining = trialStatus.daysRemaining

    if (trigger === 'day_7' && daysRemaining === 7) return true
    if (trigger === 'day_11' && daysRemaining === 3) return true // Day 11 of 14 = 3 days left
    if (trigger === 'day_13' && daysRemaining === 1) return true // Day 13 of 14 = 1 day left
    if (trigger === 'manual') return true

    return false
  }

  const trackModalShown = () => {
    // Mark as shown today
    localStorage.setItem(`upgrade_modal_shown_${new Date().toDateString()}`, 'true')

    // Track in database
    fetch('/api/trial/track-upgrade-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptType: `modal_${trigger}` })
    }).catch(err => console.error('Failed to track modal shown:', err))
  }

  const handleClose = () => {
    setIsOpen(false)
    if (onClose) onClose()
  }

  const handleUpgrade = () => {
    // Track upgrade click
    fetch('/api/trial/track-upgrade-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: `modal_${trigger}` })
    }).catch(err => console.error('Failed to track upgrade click:', err))

    // Navigate to upgrade page with selected tier
    navigate(`/upgrade?tier=${selectedTier}&cycle=${selectedCycle}`)
  }

  const getUrgencyMessage = (): string => {
    if (trialStatus.daysRemaining <= 1) {
      return '⚠️ Your trial expires tomorrow!'
    } else if (trialStatus.daysRemaining <= 3) {
      return `Only ${trialStatus.daysRemaining} days left in your trial`
    } else if (trialStatus.daysRemaining <= 7) {
      return `${trialStatus.daysRemaining} days left to upgrade`
    }
    return 'Upgrade now to unlock all features'
  }

  const calculateAnnualSavings = (tier: 'starter' | 'professional' | 'enterprise'): number => {
    const monthlyTotal = TIER_PRICING[tier].monthly * 12
    const annualPrice = TIER_PRICING[tier].annual
    return monthlyTotal - annualPrice
  }

  if (!isOpen) return null

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 rounded-md text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {/* Header */}
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                    <RocketLaunchIcon className="h-6 w-6 text-white" />
                  </div>
                  <Dialog.Title as="h3" className="mt-4 text-2xl font-bold leading-6 text-gray-900">
                    {getUrgencyMessage()}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-gray-600">
                    Choose a plan to continue using CapLiquify with all your data intact
                  </p>
                </div>

                {/* Billing cycle toggle */}
                <div className="mt-6 flex justify-center">
                  <div className="inline-flex rounded-lg border border-gray-200 p-1">
                    <button
                      onClick={() => setSelectedCycle('monthly')}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        selectedCycle === 'monthly'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSelectedCycle('annual')}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        selectedCycle === 'annual'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Annual
                      <span className="ml-1 text-xs text-green-600 font-semibold">Save 15%</span>
                    </button>
                  </div>
                </div>

                {/* Tier comparison */}
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {(['starter', 'professional', 'enterprise'] as const).map((tier) => {
                    const isRecommended = tier === 'professional'
                    const price = TIER_PRICING[tier][selectedCycle]
                    const monthlyEquivalent = selectedCycle === 'annual' ? Math.round(price / 12) : price

                    return (
                      <div
                        key={tier}
                        className={`relative rounded-lg border-2 p-6 ${
                          selectedTier === tier
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } cursor-pointer transition-colors`}
                        onClick={() => setSelectedTier(tier)}
                      >
                        {isRecommended && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-semibold text-white">
                              <SparklesIcon className="h-3 w-3" />
                              Recommended
                            </span>
                          </div>
                        )}

                        <h4 className="text-lg font-bold capitalize text-gray-900">{tier}</h4>
                        <div className="mt-4">
                          <span className="text-4xl font-bold text-gray-900">${monthlyEquivalent}</span>
                          <span className="text-gray-600">/mo</span>
                          {selectedCycle === 'annual' && (
                            <p className="mt-1 text-xs text-green-600 font-medium">
                              Save ${calculateAnnualSavings(tier)}/year
                            </p>
                          )}
                        </div>

                        <ul className="mt-6 space-y-3">
                          {TIER_FEATURES[tier].map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {selectedTier === tier && (
                          <div className="mt-4 rounded-md bg-blue-600 p-2 text-center text-sm font-semibold text-white">
                            Selected
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* CTA */}
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    onClick={handleClose}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Not Now
                  </button>
                  <button
                    onClick={handleUpgrade}
                    className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-purple-700"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    Upgrade to {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
