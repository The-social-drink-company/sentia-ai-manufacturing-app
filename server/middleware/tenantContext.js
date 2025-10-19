/**
 * Tenant Context Middleware for CapLiquify Multi-Tenant System
 *
 * Provides middleware functions to:
 * - Extract tenant from Clerk organization
 * - Set PostgreSQL search_path to tenant schema
 * - Enforce subscription tier limits
 * - Verify feature access
 *
 * @module server/middleware/tenantContext
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Tenant Context Middleware
 *
 * Extracts tenant from Clerk organization and sets database schema context.
 * Attaches tenant object and schema name to req object for downstream handlers.
 *
 * @middleware
 * @param {Request} req - Express request object (expects req.auth.orgId from Clerk)
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @example
 * // Apply to all routes in a router
 * router.use(tenantContext)
 *
 * @example
 * // Apply to specific route
 * router.get('/products', tenantContext, async (req, res) => {
 *   const { tenant, tenantSchema } = req
 *   // Query tenant-specific data
 * })
 */
export async function tenantContext(req, res, next) {
  try {
    // Extract organization ID from Clerk auth
    const clerkOrgId = req.auth?.orgId

    if (!clerkOrgId) {
      return res.status(400).json({
        error: 'no_organization_context',
        message: 'User must be part of an organization to access this resource',
        details: 'Please select or create an organization to continue'
      })
    }

    // Lookup tenant by Clerk organization ID
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrganizationId: clerkOrgId },
      include: {
        subscription: true,
        users: {
          where: { clerkUserId: req.auth?.userId },
          select: { role: true }
        }
      }
    })

    if (!tenant) {
      return res.status(404).json({
        error: 'tenant_not_found',
        message: 'No tenant exists for this organization',
        details: 'Please contact support to set up your account',
        clerkOrgId
      })
    }

    // Check if tenant is soft-deleted
    if (tenant.deletedAt) {
      return res.status(410).json({
        error: 'tenant_deleted',
        message: 'This organization has been deleted',
        details: 'Please contact support if you believe this is an error',
        deletedAt: tenant.deletedAt
      })
    }

    // Check subscription status
    if (tenant.subscriptionStatus === 'suspended') {
      return res.status(403).json({
        error: 'account_suspended',
        message: 'Your account has been suspended',
        details: 'Please contact support to resolve billing issues',
        subscriptionStatus: tenant.subscriptionStatus
      })
    }

    if (tenant.subscriptionStatus === 'cancelled') {
      return res.status(403).json({
        error: 'account_cancelled',
        message: 'Your subscription has been cancelled',
        details: 'Please reactivate your subscription to continue using CapLiquify',
        subscriptionStatus: tenant.subscriptionStatus
      })
    }

    // Check if trial expired
    if (tenant.subscriptionStatus === 'trial' && tenant.trialEndsAt && tenant.trialEndsAt < new Date()) {
      return res.status(403).json({
        error: 'trial_expired',
        message: 'Your free trial has ended',
        details: 'Please subscribe to continue using CapLiquify',
        trialEndedAt: tenant.trialEndsAt,
        subscriptionTier: tenant.subscriptionTier,
        upgradeUrl: '/billing/upgrade'
      })
    }

    // Check if past due
    if (tenant.subscriptionStatus === 'past_due') {
      // Allow read-only access for past_due accounts
      req.readOnly = true
    }

    // Attach tenant info to request
    req.tenant = tenant
    req.tenantSchema = tenant.schemaName
    req.userRole = tenant.users[0]?.role || 'viewer'
    req.subscriptionTier = tenant.subscriptionTier

    // Set PostgreSQL search path for this request
    // This ensures all queries default to the tenant's schema
    await prisma.$executeRawUnsafe(`SET search_path TO "${tenant.schemaName}", public`)

    next()
  } catch (error) {
    console.error('[tenantContext] Error resolving tenant:', error)
    res.status(500).json({
      error: 'tenant_resolution_failed',
      message: 'Unable to determine tenant context',
      details: 'Please try again or contact support if the issue persists'
    })
  }
}

/**
 * Tenant Feature Guard
 *
 * Middleware to check if tenant's subscription tier includes a specific feature.
 * Returns 403 if feature is not available for the tenant's current plan.
 *
 * @param {string} featureName - Name of the feature to check (e.g., 'ai_forecasting', 'what_if')
 * @returns {Function} Express middleware function
 *
 * @example
 * // Require AI forecasting feature
 * router.post('/forecasts',
 *   tenantContext,
 *   requireFeature('ai_forecasting'),
 *   async (req, res) => {
 *     // Only accessible to Professional/Enterprise tiers
 *   }
 * )
 */
export function requireFeature(featureName) {
  return (req, res, next) => {
    const { tenant } = req

    if (!tenant) {
      return res.status(500).json({
        error: 'middleware_order_error',
        message: 'tenantContext middleware must be applied before requireFeature',
        details: 'Please check your route configuration'
      })
    }

    // Check if feature is enabled in tenant's feature flags
    const hasFeature = tenant.features?.[featureName] === true

    if (!hasFeature) {
      // Determine which tier includes this feature
      const featureTiers = {
        ai_forecasting: 'Professional or Enterprise',
        what_if: 'Professional or Enterprise',
        advanced_reports: 'Enterprise',
        api_integrations: 'All tiers',
        custom_integrations: 'Enterprise'
      }

      return res.status(403).json({
        error: 'feature_not_available',
        message: `Your subscription plan does not include ${featureName.replace(/_/g, ' ')}`,
        details: `This feature is available on ${featureTiers[featureName] || 'higher'} plans`,
        featureName,
        currentTier: tenant.subscriptionTier,
        upgradeUrl: '/billing/upgrade'
      })
    }

    next()
  }
}

/**
 * Tenant Entity Limit Guard
 *
 * Middleware to check if tenant has reached their entity limit.
 * Prevents creation of new entities if limit is reached.
 *
 * @param {string} entityType - Type of entity (e.g., 'products', 'users', 'companies')
 * @param {Function} countQuery - Async function that returns current entity count for tenant
 * @returns {Function} Express middleware function
 *
 * @example
 * // Check product limit before creating new product
 * router.post('/products',
 *   tenantContext,
 *   checkEntityLimit('products', async (schema) => {
 *     const [result] = await prisma.$queryRawUnsafe(
 *       `SELECT COUNT(*) as count FROM "${schema}".products`
 *     )
 *     return parseInt(result.count)
 *   }),
 *   async (req, res) => {
 *     // Create product
 *   }
 * )
 */
export function checkEntityLimit(entityType, countQuery) {
  return async (req, res, next) => {
    const { tenant, tenantSchema } = req

    if (!tenant) {
      return res.status(500).json({
        error: 'middleware_order_error',
        message: 'tenantContext middleware must be applied before checkEntityLimit',
        details: 'Please check your route configuration'
      })
    }

    try {
      // Execute count query in tenant schema
      const currentCount = await countQuery(tenantSchema)
      const limit = tenant.maxEntities || Infinity

      if (currentCount >= limit) {
        return res.status(403).json({
          error: 'entity_limit_reached',
          message: `You have reached your ${entityType} limit`,
          details: `Your ${tenant.subscriptionTier} plan allows up to ${limit} ${entityType}. Please upgrade to add more.`,
          entityType,
          currentCount,
          limit,
          subscriptionTier: tenant.subscriptionTier,
          upgradeUrl: '/billing/upgrade'
        })
      }

      // Attach count to request for potential use in handler
      req.entityCount = currentCount
      next()
    } catch (error) {
      console.error(`[checkEntityLimit] Error checking ${entityType} limit:`, error)
      next(error)
    }
  }
}

/**
 * Tenant User Limit Guard
 *
 * Middleware to check if tenant has reached their user limit.
 * Prevents inviting new users if limit is reached.
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Check user limit before sending invitation
 * router.post('/users/invite',
 *   tenantContext,
 *   checkUserLimit,
 *   async (req, res) => {
 *     // Send user invitation
 *   }
 * )
 */
export async function checkUserLimit(req, res, next) {
  const { tenant } = req

  if (!tenant) {
    return res.status(500).json({
      error: 'middleware_order_error',
      message: 'tenantContext middleware must be applied before checkUserLimit'
    })
  }

  try {
    // Count users in tenant
    const userCount = await prisma.user.count({
      where: { tenantId: tenant.id }
    })

    const limit = tenant.maxUsers || Infinity

    if (userCount >= limit) {
      return res.status(403).json({
        error: 'user_limit_reached',
        message: `You have reached your user limit`,
        details: `Your ${tenant.subscriptionTier} plan allows up to ${limit} users. Please upgrade to add more team members.`,
        currentCount: userCount,
        limit,
        subscriptionTier: tenant.subscriptionTier,
        upgradeUrl: '/billing/upgrade'
      })
    }

    req.userCount = userCount
    next()
  } catch (error) {
    console.error('[checkUserLimit] Error checking user limit:', error)
    next(error)
  }
}

/**
 * Read-Only Mode Guard
 *
 * Middleware to prevent write operations for tenants in read-only mode.
 * Tenants are read-only when subscription is past_due.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @example
 * // Protect write operations
 * router.post('/products', tenantContext, preventReadOnly, async (req, res) => {
 *   // Create product (blocked if read-only)
 * })
 */
export function preventReadOnly(req, res, next) {
  if (req.readOnly) {
    return res.status(403).json({
      error: 'account_read_only',
      message: 'Your account is in read-only mode',
      details: 'Please update your billing information to regain full access',
      subscriptionStatus: req.tenant?.subscriptionStatus,
      updateUrl: '/billing/payment'
    })
  }
  next()
}

/**
 * Role-Based Access Control (RBAC)
 *
 * Middleware to check if user has required role for the operation.
 * Roles: owner, admin, member, viewer
 *
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @returns {Function} Express middleware function
 *
 * @example
 * // Only owners and admins can delete products
 * router.delete('/products/:id',
 *   tenantContext,
 *   requireRole(['owner', 'admin']),
 *   async (req, res) => {
 *     // Delete product
 *   }
 * )
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    const { userRole, tenant } = req

    if (!tenant) {
      return res.status(500).json({
        error: 'middleware_order_error',
        message: 'tenantContext middleware must be applied before requireRole'
      })
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'You do not have permission to perform this action',
        details: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        userRole,
        requiredRoles: allowedRoles
      })
    }

    next()
  }
}

/**
 * Audit Log Middleware
 *
 * Logs tenant actions to the audit_logs table for compliance and debugging.
 * Should be applied to sensitive operations.
 *
 * @param {string} action - Action name (e.g., 'product.created', 'user.deleted')
 * @param {string} resourceType - Resource type (e.g., 'product', 'user', 'forecast')
 * @returns {Function} Express middleware function
 *
 * @example
 * // Log product creation
 * router.post('/products',
 *   tenantContext,
 *   auditLog('product.created', 'product'),
 *   async (req, res) => {
 *     const product = await createProduct(req.body)
 *     req.auditResourceId = product.id  // Set resource ID for audit log
 *     res.json(product)
 *   }
 * )
 */
export function auditLog(action, resourceType) {
  return async (req, res, next) => {
    const { tenant } = req

    if (!tenant) {
      return next() // Skip if no tenant context
    }

    // Store audit info on response to log after handler completes
    res.on('finish', async () => {
      try {
        await prisma.auditLog.create({
          data: {
            tenantId: tenant.id,
            userId: req.auth?.userId || null,
            action,
            resourceType,
            resourceId: req.auditResourceId?.toString() || null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              body: req.method !== 'GET' ? req.body : undefined
            }
          }
        })
      } catch (error) {
        console.error('[auditLog] Failed to create audit log:', error)
        // Don't fail the request if audit logging fails
      }
    })

    next()
  }
}
