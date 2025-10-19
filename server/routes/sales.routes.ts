/**
 * Sales Routes (TypeScript Multi-Tenant)
 *
 * Handles all sales-related operations with tenant isolation.
 *
 * @module server/routes/sales.routes
 */

import express, { Request, Response } from 'express'
import { z } from 'zod'
import { tenantContext, requireRole, auditLog } from '../middleware/tenantContext.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { ValidationError, NotFoundError } from '../errors/AppError.js'
import { tenantPrisma } from '../services/tenantPrisma.js'
import { PaginatedResponse, Sale } from '../types/api.types.js'

const router = express.Router()

// Apply tenant context to all routes
router.use(tenantContext)

// ==================== VALIDATION SCHEMAS ====================

const SaleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  channel: z.string().optional(),
  productId: z.string().uuid().optional(),
  customerId: z.string().optional()
})

const CreateSaleSchema = z.object({
  orderId: z.string().min(1).max(255),
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  saleDate: z.string().datetime().optional(),
  channel: z.string().max(100).optional(),
  customerId: z.string().max(255).optional()
})

const BulkCreateSalesSchema = z.object({
  sales: z.array(CreateSaleSchema).min(1).max(1000)
})

const SaleStatsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month', 'product', 'channel']).default('day')
})

// ==================== ROUTE HANDLERS ====================

/**
 * GET /api/sales
 * Get all sales with pagination and filtering
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Validate query parameters
  const query = SaleQuerySchema.parse(req.query)
  const { page, limit, startDate, endDate, channel, productId, customerId } = query

  // Build WHERE clause
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (startDate) {
    conditions.push(`sale_date >= $${paramIndex}`)
    params.push(startDate)
    paramIndex++
  }

  if (endDate) {
    conditions.push(`sale_date <= $${paramIndex}`)
    params.push(endDate)
    paramIndex++
  }

  if (channel) {
    conditions.push(`channel = $${paramIndex}`)
    params.push(channel)
    paramIndex++
  }

  if (productId) {
    conditions.push(`product_id = $${paramIndex}`)
    params.push(productId)
    paramIndex++
  }

  if (customerId) {
    conditions.push(`customer_id = $${paramIndex}`)
    params.push(customerId)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM sales ${whereClause}`
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
      s.id,
      s.order_id,
      s.product_id,
      s.quantity,
      s.unit_price,
      s.total_amount,
      s.sale_date,
      s.channel,
      s.customer_id,
      s.created_at,
      p.name as product_name,
      p.sku as product_sku
    FROM sales s
    LEFT JOIN products p ON p.id = s.product_id
    ${whereClause}
    ORDER BY s.sale_date DESC, s.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  params.push(limit, offset)

  const sales = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    dataQuery,
    params
  )

  const response: PaginatedResponse<any> = {
    success: true,
    data: sales,
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
 * POST /api/sales
 * Create a new sale record
 */
router.post('/',
  requireRole(['owner', 'admin', 'member']),
  auditLog('sales.create', 'sale'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const saleData = CreateSaleSchema.parse(req.body)

    // Verify product exists
    const [product] = await tenantPrisma.queryRaw<any[]>(
      tenantSchema,
      `SELECT id, unit_price FROM products WHERE id = $1 AND deleted_at IS NULL`,
      [saleData.productId]
    )

    if (!product) {
      throw new NotFoundError(`Product not found: ${saleData.productId}`)
    }

    // Calculate total amount
    const totalAmount = saleData.quantity * saleData.unitPrice

    // Insert sale
    const insertQuery = `
      INSERT INTO sales (
        order_id, product_id, quantity, unit_price, total_amount,
        sale_date, channel, customer_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    const [sale] = await tenantPrisma.queryRaw<Sale[]>(
      tenantSchema,
      insertQuery,
      [
        saleData.orderId,
        saleData.productId,
        saleData.quantity,
        saleData.unitPrice,
        totalAmount,
        saleData.saleDate || new Date().toISOString(),
        saleData.channel || null,
        saleData.customerId || null
      ]
    )

    res.status(201).json({
      success: true,
      data: sale,
      message: 'Sale created successfully'
    })
  })
)

/**
 * POST /api/sales/bulk
 * Bulk create sales (for imports)
 */
router.post('/bulk',
  requireRole(['owner', 'admin']),
  auditLog('sales.bulk_create', 'sale'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const { sales } = BulkCreateSalesSchema.parse(req.body)

    // Execute bulk insert in transaction
    const insertedSales = await tenantPrisma.transaction(tenantSchema, async (tx) => {
      const results = []

      for (const saleData of sales) {
        const totalAmount = saleData.quantity * saleData.unitPrice

        const insertQuery = `
          INSERT INTO sales (
            order_id, product_id, quantity, unit_price, total_amount,
            sale_date, channel, customer_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `
        const [sale] = await tx.$queryRawUnsafe<Sale[]>(
          insertQuery,
          saleData.orderId,
          saleData.productId,
          saleData.quantity,
          saleData.unitPrice,
          totalAmount,
          saleData.saleDate || new Date().toISOString(),
          saleData.channel || null,
          saleData.customerId || null
        )
        results.push(sale)
      }

      return results
    })

    res.status(201).json({
      success: true,
      data: insertedSales,
      count: insertedSales.length,
      message: `${insertedSales.length} sales created successfully`
    })
  })
)

/**
 * GET /api/sales/stats
 * Get sales statistics with various groupings
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Validate query parameters
  const query = SaleStatsQuerySchema.parse(req.query)
  const { startDate, endDate, groupBy } = query

  let groupByClause: string
  let dateFormat: string

  switch (groupBy) {
    case 'day':
      groupByClause = "DATE(sale_date)"
      dateFormat = "DATE(sale_date) as period"
      break
    case 'week':
      groupByClause = "DATE_TRUNC('week', sale_date)"
      dateFormat = "DATE_TRUNC('week', sale_date) as period"
      break
    case 'month':
      groupByClause = "DATE_TRUNC('month', sale_date)"
      dateFormat = "DATE_TRUNC('month', sale_date) as period"
      break
    case 'product':
      groupByClause = "product_id"
      dateFormat = "product_id as period"
      break
    case 'channel':
      groupByClause = "channel"
      dateFormat = "channel as period"
      break
    default:
      groupByClause = "DATE(sale_date)"
      dateFormat = "DATE(sale_date) as period"
  }

  const statsQuery = `
    SELECT
      ${dateFormat},
      COUNT(*) as order_count,
      SUM(quantity) as total_quantity,
      SUM(total_amount) as total_revenue,
      AVG(unit_price) as avg_unit_price,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM sales
    WHERE sale_date >= $1 AND sale_date <= $2
    GROUP BY ${groupByClause}
    ORDER BY period DESC
  `

  const stats = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    statsQuery,
    [startDate, endDate]
  )

  res.json({
    success: true,
    data: stats,
    groupBy,
    period: { startDate, endDate }
  })
}))

/**
 * GET /api/sales/:id
 * Get single sale by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  const { id } = req.params

  const [sale] = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    `
      SELECT
        s.*,
        p.name as product_name,
        p.sku as product_sku,
        p.category as product_category
      FROM sales s
      LEFT JOIN products p ON p.id = s.product_id
      WHERE s.id = $1
    `,
    [id]
  )

  if (!sale) {
    throw new NotFoundError(`Sale not found: ${id}`)
  }

  res.json({
    success: true,
    data: sale
  })
}))

/**
 * DELETE /api/sales/:id
 * Delete a sale (admin only)
 */
router.delete('/:id',
  requireRole(['owner', 'admin']),
  auditLog('sales.delete', 'sale'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Verify sale exists
    const [sale] = await tenantPrisma.queryRaw<Sale[]>(
      tenantSchema,
      `SELECT * FROM sales WHERE id = $1`,
      [id]
    )

    if (!sale) {
      throw new NotFoundError(`Sale not found: ${id}`)
    }

    // Delete sale
    await tenantPrisma.executeRaw(
      tenantSchema,
      `DELETE FROM sales WHERE id = $1`,
      [id]
    )

    res.json({
      success: true,
      message: 'Sale deleted successfully'
    })
  })
)

export default router
