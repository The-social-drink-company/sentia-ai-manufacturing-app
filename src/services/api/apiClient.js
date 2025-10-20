/**
 * Centralized API client for CapLiquify Manufacturing Platform
 * Provides unified interface to all backend endpoints with MCP server support
 */

class APIClient {
  constructor() {
    this.baseURL = this.getBaseURL()
    this.mcpServerURL = this.getMCPServerURL()
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
  }

  /**
   * Get base URL ensuring proper formatting
   */
  getBaseURL() {
    const envURL = import.meta.env.VITE_API_BASE_URL

    // If no environment URL, use relative /api
    if (!envURL) {
      return '/api'
    }

    // If it's already a relative path, use it
    if (envURL.startsWith('/')) {
      return envURL
    }

    // If it's a full URL, ensure it ends properly
    return envURL.endsWith('/') ? envURL.slice(0, -1) : envURL
  }

  /**
   * Get MCP server URL based on environment
   */
  getMCPServerURL() {
    // Environment-specific MCP server URLs
    const hostname = window.location.hostname

    if (hostname.includes('development') || hostname.includes('621h')) {
      return 'https://mcp.capliquify.com'
    } else if (hostname.includes('test')) {
      return 'https://mcp.capliquify.com'
    } else if (hostname.includes('production')) {
      return 'https://mcp.capliquify.com'
    }

    // Default to localhost for local development
    return 'http://localhost:3001'
  }

  /**
   * Generic request method with error handling and MCP server fallback
   */
  async request(endpoint, options = {}) {
    // Determine if this should go to MCP server
    const shouldUseMCP = this.shouldUseMCPServer()

    if (shouldUseMCP) {
      try {
        return await this.requestMCP(endpoint, options)
      } catch (mcpError) {
        console.warn(
          `[APIClient] MCP server request failed, falling back to main server:`,
          mcpError.message
        )
        // Fall back to main server
        return await this.requestMain(endpoint, options)
      }
    } else {
      return await this.requestMain(endpoint, options)
    }
  }

  /**
   * Determine if endpoint should use MCP server
   * TODO: Re-enable MCP server routing once integrations are fixed
   * Currently disabled to use working main server integrations
   */
  shouldUseMCPServer() {
    // Temporarily disable MCP routing - all requests go to main server
    return false

    // TODO: Restore this logic once MCP server integrations are working:
    // const mcpEndpoints = [
    //   '/api/financial/kpi-summary',
    //   '/api/sales/product-performance',
    //   '/api/financial/pl-analysis'
    // ]
    // return mcpEndpoints.some(mcpEndpoint => endpoint.includes(mcpEndpoint))
  }

  /**
   * Generate correlation ID for request tracking
   */
  generateCorrelationId() {
    return `dash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Request to MCP server
   */
  async requestMCP(endpoint, options = {}) {
    // Convert main server endpoints to MCP server endpoints
    let mcpEndpoint = endpoint
    if (endpoint.startsWith('/api/financial/') || endpoint.startsWith('/api/sales/')) {
      mcpEndpoint = endpoint.replace('/api/', '/api/dashboard/')
    }

    const url = `${this.mcpServerURL}${mcpEndpoint}`

    // Add required MCP server headers
    const mcpHeaders = {
      'x-dashboard-version': '2.0.0',
      'x-correlation-id': this.generateCorrelationId(),
      ...this.defaultHeaders,
      ...options.headers,
    }

    const config = {
      headers: mcpHeaders,
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`MCP Server Error: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return await response.text()
    } catch (error) {
      console.error(`[APIClient] MCP request failed for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Request to main server
   */
  async requestMain(endpoint, options = {}) {
    // Construct URL properly
    let url
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      // Endpoint is already a full URL
      url = endpoint
    } else if (this.baseURL.startsWith('http://') || this.baseURL.startsWith('https://')) {
      // Base URL is full URL, concatenate carefully
      const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      url = `${base}${path}`
    } else {
      // Both are relative paths
      const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      url = `${base}${path}`
    }

    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    }

    try {
      console.log(`[APIClient] Making request to: ${url}`)
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return await response.text()
    } catch (error) {
      console.error(`[APIClient] Main server request failed for ${url}:`, error)
      throw error
    }
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    // Extract params from options if provided
    const { params = {}, ...restOptions } = options

    // Handle query parameters properly
    let queryString = ''
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()

      Object.keys(params).forEach(key => {
        const value = params[key]
        if (value !== undefined && value !== null) {
          // Handle different types of values
          if (typeof value === 'object') {
            // Serialize objects and arrays properly
            searchParams.append('params', JSON.stringify({ [key]: value }))
          } else {
            searchParams.append(key, String(value))
          }
        }
      })

      if (searchParams.toString()) {
        queryString = '?' + searchParams.toString()
      }
    }

    const fullEndpoint = endpoint + queryString
    return this.request(fullEndpoint, { method: 'GET', ...restOptions })
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

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // Health check
  async health() {
    return this.get('/health')
  }

  // System status
  async status() {
    return this.get('/status')
  }
}

// Create singleton instance
const apiClient = new APIClient()

export default apiClient
