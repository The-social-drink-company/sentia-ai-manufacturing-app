import apiClient from './apiClient'


// API service for stock levels data
class StockLevelsApi {
  /**
   * Get current stock levels for GABA products
   */
  async getGABAStockLevels() {
    const response = await apiClient.get('/api/inventory/levels', {
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

    return []
  }

  /**
   * Get stock status summary
   */
  async getStockSummary() {
    const stockData = await this.getGABAStockLevels()
    
    return {
      totalProducts: stockData.length,
      inStock: stockData.filter(item => item.status === 'in-stock').length,
      lowStock: stockData.filter(item => item.status === 'low-stock').length,
      outOfStock: stockData.filter(item => item.status === 'out-of-stock').length,
      totalValue: stockData.reduce((sum, item) => sum + (item.currentStock * 25), 0), // Assume $25 per bottle
      lastUpdated: new Date().toISOString()
    }
  }
}

// Export singleton instance
const stockLevelsApi = new StockLevelsApi()
export default stockLevelsApi