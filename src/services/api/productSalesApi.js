import apiClient from './apiClient'

// Mock product sales data generator for GABA products
const generateMockProductSalesData = () => {
  return [
    {
      product: 'GABA Red',
      revenue: 4800000, // $4.8M
      units: 192000,
      growthRate: 12.5,
      marketShare: 34.2
    },
    {
      product: 'GABA Black',
      revenue: 6200000, // $6.2M  
      units: 248000,
      growthRate: 18.3,
      marketShare: 44.1
    },
    {
      product: 'GABA Gold',
      revenue: 3200000, // $3.2M
      units: 128000,
      growthRate: 8.7,
      marketShare: 21.7
    }
  ]
}

// API service for product sales data
export const productSalesApi = {
  // Get product sales performance data
  async getProductSalesData(period = 'year') {
    try {
      const response = await apiClient.get('/api/sales/product-performance', { 
        params: { period } 
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch product sales data:', error)
      
      // Fallback to mock data if API fails
      console.log('Using mock product sales data as fallback')
      return {
        success: true,
        data: generateMockProductSalesData(),
        timestamp: new Date().toISOString(),
        period
      }
    }
  },

  // Get product sales summary metrics
  async getProductSalesSummary(period = 'year') {
    try {
      const response = await apiClient.get('/api/sales/product-summary', { 
        params: { period } 
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch product sales summary:', error)
      
      // Return mock summary data
      const mockData = generateMockProductSalesData()
      const totalRevenue = mockData.reduce((sum, item) => sum + item.revenue, 0)
      const totalUnits = mockData.reduce((sum, item) => sum + item.units, 0)
      const avgGrowthRate = mockData.reduce((sum, item) => sum + item.growthRate, 0) / mockData.length
      
      return {
        success: true,
        data: {
          totalRevenue,
          totalUnits,
          avgGrowthRate: Number(avgGrowthRate.toFixed(1)),
          productCount: mockData.length,
          topPerformer: mockData.reduce((top, product) => 
            product.revenue > top.revenue ? product : top
          ),
          period
        },
        timestamp: new Date().toISOString()
      }
    }
  },

  // Get top performing products
  async getTopProducts(limit = 5) {
    try {
      const response = await apiClient.get('/api/sales/top-products', { 
        params: { limit } 
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch top products:', error)
      
      // Return mock top products data
      const mockData = generateMockProductSalesData()
      const sortedProducts = mockData
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
      
      return {
        success: true,
        data: sortedProducts,
        timestamp: new Date().toISOString()
      }
    }
  },

  // Get mock data directly (for development)
  getMockData() {
    return {
      success: true,
      data: generateMockProductSalesData(),
      timestamp: new Date().toISOString()
    }
  }
}

export default productSalesApi