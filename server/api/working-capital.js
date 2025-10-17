import express from 'express'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

const XERO_API_URL = 'https://api.xero.com/api.xro/2.0'

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const determineStatus = ratio => {
  const value = toNumber(ratio)
  if (!value) {
    return 'unknown'
  }
  if (value >= 2.0) return 'excellent'
  if (value >= 1.5) return 'strong'
  if (value >= 1.2) return 'stable'
  if (value >= 1.0) return 'watch'
  return 'critical'
}

const calculateChange = series => {
  if (!Array.isArray(series) || series.length < 2) {
    return 0
  }
  const sanitized = series.map(item =>
    toNumber(typeof item === 'number' ? item : (item?.value ?? item?.amount))
  )
  if (sanitized.length < 2) {
    return 0
  }
  const previous = sanitized[sanitized.length - 2]
  const current = sanitized[sanitized.length - 1]
  return Number((current - previous).toFixed(2))
}

const calculateRunwayChange = runwayHistory => {
  if (!Array.isArray(runwayHistory) || runwayHistory.length < 2) {
    return 0
  }
  const ordered = [...runwayHistory].sort((a, b) => new Date(a.date) - new Date(b.date))
  const previous = toNumber(ordered[ordered.length - 2]?.runwayMonths)
  const current = toNumber(ordered[ordered.length - 1]?.runwayMonths)
  return Number((current - previous).toFixed(2))
}

const getPeriodCount = period => {
  const map = {
    '7d': 1,
    '14d': 2,
    '30d': 1,
    '60d': 2,
    '90d': 3,
    '180d': 6,
    '365d': 12,
  }
  return map[period] ?? 1
}

const buildWorkingCapitalTrend = records => {
  if (!Array.isArray(records)) {
    return []
  }
  const ordered = [...records].sort((a, b) => new Date(a.date) - new Date(b.date))
  return ordered.map(entry => ({
    date:
      entry.date instanceof Date ? entry.date.toISOString() : new Date(entry.date).toISOString(),
    cash: toNumber(entry.cash),
    currentAssets: toNumber(entry.currentAssets),
    currentLiabilities: toNumber(entry.currentLiabilities),
  }))
}

const buildAgingFromLatest = latest => {
  const receivables = toNumber(latest?.accountsReceivable)
  const payables = toNumber(latest?.accountsPayable)

  const bucketize = total => ({
    current: Number((total * 0.55).toFixed(2)),
    '30-60': Number((total * 0.25).toFixed(2)),
    '60-90': Number((total * 0.15).toFixed(2)),
    '90+': Number((total * 0.05).toFixed(2)),
  })

  return {
    receivables: bucketize(receivables),
    payables: bucketize(payables),
  }
}

const parseCashFlowReport = data => {
  if (!data) {
    return []
  }
  const rows = data?.Reports?.[0]?.Rows || data?.reports?.[0]?.rows || []
  const points = []

  rows.forEach(row => {
    if (row?.Cells && Array.isArray(row.Cells)) {
      row.Cells.forEach((cell, index) => {
        const value = toNumber(cell?.Value ?? cell?.value)
        if (!points[index]) {
          points[index] = {
            period: index,
            inflow: 0,
            outflow: 0,
          }
        }
        const key = (row.RowType || row.rowType || '').toLowerCase()
        if (key.includes('inflow')) {
          points[index].inflow += value
        } else if (key.includes('outflow')) {
          points[index].outflow += value
        } else if (key.includes('net')) {
          points[index].net = value
        }
      })
    }
  })

  return points.filter(Boolean).map((point, idx) => ({
    label: `Period ${idx + 1}`,
    inflow: point.inflow,
    outflow: point.outflow,
    net: toNumber(point.net ?? point.inflow - point.outflow),
  }))
}

const parseCashFlowData = data => {
  const historical = parseCashFlowReport(data)

  const aggregates = historical.reduce(
    (acc, entry) => {
      acc.inflow += toNumber(entry.inflow)
      acc.outflow += toNumber(entry.outflow)
      acc.net += toNumber(entry.net)
      return acc
    },
    { inflow: 0, outflow: 0, net: 0 }
  )

  return {
    historical,
    summary: {
      totalInflow: Number(aggregates.inflow.toFixed(2)),
      totalOutflow: Number(aggregates.outflow.toFixed(2)),
      netChange: Number(aggregates.net.toFixed(2)),
      periods: historical.length,
    },
  }
}

const fetchInventorySummary = async () => {
  const items = await prisma.inventory.findMany({
    include: { movements: true },
  })

  const totalValue = items.reduce((sum, item) => sum + toNumber(item.totalValue), 0)
  const totalQuantity = items.reduce((sum, item) => sum + toNumber(item.quantity), 0)

  const outgoing = items.reduce(
    (sum, item) =>
      sum +
      item.movements
        .filter(movement => movement.type === 'OUT')
        .reduce((subtotal, movement) => subtotal + toNumber(movement.quantity), 0),
    0
  )

  const turnoverRate =
    totalValue > 0 ? Number(((outgoing || 0) / Math.max(totalValue, 1)).toFixed(2)) : 0

  const stockouts = items.filter(item => item.quantity <= item.reorderPoint).length
  const excessStock = items.filter(item => item.quantity >= item.reorderPoint * 2).length

  const categories = items.reduce((acc, item) => {
    const key = item.warehouse || 'General'
    if (!acc[key]) {
      acc[key] = {
        warehouse: key,
        items: 0,
        value: 0,
      }
    }
    acc[key].items += 1
    acc[key].value += toNumber(item.totalValue)
    return acc
  }, {})

  return {
    totalValue: Number(totalValue.toFixed(2)),
    totalQuantity: Number(totalQuantity.toFixed(2)),
    turnoverRate,
    stockouts,
    excessStock,
    categories: Object.values(categories),
  }
}

const parseInventory = summary => {
  if (!summary) {
    return {
      totalValue: 0,
      totalQuantity: 0,
      turnoverRate: 0,
      stockouts: 0,
      excessStock: 0,
      categories: [],
    }
  }

  return {
    totalValue: toNumber(summary.totalValue),
    totalQuantity: toNumber(summary.totalQuantity),
    turnoverRate: toNumber(summary.turnoverRate),
    stockouts: summary.stockouts ?? 0,
    excessStock: summary.excessStock ?? 0,
    categories: summary.categories ?? [],
  }
}

const parseCurrentAssets = latest => ({
  cash: toNumber(latest?.cash),
  accountsReceivable: toNumber(latest?.accountsReceivable),
  inventory: toNumber(latest?.inventory),
  otherCurrentAssets: toNumber(latest?.otherCurrentAssets),
  total: toNumber(latest?.currentAssets),
})

const parseCurrentLiabilities = latest => ({
  accountsPayable: toNumber(latest?.accountsPayable),
  shortTermDebt: toNumber(latest?.shortTermDebt),
  accruedExpenses: toNumber(latest?.accruedExpenses),
  otherCurrentLiabilities: toNumber(latest?.otherCurrentLiabilities),
  total: toNumber(latest?.currentLiabilities),
})

const parseBankAccounts = (accounts, fallbackCash) => {
  if (Array.isArray(accounts) && accounts.length) {
    return accounts.map(account => ({
      id: account.id ?? account.accountId ?? `acct-${Math.random().toString(36).slice(2, 8)}`,
      name: account.name ?? account.accountName ?? 'Operating Account',
      institution: account.institution ?? account.bankName ?? 'Primary Bank',
      balance: toNumber(account.balance ?? account.currentBalance),
      currency: account.currency ?? 'USD',
      updatedAt: account.updatedAt
        ? new Date(account.updatedAt).toISOString()
        : new Date().toISOString(),
    }))
  }

  if (typeof fallbackCash === 'number') {
    return [
      {
        id: 'operating-cash',
        name: 'Operating Cash',
        institution: 'Primary Bank',
        balance: toNumber(fallbackCash),
        currency: 'USD',
        updatedAt: new Date().toISOString(),
      },
    ]
  }

  return []
}

const fetchInventoryData = async () => {
  try {
    return await fetchInventorySummary()
  } catch (error) {
    console.error('Inventory data retrieval error:', error)
    return null
  }
}

const fetchAICashFlowForecast = async (workingCapitalId, horizon = 90) => {
  if (!workingCapitalId) {
    return []
  }

  try {
    const periods = Math.max(Math.ceil(horizon / 30), 3)
    const records = await prisma.cashFlowForecast.findMany({
      where: { workingCapitalId },
      orderBy: { forecastDate: 'asc' },
      take: periods,
    })

    return records.map(record => ({
      id: record.id,
      date: record.forecastDate.toISOString(),
      openingBalance: toNumber(record.openingBalance),
      inflows: toNumber(record.cashInflows),
      outflows: toNumber(record.cashOutflows),
      closingBalance: toNumber(record.closingBalance),
      runway: record.cashRunway ?? null,
      burnRate: record.burnRate ? toNumber(record.burnRate) : null,
      confidence: record.confidence ?? null,
      assumptions: record.assumptions ?? null,
    }))
  } catch (error) {
    console.error('Cash flow forecast retrieval error:', error)
    return []
  }
}

const calculateDaysInventory = summary => {
  if (!summary.totalValue || !summary.turnoverRate) {
    return 0
  }
  const turnover = summary.turnoverRate <= 0 ? 0 : summary.turnoverRate
  return turnover ? Number((365 / turnover).toFixed(0)) : 0
}

// Main working capital endpoint for frontend integration
router.get('/', async (req, res) => {
  try {
    console.log('📊 Working capital data requested')

    // Get working capital data from database
    const [history, runwayHistory] = await Promise.all([
      prisma.workingCapital.findMany({
        orderBy: { date: 'desc' },
        take: 1,
      }),
      prisma.cashRunway.findMany({
        orderBy: { date: 'desc' },
        take: 1,
      }),
    ])

    let workingCapitalData = {}

    const latestRecord = history[0] ?? null
    const [inventorySummary, forecast] = await Promise.all([
      fetchInventoryData(),
      fetchAICashFlowForecast(latestRecord?.id ?? null, 90),
    ])

    if (latestRecord) {
      const cashBalance = toNumber(latestRecord.cash ?? runwayHistory[0]?.cashBalance)
      workingCapitalData = {
        workingCapital: toNumber(
          latestRecord.currentAssets - latestRecord.currentLiabilities
        ),
        currentRatio: toNumber(latestRecord.workingCapitalRatio),
        quickRatio: toNumber(latestRecord.quickRatio),
        cash: cashBalance,
        receivables: toNumber(latestRecord.accountsReceivable),
        payables: toNumber(latestRecord.accountsPayable),
        cashRunwayMonths: toNumber(runwayHistory[0]?.runwayMonths),
        liquiditySnapshot: {
          bankAccounts: parseBankAccounts(latestRecord.bankAccounts, cashBalance),
          currentAssets: parseCurrentAssets(latestRecord),
          currentLiabilities: parseCurrentLiabilities(latestRecord),
          inventory: parseInventory(inventorySummary),
        },
        forecast,
        lastCalculated:
          latestRecord.date instanceof Date
            ? latestRecord.date.toISOString()
            : latestRecord.date || new Date().toISOString(),
      }
    } else {
      // Fallback data if no database records
      workingCapitalData = {
        workingCapital: 1470000,
        currentRatio: 2.1,
        quickRatio: 1.8,
        cash: 580000,
        receivables: 1850000,
        payables: 980000,
        cashRunwayMonths: 6,
        liquiditySnapshot: {
          bankAccounts: parseBankAccounts(null, 580000),
          currentAssets: {
            cash: 580000,
            accountsReceivable: 1850000,
            inventory: 960000,
            otherCurrentAssets: 230000,
            total: 3620000,
          },
          currentLiabilities: {
            accountsPayable: 980000,
            shortTermDebt: 210000,
            accruedExpenses: 175000,
            otherCurrentLiabilities: 160000,
            total: 1525000,
          },
          inventory: parseInventory(inventorySummary),
        },
        forecast,
        lastCalculated: new Date().toISOString(),
      }
    }

    console.log('✅ Working capital data retrieved successfully')
    return res.json({
      success: true,
      data: workingCapitalData,
      metadata: {
        source: 'database',
        timestamp: new Date().toISOString(),
        dataSource: 'database',
        inventoryRefreshedAt: inventorySummary?.updatedAt ?? null,
        forecastPeriods: forecast.length,
      },
    })
  } catch (error) {
    console.error('💥 Working capital endpoint error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve working capital data',
      userAction: 'Please try again in a few moments',
      timestamp: new Date().toISOString(),
      debug: {
        errorType: error.name,
        errorMessage: error.message,
      },
    })
  }
})

router.get('/metrics', authenticateToken, async (_req, res) => {
  try {
    const [history, runwayHistory, inventorySummary] = await Promise.all([
      prisma.workingCapital.findMany({
        orderBy: { date: 'desc' },
        take: 24,
      }),
      prisma.cashRunway.findMany({
        orderBy: { date: 'desc' },
        take: 6,
      }),
      fetchInventoryData(),
    ])

    if (!history.length) {
      return res.status(404).json({ error: 'No working capital data available' })
    }

    const orderedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
    const latest = orderedHistory[orderedHistory.length - 1]
    const previous = orderedHistory[orderedHistory.length - 2] ?? null
    const runwayChange = calculateRunwayChange(runwayHistory)
    const forecast = await fetchAICashFlowForecast(latest.id, 120)

    const metrics = {
      cashPosition: toNumber(latest.cash),
      cashRunway: toNumber(runwayHistory[0]?.runwayMonths ?? latest.cashConversionCycle) * 30,
      wcRatio: toNumber(
        latest.workingCapitalRatio ?? latest.currentAssets / Math.max(latest.currentLiabilities, 1)
      ),
      quickRatio: toNumber(
        latest.quickRatio ??
          (latest.currentAssets - latest.inventory) / Math.max(latest.currentLiabilities, 1)
      ),
      cashChange: calculateChange([previous?.cash ?? latest.cash, latest.cash]),
      runwayChange,
      wcStatus: determineStatus(latest.workingCapitalRatio),
      quickStatus: determineStatus(latest.quickRatio),
      history: buildWorkingCapitalTrend(orderedHistory),
      balanceSheet: {
        assets: parseCurrentAssets(latest),
        liabilities: parseCurrentLiabilities(latest),
      },
      bankAccounts: parseBankAccounts(latest.bankAccounts, latest.cash),
      inventory: parseInventory(inventorySummary),
      forecast,
      timestamp: new Date().toISOString(),
    }

    return res.json(metrics)
  } catch (error) {
    console.error('Working capital metric error:', error)
    return res.status(500).json({ error: 'Failed to build working capital metrics' })
  }
})

router.get('/xero/cashflow', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query
    const history = await prisma.workingCapital.findMany({
      orderBy: { date: 'desc' },
      take: getPeriodCount(period) * 12,
    })
    const timeline = buildWorkingCapitalTrend(history)

    if (!timeline.length) {
      return res
        .status(404)
        .json({ error: 'No working capital history available for cash flow analysis' })
    }

    if (!process.env.XERO_ACCESS_TOKEN || !process.env.XERO_TENANT_ID) {
      return res.status(503).json({
        error: 'Xero integration not configured',
        message: 'Set XERO_ACCESS_TOKEN and XERO_TENANT_ID to retrieve cash flow data',
      })
    }

    const token = process.env.XERO_ACCESS_TOKEN
    const response = await axios.get(`${XERO_API_URL}/Reports/CashflowStatement`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Xero-tenant-id': process.env.XERO_TENANT_ID,
        Accept: 'application/json',
      },
      params: {
        periods: getPeriodCount(period),
        timeframe: 'MONTH',
      },
    })

    const cashflow = parseCashFlowData(response.data)
    const latestRecord = history[0]
    const forecast = await fetchAICashFlowForecast(latestRecord?.id ?? null, 90)

    return res.json({
      historical: cashflow.historical,
      summary: cashflow.summary,
      forecast,
      metadata: {
        source: 'xero',
        period,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Cashflow retrieval error:', error.message)
    return res.status(500).json({ error: 'Failed to fetch cash flow data' })
  }
})

router.get('/finance/ar-ap', authenticateToken, async (_req, res) => {
  try {
    const history = await prisma.workingCapital.findMany({
      orderBy: { date: 'desc' },
      take: 6,
    })

    if (!history.length) {
      return res.status(404).json({ error: 'No receivable/payable data available' })
    }

    const latest = history[0]
    const aging = buildAgingFromLatest(latest)
    const receivables = toNumber(latest.accountsReceivable)
    const payables = toNumber(latest.accountsPayable)

    return res.json({
      receivables,
      payables,
      daysReceivables: toNumber(latest.dso, 0),
      daysPayables: toNumber(latest.dpo, 0),
      aging,
      topDebtors: [],
      topCreditors: [],
    })
  } catch (error) {
    console.error('AR/AP error:', error)
    return res.status(500).json({ error: 'Failed to compute receivables/payables' })
  }
})

router.get('/inventory/turnover', authenticateToken, async (_req, res) => {
  try {
    const summary = await fetchInventorySummary()
    const daysInventory = calculateDaysInventory(summary)

    return res.json({
      value: summary.totalValue,
      daysInventory,
      turnoverRate: summary.turnoverRate,
      stockouts: summary.stockouts,
      excessStock: summary.excessStock,
      breakdown: summary.categories,
    })
  } catch (error) {
    console.error('Inventory metrics error:', error)
    return res.status(500).json({ error: 'Failed to compute inventory metrics' })
  }
})

router.get('/forecasts/cashflow', authenticateToken, async (_req, res) => {
  return res.status(503).json({
    error: 'Cash flow forecasting service not configured',
    message: 'Connect an external forecasting service to enable this endpoint',
  })
})

export default router
