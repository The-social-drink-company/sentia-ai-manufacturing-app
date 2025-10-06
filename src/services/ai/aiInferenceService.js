/**
 * AI Inference Service
 * Connects to MCP server for AI-powered manufacturing insights
 */

import { getApiBaseUrl } from '../api/baseApi.js'

class AIInferenceService {
  constructor() {
    this.mcpServerUrl = import.meta.env.VITE_MCP_SERVER_URL || 'https://sentia-mcp-production.onrender.com'
    this.apiBaseUrl = getApiBaseUrl()
  }

  /**
   * Send a query to the AI assistant
   * @param {Object} params - Query parameters
   * @param {string} params.message - User message
   * @param {Object} params.context - Optional context snapshot
   * @param {string} params.conversationId - Optional conversation ID
   * @returns {Promise<Object>} AI response
   */
  async assistantQuery({ message, context, conversationId }) {
    try {
      console.log('[AI Service] Sending query to MCP server:', { message, context, conversationId })

      // Try MCP server first
      const response = await this.queryMCPServer({ message, context, conversationId })

      if (response) {
        console.log('[AI Service] MCP server response received')
        return response
      }

      // Fallback to local API
      console.log('[AI Service] Falling back to local API')
      return await this.queryLocalAPI({ message, context, conversationId })

    } catch (error) {
      console.error('[AI Service] Query failed:', error)

      // Return a graceful fallback response
      return {
        messageId: this.generateId(),
        conversationId: conversationId || this.generateId(),
        content: `I understand you're asking about "${message}". While I'm currently working on connecting to our AI systems, I can help you navigate the dashboard or explain our manufacturing analytics features. Try asking about production metrics, working capital analysis, or demand forecasting.`,
        citations: [],
        chartSpec: null
      }
    }
  }

  /**
   * Query the MCP server directly
   */
  async queryMCPServer({ message, context, conversationId }) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            ...context,
            dashboard: 'manufacturing',
            timestamp: new Date().toISOString()
          },
          conversationId
        })
      })

      if (!response.ok) {
        throw new Error(`MCP server error: ${response.status}`)
      }

      const data = await response.json()
      return {
        messageId: data.messageId || this.generateId(),
        conversationId: data.conversationId || conversationId || this.generateId(),
        content: data.content || data.response,
        citations: data.citations || [],
        chartSpec: data.chartSpec || null
      }

    } catch (error) {
      console.warn('[AI Service] MCP server unavailable:', error.message)
      return null
    }
  }

  /**
   * Query the local API as fallback
   */
  async queryLocalAPI({ message, context, conversationId }) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          conversationId
        })
      })

      if (!response.ok) {
        throw new Error(`Local API error: ${response.status}`)
      }

      const data = await response.json()
      return {
        messageId: data.messageId || this.generateId(),
        conversationId: data.conversationId || conversationId || this.generateId(),
        content: data.content || data.response,
        citations: data.citations || [],
        chartSpec: data.chartSpec || null
      }

    } catch (error) {
      console.warn('[AI Service] Local API unavailable:', error.message)
      throw error
    }
  }

  /**
   * Generate a unique ID
   */
  generateId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  /**
   * Get manufacturing insights based on context
   */
  async getManufacturingInsights(context = {}) {
    return this.assistantQuery({
      message: 'Provide insights on current manufacturing performance',
      context: {
        ...context,
        type: 'manufacturing_insights',
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Analyze production trends
   */
  async analyzeProductionTrends(timeRange = '7d') {
    return this.assistantQuery({
      message: `Analyze production trends for the last ${timeRange}`,
      context: {
        type: 'production_analysis',
        timeRange,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Get working capital recommendations
   */
  async getWorkingCapitalRecommendations(financialData = {}) {
    return this.assistantQuery({
      message: 'Provide working capital optimization recommendations',
      context: {
        type: 'financial_analysis',
        data: financialData,
        timestamp: new Date().toISOString()
      }
    })
  }
}

// Export singleton instance
export const aiInferenceService = new AIInferenceService()
export default aiInferenceService