/**
 * Scenarios Routes (TypeScript Multi-Tenant)
 *
 * Handles what-if scenario analysis operations with tenant isolation.
 * Requires Professional+ subscription tier (what_if feature).
 *
 * @module server/routes/scenarios.routes
 */

import express, { Request, Response } from 'express'
import { z } from 'zod'
import { tenantContext, requireRole, requireFeature, auditLog } from '../middleware/tenantContext.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { ValidationError, NotFoundError } from '../errors/AppError.js'
import { tenantPrisma } from '../services/tenantPrisma.js'
import { PaginatedResponse, Scenario } from '../types/api.types.js'

const router = express.Router()

// Apply tenant context and feature flag to all routes
router.use(tenantContext)
router.use(requireFeature('what_if'))

// ==================== VALIDATION SCHEMAS ====================

const ScenarioQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional()
})

const CreateScenarioSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  parameters: z.object({
    type: z.enum(['pricing', 'demand', 'cost', 'inventory', 'mixed']),
    // Pricing scenario
    priceChangePercent: z.number().optional(),
    affectedProducts: z.array(z.string().uuid()).optional(),
    // Demand scenario
    demandChangePercent: z.number().optional(),
    seasonalFactor: z.number().optional(),
    // Cost scenario
    costChangePercent: z.number().optional(),
    costCategory: z.enum(['materials', 'labor', 'overhead', 'all']).optional(),
    // Inventory scenario
    targetInventoryDays: z.number().int().min(1).optional(),
    safetyStockPercent: z.number().min(0).max(100).optional(),
    // Time horizon
    timeHorizonDays: z.number().int().min(1).max(365).default(90)
  })
})

const UpdateScenarioSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  parameters: z.object({
    type: z.enum(['pricing', 'demand', 'cost', 'inventory', 'mixed']).optional(),
    priceChangePercent: z.number().optional(),
    affectedProducts: z.array(z.string().uuid()).optional(),
    demandChangePercent: z.number().optional(),
    seasonalFactor: z.number().optional(),
    costChangePercent: z.number().optional(),
    costCategory: z.enum(['materials', 'labor', 'overhead', 'all']).optional(),
    targetInventoryDays: z.number().int().min(1).optional(),
    safetyStockPercent: z.number().min(0).max(100).optional(),
    timeHorizonDays: z.number().int().min(1).max(365).optional()
  }).optional()
})

const RunScenarioSchema = z.object({
  baselineDate: z.string().datetime().optional()
})

// ==================== ROUTE HANDLERS ====================

/**
 * GET /api/scenarios
 * Get all scenarios with pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  // Validate query parameters
  const query = ScenarioQuerySchema.parse(req.query)
  const { page, limit, search } = query

  // Build WHERE clause
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (search) {
    conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
    params.push(`%${search}%`)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM scenarios ${whereClause}`
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
      id,
      name,
      description,
      parameters,
      results,
      created_at,
      updated_at
    FROM scenarios
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  params.push(limit, offset)

  const scenarios = await tenantPrisma.queryRaw<any[]>(
    tenantSchema,
    dataQuery,
    params
  )

  const response: PaginatedResponse<any> = {
    success: true,
    data: scenarios,
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
 * POST /api/scenarios
 * Create a new scenario
 */
router.post('/',
  requireRole(['owner', 'admin', 'member']),
  auditLog('scenarios.create', 'scenario'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const scenarioData = CreateScenarioSchema.parse(req.body)

    // Insert scenario
    const insertQuery = `
      INSERT INTO scenarios (name, description, parameters)
      VALUES ($1, $2, $3)
      RETURNING *
    `
    const [scenario] = await tenantPrisma.queryRaw<Scenario[]>(
      tenantSchema,
      insertQuery,
      [
        scenarioData.name,
        scenarioData.description || null,
        JSON.stringify(scenarioData.parameters)
      ]
    )

    res.status(201).json({
      success: true,
      data: scenario,
      message: 'Scenario created successfully'
    })
  })
)

/**
 * POST /api/scenarios/:id/run
 * Run a scenario analysis
 */
router.post('/:id/run',
  requireRole(['owner', 'admin', 'member']),
  auditLog('scenarios.run', 'scenario'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Validate request body
    const runParams = RunScenarioSchema.parse(req.body)

    // Get scenario
    const [scenario] = await tenantPrisma.queryRaw<any[]>(
      tenantSchema,
      `SELECT * FROM scenarios WHERE id = $1`,
      [id]
    )

    if (!scenario) {
      throw new NotFoundError(`Scenario not found: ${id}`)
    }

    const parameters = typeof scenario.parameters === 'string'
      ? JSON.parse(scenario.parameters)
      : scenario.parameters

    // Run scenario analysis based on type
    let results: any
    switch (parameters.type) {
      case 'pricing':
        results = await runPricingScenario(tenantSchema, parameters)
        break
      case 'demand':
        results = await runDemandScenario(tenantSchema, parameters)
        break
      case 'cost':
        results = await runCostScenario(tenantSchema, parameters)
        break
      case 'inventory':
        results = await runInventoryScenario(tenantSchema, parameters)
        break
      case 'mixed':
        results = await runMixedScenario(tenantSchema, parameters)
        break
      default:
        throw new ValidationError(`Unknown scenario type: ${parameters.type}`)
    }

    // Update scenario with results
    const updateQuery = `
      UPDATE scenarios
      SET results = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `
    const [updated] = await tenantPrisma.queryRaw<Scenario[]>(
      tenantSchema,
      updateQuery,
      [JSON.stringify(results), id]
    )

    res.json({
      success: true,
      data: updated,
      message: 'Scenario analysis completed'
    })
  })
)

/**
 * GET /api/scenarios/:id
 * Get single scenario by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { tenantSchema } = req
  if (!tenantSchema) {
    throw new ValidationError('Tenant schema not found')
  }

  const { id } = req.params

  const [scenario] = await tenantPrisma.queryRaw<Scenario[]>(
    tenantSchema,
    `SELECT * FROM scenarios WHERE id = $1`,
    [id]
  )

  if (!scenario) {
    throw new NotFoundError(`Scenario not found: ${id}`)
  }

  res.json({
    success: true,
    data: scenario
  })
}))

/**
 * PUT /api/scenarios/:id
 * Update a scenario
 */
router.put('/:id',
  requireRole(['owner', 'admin', 'member']),
  auditLog('scenarios.update', 'scenario'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Validate request body
    const updateData = UpdateScenarioSchema.parse(req.body)

    // Verify scenario exists
    const [existing] = await tenantPrisma.queryRaw<Scenario[]>(
      tenantSchema,
      `SELECT * FROM scenarios WHERE id = $1`,
      [id]
    )

    if (!existing) {
      throw new NotFoundError(`Scenario not found: ${id}`)
    }

    // Build UPDATE query dynamically
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

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

    if (updateData.parameters !== undefined) {
      updates.push(`parameters = $${paramIndex}`)
      params.push(JSON.stringify(updateData.parameters))
      paramIndex++
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update')
    }

    updates.push(`updated_at = NOW()`)

    const updateQuery = `
      UPDATE scenarios
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    params.push(id)

    const [scenario] = await tenantPrisma.queryRaw<Scenario[]>(
      tenantSchema,
      updateQuery,
      params
    )

    res.json({
      success: true,
      data: scenario,
      message: 'Scenario updated successfully'
    })
  })
)

/**
 * DELETE /api/scenarios/:id
 * Delete a scenario
 */
router.delete('/:id',
  requireRole(['owner', 'admin']),
  auditLog('scenarios.delete', 'scenario'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Verify scenario exists
    const [scenario] = await tenantPrisma.queryRaw<Scenario[]>(
      tenantSchema,
      `SELECT * FROM scenarios WHERE id = $1`,
      [id]
    )

    if (!scenario) {
      throw new NotFoundError(`Scenario not found: ${id}`)
    }

    // Delete scenario
    await tenantPrisma.executeRaw(
      tenantSchema,
      `DELETE FROM scenarios WHERE id = $1`,
      [id]
    )

    res.json({
      success: true,
      message: 'Scenario deleted successfully'
    })
  })
)

// ==================== SCENARIO ANALYSIS FUNCTIONS ====================

/**
 * Run pricing scenario analysis
 */
async function runPricingScenario(schema: string, params: any): Promise<any> {
  // Get current sales and revenue
  const [currentMetrics] = await tenantPrisma.queryRaw<any[]>(
    schema,
    `
      SELECT
        SUM(total_amount) as current_revenue,
        SUM(quantity) as current_volume,
        AVG(unit_price) as avg_price
      FROM sales
      WHERE sale_date >= NOW() - INTERVAL '90 days'
    `
  )

  // Simple price elasticity model (assumes -1.5 elasticity)
  const priceChange = params.priceChangePercent / 100
  const volumeChange = priceChange * -1.5 // Price elasticity
  const newVolume = currentMetrics.current_volume * (1 + volumeChange)
  const newPrice = parseFloat(currentMetrics.avg_price) * (1 + priceChange)
  const newRevenue = newVolume * newPrice

  const revenueChange = newRevenue - parseFloat(currentMetrics.current_revenue)
  const revenueChangePercent = (revenueChange / parseFloat(currentMetrics.current_revenue)) * 100

  return {
    scenarioType: 'pricing',
    baseline: {
      revenue: parseFloat(currentMetrics.current_revenue),
      volume: parseInt(currentMetrics.current_volume),
      avgPrice: parseFloat(currentMetrics.avg_price)
    },
    projected: {
      revenue: newRevenue,
      volume: newVolume,
      avgPrice: newPrice
    },
    impact: {
      revenueChange,
      revenueChangePercent,
      volumeChange: newVolume - parseInt(currentMetrics.current_volume),
      volumeChangePercent: volumeChange * 100
    },
    assumptions: {
      priceElasticity: -1.5,
      priceChangePercent: params.priceChangePercent,
      timeHorizonDays: params.timeHorizonDays
    }
  }
}

/**
 * Run demand scenario analysis
 */
async function runDemandScenario(schema: string, params: any): Promise<any> {
  // Get current demand
  const [currentMetrics] = await tenantPrisma.queryRaw<any[]>(
    schema,
    `
      SELECT
        AVG(quantity) as avg_daily_demand,
        SUM(total_amount) as total_revenue
      FROM sales
      WHERE sale_date >= NOW() - INTERVAL '90 days'
    `
  )

  const demandChange = params.demandChangePercent / 100
  const newDemand = parseFloat(currentMetrics.avg_daily_demand) * (1 + demandChange)
  const projectedRevenue = parseFloat(currentMetrics.total_revenue) * (1 + demandChange)

  // Calculate inventory impact
  const requiredInventory = newDemand * params.timeHorizonDays

  return {
    scenarioType: 'demand',
    baseline: {
      avgDailyDemand: parseFloat(currentMetrics.avg_daily_demand),
      quarterlyRevenue: parseFloat(currentMetrics.total_revenue)
    },
    projected: {
      avgDailyDemand: newDemand,
      quarterlyRevenue: projectedRevenue,
      requiredInventory
    },
    impact: {
      demandChangePercent: params.demandChangePercent,
      revenueImpact: projectedRevenue - parseFloat(currentMetrics.total_revenue),
      inventoryImpact: requiredInventory
    },
    assumptions: {
      demandChangePercent: params.demandChangePercent,
      seasonalFactor: params.seasonalFactor || 1.0,
      timeHorizonDays: params.timeHorizonDays
    }
  }
}

/**
 * Run cost scenario analysis
 */
async function runCostScenario(schema: string, params: any): Promise<any> {
  // Get current costs
  const [currentMetrics] = await tenantPrisma.queryRaw<any[]>(
    schema,
    `
      SELECT
        AVG(unit_cost) as avg_unit_cost,
        SUM(quantity_on_hand * p.unit_cost) as total_inventory_cost
      FROM inventory i
      JOIN products p ON p.id = i.product_id
    `
  )

  const costChange = params.costChangePercent / 100
  const newUnitCost = parseFloat(currentMetrics.avg_unit_cost) * (1 + costChange)
  const costIncrease = newUnitCost - parseFloat(currentMetrics.avg_unit_cost)

  return {
    scenarioType: 'cost',
    baseline: {
      avgUnitCost: parseFloat(currentMetrics.avg_unit_cost),
      totalInventoryCost: parseFloat(currentMetrics.total_inventory_cost)
    },
    projected: {
      avgUnitCost: newUnitCost,
      totalInventoryCost: parseFloat(currentMetrics.total_inventory_cost) * (1 + costChange)
    },
    impact: {
      costChangePercent: params.costChangePercent,
      costIncreasePerUnit: costIncrease,
      marginImpact: -(costChange * 100) // Simplified margin impact
    },
    assumptions: {
      costChangePercent: params.costChangePercent,
      costCategory: params.costCategory || 'all',
      timeHorizonDays: params.timeHorizonDays
    }
  }
}

/**
 * Run inventory scenario analysis
 */
async function runInventoryScenario(schema: string, params: any): Promise<any> {
  // Get current inventory levels
  const [currentMetrics] = await tenantPrisma.queryRaw<any[]>(
    schema,
    `
      SELECT
        SUM(quantity_on_hand) as total_units,
        SUM(quantity_on_hand * p.unit_cost) as total_value
      FROM inventory i
      JOIN products p ON p.id = i.product_id
    `
  )

  const targetInventory = params.targetInventoryDays
  const safetyStockPercent = params.safetyStockPercent || 20

  // Calculate required inventory levels
  const dailyDemand = 100 // Placeholder - calculate from sales
  const requiredInventory = dailyDemand * targetInventory * (1 + safetyStockPercent / 100)

  return {
    scenarioType: 'inventory',
    baseline: {
      totalUnits: parseInt(currentMetrics.total_units),
      totalValue: parseFloat(currentMetrics.total_value)
    },
    projected: {
      targetDays: targetInventory,
      requiredUnits: Math.round(requiredInventory),
      safetyStock: Math.round(requiredInventory * safetyStockPercent / 100)
    },
    impact: {
      inventoryChange: Math.round(requiredInventory - parseInt(currentMetrics.total_units)),
      cashImpact: 'TBD' // Calculate based on unit costs
    },
    assumptions: {
      targetInventoryDays: targetInventory,
      safetyStockPercent,
      timeHorizonDays: params.timeHorizonDays
    }
  }
}

/**
 * Run mixed scenario analysis (combines multiple factors)
 */
async function runMixedScenario(schema: string, params: any): Promise<any> {
  // Run individual scenarios and combine results
  const pricingResults = params.priceChangePercent
    ? await runPricingScenario(schema, params)
    : null

  const demandResults = params.demandChangePercent
    ? await runDemandScenario(schema, params)
    : null

  const costResults = params.costChangePercent
    ? await runCostScenario(schema, params)
    : null

  return {
    scenarioType: 'mixed',
    components: {
      pricing: pricingResults,
      demand: demandResults,
      cost: costResults
    },
    combinedImpact: {
      message: 'Mixed scenario combines multiple factors. Review individual components for detailed impact.'
    }
  }
}

export default router
