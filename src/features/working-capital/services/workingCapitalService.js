const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api'
const MCP_BASE = import.meta.env?.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com'

// Import forecasting utilities for advanced analytics
import { forecastingUtils } from '../utils/forecastingUtils.js'

// Mock data for development/fallback
const generateMockData = (period = 'month') => {
  const now = new Date()
  const daysInPeriod = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365

  // Generate cash flow data
  const cashFlowData = []
  for (let i = daysInPeriod; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    cashFlowData.push({
      date: date.toISOString().split('T')[0],
      inflows: 50000 + Math.random() * 50000,
      outflows: 40000 + Math.random() * 40000,
      net: 0
    })
    cashFlowData[cashFlowData.length - 1].net =
      cashFlowData[cashFlowData.length - 1].inflows -
      cashFlowData[cashFlowData.length - 1].outflows
  }

  return {
    // Key metrics
    cashPosition: 1250000 + Math.random() * 500000,
    cashTrend: Math.random() * 20 - 10,
    dso: 35 + Math.floor(Math.random() * 10),
    dsoTrend: Math.random() * 10 - 5,
    dpo: 42 + Math.floor(Math.random() * 10),
    dpoTrend: Math.random() * 10 - 5,
    dio: 28 + Math.floor(Math.random() * 10),
    cashConversionCycle: 21 + Math.floor(Math.random() * 10),
    cccTrend: Math.random() * 10 - 5,

    // Cash flow time series
    cashFlow: cashFlowData,

    // AR Aging
    arAging: {
      current: 450000,
      '1-30': 125000,
      '31-60': 65000,
      '61-90': 25000,
      '90+': 15000,
      total: 680000,
      topCustomers: [
        { name: 'Customer A', amount: 125000, daysOutstanding: 25 },
        { name: 'Customer B', amount: 95000, daysOutstanding: 45 },
        { name: 'Customer C', amount: 80000, daysOutstanding: 15 },
        { name: 'Customer D', amount: 65000, daysOutstanding: 72 },
        { name: 'Customer E', amount: 45000, daysOutstanding: 35 }
      ]
    },

    // AP Aging
    apAging: {
      current: 380000,
      '1-30': 95000,
      '31-60': 45000,
      '61-90': 15000,
      '90+': 8000,
      total: 543000,
      topSuppliers: [
        { name: 'Supplier X', amount: 85000, daysOutstanding: 20 },
        { name: 'Supplier Y', amount: 72000, daysOutstanding: 35 },
        { name: 'Supplier Z', amount: 55000, daysOutstanding: 18 },
        { name: 'Supplier W', amount: 42000, daysOutstanding: 55 },
        { name: 'Supplier V', amount: 38000, daysOutstanding: 42 }
      ]
    },

    // Inventory metrics
    inventory: {
      totalValue: 850000,
      turnoverRatio: 12.5,
      daysOnHand: 29.2,
      categories: [
        { name: 'Raw Materials', value: 320000, turnover: 15.2 },
        { name: 'Work in Progress', value: 180000, turnover: 18.5 },
        { name: 'Finished Goods', value: 350000, turnover: 8.7 }
      ],
      slowMoving: [
        { sku: 'SKU-1234', name: 'Product A', value: 25000, daysOnHand: 120 },
        { sku: 'SKU-5678', name: 'Product B', value: 18000, daysOnHand: 95 },
        { sku: 'SKU-9012', name: 'Product C', value: 12000, daysOnHand: 85 }
      ]
    },

    // Cash conversion cycle details
    cccDetails: {
      daysInventoryOutstanding: 28,
      daysSalesOutstanding: 35,
      daysPayableOutstanding: 42,
      cashConversionCycle: 21,
      trend: 'improving',
      components: [
        { metric: 'DIO', value: 28, target: 25 },
        { metric: 'DSO', value: 35, target: 30 },
        { metric: 'DPO', value: 42, target: 45 },
        { metric: 'CCC', value: 21, target: 15 }
      ]
    },

    // Forecast data (13 weeks)
    forecast: {
      weeks: [],
      confidence: 85,
      assumptions: [
        'Historical collection patterns continue',
        'No major customer defaults',
        'Seasonal trends accounted for',
        'Current payment terms maintained'
      ]
    },

    // Alerts and insights
    alerts: [
      {
        severity: 'warning',
        message: '3 invoices over 90 days outstanding',
        value: 15000,
        action: 'Review collection strategy'
      },
      {
        severity: 'info',
        message: 'Cash position improved 5% this month',
        value: 62500,
        action: null
      },
      {
        severity: 'warning',
        message: 'Inventory turnover below target',
        value: null,
        action: 'Review slow-moving SKUs'
      }
    ],

    lastUpdated: new Date().toISOString()
  }
}

export async function fetchWorkingCapitalMetrics(period = 'month') {
  try {
    // Try MCP server first
    const response = await fetch(`${MCP_BASE}/v1/financial/working-capital?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const data = await response.json()
      return {
        ...data,
        source: 'mcp'
      }
    }
  } catch (error) {
    console.warn('MCP server unavailable, falling back to mock data:', error.message)
  }

  // Try main API
  try {
    const response = await fetch(`${API_BASE}/working-capital/metrics?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const data = await response.json()
      return {
        ...data,
        source: 'api'
      }
    }
  } catch (error) {
    console.warn('API unavailable, using mock data:', error.message)
  }

  // Return mock data
  return {
    ...generateMockData(period),
    source: 'mock'
  }
}

// Enhanced export function using the comprehensive export service
export async function exportWorkingCapitalData(format = 'csv', period = 'month', options = {}) {
  try {
    // Import the export service dynamically to avoid bundle size issues
    const { exportWorkingCapitalData: exportData } = await import('./exportService.js')

    // Get comprehensive data for export
    const data = await fetchWorkingCapitalMetrics(period)

    // Add forecast data if requested
    if (options.includeForecasts) {
      try {
        const forecastResult = await generateCashFlowForecast({ periods: 6 })
        if (forecastResult.success) {
          data.forecasts = forecastResult.forecast
        }
      } catch (error) {
        console.warn('Could not include forecasts in export:', error)
      }
    }

    // Add optimization recommendations if requested
    if (options.includeRecommendations) {
      try {
        const recsResult = await generateOptimizationRecommendations(data.summary || {})
        if (recsResult.success) {
          data.recommendations = recsResult.opportunities
        }
      } catch (error) {
        console.warn('Could not include recommendations in export:', error)
      }
    }

    // Add risk assessment if requested
    if (options.includeRiskAssessment && data.forecasts) {
      try {
        const riskResult = await assessCashFlowRisk(data.forecasts.base || [])
        if (riskResult.success) {
          data.risks = riskResult
        }
      } catch (error) {
        console.warn('Could not include risk assessment in export:', error)
      }
    }

    // Export using the enhanced export service
    const result = await exportData(data, format, {
      includeCharts: options.includeCharts || false,
      includeForecasts: options.includeForecasts || true,
      includeRecommendations: options.includeRecommendations || true,
      dateRange: period,
      ...options
    })

    return result
  } catch (error) {
    console.error('Enhanced export failed, falling back to simple export:', error)

    // Fallback to simple export for compatibility
    const data = await fetchWorkingCapitalMetrics(period)

    if (format === 'csv') {
      const csv = convertToCSV(data)
      downloadFile(csv, `working-capital-${period}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      return { success: true, filename: `working-capital-${period}.csv` }
    } else if (format === 'json') {
      const json = JSON.stringify(data, null, 2)
      downloadFile(json, `working-capital-${period}-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
      return { success: true, filename: `working-capital-${period}.json` }
    }

    return { success: false, error: error.message }
  }
}

// Legacy export function for backward compatibility
export async function exportWorkingCapitalDataLegacy(format = 'csv', period = 'month') {
  const data = await fetchWorkingCapitalMetrics(period)

  if (format === 'csv') {
    const csv = convertToCSV(data)
    downloadFile(csv, `working-capital-${period}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  } else if (format === 'json') {
    const json = JSON.stringify(data, null, 2)
    downloadFile(json, `working-capital-${period}-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
  }
}

function convertToCSV(data) {
  // Simple CSV conversion for key metrics
  let csv = 'Metric,Value,Trend\n'
  csv += `Cash Position,${data.cashPosition},${data.cashTrend}%\n`
  csv += `DSO,${data.dso},${data.dsoTrend}%\n`
  csv += `DPO,${data.dpo},${data.dpoTrend}%\n`
  csv += `Cash Conversion Cycle,${data.cashConversionCycle},${data.cccTrend}%\n`

  // Add AR aging
  csv += '\nAR Aging Buckets,Amount\n'
  csv += `Current,${data.arAging.current}\n`
  csv += `1-30 days,${data.arAging['1-30']}\n`
  csv += `31-60 days,${data.arAging['31-60']}\n`
  csv += `61-90 days,${data.arAging['61-90']}\n`
  csv += `90+ days,${data.arAging['90+']}\n`

  return csv
}

function downloadFile(content, filename, mimeType) {
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

// Enhanced forecasting services
export async function generateCashFlowForecast(options = {}) {
  try {
    // First try to get real historical data
    let historicalData = []
    try {
      const response = await fetch(`${MCP_BASE}/api/working-capital/historical-cash-flow`)
      if (response.ok) {
        historicalData = await response.json()
      }
    } catch (error) {
      console.warn('Could not fetch historical cash flow data, using mock data')
    }

    // Use mock data if no real data available
    if (historicalData.length === 0) {
      historicalData = generateMockCashFlowHistory(12) // 12 months of mock data
    }

    // Generate forecast using forecasting utilities
    const forecast = forecastingUtils.generateCashFlowForecast(historicalData, {
      periods: options.periods || 6,
      includeMonteCarlo: options.includeMonteCarlo || false,
      iterations: options.iterations || 1000
    })

    return {
      success: true,
      forecast,
      historical: historicalData,
      metadata: {
        periods: options.periods || 6,
        confidenceLevel: 0.95,
        lastUpdated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error generating cash flow forecast:', error)
    return {
      success: false,
      error: 'Failed to generate cash flow forecast'
    }
  }
}

export async function generateWorkingCapitalForecast(options = {}) {
  try {
    // Get historical working capital metrics
    let historicalMetrics = []
    try {
      const response = await fetch(`${MCP_BASE}/api/working-capital/historical-metrics`)
      if (response.ok) {
        historicalMetrics = await response.json()
      }
    } catch (error) {
      console.warn('Could not fetch historical metrics, using mock data')
    }

    // Use mock data if no real data available
    if (historicalMetrics.length === 0) {
      historicalMetrics = generateMockMetricsHistory(12)
    }

    // Generate forecast
    const forecast = forecastingUtils.forecastWorkingCapitalMetrics(historicalMetrics, {
      periods: options.periods || 6
    })

    return {
      success: true,
      forecast,
      historical: historicalMetrics,
      metadata: {
        periods: options.periods || 6,
        lastUpdated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error generating working capital forecast:', error)
    return {
      success: false,
      error: 'Failed to generate working capital forecast'
    }
  }
}

export async function generateOptimizationRecommendations(currentMetrics, options = {}) {
  try {
    // Industry benchmarks (could be fetched from API in real implementation)
    const industryBenchmarks = {
      dso: 35,
      dio: 30,
      dpo: 40,
      currentRatio: 2.0,
      quickRatio: 1.5,
      ...options.benchmarks
    }

    const recommendations = forecastingUtils.generateOptimizationRecommendations(
      currentMetrics,
      industryBenchmarks
    )

    return {
      success: true,
      ...recommendations,
      metadata: {
        benchmarksUsed: industryBenchmarks,
        lastUpdated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error generating optimization recommendations:', error)
    return {
      success: false,
      error: 'Failed to generate optimization recommendations'
    }
  }
}

export async function assessCashFlowRisk(forecastData, options = {}) {
  try {
    const riskAssessment = forecastingUtils.assessCashFlowRisk(forecastData, options.thresholds)

    return {
      success: true,
      ...riskAssessment,
      metadata: {
        thresholdsUsed: options.thresholds || {},
        lastUpdated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error assessing cash flow risk:', error)
    return {
      success: false,
      error: 'Failed to assess cash flow risk'
    }
  }
}

export async function createScenarioAnalysis(baseData, scenarioDefinitions = {}) {
  try {
    const scenarios = forecastingUtils.createScenarioModels(baseData, scenarioDefinitions)

    return {
      success: true,
      scenarios,
      baseData,
      metadata: {
        scenariosGenerated: Object.keys(scenarios),
        lastUpdated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating scenario analysis:', error)
    return {
      success: false,
      error: 'Failed to create scenario analysis'
    }
  }
}

// Helper functions to generate mock historical data
function generateMockCashFlowHistory(months) {
  const history = []
  const baseDate = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setMonth(date.getMonth() - i)

    const seasonalFactor = 1 + (0.15 * Math.sin((date.getMonth() / 12) * 2 * Math.PI))
    const baseInflow = 150000 * seasonalFactor
    const baseOutflow = 120000 * seasonalFactor

    history.push({
      date: date.toISOString(),
      period: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      cashInflow: Math.round(baseInflow + ((Math.random() - 0.5) * 30000)),
      cashOutflow: Math.round(baseOutflow + ((Math.random() - 0.5) * 20000)),
      netCashFlow: 0, // Will be calculated
      cumulativeCash: 0 // Will be calculated
    })
  }

  // Calculate net flow and cumulative cash
  let runningCash = 200000 // Starting balance
  history.forEach(period => {
    period.netCashFlow = period.cashInflow - period.cashOutflow
    runningCash += period.netCashFlow
    period.cumulativeCash = runningCash
  })

  return history
}

function generateMockMetricsHistory(months) {
  const history = []
  const baseDate = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setMonth(date.getMonth() - i)

    // Add some realistic variance over time
    const trendFactor = 1 - (i * 0.02) // Slight improvement over time
    const randomFactor = 0.9 + (Math.random() * 0.2) // ±10% variance

    history.push({
      date: date.toISOString(),
      period: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      dso: Math.round(38 * trendFactor * randomFactor),
      dio: Math.round(32 * trendFactor * randomFactor),
      dpo: Math.round(35 * (1 + (1 - trendFactor)) * randomFactor), // DPO improvement is inverse
      ccc: 0 // Will be calculated
    })
  }

  // Calculate CCC for each period
  history.forEach(period => {
    period.ccc = period.dso + period.dio - period.dpo
  })

  return history
}