import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  fetchWorkingCapitalMetrics,
  exportWorkingCapitalData,
  generateCashFlowForecast,
  generateWorkingCapitalForecast,
  generateOptimizationRecommendations,
  assessCashFlowRisk,
  createScenarioAnalysis
} from '../services/workingCapitalService'

// Mock the forecasting utilities
vi.mock('../utils/forecastingUtils.js', () => ({
  forecastingUtils: {
    generateCashFlowForecast: vi.fn(() => ({
      base: [
        { period: 1, cashInflow: 150000, cashOutflow: 120000, netCashFlow: 30000 },
        { period: 2, cashInflow: 160000, cashOutflow: 125000, netCashFlow: 35000 }
      ],
      optimistic: [
        { period: 1, cashInflow: 172500, cashOutflow: 114000, netCashFlow: 58500 }
      ]
    })),
    forecastWorkingCapitalMetrics: vi.fn(() => [
      { period: 'Jan 25', dso: 38, dio: 32, dpo: 35, ccc: 35, isForecast: false },
      { period: 'Forecast 1', dso: 36, dio: 30, dpo: 37, ccc: 29, isForecast: true }
    ]),
    generateOptimizationRecommendations: vi.fn(() => ({
      opportunities: [
        {
          metric: 'DSO',
          current: 42,
          target: 35,
          improvement: 7,
          potentialImpact: 125000,
          priority: 'High'
        }
      ],
      impact: {
        totalCashRelease: 125000,
        currentCCC: 42,
        optimizedCCC: 35,
        cccImprovement: 7,
        roi: 6250
      }
    })),
    assessCashFlowRisk: vi.fn(() => ({
      risks: [
        {
          type: 'Low Cash Warning',
          severity: 'warning',
          description: 'Cash balance forecast to fall below threshold',
          impact: 'Medium'
        }
      ],
      riskLevel: 'warning',
      summary: {
        totalRisks: 1,
        criticalRisks: 0,
        warningRisks: 1,
        volatility: 0.15
      }
    })),
    createScenarioModels: vi.fn(() => ({
      optimistic: [
        { dso: 32, dio: 25, dpo: 42, ccc: 15, scenarioAdjusted: true }
      ],
      pessimistic: [
        { dso: 50, dio: 37, dpo: 32, ccc: 55, scenarioAdjusted: true }
      ]
    }))
  }
}))

// Mock fetch globally
global.fetch = vi.fn()

describe('Working Capital Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default fetch mock
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({})
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchWorkingCapitalMetrics', () => {
    it('returns mock data when API is unavailable', async () => {
      const result = await fetchWorkingCapitalMetrics('month')

      expect(result).toBeDefined()
      expect(result.source).toBe('mock')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('receivables')
      expect(result).toHaveProperty('payables')
      expect(result).toHaveProperty('inventory')
    })

    it('generates appropriate mock data structure', async () => {
      const result = await fetchWorkingCapitalMetrics('month')

      // Check summary structure
      expect(result.summary).toHaveProperty('workingCapital')
      expect(result.summary).toHaveProperty('cashConversionCycle')
      expect(result.summary).toHaveProperty('currentRatio')
      expect(result.summary).toHaveProperty('quickRatio')

      // Check receivables structure
      expect(result.receivables).toHaveProperty('total')
      expect(result.receivables).toHaveProperty('dso')
      expect(result.receivables).toHaveProperty('aging')

      // Check payables structure
      expect(result.payables).toHaveProperty('total')
      expect(result.payables).toHaveProperty('dpo')
      expect(result.payables).toHaveProperty('aging')

      // Check inventory structure
      expect(result.inventory).toHaveProperty('total')
      expect(result.inventory).toHaveProperty('turnoverRatio')
      expect(result.inventory).toHaveProperty('daysOnHand')
    })

    it('handles different time periods', async () => {
      const weekResult = await fetchWorkingCapitalMetrics('week')
      const monthResult = await fetchWorkingCapitalMetrics('month')
      const quarterResult = await fetchWorkingCapitalMetrics('quarter')

      expect(weekResult.source).toBe('mock')
      expect(monthResult.source).toBe('mock')
      expect(quarterResult.source).toBe('mock')

      // All should have same structure but potentially different values
      expect(weekResult).toHaveProperty('summary')
      expect(monthResult).toHaveProperty('summary')
      expect(quarterResult).toHaveProperty('summary')
    })

    it('attempts MCP API call first', async () => {
      await fetchWorkingCapitalMetrics('month')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/working-capital'),
        expect.any(Object)
      )
    })
  })

  describe('generateCashFlowForecast', () => {
    it('generates forecast using forecasting utilities', async () => {
      const result = await generateCashFlowForecast({ periods: 6 })

      expect(result.success).toBe(true)
      expect(result.forecast).toBeDefined()
      expect(result.historical).toBeDefined()
      expect(result.metadata).toBeDefined()
      expect(result.metadata.periods).toBe(6)
    })

    it('handles different forecast options', async () => {
      const result = await generateCashFlowForecast({
        periods: 12,
        includeMonteCarlo: true,
        iterations: 500
      })

      expect(result.success).toBe(true)
      expect(result.metadata.periods).toBe(12)
    })

    it('falls back to mock data when API fails', async () => {
      // Mock API failure
      global.fetch.mockRejectedValue(new Error('API Error'))

      const result = await generateCashFlowForecast()

      expect(result.success).toBe(true)
      expect(result.historical).toBeDefined()
      expect(Array.isArray(result.historical)).toBe(true)
    })

    it('handles errors gracefully', async () => {
      // Mock forecasting utility error
      const { forecastingUtils } = require('../utils/forecastingUtils.js')
      forecastingUtils.generateCashFlowForecast.mockImplementation(() => {
        throw new Error('Forecasting error')
      })

      const result = await generateCashFlowForecast()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to generate cash flow forecast')
    })
  })

  describe('generateWorkingCapitalForecast', () => {
    it('generates working capital metrics forecast', async () => {
      const result = await generateWorkingCapitalForecast({ periods: 6 })

      expect(result.success).toBe(true)
      expect(result.forecast).toBeDefined()
      expect(Array.isArray(result.forecast)).toBe(true)
      expect(result.forecast[0]).toHaveProperty('dso')
      expect(result.forecast[0]).toHaveProperty('dio')
      expect(result.forecast[0]).toHaveProperty('dpo')
      expect(result.forecast[0]).toHaveProperty('ccc')
    })

    it('uses mock historical data when API unavailable', async () => {
      const result = await generateWorkingCapitalForecast()

      expect(result.success).toBe(true)
      expect(result.historical).toBeDefined()
      expect(Array.isArray(result.historical)).toBe(true)
    })
  })

  describe('generateOptimizationRecommendations', () => {
    it('generates optimization recommendations', async () => {
      const currentMetrics = {
        dso: 42,
        dio: 35,
        dpo: 30,
        currentRatio: 1.8,
        quickRatio: 1.5
      }

      const result = await generateOptimizationRecommendations(currentMetrics)

      expect(result.success).toBe(true)
      expect(result.opportunities).toBeDefined()
      expect(Array.isArray(result.opportunities)).toBe(true)
      expect(result.impact).toBeDefined()
      expect(result.summary).toBeDefined()
    })

    it('uses industry benchmarks correctly', async () => {
      const currentMetrics = { dso: 45 }
      const customBenchmarks = { dso: 30 }

      const result = await generateOptimizationRecommendations(currentMetrics, {
        benchmarks: customBenchmarks
      })

      expect(result.success).toBe(true)
      expect(result.metadata.benchmarksUsed.dso).toBe(30)
    })

    it('handles errors in recommendation generation', async () => {
      const { forecastingUtils } = require('../utils/forecastingUtils.js')
      forecastingUtils.generateOptimizationRecommendations.mockImplementation(() => {
        throw new Error('Recommendation error')
      })

      const result = await generateOptimizationRecommendations({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to generate optimization recommendations')
    })
  })

  describe('assessCashFlowRisk', () => {
    it('assesses cash flow risks correctly', async () => {
      const forecastData = [
        { netCashFlow: 30000, cumulativeCash: 200000 },
        { netCashFlow: -50000, cumulativeCash: 150000 },
        { netCashFlow: 25000, cumulativeCash: 175000 }
      ]

      const result = await assessCashFlowRisk(forecastData)

      expect(result.success).toBe(true)
      expect(result.risks).toBeDefined()
      expect(Array.isArray(result.risks)).toBe(true)
      expect(result.riskLevel).toBeDefined()
      expect(result.summary).toBeDefined()
    })

    it('uses custom thresholds', async () => {
      const forecastData = [{ netCashFlow: 10000, cumulativeCash: 30000 }]
      const customThresholds = { criticalCash: 50000, lowCash: 100000 }

      const result = await assessCashFlowRisk(forecastData, {
        thresholds: customThresholds
      })

      expect(result.success).toBe(true)
      expect(result.metadata.thresholdsUsed).toEqual(customThresholds)
    })
  })

  describe('createScenarioAnalysis', () => {
    it('creates scenario models correctly', async () => {
      const baseData = [
        { dso: 35, dio: 30, dpo: 35, ccc: 30 }
      ]

      const result = await createScenarioAnalysis(baseData)

      expect(result.success).toBe(true)
      expect(result.scenarios).toBeDefined()
      expect(result.scenarios.optimistic).toBeDefined()
      expect(result.scenarios.pessimistic).toBeDefined()
      expect(result.baseData).toEqual(baseData)
    })

    it('uses custom scenario definitions', async () => {
      const baseData = [{ dso: 35 }]
      const customScenarios = {
        custom: {
          name: 'Custom Scenario',
          description: 'Custom test scenario',
          adjustments: { dso: -0.2 }
        }
      }

      const result = await createScenarioAnalysis(baseData, customScenarios)

      expect(result.success).toBe(true)
      expect(result.metadata.scenariosGenerated).toContain('custom')
    })
  })

  describe('exportWorkingCapitalData', () => {
    it('exports data in CSV format', async () => {
      // Mock the export service
      const mockExportService = {
        exportWorkingCapitalData: vi.fn().mockResolvedValue({
          success: true,
          filename: 'test-export.csv'
        })
      }

      // Mock dynamic import
      vi.doMock('../services/exportService.js', () => mockExportService)

      const result = await exportWorkingCapitalData('csv', 'month', {
        includeForecasts: true,
        includeRecommendations: true
      })

      expect(result.success).toBe(true)
      expect(result.filename).toBe('test-export.csv')
    })

    it('falls back to legacy export on error', async () => {
      // Mock export service failure
      vi.doMock('../services/exportService.js', () => {
        throw new Error('Export service error')
      })

      // Mock DOM elements for file download
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      }
      const mockCreateElement = vi.fn().mockReturnValue(mockAnchor)
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:url')
      const mockRevokeObjectURL = vi.fn()

      global.document = {
        createElement: mockCreateElement,
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn()
        }
      }
      global.URL = {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL
      }
      global.Blob = vi.fn()

      const result = await exportWorkingCapitalData('csv', 'month')

      expect(result.success).toBe(true)
      expect(result.filename).toContain('working-capital')
      expect(mockAnchor.click).toHaveBeenCalled()
    })

    it('includes forecast data when requested', async () => {
      const mockExportService = {
        exportWorkingCapitalData: vi.fn().mockResolvedValue({ success: true })
      }
      vi.doMock('../services/exportService.js', () => mockExportService)

      await exportWorkingCapitalData('csv', 'month', {
        includeForecasts: true
      })

      // Should have called generateCashFlowForecast
      const { forecastingUtils } = require('../utils/forecastingUtils.js')
      expect(forecastingUtils.generateCashFlowForecast).toHaveBeenCalled()
    })

    it('includes recommendations when requested', async () => {
      const mockExportService = {
        exportWorkingCapitalData: vi.fn().mockResolvedValue({ success: true })
      }
      vi.doMock('../services/exportService.js', () => mockExportService)

      await exportWorkingCapitalData('csv', 'month', {
        includeRecommendations: true
      })

      // Should have called generateOptimizationRecommendations
      const { forecastingUtils } = require('../utils/forecastingUtils.js')
      expect(forecastingUtils.generateOptimizationRecommendations).toHaveBeenCalled()
    })
  })

  describe('Mock Data Generation', () => {
    it('generates realistic mock data ranges', async () => {
      const result = await fetchWorkingCapitalMetrics('month')

      // Check that values are within realistic ranges
      expect(result.summary.workingCapital).toBeGreaterThan(0)
      expect(result.summary.currentRatio).toBeGreaterThan(0)
      expect(result.summary.quickRatio).toBeGreaterThan(0)
      expect(result.summary.cashConversionCycle).toBeGreaterThan(0)

      // Check DSO is reasonable (typically 20-60 days)
      expect(result.receivables.dso).toBeGreaterThanOrEqual(20)
      expect(result.receivables.dso).toBeLessThanOrEqual(60)

      // Check DPO is reasonable (typically 20-50 days)
      expect(result.payables.dpo).toBeGreaterThanOrEqual(20)
      expect(result.payables.dpo).toBeLessThanOrEqual(50)
    })

    it('maintains consistency in aging data', async () => {
      const result = await fetchWorkingCapitalMetrics('month')

      // AR aging should add up to total
      const arTotal = result.receivables.aging.current +
                     result.receivables.aging['1-30'] +
                     result.receivables.aging['31-60'] +
                     result.receivables.aging['61-90'] +
                     result.receivables.aging['90+']

      expect(Math.abs(arTotal - result.receivables.total)).toBeLessThan(1000) // Allow for rounding

      // AP aging should add up to total
      const apTotal = result.payables.aging.current +
                     result.payables.aging['1-30'] +
                     result.payables.aging['31-60'] +
                     result.payables.aging['61-90'] +
                     result.payables.aging['90+']

      expect(Math.abs(apTotal - result.payables.total)).toBeLessThan(1000)
    })
  })
})