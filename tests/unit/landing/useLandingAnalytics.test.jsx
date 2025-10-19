import { act } from 'react'
import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'

const trackSpy = vi.fn()

vi.mock('@/services/analyticsClient', () => ({
  trackAnalyticsEvent: (...args) => trackSpy(...args),
}))

class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }

  observe(node) {
    act(() => {
      this.callback([{ target: node, isIntersecting: true }])
    })
  }

  disconnect() {}
}

describe('useLandingAnalytics', () => {
  let useLandingAnalytics
  const originalObserver = global.IntersectionObserver

  beforeAll(async () => {
    useLandingAnalytics = (await import('@/hooks/useLandingAnalytics')).default
  })

  beforeEach(() => {
    trackSpy.mockClear()
    global.IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    global.IntersectionObserver = originalObserver
  })

  it('tracks hero view when element enters viewport', () => {
    const { result } = renderHook(() => useLandingAnalytics())
    const element = document.createElement('div')

    act(() => {
      result.current.heroRef(element)
    })

    expect(trackSpy).toHaveBeenCalledWith(
      'landing_hero_viewed',
      expect.objectContaining({ page: 'landing' })
    )
  })

  it('tracks primary CTA clicks with location metadata', () => {
    const { result } = renderHook(() => useLandingAnalytics({ variant: 'v1', userStatus: 'visitor' }))

    act(() => {
      result.current.trackPrimaryCTA('hero')
    })

    expect(trackSpy).toHaveBeenCalledWith(
      'landing_primary_cta_clicked',
      expect.objectContaining({ triggerLocation: 'hero', variant: 'v1', userStatus: 'visitor' })
    )
  })

  it('tracks secondary CTA', () => {
    const { result } = renderHook(() => useLandingAnalytics())

    act(() => {
      result.current.trackSecondaryCTA('features')
    })

    expect(trackSpy).toHaveBeenCalledWith(
      'landing_secondary_cta_clicked',
      expect.objectContaining({ targetSection: 'features' })
    )
  })

  it('tracks sign in modal trigger', () => {
    const { result } = renderHook(() => useLandingAnalytics())

    act(() => {
      result.current.trackSignInModal('footer')
    })

    expect(trackSpy).toHaveBeenCalledWith(
      'landing_signin_modal_opened',
      expect.objectContaining({ triggerLocation: 'footer' })
    )
  })
})
