import { api } from './baseApi'

/**
 * Working Capital API Service
 * Handles financial and working capital related API calls
 */
class WorkingCapitalApi {
  async getCashFlow(params = {}) {
    return api.get('/working-capital/cash-flow', params)
  }

  async getReceivables() {
    return api.get('/working-capital/receivables')
  }

  async getPayables() {
    return api.get('/working-capital/payables')
  }

  async getInventoryMetrics() {
    return api.get('/working-capital/inventory')
  }

  async getCashConversionCycle() {
    return api.get('/working-capital/cash-conversion')
  }

  async getForecasts(horizon = '90d') {
    return api.get('/working-capital/forecasts', { horizon })
  }

  async runScenarioAnalysis(scenario) {
    return api.post('/working-capital/scenarios', scenario)
  }

  async getHistoricalData(startDate, endDate) {
    return api.get('/working-capital/historical', { startDate, endDate })
  }
}

export const workingCapitalApi = new WorkingCapitalApi()