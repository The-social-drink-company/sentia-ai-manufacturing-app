/**
 * Working Capital Routes (TypeScript Multi-Tenant)
 *
 * Handles all working capital analysis operations with tenant isolation.
 *
 * @module server/routes/working-capital.routes
 */

import express, { Request, Response } from 'express'
import { z } from 'zod'
import { tenantContext, requireRole, auditLog } from '../middleware/tenantContext.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { ValidationError, NotFoundError } from '../errors/AppError.js'
import { tenantPrisma } from '../services/tenantPrisma.js'
import { PaginatedResponse, WorkingCapitalMetric } from '../types/api.types.js'

const router = express.Router()

// Apply tenant context to all routes
router.use(tenantContext)

// ==================== VALIDATION SCHEMAS ====================

const WorkingCapitalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

const CreateWorkingCapitalSchema = z.object({
  metricDate: z.string().datetime(),
  accountsReceivable: z.number().min(0),
  accountsPayable: z.number().min(0),
  inventory: z.number().min(0),
  cashConversionCycle: z.number().optional().nullable()
})

const WorkingCapitalAnalysisQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeProjections: z.enum(['true', 'false']).default('false')
})

// ==================== ROUTE HANDLERS ====================

/**
 * GET /api/working-capital
 * Get all working capital metrics with pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Validate query parameters
  const query = WorkingCapitalQuerySchema.parse(req.query)
  const { page, limit, startDate, endDate } = query

  // Build WHERE clause
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (startDate) {
    conditions.push(`metric_date >= $${paramIndex}`)
    params.push(startDate)
    paramIndex++
  }

  if (endDate) {
    conditions.push(`metric_date <= $${paramIndex}`)
    params.push(endDate)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM working_capital_metrics ${whereClause}`
  const [{ count }] = await tenantPrisma.queryRaw<{ count: string }>(
    tenantSchema,
    countQuery,
    params
  )
  const total = parseInt(count)

  // Get paginated data
  const offset = (page - 1) * limit
  const dataQuery = `
    SELECT
      id,
      metric_date,
      accounts_receivable,
      accounts_payable,
      inventory,
      cash_conversion_cycle,
      created_at
    FROM working_capital_metrics
    ${whereClause}
    ORDER BY metric_date DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  params.push(limit, offset)

  const metrics = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    dataQuery,
    params
  )

  const response: PaginatedResponse<any> = {
    success: true,
    data: metrics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  }

  res.json(response)
}))

/**
 * POST /api/working-capital
 * Create a new working capital metric record
 */
router.post('/',
  requireRole(['owner', 'admin', 'member']),
  auditLog('working_capital.create', 'working_capital_metric'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const metricData = CreateWorkingCapitalSchema.parse(req.body)

    // Calculate CCC if not provided
    const ccc = metricData.cashConversionCycle ?? calculateCCC(
      metricData.accountsReceivable,
      metricData.accountsPayable,
      metricData.inventory
    )

    // Insert metric
    const insertQuery = `
      INSERT INTO working_capital_metrics (
        metric_date, accounts_receivable, accounts_payable, inventory, cash_conversion_cycle
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const [metric] = await tenantPrisma.queryRaw<WorkingCapitalMetric[]>(
      tenantSchema,
      insertQuery,
      [
        metricData.metricDate,
        metricData.accountsReceivable,
        metricData.accountsPayable,
        metricData.inventory,
        ccc
      ]
    )

    res.status(201).json({
      success: true,
      data: metric,
      message: 'Working capital metric created successfully'
    })
  })
)

/**
 * GET /api/working-capital/analysis
 * Get comprehensive working capital analysis
 */
router.get('/analysis', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Validate query parameters
  const query = WorkingCapitalAnalysisQuerySchema.parse(req.query)
  const { startDate, endDate, includeProjections } = query

  // Get metrics for the period
  const metricsQuery = `
    SELECT
      metric_date,
      accounts_receivable,
      accounts_payable,
      inventory,
      cash_conversion_cycle
    FROM working_capital_metrics
    WHERE metric_date >= $1 AND metric_date <= $2
    ORDER BY metric_date ASC
  `
  const metrics = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    metricsQuery,
    [startDate, endDate]
  )

  if (metrics.length === 0) {
    return res.json({
      success: true,
      data: {
        metrics: [],
        summary: null,
        trends: null,
        recommendations: []
      },
      message: 'No data available for the selected period'
    })
  }

  // Calculate summary statistics
  const summary = {
    avgAccountsReceivable: avg(metrics.map(m => parseFloat(m.accounts_receivable))),
    avgAccountsPayable: avg(metrics.map(m => parseFloat(m.accounts_payable))),
    avgInventory: avg(metrics.map(m => parseFloat(m.inventory))),
    avgCashConversionCycle: avg(metrics.map(m => parseFloat(m.cash_conversion_cycle || 0))),
    currentWorkingCapital: parseFloat(metrics[metrics.length - 1].accounts_receivable) +
      parseFloat(metrics[metrics.length - 1].inventory) -
      parseFloat(metrics[metrics.length - 1].accounts_payable)
  }

  // Calculate trends
  const trends = {
    receivablesTrend: calculateTrend(metrics.map(m => parseFloat(m.accounts_receivable))),
    payablesTrend: calculateTrend(metrics.map(m => parseFloat(m.accounts_payable))),
    inventoryTrend: calculateTrend(metrics.map(m => parseFloat(m.inventory))),
    cccTrend: calculateTrend(metrics.map(m => parseFloat(m.cash_conversion_cycle || 0)))
  }

  // Generate recommendations
  const recommendations = generateRecommendations(summary, trends)

  // Generate projections if requested
  let projections = null
  if (includeProjections === 'true') {
    projections = generateProjections(metrics, 30) // 30-day projection
  }

  res.json({
    success: true,
    data: {
      metrics,
      summary,
      trends,
      recommendations,
      projections
    }
  })
}))

/**
 * GET /api/working-capital/current
 * Get current working capital snapshot
 */
router.get('/current', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Get latest metric
  const [latest] = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    `
      SELECT *
      FROM working_capital_metrics
      ORDER BY metric_date DESC
      LIMIT 1
    `
  )

  if (!latest) {
    return res.json({
      success: true,
      data: null,
      message: 'No working capital data available'
    })
  }

  // Calculate ratios
  const currentRatio = latest.accounts_receivable / (latest.accounts_payable || 1)
  const quickRatio = (latest.accounts_receivable) / (latest.accounts_payable || 1)
  const workingCapital = parseFloat(latest.accounts_receivable) +
    parseFloat(latest.inventory) -
    parseFloat(latest.accounts_payable)

  // Get trend comparison (vs 30 days ago)
  const [previous] = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    `
      SELECT *
      FROM working_capital_metrics
      WHERE metric_date <= $1
      ORDER BY metric_date DESC
      LIMIT 1
    `,
    [new Date(new Date(latest.metric_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()]
  )

  let changePercent = null
  if (previous) {
    const prevWC = parseFloat(previous.accounts_receivable) +
      parseFloat(previous.inventory) -
      parseFloat(previous.accounts_payable)
    changePercent = ((workingCapital - prevWC) / prevWC) * 100
  }

  res.json({
    success: true,
    data: {
      latest,
      ratios: {
        currentRatio: currentRatio.toFixed(2),
        quickRatio: quickRatio.toFixed(2),
        workingCapital: workingCapital.toFixed(2),
        cashConversionCycle: latest.cash_conversion_cycle
      },
      trend: {
        changePercent: changePercent ? changePercent.toFixed(2) : null,
        direction: changePercent ? (changePercent > 0 ? 'improving' : 'declining') : null
      }
    }
  })
}))

/**
 * GET /api/working-capital/:id
 * Get single working capital metric by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  const { id } = req.params

  const [metric] = await tenantPrisma.queryRaw<WorkingCapitalMetric[]>(
    tenantSchema,
    `SELECT * FROM working_capital_metrics WHERE id = $1`,
    [id]
  )

  if (!metric) {
    throw new NotFoundError(`Working capital metric not found: ${id}`)
  }

  res.json({
    success: true,
    data: metric
  })
}))

/**
 * DELETE /api/working-capital/:id
 * Delete a working capital metric
 */
router.delete('/:id',
  requireRole(['owner', 'admin']),
  auditLog('working_capital.delete', 'working_capital_metric'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Verify metric exists
    const [metric] = await tenantPrisma.queryRaw<WorkingCapitalMetric[]>(
      tenantSchema,
      `SELECT * FROM working_capital_metrics WHERE id = $1`,
      [id]
    )

    if (!metric) {
      throw new NotFoundError(`Working capital metric not found: ${id}`)
    }

    // Delete metric
    await tenantPrisma.executeRaw(
      tenantSchema,
      `DELETE FROM working_capital_metrics WHERE id = $1`,
      [id]
    )

    res.json({
      success: true,
      message: 'Working capital metric deleted successfully'
    })
  })
)

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate Cash Conversion Cycle (simplified)
 * CCC = Days Inventory Outstanding + Days Sales Outstanding - Days Payable Outstanding
 */
function calculateCCC(
  accountsReceivable: number,
  accountsPayable: number,
  inventory: number
): number {
  // Simplified calculation - in production, use actual days formulas with revenue/COGS
  const dso = (accountsReceivable / 1000) // Placeholder
  const dpo = (accountsPayable / 1000) // Placeholder
  const dio = (inventory / 500) // Placeholder
  return Math.round(dso + dio - dpo)
}

/**
 * Calculate average of numbers
 */
function avg(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
}

/**
 * Calculate trend (positive = increasing, negative = decreasing)
 */
function calculateTrend(values: number[]): string {
  if (values.length < 2) return 'stable'
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  const firstAvg = avg(firstHalf)
  const secondAvg = avg(secondHalf)
  const change = ((secondAvg - firstAvg) / firstAvg) * 100

  if (Math.abs(change) < 5) return 'stable'
  return change > 0 ? 'increasing' : 'decreasing'
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(summary: any, trends: any): string[] {
  const recommendations: string[] = []

  // CCC recommendations
  if (summary.avgCashConversionCycle > 60) {
    recommendations.push('Cash Conversion Cycle is high. Consider accelerating receivables collection or negotiating longer payment terms with suppliers.')
  }

  // Receivables trend
  if (trends.receivablesTrend === 'increasing') {
    recommendations.push('Accounts Receivable is increasing. Review credit policies and collection processes.')
  }

  // Inventory trend
  if (trends.inventoryTrend === 'increasing') {
    recommendations.push('Inventory levels are rising. Consider optimizing inventory turnover to free up cash.')
  }

  // Payables trend
  if (trends.payablesTrend === 'decreasing') {
    recommendations.push('Accounts Payable is decreasing. Consider extending payment terms with suppliers to improve cash flow.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Working capital metrics are within healthy ranges. Continue monitoring trends.')
  }

  return recommendations
}

/**
 * Generate simple projections using linear trend
 */
function generateProjections(metrics: any[], days: number): any[] {
  if (metrics.length < 2) return []

  const lastMetric = metrics[metrics.length - 1]
  const lastDate = new Date(lastMetric.metric_date)

  // Calculate simple trends
  const arTrend = (parseFloat(metrics[metrics.length - 1].accounts_receivable) -
    parseFloat(metrics[0].accounts_receivable)) / metrics.length
  const apTrend = (parseFloat(metrics[metrics.length - 1].accounts_payable) -
    parseFloat(metrics[0].accounts_payable)) / metrics.length
  const invTrend = (parseFloat(metrics[metrics.length - 1].inventory) -
    parseFloat(metrics[0].inventory)) / metrics.length

  const projections = []
  for (let i = 1; i <= days; i++) {
    const projDate = new Date(lastDate)
    projDate.setDate(lastDate.getDate() + i)

    const ar = Math.max(0, parseFloat(lastMetric.accounts_receivable) + arTrend * i)
    const ap = Math.max(0, parseFloat(lastMetric.accounts_payable) + apTrend * i)
    const inv = Math.max(0, parseFloat(lastMetric.inventory) + invTrend * i)

    projections.push({
      date: projDate.toISOString().split('T')[0],
      accountsReceivable: ar,
      accountsPayable: ap,
      inventory: inv,
      workingCapital: ar + inv - ap,
      isProjection: true
    })
  }

  return projections
}

export default router
