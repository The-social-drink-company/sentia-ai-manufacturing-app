/**
 * EXTERNAL API INTEGRATION SERVICE
 *
 * Enterprise-grade service for managing all external API integrations
 * with proper error handling, retry logic, and monitoring.
 */

import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import pRetry from 'p-retry'
import CircuitBreaker from 'opossum'

const prisma = new PrismaClient()

// Circuit breaker options for API protection
const CIRCUIT_BREAKER_OPTIONS = {
  timeout: 30000, // 30 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 10,
}

// Retry options for resilient API calls
const RETRY_OPTIONS = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 5000,
  randomize: true,
}

/**
 * Base API Client with circuit breaker and retry logic
 */
class ResilientAPIClient {
  constructor(name, baseURL, headers = {}) {
    this.name = name
    this.baseURL = baseURL
    this.headers = headers

    // Create axios instance
    this.client = axios.create({
      baseURL,
      headers,
      timeout: 20000,
    })

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      config => {
        console.log(`[${this.name}] API Request:`, config.method?.toUpperCase(), config.url)
        return config
      },
      error => {
        console.error(`[${this.name}] Request Error:`, error)
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      response => {
        console.log(`[${this.name}] API Response:`, response.status)
        return response
      },
      error => {
        console.error(`[${this.name}] Response Error:`, error.response?.status, error.message)
        return Promise.reject(error)
      }
    )

    // Setup circuit breaker
    this.breaker = new CircuitBreaker(this.makeRequest.bind(this), CIRCUIT_BREAKER_OPTIONS)

    // Circuit breaker event handlers
    this.breaker.on('open', () => {
      console.warn(`[${this.name}] Circuit breaker OPENED - API failing`)
    })

    this.breaker.on('halfOpen', () => {
      console.log(`[${this.name}] Circuit breaker HALF-OPEN - Testing API`)
    })

    this.breaker.on('close', () => {
      console.log(`[${this.name}] Circuit breaker CLOSED - API recovered`)
    })
  }

  async makeRequest(config) {
    return this.client.request(config)
  }

  async get(path, config = {}) {
    return pRetry(() => this.breaker.fire({ ...config, method: 'GET', url: path }), RETRY_OPTIONS)
  }

  async post(path, data, config = {}) {
    return pRetry(
      () => this.breaker.fire({ ...config, method: 'POST', url: path, data }),
      RETRY_OPTIONS
    )
  }

  async put(path, data, config = {}) {
    return pRetry(
      () => this.breaker.fire({ ...config, method: 'PUT', url: path, data }),
      RETRY_OPTIONS
    )
  }

  getStatus() {
    return {
      name: this.name,
      state: this.breaker.state,
      stats: this.breaker.stats,
    }
  }
}

/**
 * Xero API Integration
 */
class XeroAPIService extends ResilientAPIClient {
  constructor() {
    super('Xero', 'https://api.xero.com/api.xro/2.0', {
      Authorization: `Bearer ${process.env.XERO_ACCESS_TOKEN}`,
      'xero-tenant-id': process.env.XERO_TENANT_ID,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    })
  }

  async getWorkingCapitalData() {
    try {
      const [balanceSheet, cashFlow, invoices] = await Promise.all([
        this.get('/Reports/BalanceSheet'),
        this.get('/Reports/CashflowStatement'),
        this.get('/Invoices?where=Status=="AUTHORISED"'),
      ])

      return {
        currentAssets: this.extractValue(balanceSheet.data, 'CurrentAssets'),
        currentLiabilities: this.extractValue(balanceSheet.data, 'CurrentLiabilities'),
        cashFlow: this.extractValue(cashFlow.data, 'NetCashFlow'),
        receivables: invoices.data?.Invoices?.filter(i => i.Type === 'ACCREC'),
        payables: invoices.data?.Invoices?.filter(i => i.Type === 'ACCPAY'),
      }
    } catch (error) {
      console.error('Xero API Error:', error)
      throw new Error(`Failed to fetch Xero data: ${error.message}`)
    }
  }

  extractValue(report, field) {
    // Navigate Xero's complex report structure
    const rows = report?.Reports?.[0]?.Rows || []
    const row = rows.find(r => r.RowType === field || r.Title === field)
    return parseFloat(row?.Cells?.[1]?.Value || 0)
  }
}

/**
 * Shopify API Integration
 */
class ShopifyAPIService extends ResilientAPIClient {
  constructor() {
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN
    super('Shopify', `https://${shopDomain}/admin/api/2024-01`, {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    })
  }

  async getInventoryData() {
    try {
      const [products, locations, levels] = await Promise.all([
        this.get('/products.json?limit=250'),
        this.get('/locations.json'),
        this.get('/inventory_levels.json?limit=250'),
      ])

      return {
        products: products.data?.products || [],
        locations: locations.data?.locations || [],
        levels: levels.data?.inventory_levels || [],
        totalSKUs: products.data?.products?.length || 0,
        totalValue: this.calculateInventoryValue(
          products.data?.products,
          levels.data?.inventory_levels
        ),
      }
    } catch (error) {
      console.error('Shopify API Error:', error)
      throw new Error(`Failed to fetch Shopify data: ${error.message}`)
    }
  }

  calculateInventoryValue(products, levels) {
    let totalValue = 0
    products?.forEach(product => {
      product.variants?.forEach(variant => {
        const level = levels?.find(l => l.inventory_item_id === variant.inventory_item_id)
        if (level && variant.price) {
          totalValue += (level.available || 0) * parseFloat(variant.price)
        }
      })
    })
    return totalValue
  }
}

/**
 * Amazon SP-API Integration
 */
class AmazonSPAPIService extends ResilientAPIClient {
  constructor() {
    super('AmazonSP', 'https://sellingpartnerapi.amazon.com', {
      'x-amz-access-token': process.env.AMAZON_SP_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    })
  }

  async getSalesData() {
    try {
      const response = await this.get('/sales/v1/orderMetrics', {
        params: {
          marketplaceIds: process.env.AMAZON_MARKETPLACE_ID,
          interval: 'Day',
          granularity: 'Day',
        },
      })

      return {
        orders: response.data?.payload || [],
        totalSales: this.calculateTotalSales(response.data?.payload),
      }
    } catch (error) {
      console.error('Amazon SP-API Error:', error)
      throw new Error(`Failed to fetch Amazon data: ${error.message}`)
    }
  }

  calculateTotalSales(orders) {
    return (
      orders?.reduce((total, order) => {
        return total + (order.totalSales?.amount || 0)
      }, 0) || 0
    )
  }
}

/**
 * Main External API Service
 */
class ExternalAPIService {
  constructor() {
    this.services = {}
    this.initializeServices()
  }

  initializeServices() {
    // Initialize Xero if credentials exist
    if (process.env.XERO_ACCESS_TOKEN) {
      this.services.xero = new XeroAPIService()
    }

    // Initialize Shopify if credentials exist
    if (process.env.SHOPIFY_ACCESS_TOKEN) {
      this.services.shopify = new ShopifyAPIService()
    }

    // Initialize Amazon if credentials exist
    if (process.env.AMAZON_SP_ACCESS_TOKEN) {
      this.services.amazon = new AmazonSPAPIService()
    }

    console.log('External API Services Initialized:', Object.keys(this.services))
  }

  /**
   * Get consolidated dashboard data from all sources
   */
  async getDashboardData() {
    const results = {
      timestamp: new Date().toISOString(),
      sources: [],
      data: {},
      errors: [],
    }

    // Fetch from Xero
    if (this.services.xero) {
      try {
        const xeroData = await this.services.xero.getWorkingCapitalData()
        results.data.financial = xeroData
        results.sources.push('xero')
      } catch (error) {
        results.errors.push({ source: 'xero', error: error.message })
      }
    }

    // Fetch from Shopify
    if (this.services.shopify) {
      try {
        const shopifyData = await this.services.shopify.getInventoryData()
        results.data.inventory = shopifyData
        results.sources.push('shopify')
      } catch (error) {
        results.errors.push({ source: 'shopify', error: error.message })
      }
    }

    // Fetch from Amazon
    if (this.services.amazon) {
      try {
        const amazonData = await this.services.amazon.getSalesData()
        results.data.sales = amazonData
        results.sources.push('amazon')
      } catch (error) {
        results.errors.push({ source: 'amazon', error: error.message })
      }
    }

    // Fetch from database as fallback/supplement
    try {
      const dbData = await this.getDatabaseData()
      results.data.database = dbData
      results.sources.push('database')
    } catch (error) {
      results.errors.push({ source: 'database', error: error.message })
    }

    return results
  }

  /**
   * Get data from database
   */
  async getDatabaseData() {
    const [production, financial, inventory, workingCapital] = await Promise.all([
      prisma.productionMetrics.findFirst({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.financialMetrics.findFirst({
        orderBy: { date: 'desc' },
      }),
      prisma.inventory.aggregate({
        _sum: { value: true },
        _count: { id: true },
      }),
      prisma.workingCapital.findFirst({
        orderBy: { date: 'desc' },
      }),
    ])

    return {
      production,
      financial,
      inventory: {
        totalValue: inventory._sum.value || 0,
        totalItems: inventory._count.id || 0,
      },
      workingCapital,
    }
  }

  /**
   * Sync all external data to database
   */
  async syncAllData() {
    const syncResults = {
      timestamp: new Date().toISOString(),
      synced: [],
      errors: [],
    }

    // Sync Xero data
    if (this.services.xero) {
      try {
        const data = await this.services.xero.getWorkingCapitalData()
        await prisma.workingCapital.create({
          data: {
            date: new Date(),
            currentAssets: data.currentAssets,
            currentLiabilities: data.currentLiabilities,
            ratio: data.currentAssets / (data.currentLiabilities || 1),
            cashFlow: data.cashFlow,
            daysReceivable: 45, // Calculate from receivables
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
        syncResults.synced.push('xero')
      } catch (error) {
        syncResults.errors.push({ source: 'xero', error: error.message })
      }
    }

    // Sync Shopify data
    if (this.services.shopify) {
      try {
        const data = await this.services.shopify.getInventoryData()

        // Update inventory items
        for (const product of data.products.slice(0, 50)) {
          for (const variant of product.variants || []) {
            const level = data.levels.find(l => l.inventory_item_id === variant.inventory_item_id)

            await prisma.inventory.upsert({
              where: { sku: variant.sku || `SKU-${variant.id}` },
              update: {
                quantity: level?.available || 0,
                value: (level?.available || 0) * parseFloat(variant.price || 0),
                updatedAt: new Date(),
              },
              create: {
                sku: variant.sku || `SKU-${variant.id}`,
                name: variant.title || product.title,
                quantity: level?.available || 0,
                reorderPoint: 50,
                value: (level?.available || 0) * parseFloat(variant.price || 0),
                updatedAt: new Date(),
              },
            })
          }
        }
        syncResults.synced.push('shopify')
      } catch (error) {
        syncResults.errors.push({ source: 'shopify', error: error.message })
      }
    }

    return syncResults
  }

  /**
   * Get health status of all services
   */
  getHealthStatus() {
    const status = {
      healthy: true,
      services: {},
    }

    for (const [name, service] of Object.entries(this.services)) {
      const serviceStatus = service.getStatus()
      status.services[name] = serviceStatus

      if (serviceStatus.state !== 'CLOSED') {
        status.healthy = false
      }
    }

    return status
  }
}

// Create singleton instance
const externalAPIService = new ExternalAPIService()

export default externalAPIService
export { ExternalAPIService, XeroAPIService, ShopifyAPIService, AmazonSPAPIService }
