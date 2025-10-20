/**
 * User Management API Routes - Multi-Tenant
 *
 * Handles user role management, permissions, and user administration.
 * Enables RBAC (Role-Based Access Control) with permission matrix.
 *
 * @module server/routes/users
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import { tenantContext } from '../middleware/tenantContext.js'
import { requireRole } from '../middleware/rbac.js'
import { preventReadOnly } from '../middleware/preventReadOnly.js'
import { logInfo, logError, logWarn } from '../services/observability/structuredLogger.js'
import { logAudit } from '../services/audit/AuditLogger.js'

const router = express.Router()
const prisma = new PrismaClient()

// Apply tenant context middleware to all routes
router.use(tenantContext)

// ==================== CONSTANTS ====================

/**
 * Permission Matrix - Defines what each role can do
 * Used for UI display and validation
 */
const PERMISSION_MATRIX = {
  owner: {
    label: 'Owner',
    description: 'Full access to all features and settings',
    permissions: ['*'], // Wildcard = everything
    capabilities: [
      'Manage all users and roles',
      'Delete organization',
      'Manage billing and subscriptions',
      'Access all features',
      'Manage integrations',
      'View and export all data',
      'Manage organization settings',
      'Invite unlimited users',
    ],
  },
  admin: {
    label: 'Administrator',
    description: 'Manage users, settings, and most features',
    permissions: [
      'users.read',
      'users.invite',
      'users.update',
      'users.remove',
      'settings.read',
      'settings.update',
      'integrations.read',
      'integrations.manage',
      'forecasts.read',
      'forecasts.create',
      'forecasts.update',
      'forecasts.delete',
      'reports.read',
      'reports.create',
      'reports.export',
      'inventory.read',
      'inventory.update',
      'sales.read',
      'sales.update',
      'working_capital.read',
      'working_capital.update',
      'scenarios.read',
      'scenarios.create',
      'scenarios.update',
      'scenarios.delete',
      'audit_logs.read',
    ],
    capabilities: [
      'Manage users (invite, update roles, remove)',
      'Update organization settings',
      'Manage integrations (Xero, Shopify, etc.)',
      'Create and manage forecasts',
      'Create and export reports',
      'Update inventory and sales data',
      'Create what-if scenarios',
      'View audit logs',
    ],
    restrictions: [
      'Cannot delete organization',
      'Cannot change billing subscription',
      'Cannot remove owners',
    ],
  },
  member: {
    label: 'Member',
    description: 'Create and manage forecasts and reports',
    permissions: [
      'users.read',
      'settings.read',
      'integrations.read',
      'forecasts.read',
      'forecasts.create',
      'forecasts.update',
      'reports.read',
      'reports.create',
      'reports.export',
      'inventory.read',
      'sales.read',
      'working_capital.read',
      'scenarios.read',
      'scenarios.create',
      'scenarios.update',
    ],
    capabilities: [
      'View team members',
      'Create and manage own forecasts',
      'Create and export reports',
      'View inventory and sales data',
      'View working capital analysis',
      'Create what-if scenarios',
    ],
    restrictions: [
      'Cannot manage users or settings',
      'Cannot manage integrations',
      'Cannot delete forecasts created by others',
      'Cannot view audit logs',
    ],
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to reports and data',
    permissions: [
      'users.read',
      'settings.read',
      'forecasts.read',
      'reports.read',
      'reports.export',
      'inventory.read',
      'sales.read',
      'working_capital.read',
      'scenarios.read',
    ],
    capabilities: [
      'View team members',
      'View forecasts',
      'View and export reports',
      'View inventory and sales data',
      'View working capital analysis',
      'View what-if scenarios',
    ],
    restrictions: [
      'Cannot create or modify anything',
      'Cannot manage users or settings',
      'Cannot manage integrations',
      'Read-only access only',
    ],
  },
}

/**
 * Role hierarchy for validation
 * Higher index = more powerful
 */
const ROLE_HIERARCHY = ['viewer', 'member', 'admin', 'owner']

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if user can modify target user's role
 * Rules:
 * - Cannot modify your own role
 * - Cannot modify users with equal or higher role
 * - Owners can only be modified by other owners
 */
function canModifyUserRole(currentUserRole, targetUserRole, isSelf = false) {
  if (isSelf) {
    return { allowed: false, reason: 'Cannot modify your own role' }
  }

  const currentIndex = ROLE_HIERARCHY.indexOf(currentUserRole)
  const targetIndex = ROLE_HIERARCHY.indexOf(targetUserRole)

  if (currentIndex <= targetIndex) {
    return { allowed: false, reason: 'Cannot modify users with equal or higher role' }
  }

  return { allowed: true }
}

/**
 * Validate role change
 * Rules:
 * - Cannot assign role higher than your own
 * - Cannot assign owner role (only Clerk can do that)
 */
function canAssignRole(currentUserRole, newRole) {
  if (newRole === 'owner') {
    return { allowed: false, reason: 'Owner role can only be assigned through Clerk' }
  }

  const currentIndex = ROLE_HIERARCHY.indexOf(currentUserRole)
  const newRoleIndex = ROLE_HIERARCHY.indexOf(newRole)

  if (newRoleIndex >= currentIndex) {
    return { allowed: false, reason: 'Cannot assign role equal to or higher than your own' }
  }

  return { allowed: true }
}

// ==================== ROUTES ====================

/**
 * GET /api/users
 * List all users in current tenant
 *
 * Required Role: member, admin, owner
 * Query params: ?role=admin&status=active
 */
router.get('/', requireRole(['member', 'admin', 'owner']), async (req, res) => {
  try {
    const { tenant } = req
    const { role, status } = req.query

    const where = { tenantId: tenant.id }

    if (role && ['owner', 'admin', 'member', 'viewer'].includes(role)) {
      where.role = role
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        fullName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          roleInfo: PERMISSION_MATRIX[user.role],
        })),
        count: users.length,
      },
    })
  } catch (error) {
    logError('Failed to list users', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({
      success: false,
      error: 'Failed to list users',
    })
  }
})

/**
 * GET /api/users/:id
 * Get user details by ID
 *
 * Required Role: member, admin, owner
 */
router.get('/:id', requireRole(['member', 'admin', 'owner']), async (req, res) => {
  try {
    const { tenant } = req
    const { id } = req.params

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        fullName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          roleInfo: PERMISSION_MATRIX[user.role],
        },
      },
    })
  } catch (error) {
    logError('Failed to get user', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    })
  }
})

/**
 * PUT /api/users/:id/role
 * Update user's role
 *
 * Required Role: admin, owner
 * Body: { role: 'admin' | 'member' | 'viewer' }
 */
router.put('/:id/role', requireRole(['admin', 'owner']), preventReadOnly, async (req, res) => {
  try {
    const { tenant } = req
    const { id } = req.params
    const { role: newRole } = req.body
    const currentUserId = req.user?.id

    // Validation
    if (!newRole || !['admin', 'member', 'viewer'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be admin, member, or viewer',
      })
    }

    // Get current user's role
    const currentUser = await prisma.user.findFirst({
      where: { clerkUserId: req.auth?.userId, tenantId: tenant.id },
    })

    if (!currentUser) {
      return res.status(403).json({
        success: false,
        error: 'Current user not found',
      })
    }

    // Get target user
    const targetUser = await prisma.user.findFirst({
      where: { id, tenantId: tenant.id },
    })

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Check if modifying self
    const isSelf = currentUser.id === targetUser.id

    // Validate permission to modify target user
    const modifyCheck = canModifyUserRole(currentUser.role, targetUser.role, isSelf)
    if (!modifyCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: modifyCheck.reason,
      })
    }

    // Validate permission to assign new role
    const assignCheck = canAssignRole(currentUser.role, newRole)
    if (!assignCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: assignCheck.reason,
      })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: newRole },
    })

    // Log audit event
    await logAudit({
      tenantId: tenant.id,
      userId: currentUser.id,
      action: 'user.role_updated',
      resourceType: 'user',
      resourceId: targetUser.id,
      metadata: {
        email: targetUser.email,
        oldRole: targetUser.role,
        newRole,
      },
    })

    logInfo('User role updated', {
      userId: targetUser.id,
      email: targetUser.email,
      oldRole: targetUser.role,
      newRole,
      updatedBy: currentUser.email,
      tenantId: tenant.id,
    })

    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          roleInfo: PERMISSION_MATRIX[updatedUser.role],
        },
      },
      message: 'User role updated successfully',
    })
  } catch (error) {
    logError('Failed to update user role', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
    })
  }
})

/**
 * DELETE /api/users/:id
 * Remove user from organization
 *
 * Required Role: admin, owner
 */
router.delete('/:id', requireRole(['admin', 'owner']), preventReadOnly, async (req, res) => {
  try {
    const { tenant } = req
    const { id } = req.params

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: { clerkUserId: req.auth?.userId, tenantId: tenant.id },
    })

    if (!currentUser) {
      return res.status(403).json({
        success: false,
        error: 'Current user not found',
      })
    }

    // Get target user
    const targetUser = await prisma.user.findFirst({
      where: { id, tenantId: tenant.id },
    })

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Prevent self-deletion
    if (currentUser.id === targetUser.id) {
      return res.status(403).json({
        success: false,
        error: 'Cannot remove yourself from the organization',
      })
    }

    // Check permission to remove user
    const modifyCheck = canModifyUserRole(currentUser.role, targetUser.role, false)
    if (!modifyCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: modifyCheck.reason,
      })
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    // Log audit event
    await logAudit({
      tenantId: tenant.id,
      userId: currentUser.id,
      action: 'user.removed',
      resourceType: 'user',
      resourceId: targetUser.id,
      metadata: {
        email: targetUser.email,
        role: targetUser.role,
      },
    })

    logInfo('User removed from organization', {
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      removedBy: currentUser.email,
      tenantId: tenant.id,
    })

    res.json({
      success: true,
      message: 'User removed from organization successfully',
    })
  } catch (error) {
    logError('Failed to remove user', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({
      success: false,
      error: 'Failed to remove user',
    })
  }
})

/**
 * GET /api/users/roles/permissions
 * Get permission matrix for all roles
 *
 * Public route (authenticated users only, no specific role required)
 */
router.get('/roles/permissions', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        roles: PERMISSION_MATRIX,
        hierarchy: ROLE_HIERARCHY,
      },
    })
  } catch (error) {
    logError('Failed to get permission matrix', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({
      success: false,
      error: 'Failed to get permission matrix',
    })
  }
})

export default router
