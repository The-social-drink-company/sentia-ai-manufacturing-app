/**
 * Shopify Integration Service
 * Enterprise-grade e-commerce platform integration
 * Part of Phase 3.1: E-commerce Platform Integration
 */

import crypto from 'crypto'

class ShopifyIntegration {
  constructor(config = {}) {
    this.stores = {
      uk: {
        domain: config.UK_STORE_DOMAIN || process.env.SHOPIFY_UK_STORE_DOMAIN,
        accessToken: config.UK_ACCESS_TOKEN || process.env.SHOPIFY_UK_ACCESS_TOKEN,
        apiKey: config.UK_API_KEY || process.env.SHOPIFY_UK_API_KEY,
        apiSecret: config.UK_API_SECRET || process.env.SHOPIFY_UK_API_SECRET,
        webhookSecret: config.UK_WEBHOOK_SECRET || process.env.SHOPIFY_UK_WEBHOOK_SECRET,
        region: 'UK',
        currency: 'GBP',
        timezone: 'Europe/London',
      },
      usa: {
        domain: config.USA_STORE_DOMAIN || process.env.SHOPIFY_USA_STORE_DOMAIN,
        accessToken: config.USA_ACCESS_TOKEN || process.env.SHOPIFY_USA_ACCESS_TOKEN,
        apiKey: config.USA_API_KEY || process.env.SHOPIFY_USA_API_KEY,
        apiSecret: config.USA_API_SECRET || process.env.SHOPIFY_USA_API_SECRET,
        webhookSecret: config.USA_WEBHOOK_SECRET || process.env.SHOPIFY_USA_WEBHOOK_SECRET,
        region: 'USA',
        currency: 'USD',
        timezone: 'America/New_York',
      },
    }

    this.apiVersion = '2024-10'
    this.rateLimits = {
      uk: { remaining: 40, resetTime: Date.now() + 1000 },
      usa: { remaining: 40, resetTime: Date.now() + 1000 },
    }
  }

  /**
   * Verify webhook authenticity
   */
  verifyWebhook(body, signature, store = 'uk') {
    const webhookSecret = this.stores[store].webhookSecret
    if (!webhookSecret) return false

    const hmac = crypto.createHmac('sha256', webhookSecret).update(body, 'utf8').digest('base64')

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac))
  }

  /**
   * Make authenticated API request to Shopify
   */
  async makeRequest(store, endpoint, options = {}) {
    const storeConfig = this.stores[store]
    if (!storeConfig?.domain || !storeConfig?.accessToken) {
      throw new Error(`Shopify ${store.toUpperCase()} store not configured`)
    }

    // Check rate limits
    if (this.rateLimits[store].remaining <= 0 && Date.now() < this.rateLimits[store].resetTime) {
      const waitTime = this.rateLimits[store].resetTime - Date.now()
      throw new Error(`Rate limit exceeded for ${store} store. Wait ${waitTime}ms`)
    }

    const url = `https://${storeConfig.domain}.myshopify.com/admin/api/${this.apiVersion}/${endpoint}`

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'X-Shopify-Access-Token': storeConfig.accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    // Update rate limits from headers
    const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit')
    if (callLimit) {
      const [current, max] = callLimit.split('/').map(Number)
      this.rateLimits[store].remaining = max - current
      this.rateLimits[store].resetTime = Date.now() + 1000 // Reset every second
    }

    if (!response.ok) {
      throw new Error(`Shopify API error (${response.status}): ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get orders from both stores
   */
  async getOrders(options = {}) {
    const {
      limit = 50,
      status = 'any',
      since_id,
      created_at_min,
      created_at_max,
      financial_status,
      fulfillment_status,
    } = options

    const params = new URLSearchParams({
      limit: Math.min(limit, 250).toString(),
      status,
      ...(since_id && { since_id }),
      ...(created_at_min && { created_at_min }),
      ...(created_at_max && { created_at_max }),
      ...(financial_status && { financial_status }),
      ...(fulfillment_status && { fulfillment_status }),
    })

    try {
      const [ukOrders, usaOrders] = await Promise.allSettled([
        this.makeRequest('uk', `orders.json?${params}`),
        this.makeRequest('usa', `orders.json?${params}`),
      ])

      const result = {
        uk: {
          success: ukOrders.status === 'fulfilled',
          orders: ukOrders.status === 'fulfilled' ? ukOrders.value.orders : [],
          error: ukOrders.status === 'rejected' ? ukOrders.reason.message : null,
        },
        usa: {
          success: usaOrders.status === 'fulfilled',
          orders: usaOrders.status === 'fulfilled' ? usaOrders.value.orders : [],
          error: usaOrders.status === 'rejected' ? usaOrders.reason.message : null,
        },
      }

      // Combine and enrich orders with regional data
      const allOrders = [
        ...result.uk.orders.map(order => ({ ...order, region: 'UK', currency: 'GBP' })),
        ...result.usa.orders.map(order => ({ ...order, region: 'USA', currency: 'USD' })),
      ]

      return {
        success: true,
        totalOrders: allOrders.length,
        orders: allOrders,
        breakdown: {
          uk: { count: result.uk.orders.length, error: result.uk.error },
          usa: { count: result.usa.orders.length, error: result.usa.error },
        },
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        orders: [],
        breakdown: { uk: { count: 0 }, usa: { count: 0 } },
      }
    }
  }

  /**
   * Get products from both stores
   */
  async getProducts(options = {}) {
    const { limit = 50, since_id, vendor, product_type, handle } = options

    const params = new URLSearchParams({
      limit: Math.min(limit, 250).toString(),
      ...(since_id && { since_id }),
      ...(vendor && { vendor }),
      ...(product_type && { product_type }),
      ...(handle && { handle }),
    })

    try {
      const [ukProducts, usaProducts] = await Promise.allSettled([
        this.makeRequest('uk', `products.json?${params}`),
        this.makeRequest('usa', `products.json?${params}`),
      ])

      const result = {
        uk: {
          success: ukProducts.status === 'fulfilled',
          products: ukProducts.status === 'fulfilled' ? ukProducts.value.products : [],
          error: ukProducts.status === 'rejected' ? ukProducts.reason.message : null,
        },
        usa: {
          success: usaProducts.status === 'fulfilled',
          products: usaProducts.status === 'fulfilled' ? usaProducts.value.products : [],
          error: usaProducts.status === 'rejected' ? usaProducts.reason.message : null,
        },
      }

      const allProducts = [
        ...result.uk.products.map(product => ({ ...product, region: 'UK' })),
        ...result.usa.products.map(product => ({ ...product, region: 'USA' })),
      ]

      return {
        success: true,
        totalProducts: allProducts.length,
        products: allProducts,
        breakdown: {
          uk: { count: result.uk.products.length, error: result.uk.error },
          usa: { count: result.usa.products.length, error: result.usa.error },
        },
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        products: [],
        breakdown: { uk: { count: 0 }, usa: { count: 0 } },
      }
    }
  }

  /**
   * Get customers from both stores
   */
  async getCustomers(options = {}) {
    const { limit = 50, since_id, created_at_min, created_at_max } = options

    const params = new URLSearchParams({
      limit: Math.min(limit, 250).toString(),
      ...(since_id && { since_id }),
      ...(created_at_min && { created_at_min }),
      ...(created_at_max && { created_at_max }),
    })

    try {
      const [ukCustomers, usaCustomers] = await Promise.allSettled([
        this.makeRequest('uk', `customers.json?${params}`),
        this.makeRequest('usa', `customers.json?${params}`),
      ])

      const result = {
        uk: {
          success: ukCustomers.status === 'fulfilled',
          customers: ukCustomers.status === 'fulfilled' ? ukCustomers.value.customers : [],
          error: ukCustomers.status === 'rejected' ? ukCustomers.reason.message : null,
        },
        usa: {
          success: usaCustomers.status === 'fulfilled',
          customers: usaCustomers.status === 'fulfilled' ? usaCustomers.value.customers : [],
          error: usaCustomers.status === 'rejected' ? usaCustomers.reason.message : null,
        },
      }

      const allCustomers = [
        ...result.uk.customers.map(customer => ({ ...customer, region: 'UK' })),
        ...result.usa.customers.map(customer => ({ ...customer, region: 'USA' })),
      ]

      return {
        success: true,
        totalCustomers: allCustomers.length,
        customers: allCustomers,
        breakdown: {
          uk: { count: result.uk.customers.length, error: result.uk.error },
          usa: { count: result.usa.customers.length, error: result.usa.error },
        },
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        customers: [],
        breakdown: { uk: { count: 0 }, usa: { count: 0 } },
      }
    }
  }

  /**
   * Get inventory levels from both stores
   */
  async getInventoryLevels(options = {}) {
    const { location_ids, inventory_item_ids, limit = 50 } = options

    const params = new URLSearchParams({
      limit: Math.min(limit, 250).toString(),
      ...(location_ids && { location_ids: location_ids.join(',') }),
      ...(inventory_item_ids && { inventory_item_ids: inventory_item_ids.join(',') }),
    })

    try {
      const [ukInventory, usaInventory] = await Promise.allSettled([
        this.makeRequest('uk', `inventory_levels.json?${params}`),
        this.makeRequest('usa', `inventory_levels.json?${params}`),
      ])

      const result = {
        uk: {
          success: ukInventory.status === 'fulfilled',
          levels: ukInventory.status === 'fulfilled' ? ukInventory.value.inventory_levels : [],
          error: ukInventory.status === 'rejected' ? ukInventory.reason.message : null,
        },
        usa: {
          success: usaInventory.status === 'fulfilled',
          levels: usaInventory.status === 'fulfilled' ? usaInventory.value.inventory_levels : [],
          error: usaInventory.status === 'rejected' ? usaInventory.reason.message : null,
        },
      }

      const allLevels = [
        ...result.uk.levels.map(level => ({ ...level, region: 'UK' })),
        ...result.usa.levels.map(level => ({ ...level, region: 'USA' })),
      ]

      return {
        success: true,
        totalLevels: allLevels.length,
        inventoryLevels: allLevels,
        breakdown: {
          uk: { count: result.uk.levels.length, error: result.uk.error },
          usa: { count: result.usa.levels.length, error: result.usa.error },
        },
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        inventoryLevels: [],
        breakdown: { uk: { count: 0 }, usa: { count: 0 } },
      }
    }
  }

  /**
   * Get analytics data from both stores
   */
  async getAnalytics(options = {}) {
    const {
      start_date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date = new Date().toISOString().split('T')[0],
    } = options

    try {
      // Get orders for analytics
      const ordersResult = await this.getOrders({
        created_at_min: start_date,
        created_at_max: end_date,
        limit: 250,
      })

      if (!ordersResult.success) {
        throw new Error(ordersResult.error)
      }

      // Calculate analytics
      const analytics = {
        uk: this.calculateStoreAnalytics(ordersResult.orders.filter(o => o.region === 'UK')),
        usa: this.calculateStoreAnalytics(ordersResult.orders.filter(o => o.region === 'USA')),
      }

      // Combined analytics
      const combined = {
        totalRevenue: analytics.uk.totalRevenue + analytics.usa.totalRevenue,
        totalOrders: analytics.uk.totalOrders + analytics.usa.totalOrders,
        averageOrderValue:
          (analytics.uk.totalRevenue + analytics.usa.totalRevenue) /
            (analytics.uk.totalOrders + analytics.usa.totalOrders) || 0,
        conversionRate:
          ((analytics.uk.totalOrders + analytics.usa.totalOrders) /
            (analytics.uk.visitors + analytics.usa.visitors)) *
            100 || 0,
      }

      return {
        success: true,
        dateRange: { start_date, end_date },
        analytics: { uk: analytics.uk, usa: analytics.usa, combined },
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        analytics: null,
      }
    }
  }

  /**
   * Calculate analytics for a store's orders
   */
  calculateStoreAnalytics(orders) {
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + parseFloat(order.total_price || 0)
    }, 0)

    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Estimate visitors (simplified - in real implementation would use analytics API)
    const visitors = Math.round(totalOrders * 4.2) // Assumed 24% conversion rate

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      visitors,
      conversionRate: visitors > 0 ? (totalOrders / visitors) * 100 : 0,
    }
  }

  /**
   * Get connection status for both stores
   */
  async getConnectionStatus() {
    const status = {
      uk: { connected: false, error: null, lastCheck: new Date().toISOString() },
      usa: { connected: false, error: null, lastCheck: new Date().toISOString() },
    }

    // Test UK connection
    try {
      await this.makeRequest('uk', 'shop.json')
      status.uk.connected = true
    } catch (error) {
      status.uk.error = error.message
    }

    // Test USA connection
    try {
      await this.makeRequest('usa', 'shop.json')
      status.usa.connected = true
    } catch (error) {
      status.usa.error = error.message
    }

    return {
      overall: status.uk.connected || status.usa.connected,
      stores: status,
      rateLimits: this.rateLimits,
    }
  }

  /**
   * Generate mock data for development/testing
   */
  generateMockData() {
    return {
      orders: [
        {
          id: 5770,
          order_number: 1001,
          customer: { first_name: 'John', last_name: 'Smith', email: 'john@example.com' },
          total_price: '125.00',
          currency: 'GBP',
          financial_status: 'paid',
          fulfillment_status: 'fulfilled',
          created_at: new Date().toISOString(),
          region: 'UK',
          line_items: [{ title: 'Premium Widget A', quantity: 2, price: '62.50' }],
        },
        {
          id: 5771,
          order_number: 1002,
          customer: { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@example.com' },
          total_price: '89.99',
          currency: 'USD',
          financial_status: 'paid',
          fulfillment_status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          region: 'USA',
          line_items: [{ title: 'Standard Widget B', quantity: 1, price: '89.99' }],
        },
      ],
      analytics: {
        uk: { totalRevenue: 12500, totalOrders: 45, averageOrderValue: 277.78 },
        usa: { totalRevenue: 8999, totalOrders: 32, averageOrderValue: 281.22 },
        combined: { totalRevenue: 21499, totalOrders: 77, averageOrderValue: 279.21 },
      },
    }
  }
}

export default ShopifyIntegration
