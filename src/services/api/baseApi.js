/**
 * Base API Service
 * Enterprise-grade API client with error handling, retries, and interceptors
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
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
      'Content-Type': 'application/json'
    }
  }

  async request(endpoint, options = {}) {
    const url = ${this.baseURL}
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    }

    const token = await this.getAuthToken()
    if (token) {
      config.headers.Authorization = Bearer 
    }

    let lastError
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetch(url, config)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new ApiError(
            errorData.message || HTTP ,
            response.status,
            errorData
          )
        }

        if (response.status === 204) {
          return null
        }

        return await response.json()
      } catch (error) {
        lastError = error

        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error
        }

        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(RETRY_DELAY * Math.pow(2, attempt))
        }
      }
    }

    throw lastError
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
      )
    ).toString()

    const url = queryString ? ${endpoint}? : endpoint

    return this.request(url, {
      method: 'GET'
    })
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    })
  }

  async getAuthToken() {
    try {
      const clerkSession = window?.Clerk?.session

      if (clerkSession?.getToken) {
        try {
          return await clerkSession.getToken({ template: 'sentia-backend' })
        } catch (templateError) {
          return await clerkSession.getToken()
        }
      }
    } catch (error) {
      console.warn('Failed to fetch Clerk token', error)
    }

    return localStorage.getItem('authToken')
  }

  sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }
}

export const api = new BaseApi()
export { ApiError }
