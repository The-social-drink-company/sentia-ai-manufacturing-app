/**
 * Inventory API Routes - Multi-Tenant
 *
 * Handles all inventory-related operations with tenant isolation.
 * All routes are tenant-scoped using tenantContext middleware.
 *
 * @module server/routes/inventory
 */

import express from 'express'
import { tenantContext, preventReadOnly, requireRole } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const router = express.Router()

// Apply tenant middleware to all routes
router.use(tenantContext)

/**
 * GET /api/inventory
 * List all inventory records for the current tenant
 *
 * @query {boolean} [lowStock] - Filter by low stock items only
 * @returns {Array} List of inventory records with product details
 */
router.get('/', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { lowStock } = req.query

    let query = `
      SELECT i.id, i.product_id, i.quantity_on_hand, i.quantity_available,
             i.quantity_allocated, i.warehouse_location, i.reorder_point,
             i.reorder_quantity, i.last_restock_date, i.created_at, i.updated_at,
             p.sku, p.name, p.unit_cost, p.unit_price, p.is_active
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      WHERE p.is_active = true
    `

    if (lowStock === 'true') {
      query += ' AND i.quantity_available <= i.reorder_point'
    }

    query += ' ORDER BY p.name ASC'

    const inventory = await tenantPrisma.queryRaw(tenantSchema, query)

    // Calculate inventory value
    const totalValue = inventory.reduce((sum, item) => {
      return sum + (item.quantity_on_hand * item.unit_cost)
    }, 0)

    res.json({
      success: true,
      data: inventory,
      count: inventory.length,
      totalValue: parseFloat(totalValue).toFixed(2),
      lowStockCount: inventory.filter(item => item.quantity_available <= item.reorder_point).length
    })
  } catch (error) {
    console.error('[GET /api/inventory] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
      message: error.message
    })
  }
})

/**
 * GET /api/inventory/alerts
 * Get inventory alerts (low stock, out of stock)
 *
 * @returns {Object} Inventory alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const { tenantSchema } = req

    // Low stock items
    const lowStock = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT i.*, p.sku, p.name, p.unit_cost, p.unit_price
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE p.is_active = true
         AND i.quantity_available > 0
         AND i.quantity_available <= i.reorder_point
       ORDER BY i.quantity_available ASC`
    )

    // Out of stock items
    const outOfStock = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT i.*, p.sku, p.name, p.unit_cost, p.unit_price
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE p.is_active = true
         AND i.quantity_available = 0
       ORDER BY p.name ASC`
    )

    // Overstocked items (> 10x reorder quantity)
    const overstocked = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT i.*, p.sku, p.name, p.unit_cost, p.unit_price,
              (i.quantity_on_hand * p.unit_cost) as tied_up_capital
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE p.is_active = true
         AND i.quantity_on_hand > (i.reorder_quantity * 10)
       ORDER BY tied_up_capital DESC`
    )

    res.json({
      success: true,
      data: {
        lowStock: {
          items: lowStock,
          count: lowStock.length
        },
        outOfStock: {
          items: outOfStock,
          count: outOfStock.length
        },
        overstocked: {
          items: overstocked,
          count: overstocked.length
        }
      }
    })
  } catch (error) {
    console.error('[GET /api/inventory/alerts] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory alerts',
      message: error.message
    })
  }
})

/**
 * GET /api/inventory/levels
 * Get inventory level summary
 *
 * @returns {Object} Inventory level statistics
 */
router.get('/levels', async (req, res) => {
  try {
    const { tenantSchema } = req

    const [summary] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT
        COUNT(*) as total_skus,
        SUM(quantity_on_hand) as total_units,
        SUM(quantity_available) as available_units,
        SUM(quantity_allocated) as allocated_units,
        COUNT(*) FILTER (WHERE quantity_available = 0) as out_of_stock_count,
        COUNT(*) FILTER (WHERE quantity_available > 0 AND quantity_available <= reorder_point) as low_stock_count
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE p.is_active = true`
    )

    // Inventory value by warehouse
    const byWarehouse = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT i.warehouse_location,
              COUNT(*) as sku_count,
              SUM(i.quantity_on_hand) as units,
              SUM(i.quantity_on_hand * p.unit_cost) as value
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE p.is_active = true
       GROUP BY i.warehouse_location
       ORDER BY value DESC`
    )

    res.json({
      success: true,
      data: {
        summary,
        byWarehouse
      }
    })
  } catch (error) {
    console.error('[GET /api/inventory/levels] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory levels',
      message: error.message
    })
  }
})

/**
 * GET /api/inventory/:id
 * Get a single inventory record by ID (tenant-scoped)
 *
 * @param {string} id - Inventory ID
 * @returns {Object} Inventory details
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { id } = req.params

    const [inventory] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT i.*, p.sku, p.name, p.unit_cost, p.unit_price, p.is_active
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE i.id = $1`,
      [id]
    )

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'inventory_not_found',
        message: 'Inventory record not found'
      })
    }

    res.json({
      success: true,
      data: inventory
    })
  } catch (error) {
    console.error('[GET /api/inventory/:id] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
      message: error.message
    })
  }
})

/**
 * PUT /api/inventory/:id
 * Update inventory record (adjust stock levels, reorder points, etc.)
 *
 * @param {string} id - Inventory ID
 * @body {Object} updates - Fields to update
 * @returns {Object} Updated inventory
 */
router.put('/:id',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { id } = req.params
      const {
        quantityOnHand,
        quantityAllocated,
        warehouseLocation,
        reorderPoint,
        reorderQuantity,
        lastRestockDate
      } = req.body

      // Check if inventory exists
      const [existing] = await tenantPrisma.queryRaw(
        tenantSchema,
        'SELECT id FROM inventory WHERE id = $1',
        [id]
      )

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'inventory_not_found',
          message: 'Inventory record not found'
        })
      }

      // Build dynamic update query
      const updates = []
      const values = []
      let paramCount = 1

      if (quantityOnHand !== undefined) {
        updates.push(`quantity_on_hand = $${paramCount++}`)
        values.push(parseInt(quantityOnHand))
      }
      if (quantityAllocated !== undefined) {
        updates.push(`quantity_allocated = $${paramCount++}`)
        values.push(parseInt(quantityAllocated))
        // Recalculate quantity_available
        updates.push(`quantity_available = quantity_on_hand - $${paramCount - 1}`)
      }
      if (warehouseLocation !== undefined) {
        updates.push(`warehouse_location = $${paramCount++}`)
        values.push(warehouseLocation)
      }
      if (reorderPoint !== undefined) {
        updates.push(`reorder_point = $${paramCount++}`)
        values.push(parseInt(reorderPoint))
      }
      if (reorderQuantity !== undefined) {
        updates.push(`reorder_quantity = $${paramCount++}`)
        values.push(parseInt(reorderQuantity))
      }
      if (lastRestockDate !== undefined) {
        updates.push(`last_restock_date = $${paramCount++}`)
        values.push(lastRestockDate)
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

      const [inventory] = await tenantPrisma.queryRaw(
        tenantSchema,
        `UPDATE inventory
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      )

      res.json({
        success: true,
        data: inventory,
        message: 'Inventory updated successfully'
      })
    } catch (error) {
      console.error('[PUT /api/inventory/:id] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update inventory',
        message: error.message
      })
    }
  }
)

/**
 * POST /api/inventory/:id/adjust
 * Adjust inventory quantity (add or subtract)
 *
 * @param {string} id - Inventory ID
 * @body {number} adjustment - Quantity adjustment (positive = add, negative = subtract)
 * @body {string} reason - Reason for adjustment
 * @returns {Object} Updated inventory
 */
router.post('/:id/adjust',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { id } = req.params
      const { adjustment, reason } = req.body

      if (adjustment === undefined || !reason) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Missing required fields: adjustment, reason'
        })
      }

      // Update inventory with adjustment
      const [inventory] = await tenantPrisma.queryRaw(
        tenantSchema,
        `UPDATE inventory
         SET quantity_on_hand = quantity_on_hand + $1,
             quantity_available = quantity_available + $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [parseInt(adjustment), id]
      )

      if (!inventory) {
        return res.status(404).json({
          success: false,
          error: 'inventory_not_found',
          message: 'Inventory record not found'
        })
      }

      // TODO: Log adjustment to audit log
      // await auditLog.create({ action: 'inventory.adjust', reason, adjustment })

      res.json({
        success: true,
        data: inventory,
        message: `Inventory adjusted by ${adjustment} units. Reason: ${reason}`
      })
    } catch (error) {
      console.error('[POST /api/inventory/:id/adjust] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to adjust inventory',
        message: error.message
      })
    }
  }
)

export default router
