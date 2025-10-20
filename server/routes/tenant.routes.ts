/**
 * Tenant API Routes - Multi-Tenant CRUD Examples
 *
 * BMAD-MULTITENANT-002 Story 9: Example API Routes
 *
 * These routes demonstrate proper usage of multi-tenant middleware:
 * - tenantMiddleware: Identifies tenant from Clerk organization
 * - featureMiddleware: Enforces subscription tier limits
 * - rbacMiddleware: Controls access by user role
 *
 * @module server/routes/tenant.routes
 */

import { Router, Request, Response } from 'express'
import { tenantMiddleware } from '../middleware/tenant.middleware'
import { featureMiddleware } from '../middleware/feature.middleware'
import { rbacMiddleware } from '../middleware/rbac.middleware'
import { tenantService } from '../services/tenant.service'
import { prisma } from '../lib/prisma-tenant'
import { withTenantSchema } from '../lib/prisma-tenant'

const router = Router()

// ================================
// TENANT MANAGEMENT ROUTES
// ================================

/**
 * GET /api/tenants/current
 *
 * Get current tenant metadata
 *
 * Middleware chain:
 * 1. tenantMiddleware - Identifies tenant from Clerk organization
 *
 * Returns:
 * - Tenant metadata (name, slug, subscription tier, limits)
 * - Feature flags
 * - Current usage metrics
 *
 * Example response:
 * {
 *   "id": "abc-123",
 *   "name": "Acme Manufacturing",
 *   "slug": "acme-mfg",
 *   "subscriptionTier": "professional",
 *   "subscriptionStatus": "active",
 *   "maxUsers": 25,
 *   "maxEntities": 5000,
 *   "features": { "ai_forecasting": true, ... },
 *   "usage": { "users": 12, "entities": 450 }
 * }
 */
router.get('/current', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { tenant } = req

    if (!tenant) {
      return res.status(400).json({ error: 'No tenant context' })
    }

    // Get usage metrics (count users, entities)
    const [userCount, entityCount] = await Promise.all([
      prisma.user.count({ where: { tenantId: tenant.id } }),
      withTenantSchema(tenant.schemaName, async () => {
        return await prisma.product.count()
      })
    ])

    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subscriptionTier: tenant.subscriptionTier,
      subscriptionStatus: tenant.subscriptionStatus,
      maxUsers: tenant.maxUsers,
      maxEntities: tenant.maxEntities,
      features: tenant.features,
      trialEndsAt: tenant.trialEndsAt,
      usage: {
        users: userCount,
        entities: entityCount,
        usersPercentage: tenant.maxUsers ? Math.round((userCount / tenant.maxUsers) * 100) : 0,
        entitiesPercentage: tenant.maxEntities ? Math.round((entityCount / tenant.maxEntities) * 100) : 0
      }
    })
  } catch (error: any) {
    console.error('[TenantRoutes] Error fetching tenant:', error)
    res.status(500).json({ error: 'Failed to fetch tenant metadata' })
  }
})

/**
 * PATCH /api/tenants/current
 *
 * Update current tenant metadata
 *
 * Middleware chain:
 * 1. tenantMiddleware - Identifies tenant
 * 2. rbacMiddleware(['owner', 'admin']) - Only owners/admins can update
 *
 * Body: { name?, subscriptionTier?, features? }
 *
 * Example request:
 * PATCH /api/tenants/current
 * { "name": "Acme Manufacturing Ltd" }
 */
router.patch(
  '/current',
  tenantMiddleware,
  rbacMiddleware(['owner', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { tenant } = req
      const { name, features } = req.body

      if (!tenant) {
        return res.status(400).json({ error: 'No tenant context' })
      }

      const updated = await tenantService.updateTenant(tenant.id, { name, features })

      res.json(updated)
    } catch (error: any) {
      console.error('[TenantRoutes] Error updating tenant:', error)
      res.status(500).json({ error: 'Failed to update tenant' })
    }
  }
)

// ================================
// PRODUCTS API (TENANT-SCOPED)
// ================================

/**
 * GET /api/tenants/products
 *
 * Get products for current tenant
 *
 * Middleware chain:
 * 1. tenantMiddleware - Sets search_path to tenant schema
 *
 * Query params:
 * - category: Filter by category
 * - active: Filter by active status (default: true)
 * - limit: Max results (default: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Example: GET /api/tenants/products?category=Electronics&limit=50
 */
router.get('/products', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { tenant, tenantSchema } = req
    const { category, active = 'true', limit = '100', offset = '0' } = req.query

    if (!tenant || !tenantSchema) {
      return res.status(400).json({ error: 'No tenant context' })
    }

    // Execute query in tenant schema
    const products = await withTenantSchema(tenantSchema, async () => {
      return await prisma.product.findMany({
        where: {
          ...(category && { category: category as string }),
          ...(active === 'true' && { isActive: true })
        },
        take: Math.min(parseInt(limit as string), 1000),
        skip: parseInt(offset as string),
        orderBy: { name: 'asc' }
      })
    })

    res.json({
      data: products,
      meta: {
        count: products.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error: any) {
    console.error('[TenantRoutes] Error fetching products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

/**
 * POST /api/tenants/products
 *
 * Create a new product (tenant-scoped)
 *
 * Middleware chain:
 * 1. tenantMiddleware - Sets tenant context
 * 2. rbacMiddleware(['owner', 'admin', 'member']) - Read-only users cannot create
 * 3. featureMiddleware('basic_forecasting') - Requires at least basic plan
 *
 * Body: { sku, name, category, unitCost, unitPrice, ... }
 */
router.post(
  '/products',
  tenantMiddleware,
  rbacMiddleware(['owner', 'admin', 'member']),
  featureMiddleware('basic_forecasting'),
  async (req: Request, res: Response) => {
    try {
      const { tenant, tenantSchema } = req
      const productData = req.body

      if (!tenant || !tenantSchema) {
        return res.status(400).json({ error: 'No tenant context' })
      }

      // Check entity limit
      const productCount = await withTenantSchema(tenantSchema, async () => {
        return await prisma.product.count()
      })

      if (tenant.maxEntities && productCount >= tenant.maxEntities) {
        return res.status(403).json({
          error: 'Entity limit exceeded',
          message: `Your ${tenant.subscriptionTier} plan allows up to ${tenant.maxEntities} products. Please upgrade to add more.`,
          limit: tenant.maxEntities,
          current: productCount
        })
      }

      // Create product in tenant schema
      const product = await withTenantSchema(tenantSchema, async () => {
        return await prisma.product.create({
          data: {
            ...productData,
            companyId: req.body.companyId || (await getDefaultCompanyId(tenantSchema))
          }
        })
      })

      res.status(201).json(product)
    } catch (error: any) {
      console.error('[TenantRoutes] Error creating product:', error)
      res.status(500).json({ error: 'Failed to create product' })
    }
  }
)

/**
 * GET /api/tenants/products/:id
 *
 * Get single product by ID (tenant-scoped)
 */
router.get('/products/:id', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const { tenant, tenantSchema } = req
    const { id } = req.params

    if (!tenant || !tenantSchema) {
      return res.status(400).json({ error: 'No tenant context' })
    }

    const product = await withTenantSchema(tenantSchema, async () => {
      return await prisma.product.findUnique({
        where: { id }
      })
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(product)
  } catch (error: any) {
    console.error('[TenantRoutes] Error fetching product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

/**
 * DELETE /api/tenants/products/:id
 *
 * Delete a product (tenant-scoped)
 *
 * Middleware chain:
 * - tenantMiddleware
 * - rbacMiddleware(['owner', 'admin']) - Only owners/admins can delete
 */
router.delete(
  '/products/:id',
  tenantMiddleware,
  rbacMiddleware(['owner', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { tenant, tenantSchema } = req
      const { id } = req.params

      if (!tenant || !tenantSchema) {
        return res.status(400).json({ error: 'No tenant context' })
      }

      await withTenantSchema(tenantSchema, async () => {
        return await prisma.product.delete({
          where: { id }
        })
      })

      res.status(204).send()
    } catch (error: any) {
      console.error('[TenantRoutes] Error deleting product:', error)
      res.status(500).json({ error: 'Failed to delete product' })
    }
  }
)

// ================================
// AI FORECASTING (FEATURE-GATED)
// ================================

/**
 * POST /api/tenants/forecasts
 *
 * Generate AI forecast (feature-gated)
 *
 * Middleware chain:
 * 1. tenantMiddleware - Sets tenant context
 * 2. featureMiddleware('ai_forecasting') - Requires Professional/Enterprise tier
 *
 * Body: { productId, forecastType, horizon }
 *
 * This route demonstrates feature gating:
 * - Starter tier users get 403 Forbidden
 * - Professional/Enterprise users can access
 */
router.post(
  '/forecasts',
  tenantMiddleware,
  featureMiddleware('ai_forecasting'),
  async (req: Request, res: Response) => {
    try {
      const { tenant, tenantSchema } = req
      const { productId, forecastType, horizon } = req.body

      if (!tenant || !tenantSchema) {
        return res.status(400).json({ error: 'No tenant context' })
      }

      // Generate AI forecast (placeholder logic)
      const forecast = await withTenantSchema(tenantSchema, async () => {
        return await prisma.forecast.create({
          data: {
            companyId: await getDefaultCompanyId(tenantSchema),
            productId,
            forecastDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
            forecastType,
            predictedQuantity: Math.floor(Math.random() * 1000), // Placeholder
            confidenceScore: Math.random() * 100,
            modelVersion: 'v1.0.0'
          }
        })
      })

      res.status(201).json({
        ...forecast,
        message: '✅ AI forecasting is enabled for your Professional plan'
      })
    } catch (error: any) {
      console.error('[TenantRoutes] Error generating forecast:', error)
      res.status(500).json({ error: 'Failed to generate forecast' })
    }
  }
)

// ================================
// ADMIN ROUTES (ROLE-GATED)
// ================================

/**
 * GET /api/tenants/users
 *
 * List users in current tenant (owners/admins only)
 *
 * Middleware chain:
 * - tenantMiddleware
 * - rbacMiddleware(['owner', 'admin']) - Only owners/admins can view users
 */
router.get(
  '/users',
  tenantMiddleware,
  rbacMiddleware(['owner', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { tenant } = req

      if (!tenant) {
        return res.status(400).json({ error: 'No tenant context' })
      }

      const users = await prisma.user.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          clerkUserId: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      })

      res.json({
        data: users,
        meta: {
          count: users.length,
          limit: tenant.maxUsers
        }
      })
    } catch (error: any) {
      console.error('[TenantRoutes] Error fetching users:', error)
      res.status(500).json({ error: 'Failed to fetch users' })
    }
  }
)

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Get default company ID for tenant (helper)
 */
async function getDefaultCompanyId(tenantSchema: string): Promise<string> {
  const result = await withTenantSchema(tenantSchema, async () => {
    const company = await prisma.company.findFirst({
      where: { isActive: true },
      select: { id: true }
    })
    return company?.id
  })

  if (!result) {
    throw new Error('No active company found in tenant schema')
  }

  return result
}

export default router
