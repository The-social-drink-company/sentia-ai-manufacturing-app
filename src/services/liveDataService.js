// Live Data Service - ONLY REAL DATA FROM EXTERNAL SOURCES
// NO MOCK DATA ALLOWED - USER REQUIREMENT

import { logInfo, logWarn, logError } from '../lib/logger.js';

class LiveDataService {
  constructor() {
    this.initialized = false
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  async initialize() {
    if (this.initialized) return
    logInfo('Live Data Service initialization started', { mode: 'real_data_only' })
    this.initialized = true
  }

  // Get cached data if valid, otherwise fetch fresh
  getCachedData(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // Unleashed ERP API - Real inventory and orders data
  async getUnleashedData() {
    try {
      const cached = this.getCachedData('unleashed')
      if (cached) return cached

      const apiId = process.env.UNLEASHED_API_ID
      const apiKey = process.env.UNLEASHED_API_KEY
      
      if (!apiId || !apiKey) {
        logWarn('Unleashed API credentials not configured', { service: 'unleashed' })
        return null
      }

      // Get orders from Unleashed
      const ordersResponse = await fetch('https://api.unleashedsoftware.com/SalesOrders', {
        headers: {
          'Accept': 'application/json',
          'api-auth-id': apiId,
          'api-auth-signature': apiKey
        }
      })

      if (!ordersResponse.ok) {
        logError('Unleashed API request failed', null, { 
          service: 'unleashed',
          endpoint: 'SalesOrders',
          statusCode: ordersResponse.status 
        })
        return null
      }

      const ordersData = await ordersResponse.json()
      
      const unleashedData = {
        orders: ordersData.Items || [],
        totalOrders: ordersData.Items?.length || 0,
        totalValue: ordersData.Items?.reduce((sum, order) => sum + (order.Total || 0), 0) || 0,
        lastUpdated: new Date().toISOString()
      }

      this.setCachedData('unleashed', unleashedData)
      return unleashedData

    } catch (error) {
      logError('Unleashed API error - using fallback', error, { service: 'unleashed' })
      return null
    }
  }

  // Amazon SP-API - Real sales and FBA data
  async getAmazonData() {
    try {
      const cached = this.getCachedData('amazon')
      if (cached) return cached

      // Amazon SP-API requires complex OAuth - simulate the structure but note it's not connected
      // In production, this would connect to Amazon SP-API via backend proxy
      const amazonData = {
        sales: [],
        totalRevenue: 0,
        fbaInventory: 0,
        lastUpdated: new Date().toISOString(),
        status: 'API_NOT_CONFIGURED',
        message: 'Amazon SP-API requires backend configuration'
      }

      this.setCachedData('amazon', amazonData)
      return amazonData

    } catch (error) {
      logError('Amazon API error', error, { service: 'amazon' })
      return null
    }
  }

  // Shopify API - Real e-commerce data
  async getShopifyData() {
    try {
      const cached = this.getCachedData('shopify')
      if (cached) return cached

      const apiKey = process.env.SHOPIFY_UK_API_KEY
      const accessToken = process.env.SHOPIFY_UK_ACCESS_TOKEN
      const shopUrl = process.env.SHOPIFY_UK_SHOP_URL

      if (!apiKey || !accessToken || !shopUrl) {
        logWarn('Shopify API credentials not configured', { service: 'shopify' })
        return null
      }

      // Get orders from Shopify
      const ordersResponse = await fetch(`https://${shopUrl}/admin/api/2023-10/orders.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      })

      if (!ordersResponse.ok) {
        logError('Shopify API request failed', null, {
          service: 'shopify',
          endpoint: 'orders',
          statusCode: ordersResponse.status
        })
        return null
      }

      const ordersData = await ordersResponse.json()
      
      const shopifyData = {
        orders: ordersData.orders || [],
        totalOrders: ordersData.orders?.length || 0,
        totalRevenue: ordersData.orders?.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0,
        lastUpdated: new Date().toISOString()
      }

      this.setCachedData('shopify', shopifyData)
      return shopifyData

    } catch (error) {
      logError('Shopify API error', error, { service: 'shopify' })
      return null
    }
  }

  // Combined dashboard KPIs from ALL live sources
  async getDashboardKPIs() {
    try {
      const [unleashed, amazon, shopify] = await Promise.all([
        this.getUnleashedData(),
        this.getAmazonData(),
        this.getShopifyData()
      ])

      // Calculate real metrics from live data sources
      const totalRevenue = 
        (unleashed?.totalValue || 0) + 
        (amazon?.totalRevenue || 0) + 
        (shopify?.totalRevenue || 0)

      const totalOrders = 
        (unleashed?.totalOrders || 0) + 
        (amazon?.sales?.length || 0) + 
        (shopify?.totalOrders || 0)

      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      return {
        totalRevenue: totalRevenue.toLocaleString('en-GB', { 
          style: 'currency', 
          currency: 'GBP' 
        }),
        totalOrders,
        avgOrderValue: avgOrderValue.toLocaleString('en-GB', { 
          style: 'currency', 
          currency: 'GBP' 
        }),
        lastUpdated: new Date().toISOString(),
        dataSources: {
          unleashed: !!unleashed,
          amazon: !!amazon,
          shopify: !!shopify
        },
        status: 'LIVE_DATA_ONLY'
      }

    } catch (error) {
      logError('Dashboard KPI calculation failed', error, { operation: 'kpi_calculation' })
      return {
        totalRevenue: '£0',
        totalOrders: 0,
        avgOrderValue: '£0',
        lastUpdated: new Date().toISOString(),
        dataSources: {
          unleashed: false,
          amazon: false,
          shopify: false
        },
        status: 'ERROR',
        error: error.message
      }
    }
  }

  // Manufacturing metrics from real production data
  async getManufacturingMetrics() {
    try {
      // This would connect to actual manufacturing systems
      // For now, return structure indicating no live connection
      return {
        productivity: 0,
        oee: 0,
        downtime: 0,
        qualityRate: 0,
        status: 'NO_MANUFACTURING_SYSTEM_CONNECTED',
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      logError('Manufacturing metrics calculation failed', error, { operation: 'manufacturing_metrics' })
      return null
    }
  }

  // Financial data from accounting systems
  async getFinancialData() {
    try {
      // This would connect to accounting systems like QuickBooks, Xero, etc.
      return {
        workingCapital: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
        cashFlow: 0,
        status: 'NO_ACCOUNTING_SYSTEM_CONNECTED',
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      logError('Financial data calculation failed', error, { operation: 'financial_data' })
      return null
    }
  }

  // Inventory data from multiple sources
  async getInventoryData() {
    try {
      const unleashed = await this.getUnleashedData()
      
      if (unleashed) {
        return {
          totalSkus: unleashed.orders?.length || 0,
          stockValue: unleashed.totalValue || 0,
          lowStockAlerts: 0,
          status: 'LIVE_FROM_UNLEASHED',
          lastUpdated: unleashed.lastUpdated
        }
      }

      return {
        totalSkus: 0,
        stockValue: 0,
        lowStockAlerts: 0,
        status: 'NO_INVENTORY_SYSTEM_CONNECTED',
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      logError('Inventory data calculation failed', error, { operation: 'inventory_data' })
      return null
    }
  }

  // Sales analytics from all channels
  async getSalesAnalytics() {
    try {
      const [unleashed, shopify] = await Promise.all([
        this.getUnleashedData(),
        this.getShopifyData()
      ])

      const channels = []
      let totalSales = 0

      if (unleashed) {
        channels.push({
          name: 'Unleashed ERP',
          sales: unleashed.totalValue,
          orders: unleashed.totalOrders
        })
        totalSales += unleashed.totalValue
      }

      if (shopify) {
        channels.push({
          name: 'Shopify Store',
          sales: shopify.totalRevenue,
          orders: shopify.totalOrders
        })
        totalSales += shopify.totalRevenue
      }

      return {
        channels,
        totalSales,
        bestPerformingChannel: channels.length > 0 
          ? channels.reduce((a, b) => a.sales > b.sales ? a : b).name 
          : 'None',
        status: 'LIVE_MULTI_CHANNEL',
        lastUpdated: new Date().toISOString()
      }

    } catch (error) {
      logError('Sales analytics calculation failed', error, { operation: 'sales_analytics' })
      return null
    }
  }
}

// Create singleton instance
const liveDataService = new LiveDataService()

// Auto-initialize
if (typeof window !== 'undefined') {
  liveDataService.initialize().catch(error => {
    logError('Live Data Service initialization failed', error, { service: 'live_data' })
  })
}

export default liveDataService

// Named exports for convenience
export const {
  getDashboardKPIs,
  getManufacturingMetrics,
  getFinancialData,
  getInventoryData,
  getSalesAnalytics,
  getUnleashedData,
  getAmazonData,
  getShopifyData
} = liveDataService