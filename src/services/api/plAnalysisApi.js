import apiClient from './apiClient'

// Mock P&L data generator for demonstration
const generateMockPLData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return months.map((month, index) => {
    // Generate realistic but varied data
    const baseRevenue = 1200 + (Math.sin(index * 0.5) * 200) + (Math.random() * 100)
    const seasonalFactor = 1 + (Math.sin(index * 0.5) * 0.15) // Seasonal variation
    
    const revenue = Math.round(baseRevenue * seasonalFactor)
    const grossProfit = Math.round(revenue * (0.55 + Math.random() * 0.15)) // 55-70% gross margin
    const ebitda = Math.round(revenue * (0.18 + Math.random() * 0.08)) // 18-26% EBITDA margin
    const grossMarginPercent = Number(((grossProfit / revenue) * 100).toFixed(1))
    
    return {
      month,
      revenue,
      grossProfit,
      ebitda,
      grossMarginPercent
    }
  })
}

// API service for P&L analysis data
export const plAnalysisApi = {
  // Get P&L analysis data
  async getPLAnalysis(params = {}) {
    try {
      const response = await apiClient.get('/api/financial/pl-analysis', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch P&L analysis data:', error)
      
      // Fallback to mock data if API fails
      console.log('Using mock P&L data as fallback')
      return {
        success: true,
        data: generateMockPLData(),
        timestamp: new Date().toISOString()
      }
    }
  },

  // Get P&L summary metrics
  async getPLSummary(period = 'year') {
    try {
      const response = await apiClient.get(`/api/financial/pl-summary`, { 
        params: { period } 
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch P&L summary:', error)
      
      // Return mock summary data
      const mockData = generateMockPLData()
      const totalRevenue = mockData.reduce((sum, item) => sum + item.revenue, 0)
      const totalGrossProfit = mockData.reduce((sum, item) => sum + item.grossProfit, 0)
      const totalEbitda = mockData.reduce((sum, item) => sum + item.ebitda, 0)
      
      return {
        success: true,
        data: {
          totalRevenue,
          totalGrossProfit,
          totalEbitda,
          avgGrossMargin: Number(((totalGrossProfit / totalRevenue) * 100).toFixed(1)),
          avgEbitdaMargin: Number(((totalEbitda / totalRevenue) * 100).toFixed(1)),
          period
        },
        timestamp: new Date().toISOString()
      }
    }
  },

  // Get KPI summary for dashboard
  async getKPISummary() {
    try {
      const response = await apiClient.get('/api/financial/kpi-summary')
      return response.data
    } catch (error) {
      console.error('Failed to fetch KPI summary:', error)
      
      // Return mock KPI summary data
      const mockData = generateMockPLData()
      const totalRevenue = mockData.reduce((sum, item) => sum + item.revenue, 0)
      const totalGrossProfit = mockData.reduce((sum, item) => sum + item.grossProfit, 0)
      const avgGrossMargin = Number(((totalGrossProfit / totalRevenue) * 100).toFixed(1))
      
      // Generate mock units sold data
      const totalUnitsSold = Math.round(totalRevenue / 25) // Assuming $25 average selling price
      
      return {
        success: true,
        data: {
          annualRevenue: {
            value: `$${(totalRevenue / 1000).toFixed(1)}M`,
            raw: totalRevenue,
            helper: 'Year to date'
          },
          unitsSold: {
            value: `${(totalUnitsSold / 1000).toFixed(0)}K`,
            raw: totalUnitsSold,
            helper: 'Current quarter'
          },
          grossMargin: {
            value: `${avgGrossMargin}%`,
            raw: avgGrossMargin,
            helper: 'Average margin'
          }
        },
        timestamp: new Date().toISOString()
      }
    }
  },

  // Get mock data directly (for development)
  getMockData() {
    return {
      success: true,
      data: generateMockPLData(),
      timestamp: new Date().toISOString()
    }
  }
}

export default plAnalysisApi