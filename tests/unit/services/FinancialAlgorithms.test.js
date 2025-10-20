/**
 * Unit Tests for FinancialAlgorithms Service
 *
 * Tests cover:
 * - Working capital calculations
 * - Cash conversion cycle
 * - Revenue forecasting
 * - Cash flow analysis
 * - Inventory optimization
 * - KPI calculations
 * - Helper methods (EOQ, reorder point, ABC analysis)
 *
 * @see src/services/FinancialAlgorithms.js
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock fetch globally before importing FinancialAlgorithms
global.fetch = vi.fn()

// Import after fetch is mocked
const FinancialAlgorithms = (await import('../../../src/services/FinancialAlgorithms.js')).default

describe('FinancialAlgorithms', () => {
  let financialAlgorithms

  beforeEach(() => {
    vi.clearAllMocks()
    financialAlgorithms = new FinancialAlgorithms()

    // Set development mode to false to test real API paths
    financialAlgorithms.allowDevFallback = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('calculateWorkingCapital', () => {
    it('should calculate working capital with all components', async () => {
      // Mock data fetching methods
      vi.spyOn(financialAlgorithms, 'getInventoryData').mockResolvedValue({
        totalValue: 850000,
      })
      vi.spyOn(financialAlgorithms, 'getReceivablesData').mockResolvedValue({
        totalAmount: 275000,
      })
      vi.spyOn(financialAlgorithms, 'getPayablesData').mockResolvedValue({
        totalAmount: 198000,
      })
      vi.spyOn(financialAlgorithms, 'getCashFlowData').mockResolvedValue({
        currentCash: 315000,
      })

      const result = await financialAlgorithms.calculateWorkingCapital()

      expect(result.current).toBe(1242000) // (850000 + 275000 + 315000) - 198000
      expect(result.ratio).toBeCloseTo(7.27, 1) // 1440000 / 198000
      expect(result.quickRatio).toBeCloseTo(2.98, 1) // (1440000 - 850000) / 198000
      expect(result.cashRatio).toBeCloseTo(1.59, 1) // 315000 / 198000
      expect(result.components).toMatchObject({
        inventory: 850000,
        receivables: 275000,
        payables: 198000,
        cash: 315000,
      })
    })

    it('should include trend analysis and forecasting', async () => {
      vi.spyOn(financialAlgorithms, 'getInventoryData').mockResolvedValue({ totalValue: 850000 })
      vi.spyOn(financialAlgorithms, 'getReceivablesData').mockResolvedValue({ totalAmount: 275000 })
      vi.spyOn(financialAlgorithms, 'getPayablesData').mockResolvedValue({ totalAmount: 198000 })
      vi.spyOn(financialAlgorithms, 'getCashFlowData').mockResolvedValue({ currentCash: 315000 })

      const result = await financialAlgorithms.calculateWorkingCapital()

      expect(result.trend).toBe('positive')
      expect(result.trendPercentage).toBe(15.5)
      expect(result.forecast).toHaveProperty('nextQuarter')
      expect(result.forecast).toHaveProperty('nextYear')
      expect(result.forecast.nextQuarter).toBeGreaterThan(result.current)
    })

    it('should throw error if data fetching fails', async () => {
      vi.spyOn(financialAlgorithms, 'getInventoryData').mockRejectedValue(
        new Error('API error')
      )

      await expect(financialAlgorithms.calculateWorkingCapital()).rejects.toThrow(
        'Failed to calculate working capital metrics'
      )
    })
  })

  describe('calculateEOQ (Economic Order Quantity)', () => {
    it('should calculate EOQ correctly', () => {
      const annualDemand = 14400
      const orderingCost = 250
      const holdingCost = 9.1

      const eoq = financialAlgorithms.calculateEOQ(annualDemand, orderingCost, holdingCost)

      // EOQ = sqrt((2 * 14400 * 250) / 9.1) = sqrt(789473.68) ≈ 889.5
      expect(eoq).toBeCloseTo(889.5, 0)
    })

    it('should handle zero holding cost', () => {
      const result = financialAlgorithms.calculateEOQ(14400, 250, 0)
      expect(result).toBe(Infinity)
    })

    it('should handle zero demand', () => {
      const result = financialAlgorithms.calculateEOQ(0, 250, 9.1)
      expect(result).toBe(0)
    })
  })

  describe('calculateReorderPoint', () => {
    it('should calculate reorder point correctly', () => {
      const leadTime = 14 // days
      const dailyDemand = 40 // units/day
      const safetyStock = 200 // units

      const reorderPoint = financialAlgorithms.calculateReorderPoint(
        leadTime,
        dailyDemand,
        safetyStock
      )

      expect(reorderPoint).toBe(760) // 14 * 40 + 200 = 760
    })

    it('should handle zero safety stock', () => {
      const result = financialAlgorithms.calculateReorderPoint(14, 40, 0)
      expect(result).toBe(560) // 14 * 40
    })

    it('should handle zero lead time', () => {
      const result = financialAlgorithms.calculateReorderPoint(0, 40, 200)
      expect(result).toBe(200) // Only safety stock
    })
  })

  describe('exponentialSmoothing', () => {
    it('should forecast using exponential smoothing', () => {
      const historicalData = [100, 120, 115, 130, 125]
      const periods = 3
      const alpha = 0.3

      const forecast = financialAlgorithms.exponentialSmoothing(historicalData, periods, alpha)

      expect(forecast).toHaveLength(3)
      expect(forecast[0]).toBeGreaterThan(100)
      expect(forecast[0]).toBeLessThan(130)
    })

    it('should use default alpha if not provided', () => {
      const historicalData = [100, 120, 115]
      const periods = 2

      const forecast = financialAlgorithms.exponentialSmoothing(historicalData, periods)

      expect(forecast).toHaveLength(2)
    })
  })

  describe('linearRegression', () => {
    it('should forecast using linear regression', () => {
      const historicalData = [100, 110, 120, 130, 140]
      const periods = 3

      const forecast = financialAlgorithms.linearRegression(historicalData, periods)

      expect(forecast).toHaveLength(3)
      // With linear trend of +10 per period, forecasts should be ~150, 160, 170
      expect(forecast[0]).toBeCloseTo(150, 0)
      expect(forecast[1]).toBeCloseTo(160, 0)
      expect(forecast[2]).toBeCloseTo(170, 0)
    })

    it('should handle flat data', () => {
      const historicalData = [100, 100, 100, 100]
      const periods = 2

      const forecast = financialAlgorithms.linearRegression(historicalData, periods)

      expect(forecast[0]).toBeCloseTo(100, 0)
      expect(forecast[1]).toBeCloseTo(100, 0)
    })
  })

  describe('performABCAnalysis', () => {
    it('should categorize items into A, B, C classes', () => {
      const items = [
        { id: 'SKU001', quantity: 1000, unitCost: 50 }, // 50000 (A)
        { id: 'SKU002', quantity: 500, unitCost: 40 }, // 20000 (A)
        { id: 'SKU003', quantity: 200, unitCost: 30 }, // 6000 (B)
        { id: 'SKU004', quantity: 100, unitCost: 10 }, // 1000 (C)
      ]

      const analysis = financialAlgorithms.performABCAnalysis(items)

      expect(analysis).toHaveLength(4)
      expect(analysis[0].category).toBe('A') // Highest value (64.9% cumulative)
      expect(analysis[1].category).toBe('B') // Second highest (90.9% cumulative)
      expect(analysis[2].category).toBe('C') // Third (98.7% cumulative)
      expect(analysis[3].category).toBe('C') // Lowest value
    })

    it('should calculate cumulative percentages', () => {
      const items = [
        { id: 'SKU001', quantity: 1000, unitCost: 100 }, // 100000
        { id: 'SKU002', quantity: 500, unitCost: 100 }, // 50000
      ]

      const analysis = financialAlgorithms.performABCAnalysis(items)

      expect(analysis[0].cumulativePercentage).toBeCloseTo(66.67, 1) // 100000/150000
      expect(analysis[1].cumulativePercentage).toBe(100) // 150000/150000
    })
  })

  describe('forecastWorkingCapital', () => {
    it('should forecast working capital growth', () => {
      const currentWC = 1000000

      const forecast = financialAlgorithms.forecastWorkingCapital(currentWC)

      expect(forecast.nextQuarter).toBeCloseTo(1050000, 0) // 5% growth
      expect(forecast.nextYear).toBeCloseTo(1180000, 0) // 18% growth
    })

    it('should handle zero working capital', () => {
      const forecast = financialAlgorithms.forecastWorkingCapital(0)

      expect(forecast.nextQuarter).toBe(0)
      expect(forecast.nextYear).toBe(0)
    })

    it('should handle non-numeric input', () => {
      const forecast = financialAlgorithms.forecastWorkingCapital(null)

      expect(forecast.nextQuarter).toBe(0)
      expect(forecast.nextYear).toBe(0)
    })
  })

  describe('getIndustryBenchmarks', () => {
    it('should return working capital benchmarks', () => {
      const benchmarks = financialAlgorithms.getIndustryBenchmarks('working_capital')

      expect(benchmarks).toHaveProperty('excellent')
      expect(benchmarks).toHaveProperty('good')
      expect(benchmarks).toHaveProperty('average')
      expect(benchmarks).toHaveProperty('poor')
      expect(benchmarks.excellent.min).toBe(2.0)
      expect(benchmarks.excellent.max).toBe(3.0)
    })
  })

  describe('generateWorkingCapitalRecommendations', () => {
    it('should recommend cash collection improvement for low ratio', () => {
      const recommendations = financialAlgorithms.generateWorkingCapitalRecommendations(
        1.1, // Low ratio
        1.5 // Good quick ratio
      )

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].priority).toBe('high')
      expect(recommendations[0].action).toContain('cash collection')
    })

    it('should recommend inventory reduction for low quick ratio', () => {
      const recommendations = financialAlgorithms.generateWorkingCapitalRecommendations(
        1.8, // Good ratio
        0.9 // Low quick ratio
      )

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].priority).toBe('medium')
      expect(recommendations[0].action).toContain('inventory')
    })

    it('should return multiple recommendations for poor metrics', () => {
      const recommendations = financialAlgorithms.generateWorkingCapitalRecommendations(
        1.1, // Low ratio
        0.9 // Low quick ratio
      )

      expect(recommendations).toHaveLength(2)
      expect(recommendations[0].priority).toBe('high')
      expect(recommendations[1].priority).toBe('medium')
    })

    it('should return no recommendations for healthy metrics', () => {
      const recommendations = financialAlgorithms.generateWorkingCapitalRecommendations(
        2.5, // Excellent ratio
        1.8 // Excellent quick ratio
      )

      expect(recommendations).toHaveLength(0)
    })
  })

  describe('getInventoryData (API integration)', () => {
    it('should fetch inventory data from Unleashed API', async () => {
      const mockInventoryData = {
        totalValue: 850000,
        averageInventory: 750000,
        cogs: 2500000,
        turnoverRatio: 3.33,
        items: [],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInventoryData,
      })

      const result = await financialAlgorithms.getInventoryData()

      expect(result).toMatchObject(mockInventoryData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/unleashed/inventory'),
        expect.any(Object)
      )
    })

    it('should throw error when API fails and no dev fallback', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      })

      await expect(financialAlgorithms.getInventoryData()).rejects.toThrow(
        'Inventory data unavailable'
      )
    })

    it('should use cached data if fresh', async () => {
      const cachedData = { totalValue: 850000 }
      financialAlgorithms.cache.set('inventory_data', {
        data: cachedData,
        timestamp: Date.now(),
      })

      const result = await financialAlgorithms.getInventoryData()

      expect(result).toEqual(cachedData)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should refresh stale cached data', async () => {
      const staleData = { totalValue: 700000 }
      const freshData = { totalValue: 850000 }

      financialAlgorithms.cache.set('inventory_data', {
        data: staleData,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes old (stale)
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => freshData,
      })

      const result = await financialAlgorithms.getInventoryData()

      expect(result).toEqual(freshData)
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('getReceivablesData (API integration)', () => {
    it('should fetch receivables from working capital API', async () => {
      const mockResponse = {
        latest: {
          accountsReceivable: 275000,
          periodEnd: '2025-10-20',
        },
        dataSource: 'database',
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await financialAlgorithms.getReceivablesData()

      expect(result.totalAmount).toBe(275000)
      expect(result.dataSource).toBe('database')
      expect(result.lastUpdated).toBe('2025-10-20')
    })

    it('should throw error when API fails and no dev fallback', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await expect(financialAlgorithms.getReceivablesData()).rejects.toThrow(
        'Receivables data unavailable'
      )
    })

    it('should handle array data format', async () => {
      const mockResponse = {
        data: [
          { accountsReceivable: 280000, date: '2025-10-20' },
          { accountsReceivable: 270000, date: '2025-09-20' },
        ],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await financialAlgorithms.getReceivablesData()

      expect(result.totalAmount).toBe(280000) // Should take first item
    })
  })

  describe('getPayablesData (API integration)', () => {
    it('should fetch payables from working capital API', async () => {
      const mockResponse = {
        latest: {
          accountsPayable: 198000,
          periodEnd: '2025-10-20',
        },
        dataSource: 'database',
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await financialAlgorithms.getPayablesData()

      expect(result.totalAmount).toBe(198000)
      expect(result.dataSource).toBe('database')
    })

    it('should throw error when API fails and no dev fallback', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(financialAlgorithms.getPayablesData()).rejects.toThrow(
        'Payables data unavailable'
      )
    })
  })

  describe('getCashFlowData (API integration)', () => {
    it('should fetch cash flow data from API', async () => {
      const mockResponse = {
        latest: {
          netCashFlow: 315000,
          operatingCashFlow: 125000,
          investingCashFlow: -45000,
          financingCashFlow: -15000,
          capitalExpenditures: 30000,
          currentLiabilities: 210000,
          totalDebt: 420000,
          date: '2025-10-20',
        },
        data: [],
        dataSource: 'database',
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await financialAlgorithms.getCashFlowData()

      expect(result.currentCash).toBe(315000)
      expect(result.operating).toBe(125000)
      expect(result.investing).toBe(-45000)
      expect(result.financing).toBe(-15000)
      expect(result.dataSource).toBe('database')
    })

    it('should throw error when API fails and no dev fallback', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      })

      await expect(financialAlgorithms.getCashFlowData()).rejects.toThrow(
        'Cash flow data unavailable'
      )
    })
  })

  describe('calculateTrend', () => {
    it('should return positive trend with percentage', () => {
      const trend = financialAlgorithms.calculateTrend()

      expect(trend).toHaveProperty('direction')
      expect(trend).toHaveProperty('percentage')
      expect(trend.direction).toBe('positive')
      expect(trend.percentage).toBe(15.5)
    })
  })
})
