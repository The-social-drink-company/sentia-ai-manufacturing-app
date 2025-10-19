/**
 * Enhanced Export Service for Working Capital Data
 * Provides comprehensive export capabilities in multiple formats
 */

// Import structured logger
import { logError } from '../../../utils/structuredLogger.js'

// PDF export utilities
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Excel export utilities
const createExcelWorkbook = async () => {
  // Dynamic import to avoid bundle size issues
  const XLSX = await import('xlsx')
  return XLSX
}

export class WorkingCapitalExporter {
  constructor(data, options = {}) {
    this.data = data
    this.options = {
      includeCharts: options.includeCharts || false,
      includeForecasts: options.includeForecasts || true,
      includeRecommendations: options.includeRecommendations || true,
      dateRange: options.dateRange || 'current',
      ...options,
    }
    this.timestamp = new Date().toISOString().split('T')[0]
  }

  // Export as CSV
  async exportCSV() {
    try {
      const csvContent = this.generateCSVContent()
      const filename = `working-capital-report-${this.timestamp}.csv`
      this.downloadFile(csvContent, filename, 'text/csv')
      return { success: true, filename }
    } catch (error) {
      logError('CSV export failed', error)
      return { success: false, error: error.message }
    }
  }

  // Export as Excel
  async exportExcel() {
    try {
      const XLSX = await createExcelWorkbook()
      const workbook = XLSX.utils.book_new()

      // Summary sheet
      const summarySheet = this.createSummarySheet(XLSX)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

      // AR Aging sheet
      if (this.data.receivables) {
        const arSheet = this.createARAgingSheet(XLSX)
        XLSX.utils.book_append_sheet(workbook, arSheet, 'AR Aging')
      }

      // AP Aging sheet
      if (this.data.payables) {
        const apSheet = this.createAPAgingSheet(XLSX)
        XLSX.utils.book_append_sheet(workbook, apSheet, 'AP Aging')
      }

      // Cash Flow sheet
      if (this.data.cashFlow) {
        const cashFlowSheet = this.createCashFlowSheet(XLSX)
        XLSX.utils.book_append_sheet(workbook, cashFlowSheet, 'Cash Flow')
      }

      // Forecasts sheet
      if (this.options.includeForecasts && this.data.forecasts) {
        const forecastSheet = this.createForecastSheet(XLSX)
        XLSX.utils.book_append_sheet(workbook, forecastSheet, 'Forecasts')
      }

      // Recommendations sheet
      if (this.options.includeRecommendations && this.data.recommendations) {
        const recsSheet = this.createRecommendationsSheet(XLSX)
        XLSX.utils.book_append_sheet(workbook, recsSheet, 'Recommendations')
      }

      // Write and download
      const filename = `working-capital-report-${this.timestamp}.xlsx`
      XLSX.writeFile(workbook, filename)
      return { success: true, filename }
    } catch (error) {
      logError('Excel export failed', error)
      return { success: false, error: error.message }
    }
  }

  // Export as PDF
  async exportPDF() {
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      let yPosition = 20

      // Title and header
      doc.setFontSize(20)
      doc.text('Working Capital Management Report', 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition)
      yPosition += 15

      // Executive Summary
      yPosition = this.addExecutiveSummary(doc, yPosition)

      // Key Metrics Table
      yPosition = this.addKeyMetricsTable(doc, yPosition)

      // AR/AP Aging Analysis
      if (this.data.receivables || this.data.payables) {
        yPosition = this.addAgingAnalysis(doc, yPosition)
      }

      // Cash Conversion Cycle Analysis
      if (this.data.cccDetails) {
        yPosition = this.addCCCAnalysis(doc, yPosition)
      }

      // Recommendations
      if (this.options.includeRecommendations && this.data.recommendations) {
        yPosition = this.addRecommendations(doc, yPosition)
      }

      // Risk Assessment
      if (this.data.risks) {
        yPosition = this.addRiskAssessment(doc, yPosition)
      }

      const filename = `working-capital-report-${this.timestamp}.pdf`
      doc.save(filename)
      return { success: true, filename }
    } catch (error) {
      logError('PDF export failed', error)
      return { success: false, error: error.message }
    }
  }

  // Export as JSON
  exportJSON() {
    try {
      const jsonData = {
        reportMetadata: {
          generatedAt: new Date().toISOString(),
          dataType: 'working-capital-report',
          version: '1.0',
          options: this.options,
        },
        data: this.data,
      }

      const filename = `working-capital-data-${this.timestamp}.json`
      this.downloadFile(JSON.stringify(jsonData, null, 2), filename, 'application/json')
      return { success: true, filename }
    } catch (error) {
      logError('JSON export failed', error)
      return { success: false, error: error.message }
    }
  }

  // Generate CSV content
  generateCSVContent() {
    let csv = 'Working Capital Management Report\n'
    csv += `Generated: ${new Date().toLocaleDateString()}\n\n`

    // Summary metrics
    csv += 'EXECUTIVE SUMMARY\n'
    csv += 'Metric,Value,Change,Status\n'

    if (this.data.summary) {
      csv += `Working Capital,${this.formatCurrency(this.data.summary.workingCapital || 0)},${this.data.summary.workingCapitalChange || 0}%,${this.getStatusText(this.data.summary.workingCapitalChange)}\n`
      csv += `Cash Conversion Cycle,${this.data.summary.cashConversionCycle || 0} days,${this.data.summary.cccChange || 0}%,${this.getStatusText(-this.data.summary.cccChange)}\n`
      csv += `Current Ratio,${this.data.summary.currentRatio || 0},${this.data.summary.currentRatioChange || 0}%,${this.getStatusText(this.data.summary.currentRatioChange)}\n`
      csv += `Quick Ratio,${this.data.summary.quickRatio || 0},${this.data.summary.quickRatioChange || 0}%,${this.getStatusText(this.data.summary.quickRatioChange)}\n`
    }

    csv += '\n'

    // AR Aging
    if (this.data.receivables) {
      csv += 'ACCOUNTS RECEIVABLE AGING\n'
      csv += 'Aging Bucket,Amount,Percentage\n'
      const total = this.data.receivables.total || 0
      csv += `Current,$${this.data.receivables.current || 0},${total > 0 ? ((this.data.receivables.current / total) * 100).toFixed(1) : 0}%\n`
      csv += `1-30 days,$${this.data.receivables['1-30'] || 0},${total > 0 ? ((this.data.receivables['1-30'] / total) * 100).toFixed(1) : 0}%\n`
      csv += `31-60 days,$${this.data.receivables['31-60'] || 0},${total > 0 ? ((this.data.receivables['31-60'] / total) * 100).toFixed(1) : 0}%\n`
      csv += `61-90 days,$${this.data.receivables['61-90'] || 0},${total > 0 ? ((this.data.receivables['61-90'] / total) * 100).toFixed(1) : 0}%\n`
      csv += `90+ days,$${this.data.receivables['90+'] || 0},${total > 0 ? ((this.data.receivables['90+'] / total) * 100).toFixed(1) : 0}%\n`
      csv += `Total,$${total},100%\n\n`

      if (this.data.receivables.topCustomers) {
        csv += 'TOP CUSTOMERS BY OUTSTANDING\n'
        csv += 'Customer,Amount,Days Outstanding\n'
        this.data.receivables.topCustomers.forEach(customer => {
          csv += `${customer.name},$${customer.amount},${customer.daysOutstanding}\n`
        })
        csv += '\n'
      }
    }

    // AP Aging
    if (this.data.payables) {
      csv += 'ACCOUNTS PAYABLE AGING\n'
      csv += 'Aging Bucket,Amount,Percentage\n'
      const total = this.data.payables.total || 0
      csv += `Current,$${this.data.payables.current || 0},${total > 0 ? ((this.data.payables.current / total) * 100).toFixed(1) : 0}%\n`
      csv += `1-30 days,$${this.data.payables['1-30'] || 0},${total > 0 ? ((this.data.payables['1-30'] / total) * 100).toFixed(1) : 0}%\n`
      csv += `31-60 days,$${this.data.payables['31-60'] || 0},${total > 0 ? ((this.data.payables['31-60'] / total) * 100).toFixed(1) : 0}%\n`
      csv += `61-90 days,$${this.data.payables['61-90'] || 0},${total > 0 ? ((this.data.payables['61-90'] / total) * 100).toFixed(1) : 0}%\n`
      csv += `90+ days,$${this.data.payables['90+'] || 0},${total > 0 ? ((this.data.payables['90+'] / total) * 100).toFixed(1) : 0}%\n`
      csv += `Total,$${total},100%\n\n`
    }

    // Recommendations
    if (this.options.includeRecommendations && this.data.recommendations) {
      csv += 'OPTIMIZATION RECOMMENDATIONS\n'
      csv += 'Priority,Title,Impact,Timeframe,Potential Savings\n'

      const recommendations = Array.isArray(this.data.recommendations)
        ? this.data.recommendations
        : this.data.recommendations.opportunities || []

      recommendations.forEach(rec => {
        csv += `${rec.priority || rec.impact},${rec.title},"${rec.description}",${rec.timeframe || rec.timeline},$${rec.potentialSaving || rec.potentialImpact || 0}\n`
      })
    }

    return csv
  }

  // Create Excel sheets
  createSummarySheet(XLSX) {
    const summaryData = []

    // Header
    summaryData.push(['Working Capital Management Report'])
    summaryData.push([`Generated: ${new Date().toLocaleDateString()}`])
    summaryData.push([]) // Empty row

    // Key metrics
    summaryData.push(['KEY METRICS'])
    summaryData.push(['Metric', 'Value', 'Change %', 'Status'])

    if (this.data.summary) {
      summaryData.push([
        'Working Capital',
        this.formatCurrency(this.data.summary.workingCapital || 0),
        `${this.data.summary.workingCapitalChange || 0}%`,
        this.getStatusText(this.data.summary.workingCapitalChange),
      ])
      summaryData.push([
        'Cash Conversion Cycle',
        `${this.data.summary.cashConversionCycle || 0} days`,
        `${this.data.summary.cccChange || 0}%`,
        this.getStatusText(-this.data.summary.cccChange),
      ])
      summaryData.push([
        'Current Ratio',
        this.data.summary.currentRatio || 0,
        `${this.data.summary.currentRatioChange || 0}%`,
        this.getStatusText(this.data.summary.currentRatioChange),
      ])
      summaryData.push([
        'Quick Ratio',
        this.data.summary.quickRatio || 0,
        `${this.data.summary.quickRatioChange || 0}%`,
        this.getStatusText(this.data.summary.quickRatioChange),
      ])
    }

    return XLSX.utils.aoa_to_sheet(summaryData)
  }

  createARAgingSheet(XLSX) {
    const arData = []
    arData.push(['Accounts Receivable Aging Report'])
    arData.push([`Generated: ${new Date().toLocaleDateString()}`])
    arData.push([])

    arData.push(['Aging Bucket', 'Amount', 'Percentage'])
    const total = this.data.receivables.total || 0

    arData.push([
      'Current',
      this.data.receivables.current || 0,
      total > 0 ? `${((this.data.receivables.current / total) * 100).toFixed(1)}%` : '0%',
    ])
    arData.push([
      '1-30 days',
      this.data.receivables['1-30'] || 0,
      total > 0 ? `${((this.data.receivables['1-30'] / total) * 100).toFixed(1)}%` : '0%',
    ])
    arData.push([
      '31-60 days',
      this.data.receivables['31-60'] || 0,
      total > 0 ? `${((this.data.receivables['31-60'] / total) * 100).toFixed(1)}%` : '0%',
    ])
    arData.push([
      '61-90 days',
      this.data.receivables['61-90'] || 0,
      total > 0 ? `${((this.data.receivables['61-90'] / total) * 100).toFixed(1)}%` : '0%',
    ])
    arData.push([
      '90+ days',
      this.data.receivables['90+'] || 0,
      total > 0 ? `${((this.data.receivables['90+'] / total) * 100).toFixed(1)}%` : '0%',
    ])
    arData.push(['Total', total, '100%'])

    if (this.data.receivables.topCustomers) {
      arData.push([])
      arData.push(['Top Customers by Outstanding'])
      arData.push(['Customer', 'Amount', 'Days Outstanding'])
      this.data.receivables.topCustomers.forEach(customer => {
        arData.push([customer.name, customer.amount, customer.daysOutstanding])
      })
    }

    return XLSX.utils.aoa_to_sheet(arData)
  }

  createAPAgingSheet(XLSX) {
    const apData = []
    apData.push(['Accounts Payable Aging Report'])
    apData.push([`Generated: ${new Date().toLocaleDateString()}`])
    apData.push([])

    apData.push(['Aging Bucket', 'Amount', 'Percentage'])
    const total = this.data.payables.total || 0

    apData.push([
      'Current',
      this.data.payables.current || 0,
      total > 0 ? `${((this.data.payables.current / total) * 100).toFixed(1)}%` : '0%',
    ])
    apData.push([
      '1-30 days',
      this.data.payables['1-30'] || 0,
      total > 0 ? `${((this.data.payables['1-30'] / total) * 100).toFixed(1)}%` : '0%',
    ])
    apData.push([
      '31-60 days',
      this.data.payables['31-60'] || 0,
      total > 0 ? `${((this.data.payables['31-60'] / total) * 100).toFixed(1)}%` : '0%',
    ])
    apData.push([
      '61-90 days',
      this.data.payables['61-90'] || 0,
      total > 0 ? `${((this.data.payables['61-90'] / total) * 100).toFixed(1)}%` : '0%',
    ])
    apData.push([
      '90+ days',
      this.data.payables['90+'] || 0,
      total > 0 ? `${((this.data.payables['90+'] / total) * 100).toFixed(1)}%` : '0%',
    ])
    apData.push(['Total', total, '100%'])

    if (this.data.payables.topSuppliers) {
      apData.push([])
      apData.push(['Top Suppliers by Outstanding'])
      apData.push(['Supplier', 'Amount', 'Days Outstanding'])
      this.data.payables.topSuppliers.forEach(supplier => {
        apData.push([supplier.name, supplier.amount, supplier.daysOutstanding])
      })
    }

    return XLSX.utils.aoa_to_sheet(apData)
  }

  createCashFlowSheet(XLSX) {
    const cashFlowData = []
    cashFlowData.push(['Cash Flow Analysis'])
    cashFlowData.push([`Generated: ${new Date().toLocaleDateString()}`])
    cashFlowData.push([])

    if (Array.isArray(this.data.cashFlow)) {
      cashFlowData.push([
        'Period',
        'Cash Inflow',
        'Cash Outflow',
        'Net Cash Flow',
        'Cumulative Cash',
      ])
      this.data.cashFlow.forEach(period => {
        cashFlowData.push([
          period.period || period.month,
          period.cashInflow || period.inflow || 0,
          period.cashOutflow || period.outflow || 0,
          period.netCashFlow || period.netCash || 0,
          period.cumulativeCash || period.runningBalance || 0,
        ])
      })
    }

    return XLSX.utils.aoa_to_sheet(cashFlowData)
  }

  createForecastSheet(XLSX) {
    const forecastData = []
    forecastData.push(['Financial Forecasts'])
    forecastData.push([`Generated: ${new Date().toLocaleDateString()}`])
    forecastData.push([])

    // Add forecast data based on available forecasts
    if (this.data.forecasts.base) {
      forecastData.push(['Base Case Forecast'])
      forecastData.push(['Period', 'Cash Inflow', 'Cash Outflow', 'Net Cash Flow', 'Confidence'])
      this.data.forecasts.base.forEach(period => {
        forecastData.push([
          period.period,
          period.cashInflow,
          period.cashOutflow,
          period.netCashFlow,
          period.confidence ? `${Math.round(period.confidence * 100)}%` : '95%',
        ])
      })
      forecastData.push([])
    }

    return XLSX.utils.aoa_to_sheet(forecastData)
  }

  createRecommendationsSheet(XLSX) {
    const recsData = []
    recsData.push(['Optimization Recommendations'])
    recsData.push([`Generated: ${new Date().toLocaleDateString()}`])
    recsData.push([])

    recsData.push(['Priority', 'Title', 'Description', 'Impact', 'Timeframe', 'Potential Savings'])

    const recommendations = Array.isArray(this.data.recommendations)
      ? this.data.recommendations
      : this.data.recommendations.opportunities || []

    recommendations.forEach(rec => {
      recsData.push([
        rec.priority || rec.impact,
        rec.title,
        rec.description,
        rec.impact,
        rec.timeframe || rec.timeline,
        rec.potentialSaving || rec.potentialImpact || 0,
      ])
    })

    return XLSX.utils.aoa_to_sheet(recsData)
  }

  // PDF Helper Methods
  addExecutiveSummary(doc, yPosition) {
    doc.setFontSize(14)
    doc.text('Executive Summary', 20, yPosition)
    yPosition += 10

    if (this.data.summary) {
      doc.setFontSize(10)
      doc.text(
        `Working Capital: ${this.formatCurrency(this.data.summary.workingCapital || 0)}`,
        20,
        yPosition
      )
      doc.text(`Change: ${this.data.summary.workingCapitalChange || 0}%`, 120, yPosition)
      yPosition += 6

      doc.text(
        `Cash Conversion Cycle: ${this.data.summary.cashConversionCycle || 0} days`,
        20,
        yPosition
      )
      doc.text(`Change: ${this.data.summary.cccChange || 0}%`, 120, yPosition)
      yPosition += 6

      doc.text(`Current Ratio: ${this.data.summary.currentRatio || 0}`, 20, yPosition)
      doc.text(`Quick Ratio: ${this.data.summary.quickRatio || 0}`, 120, yPosition)
      yPosition += 10
    }

    return yPosition
  }

  addKeyMetricsTable(doc, yPosition) {
    if (!this.data.summary) return yPosition

    const tableData = [
      ['Metric', 'Current Value', 'Change %', 'Status'],
      [
        'Working Capital',
        this.formatCurrency(this.data.summary.workingCapital || 0),
        `${this.data.summary.workingCapitalChange || 0}%`,
        this.getStatusText(this.data.summary.workingCapitalChange),
      ],
      [
        'Cash Conversion Cycle',
        `${this.data.summary.cashConversionCycle || 0} days`,
        `${this.data.summary.cccChange || 0}%`,
        this.getStatusText(-this.data.summary.cccChange),
      ],
      [
        'Current Ratio',
        this.data.summary.currentRatio || 0,
        `${this.data.summary.currentRatioChange || 0}%`,
        this.getStatusText(this.data.summary.currentRatioChange),
      ],
      [
        'Quick Ratio',
        this.data.summary.quickRatio || 0,
        `${this.data.summary.quickRatioChange || 0}%`,
        this.getStatusText(this.data.summary.quickRatioChange),
      ],
    ]

    doc.autoTable({
      startY: yPosition,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'striped',
      margin: { left: 20 },
    })

    return doc.lastAutoTable.finalY + 15
  }

  addAgingAnalysis(doc, yPosition) {
    doc.setFontSize(14)
    doc.text('Aging Analysis', 20, yPosition)
    yPosition += 10

    if (this.data.receivables) {
      const arData = [
        ['AR Aging Bucket', 'Amount', 'Percentage'],
        [
          'Current',
          this.formatCurrency(this.data.receivables.current || 0),
          this.getPercentage(this.data.receivables.current, this.data.receivables.total),
        ],
        [
          '1-30 days',
          this.formatCurrency(this.data.receivables['1-30'] || 0),
          this.getPercentage(this.data.receivables['1-30'], this.data.receivables.total),
        ],
        [
          '31-60 days',
          this.formatCurrency(this.data.receivables['31-60'] || 0),
          this.getPercentage(this.data.receivables['31-60'], this.data.receivables.total),
        ],
        [
          '61-90 days',
          this.formatCurrency(this.data.receivables['61-90'] || 0),
          this.getPercentage(this.data.receivables['61-90'], this.data.receivables.total),
        ],
        [
          '90+ days',
          this.formatCurrency(this.data.receivables['90+'] || 0),
          this.getPercentage(this.data.receivables['90+'], this.data.receivables.total),
        ],
        ['Total', this.formatCurrency(this.data.receivables.total || 0), '100%'],
      ]

      doc.autoTable({
        startY: yPosition,
        head: [arData[0]],
        body: arData.slice(1),
        theme: 'grid',
        margin: { left: 20 },
      })

      yPosition = doc.lastAutoTable.finalY + 10
    }

    return yPosition
  }

  addCCCAnalysis(doc, yPosition) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.text('Cash Conversion Cycle Analysis', 20, yPosition)
    yPosition += 10

    if (this.data.cccDetails) {
      const cccData = [
        ['Component', 'Days', 'Target', 'Variance'],
        [
          'Days Sales Outstanding (DSO)',
          this.data.cccDetails.daysSalesOutstanding || 0,
          '35',
          `${(this.data.cccDetails.daysSalesOutstanding || 0) - 35}`,
        ],
        [
          'Days Inventory Outstanding (DIO)',
          this.data.cccDetails.daysInventoryOutstanding || 0,
          '30',
          `${(this.data.cccDetails.daysInventoryOutstanding || 0) - 30}`,
        ],
        [
          'Days Payable Outstanding (DPO)',
          this.data.cccDetails.daysPayableOutstanding || 0,
          '40',
          `${40 - (this.data.cccDetails.daysPayableOutstanding || 0)}`,
        ],
        [
          'Cash Conversion Cycle',
          this.data.cccDetails.cashConversionCycle || 0,
          '25',
          `${(this.data.cccDetails.cashConversionCycle || 0) - 25}`,
        ],
      ]

      doc.autoTable({
        startY: yPosition,
        head: [cccData[0]],
        body: cccData.slice(1),
        theme: 'grid',
        margin: { left: 20 },
      })

      yPosition = doc.lastAutoTable.finalY + 10
    }

    return yPosition
  }

  addRecommendations(doc, yPosition) {
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.text('Optimization Recommendations', 20, yPosition)
    yPosition += 10

    const recommendations = Array.isArray(this.data.recommendations)
      ? this.data.recommendations
      : this.data.recommendations.opportunities || []

    if (recommendations.length > 0) {
      const recsData = [['Priority', 'Title', 'Impact', 'Timeframe']]
      recommendations.slice(0, 5).forEach(rec => {
        // Limit to top 5 for PDF
        recsData.push([
          rec.priority || rec.impact,
          rec.title.substring(0, 30) + (rec.title.length > 30 ? '...' : ''),
          this.formatCurrency(rec.potentialSaving || rec.potentialImpact || 0),
          rec.timeframe || rec.timeline || 'TBD',
        ])
      })

      doc.autoTable({
        startY: yPosition,
        head: [recsData[0]],
        body: recsData.slice(1),
        theme: 'grid',
        margin: { left: 20 },
        columnStyles: { 1: { cellWidth: 60 } },
      })

      yPosition = doc.lastAutoTable.finalY + 10
    }

    return yPosition
  }

  addRiskAssessment(doc, yPosition) {
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.text('Risk Assessment', 20, yPosition)
    yPosition += 10

    if (this.data.risks && this.data.risks.risks) {
      doc.setFontSize(10)
      doc.text(`Risk Level: ${this.data.risks.riskLevel.toUpperCase()}`, 20, yPosition)
      yPosition += 6
      doc.text(`Total Risks Identified: ${this.data.risks.summary.totalRisks}`, 20, yPosition)
      yPosition += 6
      doc.text(`Critical Risks: ${this.data.risks.summary.criticalRisks}`, 20, yPosition)
      yPosition += 10

      if (this.data.risks.risks.length > 0) {
        this.data.risks.risks.slice(0, 3).forEach((risk, index) => {
          doc.text(`${index + 1}. ${risk.type} (${risk.severity.toUpperCase()})`, 25, yPosition)
          yPosition += 5
          doc.text(`   ${risk.description.substring(0, 80)}...`, 25, yPosition)
          yPosition += 8
        })
      }
    }

    return yPosition
  }

  // Utility methods
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0)
  }

  getPercentage(value, total) {
    return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%'
  }

  getStatusText(changePercent) {
    if (changePercent === null || changePercent === undefined) return 'N/A'
    if (changePercent > 5) return 'Improving'
    if (changePercent < -5) return 'Declining'
    return 'Stable'
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Export service functions for integration
export async function exportWorkingCapitalData(data, format, options = {}) {
  const exporter = new WorkingCapitalExporter(data, options)

  switch (format.toLowerCase()) {
    case 'csv':
      return exporter.exportCSV()
    case 'excel':
    case 'xlsx':
      return exporter.exportExcel()
    case 'pdf':
      return exporter.exportPDF()
    case 'json':
      return exporter.exportJSON()
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

// Quick export functions
export const quickExportCSV = (data, options = {}) => exportWorkingCapitalData(data, 'csv', options)
export const quickExportExcel = (data, options = {}) =>
  exportWorkingCapitalData(data, 'excel', options)
export const quickExportPDF = (data, options = {}) => exportWorkingCapitalData(data, 'pdf', options)
export const quickExportJSON = (data, options = {}) =>
  exportWorkingCapitalData(data, 'json', options)

export default {
  WorkingCapitalExporter,
  exportWorkingCapitalData,
  quickExportCSV,
  quickExportExcel,
  quickExportPDF,
  quickExportJSON,
}
