/**
 * REAL DATA API - ALIGNMENT WITH CURRENT SCHEMA
 * Uses existing Prisma models only and returns clear guidance when
 * requested data is unavailable instead of querying non-existent tables.
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

const MS_PER_DAY = 24 * 60 * 60 * 1000

const toNumber = value => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string' && value.trim() === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const percentage = value =>
  value === null || value === undefined || Number.isNaN(value)
    ? null
    : Number(value.toFixed(1))

const growthPercentage = (current, previous) => {
  if (previous === null || previous === undefined || !Number.isFinite(previous) || previous === 0) {
    return null
  }
  return percentage(((current - previous) / Math.abs(previous)) * 100)
}

const sumBy = (items, selector) => items.reduce((sum, item) => sum + selector(item), 0)

const filterByDateRange = (items, selector, from, to = new Date()) =>
  items.filter(item => {
    const date = selector(item)
    if (!date) return false
    const time = new Date(date).getTime()
    return time >= from.getTime() && time < to.getTime()
  })

/**
 * Dashboard Summary - Aggregates data from WorkingCapital, InventoryItem,
 * ProductionJob, and CashFlowForecast records.
 */
router.get('/dashboard/summary', async (req, res) => {
  try {
    const [workingCapitalRecords, inventoryItems, productionJobs, cashForecasts] = await Promise.all([
      prisma.workingCapital.findMany({ orderBy: { periodEnd: 'desc' }, take: 12 }),
      prisma.inventoryItem.findMany({}),
      prisma.productionJob.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.cashFlowForecast.findMany({ orderBy: { forecastDate: 'desc' }, take: 6 }),
    ])

    if (!workingCapitalRecords.length && !inventoryItems.length && !productionJobs.length) {
      return res.status(404).json({
        error: 'no_operational_data',
        message: 'Connect your financial, production, and inventory sources to populate the dashboard.',
      })
    }

    const now = new Date()
    const revenueInWindow = days => {
      const cutoff = new Date(now.getTime() - days * MS_PER_DAY)
      return filterByDateRange(workingCapitalRecords, record => record.periodEnd, cutoff).reduce(
        (sum, record) => sum + toNumber(record.revenue),
        0
      )
    }

    const latestWorkingCapital = workingCapitalRecords[0] || null

    const workingCapitalSummary = latestWorkingCapital
      ? {
          current: toNumber(latestWorkingCapital.workingCapital),
          ratio:
            latestWorkingCapital.currentRatio !== null && latestWorkingCapital.currentRatio !== undefined
              ? toNumber(latestWorkingCapital.currentRatio)
              : toNumber(latestWorkingCapital.workingCapitalRatio),
          quickRatio:
            latestWorkingCapital.quickRatio !== null && latestWorkingCapital.quickRatio !== undefined
              ? toNumber(latestWorkingCapital.quickRatio)
              : null,
          cashConversionCycle: latestWorkingCapital.ccc ?? null,
          dso: latestWorkingCapital.dso ?? null,
          dio: latestWorkingCapital.dio ?? null,
          dpo: latestWorkingCapital.dpo ?? null,
          netCashFlow: cashForecasts.length
            ? toNumber(cashForecasts[0].cashInflows) - toNumber(cashForecasts[0].cashOutflows)
            : null,
        }
      : null

    const inventorySummary = (() => {
      if (!inventoryItems.length) {
        return { value: 0, turnover: null, skuCount: 0, lowStock: 0 }
      }

      const totalValue = inventoryItems.reduce((sum, item) => sum + toNumber(item.totalValue), 0)
      const lowStock = inventoryItems.filter(item => {
        const onHand = toNumber(item.quantityOnHand)
        const reorderPoint = toNumber(item.reorderPoint || 0)
        return reorderPoint > 0 && onHand <= reorderPoint
      }).length
      const uniqueSkus = new Set(inventoryItems.map(item => item.productId || item.id)).size

      return {
        value: Number(totalValue.toFixed(2)),
        turnover: latestWorkingCapital ? toNumber(latestWorkingCapital.inventoryTurnover) : null,
        skuCount: uniqueSkus,
        lowStock,
      }
    })()

    const productionSummary = (() => {
      if (!productionJobs.length) {
        return { totalJobs: 0, completedJobs: 0, inProgressJobs: 0, unitsProduced: 0, defectRate: null }
      }

      const completed = productionJobs.filter(job => job.status === 'COMPLETED')
      const inProgress = productionJobs.filter(job => job.status === 'IN_PROGRESS')
      const produced = completed.reduce((sum, job) => sum + toNumber(job.quantityProduced), 0)
      const rejected = completed.reduce((sum, job) => sum + toNumber(job.quantityRejected), 0)
      const defectRate = produced + rejected > 0 ? percentage((rejected / (produced + rejected)) * 100) : null

      const cycleTimeDays = completed
        .map(job => {
          if (!job.actualStart || !job.actualEnd) return null
          const duration = new Date(job.actualEnd).getTime() - new Date(job.actualStart).getTime()
          return duration > 0 ? duration / MS_PER_DAY : null
        })
        .filter(value => value !== null)

      const avgCycleTime = cycleTimeDays.length
        ? Number((cycleTimeDays.reduce((sum, value) => sum + value, 0) / cycleTimeDays.length).toFixed(1))
        : null

      return {
        totalJobs: productionJobs.length,
        completedJobs: completed.length,
        inProgressJobs: inProgress.length,
        unitsProduced: produced,
        unitsRejected: rejected,
        defectRate,
        averageCycleTimeDays: avgCycleTime,
      }
    })()

    const financialSummary = latestWorkingCapital
      ? {
          revenue: toNumber(latestWorkingCapital.revenue),
          cogs: toNumber(latestWorkingCapital.cogs),
          grossProfit: toNumber(latestWorkingCapital.grossProfit),
          grossMargin: percentage(toNumber(latestWorkingCapital.grossMargin)),
          workingCapital: toNumber(latestWorkingCapital.workingCapital),
        }
      : null

    res.json({
      revenue: {
        monthly: revenueInWindow(30),
        quarterly: revenueInWindow(90),
        yearly: revenueInWindow(365),
      },
      workingCapital: workingCapitalSummary,
      production: productionSummary,
      inventory: inventorySummary,
      financial: financialSummary,
      timestamp: new Date().toISOString(),
      dataSource: 'prisma',
    })
  } catch (error) {
    console.error('Dashboard summary error:', error)
    res.status(500).json({
      error: 'dashboard_summary_failed',
      message: 'Unable to compute dashboard summary from current data.',
      details: error.message,
    })
  }
})

/**
 * Working Capital - Real Financial Data
 */
router.get('/financial/working-capital', async (req, res) => {
  try {
    const records = await prisma.workingCapital.findMany({
      orderBy: { periodEnd: 'desc' },
      take: 30,
    })

    if (!records.length) {
      return res.status(404).json({
        error: 'no_working_capital_data',
        message: 'Load working capital records to view financial metrics.',
      })
    }

    res.json({
      data: records.map(record => ({
        id: record.id,
        periodStart: record.periodStart.toISOString(),
        periodEnd: record.periodEnd.toISOString(),
        revenue: toNumber(record.revenue),
        cogs: toNumber(record.cogs),
        grossProfit: toNumber(record.grossProfit),
        grossMargin: percentage(toNumber(record.grossMargin)),
        workingCapital: toNumber(record.workingCapital),
        accountsReceivable: toNumber(record.accountsReceivable),
        accountsPayable: toNumber(record.accountsPayable),
        inventory: toNumber(record.inventory),
        currentRatio: toNumber(record.currentRatio ?? record.workingCapitalRatio),
        quickRatio: toNumber(record.quickRatio),
        ccc: record.ccc,
        dso: record.dso,
        dio: record.dio,
        dpo: record.dpo,
      })),
      latest: records[0],
      dataSource: 'prisma',
    })
  } catch (error) {
    console.error('Working capital API error:', error)
    res.status(500).json({
      error: 'working_capital_failed',
      message: 'Unable to fetch working capital records.',
      details: error.message,
    })
  }
})

/**
 * Cash flow history derived from CashFlowForecast entries.
 */
router.get('/financial/cash-flow', async (req, res) => {
  try {
    const forecasts = await prisma.cashFlowForecast.findMany({
      orderBy: { forecastDate: 'desc' },
      take: 12,
    })

    if (!forecasts.length) {
      return res.status(404).json({
        error: 'no_cash_flow_forecasts',
        message: 'Generate cash flow forecasts to populate this view.',
      })
    }

    const data = forecasts
      .map(entry => ({
        date: entry.forecastDate.toISOString(),
        openingBalance: toNumber(entry.openingBalance),
        inflows: toNumber(entry.cashInflows),
        outflows: toNumber(entry.cashOutflows),
        closingBalance: toNumber(entry.closingBalance),
        netChange: toNumber(entry.cashInflows) - toNumber(entry.cashOutflows),
        cashRunway: entry.cashRunway ?? null,
        burnRate: entry.burnRate ? toNumber(entry.burnRate) : null,
      }))
      .reverse()

    res.json({
      data,
      latest: data[data.length - 1],
      dataSource: 'cash_flow_forecasts',
    })
  } catch (error) {
    console.error('Cash flow API error:', error)
    res.status(500).json({
      error: 'cash_flow_failed',
      message: 'Unable to fetch cash flow history.',
      details: error.message,
    })
  }
})

/**
 * Financial metrics derived from WorkingCapital records.
 */
router.get('/financial/metrics', async (req, res) => {
  try {
    const records = await prisma.workingCapital.findMany({
      orderBy: { periodEnd: 'desc' },
      take: 12,
    })

    if (!records.length) {
      return res.status(404).json({
        error: 'no_financial_metrics',
        message: 'Working capital records are required to compute metrics.',
      })
    }

    const latest = records[0]
    const history = records.map(record => ({
      periodStart: record.periodStart.toISOString(),
      periodEnd: record.periodEnd.toISOString(),
      revenue: toNumber(record.revenue),
      cogs: toNumber(record.cogs),
      grossProfit: toNumber(record.grossProfit),
      grossMargin: percentage(toNumber(record.grossMargin)),
      workingCapital: toNumber(record.workingCapital),
    }))

    res.json({
      latest: {
        revenue: toNumber(latest.revenue),
        cogs: toNumber(latest.cogs),
        grossProfit: toNumber(latest.grossProfit),
        grossMargin: percentage(toNumber(latest.grossMargin)),
        workingCapital: toNumber(latest.workingCapital),
        currentRatio: toNumber(latest.currentRatio ?? latest.workingCapitalRatio),
        quickRatio: toNumber(latest.quickRatio),
      },
      history,
      dataSource: 'working_capital',
    })
  } catch (error) {
    console.error('Financial metrics error:', error)
    res.status(500).json({
      error: 'financial_metrics_failed',
      message: 'Unable to compute financial metrics.',
      details: error.message,
    })
  }
})

/**
 * KPI summary using revenue from WorkingCapital and production output from ProductionJob.
 */
router.get('/financial/kpi-summary', async (_req, res) => {
  try {
    const [workingCapitalRecords, productionJobs] = await Promise.all([
      prisma.workingCapital.findMany({ orderBy: { periodEnd: 'desc' }, take: 24 }),
      prisma.productionJob.findMany({ orderBy: { completedAt: 'desc' }, take: 200 }),
    ])

    if (!workingCapitalRecords.length) {
      return res.status(404).json({
        error: 'no_financial_data',
        message: 'Working capital records are required to compute KPI summary.',
      })
    }

    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfPrevYear = new Date(now.getFullYear() - 1, 0, 1)
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const revenueForRange = (from, to = now) =>
      filterByDateRange(workingCapitalRecords, record => record.periodEnd, from, to).reduce(
        (sum, record) => sum + toNumber(record.revenue),
        0
      )

    const currentRevenue = revenueForRange(startOfYear)
    const previousRevenue = revenueForRange(startOfPrevYear, startOfYear)

    const currentUnits = productionJobs
      .filter(job => job.completedAt && job.completedAt >= startOfYear)
      .reduce((sum, job) => sum + toNumber(job.quantityProduced), 0)

    const previousUnits = productionJobs
      .filter(job => job.completedAt && job.completedAt >= startOfPrevYear && job.completedAt < startOfYear)
      .reduce((sum, job) => sum + toNumber(job.quantityProduced), 0)

    const latest = workingCapitalRecords[0]

    res.json({
      revenue: {
        monthly: revenueForRange(startOfCurrentMonth),
        previousMonth: revenueForRange(startOfPrevMonth, startOfCurrentMonth),
        yearly: currentRevenue,
        previousYear: previousRevenue,
        growth: {
          monthly: growthPercentage(
            revenueForRange(startOfCurrentMonth),
            revenueForRange(startOfPrevMonth, startOfCurrentMonth)
          ),
          yearly: growthPercentage(currentRevenue, previousRevenue),
        },
      },
      unitsSold: {
        currentYear: currentUnits,
        previousYear: previousUnits,
        growth: growthPercentage(currentUnits, previousUnits),
      },
      margins: latest
        ? {
            grossMargin: percentage(toNumber(latest.grossMargin)),
            workingCapitalRatio: toNumber(latest.currentRatio ?? latest.workingCapitalRatio),
          }
        : null,
      generatedAt: new Date().toISOString(),
      dataSource: 'working_capital',
    })
  } catch (error) {
    console.error('Financial KPI summary error:', error)
    res.status(500).json({
      error: 'financial_kpi_failed',
      message: 'Unable to compute KPI summary.',
      details: error.message,
    })
  }
})

/**
 * Production metrics derived from ProductionJob entries.
 */
router.get('/production/metrics', async (req, res) => {
  try {
    const jobs = await prisma.productionJob.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })

    if (!jobs.length) {
      return res.status(404).json({
        error: 'no_production_jobs',
        message: 'Create production jobs to populate production metrics.',
      })
    }

    const completed = jobs.filter(job => job.status === 'COMPLETED')
    const inProgress = jobs.filter(job => job.status === 'IN_PROGRESS')

    const totalProduced = sumBy(completed, job => toNumber(job.quantityProduced))
    const totalRejected = sumBy(completed, job => toNumber(job.quantityRejected))
    const defectRate = totalProduced + totalRejected > 0 ? percentage((totalRejected / (totalProduced + totalRejected)) * 100) : null

    const qualityScore = completed
      .map(job => (job.qualityScore !== null && job.qualityScore !== undefined ? job.qualityScore : null))
      .filter(score => score !== null)

    const avgQualityScore = qualityScore.length
      ? percentage(sumBy(qualityScore, score => score) / qualityScore.length)
      : null

    res.json({
      totals: {
        totalJobs: jobs.length,
        completedJobs: completed.length,
        inProgressJobs: inProgress.length,
      },
      output: {
        unitsProduced: totalProduced,
        unitsRejected: totalRejected,
        defectRate,
        averageQualityScore: avgQualityScore,
      },
      dataSource: 'production_jobs',
    })
  } catch (error) {
    console.error('Production metrics error:', error)
    res.status(500).json({
      error: 'production_metrics_failed',
      message: 'Unable to compute production metrics.',
      details: error.message,
    })
  }
})

/**
 * Inventory snapshot from InventoryItem records.
 */
router.get('/inventory/current', async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({ orderBy: { updatedAt: 'desc' }, take: 200 })

    if (!items.length) {
      return res.status(404).json({
        error: 'no_inventory_items',
        message: 'No inventory items found. Import stock data to continue.',
      })
    }

    const totalValue = sumBy(items, item => toNumber(item.totalValue))
    const lowStock = items.filter(item => {
      const onHand = toNumber(item.quantityOnHand)
      const reorderPoint = toNumber(item.reorderPoint || 0)
      return reorderPoint > 0 && onHand <= reorderPoint
    }).length
    const outOfStock = items.filter(item => toNumber(item.quantityOnHand) === 0).length

    res.json({
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        warehouseId: item.warehouseId,
        location: item.location,
        quantityOnHand: toNumber(item.quantityOnHand),
        quantityReserved: toNumber(item.quantityReserved),
        quantityAvailable: toNumber(item.quantityAvailable),
        totalValue: toNumber(item.totalValue),
        reorderPoint: toNumber(item.reorderPoint || 0),
        updatedAt: item.updatedAt,
      })),
      summary: {
        totalItems: items.length,
        totalValue: Number(totalValue.toFixed(2)),
        lowStock,
        outOfStock,
      },
      dataSource: 'inventory_items',
    })
  } catch (error) {
    console.error('Inventory metrics error:', error)
    res.status(500).json({
      error: 'inventory_metrics_failed',
      message: 'Unable to fetch inventory data.',
      details: error.message,
    })
  }
})

/**
 * Quality metrics derived from QualityRecord entries.
 */
router.get('/quality/metrics', async (req, res) => {
  try {
    const records = await prisma.qualityRecord.findMany({ orderBy: { inspectedAt: 'desc' }, take: 100 })

    if (!records.length) {
      return res.status(404).json({
        error: 'no_quality_records',
        message: 'Capture quality inspections to view quality metrics.',
      })
    }

    const totals = records.reduce(
      (acc, record) => {
        const passed = toNumber(record.passed)
        const failed = toNumber(record.failed)
        acc.passed += passed
        acc.failed += failed
        acc.samples += toNumber(record.sampleSize)
        if (record.passRate !== null && record.passRate !== undefined) {
          acc.passRates.push(record.passRate)
        }
        return acc
      },
      { passed: 0, failed: 0, samples: 0, passRates: [] }
    )

    const overallPassRate = totals.passed + totals.failed > 0
      ? percentage((totals.passed / (totals.passed + totals.failed)) * 100)
      : null

    const averagePassRate = totals.passRates.length
      ? percentage(totals.passRates.reduce((sum, rate) => sum + rate, 0) / totals.passRates.length)
      : null

    res.json({
      totals: {
        inspections: records.length,
        samplesInspected: totals.samples,
        passed: totals.passed,
        failed: totals.failed,
      },
      metrics: {
        overallPassRate,
        averageRecordedPassRate: averagePassRate,
      },
      dataSource: 'quality_records',
    })
  } catch (error) {
    console.error('Quality metrics error:', error)
    res.status(500).json({
      error: 'quality_metrics_failed',
      message: 'Unable to compute quality metrics.',
      details: error.message,
    })
  }
})

/**
 * Product performance summary using ProductionJob output as a proxy for shipments.
 */
router.get('/sales/product-performance', async (req, res) => {
  try {
    const jobs = await prisma.productionJob.findMany({ orderBy: { completedAt: 'desc' }, take: 500, include: { product: true } })

    if (!jobs.length) {
      return res.status(404).json({
        error: 'no_production_data',
        message: 'Complete production jobs to analyse product performance.',
      })
    }

    const grouped = jobs.reduce((acc, job) => {
      if (!job.productId) {
        return acc
      }
      if (!acc.has(job.productId)) {
        acc.set(job.productId, {
          productId: job.productId,
          sku: job.product?.sku || null,
          name: job.product?.name || 'Unnamed Product',
          unitsProduced: 0,
          unitsRejected: 0,
          totalCost: 0,
        })
      }
      const entry = acc.get(job.productId)
      entry.unitsProduced += toNumber(job.quantityProduced)
      entry.unitsRejected += toNumber(job.quantityRejected)
      entry.totalCost += toNumber(job.totalCost)
      return acc
    }, new Map())

    const data = Array.from(grouped.values()).map(entry => ({
      ...entry,
      defectRate:
        entry.unitsProduced + entry.unitsRejected > 0
          ? percentage((entry.unitsRejected / (entry.unitsProduced + entry.unitsRejected)) * 100)
          : null,
    }))

    res.json({
      products: data,
      generatedAt: new Date().toISOString(),
      dataSource: 'production_jobs',
    })
  } catch (error) {
    console.error('Product performance error:', error)
    res.status(500).json({
      error: 'product_performance_failed',
      message: 'Unable to compute product performance.',
      details: error.message,
    })
  }
})

/**
 * Profit & loss trend using WorkingCapital revenue and cogs values.
 */
router.get('/financial/pl-analysis', async (req, res) => {
  try {
    const records = await prisma.workingCapital.findMany({ orderBy: { periodEnd: 'asc' } })

    if (!records.length) {
      return res.status(404).json({
        error: 'no_pl_data',
        message: 'Working capital records required to produce P&L analysis.',
      })
    }

    const timeline = records.map(record => {
      const revenue = toNumber(record.revenue)
      const cogs = toNumber(record.cogs)
      const grossProfit = toNumber(record.grossProfit)
      const grossMargin = revenue > 0 ? percentage((grossProfit / revenue) * 100) : null
      return {
        periodStart: record.periodStart.toISOString(),
        periodEnd: record.periodEnd.toISOString(),
        revenue,
        cogs,
        grossProfit,
        grossMargin,
      }
    })

    res.json({
      timeline,
      latest: timeline[timeline.length - 1],
      dataSource: 'working_capital',
    })
  } catch (error) {
    console.error('P&L analysis error:', error)
    res.status(500).json({
      error: 'pl_analysis_failed',
      message: 'Unable to compute profit and loss analysis.',
      details: error.message,
    })
  }
})

/**
 * Regional performance requires dedicated sales data which is not present in the schema.
 * Provide guidance instead of fabricating data.
 */
router.get('/regional/performance', async (_req, res) => {
  res.status(503).json({
    error: 'regional_data_unavailable',
    message: 'Regional performance requires sales data with geography breakdown. Connect your commerce or ERP source to enable this view.',
  })
})

export default router
