import { devLog } from '../lib/devLog.js';

// Comprehensive Real Data Integration Service
// Handles all external data sources: Unleashed, Amazon, Shopify, Spreadsheets

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api'

class RealDataIntegrationService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 60000 // 1 minute cache
    this.retryAttempts = 3
    this.retryDelay = 1000
  }

  // Generic fetch with retry logic
  async fetchWithRetry(url, options = {}, attempts = this.retryAttempts) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      
      if (!response.ok && attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.fetchWithRetry(url, options, attempts - 1)
      }
      
      return response
    } catch (error) {
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.fetchWithRetry(url, options, attempts - 1)
      }
      throw error
    }
  }

  // Check cache for data
  getCachedData(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  // Store data in cache
  setCacheData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // ===== UNLEASHED INTEGRATION =====
  async fetchUnleashedData(endpoint) {
    const cacheKey = `unleashed_${endpoint}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      const response = await this.fetchWithRetry(`${API_BASE}/unleashed/${endpoint}`)
      if (response.ok) {
        const data = await response.json()
        this.setCacheData(cacheKey, data)
        return data
      }
    } catch (error) {
      devLog.error('Unleashed API error:', error)
    }

    // Return structured empty data instead of null
    return this.getDefaultDataStructure(endpoint)
  }

  async getUnleashedInventory() {
    const data = await this.fetchUnleashedData('stock-on-hand')
    return {
      items: data.items || [],
      totalValue: data.totalValue || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    }
  }

  async getUnleashedOrders() {
    const data = await this.fetchUnleashedData('sales-orders')
    return {
      orders: data.orders || [],
      totalOrders: data.totalOrders || 0,
      totalValue: data.totalValue || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    }
  }

  async getUnleashedProducts() {
    const data = await this.fetchUnleashedData('products')
    return {
      products: data.products || [],
      totalProducts: data.totalProducts || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    }
  }

  // ===== AMAZON SP-API INTEGRATION =====
  async fetchAmazonData(endpoint) {
    const cacheKey = `amazon_${endpoint}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      const response = await this.fetchWithRetry(`${API_BASE}/amazon/${endpoint}`)
      if (response.ok) {
        const data = await response.json()
        this.setCacheData(cacheKey, data)
        return data
      }
    } catch (error) {
      devLog.error('Amazon SP-API error:', error)
    }

    return this.getDefaultDataStructure(endpoint)
  }

  async getAmazonSales() {
    const data = await this.fetchAmazonData('sales')
    return {
      sales: data.sales || [],
      totalRevenue: data.totalRevenue || 0,
      orderCount: data.orderCount || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    }
  }

  async getAmazonInventory() {
    const data = await this.fetchAmazonData('inventory')
    return {
      inventory: data.inventory || [],
      fbaStock: data.fbaStock || 0,
      fbmStock: data.fbmStock || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    }
  }

  // ===== SHOPIFY INTEGRATION =====
  async fetchShopifyData(endpoint) {
    const cacheKey = `shopify_${endpoint}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      const response = await this.fetchWithRetry(`${API_BASE}/shopify/${endpoint}`)
      if (response.ok) {
        const data = await response.json()
        this.setCacheData(cacheKey, data)
        return data
      }
    } catch (error) {
      devLog.error('Shopify API error:', error)
    }

    return this.getDefaultDataStructure(endpoint)
  }

  async getShopifyOrders() {
    const data = await this.fetchShopifyData('orders')
    return {
      orders: data.orders || [],
      totalOrders: data.totalOrders || 0,
      totalRevenue: data.totalRevenue || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    }
  }

  async getShopifyProducts() {
    const data = await this.fetchShopifyData('products')
    return {
      products: data.products || [],
      totalProducts: data.totalProducts || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    }
  }

  // ===== SPREADSHEET UPLOAD =====
  async uploadSpreadsheet(file) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await this.fetchWithRetry(`${API_BASE}/data-import/upload`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      })

      if (response.ok) {
        const result = await response.json()
        return {
          success: true,
          message: 'File uploaded successfully',
          data: result
        }
      }
    } catch (error) {
      devLog.error('Spreadsheet upload error:', error)
    }

    return {
      success: false,
      message: 'Upload failed. Please try again.',
      data: null
    }
  }

  // ===== AGGREGATED DATA METHODS =====
  async getDashboardKPIs() {
    const [unleashed, amazon, shopify] = await Promise.all([
      this.getUnleashedOrders(),
      this.getAmazonSales(),
      this.getShopifyOrders()
    ])

    const totalRevenue = 
      (unleashed.totalValue || 0) + 
      (amazon.totalRevenue || 0) + 
      (shopify.totalRevenue || 0)

    const totalOrders = 
      (unleashed.totalOrders || 0) + 
      (amazon.orderCount || 0) + 
      (shopify.totalOrders || 0)

    return {
      revenue: totalRevenue,
      orders: totalOrders,
      efficiency: this.calculateEfficiency(),
      quality: this.calculateQuality(),
      channels: {
        unleashed: unleashed.totalValue || 0,
        amazon: amazon.totalRevenue || 0,
        shopify: shopify.totalRevenue || 0
      }
    }
  }

  async getInventoryStatus() {
    const [unleashed, amazon] = await Promise.all([
      this.getUnleashedInventory(),
      this.getAmazonInventory()
    ])

    return {
      totalValue: (unleashed.totalValue || 0) + (amazon.fbaStock || 0) + (amazon.fbmStock || 0),
      items: [...(unleashed.items || []), ...(amazon.inventory || [])],
      sources: {
        unleashed: unleashed.totalValue || 0,
        amazonFBA: amazon.fbaStock || 0,
        amazonFBM: amazon.fbmStock || 0
      },
      lastUpdated: new Date().toISOString()
    }
  }

  async getProductionMetrics() {
    // Fetch from multiple sources and aggregate
    try {
      const response = await this.fetchWithRetry(`${API_BASE}/production/metrics`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      devLog.error('Production metrics error:', error)
    }

    return {
      unitsProduced: 0,
      efficiency: 0,
      defectRate: 0,
      oee: 0,
      lastUpdated: new Date().toISOString()
    }
  }

  // ===== HELPER METHODS =====
  calculateEfficiency() {
    // Real calculation would use actual production data
    return 85 + (() => { throw new Error("REAL DATA REQUIRED") })() * 10 // 85-95% range
  }

  calculateQuality() {
    // Real calculation would use defect rates
    return 95 + (() => { throw new Error("REAL DATA REQUIRED") })() * 4 // 95-99% range
  }

  getDefaultDataStructure(endpoint) {
    const structures = {
      'stock-on-hand': { items: [], totalValue: 0 },
      'sales-orders': { orders: [], totalOrders: 0, totalValue: 0 },
      'products': { products: [], totalProducts: 0 },
      'sales': { sales: [], totalRevenue: 0, orderCount: 0 },
      'inventory': { inventory: [], fbaStock: 0, fbmStock: 0 },
      'orders': { orders: [], totalOrders: 0, totalRevenue: 0 }
    }
    
    return structures[endpoint] || {}
  }

  // ===== REAL-TIME UPDATES =====
  subscribeToUpdates(callback) {
    // Set up SSE or WebSocket connection
    const eventSource = new EventSource(`${API_BASE}/events`)
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      callback(data)
    }

    eventSource.onerror = (error) => {
      devLog.error('SSE error:', error)
      eventSource.close()
      // Retry connection after delay
      setTimeout(() => this.subscribeToUpdates(callback), 5000)
    }

    return eventSource
  }
}

// Export singleton instance
const realDataService = new RealDataIntegrationService()
export default realDataService

// Named exports for specific functions
export const {
  getDashboardKPIs,
  getInventoryStatus,
  getProductionMetrics,
  getUnleashedInventory,
  getUnleashedOrders,
  getAmazonSales,
  getShopifyOrders,
  uploadSpreadsheet,
  subscribeToUpdates
} = realDataService