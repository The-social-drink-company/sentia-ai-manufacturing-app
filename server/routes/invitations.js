/**
 * Invitation API Routes - Multi-Tenant
 *
 * Handles user invitation creation, acceptance, and management.
 * Enables team collaboration with role-based access control.
 *
 * @module server/routes/invitations
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { tenantContext } from '../middleware/tenantContext.js'
import { requireRole } from '../middleware/rbac.js'
import { preventReadOnly } from '../middleware/preventReadOnly.js'
import { logInfo, logError, logWarn } from '../services/observability/structuredLogger.js'
import { logAudit } from '../services/audit/AuditLogger.js'
import * as sendgridService from '../services/email/sendgrid.service.js'

const router = express.Router()
const prisma = new PrismaClient()

// Apply tenant context middleware to all routes
router.use(tenantContext)

// ==================== CONSTANTS ====================

const INVITATION_EXPIRY_DAYS = 7
const MAX_PENDING_INVITATIONS_PER_TENANT = 50

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate secure invitation token
 */
function generateInvitationToken() {
  return crypto.randomUUID()
}

/**
 * Check if user has already been invited
 */
async function hasExistingInvitation(tenantId, email) {
  const existing = await prisma.invitation.findFirst({
    where: {
      tenantId,
      email,
      acceptedAt: null,
      cancelledAt: null,
      expiresAt: {
        gte: new Date()
      }
    }
  })
  return !!existing
}

/**
 * Check if email is already a tenant user
 */
async function isExistingUser(tenantId, email) {
  const user = await prisma.user.findFirst({
    where: {
      tenantId,
      email
    }
  })
  return !!user
}

/**
 * Count pending invitations for tenant
 */
async function countPendingInvitations(tenantId) {
  return await prisma.invitation.count({
    where: {
      tenantId,
      acceptedAt: null,
      cancelledAt: null,
      expiresAt: {
        gte: new Date()
      }
    }
  })
}

// ==================== ROUTES ====================

/**
 * POST /api/invitations
 * Create a new user invitation
 *
 * Required Role: admin, owner
 * Body: { email, role }
 */
router.post('/', requireRole(['admin', 'owner']), preventReadOnly, async (req, res) => {
  try {
    const { tenant } = req
    const { email, role = 'member' } = req.body
    const invitedBy = req.user?.id // From Clerk auth

    // Validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      })
    }

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be admin, member, or viewer'
      })
    }

    // Check if user already exists
    if (await isExistingUser(tenant.id, email)) {
      return res.status(409).json({
        success: false,
        error: 'User with this email is already a member of this organization'
      })
    }

    // Check if already invited
    if (await hasExistingInvitation(tenant.id, email)) {
      return res.status(409).json({
        success: false,
        error: 'An active invitation already exists for this email'
      })
    }

    // Check invitation limit
    const pendingCount = await countPendingInvitations(tenant.id)
    if (pendingCount >= MAX_PENDING_INVITATIONS_PER_TENANT) {
      return res.status(429).json({
        success: false,
        error: `Maximum of ${MAX_PENDING_INVITATIONS_PER_TENANT} pending invitations reached`
      })
    }

    // Generate invitation token
    const token = generateInvitationToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS)

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        tenantId: tenant.id,
        email,
        role,
        token,
        invitedBy,
        expiresAt
      }
    })

    // Send invitation email
    const invitationUrl = `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/invite/${token}`

    try {
      await sendgridService.sendInvitationEmail({
        to: email,
        organizationName: tenant.name,
        invitedByName: req.user?.fullName || 'A team member',
        role,
        invitationUrl,
        expiresAt: expiresAt.toISOString(),
        unsubscribeUrl: `${process.env.VITE_APP_URL}/unsubscribe`,
        preferencesUrl: `${process.env.VITE_APP_URL}/preferences`
      })
    } catch (emailError) {
      logWarn('Failed to send invitation email', {
        error: emailError.message,
        email,
        tenantId: tenant.id
      })
      // Continue - invitation created, email can be resent
    }

    // Log audit event
    await logAudit({
      tenantId: tenant.id,
      userId: invitedBy,
      action: 'invitation.created',
      resourceType: 'invitation',
      resourceId: invitation.id,
      metadata: {
        email,
        role,
        expiresAt: expiresAt.toISOString()
      }
    })

    logInfo('Invitation created', {
      invitationId: invitation.id,
      email,
      tenantId: tenant.id
    })

    res.status(201).json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt
        }
      },
      message: 'Invitation sent successfully'
    })
  } catch (error) {
    logError('Failed to create invitation', {
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({
      success: false,
      error: 'Failed to create invitation'
    })
  }
})

/**
 * GET /api/invitations
 * List all invitations for current tenant
 *
 * Required Role: admin, owner
 * Query params: ?status=pending|accepted|expired|cancelled
 */
router.get('/', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { tenant } = req
    const { status = 'pending' } = req.query

    const where = { tenantId: tenant.id }

    if (status === 'pending') {
      where.acceptedAt = null
      where.cancelledAt = null
      where.expiresAt = { gte: new Date() }
    } else if (status === 'accepted') {
      where.acceptedAt = { not: null }
    } else if (status === 'expired') {
      where.acceptedAt = null
      where.cancelledAt = null
      where.expiresAt = { lt: new Date() }
    } else if (status === 'cancelled') {
      where.cancelledAt = { not: null }
    }

    const invitations = await prisma.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit results
    })

    res.json({
      success: true,
      data: {
        invitations: invitations.map(inv => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          token: inv.token,
          expiresAt: inv.expiresAt,
          acceptedAt: inv.acceptedAt,
          cancelledAt: inv.cancelledAt,
          createdAt: inv.createdAt
        })),
        count: invitations.length
      }
    })
  } catch (error) {
    logError('Failed to list invitations', {
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({
      success: false,
      error: 'Failed to list invitations'
    })
  }
})

/**
 * GET /api/invitations/:token
 * Verify invitation token and get invitation details
 *
 * Public route (no auth required)
 */
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
            subscriptionTier: true
          }
        }
      }
    })

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      })
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Invitation has expired'
      })
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      return res.status(410).json({
        success: false,
        error: 'Invitation has already been accepted'
      })
    }

    // Check if cancelled
    if (invitation.cancelledAt) {
      return res.status(410).json({
        success: false,
        error: 'Invitation has been cancelled'
      })
    }

    res.json({
      success: true,
      data: {
        invitation: {
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          organization: invitation.tenant
        }
      }
    })
  } catch (error) {
    logError('Failed to verify invitation', {
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({
      success: false,
      error: 'Failed to verify invitation'
    })
  }
})

/**
 * PUT /api/invitations/:token/accept
 * Accept an invitation (user must be authenticated with Clerk)
 *
 * Requires: Clerk authentication
 */
router.put('/:token/accept', async (req, res) => {
  try {
    const { token } = req.params
    const clerkUserId = req.user?.id // From Clerk auth
    const email = req.user?.email

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    // Get invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true }
    })

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      })
    }

    // Validate invitation
    if (invitation.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Invitation has expired'
      })
    }

    if (invitation.acceptedAt) {
      return res.status(410).json({
        success: false,
        error: 'Invitation has already been accepted'
      })
    }

    if (invitation.cancelledAt) {
      return res.status(410).json({
        success: false,
        error: 'Invitation has been cancelled'
      })
    }

    // Verify email matches
    if (email !== invitation.email) {
      return res.status(403).json({
        success: false,
        error: 'Invitation email does not match authenticated user email'
      })
    }

    // Check if user already exists in tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        clerkUserId,
        tenantId: invitation.tenantId
      }
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User is already a member of this organization'
      })
    }

    // Create user record
    const user = await prisma.user.create({
      data: {
        clerkUserId,
        email: invitation.email,
        fullName: req.user?.fullName || invitation.email.split('@')[0],
        tenantId: invitation.tenantId,
        role: invitation.role
      }
    })

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    })

    // Log audit event
    await logAudit({
      tenantId: invitation.tenantId,
      userId: user.id,
      action: 'invitation.accepted',
      resourceType: 'invitation',
      resourceId: invitation.id,
      metadata: {
        email: invitation.email,
        role: invitation.role
      }
    })

    logInfo('Invitation accepted', {
      invitationId: invitation.id,
      userId: user.id,
      tenantId: invitation.tenantId
    })

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        tenant: {
          id: invitation.tenant.id,
          name: invitation.tenant.name,
          slug: invitation.tenant.slug
        }
      },
      message: 'Invitation accepted successfully'
    })
  } catch (error) {
    logError('Failed to accept invitation', {
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    })
  }
})

/**
 * DELETE /api/invitations/:id
 * Cancel an invitation
 *
 * Required Role: admin, owner
 */
router.delete('/:id', requireRole(['admin', 'owner']), preventReadOnly, async (req, res) => {
  try {
    const { tenant } = req
    const { id } = req.params

    // Get invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id }
    })

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      })
    }

    // Verify belongs to tenant
    if (invitation.tenantId !== tenant.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      })
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      return res.status(410).json({
        success: false,
        error: 'Cannot cancel an accepted invitation'
      })
    }

    // Mark as cancelled
    await prisma.invitation.update({
      where: { id },
      data: { cancelledAt: new Date() }
    })

    // Log audit event
    await logAudit({
      tenantId: tenant.id,
      userId: req.user?.id,
      action: 'invitation.cancelled',
      resourceType: 'invitation',
      resourceId: invitation.id,
      metadata: {
        email: invitation.email
      }
    })

    logInfo('Invitation cancelled', {
      invitationId: invitation.id,
      tenantId: tenant.id
    })

    res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    })
  } catch (error) {
    logError('Failed to cancel invitation', {
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invitation'
    })
  }
})

/**
 * POST /api/invitations/:id/resend
 * Resend invitation email
 *
 * Required Role: admin, owner
 */
router.post('/:id/resend', requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { tenant } = req
    const { id } = req.params

    // Get invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id }
    })

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      })
    }

    // Verify belongs to tenant
    if (invitation.tenantId !== tenant.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      })
    }

    // Check if still valid
    if (invitation.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Invitation has expired. Create a new invitation instead.'
      })
    }

    if (invitation.acceptedAt) {
      return res.status(410).json({
        success: false,
        error: 'Invitation has already been accepted'
      })
    }

    if (invitation.cancelledAt) {
      return res.status(410).json({
        success: false,
        error: 'Invitation has been cancelled'
      })
    }

    // Resend email
    const invitationUrl = `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/invite/${invitation.token}`

    await sendgridService.sendInvitationEmail({
      to: invitation.email,
      organizationName: tenant.name,
      invitedByName: req.user?.fullName || 'A team member',
      role: invitation.role,
      invitationUrl,
      expiresAt: invitation.expiresAt.toISOString(),
      unsubscribeUrl: `${process.env.VITE_APP_URL}/unsubscribe`,
      preferencesUrl: `${process.env.VITE_APP_URL}/preferences`
    })

    // Log audit event
    await logAudit({
      tenantId: tenant.id,
      userId: req.user?.id,
      action: 'invitation.resent',
      resourceType: 'invitation',
      resourceId: invitation.id,
      metadata: {
        email: invitation.email
      }
    })

    logInfo('Invitation resent', {
      invitationId: invitation.id,
      tenantId: tenant.id
    })

    res.json({
      success: true,
      message: 'Invitation email resent successfully'
    })
  } catch (error) {
    logError('Failed to resend invitation', {
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({
      success: false,
      error: 'Failed to resend invitation'
    })
  }
})

export default router
