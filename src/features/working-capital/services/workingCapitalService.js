const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api'
const MCP_BASE = import.meta.env?.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com'

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

export async function exportWorkingCapitalData(format = 'csv', period = 'month') {
  const data = await fetchWorkingCapitalMetrics(period)

  if (format === 'csv') {
    // Convert to CSV
    const csv = convertToCSV(data)
    downloadFile(csv, `working-capital-${period}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  } else if (format === 'json') {
    // Download as JSON
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