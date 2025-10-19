/**
 * Onboarding Routes (TypeScript Multi-Tenant)
 *
 * Handles tenant onboarding and user invitation flows.
 *
 * @module server/routes/onboarding.routes
 */

import express, { Request, Response } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/error.middleware.js'
import { ValidationError, NotFoundError, ConflictError } from '../errors/AppError.js'
import { tenantService } from '../services/tenant.service.js'

const router = express.Router()
const prisma = new PrismaClient()

// Note: This uses backend Clerk SDK which should be imported from server-side
// For now, we'll use the service methods which handle Clerk interactions

// ==================== VALIDATION SCHEMAS ====================

const CreateTenantSchema = z.object({
  clerkOrganizationId: z.string().min(1),
  clerkUserId: z.string().min(1),
  organizationName: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  subscriptionTier: z.enum(['starter', 'professional', 'enterprise']).default('professional')
})

const JoinTenantSchema = z.object({
  clerkOrganizationId: z.string().min(1),
  clerkUserId: z.string().min(1),
  role: z.enum(['admin', 'member', 'viewer']).default('member')
})

// ==================== ROUTE HANDLERS ====================

/**
 * POST /api/onboarding/create-tenant
 * Called after user creates an organization in Clerk
 */
router.post('/create-tenant', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const data = CreateTenantSchema.parse(req.body)

  // 1. Check if tenant already exists
  const existingTenant = await tenantService.getTenantByClerkOrgId(data.clerkOrganizationId)

  if (existingTenant) {
    throw new ConflictError('Tenant already exists for this organization')
  }

  // 2. Check if slug is available
  const slugAvailable = await tenantService.isSlugAvailable(data.slug)

  if (!slugAvailable) {
    throw new ConflictError(`Slug '${data.slug}' is already taken`)
  }

  // 3. Get user email (in production, fetch from Clerk)
  // For now, we'll use a placeholder
  const userEmail = `${data.clerkUserId}@example.com` // TODO: Fetch from Clerk SDK

  // 4. Create tenant
  const tenant = await tenantService.createTenant({
    name: data.organizationName,
    slug: data.slug,
    clerkOrganizationId: data.clerkOrganizationId,
    subscriptionTier: data.subscriptionTier,
    ownerEmail: userEmail
  })

  // 5. Create user in public.users table
  const user = await prisma.user.create({
    data: {
      clerkUserId: data.clerkUserId,
      email: userEmail,
      fullName: 'User', // TODO: Fetch from Clerk SDK
      tenantId: tenant.id,
      role: 'owner'
    }
  })

  // 6. Log audit event
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      action: 'tenant.created',
      resourceType: 'tenant',
      resourceId: tenant.id,
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
      metadata: {
        organizationName: data.organizationName,
        subscriptionTier: data.subscriptionTier
      }
    }
  })

  res.status(201).json({
    success: true,
    data: {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        subscriptionTier: tenant.subscriptionTier,
        subscriptionStatus: tenant.subscriptionStatus,
        trialEndsAt: tenant.trialEndsAt
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    },
    message: 'Tenant created successfully'
  })
}))

/**
 * POST /api/onboarding/join-tenant
 * Called when user accepts invitation to join an organization
 */
router.post('/join-tenant', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const data = JoinTenantSchema.parse(req.body)

  // 1. Get tenant
  const tenant = await tenantService.getTenantByClerkOrgId(data.clerkOrganizationId)

  if (!tenant) {
    throw new NotFoundError('Tenant not found for this organization')
  }

  // 2. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: data.clerkUserId }
  })

  if (existingUser) {
    throw new ConflictError('User already exists in this tenant')
  }

  // 3. Get user email (in production, fetch from Clerk)
  const userEmail = `${data.clerkUserId}@example.com` // TODO: Fetch from Clerk SDK

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      clerkUserId: data.clerkUserId,
      email: userEmail,
      fullName: 'User', // TODO: Fetch from Clerk SDK
      tenantId: tenant.id,
      role: data.role
    }
  })

  // 5. Log audit event
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      action: 'user.joined',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
      metadata: {
        email: userEmail,
        role: data.role
      }
    }
  })

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name
      }
    },
    message: 'Successfully joined tenant'
  })
}))

/**
 * GET /api/onboarding/check-slug/:slug
 * Check if slug is available
 */
router.get('/check-slug/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new ValidationError('Invalid slug format. Use only lowercase letters, numbers, and hyphens.')
  }

  const available = await tenantService.isSlugAvailable(slug)

  res.json({
    success: true,
    data: {
      slug,
      available
    }
  })
}))

/**
 * GET /api/onboarding/tenant/:clerkOrgId
 * Get tenant by Clerk organization ID
 */
router.get('/tenant/:clerkOrgId', asyncHandler(async (req: Request, res: Response) => {
  const { clerkOrgId } = req.params

  const tenant = await tenantService.getTenantByClerkOrgId(clerkOrgId)

  if (!tenant) {
    throw new NotFoundError('Tenant not found for this organization')
  }

  res.json({
    success: true,
    data: {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        subscriptionTier: tenant.subscriptionTier,
        subscriptionStatus: tenant.subscriptionStatus,
        trialEndsAt: tenant.trialEndsAt,
        features: tenant.features
      }
    }
  })
}))

export default router
