/**
 * Forecasts API Routes - Multi-Tenant
 *
 * Handles all demand forecasting operations with tenant isolation.
 * Requires 'ai_forecasting' feature (Professional+ tier).
 * All routes are tenant-scoped using tenantContext middleware.
 *
 * @module server/routes/forecasts
 */

import express from 'express'
import { tenantContext, requireFeature, preventReadOnly, requireRole } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const router = express.Router()

// Apply tenant middleware to all routes
router.use(tenantContext)

// All forecast routes require Professional+ tier
router.use(requireFeature('ai_forecasting'))

/**
 * GET /api/forecasts
 * List all forecasts for the current tenant
 *
 * @query {string} [productId] - Filter by product ID
 * @query {string} [forecastType] - Filter by forecast type (demand, revenue, cash_flow)
 * @query {string} [startDate] - Filter forecasts from this date
 * @returns {Array} List of forecasts
 */
router.get('/', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { productId, forecastType, startDate } = req.query

    let query = `
      SELECT f.id, f.product_id, f.forecast_date, f.period_type,
             f.forecast_type, f.model_type, f.predicted_value,
             f.confidence_lower, f.confidence_upper, f.accuracy_score,
             f.created_at, f.updated_at,
             p.sku, p.name as product_name
      FROM forecasts f
      LEFT JOIN products p ON p.id = f.product_id
      WHERE 1=1
    `
    const params = []
    let paramCount = 1

    if (productId) {
      query += ` AND f.product_id = $${paramCount++}`
      params.push(productId)
    }

    if (forecastType) {
      query += ` AND f.forecast_type = $${paramCount++}`
      params.push(forecastType)
    }

    if (startDate) {
      query += ` AND f.forecast_date >= $${paramCount++}`
      params.push(startDate)
    }

    query += ' ORDER BY f.forecast_date ASC, f.created_at DESC'

    const forecasts = await tenantPrisma.queryRaw(tenantSchema, query, params)

    res.json({
      success: true,
      data: forecasts,
      count: forecasts.length,
      filters: { productId, forecastType, startDate }
    })
  } catch (error) {
    console.error('[GET /api/forecasts] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forecasts',
      message: error.message
    })
  }
})

/**
 * GET /api/forecasts/demand
 * Get demand forecasts for all products
 *
 * @query {number} [days=30] - Number of days to forecast
 * @returns {Array} Demand forecasts
 */
router.get('/demand', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { days = 30 } = req.query

    const forecasts = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT f.*, p.sku, p.name, p.unit_price,
              (f.predicted_value * p.unit_price) as predicted_revenue
       FROM forecasts f
       JOIN products p ON p.id = f.product_id
       WHERE f.forecast_type = 'demand'
         AND f.forecast_date >= CURRENT_DATE
         AND f.forecast_date <= CURRENT_DATE + $1 * INTERVAL '1 day'
       ORDER BY f.forecast_date ASC, f.predicted_value DESC`,
      [parseInt(days)]
    )

    // Calculate total predicted demand
    const [summary] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT
        COUNT(DISTINCT f.product_id) as products_forecasted,
        SUM(f.predicted_value) as total_predicted_units,
        SUM(f.predicted_value * p.unit_price) as total_predicted_revenue
       FROM forecasts f
       JOIN products p ON p.id = f.product_id
       WHERE f.forecast_type = 'demand'
         AND f.forecast_date >= CURRENT_DATE
         AND f.forecast_date <= CURRENT_DATE + $1 * INTERVAL '1 day'`,
      [parseInt(days)]
    )

    res.json({
      success: true,
      data: forecasts,
      summary: {
        ...summary,
        total_predicted_revenue: parseFloat(summary.total_predicted_revenue || 0).toFixed(2)
      },
      period: `${days} days`
    })
  } catch (error) {
    console.error('[GET /api/forecasts/demand] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch demand forecasts',
      message: error.message
    })
  }
})

/**
 * GET /api/forecasts/:id
 * Get a single forecast by ID (tenant-scoped)
 *
 * @param {string} id - Forecast ID
 * @returns {Object} Forecast details
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { id } = req.params

    const [forecast] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT f.*, p.sku, p.name as product_name, p.unit_price
       FROM forecasts f
       LEFT JOIN products p ON p.id = f.product_id
       WHERE f.id = $1`,
      [id]
    )

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: 'forecast_not_found',
        message: 'Forecast not found'
      })
    }

    res.json({
      success: true,
      data: forecast
    })
  } catch (error) {
    console.error('[GET /api/forecasts/:id] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forecast',
      message: error.message
    })
  }
})

/**
 * POST /api/forecasts
 * Create a new forecast
 *
 * @body {string} [productId] - Product ID (optional for revenue/cash_flow forecasts)
 * @body {string} forecastDate - Forecast date (ISO 8601)
 * @body {string} periodType - Period type (daily, weekly, monthly)
 * @body {string} forecastType - Forecast type (demand, revenue, cash_flow)
 * @body {string} modelType - Model type (arima, lstm, prophet, random_forest, ensemble)
 * @body {number} predictedValue - Predicted value
 * @body {number} [confidenceLower] - Lower confidence bound
 * @body {number} [confidenceUpper] - Upper confidence bound
 * @body {number} [accuracyScore] - Model accuracy score
 * @returns {Object} Created forecast
 */
router.post('/',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const {
        productId,
        forecastDate,
        periodType,
        forecastType,
        modelType,
        predictedValue,
        confidenceLower,
        confidenceUpper,
        accuracyScore
      } = req.body

      // Validation
      if (!forecastDate || !periodType || !forecastType || !modelType || predictedValue === undefined) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Missing required fields'
        })
      }

      // Verify product exists if provided
      if (productId) {
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
      }

      // Create forecast
      const [forecast] = await tenantPrisma.queryRaw(
        tenantSchema,
        `INSERT INTO forecasts (product_id, forecast_date, period_type, forecast_type, model_type, predicted_value, confidence_lower, confidence_upper, accuracy_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          productId || null,
          forecastDate,
          periodType,
          forecastType,
          modelType,
          parseFloat(predictedValue),
          confidenceLower ? parseFloat(confidenceLower) : null,
          confidenceUpper ? parseFloat(confidenceUpper) : null,
          accuracyScore ? parseFloat(accuracyScore) : null
        ]
      )

      res.status(201).json({
        success: true,
        data: forecast,
        message: 'Forecast created successfully'
      })
    } catch (error) {
      console.error('[POST /api/forecasts] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create forecast',
        message: error.message
      })
    }
  }
)

/**
 * PUT /api/forecasts/:id
 * Update an existing forecast
 *
 * @param {string} id - Forecast ID
 * @body {Object} updates - Fields to update
 * @returns {Object} Updated forecast
 */
router.put('/:id',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { id } = req.params
      const { predictedValue, confidenceLower, confidenceUpper, accuracyScore } = req.body

      // Check if forecast exists
      const [existing] = await tenantPrisma.queryRaw(
        tenantSchema,
        'SELECT id FROM forecasts WHERE id = $1',
        [id]
      )

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'forecast_not_found',
          message: 'Forecast not found'
        })
      }

      // Build dynamic update query
      const updates = []
      const values = []
      let paramCount = 1

      if (predictedValue !== undefined) {
        updates.push(`predicted_value = $${paramCount++}`)
        values.push(parseFloat(predictedValue))
      }
      if (confidenceLower !== undefined) {
        updates.push(`confidence_lower = $${paramCount++}`)
        values.push(parseFloat(confidenceLower))
      }
      if (confidenceUpper !== undefined) {
        updates.push(`confidence_upper = $${paramCount++}`)
        values.push(parseFloat(confidenceUpper))
      }
      if (accuracyScore !== undefined) {
        updates.push(`accuracy_score = $${paramCount++}`)
        values.push(parseFloat(accuracyScore))
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

      const [forecast] = await tenantPrisma.queryRaw(
        tenantSchema,
        `UPDATE forecasts
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      )

      res.json({
        success: true,
        data: forecast,
        message: 'Forecast updated successfully'
      })
    } catch (error) {
      console.error('[PUT /api/forecasts/:id] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update forecast',
        message: error.message
      })
    }
  }
)

/**
 * DELETE /api/forecasts/:id
 * Delete a forecast (requires admin role)
 *
 * @param {string} id - Forecast ID
 * @returns {Object} Deleted forecast
 */
router.delete('/:id',
  preventReadOnly,
  requireRole(['owner', 'admin']),
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { id } = req.params

      const [forecast] = await tenantPrisma.queryRaw(
        tenantSchema,
        'DELETE FROM forecasts WHERE id = $1 RETURNING *',
        [id]
      )

      if (!forecast) {
        return res.status(404).json({
          success: false,
          error: 'forecast_not_found',
          message: 'Forecast not found'
        })
      }

      res.json({
        success: true,
        data: forecast,
        message: 'Forecast deleted successfully'
      })
    } catch (error) {
      console.error('[DELETE /api/forecasts/:id] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete forecast',
        message: error.message
      })
    }
  }
)

export default router
