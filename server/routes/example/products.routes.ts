/**
 * Example Tenant-Aware Product Routes
 *
 * BMAD-MULTITENANT-002 Story 9: Example API Routes
 *
 * This file demonstrates how to use the multi-tenant middleware system:
 * - tenantMiddleware: Identifies tenant and sets database schema
 * - requireRole: Enforces RBAC permissions
 * - requireFeature: Enforces subscription tier features
 *
 * All routes in this file are tenant-scoped - queries automatically
 * target the correct tenant schema via PostgreSQL search_path.
 *
 * @module server/routes/example/products.routes
 */

import express, { Request, Response } from 'express'
import { tenantMiddleware } from '../../middleware/tenant.middleware'
import { requireRole } from '../../middleware/rbac.middleware'
import { requireFeature } from '../../middleware/feature.middleware'
import { prisma } from '../../lib/prisma-tenant'

const router = express.Router()

// ================================
// Apply Tenant Middleware to ALL Routes
// ================================
// This ensures every request in this router has tenant context
router.use(tenantMiddleware)

// ================================
// Product Routes
// ================================

/**
 * GET /api/example/products
 *
 * List all products for the current tenant
 *
 * **Access**: All authenticated users (viewer+)
 * **Tenant Isolation**: Automatic via search_path
 *
 * @example
 * curl -H "Authorization: Bearer <token>" \
 *      -H "X-Organization-ID: org_abc123" \
 *      https://api.capliquify.com/api/example/products
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Query automatically targets tenant schema due to tenantMiddleware
    const products = await prisma.$queryRawUnsafe(`
      SELECT id, sku, name, category, unit_price, is_active
      FROM products
      WHERE is_active = true
      ORDER BY name
    `)

    res.json({
      success: true,
      data: products,
      meta: {
        tenant: req.tenant?.slug,
        count: Array.isArray(products) ? products.length : 0
      }
    })
  } catch (error: any) {
    console.error('[Products] Error fetching products:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    })
  }
})

/**
 * GET /api/example/products/:id
 *
 * Get a specific product by ID
 *
 * **Access**: All authenticated users (viewer+)
 * **Tenant Isolation**: Automatic via search_path
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const products = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM products
      WHERE id = $1::UUID
    `, id)

    const product = Array.isArray(products) && products.length > 0 ? products[0] : null

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: product
    })
  } catch (error: any) {
    console.error('[Products] Error fetching product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    })
  }
})

/**
 * POST /api/example/products
 *
 * Create a new product
 *
 * **Access**: Admin role or higher (admin, owner)
 * **Tenant Isolation**: Automatic via search_path
 *
 * @example
 * curl -X POST \
 *      -H "Authorization: Bearer <token>" \
 *      -H "X-Organization-ID: org_abc123" \
 *      -H "Content-Type: application/json" \
 *      -d '{"sku":"WIDGET-001","name":"Super Widget","unitPrice":99.99}' \
 *      https://api.capliquify.com/api/example/products
 */
router.post('/', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { sku, name, description, category, unitCost, unitPrice } = req.body

    // Validate required fields
    if (!sku || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['sku', 'name']
      })
    }

    // Get default company ID (first company in tenant schema)
    const companies = await prisma.$queryRawUnsafe(`
      SELECT id FROM companies LIMIT 1
    `) as any[]

    if (!companies || companies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No company found',
        message: 'Please create a company first'
      })
    }

    const companyId = companies[0].id

    // Insert product
    const result = await prisma.$queryRawUnsafe(`
      INSERT INTO products (company_id, sku, name, description, category, unit_cost, unit_price)
      VALUES ($1::UUID, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, companyId, sku, name, description || null, category || null, unitCost || 0, unitPrice || 0) as any[]

    const product = result[0]

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    })
  } catch (error: any) {
    console.error('[Products] Error creating product:', error)

    // Handle duplicate SKU
    if (error.message?.includes('unique')) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate SKU',
        message: 'A product with this SKU already exists'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: error.message
    })
  }
})

/**
 * PUT /api/example/products/:id
 *
 * Update an existing product
 *
 * **Access**: Member role or higher (member, admin, owner)
 * **Tenant Isolation**: Automatic via search_path
 */
router.put('/:id', requireRole('member'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, category, unitCost, unitPrice, isActive } = req.body

    // Build dynamic UPDATE query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(description)
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`)
      values.push(category)
    }
    if (unitCost !== undefined) {
      updates.push(`unit_cost = $${paramIndex++}`)
      values.push(unitCost)
    }
    if (unitPrice !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`)
      values.push(unitPrice)
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      values.push(isActive)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await prisma.$queryRawUnsafe(`
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}::UUID
      RETURNING *
    `, ...values) as any[]

    const product = result[0]

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    })
  } catch (error: any) {
    console.error('[Products] Error updating product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      message: error.message
    })
  }
})

/**
 * DELETE /api/example/products/:id
 *
 * Delete a product (soft delete - marks as inactive)
 *
 * **Access**: Admin role or higher (admin, owner)
 * **Tenant Isolation**: Automatic via search_path
 */
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Soft delete (mark as inactive)
    const result = await prisma.$queryRawUnsafe(`
      UPDATE products
      SET is_active = false, updated_at = NOW()
      WHERE id = $1::UUID
      RETURNING id, sku, name
    `, id) as any[]

    const product = result[0]

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: product,
      message: 'Product deleted successfully'
    })
  } catch (error: any) {
    console.error('[Products] Error deleting product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      message: error.message
    })
  }
})

// ================================
// AI Forecasting Routes (Feature-Gated)
// ================================

/**
 * GET /api/example/products/:id/ai-forecast
 *
 * Get AI-powered demand forecast for a product
 *
 * **Access**: Professional+ tier (ai_forecasting feature)
 * **RBAC**: All authenticated users (viewer+)
 * **Tenant Isolation**: Automatic via search_path
 *
 * @example
 * // This will fail for Starter tier with 403 Forbidden
 * curl -H "Authorization: Bearer <token>" \
 *      -H "X-Organization-ID: org_abc123" \
 *      https://api.capliquify.com/api/example/products/product-id/ai-forecast
 */
router.get(
  '/:id/ai-forecast',
  requireFeature('ai_forecasting'), // Blocks Starter tier
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // Fetch forecasts for product
      const forecasts = await prisma.$queryRawUnsafe(`
        SELECT *
        FROM forecasts
        WHERE product_id = $1::UUID
        ORDER BY forecast_date DESC
        LIMIT 30
      `, id)

      res.json({
        success: true,
        data: forecasts,
        feature: 'ai_forecasting',
        tier: req.tenant?.subscriptionTier
      })
    } catch (error: any) {
      console.error('[Products] Error fetching AI forecast:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI forecast',
        message: error.message
      })
    }
  }
)

// ================================
// Export Router
// ================================

export default router
