/**
 * Unit Tests for AmazonSPAPIService
 *
 * Tests cover:
 * - OAuth 2.0 + AWS IAM authentication
 * - FBA inventory sync
 * - Order metrics tracking
 * - 15-minute background scheduler
 * - Rate limiting and error handling
 * - SSE real-time event emissions
 *
 * @see services/amazon-sp-api.js
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import amazonSPAPIService from '../../../services/amazon-sp-api.js'

// Mock dependencies
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    amazonInventory: {
      upsert: vi.fn(),
      findMany: vi.fn()
    },
    amazonOrder: {
      upsert: vi.fn(),
      findMany: vi.fn()
    },
    amazonFBAShipment: {
      upsert: vi.fn()
    },
    $disconnect: vi.fn()
  }))
}))

vi.mock('../../../src/lib/redis.js', () => ({
  default: {
    cacheWidget: vi.fn(),
    getCachedWidget: vi.fn()
  }
}))

vi.mock('../../../src/utils/logger', () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn()
}))

vi.mock('../../../server/services/sse/index.cjs', () => ({
  default: {
    emitAmazonSyncStarted: vi.fn(),
    emitAmazonInventorySynced: vi.fn(),
    emitAmazonOrdersSynced: vi.fn(),
    emitAmazonFBASynced: vi.fn(),
    emitAmazonSyncCompleted: vi.fn(),
    emitAmazonSyncError: vi.fn()
  }
}))

import { PrismaClient } from '@prisma/client'
import redisCache from '../../../src/lib/redis.js'
import sseService from '../../../server/services/sse/index.cjs'
import { logWarn } from '../../../src/utils/logger'

describe('AmazonSPAPIService', () => {
  let mockSPAPI
  let prisma

  beforeEach(() => {
    vi.clearAllMocks()

    // Get the mock prisma instance
    prisma = new PrismaClient()

    // Reset service state
    amazonSPAPIService.spApi = null
    amazonSPAPIService.isConnected = false
    if (amazonSPAPIService.syncInterval) {
      clearInterval(amazonSPAPIService.syncInterval)
      amazonSPAPIService.syncInterval = null
    }

    // Mock the SellingPartnerApi instance
    mockSPAPI = {
      callAPI: vi.fn()
    }

    // Set environment variables for testing
    // Note: Amazon SP-API requires region to be 'na', 'eu', or 'fe' (not 'us-east-1')
    process.env.AMAZON_REFRESH_TOKEN = 'test_refresh_token'
    process.env.AMAZON_LWA_APP_ID = 'test_app_id'
    process.env.AMAZON_LWA_CLIENT_SECRET = 'test_client_secret'
    process.env.AMAZON_SP_ROLE_ARN = 'arn:aws:iam::123456789012:role/TestRole'
    process.env.AMAZON_REGION = 'na'

    // Update credentials to reflect env vars
    amazonSPAPIService.credentials = {
      refresh_token: process.env.AMAZON_REFRESH_TOKEN,
      lwa_app_id: process.env.AMAZON_LWA_APP_ID,
      lwa_client_secret: process.env.AMAZON_LWA_CLIENT_SECRET,
      aws_selling_partner_role: process.env.AMAZON_SP_ROLE_ARN,
      region: process.env.AMAZON_REGION
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.AMAZON_REFRESH_TOKEN
    delete process.env.AMAZON_LWA_APP_ID
    delete process.env.AMAZON_LWA_CLIENT_SECRET
    delete process.env.AMAZON_SP_ROLE_ARN
    delete process.env.AMAZON_REGION
  })

  describe('initialize', () => {
    it('should return false when credentials are missing', async () => {
      delete process.env.AMAZON_REFRESH_TOKEN
      amazonSPAPIService.credentials.refresh_token = undefined

      const result = await amazonSPAPIService.initialize()

      expect(result).toBe(false)
      expect(amazonSPAPIService.isConnected).toBe(false)
      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining('Amazon SP-API authentication required')
      )
    })

    it('should throw error when testConnection fails', async () => {
      // Mock successful API creation but failed connection test
      amazonSPAPIService.spApi = mockSPAPI
      mockSPAPI.callAPI.mockRejectedValue(new Error('API connection failed'))

      await expect(amazonSPAPIService.initialize()).rejects.toThrow()
      expect(amazonSPAPIService.isConnected).toBe(false)
    })

    it('should start data sync after successful initialization', async () => {
      amazonSPAPIService.spApi = mockSPAPI
      mockSPAPI.callAPI.mockResolvedValue({
        payload: [{ marketplaceId: 'ATVPDKIKX0DER', name: 'Amazon.com' }]
      })

      // Mock startDataSync to avoid actual scheduling
      vi.spyOn(amazonSPAPIService, 'startDataSync').mockImplementation(() => {})

      await amazonSPAPIService.initialize()

      expect(amazonSPAPIService.isConnected).toBe(true)
      expect(amazonSPAPIService.startDataSync).toHaveBeenCalled()
    })
  })

  describe('testConnection', () => {
    it('should successfully connect to Amazon marketplaces', async () => {
      amazonSPAPIService.spApi = mockSPAPI
      mockSPAPI.callAPI.mockResolvedValue({
        payload: [
          { marketplaceId: 'ATVPDKIKX0DER', name: 'Amazon.com' },
          { marketplaceId: 'A2EUQ1WTGCTBG2', name: 'Amazon.ca' }
        ]
      })

      const result = await amazonSPAPIService.testConnection()

      expect(result).toBe(true)
      expect(mockSPAPI.callAPI).toHaveBeenCalledWith({
        operation: 'getMarketplaceParticipations',
        endpoint: 'sellers'
      })
    })

    it('should throw error when connection test fails', async () => {
      amazonSPAPIService.spApi = mockSPAPI
      mockSPAPI.callAPI.mockRejectedValue(new Error('Unauthorized'))

      await expect(amazonSPAPIService.testConnection()).rejects.toThrow(
        'SP-API connection test failed'
      )
    })
  })

  describe('syncInventoryData', () => {
    beforeEach(() => {
      amazonSPAPIService.isConnected = true
      amazonSPAPIService.spApi = mockSPAPI
    })

    it('should throw error when service is not connected', async () => {
      amazonSPAPIService.isConnected = false

      await expect(amazonSPAPIService.syncInventoryData()).rejects.toThrow(
        'Amazon SP-API not connected'
      )
    })

    it('should sync inventory data successfully', async () => {
      const mockInventoryData = {
        payload: {
          inventorySummaries: [
            {
              asin: 'B00TEST1',
              sellerSku: 'SKU-001',
              fnsku: 'X000TEST1',
              productName: 'Test Product 1',
              totalQuantity: 100,
              inStockSupplyQuantity: 90,
              reservedQuantity: 10,
              fulfillableQuantity: 80,
              inboundWorkingQuantity: 20,
              inboundShippedQuantity: 10
            },
            {
              asin: 'B00TEST2',
              sellerSku: 'SKU-002',
              fnsku: 'X000TEST2',
              productName: 'Test Product 2',
              totalQuantity: 50,
              inStockSupplyQuantity: 45,
              reservedQuantity: 5,
              fulfillableQuantity: 40,
              inboundWorkingQuantity: 10,
              inboundShippedQuantity: 5
            }
          ]
        }
      }

      mockSPAPI.callAPI.mockResolvedValue(mockInventoryData)
      prisma.amazonInventory.upsert.mockResolvedValue({})
      redisCache.cacheWidget.mockResolvedValue()

      const result = await amazonSPAPIService.syncInventoryData()

      expect(result).toHaveLength(2)
      expect(result[0].asin).toBe('B00TEST1')
      expect(result[0].totalQuantity).toBe(100)
      expect(prisma.amazonInventory.upsert).toHaveBeenCalledTimes(2)
      expect(redisCache.cacheWidget).toHaveBeenCalledWith(
        'amazon_inventory_summary',
        expect.objectContaining({
          totalSKUs: 2,
          totalQuantity: 150,
          lowStockItems: 0
        }),
        300
      )
      expect(sseService.emitAmazonInventorySynced).toHaveBeenCalled()
    })

    it('should identify low stock items correctly', async () => {
      const mockInventoryData = {
        payload: {
          inventorySummaries: [
            {
              asin: 'B00LOW1',
              sellerSku: 'SKU-LOW',
              fulfillableQuantity: 5, // Low stock
              totalQuantity: 5
            }
          ]
        }
      }

      mockSPAPI.callAPI.mockResolvedValue(mockInventoryData)
      prisma.amazonInventory.upsert.mockResolvedValue({})
      redisCache.cacheWidget.mockResolvedValue()

      await amazonSPAPIService.syncInventoryData()

      expect(redisCache.cacheWidget).toHaveBeenCalledWith(
        'amazon_inventory_summary',
        expect.objectContaining({
          lowStockItems: 1
        }),
        300
      )
    })

    it('should handle API errors during sync', async () => {
      mockSPAPI.callAPI.mockRejectedValue(new Error('Rate limit exceeded'))

      await expect(amazonSPAPIService.syncInventoryData()).rejects.toThrow(
        'Rate limit exceeded'
      )
    })
  })

  describe('syncOrderData', () => {
    beforeEach(() => {
      amazonSPAPIService.isConnected = true
      amazonSPAPIService.spApi = mockSPAPI
    })

    it('should sync order data successfully', async () => {
      const mockOrderData = {
        payload: {
          Orders: [
            {
              AmazonOrderId: 'ORDER-001',
              OrderStatus: 'Unshipped',
              PurchaseDate: '2025-10-20T10:00:00Z',
              OrderTotal: { Amount: '99.99', CurrencyCode: 'USD' },
              NumberOfItemsShipped: 0,
              NumberOfItemsUnshipped: 2,
              FulfillmentChannel: 'FBA',
              SalesChannel: 'Amazon.com'
            },
            {
              AmazonOrderId: 'ORDER-002',
              OrderStatus: 'Shipped',
              PurchaseDate: '2025-10-20T09:00:00Z',
              OrderTotal: { Amount: '149.99', CurrencyCode: 'USD' },
              NumberOfItemsShipped: 1,
              NumberOfItemsUnshipped: 0,
              FulfillmentChannel: 'FBA',
              SalesChannel: 'Amazon.com'
            }
          ]
        }
      }

      mockSPAPI.callAPI.mockResolvedValue(mockOrderData)
      prisma.amazonOrder.upsert.mockResolvedValue({})

      const result = await amazonSPAPIService.syncOrderData()

      expect(result).toHaveLength(2)
      expect(result[0].AmazonOrderId).toBe('ORDER-001')
      expect(prisma.amazonOrder.upsert).toHaveBeenCalledTimes(2)
      expect(sseService.emitAmazonOrdersSynced).toHaveBeenCalledWith({
        totalOrders: 2,
        timestamp: expect.any(String)
      })
    })

    it('should handle empty order response', async () => {
      mockSPAPI.callAPI.mockResolvedValue({ payload: { Orders: [] } })

      const result = await amazonSPAPIService.syncOrderData()

      expect(result).toHaveLength(0)
      expect(prisma.amazonOrder.upsert).not.toHaveBeenCalled()
    })

    it('should return undefined when not connected', async () => {
      amazonSPAPIService.isConnected = false

      const result = await amazonSPAPIService.syncOrderData()

      expect(result).toBeUndefined()
      expect(mockSPAPI.callAPI).not.toHaveBeenCalled()
    })
  })

  describe('syncFBAData', () => {
    beforeEach(() => {
      amazonSPAPIService.isConnected = true
      amazonSPAPIService.spApi = mockSPAPI
    })

    it('should sync FBA shipment data successfully', async () => {
      const mockFBAData = {
        payload: {
          ShipmentData: [
            {
              ShipmentId: 'FBA001',
              ShipmentName: 'Test Shipment 1',
              ShipmentStatus: 'WORKING',
              DestinationFulfillmentCenterId: 'PHX3',
              LabelPrepPreference: 'SELLER_LABEL',
              AreCasesRequired: false,
              ConfirmedNeedByDate: '2025-10-30T00:00:00Z'
            }
          ]
        }
      }

      mockSPAPI.callAPI.mockResolvedValue(mockFBAData)
      prisma.amazonFBAShipment.upsert.mockResolvedValue({})

      const result = await amazonSPAPIService.syncFBAData()

      expect(result).toHaveLength(1)
      expect(result[0].ShipmentId).toBe('FBA001')
      expect(prisma.amazonFBAShipment.upsert).toHaveBeenCalledTimes(1)
      expect(sseService.emitAmazonFBASynced).toHaveBeenCalled()
    })

    it('should return undefined when not connected', async () => {
      amazonSPAPIService.isConnected = false

      const result = await amazonSPAPIService.syncFBAData()

      expect(result).toBeUndefined()
    })
  })

  describe('performFullSync', () => {
    beforeEach(() => {
      amazonSPAPIService.isConnected = true
      amazonSPAPIService.spApi = mockSPAPI

      // Mock all sync methods
      vi.spyOn(amazonSPAPIService, 'syncInventoryData').mockResolvedValue([])
      vi.spyOn(amazonSPAPIService, 'syncOrderData').mockResolvedValue([])
      vi.spyOn(amazonSPAPIService, 'syncFBAData').mockResolvedValue([])
      vi.spyOn(amazonSPAPIService, 'getInventorySummary').mockResolvedValue({
        totalSKUs: 10,
        totalQuantity: 500,
        lowStockItems: 2
      })
      vi.spyOn(amazonSPAPIService, 'getOrderMetrics').mockResolvedValue({
        totalOrders: 25,
        totalRevenue: 2500,
        unshippedOrders: 5
      })
    })

    it('should perform full sync successfully', async () => {
      await amazonSPAPIService.performFullSync()

      expect(sseService.emitAmazonSyncStarted).toHaveBeenCalled()
      expect(amazonSPAPIService.syncInventoryData).toHaveBeenCalled()
      expect(amazonSPAPIService.syncOrderData).toHaveBeenCalled()
      expect(amazonSPAPIService.syncFBAData).toHaveBeenCalled()
      expect(sseService.emitAmazonSyncCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          inventory: expect.objectContaining({
            totalSKUs: 10,
            lowStockItems: 2
          }),
          orders: expect.objectContaining({
            totalOrders: 25,
            unshippedOrders: 5
          })
        })
      )
    })

    it('should handle sync errors gracefully', async () => {
      amazonSPAPIService.syncInventoryData.mockRejectedValue(new Error('Sync failed'))

      await amazonSPAPIService.performFullSync()

      expect(sseService.emitAmazonSyncError).toHaveBeenCalledWith({
        error: 'Sync failed',
        timestamp: expect.any(String)
      })
    })
  })

  describe('getInventorySummary', () => {
    it('should return cached summary if available', async () => {
      const cachedSummary = {
        totalSKUs: 15,
        totalQuantity: 750,
        lowStockItems: 3,
        lastSync: '2025-10-20T10:00:00Z'
      }

      redisCache.getCachedWidget.mockResolvedValue(cachedSummary)

      const result = await amazonSPAPIService.getInventorySummary()

      expect(result).toEqual(cachedSummary)
      expect(prisma.amazonInventory.findMany).not.toHaveBeenCalled()
    })

    it('should fetch from database when cache is empty', async () => {
      redisCache.getCachedWidget.mockResolvedValue(null)
      prisma.amazonInventory.findMany.mockResolvedValue([
        { sku: 'SKU-001', totalQuantity: 100, fulfillableQuantity: 90 },
        { sku: 'SKU-002', totalQuantity: 50, fulfillableQuantity: 5 } // Low stock
      ])
      redisCache.cacheWidget.mockResolvedValue()

      const result = await amazonSPAPIService.getInventorySummary()

      expect(result.totalSKUs).toBe(2)
      expect(result.totalQuantity).toBe(150)
      expect(result.lowStockItems).toBe(1)
      expect(redisCache.cacheWidget).toHaveBeenCalledWith(
        'amazon_inventory_summary',
        result,
        300
      )
    })
  })

  describe('getOrderMetrics', () => {
    it('should calculate order metrics correctly', async () => {
      prisma.amazonOrder.findMany.mockResolvedValue([
        { orderTotal: 99.99, orderStatus: 'Shipped' },
        { orderTotal: 149.99, orderStatus: 'Unshipped' },
        { orderTotal: 75.50, orderStatus: 'Unshipped' }
      ])
      redisCache.cacheWidget.mockResolvedValue()

      const result = await amazonSPAPIService.getOrderMetrics()

      expect(result.totalOrders).toBe(3)
      expect(result.totalRevenue).toBeCloseTo(325.48, 2)
      expect(result.averageOrderValue).toBeCloseTo(108.49, 2)
      expect(result.unshippedOrders).toBe(2)
    })

    it('should handle zero orders gracefully', async () => {
      prisma.amazonOrder.findMany.mockResolvedValue([])
      redisCache.cacheWidget.mockResolvedValue()

      const result = await amazonSPAPIService.getOrderMetrics()

      expect(result.totalOrders).toBe(0)
      expect(result.totalRevenue).toBe(0)
      expect(result.averageOrderValue).toBe(0)
      expect(result.unshippedOrders).toBe(0)
    })
  })

  describe('startDataSync and stopDataSync', () => {
    it('should start 15-minute sync interval', () => {
      vi.spyOn(amazonSPAPIService, 'performFullSync').mockImplementation(() => {})
      vi.useFakeTimers()

      amazonSPAPIService.startDataSync()

      expect(amazonSPAPIService.syncInterval).not.toBeNull()
      expect(amazonSPAPIService.performFullSync).toHaveBeenCalledTimes(1)

      // Fast-forward 15 minutes
      vi.advanceTimersByTime(15 * 60 * 1000)

      expect(amazonSPAPIService.performFullSync).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })

    it('should stop sync interval', () => {
      amazonSPAPIService.syncInterval = setInterval(() => {}, 1000)

      amazonSPAPIService.stopDataSync()

      expect(amazonSPAPIService.syncInterval).toBeNull()
    })
  })

  describe('disconnect', () => {
    it('should disconnect and cleanup resources', async () => {
      amazonSPAPIService.isConnected = true
      amazonSPAPIService.syncInterval = setInterval(() => {}, 1000)

      await amazonSPAPIService.disconnect()

      expect(amazonSPAPIService.isConnected).toBe(false)
      expect(amazonSPAPIService.syncInterval).toBeNull()
      expect(prisma.$disconnect).toHaveBeenCalled()
    })
  })

  describe('rate limiting and error handling', () => {
    beforeEach(() => {
      amazonSPAPIService.isConnected = true
      amazonSPAPIService.spApi = mockSPAPI
    })

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded')
      rateLimitError.code = 'QuotaExceeded'

      mockSPAPI.callAPI.mockRejectedValue(rateLimitError)

      await expect(amazonSPAPIService.syncInventoryData()).rejects.toThrow(
        'Rate limit exceeded'
      )
    })

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.code = 'ETIMEDOUT'

      mockSPAPI.callAPI.mockRejectedValue(timeoutError)

      await expect(amazonSPAPIService.syncOrderData()).rejects.toThrow(
        'Request timeout'
      )
    })

    it('should handle missing data gracefully', async () => {
      mockSPAPI.callAPI.mockResolvedValue({
        payload: {
          inventorySummaries: [
            {
              asin: 'B00TEST',
              // Missing most fields
              totalQuantity: undefined
            }
          ]
        }
      })
      prisma.amazonInventory.upsert.mockResolvedValue({})
      redisCache.cacheWidget.mockResolvedValue()

      const result = await amazonSPAPIService.syncInventoryData()

      expect(result[0].productName).toBe('Unknown Product')
      expect(result[0].totalQuantity).toBe(0)
    })
  })
})
