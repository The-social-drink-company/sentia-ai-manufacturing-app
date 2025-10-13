import { api } from './baseApi'

/**
 * Working Capital API Service
 * Uses real backend endpoints only – no mock data.
 */
class WorkingCapitalApi {
  async getWorkingCapital(period) {
    return api.get('/financial/working-capital', period ? { period } : {})
  }

  async getCashFlow() {
    return api.get('/financial/cash-flow')
  }

  async getFinancialMetrics() {
    return api.get('/financial/metrics')
  }

  async getDashboardSummary() {
    return api.get('/dashboard/summary')
  }

  async getMcpStatus() {
    return api.get('/mcp/status')
  }

  async requestAiInsights(payload) {
    return api.post('/ai/insights', payload)
  }

  async getWorkingCapitalSummary(params) {
    // Use the working capital endpoint that exists and returns integration status
    return api.get('/financial/working-capital', params)
  }
}

export default new WorkingCapitalApi()
