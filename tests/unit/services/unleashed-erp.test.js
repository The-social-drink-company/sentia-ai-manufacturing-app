/**
 * Unit Tests for UnleashedERPService
 *
 * Tests cover:
 * - HMAC-SHA256 authentication
 * - Assembly job tracking and production metrics
 * - Stock on hand sync and inventory management
 * - Production schedule
 * - Quality alerts (yield <95%)
 * - SSE real-time updates
 * - Error handling and connection management
 *
 * @see services/unleashed-erp.js
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import axios from 'axios'

// Mock axios BEFORE importing the service (service instantiates at module level)
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      get: vi.fn(),
      post: vi.fn()
    }
  }
})

vi.mock('../../../services/redis-cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    generateCacheKey: vi.fn((prefix, type) => `${prefix}:${type}`)
  }
}))

vi.mock('../../../src/utils/logger', () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn()
}))

vi.mock('../../../server/services/sse/index.cjs', () => ({
  emitUnleashedSyncStarted: vi.fn(),
  emitUnleashedSyncCompleted: vi.fn(),
  emitUnleashedSyncError: vi.fn(),
  default: {
    broadcast: vi.fn()
  }
}))

// Import service AFTER all mocks are set up
import unleashedERPService from '../../../services/unleashed-erp.js'
import redisCacheService from '../../../services/redis-cache.js'
import { logWarn, logError } from '../../../src/utils/logger'
import {
  emitUnleashedSyncStarted,
  emitUnleashedSyncCompleted,
  emitUnleashedSyncError
} from '../../../server/services/sse/index.cjs'

describe('UnleashedERPService', () => {
  let mockAxiosInstance

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset service state
    unleashedERPService.isConnected = false
    if (unleashedERPService.syncInterval) {
      clearInterval(unleashedERPService.syncInterval)
      unleashedERPService.syncInterval = null
    }

    // Set environment variables for testing
    process.env.UNLEASHED_API_ID = 'test_api_id'
    process.env.UNLEASHED_API_KEY = 'test_api_key'
    process.env.UNLEASHED_API_URL = 'https://api.unleashedsoftware.com'

    // Update service credentials
    unleashedERPService.apiId = process.env.UNLEASHED_API_ID
    unleashedERPService.apiKey = process.env.UNLEASHED_API_KEY
    unleashedERPService.baseUrl = process.env.UNLEASHED_API_URL

    // Mock axios instance methods
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }

    axios.create.mockReturnValue(mockAxiosInstance)
    unleashedERPService.client = mockAxiosInstance
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.UNLEASHED_API_ID
    delete process.env.UNLEASHED_API_KEY
    delete process.env.UNLEASHED_API_URL
  })

  describe('HMAC-SHA256 authentication', () => {
    it('should generate correct HMAC-SHA256 signature', () => {
      const queryString = 'pageSize=1&page=1'
      const signature = unleashedERPService.generateSignature(queryString)

      expect(signature).toBeTruthy()
      expect(typeof signature).toBe('string')
      // Signature should be base64 encoded
      expect(signature).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('should generate different signatures for different query strings', () => {
      const sig1 = unleashedERPService.generateSignature('pageSize=1')
      const sig2 = unleashedERPService.generateSignature('pageSize=2')

      expect(sig1).not.toBe(sig2)
    })

    it('should handle empty query string', () => {
      const signature = unleashedERPService.generateSignature('')
      expect(signature).toBeTruthy()
    })

    it('should add auth headers to requests', () => {
      const config = {
        url: '/test?page=1',
        headers: {}
      }

      const resultConfig = unleashedERPService.addAuthHeaders(config)

      expect(resultConfig.headers['api-auth-id']).toBe('test_api_id')
      expect(resultConfig.headers['api-auth-signature']).toBeTruthy()
    })

    it('should throw error when credentials are missing', () => {
      unleashedERPService.apiId = null

      const config = { headers: {} }

      expect(() => unleashedERPService.addAuthHeaders(config)).toThrow(
        'UNLEASHED ERP: Missing API credentials'
      )
    })
  })

  describe('connect', () => {
    it('should successfully connect with valid credentials', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { Items: [{ CurrencyCode: 'GBP' }] }
      })

      // Mock startSyncScheduler to avoid actual scheduling
      vi.spyOn(unleashedERPService, 'startSyncScheduler').mockImplementation(async () => {})

      const result = await unleashedERPService.connect()

      expect(result).toBe(true)
      expect(unleashedERPService.isConnected).toBe(true)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/Currencies', {
        params: { pageSize: 1 }
      })
      expect(unleashedERPService.startSyncScheduler).toHaveBeenCalled()
    })

    it('should return false when credentials are missing', async () => {
      unleashedERPService.apiId = null
      unleashedERPService.apiKey = null

      const result = await unleashedERPService.connect()

      expect(result).toBe(false)
      expect(unleashedERPService.isConnected).toBe(false)
    })

    it('should handle connection failure gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'))

      const result = await unleashedERPService.connect()

      expect(result).toBe(false)
      expect(unleashedERPService.isConnected).toBe(false)
      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining('Connection failed'),
        expect.any(String)
      )
    })
  })

  describe('syncProductionData', () => {
    it('should sync assembly jobs and calculate production metrics', async () => {
      const mockAssemblyJobs = {
        data: {
          Items: [
            {
              Guid: 'job-001',
              AssemblyJobNumber: 'AJ001',
              JobStatus: 'InProgress',
              PlannedQuantity: 100,
              ActualQuantity: 98,
              Product: { ProductDescription: 'Test Product' }
            },
            {
              Guid: 'job-002',
              AssemblyJobNumber: 'AJ002',
              JobStatus: 'Planned',
              PlannedQuantity: 200,
              PlannedStartDate: '2025-10-21T10:00:00Z',
              Priority: 'High',
              Product: { ProductDescription: 'Another Product' }
            }
          ]
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockAssemblyJobs)
      redisCacheService.generateCacheKey.mockReturnValue('unleashed:production')
      redisCacheService.set.mockResolvedValue()

      const result = await unleashedERPService.syncProductionData()

      expect(result.metrics.activeBatches).toBe(1)
      expect(result.metrics.totalJobs).toBe(2)
      expect(result.schedule).toHaveLength(1)
      expect(result.schedule[0].productName).toBe('Another Product')
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/AssemblyJobs', expect.any(Object))
    })

    it('should identify quality issues (yield <95%)', async () => {
      const mockAssemblyJobs = {
        data: {
          Items: [
            {
              Guid: 'job-001',
              AssemblyJobNumber: 'AJ001',
              JobStatus: 'Completed',
              PlannedQuantity: 100,
              ActualQuantity: 92, // 92% yield - quality issue
              ModifiedOn: '2025-10-20T10:00:00Z'
            }
          ]
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockAssemblyJobs)
      redisCacheService.generateCacheKey.mockReturnValue('unleashed:production')
      redisCacheService.set.mockResolvedValue()

      const result = await unleashedERPService.syncProductionData()

      expect(result.alerts.length).toBeGreaterThan(0)
      expect(result.alerts[0].batchId).toBe('AJ001')
      expect(result.alerts[0].issue).toContain('Yield shortfall')
    })

    it('should handle API errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API error'))

      const result = await unleashedERPService.syncProductionData()

      expect(result.metrics.activeBatches).toBe(0)
      expect(result.schedule).toEqual([])
      expect(result.alerts).toEqual([])
    })
  })

  describe('syncInventoryData', () => {
    it('should sync stock on hand and identify low stock items', async () => {
      const mockStockData = {
        data: {
          Items: [
            {
              ProductCode: 'PROD-001',
              Product: { ProductDescription: 'Test Product 1' },
              QtyOnHand: 5,
              MinStockLevel: 10,
              AverageLandedCost: 50,
              Warehouse: { WarehouseName: 'Main Warehouse' }
            },
            {
              ProductCode: 'PROD-002',
              Product: { ProductDescription: 'Test Product 2' },
              QtyOnHand: 0,
              MinStockLevel: 5,
              AverageLandedCost: 30
            }
          ]
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockStockData)
      redisCacheService.generateCacheKey.mockReturnValue('unleashed:inventory')
      redisCacheService.set.mockResolvedValue()

      const result = await unleashedERPService.syncInventoryData()

      expect(result.metrics.totalItems).toBe(2)
      expect(result.metrics.lowStockItems).toBe(2)
      expect(result.metrics.zeroStockItems).toBe(1)
      expect(result.metrics.totalValue).toBe(250) // 5*50 + 0*30
      expect(result.alerts).toHaveLength(2)
      expect(result.alerts[0].currentStock).toBeLessThan(result.alerts[0].minLevel)
    })

    it('should handle empty inventory response', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { Items: [] } })
      redisCacheService.set.mockResolvedValue()

      const result = await unleashedERPService.syncInventoryData()

      expect(result.metrics.totalItems).toBe(0)
      expect(result.alerts).toEqual([])
    })
  })

  describe('syncAllData', () => {
    beforeEach(() => {
      unleashedERPService.isConnected = true

      // Mock all sync methods
      vi.spyOn(unleashedERPService, 'syncProductionData').mockResolvedValue({
        metrics: { activeBatches: 3, completedToday: 5, qualityScore: 96.5, utilizationRate: 85 },
        schedule: [],
        alerts: []
      })
      vi.spyOn(unleashedERPService, 'syncInventoryData').mockResolvedValue({
        metrics: { totalItems: 150, totalValue: 50000, lowStockItems: 5, zeroStockItems: 2 },
        alerts: []
      })
      vi.spyOn(unleashedERPService, 'syncSalesOrderData').mockResolvedValue({
        metrics: { totalOrders: 25, totalValue: 75000, pendingOrders: 5, fulfilledOrders: 20 }
      })
      vi.spyOn(unleashedERPService, 'syncPurchaseOrderData').mockResolvedValue({
        metrics: { totalOrders: 10, totalValue: 30000, pendingOrders: 3 }
      })
      vi.spyOn(unleashedERPService, 'syncResourceData').mockResolvedValue({
        metrics: { activeJobs: 3, plannedJobs: 7, totalCapacity: 4, averageUtilization: 75.0 }
      })
    })

    it('should perform full data sync successfully', async () => {
      redisCacheService.set.mockResolvedValue()

      const result = await unleashedERPService.syncAllData()

      expect(emitUnleashedSyncStarted).toHaveBeenCalled()
      expect(unleashedERPService.syncProductionData).toHaveBeenCalled()
      expect(unleashedERPService.syncInventoryData).toHaveBeenCalled()
      expect(unleashedERPService.syncSalesOrderData).toHaveBeenCalled()
      expect(unleashedERPService.syncPurchaseOrderData).toHaveBeenCalled()
      expect(unleashedERPService.syncResourceData).toHaveBeenCalled()
      expect(result.production.activeBatches).toBe(3)
      expect(result.production.qualityScore).toBe(96.5)
      expect(emitUnleashedSyncCompleted).toHaveBeenCalled()
    })

    it('should skip sync when not connected', async () => {
      unleashedERPService.isConnected = false

      const result = await unleashedERPService.syncAllData()

      expect(result).toBeUndefined()
      expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('Not connected'))
      expect(unleashedERPService.syncProductionData).not.toHaveBeenCalled()
    })

    it('should handle sync errors and emit error event', async () => {
      unleashedERPService.syncProductionData.mockRejectedValue(new Error('Sync failed'))

      await expect(unleashedERPService.syncAllData()).rejects.toThrow('Sync failed')
      expect(emitUnleashedSyncError).toHaveBeenCalledWith({
        error: 'Sync failed',
        timestamp: expect.any(String)
      })
    })
  })

  describe('helper methods', () => {
    it('should calculate quality score correctly', () => {
      const jobs = [
        { JobStatus: 'Completed', PlannedQuantity: 100, ActualQuantity: 100 }, // Good
        { JobStatus: 'Completed', PlannedQuantity: 100, ActualQuantity: 96 }, // Good (>95%)
        { JobStatus: 'Completed', PlannedQuantity: 100, ActualQuantity: 92 }, // Bad (<95%)
        { JobStatus: 'InProgress', PlannedQuantity: 100, ActualQuantity: 50 } // Not completed
      ]

      const qualityScore = unleashedERPService.calculateQualityScore(jobs)

      // 2 out of 3 completed jobs are good quality = 66.67%
      expect(qualityScore).toBeCloseTo(66.67, 0)
    })

    it('should return default quality score when no completed jobs', () => {
      const jobs = [
        { JobStatus: 'InProgress', PlannedQuantity: 100, ActualQuantity: 50 }
      ]

      const qualityScore = unleashedERPService.calculateQualityScore(jobs)

      expect(qualityScore).toBe(95.0)
    })

    it('should detect quality issues correctly', () => {
      const goodJob = { PlannedQuantity: 100, ActualQuantity: 96 }
      const badJob = { PlannedQuantity: 100, ActualQuantity: 92 }

      expect(unleashedERPService.hasQualityIssues(goodJob)).toBe(false)
      expect(unleashedERPService.hasQualityIssues(badJob)).toBe(true)
    })

    it('should calculate utilization rate correctly', () => {
      const jobs = [
        { JobStatus: 'InProgress' },
        { JobStatus: 'InProgress' },
        { JobStatus: 'Planned' }
      ]

      const utilization = unleashedERPService.calculateUtilizationRate(jobs)

      // 2 active jobs / 4 capacity = 50%
      expect(utilization).toBe(50)
    })

    it('should cap utilization rate at 100%', () => {
      const jobs = Array(10).fill({ JobStatus: 'InProgress' })

      const utilization = unleashedERPService.calculateUtilizationRate(jobs)

      expect(utilization).toBe(100)
    })
  })

  describe('disconnect', () => {
    it('should disconnect and cleanup resources', async () => {
      unleashedERPService.isConnected = true
      unleashedERPService.syncInterval = setInterval(() => {}, 1000)

      await unleashedERPService.disconnect()

      expect(unleashedERPService.isConnected).toBe(false)
      expect(unleashedERPService.syncInterval).toBeNull()
    })
  })

  describe('getConnectionStatus', () => {
    it('should return connection status information', () => {
      unleashedERPService.isConnected = true

      const status = unleashedERPService.getConnectionStatus()

      expect(status.connected).toBe(true)
      expect(status.apiEndpoint).toBe('https://api.unleashedsoftware.com')
      expect(status.syncInterval).toBe('15 minutes')
    })
  })

  describe('getConsolidatedData', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        production: { activeBatches: 3, completedToday: 5 },
        lastUpdated: '2025-10-20T10:00:00Z'
      }

      redisCacheService.get.mockResolvedValue(cachedData)

      const result = await unleashedERPService.getConsolidatedData()

      expect(result).toEqual(cachedData)
      expect(redisCacheService.get).toHaveBeenCalledWith('unleashed:consolidated_data')
    })

    it('should trigger sync when cache is empty', async () => {
      redisCacheService.get.mockResolvedValue(null)
      vi.spyOn(unleashedERPService, 'syncAllData').mockResolvedValue({
        production: { activeBatches: 2 },
        lastUpdated: new Date().toISOString()
      })

      const result = await unleashedERPService.getConsolidatedData()

      expect(unleashedERPService.syncAllData).toHaveBeenCalled()
      expect(result.production.activeBatches).toBe(2)
    })

    it('should handle errors gracefully', async () => {
      redisCacheService.get.mockRejectedValue(new Error('Cache error'))

      const result = await unleashedERPService.getConsolidatedData()

      expect(result.error).toBe('Cache error')
      expect(result.production.activeBatches).toBe(0)
      expect(result.qualityAlerts).toEqual([])
    })
  })
})
