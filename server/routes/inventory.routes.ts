/**
 * Inventory Routes (TypeScript Multi-Tenant)
 *
 * Handles all inventory-related operations with tenant isolation.
 *
 * @module server/routes/inventory.routes
 */

import express, { Request, Response } from 'express'
import { z } from 'zod'
import { tenantContext, requireRole, preventReadOnly, auditLog } from '../middleware/tenantContext.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { ValidationError, NotFoundError } from '../errors/AppError.js'
import { tenantPrisma } from '../services/tenantPrisma.js'
import { PaginatedResponse, InventoryItem } from '../types/api.types.js'

const router = express.Router()

// Apply tenant context to all routes
router.use(tenantContext)

// ==================== VALIDATION SCHEMAS ====================

const InventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  lowStock: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['productName', 'quantity', 'lastRestocked']).default('productName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

const UpdateInventorySchema = z.object({
  quantityOnHand: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional().nullable(),
  reorderQuantity: z.number().int().min(0).optional().nullable(),
  lastRestocked: z.string().datetime().optional().nullable()
})

const AdjustInventorySchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid().optional().nullable(),
  adjustmentType: z.enum(['add', 'subtract', 'set']),
  quantity: z.number().int().min(0),
  reason: z.string().min(1).max(255),
  notes: z.string().max(1000).optional()
})

const InventoryValuationQuerySchema = z.object({
  method: z.enum(['fifo', 'lifo', 'average']).default('average'),
  asOfDate: z.string().datetime().optional()
})

// ==================== ROUTE HANDLERS ====================

/**
 * GET /api/inventory
 * Get all inventory items with pagination and filtering
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Validate query parameters
  const query = InventoryQuerySchema.parse(req.query)
  const { page, limit, productId, warehouseId, lowStock, sortBy, sortOrder } = query

  // Build WHERE clause
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (productId) {
    conditions.push(`i.product_id = $${paramIndex}`)
    params.push(productId)
    paramIndex++
  }

  if (warehouseId) {
    conditions.push(`i.warehouse_id = $${paramIndex}`)
    params.push(warehouseId)
    paramIndex++
  }

  if (lowStock === 'true') {
    conditions.push(`i.quantity_on_hand <= COALESCE(i.reorder_point, 0)`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Map sortBy to actual column name
  const sortColumn = {
    productName: 'p.name',
    quantity: 'i.quantity_on_hand',
    lastRestocked: 'i.last_restocked'
  }[sortBy]

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as count
    FROM inventory i
    INNER JOIN products p ON p.id = i.product_id
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
      i.id,
      i.product_id,
      i.warehouse_id,
      i.quantity_on_hand,
      i.reorder_point,
      i.reorder_quantity,
      i.last_restocked,
      i.updated_at,
      p.sku as product_sku,
      p.name as product_name,
      p.unit_cost as product_unit_cost,
      CASE
        WHEN i.reorder_point IS NOT NULL AND i.quantity_on_hand <= i.reorder_point THEN true
        ELSE false
      END as is_low_stock
    FROM inventory i
    INNER JOIN products p ON p.id = i.product_id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  params.push(limit, offset)

  const inventory = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    dataQuery,
    params
  )

  const response: PaginatedResponse<any> = {
    success: true,
    data: inventory,
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
 * GET /api/inventory/alerts
 * Get low stock alerts
 */
router.get('/alerts', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  const alertsQuery = `
    SELECT
      i.id,
      i.product_id,
      i.warehouse_id,
      i.quantity_on_hand,
      i.reorder_point,
      i.reorder_quantity,
      p.sku as product_sku,
      p.name as product_name,
      CASE
        WHEN i.quantity_on_hand = 0 THEN 'critical'
        WHEN i.quantity_on_hand <= (i.reorder_point * 0.5) THEN 'urgent'
        ELSE 'warning'
      END as alert_level
    FROM inventory i
    INNER JOIN products p ON p.id = i.product_id AND p.is_active = true
    WHERE i.reorder_point IS NOT NULL
      AND i.quantity_on_hand <= i.reorder_point
    ORDER BY
      CASE
        WHEN i.quantity_on_hand = 0 THEN 1
        WHEN i.quantity_on_hand <= (i.reorder_point * 0.5) THEN 2
        ELSE 3
      END,
      i.quantity_on_hand ASC
  `

  const alerts = await tenantPrisma.queryRaw<any[]>(tenantSchema, alertsQuery)

  res.json({
    success: true,
    data: alerts,
    count: alerts.length
  })
}))

/**
 * GET /api/inventory/valuation
 * Calculate inventory valuation
 */
router.get('/valuation', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Validate query parameters
  const { method } = InventoryValuationQuerySchema.parse(req.query)

  // For now, use simple average cost method
  // In production, implement FIFO/LIFO with purchase history
  const valuationQuery = `
    SELECT
      SUM(i.quantity_on_hand * p.unit_cost) as total_value,
      SUM(i.quantity_on_hand) as total_units,
      COUNT(DISTINCT i.product_id) as product_count,
      AVG(p.unit_cost) as avg_unit_cost
    FROM inventory i
    INNER JOIN products p ON p.id = i.product_id AND p.is_active = true
    WHERE i.quantity_on_hand > 0
  `

  const [valuation] = await tenantPrisma.queryRaw<any[]>(tenantSchema, valuationQuery)

  // Get breakdown by category
  const categoryBreakdownQuery = `
    SELECT
      COALESCE(p.category, 'Uncategorized') as category,
      SUM(i.quantity_on_hand * p.unit_cost) as category_value,
      SUM(i.quantity_on_hand) as category_units
    FROM inventory i
    INNER JOIN products p ON p.id = i.product_id AND p.is_active = true
    WHERE i.quantity_on_hand > 0
    GROUP BY p.category
    ORDER BY category_value DESC
  `

  const categoryBreakdown = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    categoryBreakdownQuery
  )

  res.json({
    success: true,
    data: {
      method,
      summary: valuation,
      categoryBreakdown
    }
  })
}))

/**
 * PUT /api/inventory/:id
 * Update inventory settings (reorder points, etc.)
 */
router.put('/:id',
  requireRole(['owner', 'admin', 'member']),
  preventReadOnly,
  auditLog('inventory.update', 'inventory'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Validate request body
    const updateData = UpdateInventorySchema.parse(req.body)

    // Verify inventory item exists
    const [existing] = await tenantPrisma.queryRaw<InventoryItem[]>(
      tenantSchema,
      `SELECT * FROM inventory WHERE id = $1`,
      [id]
    )

    if (!existing) {
      throw new NotFoundError(`Inventory item not found: ${id}`)
    }

    // Build UPDATE query dynamically
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (updateData.quantityOnHand !== undefined) {
      updates.push(`quantity_on_hand = $${paramIndex}`)
      params.push(updateData.quantityOnHand)
      paramIndex++
    }

    if (updateData.reorderPoint !== undefined) {
      updates.push(`reorder_point = $${paramIndex}`)
      params.push(updateData.reorderPoint)
      paramIndex++
    }

    if (updateData.reorderQuantity !== undefined) {
      updates.push(`reorder_quantity = $${paramIndex}`)
      params.push(updateData.reorderQuantity)
      paramIndex++
    }

    if (updateData.lastRestocked !== undefined) {
      updates.push(`last_restocked = $${paramIndex}`)
      params.push(updateData.lastRestocked)
      paramIndex++
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update')
    }

    updates.push(`updated_at = NOW()`)

    const updateQuery = `
      UPDATE inventory
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    params.push(id)

    const [inventory] = await tenantPrisma.queryRaw<InventoryItem[]>(
      tenantSchema,
      updateQuery,
      params
    )

    res.json({
      success: true,
      data: inventory,
      message: 'Inventory updated successfully'
    })
  })
)

/**
 * POST /api/inventory/adjust
 * Adjust inventory quantity with audit trail
 */
router.post('/adjust',
  requireRole(['owner', 'admin', 'member']),
  preventReadOnly,
  auditLog('inventory.adjust', 'inventory'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const adjustment = AdjustInventorySchema.parse(req.body)

    // Find or create inventory record
    let [inventory] = await tenantPrisma.queryRaw<InventoryItem[]>(
      tenantSchema,
      `SELECT * FROM inventory WHERE product_id = $1 AND COALESCE(warehouse_id, '') = COALESCE($2, '')`,
      [adjustment.productId, adjustment.warehouseId || '']
    )

    if (!inventory) {
      // Create new inventory record
      const insertQuery = `
        INSERT INTO inventory (product_id, warehouse_id, quantity_on_hand)
        VALUES ($1, $2, 0)
        RETURNING *
      `
      ;[inventory] = await tenantPrisma.queryRaw<InventoryItem[]>(
        tenantSchema,
        insertQuery,
        [adjustment.productId, adjustment.warehouseId || null]
      )
    }

    // Calculate new quantity
    let newQuantity: number
    switch (adjustment.adjustmentType) {
      case 'add':
        newQuantity = inventory.quantityOnHand + adjustment.quantity
        break
      case 'subtract':
        newQuantity = Math.max(0, inventory.quantityOnHand - adjustment.quantity)
        break
      case 'set':
        newQuantity = adjustment.quantity
        break
    }

    // Update inventory
    const updateQuery = `
      UPDATE inventory
      SET quantity_on_hand = $1,
          last_restocked = CASE WHEN $2 = 'add' THEN NOW() ELSE last_restocked END,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `
    const [updated] = await tenantPrisma.queryRaw<InventoryItem[]>(
      tenantSchema,
      updateQuery,
      [newQuantity, adjustment.adjustmentType, inventory.id]
    )

    res.json({
      success: true,
      data: updated,
      message: 'Inventory adjusted successfully',
      adjustment: {
        type: adjustment.adjustmentType,
        quantity: adjustment.quantity,
        previousQuantity: inventory.quantityOnHand,
        newQuantity,
        reason: adjustment.reason
      }
    })
  })
)

/**
 * GET /api/inventory/:id
 * Get single inventory item by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  const { id } = req.params

  const [inventory] = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    `
      SELECT
        i.*,
        p.sku as product_sku,
        p.name as product_name,
        p.unit_cost as product_unit_cost,
        p.category as product_category
      FROM inventory i
      INNER JOIN products p ON p.id = i.product_id
      WHERE i.id = $1
    `,
    [id]
  )

  if (!inventory) {
    throw new NotFoundError(`Inventory item not found: ${id}`)
  }

  res.json({
    success: true,
    data: inventory
  })
}))

export default router
