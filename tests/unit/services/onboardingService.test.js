/**
 * onboardingService Unit Tests
 *
 * Tests for Onboarding Service API layer handling trial user onboarding flow.
 * Covers progress tracking, data persistence, and sample data generation.
 *
 * Test Coverage:
 * - fetchProgress() - GET requests with/without tenantId
 * - saveProgress() - POST requests with progress data
 * - completeOnboarding() - POST requests to mark completion
 * - generateSampleData() - POST requests to create sample data
 * - fetchChecklist() - GET checklist status
 * - skipOnboarding() - PATCH requests to skip flow
 * - Error handling and edge cases
 *
 * @module tests/unit/services/onboardingService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import onboardingService, { OnboardingService } from '../../../src/services/onboardingService.js'

// Mock fetch globally
global.fetch = vi.fn()

// Suppress console.error during tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalConsoleError
})

describe('onboardingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Service Initialization', () => {
    it('should export a singleton instance', () => {
      expect(onboardingService).toBeInstanceOf(OnboardingService)
    })

    it('should initialize with correct API base URL', () => {
      const service = new OnboardingService()
      expect(service.apiBaseUrl).toContain('/onboarding')
    })
  })

  describe('fetchProgress', () => {
    it('should fetch progress without tenantId', async () => {
      const mockProgress = {
        currentStep: 1,
        completedSteps: ['company-info'],
        data: { company: { name: 'Test Corp' } },
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgress,
      })

      const result = await onboardingService.fetchProgress()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/progress$/),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockProgress)
    })

    it('should fetch progress with tenantId parameter', async () => {
      const mockProgress = { currentStep: 2, completedSteps: [] }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgress,
      })

      const result = await onboardingService.fetchProgress('tenant-123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/progress\?tenantId=tenant-123$/),
        expect.any(Object)
      )
      expect(result).toEqual(mockProgress)
    })

    it('should throw error on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Progress not found' }),
      })

      await expect(onboardingService.fetchProgress()).rejects.toThrow('Progress not found')
    })
  })

  describe('saveProgress', () => {
    it('should save progress without tenantId', async () => {
      const progressData = {
        currentStep: 2,
        completedSteps: ['company-info', 'integrations'],
        data: {
          company: { name: 'Acme Corp' },
          integrations: { xero: true },
        },
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, id: 'progress-001' }),
      })

      const result = await onboardingService.saveProgress(
        progressData.currentStep,
        progressData.completedSteps,
        progressData.data
      )

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/progress$/),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(progressData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result.success).toBe(true)
    })

    it('should save progress with tenantId parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await onboardingService.saveProgress(1, ['company-info'], {}, 'tenant-456')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/progress\?tenantId=tenant-456$/),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should handle save failures gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid progress data' }),
      })

      await expect(onboardingService.saveProgress(1, [], {})).rejects.toThrow(
        'Invalid progress data'
      )
    })
  })

  describe('completeOnboarding', () => {
    it('should complete onboarding without tenantId', async () => {
      const onboardingData = {
        company: { name: 'Test Company' },
        integrations: { xero: true, shopify: false },
        team: [{ email: 'admin@test.com', role: 'admin' }],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          redirectUrl: '/dashboard',
          message: 'Onboarding complete',
        }),
      })

      const result = await onboardingService.completeOnboarding(onboardingData)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/complete$/),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(onboardingData),
        })
      )
      expect(result.success).toBe(true)
      expect(result.redirectUrl).toBe('/dashboard')
    })

    it('should complete onboarding with tenantId parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, redirectUrl: '/dashboard' }),
      })

      await onboardingService.completeOnboarding({}, 'tenant-789')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/complete\?tenantId=tenant-789$/),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should throw error on completion failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error during completion' }),
      })

      await expect(onboardingService.completeOnboarding({})).rejects.toThrow(
        'Server error during completion'
      )
    })
  })

  describe('generateSampleData', () => {
    it('should generate sample data without tenantId', async () => {
      const mockResult = {
        success: true,
        recordsCreated: {
          companies: 1,
          products: 5,
          sales: 100,
        },
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      })

      const result = await onboardingService.generateSampleData()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/generate-sample$/),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result.success).toBe(true)
      expect(result.recordsCreated.products).toBe(5)
    })

    it('should generate sample data with tenantId parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, recordsCreated: {} }),
      })

      await onboardingService.generateSampleData('tenant-999')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/generate-sample\?tenantId=tenant-999$/),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should handle generation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Sample data already exists' }),
      })

      await expect(onboardingService.generateSampleData()).rejects.toThrow(
        'Sample data already exists'
      )
    })
  })

  describe('fetchChecklist', () => {
    it('should fetch checklist without tenantId', async () => {
      const mockChecklist = {
        items: [
          { id: 'company-info', completed: true },
          { id: 'integrations', completed: false },
        ],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChecklist,
      })

      const result = await onboardingService.fetchChecklist()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/checklist$/),
        expect.any(Object)
      )
      expect(result.items).toHaveLength(2)
      expect(result.items[0].completed).toBe(true)
    })

    it('should fetch checklist with tenantId parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      })

      await onboardingService.fetchChecklist('tenant-111')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/checklist\?tenantId=tenant-111$/),
        expect.any(Object)
      )
    })
  })

  describe('skipOnboarding', () => {
    it('should skip onboarding without tenantId', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Onboarding skipped',
          redirectUrl: '/dashboard',
        }),
      })

      const result = await onboardingService.skipOnboarding()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/skip$/),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result.success).toBe(true)
    })

    it('should skip onboarding with tenantId parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await onboardingService.skipOnboarding('tenant-222')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/onboarding\/skip\?tenantId=tenant-222$/),
        expect.objectContaining({ method: 'PATCH' })
      )
    })

    it('should handle skip errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Not authorized to skip' }),
      })

      await expect(onboardingService.skipOnboarding()).rejects.toThrow('Not authorized to skip')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network connection failed'))

      await expect(onboardingService.fetchProgress()).rejects.toThrow('Network connection failed')
    })

    it('should handle malformed JSON responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token')
        },
      })

      await expect(onboardingService.fetchProgress()).rejects.toThrow('Unexpected token')
    })

    it('should use status code in error when no message provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      })

      await expect(onboardingService.fetchChecklist()).rejects.toThrow('API Error: 503')
    })
  })
})
