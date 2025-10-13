import apiClient from './apiClient'

// API service for product sales data
export const productSalesApi = {
  // Get product sales performance data
  async getProductSalesData(period = 'year') {
    const response = await apiClient.get('/api/sales/product-performance', { 
      params: { period } 
    })
    return response // API returns object directly, no .data wrapper
  },

  // Get product sales summary metrics
  async getProductSalesSummary(period = 'year') {
    const response = await apiClient.get('/api/sales/product-summary', { 
      params: { period } 
    })
    return response // API returns object directly, no .data wrapper
  },

  // Get top performing products
  async getTopProducts(limit = 5) {
    const response = await apiClient.get('/api/sales/top-products', { 
      params: { limit } 
    })
    return response // API returns object directly, no .data wrapper
  }
}

export default productSalesApi