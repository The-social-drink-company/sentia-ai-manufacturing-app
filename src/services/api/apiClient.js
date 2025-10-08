/**
 * Centralized API client for Sentia Manufacturing Dashboard
 * Provides unified interface to all backend endpoints with MCP server support
 */

class APIClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    this.mcpServerURL = this.getMCPServerURL()
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  /**
   * Get MCP server URL based on environment
   */
  getMCPServerURL() {
    // Environment-specific MCP server URLs
    const hostname = window.location.hostname
    
    if (hostname.includes('development') || hostname.includes('621h')) {
      return 'https://sentia-mcp-production.onrender.com'
    } else if (hostname.includes('test')) {
      return 'https://sentia-mcp-production.onrender.com'
    } else if (hostname.includes('production')) {
      return 'https://sentia-mcp-production.onrender.com'
    }
    
    // Default to localhost for local development
    return 'http://localhost:3001'
  }

  /**
   * Generic request method with error handling and MCP server fallback
   */
  async request(endpoint, options = {}) {
    // Determine if this should go to MCP server
    const shouldUseMCP = this.shouldUseMCPServer(endpoint)
    
    if (shouldUseMCP) {
      try {
        return await this.requestMCP(endpoint, options)
      } catch (mcpError) {
        console.warn(`[APIClient] MCP server request failed, falling back to main server:`, mcpError.message)
        // Fall back to main server
        return await this.requestMain(endpoint, options)
      }
    } else {
      return await this.requestMain(endpoint, options)
    }
  }

  /**
   * Determine if endpoint should use MCP server
   */
  shouldUseMCPServer(endpoint) {
    const mcpEndpoints = [
      '/api/financial/kpi-summary',
      '/api/sales/product-performance', 
      '/api/financial/pl-analysis'
    ]
    return mcpEndpoints.some(mcpEndpoint => endpoint.includes(mcpEndpoint))
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
    
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
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
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return await response.text()
    } catch (error) {
      console.error(`[APIClient] Main server request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Convenience methods
  async get(endpoint, params = {}) {
    // Handle endpoint that may already include /api prefix
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint : `${this.baseURL}${endpoint}`
    const url = new URL(cleanEndpoint, window.location.origin)
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key])
      }
    })
    
    return this.request(url.pathname + url.search, { method: 'GET' })
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