import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

const trackSpy = vi.fn()

vi.mock('@/services/analyticsClient', () => ({
  trackAnalyticsEvent: trackSpy,
}))

class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
    this.observe = vi.fn(node => {
      this.callback([{ target: node, isIntersecting: true }])
    })
    this.disconnect = vi.fn()
  }
}

describe('useLandingAnalytics', () => {
  const { default: useLandingAnalytics } = require('@/hooks/useLandingAnalytics')
  const originalObserver = global.IntersectionObserver

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

    result.current.heroRef(element)

    expect(trackSpy).toHaveBeenCalledWith(
      'landing_hero_viewed',
      expect.objectContaining({ page: 'landing' })
    )
  })

  it('tracks primary CTA clicks with location metadata', () => {
    const { result } = renderHook(() => useLandingAnalytics({ variant: 'v1', userStatus: 'visitor' }))

    result.current.trackPrimaryCTA('hero')

    expect(trackSpy).toHaveBeenCalledWith(
      'landing_primary_cta_clicked',
      expect.objectContaining({ triggerLocation: 'hero', variant: 'v1', userStatus: 'visitor' })
    )
  })

  it('tracks secondary CTA', () => {
    const { result } = renderHook(() => useLandingAnalytics())

    result.current.trackSecondaryCTA('features')

    expect(trackSpy).toHaveBeenCalledWith(
      'landing_secondary_cta_clicked',
      expect.objectContaining({ targetSection: 'features' })
    )
  })

  it('tracks sign in modal trigger', () => {
    const { result } = renderHook(() => useLandingAnalytics())

    result.current.trackSignInModal('footer')

    expect(trackSpy).toHaveBeenCalledWith(
      'landing_signin_modal_opened',
      expect.objectContaining({ triggerLocation: 'footer' })
    )
  })
})
