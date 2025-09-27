const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api'
const MCP_BASE = import.meta.env?.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com'

// Import structured logger
import { logWarn } from '../../../utils/structuredLogger.js'

// Mock data for development/fallback
const generateMockInventoryData = (period = 'current', category = 'all', location = 'all') => {
  const now = new Date()

  // Generate SKU data based on filters
  const allSkus = [
    { code: 'SNTG-001', name: 'Sentia Ginger 001', category: 'finished-goods', baseStock: 2500 },
    { code: 'SNTG-002', name: 'Sentia Ginger 002', category: 'finished-goods', baseStock: 1800 },
    { code: 'SNTG-003', name: 'Sentia Ginger 003', category: 'finished-goods', baseStock: 3200 },
    { code: 'SNTB-001', name: 'Sentia Black 001', category: 'finished-goods', baseStock: 2100 },
    { code: 'SNTB-002', name: 'Sentia Black 002', category: 'finished-goods', baseStock: 1600 },
    { code: 'SNTR-001', name: 'Sentia Red 001', category: 'finished-goods', baseStock: 1900 },
    { code: 'SNTR-002', name: 'Sentia Red 002', category: 'finished-goods', baseStock: 2300 },
    { code: 'RM-001', name: 'Raw Material Alpha', category: 'raw-materials', baseStock: 5000 },
    { code: 'RM-002', name: 'Raw Material Beta', category: 'raw-materials', baseStock: 4500 },
    { code: 'PKG-001', name: 'Primary Packaging', category: 'packaging', baseStock: 8000 },
    { code: 'PKG-002', name: 'Secondary Packaging', category: 'packaging', baseStock: 6500 },
    { code: 'COMP-001', name: 'Component Alpha', category: 'work-in-progress', baseStock: 1500 },
    { code: 'COMP-002', name: 'Component Beta', category: 'work-in-progress', baseStock: 1200 }
  ]

  const allLocations = [
    'UK-London', 'UK-Manchester', 'EU-Amsterdam', 'EU-Berlin',
    'US-NYC', 'US-LA', 'US-Chicago'
  ]

  // Filter SKUs by category
  const filteredSkus = category === 'all' ? allSkus :
    allSkus.filter(sku => sku.category === category)

  // Filter locations
  const filteredLocations = location === 'all' ? allLocations :
    allLocations.filter(loc => loc === location)

  // Generate heatmap data
  const heatmapData = filteredSkus.map(sku => ({
    sku: sku.code,
    name: sku.name,
    category: sku.category,
    locations: filteredLocations.map(loc => {
      const baseQty = sku.baseStock / filteredLocations.length
      const variance = 0.8 + (Math.random() * 0.4) // ±20% variance
      const quantity = Math.floor(baseQty * variance)
      const daysOfSupply = Math.floor(Math.random() * 90) + 10
      const status = quantity < (baseQty * 0.3) ? 'critical' :
                   quantity < (baseQty * 0.6) ? 'warning' : 'healthy'

      return {
        location: loc,
        quantity,
        daysOfSupply,
        status
      }
    })
  }))

  // Generate turnover data
  const turnoverData = [
    { category: 'Raw Materials', current: 15.2, target: 18, trend: 1.2, value: 320000 },
    { category: 'Work in Progress', current: 24.8, target: 26, trend: -0.8, value: 180000 },
    { category: 'Finished Goods', current: 8.7, target: 12, trend: 0.5, value: 450000 },
    { category: 'Packaging', current: 20.1, target: 22, trend: 2.1, value: 95000 },
    { category: 'Components', current: 11.3, target: 15, trend: -1.5, value: 275000 }
  ]

  // Generate reorder points data
  const reorderPointsData = {
    criticalItems: [
      { sku: 'SNTG-001', name: 'Sentia Ginger 001', currentStock: 245, reorderPoint: 500, leadTimeDays: 7, status: 'critical' },
      { sku: 'SNTB-002', name: 'Sentia Black 002', currentStock: 380, reorderPoint: 400, leadTimeDays: 5, status: 'warning' },
      { sku: 'SNTR-001', name: 'Sentia Red 001', currentStock: 150, reorderPoint: 300, leadTimeDays: 14, status: 'critical' }
    ],
    upcomingReorders: [
      { sku: 'SNTG-003', name: 'Sentia Ginger 003', currentStock: 520, reorderPoint: 500, daysUntilReorder: 3, status: 'warning' },
      { sku: 'SNTB-001', name: 'Sentia Black 001', currentStock: 640, reorderPoint: 600, daysUntilReorder: 7, status: 'watch' },
      { sku: 'SNTR-002', name: 'Sentia Red 002', currentStock: 850, reorderPoint: 750, daysUntilReorder: 12, status: 'watch' }
    ]
  }

  // Generate slow moving stock data
  const slowMovingData = [
    {
      sku: 'SNTG-005',
      name: 'Sentia Ginger Special Edition',
      quantity: 850,
      value: 12750,
      daysOnHand: 180,
      lastMovement: '2024-06-15',
      location: 'UK-London',
      category: 'finished-goods',
      urgency: 'high'
    },
    {
      sku: 'PKG-001',
      name: 'Legacy Packaging Material',
      quantity: 2500,
      value: 3750,
      daysOnHand: 240,
      lastMovement: '2024-05-20',
      location: 'UK-Manchester',
      category: 'packaging',
      urgency: 'critical'
    }
  ]

  // Calculate summary metrics
  const totalValue = heatmapData.reduce((sum, sku) =>
    sum + sku.locations.reduce((locSum, loc) => locSum + (loc.quantity * 15), 0), 0
  )
  const avgTurnover = turnoverData.reduce((sum, cat) => sum + cat.current, 0) / turnoverData.length
  const avgDaysOnHand = Math.round(365 / avgTurnover)
  const criticalCount = heatmapData.reduce((count, sku) =>
    count + sku.locations.filter(loc => loc.status === 'critical').length, 0
  )

  return {
    summary: {
      totalValue,
      valueChange: 2.3,
      turnoverRatio: avgTurnover,
      turnoverChange: 0.8,
      daysOnHand: avgDaysOnHand,
      daysOnHandChange: -2.1,
      stockoutRisk: criticalCount,
      stockoutRiskChange: -1.5
    },
    stockLevels: {
      heatmapData,
      chartData: null // Would contain time series data
    },
    reorderPoints: reorderPointsData,
    turnover: {
      chartData: turnoverData
    },
    slowMoving: slowMovingData,
    forecast: null, // Would contain forecasting data
    alerts: [
      {
        severity: 'critical',
        title: 'Critical Stock Levels',
        message: `${criticalCount} items are at critical stock levels`,
        action: 'Review Reorder Points'
      },
      {
        severity: 'warning',
        title: 'Slow-Moving Inventory',
        message: `${slowMovingData.length} items have not moved in 90+ days`,
        action: 'Create Clearance Plan'
      }
    ],
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchInventoryMetrics(period = 'current', category = 'all', location = 'all') {
  try {
    // Try MCP server first
    const response = await fetch(`${MCP_BASE}/v1/inventory/metrics?period=${period}&category=${category}&location=${location}`, {
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
    logWarn('MCP server unavailable, falling back to mock data', { error: error.message })
  }

  // Try main API
  try {
    const response = await fetch(`${API_BASE}/inventory/metrics?period=${period}&category=${category}&location=${location}`, {
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
    logWarn('API unavailable, using mock data', { error: error.message })
  }

  // Return mock data
  return {
    ...generateMockInventoryData(period, category, location),
    source: 'mock'
  }
}

export async function exportInventoryData(format = 'csv', period = 'current', category = 'all', location = 'all') {
  const data = await fetchInventoryMetrics(period, category, location)

  if (format === 'csv') {
    const csv = convertInventoryToCSV(data)
    downloadFile(csv, `inventory-${period}-${category}-${location}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  } else if (format === 'excel') {
    // For Excel, we'll use CSV for now but could implement proper Excel export later
    const csv = convertInventoryToCSV(data)
    downloadFile(csv, `inventory-${period}-${category}-${location}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  } else if (format === 'pdf') {
    // For PDF, export as JSON for now
    const json = JSON.stringify(data, null, 2)
    downloadFile(json, `inventory-${period}-${category}-${location}-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
  }
}

function convertInventoryToCSV(data) {
  let csv = 'SKU,Name,Location,Quantity,Status,Days_of_Supply,Category\n'

  // Add stock levels data
  data.stockLevels.heatmapData.forEach(sku => {
    sku.locations.forEach(loc => {
      csv += `${sku.sku},"${sku.name}",${loc.location},${loc.quantity},${loc.status},${loc.daysOfSupply},"${sku.category}"\n`
    })
  })

  // Add turnover data
  csv += '\nTurnover Analysis,Current,Target,Trend,Value\n'
  data.turnover.chartData.forEach(item => {
    csv += `"${item.category}",${item.current},${item.target},${item.trend},${item.value}\n`
  })

  // Add reorder points
  csv += '\nReorder Points - Critical Items,Current Stock,Reorder Point,Lead Time Days,Status\n'
  data.reorderPoints.criticalItems.forEach(item => {
    csv += `${item.sku},${item.currentStock},${item.reorderPoint},${item.leadTimeDays},${item.status}\n`
  })

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