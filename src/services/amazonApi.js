import { devLog } from '../lib/devLog.js';
import axios from 'axios'

// Amazon SP-API integration service
class AmazonSPAPIService {
  constructor() {
    this.baseURL = 'https://sellingpartnerapi-eu.amazon.com'
    this.clientId = process.env.AMAZON_SP_API_CLIENT_ID || process.env.VITE_AMAZON_SP_API_CLIENT_ID
    this.clientSecret = process.env.AMAZON_SP_API_CLIENT_SECRET || process.env.VITE_AMAZON_SP_API_CLIENT_SECRET
    this.refreshToken = process.env.AMAZON_SP_API_REFRESH_TOKEN || process.env.VITE_AMAZON_SP_API_REFRESH_TOKEN
    this.marketplaceId = process.env.AMAZON_UK_MARKETPLACE_ID || process.env.VITE_AMAZON_UK_MARKETPLACE_ID || null
    
    // Access token cache
    this.accessToken = null
    this.tokenExpiry = null
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    })
  }

  // Get LWA (Login with Amazon) access token
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await axios.post('https://api.amazon.com/auth/o2/token', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      this.accessToken = response.data.access_token
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000)
      
      return this.accessToken
    } catch (error) {
      devLog.error('Failed to get Amazon access token:', error)
      throw new Error('Amazon API authentication failed')
    }
  }

  // Get authenticated headers for SP-API requests
  async getAuthHeaders() {
    const accessToken = await this.getAccessToken()
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json'
    }
  }

  // Get orders for demand analysis
  async getOrders(params = {}) {
    try {
      const headers = await this.getAuthHeaders()
      
      const queryParams = {
        MarketplaceIds: params.marketplaceIds || [this.marketplaceId],
        CreatedAfter: params.createdAfter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        CreatedBefore: params.createdBefore || new Date().toISOString(),
        OrderStatuses: params.orderStatuses || ['Shipped', 'Delivered'],
        MaxResultsPerPage: params.maxResults ?? 100
      }

      const response = await this.client.get('/orders/v0/orders', {
        headers,
        params: queryParams
      })

      return {
        success: true,
        data: response.data,
        pagination: response.data.payload?.NextToken ? { nextToken: response.data.payload.NextToken } : null
      }
    } catch (error) {
      devLog.error('Amazon SP-API orders error:', error)
      return {
        success: false,
        error: this.handleApiError(error),
        data: null
      }
    }
  }

  // Get order items for detailed demand analysis
  async getOrderItems(orderId) {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await this.client.get(`/orders/v0/orders/${orderId}/orderItems`, {
        headers
      })

      return {
        success: true,
        data: response.data.payload?.OrderItems || []
      }
    } catch (error) {
      devLog.error('Amazon SP-API order items error:', error)
      return {
        success: false,
        error: this.handleApiError(error),
        data: []
      }
    }
  }

  // Get sales metrics for dashboard KPIs
  async getSalesMetrics(params = {}) {
    try {
      const headers = await this.getAuthHeaders()
      
      const granularity = params.granularity || null
      const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const endDate = params.endDate || new Date().toISOString().split('T')[0]

      const response = await this.client.get('/sales/v1/orderMetrics', {
        headers,
        params: {
          marketplaceIds: [this.marketplaceId],
          interval: `${startDate}T00:00:00Z--${endDate}T23:59:59Z`,
          granularityTimeZone: 'UTC',
          granularity,
          asin: params.asin || undefined,
          sku: params.sku || undefined
        }
      })

      return {
        success: true,
        data: response.data.payload || []
      }
    } catch (error) {
      devLog.error('Amazon SP-API sales metrics error:', error)
      return {
        success: false,
        error: this.handleApiError(error),
        data: []
      }
    }
  }

  // Get inventory levels for stock optimization
  async getInventoryLevels() {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await this.client.get('/fba/inventory/v1/summaries', {
        headers,
        params: {
          details: true,
          granularityType: 'Marketplace',
          granularityId: this.marketplaceId,
          marketplaceIds: [this.marketplaceId]
        }
      })

      return {
        success: true,
        data: response.data.payload?.inventorySummaries || []
      }
    } catch (error) {
      devLog.error('Amazon SP-API inventory error:', error)
      return {
        success: false,
        error: this.handleApiError(error),
        data: []
      }
    }
  }

  // Transform Amazon orders data for demand forecasting
  async transformOrdersForForecasting(days = 90) {
    const ordersResult = await this.getOrders({
      createdAfter: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    })

    if (!ordersResult.success) {
      return { success: false, error: ordersResult.error }
    }

    const orders = ordersResult.data.payload?.Orders || []
    const demandData = {}

    // Process each order to extract demand patterns
    for (const order of orders) {
      const orderDate = new Date(order.PurchaseDate).toISOString().split('T')[0]
      const orderItemsResult = await this.getOrderItems(order.AmazonOrderId)
      
      if (orderItemsResult.success) {
        for (const item of orderItemsResult.data) {
          const sku = item.ASIN || item.SellerSKU
          
          if (!demandData[sku]) {
            demandData[sku] = {
              sku,
              productName: item.Title,
              dailyDemand: {},
              totalQuantity: 0,
              totalRevenue: 0,
              averagePrice: 0
            }
          }

          const quantity = parseInt(item.QuantityOrdered) || 0
          const price = parseFloat(item.ItemPrice?.Amount || 0)

          if (!demandData[sku].dailyDemand[orderDate]) {
            demandData[sku].dailyDemand[orderDate] = 0
          }

          demandData[sku].dailyDemand[orderDate] += quantity
          demandData[sku].totalQuantity += quantity
          demandData[sku].totalRevenue += price
        }
      }
    }

    // Calculate average prices and format data
    Object.values(demandData).forEach(product => {
      product.averagePrice = product.totalQuantity > 0 ? 
        product.totalRevenue / product.totalQuantity : 0
    })

    return {
      success: true,
      data: demandData,
      summary: {
        totalProducts: Object.keys(demandData).length,
        totalOrders: orders.length,
        dateRange: { days, startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      }
    }
  }

  // Generate KPIs from Amazon data
  async generateAmazonKPIs() {
    try {
      const [ordersResult, inventoryResult] = await Promise.all([
        this.getOrders({ 
          createdAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() 
        }),
        this.getInventoryLevels()
      ])

      const orders = ordersResult.success ? (ordersResult.data.payload?.Orders || []) : []
      const inventory = inventoryResult.success ? inventoryResult.data : []

      // Calculate KPIs
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => {
        const amount = parseFloat(order.OrderTotal?.Amount || 0)
        return sum + amount
      }, 0)

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      
      const inventoryValue = inventory.reduce((sum, item) => {
        const quantity = item.totalQuantity || 0
        const price = parseFloat(item.lastUpdatedTime || 0) // Placeholder for actual price
        return sum + (quantity * price)
      }, 0)

      const stockLevels = inventory.length
      const lowStockItems = inventory.filter(item => 
        (item.totalQuantity || 0) < (item.reservedQuantity || 0) * 2
      ).length

      return {
        success: true,
        data: {
          amazonOrders: {
            value: totalOrders,
            change: 0, // REAL DATA REQUIRED: Must calculate from historical comparison
            changeType: 'unknown', // REAL DATA REQUIRED: Must determine from actual trend,
            status: 'good',
            trustLevel: 'excellent',
            freshness: 'fresh',
            lastUpdated: new Date().toISOString()
          },
          amazonRevenue: {
            value: Math.round(totalRevenue * 100) / 100,
            change: 0, // REAL DATA REQUIRED: Must calculate from historical revenue
            changeType: 'unknown', // REAL DATA REQUIRED: Must determine from actual trend,
            status: 'good',
            trustLevel: 'excellent',
            freshness: 'fresh',
            lastUpdated: new Date().toISOString()
          },
          averageOrderValue: {
            value: Math.round(averageOrderValue * 100) / 100,
            change: 0, // REAL DATA REQUIRED: Must calculate from historical AOV
            changeType: 'unknown', // REAL DATA REQUIRED: Must determine from actual trend,
            status: 'good',
            trustLevel: 'good',
            freshness: 'fresh',
            lastUpdated: new Date().toISOString()
          },
          inventoryItems: {
            value: stockLevels,
            change: 0, // REAL DATA REQUIRED: Must calculate from inventory history
            changeType: 'unknown', // REAL DATA REQUIRED: Must determine from actual trend,
            status: lowStockItems > stockLevels * 0.2 ? 'warning' : 'good',
            trustLevel: 'good',
            freshness: 'recent',
            lastUpdated: new Date().toISOString()
          }
        }
      }
    } catch (error) {
      devLog.error('Error generating Amazon KPIs:', error)
      return {
        success: false,
        error: error.message,
        data: {}
      }
    }
  }

  // Handle API errors consistently
  handleApiError(error) {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      switch (status) {
        case 401:
          return 'Amazon API authentication failed. Please check credentials.'
        case 403:
          return 'Access forbidden. Please verify API permissions.'
        case 429:
          return 'Amazon API rate limit exceeded. Please try again later.'
        case 400:
          return `Bad request: ${data.errors?.[0]?.message || null}`
        default:
          return `Amazon API error (${status}): ${data.errors?.[0]?.message || error.message}`
      }
    } else if (error.request) {
      return 'Network error: Unable to reach Amazon API'
    } else {
      return `Request setup error: ${error.message}`
    }
  }

  // Check if API is configured
  isConfigured() {
    return !!(this.clientId && this.clientSecret && this.refreshToken)
  }
}

// Singleton instance
export const amazonSPAPI = new AmazonSPAPIService()

// Export for testing
export { AmazonSPAPIService }

// Utility functions for working with Amazon data
export const amazonUtils = {
  // Format currency from Amazon API
  formatCurrency: (amount, currencyCode = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode
    }).format(amount)
  },

  // Parse Amazon date format
  parseAmazonDate: (dateString) => {
    return new Date(dateString)
  },

  // Generate SKU from ASIN for internal tracking
  generateInternalSKU: (asin, marketplace = 'UK') => {
    return `${marketplace}-AMAZON-${asin}`
  },

  // Calculate demand velocity from historical data
  calculateDemandVelocity: (dailyDemand) => {
    const values = Object.values(dailyDemand)
    if (values.length === 0) return 0
    
    const total = values.reduce((sum, val) => sum + val, 0)
    return total / values.length // Average daily demand
  },

  // Detect seasonality patterns
  detectSeasonality: (dailyDemand) => {
    const entries = Object.entries(dailyDemand).sort()
    if (entries.length < 7) return { hasPattern: false }

    // Simple weekly pattern detection
    const weeklyAvg = {}
    entries.forEach(([date, quantity]) => {
      const dayOfWeek = new Date(date).getDay()
      if (!weeklyAvg[dayOfWeek]) weeklyAvg[dayOfWeek] = []
      weeklyAvg[dayOfWeek].push(quantity)
    })

    const weeklyPattern = Object.keys(weeklyAvg).map(day => {
      const values = weeklyAvg[day]
      return values.reduce((sum, val) => sum + val, 0) / values.length
    })

    const avgDemand = weeklyPattern.reduce((sum, val) => sum + val, 0) / weeklyPattern.length
    const variance = weeklyPattern.reduce((sum, val) => sum + Math.pow(val - avgDemand, 2), 0) / weeklyPattern.length
    const stdDev = Math.sqrt(variance)

    return {
      hasPattern: stdDev > avgDemand * 0.3, // Significant variance indicates seasonality
      weeklyPattern,
      peakDay: weeklyPattern.indexOf(Math.max(...weeklyPattern)),
      lowDay: weeklyPattern.indexOf(Math.min(...weeklyPattern)),
      strength: stdDev / avgDemand
    }
  }
}
