/**
 * Scenarios API Routes - Multi-Tenant
 *
 * Handles what-if scenario analysis with tenant isolation.
 * Requires 'what_if' feature (Professional+ tier).
 * All routes are tenant-scoped using tenantContext middleware.
 *
 * @module server/routes/scenarios
 */

import express from 'express'
import { tenantContext, requireFeature, preventReadOnly, requireRole } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const router = express.Router()

// Apply tenant middleware to all routes
router.use(tenantContext)

// All scenario routes require Professional+ tier
router.use(requireFeature('what_if'))

/**
 * GET /api/scenarios
 * List all scenarios for the current tenant
 *
 * @query {string} [scenarioType] - Filter by scenario type (demand, pricing, cost, inventory)
 * @returns {Array} List of scenarios
 */
router.get('/', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { scenarioType } = req.query

    let query = `
      SELECT s.id, s.name, s.scenario_type, s.description,
             s.baseline_value, s.adjusted_value, s.impact,
             s.confidence, s.probability, s.created_by,
             s.created_at, s.updated_at
      FROM scenarios s
      WHERE 1=1
    `
    const params = []

    if (scenarioType) {
      query += ' AND s.scenario_type = $1'
      params.push(scenarioType)
    }

    query += ' ORDER BY s.created_at DESC'

    const scenarios = await tenantPrisma.queryRaw(tenantSchema, query, params)

    res.json({
      success: true,
      data: scenarios,
      count: scenarios.length,
      filters: { scenarioType }
    })
  } catch (error) {
    console.error('[GET /api/scenarios] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scenarios',
      message: error.message
    })
  }
})

/**
 * GET /api/scenarios/:id
 * Get a single scenario by ID (tenant-scoped)
 *
 * @param {string} id - Scenario ID
 * @returns {Object} Scenario details
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { id } = req.params

    const [scenario] = await tenantPrisma.queryRaw(
      tenantSchema,
      'SELECT * FROM scenarios WHERE id = $1',
      [id]
    )

    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: 'scenario_not_found',
        message: 'Scenario not found'
      })
    }

    res.json({
      success: true,
      data: scenario
    })
  } catch (error) {
    console.error('[GET /api/scenarios/:id] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scenario',
      message: error.message
    })
  }
})

/**
 * POST /api/scenarios
 * Create a new what-if scenario
 *
 * @body {string} name - Scenario name
 * @body {string} scenarioType - Scenario type (demand, pricing, cost, inventory)
 * @body {string} [description] - Scenario description
 * @body {number} baselineValue - Baseline value before adjustment
 * @body {number} adjustedValue - Adjusted value in scenario
 * @body {number} [impact] - Calculated impact
 * @body {number} [confidence] - Confidence level (0-1)
 * @body {number} [probability] - Probability of occurrence (0-1)
 * @returns {Object} Created scenario
 */
router.post('/',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema, userRole, tenant } = req
      const {
        name,
        scenarioType,
        description,
        baselineValue,
        adjustedValue,
        impact,
        confidence,
        probability
      } = req.body

      // Validation
      if (!name || !scenarioType || baselineValue === undefined || adjustedValue === undefined) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Missing required fields: name, scenarioType, baselineValue, adjustedValue'
        })
      }

      // Calculate impact if not provided
      const calculatedImpact = impact !== undefined ? impact : (adjustedValue - baselineValue)

      // Create scenario
      const [scenario] = await tenantPrisma.queryRaw(
        tenantSchema,
        `INSERT INTO scenarios (name, scenario_type, description, baseline_value, adjusted_value, impact, confidence, probability, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          name,
          scenarioType,
          description || null,
          parseFloat(baselineValue),
          parseFloat(adjustedValue),
          parseFloat(calculatedImpact),
          confidence ? parseFloat(confidence) : null,
          probability ? parseFloat(probability) : null,
          req.auth?.userId || 'system'
        ]
      )

      res.status(201).json({
        success: true,
        data: scenario,
        message: 'Scenario created successfully'
      })
    } catch (error) {
      console.error('[POST /api/scenarios] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create scenario',
        message: error.message
      })
    }
  }
)

/**
 * POST /api/scenarios/analyze
 * Analyze a what-if scenario (complex multi-variable analysis)
 *
 * @body {string} scenarioType - Type of analysis (demand, pricing, cost, inventory)
 * @body {Object} adjustments - Adjustments to apply { variable: value }
 * @body {number} [timeHorizon] - Time horizon in days (default: 30)
 * @returns {Object} Scenario analysis results
 */
router.post('/analyze',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { scenarioType, adjustments, timeHorizon = 30 } = req.body

      if (!scenarioType || !adjustments) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Missing required fields: scenarioType, adjustments'
        })
      }

      // Get baseline metrics
      const baseline = await getBaselineMetrics(tenantSchema, scenarioType)

      // Apply adjustments
      const projected = await projectScenario(tenantSchema, baseline, adjustments, timeHorizon)

      // Calculate impact
      const impact = calculateImpact(baseline, projected)

      res.json({
        success: true,
        data: {
          scenarioType,
          timeHorizon,
          baseline,
          adjustments,
          projected,
          impact,
          recommendations: generateScenarioRecommendations(impact)
        }
      })
    } catch (error) {
      console.error('[POST /api/scenarios/analyze] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to analyze scenario',
        message: error.message
      })
    }
  }
)

/**
 * PUT /api/scenarios/:id
 * Update an existing scenario
 *
 * @param {string} id - Scenario ID
 * @body {Object} updates - Fields to update
 * @returns {Object} Updated scenario
 */
router.put('/:id',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { id } = req.params
      const { name, description, adjustedValue, impact, confidence, probability } = req.body

      // Check if scenario exists
      const [existing] = await tenantPrisma.queryRaw(
        tenantSchema,
        'SELECT id FROM scenarios WHERE id = $1',
        [id]
      )

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'scenario_not_found',
          message: 'Scenario not found'
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
      if (adjustedValue !== undefined) {
        updates.push(`adjusted_value = $${paramCount++}`)
        values.push(parseFloat(adjustedValue))
      }
      if (impact !== undefined) {
        updates.push(`impact = $${paramCount++}`)
        values.push(parseFloat(impact))
      }
      if (confidence !== undefined) {
        updates.push(`confidence = $${paramCount++}`)
        values.push(parseFloat(confidence))
      }
      if (probability !== undefined) {
        updates.push(`probability = $${paramCount++}`)
        values.push(parseFloat(probability))
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

      const [scenario] = await tenantPrisma.queryRaw(
        tenantSchema,
        `UPDATE scenarios
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      )

      res.json({
        success: true,
        data: scenario,
        message: 'Scenario updated successfully'
      })
    } catch (error) {
      console.error('[PUT /api/scenarios/:id] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update scenario',
        message: error.message
      })
    }
  }
)

/**
 * DELETE /api/scenarios/:id
 * Delete a scenario (requires owner or admin role)
 *
 * @param {string} id - Scenario ID
 * @returns {Object} Deleted scenario
 */
router.delete('/:id',
  preventReadOnly,
  requireRole(['owner', 'admin']),
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const { id } = req.params

      const [scenario] = await tenantPrisma.queryRaw(
        tenantSchema,
        'DELETE FROM scenarios WHERE id = $1 RETURNING *',
        [id]
      )

      if (!scenario) {
        return res.status(404).json({
          success: false,
          error: 'scenario_not_found',
          message: 'Scenario not found'
        })
      }

      res.json({
        success: true,
        data: scenario,
        message: 'Scenario deleted successfully'
      })
    } catch (error) {
      console.error('[DELETE /api/scenarios/:id] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete scenario',
        message: error.message
      })
    }
  }
)

// ==================== HELPER FUNCTIONS ====================

/**
 * Get baseline metrics for scenario analysis
 * @private
 */
async function getBaselineMetrics(tenantSchema, scenarioType) {
  switch (scenarioType) {
    case 'demand':
      // Get average demand from recent sales
      const [demandBaseline] = await tenantPrisma.queryRaw(
        tenantSchema,
        `SELECT
          COUNT(*) as order_count,
          SUM(quantity) as total_units,
          AVG(quantity) as avg_units_per_order,
          SUM(total_amount) as total_revenue
         FROM sales
         WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'`
      )
      return demandBaseline

    case 'pricing':
      // Get current pricing metrics
      const [pricingBaseline] = await tenantPrisma.queryRaw(
        tenantSchema,
        `SELECT
          COUNT(*) as product_count,
          AVG(unit_price) as avg_price,
          SUM(unit_price * (SELECT COALESCE(SUM(quantity), 0) FROM sales WHERE product_id = products.id)) as total_revenue
         FROM products
         WHERE is_active = true`
      )
      return pricingBaseline

    case 'cost':
      // Get cost metrics
      const [costBaseline] = await tenantPrisma.queryRaw(
        tenantSchema,
        `SELECT
          COUNT(*) as product_count,
          AVG(unit_cost) as avg_cost,
          SUM(unit_cost * (SELECT COALESCE(quantity_on_hand, 0) FROM inventory WHERE product_id = products.id)) as total_inventory_cost
         FROM products
         WHERE is_active = true`
      )
      return costBaseline

    case 'inventory':
      // Get inventory metrics
      const [inventoryBaseline] = await tenantPrisma.queryRaw(
        tenantSchema,
        `SELECT
          COUNT(*) as sku_count,
          SUM(quantity_on_hand) as total_units,
          SUM(quantity_on_hand * p.unit_cost) as inventory_value
         FROM inventory i
         JOIN products p ON p.id = i.product_id
         WHERE p.is_active = true`
      )
      return inventoryBaseline

    default:
      throw new Error(`Unknown scenario type: ${scenarioType}`)
  }
}

/**
 * Project scenario results based on adjustments
 * @private
 */
async function projectScenario(tenantSchema, baseline, adjustments, timeHorizon) {
  // Simplified projection logic
  // In production, this would use ML models and historical data

  const projected = { ...baseline }

  // Apply adjustments
  for (const [variable, adjustment] of Object.entries(adjustments)) {
    if (projected[variable] !== undefined) {
      projected[variable] = projected[variable] * (1 + adjustment / 100)
    }
  }

  return projected
}

/**
 * Calculate impact of scenario vs baseline
 * @private
 */
function calculateImpact(baseline, projected) {
  const impact = {}

  for (const key in baseline) {
    if (typeof baseline[key] === 'number' && typeof projected[key] === 'number') {
      impact[key] = {
        absolute: projected[key] - baseline[key],
        percentage: ((projected[key] - baseline[key]) / baseline[key]) * 100
      }
    }
  }

  return impact
}

/**
 * Generate recommendations based on scenario impact
 * @private
 */
function generateScenarioRecommendations(impact) {
  const recommendations = []

  // Example recommendations
  if (impact.total_revenue?.percentage > 10) {
    recommendations.push({
      type: 'positive',
      message: `Revenue projected to increase by ${impact.total_revenue.percentage.toFixed(1)}%. Consider implementing this strategy.`
    })
  }

  if (impact.total_revenue?.percentage < -10) {
    recommendations.push({
      type: 'warning',
      message: `Revenue projected to decrease by ${Math.abs(impact.total_revenue.percentage).toFixed(1)}%. Exercise caution.`
    })
  }

  return recommendations
}

export default router
