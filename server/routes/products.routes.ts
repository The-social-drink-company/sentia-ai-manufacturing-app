/**
 * Products Routes (TypeScript Multi-Tenant)
 *
 * Handles all product-related operations with tenant isolation.
 *
 * @module server/routes/products.routes
 */

import express, { Request, Response } from 'express'
import { z } from 'zod'
import { tenantContext, requireRole, preventReadOnly, checkEntityLimit, auditLog } from '../middleware/tenantContext.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { ValidationError, NotFoundError, ConflictError } from '../errors/AppError.js'
import { tenantPrisma } from '../services/tenantPrisma.js'
import { PaginatedResponse, Product } from '../types/api.types.js'

const router = express.Router()

// Apply tenant context to all routes
router.use(tenantContext)

// ==================== VALIDATION SCHEMAS ====================

const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'sku', 'unitPrice', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

const CreateProductSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  unitCost: z.number().min(0),
  unitPrice: z.number().min(0),
  category: z.string().max(100).optional(),
  isActive: z.boolean().default(true)
})

const UpdateProductSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  unitCost: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  category: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional()
})

// ==================== ROUTE HANDLERS ====================

/**
 * GET /api/products
 * Get all products with pagination, filtering, and sorting
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Validate query parameters
  const query = ProductQuerySchema.parse(req.query)
  const { page, limit, search, category, isActive, sortBy, sortOrder } = query

  // Build WHERE clause
  const conditions: string[] = ['deleted_at IS NULL']
  const params: any[] = []
  let paramIndex = 1

  if (search) {
    conditions.push(`(name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
    params.push(`%${search}%`)
    paramIndex++
  }

  if (category) {
    conditions.push(`category = $${paramIndex}`)
    params.push(category)
    paramIndex++
  }

  if (isActive !== undefined) {
    conditions.push(`is_active = $${paramIndex}`)
    params.push(isActive === 'true')
    paramIndex++
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // Map sortBy to actual column name
  const sortColumn = {
    name: 'name',
    sku: 'sku',
    unitPrice: 'unit_price',
    createdAt: 'created_at'
  }[sortBy]

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM products ${whereClause}`
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
      p.id,
      p.sku,
      p.name,
      p.description,
      p.unit_cost,
      p.unit_price,
      p.category,
      p.is_active,
      p.created_at,
      p.updated_at,
      COALESCE(SUM(i.quantity_on_hand), 0) as total_inventory
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    ${whereClause}
    GROUP BY p.id
    ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  params.push(limit, offset)

  const products = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    dataQuery,
    params
  )

  const response: PaginatedResponse<any> = {
    success: true,
    data: products,
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
 * POST /api/products
 * Create a new product
 */
router.post('/',
  requireRole(['owner', 'admin', 'member']),
  preventReadOnly,
  checkEntityLimit('products', async (schema) => {
    const [result] = await tenantPrisma.queryRaw<{ count: string }>(
      schema,
      'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL'
    )
    return parseInt(result.count)
  }),
  auditLog('products.create', 'product'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const productData = CreateProductSchema.parse(req.body)

    // Check for duplicate SKU
    const [existing] = await tenantPrisma.queryRaw<Product[]>(
      tenantSchema,
      `SELECT id FROM products WHERE sku = $1 AND deleted_at IS NULL`,
      [productData.sku]
    )

    if (existing) {
      throw new ConflictError(`Product with SKU '${productData.sku}' already exists`)
    }

    // Insert product
    const insertQuery = `
      INSERT INTO products (
        sku, name, description, unit_cost, unit_price, category, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    const [product] = await tenantPrisma.queryRaw<Product[]>(
      tenantSchema,
      insertQuery,
      [
        productData.sku,
        productData.name,
        productData.description || null,
        productData.unitCost,
        productData.unitPrice,
        productData.category || null,
        productData.isActive
      ]
    )

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    })
  })
)

/**
 * GET /api/products/:id
 * Get single product by ID with inventory details
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  const { id } = req.params

  const [product] = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    `
      SELECT
        p.*,
        COALESCE(SUM(i.quantity_on_hand), 0) as total_inventory,
        COUNT(DISTINCT i.warehouse_id) as warehouse_count
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id
    `,
    [id]
  )

  if (!product) {
    throw new NotFoundError(`Product not found: ${id}`)
  }

  res.json({
    success: true,
    data: product
  })
}))

/**
 * PUT /api/products/:id
 * Update an existing product
 */
router.put('/:id',
  requireRole(['owner', 'admin', 'member']),
  preventReadOnly,
  auditLog('products.update', 'product'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Validate request body
    const updateData = UpdateProductSchema.parse(req.body)

    // Verify product exists
    const [existing] = await tenantPrisma.queryRaw<Product[]>(
      tenantSchema,
      `SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (!existing) {
      throw new NotFoundError(`Product not found: ${id}`)
    }

    // Check for SKU conflict if SKU is being updated
    if (updateData.sku && updateData.sku !== existing.sku) {
      const [duplicate] = await tenantPrisma.queryRaw<Product[]>(
        tenantSchema,
        `SELECT id FROM products WHERE sku = $1 AND id != $2 AND deleted_at IS NULL`,
        [updateData.sku, id]
      )

      if (duplicate) {
        throw new ConflictError(`Product with SKU '${updateData.sku}' already exists`)
      }
    }

    // Build UPDATE query dynamically
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (updateData.sku !== undefined) {
      updates.push(`sku = $${paramIndex}`)
      params.push(updateData.sku)
      paramIndex++
    }

    if (updateData.name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      params.push(updateData.name)
      paramIndex++
    }

    if (updateData.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      params.push(updateData.description)
      paramIndex++
    }

    if (updateData.unitCost !== undefined) {
      updates.push(`unit_cost = $${paramIndex}`)
      params.push(updateData.unitCost)
      paramIndex++
    }

    if (updateData.unitPrice !== undefined) {
      updates.push(`unit_price = $${paramIndex}`)
      params.push(updateData.unitPrice)
      paramIndex++
    }

    if (updateData.category !== undefined) {
      updates.push(`category = $${paramIndex}`)
      params.push(updateData.category)
      paramIndex++
    }

    if (updateData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`)
      params.push(updateData.isActive)
      paramIndex++
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update')
    }

    updates.push(`updated_at = NOW()`)

    const updateQuery = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    params.push(id)

    const [product] = await tenantPrisma.queryRaw<Product[]>(
      tenantSchema,
      updateQuery,
      params
    )

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    })
  })
)

/**
 * DELETE /api/products/:id
 * Soft delete a product
 */
router.delete('/:id',
  requireRole(['owner', 'admin']),
  preventReadOnly,
  auditLog('products.delete', 'product'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Verify product exists
    const [product] = await tenantPrisma.queryRaw<Product[]>(
      tenantSchema,
      `SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (!product) {
      throw new NotFoundError(`Product not found: ${id}`)
    }

    // Soft delete
    await tenantPrisma.executeRaw(
      tenantSchema,
      `UPDATE products SET deleted_at = NOW() WHERE id = $1`,
      [id]
    )

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  })
)

/**
 * GET /api/products/:id/sales-history
 * Get sales history for a specific product
 */
router.get('/:id/sales-history', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  const { id } = req.params
  const { months = 6 } = req.query

  // Verify product exists
  const [product] = await tenantPrisma.queryRaw<Product[]>(
    tenantSchema,
    `SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  )

  if (!product) {
    throw new NotFoundError(`Product not found: ${id}`)
  }

  // Get sales history
  const salesHistory = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    `
      SELECT
        DATE_TRUNC('month', sale_date) as month,
        SUM(quantity) as total_quantity,
        SUM(total_amount) as total_revenue,
        COUNT(*) as order_count,
        AVG(unit_price) as avg_price
      FROM sales
      WHERE product_id = $1
        AND sale_date >= NOW() - INTERVAL '${parseInt(months as string)} months'
      GROUP BY DATE_TRUNC('month', sale_date)
      ORDER BY month DESC
    `,
    [id]
  )

  res.json({
    success: true,
    data: salesHistory,
    productId: id
  })
}))

export default router
