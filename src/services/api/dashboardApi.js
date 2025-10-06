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
      // Return fallback data structure
      return {
        revenue: { monthly: 0, quarterly: 0, yearly: 0, growth: 0 },
        workingCapital: { current: 0, ratio: 0, cashFlow: 0, daysReceivable: 0 },
        production: { efficiency: 0, unitsProduced: 0, defectRate: 0, oeeScore: 0 },
        inventory: { value: 0, turnover: 0, skuCount: 0, lowStock: 0 },
        financial: { grossMargin: 0, netMargin: 0, ebitda: 0, roi: 0 },
        timestamp: new Date().toISOString(),
        dataSource: 'fallback-offline'
      }
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
      return {
        data: [],
        latest: { currentAssets: 0, currentLiabilities: 0, workingCapital: 0, ratio: 0 },
        dataSource: 'fallback-offline'
      }
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
      return {
        data: [],
        latest: { operatingCashFlow: 0, netCashFlow: 0 },
        dataSource: 'fallback-offline'
      }
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
      return {
        forecast: { horizon: 365, accuracy: 0, confidence: 0, model: 'offline', dataPoints: [] },
        aiModels: { gpt4: { status: 'offline', accuracy: 0 }, claude: { status: 'offline', accuracy: 0 } },
        timestamp: new Date().toISOString()
      }
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
      return {
        cashFlow: { current: 0, projected: 0, change: 0 },
        receivables: { current: 0, dso: 0, overdue: 0 },
        payables: { current: 0, dpo: 0, upcoming: 0 },
        inventory: { value: 0, turnover: 0, daysOnHand: 0 }
      }
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
      return []
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
      return {
        defectRate: 0,
        firstPassYield: 0,
        customerComplaints: 0,
        inspectionsPassed: 0,
        inspectionsFailed: 0
      }
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
      return {
        totalValue: 0,
        items: [],
        lowStock: 0,
        outOfStock: 0
      }
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
      return {
        nextMonth: 0,
        nextQuarter: 0,
        accuracy: 0,
        trend: 'stable',
        seasonalFactors: {}
      }
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
      return {
        revenue: { value: 0, target: 0, achievement: 0 },
        efficiency: { oee: 0, utilization: 0, productivity: 0 },
        quality: { defectRate: 0, customerSatisfaction: 0, onTimeDelivery: 0 }
      }
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