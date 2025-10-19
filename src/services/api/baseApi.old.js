/**
 * Base API Service
 * Enterprise-grade API client with error handling, retries, and interceptors
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
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
        const response = await fetch(url, config)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new ApiError(
            errorData.message || `HTTP ${response.status}`,
            response.status,
            errorData
          )
        }

        return await response.json()
      } catch (error) {
        lastError = error

        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error
        }

        // Wait before retry
        if (i < MAX_RETRIES - 1) {
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
export { ApiError }
