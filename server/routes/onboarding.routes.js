/**
 * Onboarding API Routes for CapLiquify Multi-Tenant System
 *
 * Handles tenant creation and onboarding flow:
 * - POST /api/onboarding/create-tenant - Create new tenant after Clerk organization signup
 * - POST /api/onboarding/join-tenant - Join existing tenant via invitation
 * - GET /api/onboarding/check-slug/:slug - Check slug availability
 *
 * @module server/routes/onboarding.routes
 */

import express from 'express'
import { z } from 'zod'
import { trialProvisioningService } from '../services/TrialProvisioningService.js'
import { isUserMemberOfOrganization } from '../../src/lib/clerk.js'
import rateLimit from 'express-rate-limit'

const router = express.Router()

// ==================== VALIDATION SCHEMAS ====================

/**
 * Zod schema for tenant creation
 */
const createTenantSchema = z.object({
  clerkOrganizationId: z.string().min(1, 'Clerk organization ID is required'),
  clerkUserId: z.string().min(1, 'Clerk user ID is required'),
  organizationName: z.string().min(1, 'Organization name is required').max(255),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
  subscriptionTier: z.enum(['starter', 'professional', 'enterprise']).default('professional')
})

/**
 * Zod schema for joining tenant
 */
const joinTenantSchema = z.object({
  clerkOrganizationId: z.string().min(1, 'Clerk organization ID is required'),
  clerkUserId: z.string().min(1, 'Clerk user ID is required'),
  invitationToken: z.string().uuid('Invalid invitation token format').optional(),
  role: z.enum(['admin', 'member', 'viewer']).default('member')
})

// ==================== RATE LIMITING ====================

/**
 * Rate limiter for onboarding endpoints
 * Prevents abuse by limiting requests per IP address
 */
const onboardingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.ONBOARDING_RATE_LIMIT || '10', 10), // 10 requests per minute
  message: {
    success: false,
    error: 'Too many onboarding requests. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
})

// Apply rate limiter to all onboarding routes
router.use(onboardingLimiter)

// ==================== MIDDLEWARE ====================

/**
 * Validation middleware
 * Validates request body against Zod schema
 */
function validateRequest(schema) {
  return (req, res, next) => {
    try {
      req.validatedData = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        })
      }
      next(error)
    }
  }
}

/**
 * Error handler middleware for onboarding routes
 */
function handleOnboardingError(error, req, res, next) {
  console.error('[Onboarding API] Error:', error)

  // Handle specific error types
  if (error.message.includes('already taken')) {
    return res.status(409).json({
      success: false,
      error: 'Slug already taken',
      message: error.message
    })
  }

  if (error.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
      message: error.message
    })
  }

  if (error.message.includes('Invalid')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request',
      message: error.message
    })
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during onboarding'
  })
}

// ==================== ROUTES ====================

/**
 * POST /api/onboarding/create-tenant
 *
 * Creates a new tenant after Clerk organization signup.
 * Provisions tenant schema, creates owner user, starts 14-day trial.
 *
 * @body {Object} tenantData - Tenant creation data
 * @body {string} tenantData.clerkOrganizationId - Clerk organization ID
 * @body {string} tenantData.clerkUserId - Clerk user ID (becomes owner)
 * @body {string} tenantData.organizationName - Organization display name
 * @body {string} tenantData.slug - Unique URL-safe slug
 * @body {string} [tenantData.subscriptionTier='professional'] - Subscription tier
 *
 * @returns {Object} 201 - Tenant created successfully
 * @returns {Object} 400 - Validation error
 * @returns {Object} 409 - Slug already taken
 * @returns {Object} 429 - Rate limit exceeded
 * @returns {Object} 500 - Server error
 *
 * @example
 * POST /api/onboarding/create-tenant
 * {
 *   "clerkOrganizationId": "org_abc123",
 *   "clerkUserId": "user_xyz789",
 *   "organizationName": "Acme Manufacturing",
 *   "slug": "acme-manufacturing",
 *   "subscriptionTier": "professional"
 * }
 *
 * Response 201:
 * {
 *   "success": true,
 *   "tenant": {
 *     "id": "123e4567-e89b-12d3-a456-426614174000",
 *     "slug": "acme-manufacturing",
 *     "name": "Acme Manufacturing",
 *     "subscriptionTier": "professional",
 *     "subscriptionStatus": "trial",
 *     "trialEndsAt": "2025-11-06T00:00:00Z",
 *     "maxUsers": 25,
 *     "maxEntities": 5000
 *   },
 *   "user": {
 *     "id": "user-uuid",
 *     "email": "john@acme.com",
 *     "role": "owner"
 *   },
 *   "message": "Trial tenant provisioned successfully..."
 * }
 */
router.post(
  '/create-tenant',
  validateRequest(createTenantSchema),
  async (req, res, next) => {
    try {
      const {
        clerkOrganizationId,
        clerkUserId,
        organizationName,
        slug,
        subscriptionTier
      } = req.validatedData

      console.log(`[Onboarding API] Creating tenant for organization: ${organizationName}`)

      // Verify user is member of the Clerk organization
      const isMember = await isUserMemberOfOrganization(clerkUserId, clerkOrganizationId)
      if (!isMember) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'User is not a member of the specified organization'
        })
      }

      // Provision tenant with trial defaults
      const result = await trialProvisioningService.provisionTenant({
        clerkOrganizationId,
        clerkUserId,
        organizationName,
        slug,
        subscriptionTier,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      })

      // Return appropriate status code
      const statusCode = result.alreadyExists ? 200 : 201

      res.status(statusCode).json({
        success: true,
        tenant: {
          id: result.tenant.id,
          slug: result.tenant.slug,
          name: result.tenant.name,
          subscriptionTier: result.tenant.subscriptionTier,
          subscriptionStatus: result.tenant.subscriptionStatus,
          trialEndsAt: result.tenant.trialEndsAt,
          maxUsers: result.tenant.maxUsers,
          maxEntities: result.tenant.maxEntities,
          features: result.tenant.features
        },
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role
        } : null,
        message: result.message,
        alreadyExists: result.alreadyExists
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/onboarding/join-tenant
 *
 * Joins an existing tenant via invitation or organization membership.
 * Creates user record in tenant with specified role.
 *
 * @body {Object} joinData - Join tenant data
 * @body {string} joinData.clerkOrganizationId - Clerk organization ID
 * @body {string} joinData.clerkUserId - Clerk user ID
 * @body {string} [joinData.invitationToken] - Optional invitation token (UUID)
 * @body {string} [joinData.role='member'] - User role (admin/member/viewer)
 *
 * @returns {Object} 200 - Successfully joined tenant
 * @returns {Object} 400 - Validation error
 * @returns {Object} 404 - Tenant or invitation not found
 * @returns {Object} 429 - Rate limit exceeded
 * @returns {Object} 500 - Server error
 *
 * @example
 * POST /api/onboarding/join-tenant
 * {
 *   "clerkOrganizationId": "org_abc123",
 *   "clerkUserId": "user_xyz789",
 *   "invitationToken": "123e4567-e89b-12d3-a456-426614174000",
 *   "role": "admin"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "tenant": {
 *     "id": "tenant-uuid",
 *     "slug": "acme-manufacturing",
 *     "name": "Acme Manufacturing"
 *   },
 *   "user": {
 *     "id": "user-uuid",
 *     "email": "jane@acme.com",
 *     "role": "admin"
 *   },
 *   "message": "Successfully joined tenant"
 * }
 */
router.post(
  '/join-tenant',
  validateRequest(joinTenantSchema),
  async (req, res, next) => {
    try {
      const {
        clerkOrganizationId,
        clerkUserId,
        invitationToken,
        role
      } = req.validatedData

      console.log(`[Onboarding API] User ${clerkUserId} joining organization ${clerkOrganizationId}`)

      // Verify user is member of the Clerk organization
      const isMember = await isUserMemberOfOrganization(clerkUserId, clerkOrganizationId)
      if (!isMember) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'User is not a member of the specified organization'
        })
      }

      // Get tenant by Clerk organization ID
      const { tenantPrisma } = await import('../services/tenantPrisma.js')
      const tenant = await tenantPrisma.getTenantByClerkOrg(clerkOrganizationId)

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found',
          message: 'No tenant found for this organization. Please create a tenant first.'
        })
      }

      // If invitation token provided, validate it
      if (invitationToken) {
        const globalClient = tenantPrisma.getGlobalClient()
        const invitation = await globalClient.invitation.findUnique({
          where: { token: invitationToken }
        })

        if (!invitation) {
          return res.status(404).json({
            success: false,
            error: 'Invalid invitation',
            message: 'Invitation not found or has expired'
          })
        }

        if (invitation.tenantId !== tenant.id) {
          return res.status(400).json({
            success: false,
            error: 'Invalid invitation',
            message: 'Invitation does not match the organization'
          })
        }

        if (invitation.expiresAt < new Date()) {
          return res.status(400).json({
            success: false,
            error: 'Invitation expired',
            message: 'This invitation has expired'
          })
        }

        if (invitation.acceptedAt) {
          return res.status(400).json({
            success: false,
            error: 'Invitation already used',
            message: 'This invitation has already been accepted'
          })
        }

        // Mark invitation as accepted
        await globalClient.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() }
        })

        console.log(`[Onboarding API] Validated and marked invitation ${invitationToken} as accepted`)
      }

      // Create user in tenant
      const user = await trialProvisioningService.createUserInTenant({
        clerkUserId,
        tenantId: tenant.id,
        role: invitationToken ? role : 'member', // Use invitation role if token provided
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      })

      res.status(200).json({
        success: true,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          subscriptionTier: tenant.subscriptionTier,
          subscriptionStatus: tenant.subscriptionStatus
        },
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        message: 'Successfully joined tenant'
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/onboarding/check-slug/:slug
 *
 * Checks if a slug is available for use.
 * Provides suggestions if slug is taken.
 *
 * @param {string} slug - Slug to check (URL parameter)
 *
 * @returns {Object} 200 - Slug availability result
 * @returns {Object} 400 - Invalid slug format
 * @returns {Object} 429 - Rate limit exceeded
 * @returns {Object} 500 - Server error
 *
 * @example
 * GET /api/onboarding/check-slug/acme-manufacturing
 *
 * Response 200 (available):
 * {
 *   "success": true,
 *   "available": true,
 *   "valid": true,
 *   "slug": "acme-manufacturing"
 * }
 *
 * Response 200 (taken):
 * {
 *   "success": true,
 *   "available": false,
 *   "valid": true,
 *   "slug": "acme-manufacturing",
 *   "suggestions": ["acme-manufacturing-1", "acme-manufacturing-2", "acme-manufacturing-2025"]
 * }
 *
 * Response 400 (invalid):
 * {
 *   "success": false,
 *   "available": false,
 *   "valid": false,
 *   "slug": "Acme Manufacturing",
 *   "error": "Slug must be 3-50 characters, lowercase alphanumeric and hyphens only"
 * }
 */
router.get(
  '/check-slug/:slug',
  async (req, res, next) => {
    try {
      const { slug } = req.params

      console.log(`[Onboarding API] Checking slug availability: ${slug}`)

      const result = await trialProvisioningService.checkSlugAvailability(slug)

      res.status(result.valid ? 200 : 400).json({
        success: result.valid,
        ...result,
        slug
      })
    } catch (error) {
      next(error)
    }
  }
)

// ==================== ERROR HANDLER ====================

// Apply error handler to all routes
router.use(handleOnboardingError)

// ==================== EXPORT ====================

export default router
