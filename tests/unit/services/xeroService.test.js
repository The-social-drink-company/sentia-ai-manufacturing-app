/**
 * XeroService Unit Tests
 *
 * Tests for Xero API integration service with OAuth flow, working capital data,
 * and retry logic
 *
 * Test Coverage:
 * - OAuth authentication and token refresh
 * - Working capital data fetching (AR, AP, cash flow)
 * - Account and invoice data retrieval
 * - Error handling and retry logic
 * - Rate limiting and caching
 * - SSE event emissions
 *
 * @module tests/unit/services/xeroService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import xeroService from '../../../services/xeroService.js'

// Mock dependencies
const mockXeroClient = {
  setTokenSet: vi.fn(),
  refreshToken: vi.fn(),
  accountingApi: {
    getOrganisations: vi.fn(),
    getAccounts: vi.fn(),
    getInvoices: vi.fn(),
    getContacts: vi.fn(),
    getBankTransactions: vi.fn(),
  },
}

const mockTokenSet = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  expires_at: Date.now() + 3600000, // 1 hour from now
}

// Mock xero-node package
vi.mock('xero-node', () => ({
  __esModule: true,
  default: {
    XeroClient: vi.fn(() => mockXeroClient),
    TokenSet: vi.fn((tokens) => ({ ...tokens })),
  },
  XeroClient: vi.fn(() => mockXeroClient),
  TokenSet: vi.fn((tokens) => ({ ...tokens })),
}))

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}))

// Mock Redis cache
vi.mock('../../../services/redis-cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    generateCacheKey: vi.fn((service, type) => `${service}:${type}`),
  },
}))

// Mock SSE service
vi.mock('../../../server/services/sse/index.cjs', () => ({
  default: {
    emit: vi.fn(),
    broadcast: vi.fn(),
  },
}))

describe('XeroService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup environment variables
    process.env.XERO_CLIENT_ID = 'test_client_id'
    process.env.XERO_CLIENT_SECRET = 'test_client_secret'
    process.env.XERO_REDIRECT_URI = 'http://localhost:3000/callback'

    // Reset singleton state
    xeroService.isConnected = false
    xeroService.tokenSet = null
    xeroService.organizationId = null
    xeroService.tenantId = null
    xeroService.xero = null
    xeroService.initialized = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Environment Validation', () => {
    it('should validate required environment variables', () => {
      const result = xeroService.validateEnvironmentVariables()

      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.missing).toEqual([])
      expect(result.invalid).toEqual([])
    })

    it('should detect missing XERO_CLIENT_ID', () => {
      delete process.env.XERO_CLIENT_ID

      const result = xeroService.validateEnvironmentVariables()

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('XERO_CLIENT_ID')
      expect(result.error).toContain('Missing')
    })

    it('should detect missing XERO_CLIENT_SECRET', () => {
      delete process.env.XERO_CLIENT_SECRET

      const result = xeroService.validateEnvironmentVariables()

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('XERO_CLIENT_SECRET')
    })

    it('should detect invalid (empty string) environment variables', () => {
      process.env.XERO_CLIENT_ID = ''

      const result = xeroService.validateEnvironmentVariables()

      expect(result.valid).toBe(false)
      expect(result.invalid).toContain('XERO_CLIENT_ID')
    })

    it('should validate multiple missing variables', () => {
      delete process.env.XERO_CLIENT_ID
      delete process.env.XERO_CLIENT_SECRET

      const result = xeroService.validateEnvironmentVariables()

      expect(result.valid).toBe(false)
      expect(result.missing).toHaveLength(2)
      expect(result.error).toContain('XERO_CLIENT_ID')
      expect(result.error).toContain('XERO_CLIENT_SECRET')
    })
  })

  describe('Client Initialization', () => {
    it('should initialize Xero client with valid credentials', () => {
      xeroService.initializeXeroClient()

      expect(xeroService.xero).toBeDefined()
      expect(xeroService.initialized).toBe(false) // Not fully initialized until authenticated
    })

    it('should fail to initialize with invalid credentials', () => {
      delete process.env.XERO_CLIENT_ID

      xeroService.initializeXeroClient()

      expect(xeroService.xero).toBeNull()
    })

    it('should set proper retry configuration', () => {
      xeroService.initializeXeroClient()

      expect(xeroService.maxRetries).toBe(3)
      expect(xeroService.retryAttempts).toBe(0)
    })
  })

  describe('Authentication', () => {
    beforeEach(() => {
      xeroService.initializeXeroClient()
      xeroService.xero = mockXeroClient
    })

    it('should authenticate with valid token set', async () => {
      xeroService.tokenSet = mockTokenSet
      mockXeroClient.accountingApi.getOrganisations.mockResolvedValue({
        body: {
          organisations: [
            {
              organisationID: 'org-123',
              name: 'Test Organization',
              version: 'AU',
            },
          ],
        },
      })

      await xeroService.authenticate()

      expect(xeroService.isConnected).toBe(true)
      expect(xeroService.organizationId).toBe('org-123')
      expect(mockXeroClient.setTokenSet).toHaveBeenCalledWith(mockTokenSet)
    })

    it('should fail authentication with expired token', async () => {
      const expiredToken = {
        ...mockTokenSet,
        expires_at: Date.now() - 3600000, // 1 hour ago
      }
      xeroService.tokenSet = expiredToken

      mockXeroClient.refreshToken.mockRejectedValue(new Error('Token expired'))

      await expect(xeroService.authenticate()).rejects.toThrow()
      expect(xeroService.isConnected).toBe(false)
    })

    it('should refresh token when expired', async () => {
      const expiredToken = {
        ...mockTokenSet,
        expires_at: Date.now() - 1000,
      }
      xeroService.tokenSet = expiredToken

      const newTokenSet = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_at: Date.now() + 3600000,
      }

      mockXeroClient.refreshToken.mockResolvedValue(newTokenSet)
      mockXeroClient.accountingApi.getOrganisations.mockResolvedValue({
        body: {
          organisations: [{ organisationID: 'org-123', name: 'Test Org' }],
        },
      })

      await xeroService.authenticate()

      expect(mockXeroClient.refreshToken).toHaveBeenCalled()
      expect(xeroService.tokenSet).toEqual(newTokenSet)
    })

    it('should handle organization lookup failure', async () => {
      xeroService.tokenSet = mockTokenSet
      mockXeroClient.accountingApi.getOrganisations.mockRejectedValue(
        new Error('API Error')
      )

      await expect(xeroService.authenticate()).rejects.toThrow('API Error')
      expect(xeroService.isConnected).toBe(false)
    })

    it('should select first organization from multiple', async () => {
      xeroService.tokenSet = mockTokenSet
      mockXeroClient.accountingApi.getOrganisations.mockResolvedValue({
        body: {
          organisations: [
            { organisationID: 'org-1', name: 'Org 1' },
            { organisationID: 'org-2', name: 'Org 2' },
          ],
        },
      })

      await xeroService.authenticate()

      expect(xeroService.organizationId).toBe('org-1')
    })
  })

  describe('Working Capital Data', () => {
    beforeEach(async () => {
      xeroService.initializeXeroClient()
      xeroService.xero = mockXeroClient
      xeroService.tokenSet = mockTokenSet
      xeroService.isConnected = true
      xeroService.organizationId = 'org-123'
      xeroService.tenantId = 'tenant-123'
    })

    it('should fetch accounts receivable data', async () => {
      const mockAccounts = {
        body: {
          accounts: [
            {
              accountID: 'acc-1',
              code: '200',
              name: 'Accounts Receivable',
              type: 'CURRENT',
              taxType: 'NONE',
              enablePaymentsToAccount: false,
            },
          ],
        },
      }

      const mockInvoices = {
        body: {
          invoices: [
            {
              invoiceID: 'inv-1',
              type: 'ACCREC',
              status: 'AUTHORISED',
              total: 1500.0,
              amountDue: 1500.0,
              date: '2025-10-01',
              dueDate: '2025-10-31',
            },
            {
              invoiceID: 'inv-2',
              type: 'ACCREC',
              status: 'AUTHORISED',
              total: 2500.0,
              amountDue: 1000.0,
              date: '2025-09-15',
              dueDate: '2025-10-15',
            },
          ],
        },
      }

      mockXeroClient.accountingApi.getAccounts.mockResolvedValue(mockAccounts)
      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoices)

      const result = await xeroService.getAccountsReceivable()

      expect(result.success).toBe(true)
      expect(result.data.totalReceivable).toBe(2500.0)
      expect(result.data.invoiceCount).toBe(2)
      expect(result.data.overdueInvoices).toBeGreaterThan(0)
    })

    it('should fetch accounts payable data', async () => {
      const mockInvoices = {
        body: {
          invoices: [
            {
              invoiceID: 'bill-1',
              type: 'ACCPAY',
              status: 'AUTHORISED',
              total: 5000.0,
              amountDue: 5000.0,
              date: '2025-10-01',
              dueDate: '2025-10-31',
            },
          ],
        },
      }

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue(mockInvoices)

      const result = await xeroService.getAccountsPayable()

      expect(result.success).toBe(true)
      expect(result.data.totalPayable).toBe(5000.0)
      expect(result.data.invoiceCount).toBe(1)
    })

    it('should calculate working capital metrics', async () => {
      // Mock AR data
      mockXeroClient.accountingApi.getInvoices.mockImplementation((tenantId, whereClause) => {
        if (whereClause?.includes('ACCREC')) {
          return Promise.resolve({
            body: {
              invoices: [
                {
                  type: 'ACCREC',
                  total: 10000.0,
                  amountDue: 10000.0,
                  date: '2025-10-01',
                },
              ],
            },
          })
        } else if (whereClause?.includes('ACCPAY')) {
          return Promise.resolve({
            body: {
              invoices: [
                {
                  type: 'ACCPAY',
                  total: 8000.0,
                  amountDue: 8000.0,
                  date: '2025-10-01',
                },
              ],
            },
          })
        }
        return Promise.resolve({ body: { invoices: [] } })
      })

      const result = await xeroService.getWorkingCapital()

      expect(result.success).toBe(true)
      expect(result.data.accountsReceivable).toBe(10000.0)
      expect(result.data.accountsPayable).toBe(8000.0)
      expect(result.data.workingCapital).toBe(2000.0) // AR - AP
    })

    it('should handle missing invoices gracefully', async () => {
      mockXeroClient.accountingApi.getInvoices.mockResolvedValue({
        body: { invoices: [] },
      })

      const result = await xeroService.getAccountsReceivable()

      expect(result.success).toBe(true)
      expect(result.data.totalReceivable).toBe(0)
      expect(result.data.invoiceCount).toBe(0)
    })

    it('should cache working capital data', async () => {
      const redisCache = (await import('../../../services/redis-cache.js')).default

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue({
        body: { invoices: [] },
      })

      await xeroService.getWorkingCapital()

      expect(redisCache.set).toHaveBeenCalledWith(
        expect.stringContaining('xero'),
        expect.any(Object),
        expect.any(Number)
      )
    })
  })

  describe('Error Handling & Retry Logic', () => {
    beforeEach(() => {
      xeroService.initializeXeroClient()
      xeroService.xero = mockXeroClient
      xeroService.tokenSet = mockTokenSet
      xeroService.isConnected = true
      xeroService.organizationId = 'org-123'
      xeroService.tenantId = 'tenant-123'
    })

    it('should retry on rate limit error (429)', async () => {
      let callCount = 0
      mockXeroClient.accountingApi.getInvoices.mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          const error = new Error('Rate limit exceeded')
          error.response = { status: 429, headers: { 'retry-after': '1' } }
          throw error
        }
        return Promise.resolve({ body: { invoices: [] } })
      })

      const result = await xeroService.getAccountsReceivable()

      expect(result.success).toBe(true)
      expect(callCount).toBe(3)
    })

    it('should fail after max retries', async () => {
      mockXeroClient.accountingApi.getInvoices.mockImplementation(() => {
        const error = new Error('Rate limit exceeded')
        error.response = { status: 429 }
        throw error
      })

      await expect(xeroService.getAccountsReceivable()).rejects.toThrow()
      expect(mockXeroClient.accountingApi.getInvoices).toHaveBeenCalledTimes(4) // 1 + 3 retries
    })

    it('should handle network errors gracefully', async () => {
      mockXeroClient.accountingApi.getInvoices.mockRejectedValue(
        new Error('Network error: ECONNREFUSED')
      )

      const result = await xeroService.getAccountsReceivable()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should handle token expiry during API call', async () => {
      const tokenExpiredError = new Error('Token expired')
      tokenExpiredError.response = { status: 401 }

      mockXeroClient.accountingApi.getInvoices.mockRejectedValueOnce(tokenExpiredError)

      // After refresh, should succeed
      mockXeroClient.refreshToken.mockResolvedValue({
        ...mockTokenSet,
        access_token: 'new_token',
      })
      mockXeroClient.accountingApi.getInvoices.mockResolvedValueOnce({
        body: { invoices: [] },
      })

      const result = await xeroService.getAccountsReceivable()

      expect(mockXeroClient.refreshToken).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should emit SSE event on sync error', async () => {
      const sseService = (await import('../../../server/services/sse/index.cjs')).default

      mockXeroClient.accountingApi.getInvoices.mockRejectedValue(
        new Error('API Error')
      )

      await xeroService.getAccountsReceivable()

      expect(sseService.broadcast).toHaveBeenCalledWith(
        expect.stringContaining('xero'),
        expect.objectContaining({ error: expect.any(String) })
      )
    })
  })

  describe('Data Sync Operations', () => {
    beforeEach(() => {
      xeroService.initializeXeroClient()
      xeroService.xero = mockXeroClient
      xeroService.isConnected = true
      xeroService.organizationId = 'org-123'
      xeroService.tenantId = 'tenant-123'
    })

    it('should sync all data successfully', async () => {
      mockXeroClient.accountingApi.getInvoices.mockResolvedValue({
        body: { invoices: [] },
      })
      mockXeroClient.accountingApi.getAccounts.mockResolvedValue({
        body: { accounts: [] },
      })
      mockXeroClient.accountingApi.getBankTransactions.mockResolvedValue({
        body: { bankTransactions: [] },
      })

      const result = await xeroService.syncAllData()

      expect(result.success).toBe(true)
      expect(result.syncTime).toBeDefined()
    })

    it('should track sync timestamp', async () => {
      mockXeroClient.accountingApi.getInvoices.mockResolvedValue({
        body: { invoices: [] },
      })

      const beforeSync = Date.now()
      await xeroService.syncAllData()
      const afterSync = Date.now()

      expect(xeroService.lastSyncTime).toBeDefined()
      const syncTime = new Date(xeroService.lastSyncTime).getTime()
      expect(syncTime).toBeGreaterThanOrEqual(beforeSync)
      expect(syncTime).toBeLessThanOrEqual(afterSync)
    })

    it('should emit sync started event', async () => {
      const sseService = (await import('../../../server/services/sse/index.cjs')).default

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue({
        body: { invoices: [] },
      })

      await xeroService.syncAllData()

      expect(sseService.broadcast).toHaveBeenCalledWith(
        expect.stringContaining('xero-sync-started'),
        expect.any(Object)
      )
    })

    it('should emit sync completed event', async () => {
      const sseService = (await import('../../../server/services/sse/index.cjs')).default

      mockXeroClient.accountingApi.getInvoices.mockResolvedValue({
        body: { invoices: [] },
      })

      await xeroService.syncAllData()

      expect(sseService.broadcast).toHaveBeenCalledWith(
        expect.stringContaining('xero-sync-completed'),
        expect.any(Object)
      )
    })
  })

  describe('Cache Management', () => {
    beforeEach(() => {
      xeroService.initializeXeroClient()
      xeroService.xero = mockXeroClient
      xeroService.isConnected = true
      xeroService.organizationId = 'org-123'
      xeroService.tenantId = 'tenant-123'
    })

    it('should return cached data when available', async () => {
      const redisCache = (await import('../../../services/redis-cache.js')).default

      const cachedData = {
        success: true,
        data: { totalReceivable: 5000.0 },
      }

      redisCache.get.mockResolvedValue(cachedData)

      const result = await xeroService.getAccountsReceivable()

      expect(result).toEqual(cachedData)
      expect(mockXeroClient.accountingApi.getInvoices).not.toHaveBeenCalled()
    })

    it('should cache data with 30 minute TTL', async () => {
      const redisCache = (await import('../../../services/redis-cache.js')).default

      redisCache.get.mockResolvedValue(null)
      mockXeroClient.accountingApi.getInvoices.mockResolvedValue({
        body: { invoices: [] },
      })

      await xeroService.getAccountsReceivable()

      expect(redisCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        1800 // 30 minutes in seconds
      )
    })

    it('should bypass cache when force refresh requested', async () => {
      const redisCache = (await import('../../../services/redis-cache.js')).default

      redisCache.get.mockResolvedValue({ success: true, data: {} })
      mockXeroClient.accountingApi.getInvoices.mockResolvedValue({
        body: { invoices: [] },
      })

      await xeroService.getAccountsReceivable({ forceRefresh: true })

      expect(mockXeroClient.accountingApi.getInvoices).toHaveBeenCalled()
    })
  })

  describe('Connection Status', () => {
    it('should return disconnected status initially', () => {
      const status = xeroService.getConnectionStatus()

      expect(status.connected).toBe(false)
      expect(status.lastSync).toBeNull()
    })

    it('should return connected status after authentication', async () => {
      xeroService.initializeXeroClient()
      xeroService.xero = mockXeroClient
      xeroService.tokenSet = mockTokenSet
      xeroService.isConnected = true
      xeroService.organizationId = 'org-123'

      const status = xeroService.getConnectionStatus()

      expect(status.connected).toBe(true)
      expect(status.organizationId).toBe('org-123')
    })

    it('should include last sync timestamp in status', async () => {
      xeroService.lastSyncTime = '2025-10-23T10:00:00Z'

      const status = xeroService.getConnectionStatus()

      expect(status.lastSync).toBe('2025-10-23T10:00:00Z')
    })
  })

  describe('Disconnect', () => {
    it('should clear connection state on disconnect', async () => {
      xeroService.isConnected = true
      xeroService.tokenSet = mockTokenSet
      xeroService.organizationId = 'org-123'

      await xeroService.disconnect()

      expect(xeroService.isConnected).toBe(false)
      expect(xeroService.tokenSet).toBeNull()
    })

    it('should handle disconnect when not connected', async () => {
      await expect(xeroService.disconnect()).resolves.not.toThrow()
    })
  })
})
