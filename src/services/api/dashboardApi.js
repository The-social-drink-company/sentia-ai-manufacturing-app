import { api } from './baseApi'

/**
 * Dashboard API Service
 * Handles all dashboard-related API calls - Updated to match actual backend endpoints
 */
class DashboardApi {
  /**
   * Get comprehensive dashboard summary data
   */
  async getSummary() {
    try {
      return await api.get('/dashboard/summary')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch summary:', error)
      throw error
    }
  }

  /**
   * Get working capital data
   */
  async getWorkingCapital() {
    try {
      return await api.get('/financial/working-capital')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch working capital:', error)
      throw error
    }
  }

  /**
   * Get cash flow data
   */
  async getCashFlow() {
    try {
      return await api.get('/financial/cash-flow')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch cash flow:', error)
      throw error
    }
  }

  /**
   * Get enhanced forecasting data
   */
  async getForecasting() {
    try {
      return await api.get('/forecasting/enhanced')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch forecasting:', error)
      throw error
    }
  }

  /**
   * Get working capital overview (detailed)
   */
  async getWorkingCapitalOverview() {
    try {
      return await api.get('/working-capital/overview')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch working capital overview:', error)
      throw error
    }
  }

  /**
   * Get production jobs data
   */
  async getProductionJobs() {
    try {
      return await api.get('/production/jobs')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch production jobs:', error)
      throw error
    }
  }

  /**
   * Get quality metrics
   */
  async getQualityMetrics() {
    try {
      return await api.get('/quality/metrics')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch quality metrics:', error)
      throw error
    }
  }

  /**
   * Get inventory levels
   */
  async getInventoryLevels() {
    try {
      return await api.get('/inventory/levels')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch inventory levels:', error)
      throw error
    }
  }

  /**
   * Get demand forecasting data
   */
  async getDemandForecast() {
    try {
      return await api.get('/forecasting/demand')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch demand forecast:', error)
      throw error
    }
  }

  /**
   * Get analytics KPIs
   */
  async getAnalyticsKPIs() {
    try {
      return await api.get('/analytics/kpis')
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch analytics KPIs:', error)
      throw error
    }
  }

  /**
   * Get units sold data
   */
  async getUnitsSold(timeRange = 'quarter') {
    try {
      return await api.get(`/production/units-sold`, { params: { timeRange } })
    } catch (error) {
      console.error('[DashboardAPI] Failed to fetch units sold:', error)
      throw error
    }
  }

  /**
   * Legacy methods for backward compatibility
   */
  async getMetrics() {
    return this.getSummary()
  }

  async getKPIs(timeRange = '30d') {
    return this.getAnalyticsKPIs()
  }

  async getRealtimeStatus() {
    return this.getSummary()
  }

  async getWidgetData(widgetId) {
    // Route to appropriate API based on widget type
    switch (widgetId) {
      case 'working-capital':
        return this.getWorkingCapital()
      case 'production':
        return this.getProductionJobs()
      case 'quality':
        return this.getQualityMetrics()
      case 'inventory':
        return this.getInventoryLevels()
      case 'forecasting':
        return this.getForecasting()
      default:
        return this.getSummary()
    }
  }

  async saveLayout(layout) {
    try {
      return await api.post('/dashboard/layout', { layout })
    } catch (error) {
      console.error('[DashboardAPI] Failed to save layout:', error)
      // Fallback to localStorage
      localStorage.setItem('dashboard-layout', JSON.stringify(layout))
      return { success: true, source: 'localStorage' }
    }
  }

  async getLayout() {
    try {
      return await api.get('/dashboard/layout')
    } catch (error) {
      console.error('[DashboardAPI] Failed to get layout:', error)
      // Fallback to localStorage
      const layout = localStorage.getItem('dashboard-layout')
      return layout ? JSON.parse(layout) : null
    }
  }

  async exportData(format = 'json') {
    try {
      return await api.get('/dashboard/export', { format })
    } catch (error) {
      console.error('[DashboardAPI] Failed to export data:', error)
      throw error
    }
  }
}

export const dashboardApi = new DashboardApi()