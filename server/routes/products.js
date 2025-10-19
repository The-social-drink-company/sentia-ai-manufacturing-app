/**
 * Products API Routes - Multi-Tenant
 *
 * Handles all product-related operations with tenant isolation.
 * All routes are tenant-scoped using tenantContext middleware.
 *
 * @module server/routes/products
 */

import express from 'express'
import { tenantContext, checkEntityLimit, preventReadOnly, requireRole } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const router = express.Router()

// Apply tenant middleware to all routes in this file
router.use(tenantContext)

/**
 * GET /api/products
 * List all active products for the current tenant
 *
 * @returns {Array} List of products with inventory data
 */
router.get('/', async (req, res) => {
  try {
    const { tenantSchema } = req

    const products = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT p.id, p.company_id, p.sku, p.name, p.description,
              p.unit_cost, p.unit_price, p.is_active,
              p.created_at, p.updated_at,
              i.quantity_on_hand, i.quantity_available, i.quantity_allocated,
              i.warehouse_location, i.reorder_point, i.reorder_quantity
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.is_active = true
       ORDER BY p.name ASC`
    )

    res.json({
      success: true,
      data: products,
      count: products.length,
      tenant: {
        name: req.tenant.name,
        tier: req.tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('[GET /api/products] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    })
  }
})

/**
 * GET /api/products/:id
 * Get a single product by ID (tenant-scoped)
 *
 * @param {string} id - Product ID
 * @returns {Object} Product details with inventory
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { id } = req.params

    const [product] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT p.*, i.*
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.id = $1`,
      [id]
    )

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'product_not_found',
        message: 'Product not found in your organization'
      })
    }

    res.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error(`[GET /api/products/:id] Error:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    })
  }
})

/**
 * POST /api/products
 * Create a new product (with entity limit check)
 *
 * @body {string} sku - Product SKU (unique within tenant)
 * @body {string} name - Product name
 * @body {string} [description] - Product description
 * @body {number} unitCost - Cost per unit
 * @body {number} unitPrice - Price per unit
 * @returns {Object} Created product
 */
router.post('/',
  preventReadOnly,
  checkEntityLimit('products', async (schema) => {
    const [result] = await tenantPrisma.queryRaw(
      schema,
      'SELECT COUNT(*) as count FROM products'
    )
    return parseInt(result.count)
  }),
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { sku, name, description, unitCost, unitPrice } = req.body

      // Validation
      if (!sku || !name || unitCost === undefined || unitPrice === undefined) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Missing required fields: sku, name, unitCost, unitPrice'
        })
      }

      // Check if SKU already exists in tenant
      const [existing] = await tenantPrisma.queryRaw(
        tenantSchema,
        'SELECT id FROM products WHERE sku = $1',
        [sku]
      )

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'duplicate_sku',
          message: `Product with SKU '${sku}' already exists`
        })
      }

      // Create product
      const [product] = await tenantPrisma.queryRaw(
        tenantSchema,
        `INSERT INTO products (company_id, sku, name, description, unit_cost, unit_price, is_active)
         VALUES ((SELECT id FROM companies LIMIT 1), $1, $2, $3, $4, $5, true)
         RETURNING *`,
        [sku, name, description || null, parseFloat(unitCost), parseFloat(unitPrice)]
      )

      // Create initial inventory record
      await tenantPrisma.executeRaw(
        tenantSchema,
        `INSERT INTO inventory (product_id, quantity_on_hand, quantity_available, quantity_allocated, reorder_point, reorder_quantity)
         VALUES ($1, 0, 0, 0, 10, 100)`,
        [product.id]
      )

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      })
    } catch (error) {
      console.error('[POST /api/products] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
        message: error.message
      })
    }
  }
)

/**
 * PUT /api/products/:id
 * Update an existing product
 *
 * @param {string} id - Product ID
 * @body {Object} updates - Fields to update
 * @returns {Object} Updated product
 */
router.put('/:id',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { id } = req.params
      const { name, description, unitCost, unitPrice, isActive } = req.body

      // Check if product exists
      const [existing] = await tenantPrisma.queryRaw(
        tenantSchema,
        'SELECT id FROM products WHERE id = $1',
        [id]
      )

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'product_not_found',
          message: 'Product not found'
        })
      }

      // Build dynamic update query
      const updates = []
      const values = []
      let paramCount = 1

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`)
        values.push(name)
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`)
        values.push(description)
      }
      if (unitCost !== undefined) {
        updates.push(`unit_cost = $${paramCount++}`)
        values.push(parseFloat(unitCost))
      }
      if (unitPrice !== undefined) {
        updates.push(`unit_price = $${paramCount++}`)
        values.push(parseFloat(unitPrice))
      }
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramCount++}`)
        values.push(isActive)
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'no_updates',
          message: 'No fields to update'
        })
      }

      updates.push(`updated_at = NOW()`)
      values.push(id)

      const [product] = await tenantPrisma.queryRaw(
        tenantSchema,
        `UPDATE products
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      )

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      })
    } catch (error) {
      console.error('[PUT /api/products/:id] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update product',
        message: error.message
      })
    }
  }
)

/**
 * DELETE /api/products/:id
 * Soft-delete a product (requires owner or admin role)
 *
 * @param {string} id - Product ID
 * @returns {Object} Deleted product
 */
router.delete('/:id',
  preventReadOnly,
  requireRole(['owner', 'admin']),
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { id } = req.params

      // Soft delete (set is_active = false)
      const [product] = await tenantPrisma.queryRaw(
        tenantSchema,
        `UPDATE products
         SET is_active = false, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      )

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'product_not_found',
          message: 'Product not found'
        })
      }

      res.json({
        success: true,
        data: product,
        message: 'Product deleted successfully'
      })
    } catch (error) {
      console.error('[DELETE /api/products/:id] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
        message: error.message
      })
    }
  }
)

/**
 * GET /api/products/stats/summary
 * Get product statistics for the current tenant
 *
 * @returns {Object} Product statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { tenantSchema } = req

    const [stats] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE is_active = true) as active_products,
        AVG(unit_price) as avg_price,
        SUM(unit_cost * COALESCE((SELECT quantity_on_hand FROM inventory WHERE product_id = products.id), 0)) as total_inventory_value
       FROM products`
    )

    res.json({
      success: true,
      data: stats,
      tenant: {
        name: req.tenant.name,
        limit: req.tenant.maxEntities,
        usage: `${stats.total_products}/${req.tenant.maxEntities}`,
        percentUsed: ((stats.total_products / req.tenant.maxEntities) * 100).toFixed(1)
      }
    })
  } catch (error) {
    console.error('[GET /api/products/stats/summary] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product statistics',
      message: error.message
    })
  }
})

export default router
