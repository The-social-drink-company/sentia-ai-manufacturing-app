import { api } from './baseApi'

/**
 * Dashboard API Service
 * Handles all dashboard-related API calls
 */
class DashboardApi {
  async getMetrics() {
    return api.get('/dashboard/metrics')
  }

  async getKPIs(timeRange = '30d') {
    return api.get('/dashboard/kpis', { timeRange })
  }

  async getRealtimeStatus() {
    return api.get('/dashboard/realtime')
  }

  async getWidgetData(widgetId) {
    return api.get(`/dashboard/widgets/${widgetId}`)
  }

  async saveLayout(layout) {
    return api.post('/dashboard/layout', { layout })
  }

  async getLayout() {
    return api.get('/dashboard/layout')
  }

  async exportData(format = 'json') {
    return api.get('/dashboard/export', { format })
  }
}

export const dashboardApi = new DashboardApi()