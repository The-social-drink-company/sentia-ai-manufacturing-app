/**
 * Sales API Routes - Multi-Tenant
 *
 * Handles all sales-related operations with tenant isolation.
 * All routes are tenant-scoped using tenantContext middleware.
 *
 * @module server/routes/sales
 */

import express from 'express'
import { tenantContext, preventReadOnly, requireRole } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const router = express.Router()

// Apply tenant middleware to all routes
router.use(tenantContext)

/**
 * GET /api/sales
 * List all sales for the current tenant
 *
 * @query {string} [startDate] - Filter sales from this date
 * @query {string} [endDate] - Filter sales until this date
 * @query {string} [channel] - Filter by sales channel (shopify_uk, shopify_eu, shopify_usa, amazon)
 * @returns {Array} List of sales
 */
router.get('/', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { startDate, endDate, channel } = req.query

    let query = `
      SELECT s.id, s.product_id, s.order_id, s.sale_date, s.channel,
             s.quantity, s.unit_price, s.total_amount, s.currency,
             s.customer_location, s.created_at, s.updated_at,
             p.sku, p.name as product_name
      FROM sales s
      LEFT JOIN products p ON p.id = s.product_id
      WHERE 1=1
    `
    const params = []
    let paramCount = 1

    if (startDate) {
      query += ` AND s.sale_date >= $${paramCount++}`
      params.push(startDate)
    }

    if (endDate) {
      query += ` AND s.sale_date <= $${paramCount++}`
      params.push(endDate)
    }

    if (channel) {
      query += ` AND s.channel = $${paramCount++}`
      params.push(channel)
    }

    query += ' ORDER BY s.sale_date DESC, s.created_at DESC'

    const sales = await tenantPrisma.queryRaw(tenantSchema, query, params)

    res.json({
      success: true,
      data: sales,
      count: sales.length,
      filters: { startDate, endDate, channel }
    })
  } catch (error) {
    console.error('[GET /api/sales] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales',
      message: error.message
    })
  }
})

/**
 * GET /api/sales/summary
 * Get sales summary statistics for the current tenant
 *
 * @query {string} [period] - Time period (today, week, month, quarter, year)
 * @returns {Object} Sales summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { period = 'month' } = req.query

    // Determine date range based on period
    let dateFilter = ''
    switch (period) {
      case 'today':
        dateFilter = "sale_date >= CURRENT_DATE"
        break
      case 'week':
        dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '7 days'"
        break
      case 'month':
        dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '30 days'"
        break
      case 'quarter':
        dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '90 days'"
        break
      case 'year':
        dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '365 days'"
        break
      default:
        dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '30 days'"
    }

    const [summary] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT
        COUNT(*) as total_orders,
        SUM(quantity) as total_units_sold,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        COUNT(DISTINCT product_id) as unique_products_sold,
        COUNT(DISTINCT channel) as channels_used
       FROM sales
       WHERE ${dateFilter}`
    )

    // Get top products
    const topProducts = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT p.sku, p.name,
              COUNT(s.id) as order_count,
              SUM(s.quantity) as units_sold,
              SUM(s.total_amount) as revenue
       FROM sales s
       JOIN products p ON p.id = s.product_id
       WHERE ${dateFilter}
       GROUP BY p.id, p.sku, p.name
       ORDER BY revenue DESC
       LIMIT 5`
    )

    // Get sales by channel
    const byChannel = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT channel,
              COUNT(*) as orders,
              SUM(total_amount) as revenue
       FROM sales
       WHERE ${dateFilter}
       GROUP BY channel
       ORDER BY revenue DESC`
    )

    res.json({
      success: true,
      data: {
        summary: {
          ...summary,
          total_revenue: parseFloat(summary.total_revenue || 0).toFixed(2),
          avg_order_value: parseFloat(summary.avg_order_value || 0).toFixed(2)
        },
        topProducts,
        byChannel
      },
      period
    })
  } catch (error) {
    console.error('[GET /api/sales/summary] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales summary',
      message: error.message
    })
  }
})

/**
 * GET /api/sales/product-performance
 * Get product performance metrics
 *
 * @query {string} [period] - Time period (default: month)
 * @returns {Array} Product performance data
 */
router.get('/product-performance', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { period = 'month' } = req.query

    let dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '30 days'"
    if (period === 'week') dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '7 days'"
    if (period === 'quarter') dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '90 days'"
    if (period === 'year') dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '365 days'"

    const performance = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT p.id, p.sku, p.name,
              COUNT(s.id) as order_count,
              SUM(s.quantity) as units_sold,
              SUM(s.total_amount) as revenue,
              AVG(s.unit_price) as avg_selling_price,
              p.unit_cost,
              SUM(s.total_amount - (p.unit_cost * s.quantity)) as gross_profit
       FROM products p
       LEFT JOIN sales s ON s.product_id = p.id AND ${dateFilter}
       WHERE p.is_active = true
       GROUP BY p.id, p.sku, p.name, p.unit_cost
       ORDER BY revenue DESC NULLS LAST`
    )

    res.json({
      success: true,
      data: performance,
      period
    })
  } catch (error) {
    console.error('[GET /api/sales/product-performance] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product performance',
      message: error.message
    })
  }
})

/**
 * GET /api/sales/:id
 * Get a single sale by ID (tenant-scoped)
 *
 * @param {string} id - Sale ID
 * @returns {Object} Sale details
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { id } = req.params

    const [sale] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT s.*, p.sku, p.name as product_name, p.unit_cost
       FROM sales s
       LEFT JOIN products p ON p.id = s.product_id
       WHERE s.id = $1`,
      [id]
    )

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'sale_not_found',
        message: 'Sale not found'
      })
    }

    res.json({
      success: true,
      data: sale
    })
  } catch (error) {
    console.error('[GET /api/sales/:id] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sale',
      message: error.message
    })
  }
})

/**
 * POST /api/sales
 * Create a new sale record (manual entry or import)
 *
 * @body {string} productId - Product ID
 * @body {string} orderId - External order ID
 * @body {string} saleDate - Sale date (ISO 8601)
 * @body {string} channel - Sales channel
 * @body {number} quantity - Quantity sold
 * @body {number} unitPrice - Price per unit
 * @body {number} totalAmount - Total sale amount
 * @body {string} [currency] - Currency code (default: USD)
 * @body {string} [customerLocation] - Customer location
 * @returns {Object} Created sale
 */
router.post('/',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const {
        productId,
        orderId,
        saleDate,
        channel,
        quantity,
        unitPrice,
        totalAmount,
        currency = 'USD',
        customerLocation
      } = req.body

      // Validation
      if (!productId || !orderId || !saleDate || !channel || !quantity || !unitPrice || !totalAmount) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Missing required fields'
        })
      }

      // Verify product exists
      const [product] = await tenantPrisma.queryRaw(
        tenantSchema,
        'SELECT id FROM products WHERE id = $1',
        [productId]
      )

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'product_not_found',
          message: 'Product not found'
        })
      }

      // Create sale
      const [sale] = await tenantPrisma.queryRaw(
        tenantSchema,
        `INSERT INTO sales (product_id, order_id, sale_date, channel, quantity, unit_price, total_amount, currency, customer_location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [productId, orderId, saleDate, channel, quantity, unitPrice, totalAmount, currency, customerLocation]
      )

      res.status(201).json({
        success: true,
        data: sale,
        message: 'Sale created successfully'
      })
    } catch (error) {
      console.error('[POST /api/sales] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create sale',
        message: error.message
      })
    }
  }
)

/**
 * DELETE /api/sales/:id
 * Delete a sale record (requires admin role)
 *
 * @param {string} id - Sale ID
 * @returns {Object} Deleted sale
 */
router.delete('/:id',
  preventReadOnly,
  requireRole(['owner', 'admin']),
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { id } = req.params

      const [sale] = await tenantPrisma.queryRaw(
        tenantSchema,
        'DELETE FROM sales WHERE id = $1 RETURNING *',
        [id]
      )

      if (!sale) {
        return res.status(404).json({
          success: false,
          error: 'sale_not_found',
          message: 'Sale not found'
        })
      }

      res.json({
        success: true,
        data: sale,
        message: 'Sale deleted successfully'
      })
    } catch (error) {
      console.error('[DELETE /api/sales/:id] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete sale',
        message: error.message
      })
    }
  }
)

export default router
