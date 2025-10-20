/**
 * Feature Middleware Unit Tests
 *
 * BMAD-MULTITENANT-002 Story 10: Comprehensive Unit Tests
 *
 * Tests for subscription tier feature enforcement.
 *
 * @module tests/unit/middleware/feature.middleware.test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  requireFeature,
  requireAnyFeature,
  requireAllFeatures,
  hasFeature,
  getEnabledFeatures
} from '../../../server/middleware/feature.middleware'
import { createMockTenant } from '../../mocks/prisma.mock'
import { createMockExpressContext, getResponseStatus, getResponseJson, wasNextCalled } from '../../mocks/express.mock'

describe('Feature Middleware', () => {
  describe('requireFeature', () => {
    it('should call next() when feature is enabled', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.tenant = createMockTenant({
        subscriptionTier: 'professional',
        features: {
          ai_forecasting: true,
          basic_forecasting: true,
          what_if_analysis: true
        }
      })

      const middleware = requireFeature('ai_forecasting')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should return 403 when feature is disabled', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.tenant = createMockTenant({
        subscriptionTier: 'starter',
        features: {
          basic_forecasting: true,
          ai_forecasting: false
        }
      })

      const middleware = requireFeature('ai_forecasting')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(403)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'feature_not_available'
      })
      expect(wasNextCalled(next)).toBe(false)
    })

    it('should return 401 when tenant context is missing', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      // No tenant context

      const middleware = requireFeature('ai_forecasting')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(401)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'tenant_context_missing'
      })
      expect(wasNextCalled(next)).toBe(false)
    })

    it('should include upgrade URL when feature is blocked', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.tenant = createMockTenant({
        subscriptionTier: 'starter',
        features: {
          advanced_reports: false
        }
      })

      const middleware = requireFeature('advanced_reports')

      // Act
      middleware(req as any, res as any, next)

      // Assert
      const response = getResponseJson(res)
      expect(response.upgradeUrl).toContain('/upgrade')
    })
  })

  describe('requireAnyFeature', () => {
    it('should call next() when any feature is enabled', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.tenant = createMockTenant({
        subscriptionTier: 'professional',
        features: {
          ai_forecasting: true,
          what_if_analysis: false,
          advanced_reports: false
        }
      })

      const middleware = requireAnyFeature(['ai_forecasting', 'what_if_analysis', 'advanced_reports'])

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should return 403 when no features are enabled', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.tenant = createMockTenant({
        subscriptionTier: 'starter',
        features: {
          ai_forecasting: false,
          what_if_analysis: false,
          advanced_reports: false
        }
      })

      const middleware = requireAnyFeature(['ai_forecasting', 'what_if_analysis', 'advanced_reports'])

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(403)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'no_required_features'
      })
      expect(wasNextCalled(next)).toBe(false)
    })
  })

  describe('requireAllFeatures', () => {
    it('should call next() when all features are enabled', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.tenant = createMockTenant({
        subscriptionTier: 'enterprise',
        features: {
          ai_forecasting: true,
          what_if_analysis: true,
          advanced_reports: true,
          custom_integrations: true
        }
      })

      const middleware = requireAllFeatures(['ai_forecasting', 'what_if_analysis'])

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(wasNextCalled(next)).toBe(true)
    })

    it('should return 403 when not all features are enabled', () => {
      // Arrange
      const { req, res, next } = createMockExpressContext()
      req.tenant = createMockTenant({
        subscriptionTier: 'professional',
        features: {
          ai_forecasting: true,
          what_if_analysis: true,
          advanced_reports: false // Missing this feature
        }
      })

      const middleware = requireAllFeatures(['ai_forecasting', 'what_if_analysis', 'advanced_reports'])

      // Act
      middleware(req as any, res as any, next)

      // Assert
      expect(getResponseStatus(res)).toBe(403)
      expect(getResponseJson(res)).toMatchObject({
        success: false,
        error: 'missing_required_features'
      })
      expect(wasNextCalled(next)).toBe(false)
    })
  })

  describe('hasFeature', () => {
    it('should return true when feature is enabled', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.tenant = createMockTenant({
        features: {
          ai_forecasting: true
        }
      })

      // Act
      const result = hasFeature(req as any, 'ai_forecasting')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when feature is disabled', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.tenant = createMockTenant({
        features: {
          ai_forecasting: false
        }
      })

      // Act
      const result = hasFeature(req as any, 'ai_forecasting')

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when tenant context is missing', () => {
      // Arrange
      const { req } = createMockExpressContext()

      // Act
      const result = hasFeature(req as any, 'ai_forecasting')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getEnabledFeatures', () => {
    it('should return list of enabled features', () => {
      // Arrange
      const { req } = createMockExpressContext()
      req.tenant = createMockTenant({
        features: {
          basic_forecasting: true,
          ai_forecasting: true,
          what_if_analysis: true,
          multi_entity: false,
          api_access: false
        }
      })

      // Act
      const result = getEnabledFeatures(req as any)

      // Assert
      expect(result).toContain('basic_forecasting')
      expect(result).toContain('ai_forecasting')
      expect(result).toContain('what_if_analysis')
      expect(result).not.toContain('multi_entity')
      expect(result).not.toContain('api_access')
    })

    it('should return empty array when tenant context is missing', () => {
      // Arrange
      const { req } = createMockExpressContext()

      // Act
      const result = getEnabledFeatures(req as any)

      // Assert
      expect(result).toEqual([])
    })
  })
})
