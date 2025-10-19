/**
 * Working Capital API Routes - Multi-Tenant
 *
 * Handles working capital metrics and analysis with tenant isolation.
 * All routes are tenant-scoped using tenantContext middleware.
 *
 * @module server/routes/working-capital
 */

import express from 'express'
import { tenantContext, preventReadOnly } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const router = express.Router()

// Apply tenant middleware to all routes
router.use(tenantContext)

/**
 * GET /api/working-capital
 * Get current working capital metrics for the tenant
 *
 * @returns {Object} Working capital metrics
 */
router.get('/', async (req, res) => {
  try {
    const { tenantSchema } = req

    // Get latest working capital metrics
    const [latest] = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT *
       FROM working_capital_metrics
       ORDER BY metric_date DESC
       LIMIT 1`
    )

    if (!latest) {
      return res.status(404).json({
        success: false,
        error: 'no_metrics_found',
        message: 'No working capital metrics available. Please sync financial data from Xero.'
      })
    }

    // Calculate ratios
    const currentRatio = latest.current_assets / (latest.current_liabilities || 1)
    const quickRatio = (latest.current_assets - latest.inventory_value) / (latest.current_liabilities || 1)
    const cashRatio = latest.cash / (latest.current_liabilities || 1)

    res.json({
      success: true,
      data: {
        ...latest,
        ratios: {
          currentRatio: parseFloat(currentRatio).toFixed(2),
          quickRatio: parseFloat(quickRatio).toFixed(2),
          cashRatio: parseFloat(cashRatio).toFixed(2)
        },
        health: {
          status: currentRatio >= 1.5 ? 'healthy' : currentRatio >= 1.0 ? 'moderate' : 'poor',
          recommendation: currentRatio >= 1.5 ? 'Maintain current levels' :
                          currentRatio >= 1.0 ? 'Consider improving liquidity' :
                          'Urgent: Improve cash position'
        }
      }
    })
  } catch (error) {
    console.error('[GET /api/working-capital] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch working capital metrics',
      message: error.message
    })
  }
})

/**
 * GET /api/working-capital/history
 * Get historical working capital metrics
 *
 * @query {string} [startDate] - Start date
 * @query {string} [endDate] - End date
 * @query {number} [limit=30] - Number of records to return
 * @returns {Array} Historical working capital metrics
 */
router.get('/history', async (req, res) => {
  try {
    const { tenantSchema } = req
    const { startDate, endDate, limit = 30 } = req.query

    let query = 'SELECT * FROM working_capital_metrics WHERE 1=1'
    const params = []
    let paramCount = 1

    if (startDate) {
      query += ` AND metric_date >= $${paramCount++}`
      params.push(startDate)
    }

    if (endDate) {
      query += ` AND metric_date <= $${paramCount++}`
      params.push(endDate)
    }

    query += ` ORDER BY metric_date DESC LIMIT $${paramCount}`
    params.push(parseInt(limit))

    const history = await tenantPrisma.queryRaw(tenantSchema, query, params)

    res.json({
      success: true,
      data: history.reverse(), // Return in chronological order
      count: history.length
    })
  } catch (error) {
    console.error('[GET /api/working-capital/history] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch working capital history',
      message: error.message
    })
  }
})

/**
 * GET /api/working-capital/overview
 * Get comprehensive working capital overview with trends
 *
 * @returns {Object} Working capital overview
 */
router.get('/overview', async (req, res) => {
  try {
    const { tenantSchema } = req

    // Get last 12 months of metrics
    const metrics = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT *
       FROM working_capital_metrics
       WHERE metric_date >= CURRENT_DATE - INTERVAL '365 days'
       ORDER BY metric_date ASC`
    )

    if (metrics.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'no_metrics_found',
        message: 'No working capital metrics available'
      })
    }

    // Calculate trends
    const latest = metrics[metrics.length - 1]
    const oneMonthAgo = metrics.find(m => new Date(m.metric_date) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    const threeMonthsAgo = metrics.find(m => new Date(m.metric_date) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))

    const trends = {
      oneMonth: {
        workingCapital: latest.working_capital - (oneMonthAgo?.working_capital || latest.working_capital),
        dso: latest.dso - (oneMonthAgo?.dso || latest.dso),
        dpo: latest.dpo - (oneMonthAgo?.dpo || latest.dpo)
      },
      threeMonths: {
        workingCapital: latest.working_capital - (threeMonthsAgo?.working_capital || latest.working_capital),
        dso: latest.dso - (threeMonthsAgo?.dso || latest.dso),
        dpo: latest.dpo - (threeMonthsAgo?.dpo || latest.dpo)
      }
    }

    res.json({
      success: true,
      data: {
        current: latest,
        trends,
        history: metrics,
        insights: {
          workingCapitalTrend: trends.oneMonth.workingCapital > 0 ? 'improving' : 'declining',
          cashConversionCycle: latest.ccc,
          recommendedActions: generateRecommendations(latest, trends)
        }
      }
    })
  } catch (error) {
    console.error('[GET /api/working-capital/overview] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch working capital overview',
      message: error.message
    })
  }
})

/**
 * POST /api/working-capital
 * Create a new working capital metrics record
 *
 * @body {string} metricDate - Metric date (ISO 8601)
 * @body {number} cash - Cash balance
 * @body {number} accountsReceivable - Accounts receivable
 * @body {number} accountsPayable - Accounts payable
 * @body {number} inventory - Inventory value
 * @body {number} [currentAssets] - Total current assets
 * @body {number} [currentLiabilities] - Total current liabilities
 * @returns {Object} Created working capital metrics
 */
router.post('/',
  preventReadOnly,
  async (req, res) => {
    try {
      const { tenantSchema } = req
      const {
        metricDate,
        cash,
        accountsReceivable,
        accountsPayable,
        inventory,
        currentAssets,
        currentLiabilities
      } = req.body

      // Validation
      if (!metricDate || cash === undefined || accountsReceivable === undefined || accountsPayable === undefined) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Missing required fields: metricDate, cash, accountsReceivable, accountsPayable'
        })
      }

      // Calculate derived metrics
      const workingCapital = (currentAssets || (cash + accountsReceivable + (inventory || 0))) -
                             (currentLiabilities || accountsPayable)

      // Approximate DSO, DPO, DIO (simplified calculation)
      // In production, these would be calculated from actual sales/COGS data
      const dso = accountsReceivable / (1000 * 30) * 30 // Placeholder: AR / (daily sales)
      const dpo = accountsPayable / (1000 * 30) * 30 // Placeholder: AP / (daily COGS)
      const dio = (inventory || 0) / (1000 * 30) * 30 // Placeholder: Inventory / (daily COGS)
      const ccc = dso + dio - dpo // Cash Conversion Cycle

      // Create metrics record
      const [metrics] = await tenantPrisma.queryRaw(
        tenantSchema,
        `INSERT INTO working_capital_metrics (
          metric_date, cash, accounts_receivable, accounts_payable, inventory_value,
          current_assets, current_liabilities, working_capital, dso, dpo, dio, ccc
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          metricDate,
          parseFloat(cash),
          parseFloat(accountsReceivable),
          parseFloat(accountsPayable),
          inventory ? parseFloat(inventory) : 0,
          currentAssets ? parseFloat(currentAssets) : cash + accountsReceivable + (inventory || 0),
          currentLiabilities ? parseFloat(currentLiabilities) : accountsPayable,
          workingCapital,
          dso,
          dpo,
          dio,
          ccc
        ]
      )

      res.status(201).json({
        success: true,
        data: metrics,
        message: 'Working capital metrics created successfully'
      })
    } catch (error) {
      console.error('[POST /api/working-capital] Error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create working capital metrics',
        message: error.message
      })
    }
  }
)

/**
 * Helper function to generate recommendations based on metrics
 * @private
 */
function generateRecommendations(latest, trends) {
  const recommendations = []

  // DSO recommendations
  if (latest.dso > 45) {
    recommendations.push({
      area: 'Accounts Receivable',
      severity: 'high',
      message: `Days Sales Outstanding (${latest.dso.toFixed(0)} days) is high. Consider improving collection processes.`
    })
  }

  // DPO recommendations
  if (latest.dpo < 30) {
    recommendations.push({
      area: 'Accounts Payable',
      severity: 'medium',
      message: `Days Payable Outstanding (${latest.dpo.toFixed(0)} days) is low. Consider negotiating longer payment terms.`
    })
  }

  // CCC recommendations
  if (latest.ccc > 60) {
    recommendations.push({
      area: 'Cash Conversion Cycle',
      severity: 'high',
      message: `Cash Conversion Cycle (${latest.ccc.toFixed(0)} days) is lengthy. Focus on reducing inventory and improving collections.`
    })
  }

  // Working capital trend
  if (trends.oneMonth.workingCapital < 0) {
    recommendations.push({
      area: 'Working Capital',
      severity: 'high',
      message: 'Working capital is declining. Review cash flow management strategies.'
    })
  }

  return recommendations
}

export default router
