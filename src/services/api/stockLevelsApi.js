import apiClient from './apiClient'

// Mock stock levels data for GABA products
const generateMockStockData = () => {
  return [
    {
      product: 'GABA Red',
      sku: 'GABA-RED-001',
      currentStock: 1250,
      reorderLevel: 500,
      maxStock: 2000,
      unit: 'bottles',
      status: 'in-stock',
      lastUpdated: new Date().toISOString()
    },
    {
      product: 'GABA Black',
      sku: 'GABA-BLACK-001',
      currentStock: 890,
      reorderLevel: 800,
      maxStock: 1800,
      unit: 'bottles',
      status: 'low-stock',
      lastUpdated: new Date().toISOString()
    },
    {
      product: 'GABA Gold',
      sku: 'GABA-GOLD-001',
      currentStock: 2100,
      reorderLevel: 600,
      maxStock: 2500,
      unit: 'bottles',
      status: 'in-stock',
      lastUpdated: new Date().toISOString()
    }
  ]
}

// API service for stock levels data
class StockLevelsApi {
  /**
   * Get current stock levels for GABA products
   */
  async getGABAStockLevels() {
    try {
      // Try to fetch from API
      const response = await apiClient.get('/inventory/levels', {
        params: {
          category: 'GABA',
          limit: 10
        }
      })

      // Transform API response to match our chart format
      if (response.data && response.data.items) {
        return response.data.items.map(item => ({
          product: item.name || item.sku,
          sku: item.sku,
          currentStock: item.quantity,
          reorderLevel: item.reorderPoint,
          maxStock: item.reorderPoint * 4, // Estimate max based on reorder point
          unit: item.unit,
          status: item.status,
          lastUpdated: item.updatedAt
        }))
      }

      // Return mock data if API doesn't return expected format
      return generateMockStockData()
    } catch (error) {
      console.warn('[StockLevelsAPI] Failed to fetch from API, using mock data:', error.message)
      // Return mock data if API call fails
      return generateMockStockData()
    }
  }

  /**
   * Get stock status summary
   */
  async getStockSummary() {
    try {
      const stockData = await this.getGABAStockLevels()
      
      return {
        totalProducts: stockData.length,
        inStock: stockData.filter(item => item.status === 'in-stock').length,
        lowStock: stockData.filter(item => item.status === 'low-stock').length,
        outOfStock: stockData.filter(item => item.status === 'out-of-stock').length,
        totalValue: stockData.reduce((sum, item) => sum + (item.currentStock * 25), 0), // Assume $25 per bottle
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('[StockLevelsAPI] Failed to get stock summary:', error)
      return {
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0,
        lastUpdated: new Date().toISOString()
      }
    }
  }
}

// Export singleton instance
const stockLevelsApi = new StockLevelsApi()
export default stockLevelsApi