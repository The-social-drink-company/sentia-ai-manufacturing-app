/**
 * Master Admin API Routes
 *
 * Comprehensive admin API for:
 * - Tenant management (CRUD, suspend, reactivate, delete)
 * - System metrics (overview, revenue, health)
 * - User impersonation
 *
 * All routes protected by master admin middleware.
 *
 * @module server/routes/master-admin.routes
 */

import express, { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { masterAdminMiddleware } from '../middleware/master-admin.middleware.js'

const router: Router = express.Router()
const prisma = new PrismaClient()

// All routes require master admin authentication
router.use(masterAdminMiddleware)

// ============================================
// TENANT MANAGEMENT
// ============================================

/**
 * GET /api/master-admin/tenants
 * List all tenants with pagination and filtering
 */
router.get('/tenants', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '50',
      status,
      tier,
      search
    } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    // Build where clause
    const where: any = {
      deletedAt: null // Exclude soft-deleted tenants by default
    }

    if (status) {
      where.subscriptionStatus = status
    }

    if (tier) {
      where.subscriptionTier = tier
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
          _count: {
            select: { users: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tenant.count({ where })
    ])

    res.json({
      success: true,
      data: tenants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenants',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/master-admin/tenants/:id
 * Get detailed information about a specific tenant
 */
router.get('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            lastLoginAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          take: 50,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      })
    }

    // Get tenant-specific metrics from tenant schema
    let metrics: any = {
      product_count: 0,
      sales_count: 0,
      forecast_count: 0
    }

    try {
      const result = await prisma.$queryRawUnsafe(
        `SELECT
          (SELECT COUNT(*) FROM "${tenant.schemaName}".products) as product_count,
          (SELECT COUNT(*) FROM "${tenant.schemaName}".sales) as sales_count,
          (SELECT COUNT(*) FROM "${tenant.schemaName}".forecasts) as forecast_count`
      ) as any[]

      if (result && result.length > 0) {
        metrics = result[0]
      }
    } catch (error) {
      console.warn(`Could not fetch metrics for tenant ${tenant.schemaName}:`, error)
      // Continue without metrics rather than failing
    }

    res.json({
      success: true,
      data: {
        ...tenant,
        metrics
      }
    })
  } catch (error) {
    console.error('Error fetching tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/master-admin/tenants
 * Create a new tenant (manual onboarding)
 */
router.post('/tenants', async (req, res) => {
  try {
    const {
      name,
      slug,
      clerkOrganizationId,
      subscriptionTier = 'professional',
      ownerEmail
    } = req.body

    // Validate required fields
    if (!name || !slug || !ownerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'name, slug, and ownerEmail are required'
      })
    }

    // Check if slug is already taken
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        error: 'Slug already taken',
        message: `Tenant with slug "${slug}" already exists`
      })
    }

    // Generate schema name
    const schemaName = `tenant_${slug.replace(/-/g, '_')}_${Date.now()}`

    // Get tier configuration
    const tierConfig = getTierConfiguration(subscriptionTier)

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        clerkOrganizationId: clerkOrganizationId || `org_manual_${Date.now()}`,
        schemaName,
        subscriptionTier,
        subscriptionStatus: 'active',
        features: tierConfig.features,
        maxUsers: tierConfig.maxUsers,
        maxEntities: tierConfig.maxEntities
      }
    })

    // Create tenant schema
    await prisma.$executeRawUnsafe(`SELECT create_tenant_schema($1::UUID)`, tenant.id)

    // Log admin action
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'tenant.created_by_admin',
        resourceType: 'tenant',
        resourceId: tenant.id,
        metadata: {
          adminEmail: req.masterAdmin!.email,
          ownerEmail
        }
      }
    })

    res.status(201).json({
      success: true,
      data: tenant
    })
  } catch (error) {
    console.error('Error creating tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * PATCH /api/master-admin/tenants/:id
 * Update tenant configuration
 */
router.patch('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      subscriptionTier,
      subscriptionStatus,
      features,
      maxUsers,
      maxEntities
    } = req.body

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(subscriptionTier && { subscriptionTier }),
        ...(subscriptionStatus && { subscriptionStatus }),
        ...(features && { features }),
        ...(maxUsers !== undefined && { maxUsers }),
        ...(maxEntities !== undefined && { maxEntities }),
        updatedAt: new Date()
      }
    })

    // Log admin action
    await prisma.auditLog.create({
      data: {
        tenantId: id,
        action: 'tenant.updated_by_admin',
        resourceType: 'tenant',
        resourceId: id,
        metadata: {
          adminEmail: req.masterAdmin!.email,
          changes: req.body
        }
      }
    })

    res.json({
      success: true,
      data: tenant
    })
  } catch (error) {
    console.error('Error updating tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/master-admin/tenants/:id/suspend
 * Suspend a tenant (subscription remains but access denied)
 */
router.post('/tenants/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        subscriptionStatus: 'suspended',
        updatedAt: new Date()
      }
    })

    // Log admin action
    await prisma.auditLog.create({
      data: {
        tenantId: id,
        action: 'tenant.suspended',
        resourceType: 'tenant',
        resourceId: id,
        metadata: {
          adminEmail: req.masterAdmin!.email,
          reason: reason || 'No reason provided'
        }
      }
    })

    // TODO: Send notification email to tenant owner

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant suspended successfully'
    })
  } catch (error) {
    console.error('Error suspending tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to suspend tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/master-admin/tenants/:id/reactivate
 * Reactivate a suspended tenant
 */
router.post('/tenants/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        subscriptionStatus: 'active',
        updatedAt: new Date()
      }
    })

    // Log admin action
    await prisma.auditLog.create({
      data: {
        tenantId: id,
        action: 'tenant.reactivated',
        resourceType: 'tenant',
        resourceId: id,
        metadata: {
          adminEmail: req.masterAdmin!.email
        }
      }
    })

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant reactivated successfully'
    })
  } catch (error) {
    console.error('Error reactivating tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * DELETE /api/master-admin/tenants/:id
 * Soft delete a tenant (requires confirmation)
 */
router.delete('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { confirm } = req.body

    if (confirm !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required',
        message: 'Please send { "confirm": "DELETE" } in request body to confirm deletion'
      })
    }

    // Soft delete
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        subscriptionStatus: 'cancelled'
      }
    })

    // Log admin action
    await prisma.auditLog.create({
      data: {
        tenantId: id,
        action: 'tenant.deleted',
        resourceType: 'tenant',
        resourceId: id,
        metadata: {
          adminEmail: req.masterAdmin!.email
        }
      }
    })

    res.json({
      success: true,
      message: 'Tenant deleted successfully',
      data: tenant
    })
  } catch (error) {
    console.error('Error deleting tenant:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ============================================
// SYSTEM METRICS
// ============================================

/**
 * GET /api/master-admin/metrics/overview
 * System overview metrics (tenants, users, revenue, churn)
 */
router.get('/metrics/overview', async (req, res) => {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalUsers,
      newTenantsThisMonth,
      churnedTenantsThisMonth
    ] = await Promise.all([
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.tenant.count({ where: { subscriptionStatus: 'active', deletedAt: null } }),
      prisma.tenant.count({ where: { subscriptionStatus: 'trial', deletedAt: null } }),
      prisma.tenant.count({ where: { subscriptionStatus: 'suspended', deletedAt: null } }),
      prisma.user.count(),
      prisma.tenant.count({
        where: {
          createdAt: { gte: firstDayOfMonth },
          deletedAt: null
        }
      }),
      prisma.tenant.count({
        where: {
          subscriptionStatus: 'cancelled',
          updatedAt: { gte: firstDayOfMonth }
        }
      })
    ])

    // Calculate MRR (simplified - would come from Stripe in production)
    // For now, calculate based on subscription tiers
    const activeTenantsByTier = await prisma.tenant.groupBy({
      by: ['subscriptionTier'],
      where: {
        subscriptionStatus: 'active',
        deletedAt: null
      },
      _count: true
    })

    const tierPricing: Record<string, number> = {
      starter: 149,
      professional: 295,
      enterprise: 595
    }

    let mrr = 0
    activeTenantsByTier.forEach((group) => {
      const price = tierPricing[group.subscriptionTier] || 0
      mrr += price * group._count
    })

    const arr = mrr * 12
    const churnRate = totalTenants > 0 ? (churnedTenantsThisMonth / totalTenants) * 100 : 0

    res.json({
      success: true,
      data: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          trial: trialTenants,
          suspended: suspendedTenants,
          newThisMonth: newTenantsThisMonth,
          churnedThisMonth: churnedTenantsThisMonth
        },
        users: {
          total: totalUsers
        },
        revenue: {
          mrr,
          arr,
          currency: 'USD'
        },
        churnRate: Number(churnRate.toFixed(2))
      }
    })
  } catch (error) {
    console.error('Error fetching overview metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/master-admin/metrics/revenue
 * Revenue metrics (by tier, trend over time)
 */
router.get('/metrics/revenue', async (req, res) => {
  try {
    const { period = 'month' } = req.query

    // Revenue by tier
    const revenueByTier = await prisma.tenant.groupBy({
      by: ['subscriptionTier'],
      where: {
        subscriptionStatus: 'active',
        deletedAt: null
      },
      _count: true
    })

    const tierPricing: Record<string, number> = {
      starter: 149,
      professional: 295,
      enterprise: 595
    }

    const revenueData = revenueByTier.map((group) => ({
      tier: group.subscriptionTier,
      count: group._count,
      mrr: (tierPricing[group.subscriptionTier] || 0) * group._count
    }))

    // Revenue trend (last 12 months)
    const revenueTrend = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_subscriptions,
        subscription_tier as tier
      FROM tenants
      WHERE created_at >= NOW() - INTERVAL '12 months'
        AND deleted_at IS NULL
      GROUP BY month, tier
      ORDER BY month DESC
    `

    res.json({
      success: true,
      data: {
        byTier: revenueData,
        trend: revenueTrend
      }
    })
  } catch (error) {
    console.error('Error fetching revenue metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/master-admin/metrics/system-health
 * System health metrics (database, errors, uptime)
 */
router.get('/metrics/system-health', async (req, res) => {
  try {
    // Test database connection
    let dbStatus = 'unhealthy'
    try {
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'healthy'
    } catch (error) {
      console.error('Database health check failed:', error)
    }

    // Get error count from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentErrors = await prisma.auditLog.count({
      where: {
        action: { contains: 'error' },
        createdAt: { gte: oneHourAgo }
      }
    })

    // Get error count from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const dailyErrors = await prisma.auditLog.count({
      where: {
        action: { contains: 'error' },
        createdAt: { gte: oneDayAgo }
      }
    })

    res.json({
      success: true,
      data: {
        database: {
          status: dbStatus,
          connectionPool: 'healthy' // TODO: Get actual pool stats from Prisma
        },
        errors: {
          lastHour: recentErrors,
          last24Hours: dailyErrors
        },
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching system health:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ============================================
// USER IMPERSONATION
// ============================================

/**
 * POST /api/master-admin/impersonate/:userId
 * Generate short-lived impersonation token for support
 */
router.post('/impersonate/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured')
      return res.status(500).json({
        success: false,
        error: 'Impersonation not configured',
        message: 'JWT_SECRET environment variable is not set'
      })
    }

    // Generate impersonation token (1 hour expiration)
    const impersonationToken = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        impersonatedBy: req.masterAdmin!.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
      },
      jwtSecret
    )

    // Log impersonation action
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'user.impersonated',
        resourceType: 'user',
        resourceId: user.id,
        metadata: {
          adminEmail: req.masterAdmin!.email
        }
      }
    })

    res.json({
      success: true,
      data: {
        impersonationToken,
        user: {
          id: user.id,
          email: user.email,
          tenant: {
            id: user.tenant.id,
            slug: user.tenant.slug,
            name: user.tenant.name
          }
        },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating impersonation token:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate impersonation token',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get tier configuration (limits and features)
 */
function getTierConfiguration(tier: string): {
  maxUsers: number
  maxEntities: number
  features: any
} {
  const configs: Record<
    string,
    { maxUsers: number; maxEntities: number; features: any }
  > = {
    starter: {
      maxUsers: 5,
      maxEntities: 500,
      features: {
        cashFlowForecasting: true,
        workingCapitalAnalytics: true,
        inventoryOptimization: false,
        whatIfScenarios: false,
        aiForecasting: false,
        realTimeDashboards: true,
        alerts: true,
        multiEntity: false,
        apiAccess: false
      }
    },
    professional: {
      maxUsers: 25,
      maxEntities: 5000,
      features: {
        cashFlowForecasting: true,
        workingCapitalAnalytics: true,
        inventoryOptimization: true,
        whatIfScenarios: true,
        aiForecasting: true,
        realTimeDashboards: true,
        alerts: true,
        multiEntity: true,
        apiAccess: false
      }
    },
    enterprise: {
      maxUsers: 100,
      maxEntities: -1, // Unlimited
      features: {
        cashFlowForecasting: true,
        workingCapitalAnalytics: true,
        inventoryOptimization: true,
        whatIfScenarios: true,
        aiForecasting: true,
        realTimeDashboards: true,
        alerts: true,
        multiEntity: true,
        apiAccess: true
      }
    }
  }

  return configs[tier] || configs.professional
}

export default router
