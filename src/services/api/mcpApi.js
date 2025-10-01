/**
 * MCP Server API Service
 * Direct integration with MCP server for real live data only
 */

import { api } from './baseApi'

// MCP Server Configuration
const MCP_SERVER_URL = 'https://mcp-server-tkyu.onrender.com'

/**
 * MCP API Service Class
 * Connects directly to MCP server for all manufacturing data
 */
class MCPApi {
  constructor() {
    this.mcpBaseUrl = MCP_SERVER_URL
  }

  /**
   * Direct MCP server request
   */
  async mcpRequest(endpoint, options = {}) {
    const url = `${this.mcpBaseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`MCP Server Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`[MCPApi] Request failed for ${endpoint}:`, error)
      throw new Error(`Failed to fetch real-time data from MCP server: ${error.message}`)
    }
  }

  /**
   * Get MCP server status
   */
  async getStatus() {
    return this.mcpRequest('/health')
  }

  /**
   * Get real-time manufacturing data from MCP
   */
  async getManufacturingData() {
    return this.mcpRequest('/api/manufacturing/dashboard')
  }

  /**
   * Get AI manufacturing insights
   */
  async getAIInsights(query) {
    return this.mcpRequest('/api/ai/manufacturing-insights', {
      method: 'POST',
      body: JSON.stringify({ query })
    })
  }

  /**
   * Get unified API data (all external services through MCP)
   */
  async getUnifiedData() {
    return this.mcpRequest('/api/unified/all-services')
  }

  /**
   * Get working capital data from MCP
   */
  async getWorkingCapitalMCP() {
    return this.mcpRequest('/api/financial/working-capital')
  }

  /**
   * Get production data from MCP
   */
  async getProductionMCP() {
    return this.mcpRequest('/api/production/status')
  }

  /**
   * Get inventory data from MCP
   */
  async getInventoryMCP() {
    return this.mcpRequest('/api/inventory/current')
  }

  /**
   * Get demand forecasting from MCP AI
   */
  async getDemandForecastMCP() {
    return this.mcpRequest('/api/ai/demand-forecast')
  }

  /**
   * Get quality metrics from MCP
   */
  async getQualityMetricsMCP() {
    return this.mcpRequest('/api/quality/metrics')
  }

  /**
   * Execute MCP tool directly
   */
  async executeMCPTool(toolName, parameters = {}) {
    return this.mcpRequest('/api/mcp/execute-tool', {
      method: 'POST',
      body: JSON.stringify({
        tool: toolName,
        parameters
      })
    })
  }

  /**
   * Get real-time alerts from MCP
   */
  async getRealtimeAlerts() {
    return this.mcpRequest('/api/alerts/current')
  }

  /**
   * Submit manufacturing request to AI Central Nervous System
   */
  async submitManufacturingRequest(request) {
    return this.mcpRequest('/api/ai/manufacturing-request', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }
}

export const mcpApi = new MCPApi()

// Enhanced dashboard API that prioritizes MCP data
class EnhancedDashboardApi {
  /**
   * Get dashboard summary with MCP priority
   */
  async getSummary() {
    try {
      // Try MCP server first for real live data
      const mcpData = await mcpApi.getManufacturingData()
      console.log('[EnhancedDashboardApi] Using MCP live data:', mcpData)
      return mcpData
    } catch (mcpError) {
      console.error('[EnhancedDashboardApi] MCP server unavailable:', mcpError)
      throw new Error('Real-time data unavailable - MCP server connection failed')
    }
  }

  /**
   * Get working capital with MCP priority
   */
  async getWorkingCapital() {
    try {
      const mcpData = await mcpApi.getWorkingCapitalMCP()
      console.log('[EnhancedDashboardApi] Using MCP working capital data:', mcpData)
      return mcpData
    } catch (mcpError) {
      console.error('[EnhancedDashboardApi] MCP working capital unavailable:', mcpError)
      throw new Error('Real-time working capital data unavailable')
    }
  }

  /**
   * Get production data with MCP priority
   */
  async getProductionJobs() {
    try {
      const mcpData = await mcpApi.getProductionMCP()
      console.log('[EnhancedDashboardApi] Using MCP production data:', mcpData)
      return mcpData
    } catch (mcpError) {
      console.error('[EnhancedDashboardApi] MCP production data unavailable:', mcpError)
      throw new Error('Real-time production data unavailable')
    }
  }

  /**
   * Get inventory data with MCP priority
   */
  async getInventoryLevels() {
    try {
      const mcpData = await mcpApi.getInventoryMCP()
      console.log('[EnhancedDashboardApi] Using MCP inventory data:', mcpData)
      return mcpData
    } catch (mcpError) {
      console.error('[EnhancedDashboardApi] MCP inventory data unavailable:', mcpError)
      throw new Error('Real-time inventory data unavailable')
    }
  }

  /**
   * Get forecasting data with MCP AI
   */
  async getForecasting() {
    try {
      const mcpData = await mcpApi.getDemandForecastMCP()
      console.log('[EnhancedDashboardApi] Using MCP AI forecasting:', mcpData)
      return mcpData
    } catch (mcpError) {
      console.error('[EnhancedDashboardApi] MCP AI forecasting unavailable:', mcpError)
      throw new Error('Real-time AI forecasting unavailable')
    }
  }

  /**
   * Get quality metrics with MCP priority
   */
  async getQualityMetrics() {
    try {
      const mcpData = await mcpApi.getQualityMetricsMCP()
      console.log('[EnhancedDashboardApi] Using MCP quality data:', mcpData)
      return mcpData
    } catch (mcpError) {
      console.error('[EnhancedDashboardApi] MCP quality data unavailable:', mcpError)
      throw new Error('Real-time quality metrics unavailable')
    }
  }

  /**
   * Get analytics KPIs with MCP unified data
   */
  async getAnalyticsKPIs() {
    try {
      const mcpData = await mcpApi.getUnifiedData()
      console.log('[EnhancedDashboardApi] Using MCP unified analytics:', mcpData)
      return mcpData
    } catch (mcpError) {
      console.error('[EnhancedDashboardApi] MCP unified data unavailable:', mcpError)
      throw new Error('Real-time analytics data unavailable')
    }
  }
}

export const enhancedDashboardApi = new EnhancedDashboardApi()
export default mcpApi