/**
 * Shopify Service
 * Handles Shopify API integration for sales and product data
 */

// Node 18+ has global fetch
import { logInfo, logWarn, logError } from './observability/structuredLogger.js'

class ShopifyService {
  constructor() {
    this.apiKey = process.env.SHOPIFY_API_KEY
    this.password = process.env.SHOPIFY_PASSWORD
    this.shopName = process.env.SHOPIFY_SHOP_NAME
    this.baseUrl = `https://${this.shopName}.myshopify.com/admin/api/2023-10`
  }

  /**
   * Check if Shopify is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.password && this.shopName)
  }

  /**
   * Get orders from Shopify
   */
  async getOrders(params = {}) {
    if (!this.isConfigured()) {
      logWarn('Shopify not configured')
      return []
    }

    try {
      const queryParams = new URLSearchParams({
        limit: params.limit || 50,
        status: params.status || 'any',
        created_at_min: params.created_at_min || '',
        ...params
      })

      const response = await fetch(`${this.baseUrl}/orders.json?${queryParams}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      logInfo('Shopify orders fetched', { count: data.orders?.length || 0 })
      
      return data.orders || []

    } catch (error) {
      logError('Error fetching Shopify orders', error)
      // Return sample data for development
      return this.getSampleOrders()
    }
  }

  /**
   * Get products from Shopify
   */
  async getProducts(params = {}) {
    if (!this.isConfigured()) {
      logWarn('Shopify not configured')
      return []
    }

    try {
      const queryParams = new URLSearchParams({
        limit: params.limit || 50,
        ...params
      })

      const response = await fetch(`${this.baseUrl}/products.json?${queryParams}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      logInfo('Shopify products fetched', { count: data.products?.length || 0 })
      
      return data.products || []

    } catch (error) {
      logError('Error fetching Shopify products', error)
      return []
    }
  }

  /**
   * Sample orders for development/testing
   */
  getSampleOrders() {
    const baseDate = new Date()
    return Array.from({ length: 25 }, (_, i) => ({
      id: 1000000 + i,
      created_at: new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
      total_price: (Math.random() * 500 + 50).toFixed(2),
      total_discounts: (Math.random() * 50).toFixed(2),
      currency: 'USD',
      line_items: [{
        quantity: Math.floor(Math.random() * 5) + 1,
        price: (Math.random() * 100 + 10).toFixed(2),
        product_id: 1000 + Math.floor(Math.random() * 100)
      }],
      customer: {
        email: `customer${i}@example.com`
      }
    }))
  }

  /**
   * Get store information
   */
  async getShopInfo() {
    if (!this.isConfigured()) {
      return { status: 'not_configured' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/shop.json`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.shop

    } catch (error) {
      logError('Error fetching Shopify shop info', error)
      return { status: 'error', error: error.message }
    }
  }
}

export default new ShopifyService()