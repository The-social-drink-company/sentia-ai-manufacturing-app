const hasWindow = typeof window !== 'undefined'

const ANALYTICS_ENABLED = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT

const isConsentGranted = () => {
  if (!hasWindow) return false
  const consentState = window.__sentiaConsent
  if (consentState && typeof consentState.analytics === 'boolean') {
    return consentState.analytics
  }
  return true
}

const buildPayload = (eventName, properties) => ({
  eventName,
  timestamp: new Date().toISOString(),
  url: hasWindow ? window.location.href : undefined,
  referrer: hasWindow ? document.referrer || undefined : undefined,
  ...properties,
})

export function trackAnalyticsEvent(eventName, properties = {}) {
  if (!ANALYTICS_ENABLED) {
    if (import.meta.env.DEV) {
      console.debug('[analytics:disabled]', eventName, properties)
    }
    return
  }

  if (!isConsentGranted()) {
    if (import.meta.env.DEV) {
      console.debug('[analytics:consent-denied]', eventName)
    }
    return
  }

  const payload = buildPayload(eventName, properties)

  if (hasWindow && window.analytics && typeof window.analytics.track === 'function') {
    window.analytics.track(eventName, payload)
    return
  }

  if (ANALYTICS_ENDPOINT) {
    const payloadString = JSON.stringify(payload)

    if (
      hasWindow &&
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const delivered = navigator.sendBeacon(ANALYTICS_ENDPOINT, payloadString)
      if (delivered) {
        return
      }
    }

    fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payloadString,
      keepalive: true,
    }).catch(() => {
      if (import.meta.env.DEV) {
        console.warn('[analytics:send-failed]', eventName)
      }
    })
    return
  }

  if (import.meta.env.DEV) {
    console.info('[analytics:fallback]', eventName, payload)
  }
}

export default {
  track: trackAnalyticsEvent,
}
