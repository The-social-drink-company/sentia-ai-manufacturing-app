/**
 * XeroService Unit Tests
 *
 * Tests for Xero API integration service with custom connection OAuth flow,
 * working capital calculations, and real enterprise financial data.
 *
 * Test Coverage:
 * - Environment variable validation
 * - Client initialization and authentication
 * - Working capital calculations (calculateWorkingCapital)
 * - Financial reports (getProfitAndLoss, getCashFlow, getBalanceSheet)
 * - Error handling and retry logic
 * - Health checks and connection status
 *
 * @module tests/unit/services/xeroService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import xeroService from '../../../services/xeroService.js'

// Mock dependencies
const mockXeroClient = {
  setTokenSet: vi.fn(),
  accountingApi: {
    getOrganisations: vi.fn(),
    getReportBalanceSheet: vi.fn(),
    getReportProfitAndLoss: vi.fn(),
    getReportBankSummary: vi.fn(),
  },
}

// Mock xero-node package
vi.mock('xero-node', () => ({
  __esModule: true,
  default: {
    XeroClient: vi.fn(() => mockXeroClient),
  },
  XeroClient: vi.fn(() => mockXeroClient),
}))

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}))

// Mock fetch for token requests
global.fetch = vi.fn()

describe('XeroService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup environment variables
    process.env.XERO_CLIENT_ID = 'test_client_id'
    process.env.XERO_CLIENT_SECRET = 'test_client_secret'

    // Reset singleton state
    xeroService.isConnected = false
    xeroService.organizationId = null
    xeroService.tenantId = null
    xeroService.xero = null
    xeroService.initialized = false
    xeroService.lastSyncTime = null
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

    it('should detect empty string environment variables', () => {
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

    it('should fail to initialize with missing credentials', () => {
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

    it('should authenticate with custom connection token', async () => {
      // Mock successful token exchange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'mock_access_token',
          token_type: 'Bearer',
          expires_in: 1800,
          scope: 'accounting.transactions.read'
        })
      })

      // Mock connections API
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([{
          id: 'conn-123',
          tenantId: 'tenant-123',
          tenantType: 'ORGANISATION',
          tenantName: 'Test Organization'
        }])
      })

      // Mock organizations API
      mockXeroClient.accountingApi.getOrganisations.mockResolvedValue({
        body: {
          organisations: [{
            organisationID: 'org-123',
            name: 'Test Organization',
          }]
        }
      })

      const result = await xeroService.authenticate()

      expect(result).toBe(true)
      expect(xeroService.isConnected).toBe(true)
      expect(xeroService.organizationId).toBe('org-123')
      expect(xeroService.tenantId).toBe('tenant-123')
    })

    it('should fail authentication with invalid credentials', async () => {
      // Mock failed token exchange
      global.fetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid credentials'
      })

      const result = await xeroService.authenticate()

      expect(result).toBe(false)
      expect(xeroService.isConnected).toBe(false)
    })

    it('should handle no tenant connections', async () => {
      // Mock successful token exchange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'mock_access_token',
          expires_in: 1800
        })
      })

      // Mock empty connections
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })

      const result = await xeroService.authenticate()

      expect(result).toBe(false)
      expect(xeroService.isConnected).toBe(false)
    })
  })

  describe('Working Capital Calculations', () => {
    beforeEach(async () => {
      xeroService.initializeXeroClient()
      xeroService.xero = mockXeroClient
      xeroService.isConnected = true
      xeroService.organizationId = 'org-123'
      xeroService.tenantId = 'tenant-123'
    })

    it('should calculate working capital from balance sheet', async () => {
      // Mock balance sheet API
      mockXeroClient.accountingApi.getReportBalanceSheet.mockResolvedValue({
        body: {
          reports: [{
            reportID: 'bs-123',
            reportName: 'Balance Sheet',
            reportDate: '2025-10-20',
            rows: [
              {
                cells: [{ value: 'Cash and Cash Equivalents' }, { value: 50000 }]
              },
              {
                cells: [{ value: 'Accounts Receivable' }, { value: 25000 }]
              },
              {
                cells: [{ value: 'Inventory' }, { value: 30000 }]
              },
              {
                cells: [{ value: 'Accounts Payable' }, { value: 20000 }]
              },
              {
                cells: [{ value: 'Short-term Debt' }, { value: 10000 }]
              }
            ]
          }]
        }
      })

      // Mock P&L API for CCC calculation
      mockXeroClient.accountingApi.getReportProfitAndLoss.mockResolvedValue({
        body: {
          reports: [{
            reportID: 'pl-123',
            reportDate: '2025-10-20',
            rows: [
              { cells: [{ value: 'Revenue' }, { value: 100000 }] },
              { cells: [{ value: 'Total Expenses' }, { value: 65000 }] }
            ]
          }]
        }
      })

      const result = await xeroService.calculateWorkingCapital()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.currentAssets).toBe(105000) // 50k + 25k + 30k
      expect(result.data.currentLiabilities).toBe(30000) // 20k + 10k
      expect(result.data.workingCapital).toBe(75000) // 105k - 30k
      expect(result.dataSource).toBe('xero_api')
    })

    it('should return setup instructions when not connected', async () => {
      xeroService.isConnected = false

      const result = await xeroService.calculateWorkingCapital()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Xero authentication required')
      expect(result.dataSource).toBe('authentication_required')
    })

    it('should handle API errors gracefully', async () => {
      mockXeroClient.accountingApi.getReportBalanceSheet.mockRejectedValue(
        new Error('API Error')
      )

      const result = await xeroService.calculateWorkingCapital()

      expect(result.success).toBe(false)
      expect(result.error).toContain('API Error')
      expect(result.dataSource).toBe('xero_api_error')
    })
  })

  describe('Financial Reports', () => {
    beforeEach(() => {
      xeroService.initializeXeroClient()
      xeroService.xero = mockXeroClient
      xeroService.isConnected = true
      xeroService.tenantId = 'tenant-123'
    })

    it('should fetch profit and loss report', async () => {
      mockXeroClient.accountingApi.getReportProfitAndLoss.mockResolvedValue({
        body: {
          reports: [{
            reportID: 'pl-123',
            reportName: 'Profit and Loss',
            reportDate: '2025-10-20',
            rows: [
              { cells: [{ value: 'Revenue' }, { value: 150000 }] },
              { cells: [{ value: 'Total Expenses' }, { value: 100000 }] },
              { cells: [{ value: 'Net Profit' }, { value: 50000 }] }
            ]
          }]
        }
      })

      const result = await xeroService.getProfitAndLoss(3)

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].totalRevenue).toBe(150000)
      expect(result[0].totalExpenses).toBe(100000)
      expect(result[0].netProfit).toBe(50000)
    })

    it('should fetch cash flow report', async () => {
      mockXeroClient.accountingApi.getReportBankSummary.mockResolvedValue({
        body: {
          reports: [{
            reportID: 'cf-123',
            reportName: 'Cash Flow',
            reportDate: '2025-10-20',
            rows: [
              { cells: [{ value: 'Main Bank Account' }, { value: 75000 }] },
              { cells: [{ value: 'Savings Account' }, { value: 25000 }] }
            ]
          }]
        }
      })

      const result = await xeroService.getCashFlow(3)

      expect(result).toBeDefined()
      expect(result.bankAccounts).toBeDefined()
      expect(result.lastUpdated).toBeDefined()
    })

    it('should fetch balance sheet', async () => {
      mockXeroClient.accountingApi.getReportBalanceSheet.mockResolvedValue({
        body: {
          reports: [{
            reportID: 'bs-123',
            reportName: 'Balance Sheet',
            reportDate: '2025-10-20',
            rows: []
          }]
        }
      })

      const result = await xeroService.getBalanceSheet(2)

      expect(result).toBeDefined()
      expect(result.reportName).toBe('Balance Sheet')
      expect(result.lastUpdated).toBeDefined()
    })
  })

  describe('Health Check', () => {
    it('should return configuration error when env vars missing', async () => {
      delete process.env.XERO_CLIENT_ID

      const result = await xeroService.healthCheck()

      expect(result.status).toBe('configuration_error')
      expect(result.message).toContain('XERO_CLIENT_ID')
    })

    it('should return connected status when authenticated', async () => {
      xeroService.xero = mockXeroClient
      xeroService.isConnected = true
      xeroService.organizationId = 'org-123'
      xeroService.tenantId = 'tenant-123'
      xeroService.initialized = true

      mockXeroClient.accountingApi.getOrganisations.mockResolvedValue({
        body: { organisations: [{ organisationID: 'org-123' }] }
      })

      const result = await xeroService.healthCheck()

      expect(result.status).toBe('connected')
      expect(result.organizationId).toBe('org-123')
      expect(result.tenantId).toBe('tenant-123')
    })

    it('should return not_authenticated when not connected', async () => {
      xeroService.xero = mockXeroClient
      xeroService.isConnected = false
      xeroService.initialized = true

      const result = await xeroService.healthCheck()

      expect(result.status).toBe('not_authenticated')
    })
  })

  describe('Disconnect', () => {
    it('should clear connection state on disconnect', async () => {
      xeroService.isConnected = true
      xeroService.organizationId = 'org-123'
      xeroService.tenantId = 'tenant-123'

      await xeroService.disconnect()

      expect(xeroService.isConnected).toBe(false)
      expect(xeroService.organizationId).toBeNull()
      expect(xeroService.tenantId).toBeNull()
    })

    it('should handle disconnect when not connected', async () => {
      await expect(xeroService.disconnect()).resolves.not.toThrow()
    })
  })
})
