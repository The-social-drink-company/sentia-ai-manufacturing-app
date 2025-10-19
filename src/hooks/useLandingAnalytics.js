import { useCallback, useEffect, useRef } from 'react'
import { trackAnalyticsEvent } from '@/services/analyticsClient'

const hasWindow = typeof window !== 'undefined'

export function useLandingAnalytics({ variant = 'default', userStatus = 'visitor' } = {}) {
  const heroObservedRef = useRef(false)
  const observerRef = useRef(null)

  const dispatchEvent = useCallback(
    (eventName, properties = {}) => {
      trackAnalyticsEvent(eventName, {
        page: 'landing',
        variant,
        userStatus,
        ...properties,
      })
    },
    [variant, userStatus]
  )

  const heroRef = useCallback(
    node => {
      if (!hasWindow) return

      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      if (!node) return

      observerRef.current = new IntersectionObserver(
        entries => {
          const [entry] = entries
          if (!entry?.isIntersecting || heroObservedRef.current) return

          heroObservedRef.current = true
          dispatchEvent('landing_hero_viewed', {
            viewportWidth: hasWindow ? window.innerWidth : null,
            referrer: hasWindow ? document.referrer || 'direct' : 'unknown',
          })
        },
        {
          threshold: 0.4,
        }
      )

      observerRef.current.observe(node)
    },
    [dispatchEvent]
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const trackPrimaryCTA = useCallback(
    location => {
      dispatchEvent('landing_primary_cta_clicked', {
        triggerLocation: location,
      })
    },
    [dispatchEvent]
  )

  const trackSecondaryCTA = useCallback(
    targetSection => {
      dispatchEvent('landing_secondary_cta_clicked', {
        targetSection,
      })
    },
    [dispatchEvent]
  )

  const trackSignInModal = useCallback(
    triggerLocation => {
      dispatchEvent('landing_signin_modal_opened', {
        triggerLocation,
      })
    },
    [dispatchEvent]
  )

  return {
    heroRef,
    trackPrimaryCTA,
    trackSecondaryCTA,
    trackSignInModal,
  }
}

export default useLandingAnalytics
