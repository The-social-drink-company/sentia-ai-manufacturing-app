/**
 * Forecasts Routes (TypeScript Multi-Tenant)
 *
 * Handles all demand forecasting operations with tenant isolation.
 * Requires Professional+ subscription tier (ai_forecasting feature).
 *
 * @module server/routes/forecasts.routes
 */

import express, { Request, Response } from 'express'
import { z } from 'zod'
import { tenantContext, requireRole, requireFeature, auditLog } from '../middleware/tenantContext.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { ValidationError, NotFoundError } from '../errors/AppError.js'
import { tenantPrisma } from '../services/tenantPrisma.js'
import { PaginatedResponse, Forecast } from '../types/api.types.js'

const router = express.Router()

// Apply tenant context and feature flag to all routes
router.use(tenantContext)
router.use(requireFeature('ai_forecasting'))

// ==================== VALIDATION SCHEMAS ====================

const ForecastQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  model: z.string().optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional()
})

const GenerateForecastSchema = z.object({
  productId: z.string().uuid(),
  periods: z.number().int().min(1).max(365).default(30),
  model: z.enum(['arima', 'prophet', 'ensemble']).default('ensemble'),
  includeConfidenceIntervals: z.boolean().default(true),
  seasonalPeriods: z.number().int().min(1).max(365).optional(),
  historicalDays: z.number().int().min(30).max(730).default(180)
})

const BulkGenerateForecastsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(100),
  periods: z.number().int().min(1).max(365).default(30),
  model: z.enum(['arima', 'prophet', 'ensemble']).default('ensemble')
})

// ==================== ROUTE HANDLERS ====================

/**
 * GET /api/forecasts
 * Get all forecasts with pagination and filtering
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Validate query parameters
  const query = ForecastQuerySchema.parse(req.query)
  const { page, limit, productId, startDate, endDate, model, minConfidence } = query

  // Build WHERE clause
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (productId) {
    conditions.push(`f.product_id = $${paramIndex}`)
    params.push(productId)
    paramIndex++
  }

  if (startDate) {
    conditions.push(`f.forecast_date >= $${paramIndex}`)
    params.push(startDate)
    paramIndex++
  }

  if (endDate) {
    conditions.push(`f.forecast_date <= $${paramIndex}`)
    params.push(endDate)
    paramIndex++
  }

  if (model) {
    conditions.push(`f.model = $${paramIndex}`)
    params.push(model)
    paramIndex++
  }

  if (minConfidence !== undefined) {
    conditions.push(`f.confidence_level >= $${paramIndex}`)
    params.push(minConfidence)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as count
    FROM forecasts f
    ${whereClause}
  `
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
      f.id,
      f.product_id,
      f.forecast_date,
      f.predicted_demand,
      f.confidence_level,
      f.model,
      f.created_at,
      p.sku as product_sku,
      p.name as product_name
    FROM forecasts f
    INNER JOIN products p ON p.id = f.product_id
    ${whereClause}
    ORDER BY f.forecast_date ASC, f.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  params.push(limit, offset)

  const forecasts = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    dataQuery,
    params
  )

  const response: PaginatedResponse<any> = {
    success: true,
    data: forecasts,
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
 * POST /api/forecasts/generate
 * Generate new forecast for a product
 */
router.post('/generate',
  requireRole(['owner', 'admin', 'member']),
  auditLog('forecasts.generate', 'forecast'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const forecastParams = GenerateForecastSchema.parse(req.body)

    // Verify product exists
    const [product] = await tenantPrisma.queryRaw<any[]>(
      tenantSchema,
      `SELECT id, name FROM products WHERE id = $1 AND deleted_at IS NULL`,
      [forecastParams.productId]
    )

    if (!product) {
      throw new NotFoundError(`Product not found: ${forecastParams.productId}`)
    }

    // Get historical sales data
    const historicalQuery = `
      SELECT
        DATE(sale_date) as date,
        SUM(quantity) as demand
      FROM sales
      WHERE product_id = $1
        AND sale_date >= NOW() - INTERVAL '${forecastParams.historicalDays} days'
      GROUP BY DATE(sale_date)
      ORDER BY date ASC
    `
    const historicalData = await tenantPrisma.queryRaw<any[]>(
      tenantSchema,
      historicalQuery,
      [forecastParams.productId]
    )

    if (historicalData.length < 30) {
      throw new ValidationError('Insufficient historical data (minimum 30 days required)')
    }

    // Generate forecasts using simple moving average + trend
    // In production, integrate with actual forecasting library (Prophet, ARIMA, etc.)
    const forecasts = generateSimpleForecast(
      historicalData,
      forecastParams.periods,
      forecastParams.includeConfidenceIntervals
    )

    // Insert forecasts into database
    const insertedForecasts = []
    for (const forecast of forecasts) {
      const insertQuery = `
        INSERT INTO forecasts (
          product_id, forecast_date, predicted_demand, confidence_level, model
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `
      const [inserted] = await tenantPrisma.queryRaw<Forecast[]>(
        tenantSchema,
        insertQuery,
        [
          forecastParams.productId,
          forecast.date,
          forecast.predictedDemand,
          forecast.confidenceLevel,
          forecastParams.model
        ]
      )
      insertedForecasts.push(inserted)
    }

    res.status(201).json({
      success: true,
      data: insertedForecasts,
      count: insertedForecasts.length,
      message: 'Forecast generated successfully',
      params: {
        productId: forecastParams.productId,
        productName: product.name,
        model: forecastParams.model,
        periods: forecastParams.periods,
        historicalDataPoints: historicalData.length
      }
    })
  })
)

/**
 * POST /api/forecasts/bulk-generate
 * Generate forecasts for multiple products
 */
router.post('/bulk-generate',
  requireRole(['owner', 'admin']),
  auditLog('forecasts.bulk_generate', 'forecast'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const bulkParams = BulkGenerateForecastsSchema.parse(req.body)

    const results = []

    for (const productId of bulkParams.productIds) {
      try {
        // Verify product exists
        const [product] = await tenantPrisma.queryRaw<any[]>(
          tenantSchema,
          `SELECT id, name FROM products WHERE id = $1 AND deleted_at IS NULL`,
          [productId]
        )

        if (!product) {
          results.push({
            productId,
            success: false,
            error: 'Product not found'
          })
          continue
        }

        // Get historical sales data
        const historicalQuery = `
          SELECT
            DATE(sale_date) as date,
            SUM(quantity) as demand
          FROM sales
          WHERE product_id = $1
            AND sale_date >= NOW() - INTERVAL '180 days'
          GROUP BY DATE(sale_date)
          ORDER BY date ASC
        `
        const historicalData = await tenantPrisma.queryRaw<any[]>(
          tenantSchema,
          historicalQuery,
          [productId]
        )

        if (historicalData.length < 30) {
          results.push({
            productId,
            success: false,
            error: 'Insufficient historical data'
          })
          continue
        }

        // Generate and insert forecasts
        const forecasts = generateSimpleForecast(historicalData, bulkParams.periods, true)
        const insertedCount = 0

        for (const forecast of forecasts) {
          const insertQuery = `
            INSERT INTO forecasts (
              product_id, forecast_date, predicted_demand, confidence_level, model
            )
            VALUES ($1, $2, $3, $4, $5)
          `
          await tenantPrisma.executeRaw(
            tenantSchema,
            insertQuery,
            [productId, forecast.date, forecast.predictedDemand, forecast.confidenceLevel, bulkParams.model]
          )
        }

        results.push({
          productId,
          productName: product.name,
          success: true,
          forecastsGenerated: forecasts.length
        })
      } catch (error: any) {
        results.push({
          productId,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    res.status(201).json({
      success: true,
      data: results,
      summary: {
        total: bulkParams.productIds.length,
        successful: successCount,
        failed: bulkParams.productIds.length - successCount
      },
      message: `Generated forecasts for ${successCount} products`
    })
  })
)

/**
 * GET /api/forecasts/:id
 * Get single forecast by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  const { id } = req.params

  const [forecast] = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    `
      SELECT
        f.*,
        p.sku as product_sku,
        p.name as product_name
      FROM forecasts f
      INNER JOIN products p ON p.id = f.product_id
      WHERE f.id = $1
    `,
    [id]
  )

  if (!forecast) {
    throw new NotFoundError(`Forecast not found: ${id}`)
  }

  res.json({
    success: true,
    data: forecast
  })
}))

/**
 * DELETE /api/forecasts/:id
 * Delete a forecast
 */
router.delete('/:id',
  requireRole(['owner', 'admin']),
  auditLog('forecasts.delete', 'forecast'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Verify forecast exists
    const [forecast] = await tenantPrisma.queryRaw<Forecast[]>(
      tenantSchema,
      `SELECT * FROM forecasts WHERE id = $1`,
      [id]
    )

    if (!forecast) {
      throw new NotFoundError(`Forecast not found: ${id}`)
    }

    // Delete forecast
    await tenantPrisma.executeRaw(
      tenantSchema,
      `DELETE FROM forecasts WHERE id = $1`,
      [id]
    )

    res.json({
      success: true,
      message: 'Forecast deleted successfully'
    })
  })
)

// ==================== HELPER FUNCTIONS ====================

/**
 * Simple forecast generation using moving average + trend
 * In production, replace with proper forecasting library
 */
function generateSimpleForecast(
  historicalData: any[],
  periods: number,
  includeConfidence: boolean
): any[] {
  // Calculate moving average and trend
  const window = Math.min(30, historicalData.length)
  const recentData = historicalData.slice(-window)
  const avgDemand = recentData.reduce((sum, d) => sum + parseFloat(d.demand), 0) / window

  // Simple trend calculation
  const firstHalf = recentData.slice(0, window / 2)
  const secondHalf = recentData.slice(window / 2)
  const firstAvg = firstHalf.reduce((sum, d) => sum + parseFloat(d.demand), 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, d) => sum + parseFloat(d.demand), 0) / secondHalf.length
  const trend = (secondAvg - firstAvg) / (window / 2)

  // Generate forecasts
  const forecasts = []
  const lastDate = new Date(historicalData[historicalData.length - 1].date)

  for (let i = 1; i <= periods; i++) {
    const forecastDate = new Date(lastDate)
    forecastDate.setDate(lastDate.getDate() + i)

    const predictedDemand = Math.max(0, Math.round(avgDemand + trend * i))
    const confidenceLevel = includeConfidence
      ? Math.max(0.5, 1 - i / (periods * 2)) // Confidence decreases over time
      : 0.75

    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      predictedDemand,
      confidenceLevel
    })
  }

  return forecasts
}

export default router
