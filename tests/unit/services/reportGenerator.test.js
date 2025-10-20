/**
 * reportGenerator Unit Tests
 *
 * Tests for Report Generator service that aggregates data from multiple APIs
 * and creates comprehensive manufacturing reports.
 *
 * Test Coverage:
 * - generateReport() with different section combinations
 * - API integration and data aggregation
 * - Summary generation for each section type
 * - Executive summary generation
 * - Error handling and fallbacks
 * - Edge cases and missing data scenarios
 *
 * @module tests/unit/services/reportGenerator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock all API dependencies
vi.mock('@/services/api/plAnalysisApi', () => ({
  default: {
    getKPISummary: vi.fn(),
    getPLAnalysis: vi.fn(),
    getPLSummary: vi.fn(),
  },
}))

vi.mock('@/services/api/productSalesApi', () => ({
  default: {
    getProductSalesData: vi.fn(),
  },
}))

vi.mock('@/services/api/stockLevelsApi', () => ({
  default: {
    getStockLevels: vi.fn(),
  },
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMMM d, yyyy') {
      return 'January 1, 2025'
    }
    if (formatStr === 'MMMM yyyy') {
      return 'January 2025'
    }
    return '2025-01-01'
  }),
}))

import { generateReport } from '../../../src/services/reportGenerator.js'
import plAnalysisApi from '../../../src/services/api/plAnalysisApi'
import productSalesApi from '../../../src/services/api/productSalesApi'
import stockLevelsApi from '../../../src/services/api/stockLevelsApi'

// Suppress console.error during tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalConsoleError
})

describe('reportGenerator', () => {
  const mockDateRange = {
    from: new Date('2025-01-01'),
    to: new Date('2025-03-31'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateReport - Capital KPIs Section', () => {
    it('should generate report with capital KPIs section', async () => {
      const selectedSections = { capitalKpis: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.title).toBe('CapLiquify Manufacturing Platform Report')
      expect(result.sections.capitalKpis).toBeDefined()
      expect(result.sections.capitalKpis.title).toBe('Capital Position')
      expect(result.sections.capitalKpis.data).toHaveLength(4)
      expect(result.sections.capitalKpis.summary).toBeDefined()
      expect(result.sections.capitalKpis.summary.status).toContain('liquidity')
    })

    it('should include working capital and cash coverage in capital summary', async () => {
      const selectedSections = { capitalKpis: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.capitalKpis.summary.workingCapital).toBe('$9.2M')
      expect(result.sections.capitalKpis.summary.cashCoverage).toBe('214 days')
      expect(result.sections.capitalKpis.summary.keyInsight).toContain('working capital')
    })
  })

  describe('generateReport - Performance KPIs Section', () => {
    it('should generate report with performance KPIs section', async () => {
      plAnalysisApi.getKPISummary.mockResolvedValueOnce({
        success: true,
        data: {
          annualRevenue: { value: '$2.4M', helper: 'Year-to-date' },
          unitsSold: { value: '156,000', helper: 'Total units' },
          grossMargin: { value: '42.3%', helper: 'Average margin' },
        },
      })

      const selectedSections = { performanceKpis: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.performanceKpis).toBeDefined()
      expect(result.sections.performanceKpis.title).toBe('Performance Metrics')
      expect(result.sections.performanceKpis.data).toHaveLength(3)
      expect(result.sections.performanceKpis.data[0].label).toBe('Annual revenue')
      expect(result.sections.performanceKpis.data[0].value).toBe('$2.4M')
      expect(plAnalysisApi.getKPISummary).toHaveBeenCalled()
    })

    it('should handle performance KPIs API failure gracefully', async () => {
      plAnalysisApi.getKPISummary.mockResolvedValueOnce({
        success: false,
        data: null,
      })

      const selectedSections = { performanceKpis: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.performanceKpis.data).toEqual([])
      expect(result.sections.performanceKpis.summary.status).toBe('Data unavailable')
    })
  })

  describe('generateReport - P&L Analysis Section', () => {
    it('should generate report with P&L analysis section', async () => {
      plAnalysisApi.getPLAnalysis.mockResolvedValueOnce({
        success: true,
        data: [
          { month: 'Jan', revenue: 150, grossProfit: 75, ebitda: 45 },
          { month: 'Feb', revenue: 160, grossProfit: 80, ebitda: 50 },
        ],
      })

      plAnalysisApi.getPLSummary.mockResolvedValueOnce({
        success: true,
        data: { totalRevenue: 310 },
      })

      const selectedSections = { plAnalysis: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.plAnalysis).toBeDefined()
      expect(result.sections.plAnalysis.title).toBe('P&L Analysis')
      expect(result.sections.plAnalysis.data).toHaveLength(2)
      expect(result.sections.plAnalysis.chartData).toHaveLength(2)
      expect(result.sections.plAnalysis.summary.bestMonth).toBe('Feb')
      expect(plAnalysisApi.getPLAnalysis).toHaveBeenCalled()
      expect(plAnalysisApi.getPLSummary).toHaveBeenCalledWith('year')
    })

    it('should calculate P&L summary metrics correctly', async () => {
      const plData = [
        { month: 'Jan', revenue: 100, grossProfit: 50, ebitda: 30 },
        { month: 'Feb', revenue: 200, grossProfit: 100, ebitda: 60 },
      ]

      plAnalysisApi.getPLAnalysis.mockResolvedValueOnce({
        success: true,
        data: plData,
      })

      plAnalysisApi.getPLSummary.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      const selectedSections = { plAnalysis: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.plAnalysis.data).toEqual(plData)
      expect(result.sections.plAnalysis.summary.totalRevenue).toBe('$300K')
      expect(result.sections.plAnalysis.summary.totalGrossProfit).toBe('$150K')
      expect(result.sections.plAnalysis.summary.totalEbitda).toBe('$90K')
      expect(result.sections.plAnalysis.summary.avgGrossMargin).toBe('50.0%')
      expect(result.sections.plAnalysis.summary.avgEbitdaMargin).toBe('30.0%')
    })

    it('should handle empty P&L data gracefully', async () => {
      plAnalysisApi.getPLAnalysis.mockResolvedValueOnce({
        success: false,
        data: [],
      })

      plAnalysisApi.getPLSummary.mockResolvedValueOnce({
        success: false,
        data: null,
      })

      const selectedSections = { plAnalysis: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.plAnalysis.data).toEqual([])
      expect(result.sections.plAnalysis.summary.status).toBe('Data unavailable')
    })
  })

  describe('generateReport - Regional Performance Section', () => {
    it('should generate report with regional performance section', async () => {
      const selectedSections = { regionalContribution: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.regionalContribution).toBeDefined()
      expect(result.sections.regionalContribution.title).toBe('Regional Performance')
      expect(result.sections.regionalContribution.data).toHaveLength(3)
      expect(result.sections.regionalContribution.summary.topRegion).toBe('EU')
      expect(result.sections.regionalContribution.summary.totalRevenue).toBe('$14.2M')
      expect(result.sections.regionalContribution.summary.keyInsight).toContain('EU')
    })

    it('should calculate regional summary metrics correctly', async () => {
      const selectedSections = { regionalContribution: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.regionalContribution.summary.totalRevenue).toBe('$14.2M')
      expect(result.sections.regionalContribution.summary.totalEbitda).toBe('$2.9M')
      expect(result.sections.regionalContribution.summary.avgEbitdaMargin).toMatch(/^\d+\.\d%$/)
    })
  })

  describe('generateReport - Stock Levels Section', () => {
    it('should generate report with stock levels section', async () => {
      stockLevelsApi.getStockLevels.mockResolvedValueOnce({
        success: true,
        data: [
          { product: 'Gin 700ml', level: 75, status: 'Optimal' },
          { product: 'Vodka 700ml', level: 15, status: 'Low' },
        ],
      })

      const selectedSections = { stockLevels: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.stockLevels).toBeDefined()
      expect(result.sections.stockLevels.title).toBe('Current Stock Levels')
      expect(result.sections.stockLevels.data).toHaveLength(2)
      expect(result.sections.stockLevels.summary.totalItems).toBe(2)
      expect(result.sections.stockLevels.summary.lowStockCount).toBe(1)
      expect(result.sections.stockLevels.summary.status).toBe('Attention required')
      expect(stockLevelsApi.getStockLevels).toHaveBeenCalled()
    })

    it('should handle stock levels with all optimal items', async () => {
      stockLevelsApi.getStockLevels.mockResolvedValueOnce({
        success: true,
        data: [
          { product: 'Gin 700ml', level: 75, status: 'Optimal' },
          { product: 'Vodka 700ml', level: 50, status: 'Optimal' },
        ],
      })

      const selectedSections = { stockLevels: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.stockLevels.summary.lowStockCount).toBe(0)
      expect(result.sections.stockLevels.summary.status).toBe('Stock levels healthy')
      expect(result.sections.stockLevels.summary.keyInsight).toContain('optimal ranges')
    })

    it('should handle stock levels API error gracefully', async () => {
      stockLevelsApi.getStockLevels.mockRejectedValueOnce(new Error('API Error'))

      const selectedSections = { stockLevels: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.stockLevels.data).toEqual([])
      expect(result.sections.stockLevels.summary.status).toBe('Data unavailable')
      expect(result.sections.stockLevels.summary.message).toContain('could not be retrieved')
    })
  })

  describe('generateReport - Product Sales Section', () => {
    it('should generate report with product sales section', async () => {
      productSalesApi.getProductSalesData.mockResolvedValueOnce({
        success: true,
        data: [
          { name: 'Gin 700ml', sales: 450000 },
          { product: 'Vodka 700ml', revenue: 380000 },
        ],
      })

      const selectedSections = { productSales: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.productSales).toBeDefined()
      expect(result.sections.productSales.title).toBe('Product Sales Performance')
      expect(result.sections.productSales.data).toHaveLength(2)
      expect(result.sections.productSales.summary.topProduct).toBe('Gin 700ml')
      expect(result.sections.productSales.summary.totalSales).toBe('$0.8M')
      expect(productSalesApi.getProductSalesData).toHaveBeenCalled()
    })

    it('should handle product sales API failure gracefully', async () => {
      productSalesApi.getProductSalesData.mockResolvedValueOnce({
        success: false,
        data: null,
      })

      const selectedSections = { productSales: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.productSales.data).toEqual([])
      expect(result.sections.productSales.summary.status).toBe('Data unavailable')
    })
  })

  describe('generateReport - Multiple Sections', () => {
    it('should generate report with multiple sections', async () => {
      plAnalysisApi.getKPISummary.mockResolvedValueOnce({
        success: true,
        data: {
          annualRevenue: { value: '$2.4M', helper: 'YTD' },
          unitsSold: { value: '156K', helper: 'Total' },
          grossMargin: { value: '42%', helper: 'Average' },
        },
      })

      productSalesApi.getProductSalesData.mockResolvedValueOnce({
        success: true,
        data: [{ name: 'Test Product', sales: 100000 }],
      })

      const selectedSections = {
        capitalKpis: true,
        performanceKpis: true,
        regionalContribution: true,
        productSales: true,
      }

      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.capitalKpis).toBeDefined()
      expect(result.sections.performanceKpis).toBeDefined()
      expect(result.sections.regionalContribution).toBeDefined()
      expect(result.sections.productSales).toBeDefined()
      expect(Object.keys(result.sections)).toHaveLength(4)
    })
  })

  describe('generateReport - Executive Summary', () => {
    it('should generate executive summary with all sections', async () => {
      plAnalysisApi.getKPISummary.mockResolvedValueOnce({
        success: true,
        data: {
          annualRevenue: { value: '$2.4M', helper: 'YTD' },
          unitsSold: { value: '156K', helper: 'Total' },
          grossMargin: { value: '42%', helper: 'Average' },
        },
      })

      plAnalysisApi.getPLAnalysis.mockResolvedValueOnce({
        success: true,
        data: [{ month: 'Jan', revenue: 150, grossProfit: 75, ebitda: 45 }],
      })

      plAnalysisApi.getPLSummary.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      stockLevelsApi.getStockLevels.mockResolvedValueOnce({
        success: true,
        data: [{ product: 'Test', level: 50, status: 'Optimal' }],
      })

      productSalesApi.getProductSalesData.mockResolvedValueOnce({
        success: true,
        data: [{ name: 'Test', sales: 100000 }],
      })

      const selectedSections = {
        capitalKpis: true,
        performanceKpis: true,
        plAnalysis: true,
        regionalContribution: true,
        stockLevels: true,
        productSales: true,
      }

      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.executiveSummary).toBeDefined()
      expect(result.executiveSummary.status).toBe('Operational')
      expect(result.executiveSummary.reportPeriod).toBe('January 2025')
      expect(result.executiveSummary.keyInsights).toHaveLength(6)
      expect(result.executiveSummary.recommendation).toContain('monitoring')
      expect(result.executiveSummary.dataQuality).toContain('High')
    })

    it('should generate executive summary with partial sections', async () => {
      const selectedSections = {
        capitalKpis: true,
        regionalContribution: true,
      }

      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.executiveSummary.keyInsights).toHaveLength(2)
      expect(result.executiveSummary.keyInsights[0]).toContain('capital position')
      expect(result.executiveSummary.keyInsights[1]).toContain('Regional performance')
    })
  })

  describe('generateReport - Metadata', () => {
    it('should include correct metadata in report', async () => {
      const selectedSections = { capitalKpis: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.metadata.title).toBe('CapLiquify Manufacturing Platform Report')
      expect(result.metadata.generatedAt).toBeDefined()
      expect(result.metadata.reportPeriod.from).toEqual(mockDateRange.from)
      expect(result.metadata.reportPeriod.to).toEqual(mockDateRange.to)
      expect(result.metadata.reportPeriod.formatted).toContain('January')
      expect(result.metadata.sections).toEqual(selectedSections)
    })

    it('should generate ISO timestamp for generatedAt', async () => {
      const selectedSections = { capitalKpis: true }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.metadata.generatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })
  })

  describe('generateReport - Error Handling', () => {
    it('should throw error when report generation fails', async () => {
      plAnalysisApi.getKPISummary.mockRejectedValueOnce(new Error('Critical API failure'))

      const selectedSections = { performanceKpis: true }

      await expect(generateReport(selectedSections, mockDateRange)).rejects.toThrow(
        'Failed to generate report: Critical API failure'
      )
    })

    it('should handle missing date range gracefully', async () => {
      const selectedSections = { capitalKpis: true }

      await expect(generateReport(selectedSections, {})).rejects.toThrow()
    })
  })

  describe('generateReport - Edge Cases', () => {
    it('should handle empty section selection', async () => {
      const selectedSections = {}
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.metadata).toBeDefined()
      expect(Object.keys(result.sections)).toHaveLength(0)
      expect(result.executiveSummary.keyInsights).toHaveLength(0)
    })

    it('should handle undefined section selection', async () => {
      const selectedSections = { capitalKpis: false, performanceKpis: false }
      const result = await generateReport(selectedSections, mockDateRange)

      expect(result.sections.capitalKpis).toBeUndefined()
      expect(result.sections.performanceKpis).toBeUndefined()
    })
  })
})
