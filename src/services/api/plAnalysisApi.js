import apiClient from './apiClient'

// API service for P&L analysis data
export const plAnalysisApi = {
  // Get P&L analysis data
  async getPLAnalysis(params = {}) {
    const response = await apiClient.get('/api/financial/pl-analysis', { params })
    return response.data
  },

  // Get P&L summary metrics
  async getPLSummary(period = 'year') {
    const response = await apiClient.get(`/api/financial/pl-summary`, { 
      params: { period } 
    })
    return response.data
  },

  // Get KPI summary for dashboard
  async getKPISummary() {
    const response = await apiClient.get('/api/financial/kpi-summary')
    return response.data
  }
}

export default plAnalysisApi