import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

describe('analyticsClient', () => {
  let trackAnalyticsEvent
  let originalAnalytics
  let originalConsent
  let originalFetch
  let originalSendBeacon

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_ENABLE_ANALYTICS', 'true')
    vi.stubEnv('VITE_ANALYTICS_ENDPOINT', '')

    const module = await import('@/services/analyticsClient')
    trackAnalyticsEvent = module.trackAnalyticsEvent

    originalAnalytics = window.analytics
    originalConsent = window.__sentiaConsent
    originalFetch = global.fetch
    originalSendBeacon = navigator.sendBeacon

    window.analytics = undefined
    window.__sentiaConsent = undefined
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }))
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: undefined,
      writable: true,
    })
  })

  afterEach(() => {
    window.analytics = originalAnalytics
    window.__sentiaConsent = originalConsent
    global.fetch = originalFetch
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: originalSendBeacon,
      writable: true,
    })
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('sends event via window.analytics when available', () => {
    const track = vi.fn()
    window.analytics = { track }

    trackAnalyticsEvent('test_event', { foo: 'bar' })

    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'test_event',
      expect.objectContaining({ foo: 'bar', eventName: 'test_event' })
    )
  })

  it('respects consent flag', () => {
    const track = vi.fn()
    window.analytics = { track }
    window.__sentiaConsent = { analytics: false }

    trackAnalyticsEvent('test_event')

    expect(track).not.toHaveBeenCalled()
  })

  it('short-circuits when analytics disabled', async () => {
    vi.stubEnv('VITE_ENABLE_ANALYTICS', 'false')
    vi.resetModules()
    const module = await import('@/services/analyticsClient')
    const disabledTrack = module.trackAnalyticsEvent

    const track = vi.fn()
    window.analytics = { track }

    disabledTrack('test_event')

    expect(track).not.toHaveBeenCalled()
  })

  it('falls back to sendBeacon and fetch when endpoint configured', async () => {
    vi.stubEnv('VITE_ANALYTICS_ENDPOINT', 'https://example.com/collect')
    vi.resetModules()
    const module = await import('@/services/analyticsClient')
    const endpointTrack = module.trackAnalyticsEvent

    const sendBeacon = vi.fn(() => false)
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
      writable: true,
    })
    const fetchStub = vi.fn(() => Promise.resolve({ ok: true }))
    global.fetch = fetchStub

    endpointTrack('test_event', { foo: 'bar' })

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    expect(fetchStub).toHaveBeenCalledOnce()
  })
})
