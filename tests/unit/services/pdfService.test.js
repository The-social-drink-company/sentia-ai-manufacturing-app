/**
 * pdfService Unit Tests
 *
 * Tests for PDF generation service that creates downloadable manufacturing reports.
 * Focuses on the main generatePDF() function and error handling.
 *
 * Test Coverage:
 * - PDF generation with complete report data
 * - Handling different section types (KPIs, P&L, Regional, Product Sales)
 * - Executive summary rendering
 * - Error handling for missing/invalid data
 * - File naming and metadata
 * - Edge cases and malformed data
 *
 * @module tests/unit/services/pdfService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock jsPDF before importing the service
vi.mock('jspdf', () => {
  const mockPdfInstance = {
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
      getCurrentPageInfo: () => ({ pageNumber: 1 }),
    },
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    text: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    line: vi.fn(),
    splitTextToSize: vi.fn((text) => [text]),
    addPage: vi.fn(),
    save: vi.fn(),
  }

  return {
    default: vi.fn(() => mockPdfInstance),
  }
})

import { generatePDF } from '../../../src/services/pdfService.js'

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd_HH-mm') {
      return '2025-10-20_13-45'
    }
    if (formatStr === "MMMM d, yyyy 'at' h:mm a") {
      return 'October 20, 2025 at 1:45 PM'
    }
    if (formatStr === 'yyyy-MM-dd HH:mm') {
      return '2025-10-20 13:45'
    }
    return '2025-10-20'
  }),
}))

// Suppress console.error during tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalConsoleError
})

describe('pdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockReportData = (overrides = {}) => ({
    metadata: {
      title: 'Manufacturing Dashboard Report',
      generatedAt: '2025-10-20T13:45:00.000Z',
      reportPeriod: { formatted: 'Q3 2025 (July - September)' },
      sections: ['capitalKpis', 'performanceKpis'],
    },
    sections: {},
    executiveSummary: {
      status: 'Healthy',
      reportPeriod: 'Q3 2025',
      keyInsights: ['Revenue up 12%', 'Costs under control'],
      recommendation: 'Continue current strategy',
    },
    ...overrides,
  })

  describe('generatePDF - Success Scenarios', () => {
    it('should generate PDF with minimal data', async () => {
      const reportData = createMockReportData()
      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
      expect(result.filename).toContain('CapLiquify_Report_SentiaSpirits')
      expect(result.filename).toContain('2025-10-20_13-45')
      expect(result.filename).toMatch(/\.pdf$/)
    })

    it('should generate PDF with Capital KPIs section', async () => {
      const reportData = createMockReportData({
        sections: {
          capitalKpis: {
            title: 'Capital Position',
            data: [
              { label: 'Cash Runway', value: '137 days', helper: 'Days of liquidity' },
              { label: 'Working Capital', value: '$1.2M', helper: 'Current assets - liabilities' },
            ],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
      expect(result.filename).toBeDefined()
    })

    it('should generate PDF with Performance KPIs section', async () => {
      const reportData = createMockReportData({
        sections: {
          performanceKpis: {
            title: 'Performance Metrics',
            data: [
              { label: 'Throughput', value: '94.7%', helper: 'Production efficiency' },
              { label: 'Forecast Accuracy', value: '86.3%', helper: 'Demand prediction' },
            ],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should generate PDF with Regional Performance section', async () => {
      const reportData = createMockReportData({
        sections: {
          regional: {
            title: 'Regional Performance',
            data: [
              { region: 'UK/EU', revenue: 5400000, ebitda: 1200000 },
              { region: 'USA', revenue: 3200000, ebitda: 800000 },
            ],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should generate PDF with P&L Analysis section', async () => {
      const reportData = createMockReportData({
        sections: {
          plAnalysis: {
            title: 'P&L Analysis',
            data: [
              { month: 'Jul', revenue: 150, grossProfit: 75, ebitda: 45 },
              { month: 'Aug', revenue: 160, grossProfit: 80, ebitda: 50 },
              { month: 'Sep', revenue: 170, grossProfit: 85, ebitda: 55 },
            ],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should generate PDF with Product Sales section', async () => {
      const reportData = createMockReportData({
        sections: {
          productSales: {
            title: 'Product Sales Performance',
            data: [
              { product: 'Gin 700ml', revenue: 450000, units: 12000, growthRate: 8.5 },
              { product: 'Vodka 700ml', revenue: 380000, units: 10200, growthRate: 5.2 },
            ],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should generate PDF with multiple sections', async () => {
      const reportData = createMockReportData({
        sections: {
          capitalKpis: {
            title: 'Capital Position',
            data: [{ label: 'Cash Runway', value: '137 days', helper: 'Liquidity' }],
          },
          performanceKpis: {
            title: 'Performance Metrics',
            data: [{ label: 'Throughput', value: '94.7%', helper: 'Efficiency' }],
          },
          regional: {
            title: 'Regional Performance',
            data: [{ region: 'UK/EU', revenue: 5400000, ebitda: 1200000 }],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should include executive summary when provided', async () => {
      const reportData = createMockReportData({
        executiveSummary: {
          status: 'Strong Performance',
          reportPeriod: 'Q3 2025',
          keyInsights: [
            'Revenue exceeded targets by 15%',
            'Operating costs down 8%',
            'New product line showing strong growth',
          ],
          recommendation: 'Increase production capacity for high-growth products',
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })
  })

  describe('generatePDF - Data Format Handling', () => {
    it('should handle product sales data as objects', async () => {
      const reportData = createMockReportData({
        sections: {
          productSales: {
            title: 'Product Sales Performance',
            data: [
              { product: 'Gin 700ml', revenue: 450000, units: 12000, growthRate: 8.5 },
            ],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle product sales data with alternative field names', async () => {
      const reportData = createMockReportData({
        sections: {
          productSales: {
            title: 'Product Sales Performance',
            data: [
              { name: 'Vodka', sales: 380000, unitsSold: 10200, growth: 5.2 },
            ],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle generic data sections', async () => {
      const reportData = createMockReportData({
        sections: {
          custom: {
            title: 'Custom Section',
            data: ['Item 1', 'Item 2', 'Item 3'],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle sections with summary boxes', async () => {
      const reportData = createMockReportData({
        sections: {
          plAnalysis: {
            title: 'P&L Analysis',
            data: [
              { month: 'Jul', revenue: 150, grossProfit: 75, ebitda: 45 },
            ],
            summary: {
              status: 'Positive',
              totalRevenue: '$150K',
              avgGrossMargin: '50%',
              bestMonth: 'July 2025',
            },
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })
  })

  describe('generatePDF - Edge Cases', () => {
    it('should handle missing executive summary', async () => {
      const reportData = createMockReportData({
        executiveSummary: null,
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle empty sections object', async () => {
      const reportData = createMockReportData({
        sections: {},
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle section with no data array', async () => {
      const reportData = createMockReportData({
        sections: {
          capitalKpis: {
            title: 'Capital Position',
            description: 'No data available',
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle section with empty data array', async () => {
      const reportData = createMockReportData({
        sections: {
          performanceKpis: {
            title: 'Performance Metrics',
            data: [],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle summary box with null summary', async () => {
      const reportData = createMockReportData({
        sections: {
          plAnalysis: {
            title: 'P&L Analysis',
            data: [{ month: 'Jul', revenue: 150, grossProfit: 75, ebitda: 45 }],
            summary: null,
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle summary box with empty object', async () => {
      const reportData = createMockReportData({
        sections: {
          regional: {
            title: 'Regional Performance',
            data: [{ region: 'UK/EU', revenue: 5400000, ebitda: 1200000 }],
            summary: {},
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle executive summary with no key insights', async () => {
      const reportData = createMockReportData({
        executiveSummary: {
          status: 'Healthy',
          reportPeriod: 'Q3 2025',
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle large revenue numbers (millions)', async () => {
      const reportData = createMockReportData({
        sections: {
          productSales: {
            title: 'Product Sales Performance',
            data: [
              { product: 'Premium Line', revenue: 5500000, units: 150000, growthRate: 12.3 },
            ],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })

    it('should handle small revenue numbers (thousands)', async () => {
      const reportData = createMockReportData({
        sections: {
          productSales: {
            title: 'Product Sales Performance',
            data: [
              { product: 'Test Product', revenue: 50000, units: 1200, growthRate: 3.5 },
            ],
          },
        },
      })

      const result = await generatePDF(reportData)

      expect(result.success).toBe(true)
    })
  })

  describe('generatePDF - Error Handling', () => {
    it('should throw error when PDF generation fails', async () => {
      // Mock jsPDF to throw an error
      const jsPDF = (await import('jspdf')).default
      jsPDF.mockImplementationOnce(() => {
        throw new Error('PDF initialization failed')
      })

      const reportData = createMockReportData()

      await expect(generatePDF(reportData)).rejects.toThrow(
        'Failed to generate PDF: PDF initialization failed'
      )
    })

    it('should throw error when save fails', async () => {
      const jsPDF = (await import('jspdf')).default
      const mockSave = vi.fn(() => {
        throw new Error('Save operation failed')
      })

      jsPDF.mockImplementationOnce(() => ({
        internal: {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297,
          },
          getCurrentPageInfo: () => ({ pageNumber: 1 }),
        },
        setFontSize: vi.fn(),
        setFont: vi.fn(),
        setTextColor: vi.fn(),
        setFillColor: vi.fn(),
        setDrawColor: vi.fn(),
        text: vi.fn(),
        rect: vi.fn(),
        roundedRect: vi.fn(),
        line: vi.fn(),
        splitTextToSize: vi.fn(() => []),
        addPage: vi.fn(),
        save: mockSave,
      }))

      const reportData = createMockReportData()

      await expect(generatePDF(reportData)).rejects.toThrow(
        'Failed to generate PDF: Save operation failed'
      )
    })

    it('should handle missing metadata gracefully', async () => {
      const reportData = {
        sections: {},
      }

      await expect(generatePDF(reportData)).rejects.toThrow()
    })
  })
})
