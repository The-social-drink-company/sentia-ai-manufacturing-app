import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  WorkingCapitalExporter,
  exportWorkingCapitalData,
  quickExportCSV,
  quickExportExcel,
  quickExportPDF,
  quickExportJSON
} from '../services/exportService.js'

// Mock jsPDF and dependencies
const mockJsPDF = {
  setFontSize: vi.fn(),
  text: vi.fn(),
  autoTable: vi.fn(),
  addPage: vi.fn(),
  save: vi.fn(),
  lastAutoTable: { finalY: 100 }
}

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => mockJsPDF)
}))

vi.mock('jspdf-autotable')

// Mock XLSX for Excel export
const mockXLSX = {
  utils: {
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    aoa_to_sheet: vi.fn(() => ({})),
    writeFile: vi.fn()
  }
}

// Mock dynamic import for XLSX
vi.mock('xlsx', () => mockXLSX)

// Mock DOM APIs
global.Blob = vi.fn()
global.URL = {
  createObjectURL: vi.fn(() => 'mock-blob-url'),
  revokeObjectURL: vi.fn()
}

const mockDocument = {
  createElement: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn()
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
}

global.document = mockDocument

describe('WorkingCapitalExporter', () => {
  let mockData
  let exporter

  beforeEach(() => {
    vi.clearAllMocks()

    mockData = {
      summary: {
        workingCapital: 1200000,
        workingCapitalChange: 5.2,
        cashConversionCycle: 35,
        cccChange: -2.1,
        currentRatio: 2.1,
        currentRatioChange: 1.5,
        quickRatio: 1.8,
        quickRatioChange: 0.8
      },
      receivables: {
        total: 450000,
        current: 280000,
        '1-30': 95000,
        '31-60': 45000,
        '61-90': 20000,
        '90+': 10000,
        topCustomers: [
          { name: 'Customer A', amount: 125000, daysOutstanding: 35 },
          { name: 'Customer B', amount: 95000, daysOutstanding: 45 }
        ]
      },
      payables: {
        total: 280000,
        current: 180000,
        '1-30': 65000,
        '31-60': 25000,
        '61-90': 8000,
        '90+': 2000,
        topSuppliers: [
          { name: 'Supplier X', amount: 85000, daysOutstanding: 20 },
          { name: 'Supplier Y', amount: 72000, daysOutstanding: 35 }
        ]
      },
      inventory: {
        total: 650000,
        turnoverRatio: 13.1,
        daysOnHand: 28
      },
      cccDetails: {
        daysSalesOutstanding: 42,
        daysInventoryOutstanding: 28,
        daysPayableOutstanding: 35,
        cashConversionCycle: 35
      },
      cashFlow: [
        { period: 'Jan', cashInflow: 150000, cashOutflow: 120000, netCashFlow: 30000 },
        { period: 'Feb', cashInflow: 160000, cashOutflow: 125000, netCashFlow: 35000 }
      ],
      recommendations: [
        {
          priority: 'high',
          title: 'Accelerate Collections',
          description: 'Reduce DSO by implementing automated reminders',
          impact: 'High',
          timeframe: '2-4 weeks',
          potentialSaving: 125000
        }
      ],
      risks: {
        risks: [
          {
            type: 'Low Cash Warning',
            severity: 'warning',
            description: 'Cash balance may fall below threshold'
          }
        ],
        riskLevel: 'warning',
        summary: {
          totalRisks: 1,
          criticalRisks: 0,
          warningRisks: 1
        }
      }
    }

    exporter = new WorkingCapitalExporter(mockData)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CSV _Export', () => {
    it('exports data as CSV _successfully', async () => {
      const result = await exporter.exportCSV()

      expect(result.success).toBe(true)
      expect(result.filename).toMatch(/working-capital-report-\d{4}-\d{2}-\d{2}.csv/)

      // Check that file download was triggered
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.any(String)],
        { type: 'text/csv' }
      )
    })

    it('generates correct CSV content _structure', () => {
      const csvContent = exporter.generateCSVContent()

      expect(csvContent).toContain('Working Capital Management Report')
      expect(csvContent).toContain('EXECUTIVE SUMMARY')
      expect(csvContent).toContain('ACCOUNTS RECEIVABLE AGING')
      expect(csvContent).toContain('ACCOUNTS PAYABLE AGING')
      expect(csvContent).toContain('OPTIMIZATION RECOMMENDATIONS')
    })

    it('includes metric values in _CSV', () => {
      const csvContent = exporter.generateCSVContent()

      expect(csvContent).toContain('$1,200,000')
      expect(csvContent).toContain('35 days')
      expect(csvContent).toContain('2.1')
      expect(csvContent).toContain('1.8')
    })

    it('handles missing data gracefully in _CSV', () => {
      const emptyExporter = new WorkingCapitalExporter({})
      const csvContent = emptyExporter.generateCSVContent()

      expect(csvContent).toContain('Working Capital Management Report')
      expect(csvContent).not.toThrow()
    })
  })

  describe('Excel _Export', () => {
    it('exports data as Excel _successfully', async () => {
      const result = await exporter.exportExcel()

      expect(result.success).toBe(true)
      expect(result.filename).toMatch(/working-capital-report-\d{4}-\d{2}-\d{2}.xlsx/)

      // Check that XLSX methods were called
      expect(mockXLSX.utils.book_new).toHaveBeenCalled()
      expect(mockXLSX.utils.book_append_sheet).toHaveBeenCalledTimes(5) // Summary + AR + AP + Cash Flow + Recommendations
      expect(mockXLSX.utils.writeFile).toHaveBeenCalled()
    })

    it('creates summary sheet _correctly', () => {
      const sheet = exporter.createSummarySheet(mockXLSX)

      expect(mockXLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Working Capital Management Report'],
          expect.arrayContaining(['Generated:']),
          [],
          ['KEY METRICS'],
          ['Metric', 'Value', 'Change %', 'Status']
        ])
      )
    })

    it('creates AR aging sheet _correctly', () => {
      const sheet = exporter.createARAgingSheet(mockXLSX)

      expect(mockXLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Accounts Receivable Aging Report'],
          ['Aging Bucket', 'Amount', 'Percentage'],
          ['Current', 280000, expect.any(String)],
          ['Total', 450000, '100%']
        ])
      )
    })

    it('creates AP aging sheet _correctly', () => {
      const sheet = exporter.createAPAgingSheet(mockXLSX)

      expect(mockXLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Accounts Payable Aging Report'],
          ['Current', 180000, expect.any(String)],
          ['Total', 280000, '100%']
        ])
      )
    })

    it('creates cash flow sheet _correctly', () => {
      const sheet = exporter.createCashFlowSheet(mockXLSX)

      expect(mockXLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Cash Flow Analysis'],
          ['Period', 'Cash Inflow', 'Cash Outflow', 'Net Cash Flow', 'Cumulative Cash'],
          ['Jan', 150000, 120000, 30000, 0],
          ['Feb', 160000, 125000, 35000, 0]
        ])
      )
    })

    it('handles Excel export errors _gracefully', async () => {
      mockXLSX.utils.book_new.mockImplementation(() => {
        throw new Error('Excel error')
      })

      const result = await exporter.exportExcel()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Excel error')
    })
  })

  describe('PDF _Export', () => {
    it('exports data as PDF _successfully', async () => {
      const result = await exporter.exportPDF()

      expect(result.success).toBe(true)
      expect(result.filename).toMatch(/working-capital-report-\d{4}-\d{2}-\d{2}.pdf/)

      // Check that jsPDF methods were called
      expect(mockJsPDF.setFontSize).toHaveBeenCalled()
      expect(mockJsPDF.text).toHaveBeenCalled()
      expect(mockJsPDF.save).toHaveBeenCalled()
    })

    it('adds executive summary to _PDF', () => {
      const yPosition = exporter.addExecutiveSummary(mockJsPDF, 50)

      expect(mockJsPDF.text).toHaveBeenCalledWith('Executive Summary', 20, 50)
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('Working Capital: $1,200,000'),
        20,
        expect.any(Number)
      )
      expect(yPosition).toBeGreaterThan(50)
    })

    it('adds key metrics table to _PDF', () => {
      exporter.addKeyMetricsTable(mockJsPDF, 100)

      expect(mockJsPDF.autoTable).toHaveBeenCalledWith(
        expect.objectContaining({
          startY: 100,
          head: expect.any(Array),
          body: expect.any(Array),
          theme: 'striped'
        })
      )
    })

    it('adds aging analysis to _PDF', () => {
      const yPosition = exporter.addAgingAnalysis(mockJsPDF, 150)

      expect(mockJsPDF.text).toHaveBeenCalledWith('Aging Analysis', 20, 150)
      expect(mockJsPDF.autoTable).toHaveBeenCalled()
      expect(yPosition).toBeGreaterThan(150)
    })

    it('handles PDF export errors _gracefully', async () => {
      mockJsPDF.save.mockImplementation(() => {
        throw new Error('PDF error')
      })

      const result = await exporter.exportPDF()

      expect(result.success).toBe(false)
      expect(result.error).toContain('PDF error')
    })

    it('adds page breaks when _needed', () => {
      // Mock a scenario where content exceeds page height
      exporter.addRecommendations(mockJsPDF, 250)

      expect(mockJsPDF.addPage).toHaveBeenCalled()
    })
  })

  describe('JSON _Export', () => {
    it('exports data as JSON _successfully', () => {
      const result = exporter.exportJSON()

      expect(result.success).toBe(true)
      expect(result.filename).toMatch(/working-capital-data-\d{4}-\d{2}-\d{2}.json/)

      // Check that file download was triggered
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.any(String)],
        { type: 'application/json' }
      )
    })

    it('includes metadata in JSON _export', () => {
      // Mock Blob to capture content
      let jsonContent
      global.Blob.mockImplementation((content) => {
        jsonContent = JSON.parse(content[0])
      })

      exporter.exportJSON()

      expect(jsonContent.reportMetadata).toBeDefined()
      expect(jsonContent.reportMetadata.dataType).toBe('working-capital-report')
      expect(jsonContent.reportMetadata.version).toBe('1.0')
      expect(jsonContent.data).toEqual(mockData)
    })
  })

  describe('Utility _Methods', () => {
    it('formats currency _correctly', () => {
      expect(exporter.formatCurrency(1234567)).toBe('$1,234,567')
      expect(exporter.formatCurrency(0)).toBe('$0')
      expect(exporter.formatCurrency(-1000)).toBe('$-1,000')
    })

    it('calculates percentages _correctly', () => {
      expect(exporter.getPercentage(250, 1000)).toBe('25.0%')
      expect(exporter.getPercentage(0, 1000)).toBe('0.0%')
      expect(exporter.getPercentage(100, 0)).toBe('0%')
    })

    it('determines status text _correctly', () => {
      expect(exporter.getStatusText(6)).toBe('Improving')
      expect(exporter.getStatusText(-6)).toBe('Declining')
      expect(exporter.getStatusText(2)).toBe('Stable')
      expect(exporter.getStatusText(null)).toBe('N/A')
    })

    it('handles file download _correctly', () => {
      exporter.downloadFile('test content', 'test.csv', 'text/csv')

      expect(global.Blob).toHaveBeenCalledWith(['test content'], { type: 'text/csv' })
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(mockDocument.createElement).toHaveBeenCalledWith('a')
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('Export _Options', () => {
    it('respects includeForecasts _option', async () => {
      const exporterWithForecasts = new WorkingCapitalExporter(mockData, {
        includeForecasts: true
      })

      expect(exporterWithForecasts.options.includeForecasts).toBe(true)
    })

    it('respects includeRecommendations _option', () => {
      const exporterWithoutRecs = new WorkingCapitalExporter(mockData, {
        includeRecommendations: false
      })

      expect(exporterWithoutRecs.options.includeRecommendations).toBe(false)
    })

    it('sets default options _correctly', () => {
      expect(exporter.options.includeCharts).toBe(false)
      expect(exporter.options.includeForecasts).toBe(true)
      expect(exporter.options.includeRecommendations).toBe(true)
      expect(exporter.options.dateRange).toBe('current')
    })
  })
})

describe('Export Service _Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportWorkingCapitalData', () => {
    it('creates exporter and calls correct _method', async () => {
      const mockData = { summary: { workingCapital: 1000000 } }

      const result = await exportWorkingCapitalData(mockData, 'csv')

      expect(global.Blob).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('handles unsupported format _error', async () => {
      const mockData = { summary: { workingCapital: 1000000 } }

      await expect(exportWorkingCapitalData(mockData, 'unsupported')).rejects.toThrow(
        'Unsupported export format: unsupported'
      )
    })

    it('passes options correctly to _exporter', async () => {
      const mockData = { summary: { workingCapital: 1000000 } }
      const options = { includeForecasts: false, includeCharts: true }

      await exportWorkingCapitalData(mockData, 'json', options)

      // Should not throw and should handle options
      expect(global.Blob).toHaveBeenCalled()
    })
  })

  describe('Quick Export _Functions', () => {
    const mockData = { summary: { workingCapital: 1000000 } }

    it('quickExportCSV works _correctly', async () => {
      const result = await quickExportCSV(mockData)
      expect(result.success).toBe(true)
    })

    it('quickExportExcel works _correctly', async () => {
      const result = await quickExportExcel(mockData)
      expect(result.success).toBe(true)
    })

    it('quickExportPDF works _correctly', async () => {
      const result = await quickExportPDF(mockData)
      expect(result.success).toBe(true)
    })

    it('quickExportJSON works _correctly', () => {
      const result = quickExportJSON(mockData)
      expect(result.success).toBe(true)
    })

    it('all quick export functions accept _options', async () => {
      const options = { includeForecasts: false }

      await expect(quickExportCSV(mockData, options)).resolves.toBeDefined()
      await expect(quickExportExcel(mockData, options)).resolves.toBeDefined()
      await expect(quickExportPDF(mockData, options)).resolves.toBeDefined()
      expect(() => quickExportJSON(mockData, options)).not.toThrow()
    })
  })
})

describe('Error _Handling', () => {
  it('handles Blob creation _errors', async () => {
    global.Blob.mockImplementation(() => {
      throw new Error('Blob error')
    })

    const exporter = new WorkingCapitalExporter({})
    const result = await exporter.exportCSV()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Blob error')
  })

  it('handles DOM manipulation _errors', () => {
    mockDocument.createElement.mockImplementation(() => {
      throw new Error('DOM error')
    })

    const exporter = new WorkingCapitalExporter({})

    expect(() => {
      exporter.downloadFile('content', 'test.txt', 'text/plain')
    }).toThrow('DOM error')
  })

  it('handles missing data _gracefully', async () => {
    const emptyExporter = new WorkingCapitalExporter({})

    const csvResult = await emptyExporter.exportCSV()
    expect(csvResult.success).toBe(true)

    const jsonResult = emptyExporter.exportJSON()
    expect(jsonResult.success).toBe(true)
  })
})

describe('Data _Validation', () => {
  it('handles null and undefined values in _data', () => {
    const dataWithNulls = {
      summary: {
        workingCapital: null,
        cashConversionCycle: undefined,
        currentRatio: 0
      },
      receivables: null,
      payables: undefined
    }

    const exporter = new WorkingCapitalExporter(dataWithNulls)
    const csvContent = exporter.generateCSVContent()

    expect(csvContent).toContain('Working Capital Management Report')
    expect(() => exporter.formatCurrency(null)).not.toThrow()
    expect(() => exporter.formatCurrency(undefined)).not.toThrow()
  })

  it('handles empty arrays and _objects', () => {
    const dataWithEmpties = {
      summary: {},
      receivables: { topCustomers: [] },
      payables: { topSuppliers: [] },
      recommendations: []
    }

    const exporter = new WorkingCapitalExporter(dataWithEmpties)
    const csvContent = exporter.generateCSVContent()

    expect(csvContent).toBeDefined()
    expect(csvContent.length).toBeGreaterThan(0)
  })
})