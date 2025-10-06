import express from 'express'

const router = express.Router()

const dashboardSummary = {
  revenue: {
    monthly: 2480000,
    quarterly: 7450000,
    yearly: 31200000,
    growth: 11.4
  },
  workingCapital: {
    current: 1880000,
    ratio: 2.6,
    cashFlow: 830000,
    daysReceivable: 44
  },
  production: {
    efficiency: 92.5,
    unitsProduced: 11840,
    defectRate: 0.9,
    oeeScore: 86.1
  },
  inventory: {
    turnover: 5.2,
    stockouts: 3,
    coverageDays: 48,
    accuracy: 97.3
  },
  alerts: [
    { id: 'wc-low-cash', severity: 'warning', message: 'Cash buffer below 90 day target' },
    { id: 'inv-reorder', severity: 'info', message: '12 SKUs approaching reorder point' }
  ]
}

const dashboardMetrics = {
  revenueTrend: [
    { month: 'Jan', value: 2.1 },
    { month: 'Feb', value: 2.3 },
    { month: 'Mar', value: 2.4 },
    { month: 'Apr', value: 2.6 },
    { month: 'May', value: 2.7 },
    { month: 'Jun', value: 2.8 }
  ],
  fulfillmentRate: 96.4,
  backlogOrders: 42,
  workforceAvailability: 92.1,
  machineUtilization: 87.5
}

const dashboardKpis = [
  { id: 'revenue', label: 'Monthly revenue', value: '$2.48M', change: '+11.4%' },
  { id: 'inventory', label: 'Inventory coverage', value: '48 days', change: '-3 days' },
  { id: 'cash', label: 'Operating cash flow', value: '$830K', change: '+5.2%' },
  { id: 'orders', label: 'Orders shipped', value: '1,184', change: '+7.3%' }
]

const realtimeStatus = {
  lastUpdated: new Date().toISOString(),
  systemsOnline: 18,
  incidentsOpen: 1,
  maintenanceWindows: [
    { id: 'mw-0421', start: '2025-09-30T02:00:00Z', durationMinutes: 45, system: 'Packaging Line 2' }
  ],
  notifications: [
    { id: 'notif-1', type: 'info', message: 'AI forecast refresh completed successfully' }
  ]
}

const widgetRegistry = {
  revenue: {
    title: 'Revenue performance',
    dataset: dashboardMetrics.revenueTrend
  },
  supplyChain: {
    title: 'Supply chain risk',
    dataset: {
      suppliersMonitored: 42,
      atRisk: 3,
      leadTimeTrend: [5, 6, 7, 6, 6.5, 6.2]
    }
  }
}

let dashboardLayout = {
  widgets: [
    { id: 'revenue', x: 0, y: 0, w: 6, h: 3 },
    { id: 'inventory', x: 6, y: 0, w: 6, h: 3 },
    { id: 'production', x: 0, y: 3, w: 8, h: 4 },
    { id: 'alerts', x: 8, y: 3, w: 4, h: 2 }
  ],
  updatedAt: new Date().toISOString()
}

const workingCapitalHistory = [
  {
    date: '2025-06-01',
    currentAssets: 5320000,
    currentLiabilities: 2100000,
    cash: 1250000,
    accountsReceivable: 1620000,
    inventory: 2450000,
    quickRatio: 1.82,
    workingCapitalRatio: 2.53,
    cashConversionCycle: 64,
    dso: 42,
    dpo: 34,
    dio: 56
  },
  {
    date: '2025-05-01',
    currentAssets: 5210000,
    currentLiabilities: 2140000,
    cash: 1170000,
    accountsReceivable: 1580000,
    inventory: 2380000,
    quickRatio: 1.74,
    workingCapitalRatio: 2.43,
    cashConversionCycle: 66,
    dso: 43,
    dpo: 33,
    dio: 58
  },
  {
    date: '2025-04-01',
    currentAssets: 5150000,
    currentLiabilities: 2180000,
    cash: 1120000,
    accountsReceivable: 1520000,
    inventory: 2340000,
    quickRatio: 1.66,
    workingCapitalRatio: 2.36,
    cashConversionCycle: 69,
    dso: 45,
    dpo: 32,
    dio: 60
  }
]

const cashFlowHistory = [
  {
    date: '2025-05-31',
    operatingCashFlow: 620000,
    investingCashFlow: -185000,
    financingCashFlow: -95000,
    netCashFlow: 340000
  },
  {
    date: '2025-04-30',
    operatingCashFlow: 580000,
    investingCashFlow: -210000,
    financingCashFlow: -85000,
    netCashFlow: 285000
  },
  {
    date: '2025-03-31',
    operatingCashFlow: 545000,
    investingCashFlow: -190000,
    financingCashFlow: -125000,
    netCashFlow: 230000
  }
]

const financialMetrics = {
  liquidity: {
    currentRatio: 2.6,
    quickRatio: 1.8,
    cashRatio: 0.7
  },
  receivables: {
    dso: 42,
    overduePercentage: 7.1,
    collectorEfficiency: 92
  },
  payables: {
    dpo: 34,
    earlyPaymentOpportunities: 5,
    discountsCaptured: 72000
  },
  conversionCycle: {
    cashConversionCycle: 64,
    trend: 'improving',
    change: -5
  }
}

const aiModels = [
  { id: 'wc-optimizer', name: 'Working capital optimizer', status: 'ready', confidence: 0.92 },
  { id: 'demand-forecast', name: 'Demand forecaster', status: 'training', confidence: 0.0 },
  { id: 'inventory-optimizer', name: 'Inventory optimizer', status: 'ready', confidence: 0.88 }
]

router.get('/dashboard/summary', (_req, res) => {
  res.json(dashboardSummary)
})

router.get('/dashboard/metrics', (_req, res) => {
  res.json(dashboardMetrics)
})

router.get('/dashboard/kpis', (req, res) => {
  res.json({
    timeRange: req.query.timeRange ?? '30d',
    items: dashboardKpis
  })
})

router.get('/dashboard/realtime', (_req, res) => {
  res.json(realtimeStatus)
})

router.get('/dashboard/widgets/:widgetId', (req, res) => {
  const widget = widgetRegistry[req.params.widgetId]

  if (!widget) {
    res.status(404).json({ error: 'Widget not found' })
    return
  }

  res.json(widget)
})

router.get('/dashboard/layout', (_req, res) => {
  res.json(dashboardLayout)
})

router.post('/dashboard/layout', (req, res) => {
  if (!Array.isArray(req.body?.layout)) {
    res.status(400).json({ error: 'layout must be an array' })
    return
  }

  dashboardLayout = {
    widgets: req.body.layout,
    updatedAt: new Date().toISOString()
  }

  res.json({ success: true, layout: dashboardLayout })
})

router.get('/dashboard/export', (req, res) => {
  const format = req.query.format ?? 'json'
  res.json({
    status: 'ready',
    format,
    generatedAt: new Date().toISOString(),
    downloadUrl: `/exports/dashboard-latest.${format}`
  })
})

router.get('/financial/working-capital', (_req, res) => {
  const latest = workingCapitalHistory[0]
  const previous = workingCapitalHistory[1]
  const workingCapitalCurrent = latest.currentAssets - latest.currentLiabilities
  const workingCapitalPrevious = previous.currentAssets - previous.currentLiabilities
  const change = ((workingCapitalCurrent - workingCapitalPrevious) / workingCapitalPrevious) * 100

  res.json({
    data: workingCapitalHistory,
    latest,
    summary: {
      workingCapital: workingCapitalCurrent,
      change,
      cashConversionCycle: latest.cashConversionCycle,
      quickRatio: latest.quickRatio,
      workingCapitalRatio: latest.workingCapitalRatio
    }
  })
})

router.get('/financial/cash-flow', (_req, res) => {
  res.json({
    data: cashFlowHistory,
    latest: cashFlowHistory[0]
  })
})

router.get('/financial/metrics', (_req, res) => {
  res.json(financialMetrics)
})

router.get('/mcp/status', (_req, res) => {
  res.json({
    connected: true,
    latencyMs: 124,
    lastSync: new Date(Date.now() - 90_000).toISOString(),
    healthy: true
  })
})

router.get('/ai/status', (_req, res) => {
  res.json({
    environment: process.env.NODE_ENV ?? 'development',
    models: aiModels
  })
})

router.post('/ai/insights', (req, res) => {
  const scenario = req.body?.scenario ?? 'baseline'

  res.json({
    scenario,
    recommendations: [
      { id: 'optimize-cash-cycle', impact: 'high', description: 'Reduce payment terms for top 10 customers to improve cash velocity.' },
      { id: 'inventory-balance', impact: 'medium', description: 'Shift safety stock from slow movers to high velocity SKUs to free $180k.' }
    ],
    generatedAt: new Date().toISOString()
  })
})

router.post('/forecasting/enhanced', (req, res) => {
  const horizon = Number(req.body?.horizon ?? 90)
  const forecasts = Array.from({ length: horizon / 7 }, (_, index) => ({
    week: index + 1,
    demand: Math.round(520 + Math.sin(index / 3) * 45),
    confidence: 0.82
  }))

  res.json({
    generatedAt: new Date().toISOString(),
    horizonDays: horizon,
    forecasts
  })
})

router.get('/health/database', (_req, res) => {
  res.json({
    healthy: true,
    status: 'connected',
    latencyMs: Math.round(Math.random() * 40 + 60)
  })
})

export default router
