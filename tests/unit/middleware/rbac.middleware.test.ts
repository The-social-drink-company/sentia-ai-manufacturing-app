/**
 * RBAC Middleware Unit Tests
 *
 * BMAD-MULTITENANT-002 Story 10: Comprehensive Unit Tests
 *
 * Tests for role-based access control with hierarchical permissions.
 *
 * @module tests/unit/middleware/rbac.middleware.test
 */

import { describe, it, expect } from 'vitest'
import {
  requireRole,
  requireExactRole,
  requireAnyRole,
  hasRole,
  hasExactRole,
  getRolePermissions,
  hasPermission
} from '../../../server/middleware/rbac.middleware'
import { createMockDbUser } from '../../mocks/prisma.mock'
import { createMockExpressContext, getResponseStatus, getResponseJson, wasNextCalled } from '../../mocks/express.mock'

describe('RBAC Middleware', () => {
  describe('requireRole', () => {
    it('should call next() when user has exact required role', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'admin' })

      const middleware = requireRole('admin')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should call next() when user has higher role (hierarchy)', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'admin' })

      const middleware = requireRole('member') // Admin > Member

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should return 403 when user has lower role', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'viewer' })

      const middleware = requireRole('admin')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(403)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'insufficient_permissions'
      })
      expect(wasNextCalled(next)).toBe(false)
    })

    it('should return 401 when user context is missing', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      // No user context

      const middleware = requireRole('member')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(401)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'user_not_authenticated'
      })
      expect(wasNextCalled(next)).toBe(false)
    })

    it('should allow owner to access admin routes', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'owner' })

      const middleware = requireRole('admin')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should block member from accessing admin routes', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'member' })

      const middleware = requireRole('admin')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(403)
      expect(wasNextCalled(next)).toBe(false)
    })
  })

  describe('requireExactRole', () => {
    it('should call next() only for exact role match', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'owner' })

      const middleware = requireExactRole('owner')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should block higher role (no hierarchy)', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'owner' })

      const middleware = requireExactRole('admin') // Owner !== Admin

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(403)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'exact_role_required'
      })
      expect(wasNextCalled(next)).toBe(false)
    })

    it('should return 401 when user context is missing', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()

      const middleware = requireExactRole('owner')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(401)
      expect(wasNextCalled(next)).toBe(false)
    })
  })

  describe('requireAnyRole', () => {
    it('should call next() when user has one of allowed roles', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'admin' })

      const middleware = requireAnyRole(['admin', 'owner'])

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should return 403 when user has none of allowed roles', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'viewer' })

      const middleware = requireAnyRole(['admin', 'owner'])

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(403)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'insufficient_role'
      })
      expect(wasNextCalled(next)).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('should return true when user has required role or higher', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'admin' })

      // Act
      const result = hasRole(req as any, 'member')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when user has lower role', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'viewer' })

      // Act
      const result = hasRole(req as any, 'admin')

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when user context is missing', () => {
      // Arrange
      const { req } = createMockExpressContext()

      // Act
      const result = hasRole(req as any, 'member')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('hasExactRole', () => {
    it('should return true only for exact role match', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'admin' })

      // Act
      const result = hasExactRole(req as any, 'admin')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for different role', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'admin' })

      // Act
      const result = hasExactRole(req as any, 'owner')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getRolePermissions', () => {
    it('should return all permissions for viewer role', () => {
      // Act
      const permissions = getRolePermissions('viewer')

      // Assert
      expect(permissions).toContain('view_dashboard')
      expect(permissions).toContain('view_products')
      expect(permissions).toContain('export_data')
      expect(permissions).not.toContain('create_products') // Member permission
    })

    it('should return viewer + member permissions for member role', () => {
      // Act
      const permissions = getRolePermissions('member')

      // Assert
      expect(permissions).toContain('view_dashboard') // From viewer
      expect(permissions).toContain('create_products') // Member permission
      expect(permissions).toContain('edit_products')
      expect(permissions).not.toContain('delete_products') // Admin permission
    })

    it('should return viewer + member + admin permissions for admin role', () => {
      // Act
      const permissions = getRolePermissions('admin')

      // Assert
      expect(permissions).toContain('view_dashboard') // From viewer
      expect(permissions).toContain('create_products') // From member
      expect(permissions).toContain('delete_products') // Admin permission
      expect(permissions).toContain('manage_users')
      expect(permissions).not.toContain('delete_tenant') // Owner permission
    })

    it('should return all permissions for owner role', () => {
      // Act
      const permissions = getRolePermissions('owner')

      // Assert
      expect(permissions).toContain('view_dashboard') // From viewer
      expect(permissions).toContain('create_products') // From member
      expect(permissions).toContain('manage_users') // From admin
      expect(permissions).toContain('delete_tenant') // Owner permission
      expect(permissions).toContain('change_subscription')
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has specific permission', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'admin' })

      // Act
      const result = hasPermission(req as any, 'manage_users')

      // Assert
      expect(result).toBe(true)
    })

    it('should return true when user has inherited permission', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'admin' })

      // Act - Admin should have viewer's "view_dashboard" permission
      const result = hasPermission(req as any, 'view_dashboard')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when user lacks permission', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.user = createMockDbUser({ role: 'viewer' })

      // Act
      const result = hasPermission(req as any, 'delete_products')

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when user context is missing', () => {
      // Arrange
      const { req } = createMockExpressContext()

      // Act
      const result = hasPermission(req as any, 'view_dashboard')

      // Assert
      expect(result).toBe(false)
    })
  })
})
