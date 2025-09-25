const runtimeApiBase = typeof window !== 'undefined' && window.VITE_API_BASE_URL ? window.VITE_API_BASE_URL : import.meta.env?.VITE_API_BASE_URL
const API_BASE_URL = (runtimeApiBase || '/api').replace(/\/$/, '')

const normalizeEndpoint = (endpoint = '') => {
  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    return API_BASE_URL
  }

  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint
  }

  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

const unwrapPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload
  }

  if (Array.isArray(payload.data) || typeof payload.data === 'object') {
    return payload.data
  }

  if (payload.result) {
    return payload.result
  }

  if (payload.payload) {
    return payload.payload
  }

  return payload
}

export const buildApiUrl = (endpoint) => normalizeEndpoint(endpoint)

export const fetchJson = async (endpoint, options = {}) => {
  const url = normalizeEndpoint(endpoint)
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    },
    credentials: 'include',
    ...options
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    const error = new Error(`${url} responded with ${response.status}`)
    error.details = errorText
    throw error
  }

  const payload = await response.json().catch(() => null)
  return unwrapPayload(payload)
}

export default {
  buildApiUrl,
  fetchJson
}
