// Enterprise API Key Management Service
// Secure handling of API keys and credentials

class ApiKeyManager {
  constructor() {
    this.keys = new Map()
    this.encryptionKey = null
    this.initialized = false
  }

  // Initialize the API key manager
  async initialize() {
    if (this.initialized) return

    // In production, keys should come from secure backend
    // Never store actual keys in frontend code
    this.keys.set('unleashed', {
      endpoint: import.meta.env.VITE_UNLEASHED_API_ENDPOINT,
      keyRef: 'unleashed_api_key', // Reference to backend key storage
      status: 'ready'
    })

    this.keys.set('amazon', {
      endpoint: import.meta.env.VITE_AMAZON_API_ENDPOINT,
      keyRef: 'amazon_sp_api_key',
      status: 'ready'
    })

    this.keys.set('shopify', {
      endpoint: import.meta.env.VITE_SHOPIFY_API_ENDPOINT,
      keyRef: 'shopify_api_key',
      status: 'ready'
    })

    this.keys.set('openai', {
      endpoint: import.meta.env.VITE_OPENAI_API_ENDPOINT,
      keyRef: 'openai_api_key',
      status: 'ready'
    })

    this.keys.set('claude', {
      endpoint: import.meta.env.VITE_CLAUDE_API_ENDPOINT,
      keyRef: 'claude_api_key',
      status: 'ready'
    })

    this.initialized = true
    return { status: 'initialized', services: Array.from(this.keys.keys()) }
  }

  // Get API configuration (without exposing actual keys)
  getApiConfig(service) {
    const config = this.keys.get(service)
    if (!config) {
      throw new Error(`API configuration not found for service: ${service}`)
    }

    return {
      endpoint: config.endpoint,
      keyRef: config.keyRef,
      status: config.status,
      // Backend will handle actual authentication
      authMethod: 'backend-proxy'
    }
  }

  // Make authenticated API request through backend proxy
  async makeAuthenticatedRequest(service, path, options = {}) {
    const config = this.getApiConfig(service)
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

    try {
      const response = await fetch(`${backendUrl}/proxy/${service}${path}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key-Ref': config.keyRef,
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: 'include' // Include cookies for session
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request to ${service} failed:`, error)
      throw error
    }
  }

  // Validate API key configuration
  async validateApiKeys() {
    const results = new Map()

    for (const [service, config] of this.keys) {
      try {
        // Validate through backend
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/validate-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service, keyRef: config.keyRef }),
          credentials: 'include'
        })

        const result = await response.json()
        results.set(service, {
          valid: result.valid,
          message: result.message
        })
      } catch (error) {
        results.set(service, {
          valid: false,
          message: error.message
        })
      }
    }

    return results
  }

  // Rotate API key (admin only)
  async rotateApiKey(service) {
    // This should only be callable by admins
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rotate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to rotate API key')
    }

    return await response.json()
  }

  // Get API usage statistics
  async getApiUsageStats(service) {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/usage-stats/${service}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch usage statistics')
    }

    return await response.json()
  }

  // Check rate limits
  async checkRateLimits(service) {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rate-limits/${service}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to check rate limits')
    }

    return await response.json()
  }

  // Get all API statuses
  getApiStatuses() {
    const statuses = {}
    for (const [service, config] of this.keys) {
      statuses[service] = config.status
    }
    return statuses
  }

  // Update API status
  updateApiStatus(service, status) {
    const config = this.keys.get(service)
    if (config) {
      config.status = status
    }
  }
}

// Create singleton instance
const apiKeyManager = new ApiKeyManager()

// Auto-initialize
if (typeof window !== 'undefined') {
  apiKeyManager.initialize().catch(error => {
    console.error('Failed to initialize API key manager:', error)
  })
}

export default apiKeyManager

// Named exports
export const {
  initialize,
  getApiConfig,
  makeAuthenticatedRequest,
  validateApiKeys,
  rotateApiKey,
  getApiUsageStats,
  checkRateLimits,
  getApiStatuses
} = apiKeyManager