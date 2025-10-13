import apiClient from './apiClient'

class RegionalPerformanceApi {
  async getRegionalPerformance() {
    try {
      const response = await apiClient.get('/api/regional/performance')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Failed to fetch regional performance data:', error)
      throw error
    }
  }

  async getRegionalMetrics(region) {
    try {
      const response = await apiClient.get(`/api/regional/performance/${region}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error(`Failed to fetch metrics for region ${region}:`, error)
      throw error
    }
  }
}

export default new RegionalPerformanceApi()