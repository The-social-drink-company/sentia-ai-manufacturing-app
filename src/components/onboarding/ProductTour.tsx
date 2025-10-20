/**
 * Product Tour Component
 *
 * Interactive guided tour using react-joyride to showcase
 * key features of CapLiquify to new users.
 *
 * @module src/components/onboarding/ProductTour
 */

import { useState, useEffect } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'

interface ProductTourProps {
  onComplete?: () => void
  onSkip?: () => void
  autoStart?: boolean
}

export default function ProductTour({
  onComplete,
  onSkip,
  autoStart = true,
}: ProductTourProps) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (autoStart) {
      // Delay tour start to ensure DOM elements are ready
      const timer = setTimeout(() => setRun(true), 500)
      return () => clearTimeout(timer)
    }
  }, [autoStart])

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Welcome to CapLiquify! 🎉
          </h2>
          <p className="text-gray-700">
            Let's take a quick 2-minute tour to show you the most powerful
            features. You can skip anytime!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="sidebar"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Navigation Sidebar
          </h3>
          <p className="text-gray-700">
            Access all major features from here - Dashboard, Working Capital,
            Forecasting, Inventory, and more.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="working-capital"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Working Capital Dashboard
          </h3>
          <p className="text-gray-700">
            Monitor your cash conversion cycle, accounts receivable, inventory
            turnover, and accounts payable - all in one place.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="demand-forecast"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Demand Forecasting
          </h3>
          <p className="text-gray-700">
            AI-powered demand predictions help you optimize inventory and avoid
            stockouts. See 30, 60, and 90-day forecasts with confidence
            intervals.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="inventory-management"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Inventory Intelligence
          </h3>
          <p className="text-gray-700">
            Track stock levels, reorder points, and batch sizes. Get smart
            recommendations for optimal inventory management.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="quick-actions"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quick Actions
          </h3>
          <p className="text-gray-700">
            Use keyboard shortcuts (press '?' to see all shortcuts), export
            reports, and access settings quickly.
          </p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            You're All Set! 🚀
          </h2>
          <p className="text-gray-700 mb-4">
            That's it! You now know the key features of CapLiquify. Explore at
            your own pace, and remember - we're here to help!
          </p>
          <p className="text-sm text-gray-600">
            Tip: You can restart this tour anytime from Help → Product Tour
          </p>
        </div>
      ),
      placement: 'center',
    },
  ]

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type, action } = data

    // Handle tour completion
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false)

      // Mark tour as completed in local storage
      localStorage.setItem('productTourCompleted', 'true')

      if (status === STATUS.FINISHED && onComplete) {
        onComplete()
      } else if (status === STATUS.SKIPPED && onSkip) {
        onSkip()
      }
    }

    // Update step index
    if (type === 'step:after') {
      setStepIndex(index + (action === 'prev' ? -1 : 1))
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb', // Blue-600
          textColor: '#1f2937', // Gray-800
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#2563eb',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#6b7280',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        open: 'Open',
        skip: 'Skip Tour',
      }}
      disableScrolling={false}
      disableOverlayClose
      spotlightClicks={false}
    />
  )
}

/**
 * Hook to check if product tour should be shown
 */
export function useProductTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false)

  useEffect(() => {
    // Check if tour has been completed
    const tourCompleted = localStorage.getItem('productTourCompleted')
    setShouldShowTour(tourCompleted !== 'true')
  }, [])

  const resetTour = () => {
    localStorage.removeItem('productTourCompleted')
    setShouldShowTour(true)
  }

  const completeTour = () => {
    localStorage.setItem('productTourCompleted', 'true')
    setShouldShowTour(false)
  }

  return { shouldShowTour, resetTour, completeTour }
}
