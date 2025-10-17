/**
 * Base API Service
 * Enterprise-grade API client with error handling, retries, and interceptors
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Use VITE_API_BASE_URL if available
  if (import.meta.env.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    // Ensure it ends with /api if it doesn't already
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
  }

  // Production fallback: use current domain
  if (import.meta.env.PROD) {
    return `${window.location.origin}/api`
  }

  // Development fallback
  return 'http://localhost:5000/api'
}

const API_BASE_URL = getApiBaseUrl()
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

class BaseApi {
  constructor() {
    this.baseURL = API_BASE_URL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    console.log(`[BaseApi] Making request to: ${url}`)
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    }

    // Add auth token if available
    const token = this.getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    let lastError
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        console.log(`[BaseApi] Making request to: ${url}`)
        const response = await fetch(url, config)

        if (!response.ok) {
          const contentType = response.headers.get('content-type')
          console.error(`[BaseApi] HTTP ${response.status} error for ${url}`)
          console.error(`[BaseApi] Content-Type: ${contentType}`)

          let errorData = {}
          if (contentType && contentType.includes('application/json')) {
            try {
              errorData = await response.json()
            } catch (parseError) {
              console.error(`[BaseApi] Failed to parse error JSON: ${parseError.message}`)
            }
          } else {
            const textResponse = await response.text()
            console.error(`[BaseApi] Non-JSON response: ${textResponse.substring(0, 200)}...`)
            errorData = {
              message: `Expected JSON but got ${contentType}. URL: ${url}`,
              htmlResponse: textResponse.substring(0, 500),
            }
          }

          throw new ApiError(
            errorData.message || `HTTP ${response.status} - Expected JSON but got ${contentType}`,
            response.status,
            errorData
          )
        }

        const result = await response.json()
        console.log(`[BaseApi] Success response from ${url}:`, result)
        return result
      } catch (error) {
        console.error(`[BaseApi] Request failed for ${url}:`, error)
        lastError = error

        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error
        }

        // Wait before retry
        if (i < MAX_RETRIES - 1) {
          console.log(`[BaseApi] Retrying request to ${url} in ${RETRY_DELAY * Math.pow(2, i)}ms`)
          await this.sleep(RETRY_DELAY * Math.pow(2, i))
        }
      }
    }

    throw lastError
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint

    return this.request(url, {
      method: 'GET',
    })
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    })
  }

  getAuthToken() {
    // Get token from Clerk or localStorage
    const clerkToken = window.Clerk?.session?.getToken()
    if (clerkToken) return clerkToken

    return localStorage.getItem('authToken')
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const api = new BaseApi()
export { ApiError, getApiBaseUrl }
