/**
 * dashboardService Unit Tests
 *
 * Tests for Dashboard Summary service that fetches data from MCP server
 * with fallback to mock data.
 *
 * Test Coverage:
 * - Success scenarios (MCP server responses)
 * - Fallback scenarios (network errors, timeouts)
 * - AbortController timeout handling
 * - Error handling and edge cases
 *
 * @module tests/unit/services/dashboardService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchDashboardSummary } from '../../../src/services/dashboardService.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('fetchDashboardSummary - Success Scenarios', () => {
    it('should fetch data from MCP server successfully', async () => {
      const mockMcpData = {
        generatedAt: '2025-10-20T12:00:00.000Z',
        metrics: {
          throughput: { value: 94.7, unit: '%', trend: 1.8 },
          forecastAccuracy: { value: 86.3, unit: '%', trend: 0.9 },
        },
        alerts: [],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMcpData,
      })

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mcp')
      expect(result.payload).toEqual(mockMcpData)
      expect(result.payload.metrics.throughput.value).toBe(94.7)
    })

    it('should use correct MCP API endpoint URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ metrics: {}, alerts: [] }),
      })

      await fetchDashboardSummary()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/dashboard/summary'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'content-type': 'application/json' },
        })
      )
    })

    it('should set correct request headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ metrics: {}, alerts: [] }),
      })

      await fetchDashboardSummary()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'content-type': 'application/json',
          }),
        })
      )
    })

    it('should respect custom abort signal when provided', async () => {
      const customController = new AbortController()

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ metrics: {}, alerts: [] }),
      })

      await fetchDashboardSummary({ signal: customController.signal })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: customController.signal,
        })
      )
    })

    it('should parse JSON response correctly', async () => {
      const mockData = {
        generatedAt: '2025-10-20T12:00:00.000Z',
        metrics: {
          cashRunway: { value: 137, unit: 'days', trend: 6 },
        },
        alerts: [
          { id: 'test-alert', severity: 'warning', message: 'Test message' },
        ],
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await fetchDashboardSummary()

      expect(result.payload.alerts).toHaveLength(1)
      expect(result.payload.alerts[0].severity).toBe('warning')
    })
  })

  describe('fetchDashboardSummary - Fallback Scenarios', () => {
    it('should fall back to mock data on network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mock')
      expect(result.payload).toBeDefined()
      expect(result.payload.metrics).toBeDefined()
      expect(result.payload.alerts).toBeDefined()
    })

    it('should fall back to mock data on 404 response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      })

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mock')
      expect(result.payload.metrics).toBeDefined()
    })

    it('should fall back to mock data on 500 response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mock')
      expect(result.payload).toBeDefined()
    })

    it('should fall back to mock data on JSON parse error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mock')
      expect(result.payload.metrics).toBeDefined()
      expect(result.payload.alerts).toBeInstanceOf(Array)
    })

    it('should return mock data with correct structure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection failed'))

      const result = await fetchDashboardSummary()

      expect(result.payload).toHaveProperty('generatedAt')
      expect(result.payload).toHaveProperty('metrics')
      expect(result.payload).toHaveProperty('alerts')
      expect(result.payload.metrics).toHaveProperty('throughput')
      expect(result.payload.metrics).toHaveProperty('forecastAccuracy')
    })
  })

  describe('fetchDashboardSummary - Timeout Scenarios', () => {
    it('should create AbortController when no signal provided', async () => {
      global.fetch.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ metrics: {}, alerts: [] }),
            })
          }, 100)
        })
      })

      const promise = fetchDashboardSummary()
      await vi.advanceTimersByTimeAsync(100)
      const result = await promise

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      )
      expect(result).toBeDefined()
    })

    it('should abort request after 5 second timeout', async () => {
      let abortCalled = false

      global.fetch.mockImplementationOnce((url, options) => {
        options.signal.addEventListener('abort', () => {
          abortCalled = true
        })

        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout'))
          }, 10000)
        })
      })

      const promise = fetchDashboardSummary()

      // Advance timers to trigger 5 second timeout
      await vi.advanceTimersByTimeAsync(5000)

      const result = await promise

      expect(abortCalled).toBe(true)
      expect(result.source).toBe('mock')
    })

    it('should clean up timeout on successful response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ metrics: {}, alerts: [] }),
      })

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mcp')
      // Timeout should be cleared - no further async operations pending
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('fetchDashboardSummary - Edge Cases', () => {
    it('should handle missing JSON body in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      })

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mock')
      expect(result.payload).toBeDefined()
    })

    it('should handle malformed JSON response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token')
        },
      })

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mock')
      expect(result.payload.metrics).toBeDefined()
    })

    it('should handle empty response object', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mcp')
      expect(result.payload).toEqual({})
    })

    it('should use environment variable for base URL fallback', async () => {
      // Test that the service uses DEFAULT_MCP_BASE_URL when VITE_MCP_BASE_URL is undefined
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ metrics: {}, alerts: [] }),
      })

      await fetchDashboardSummary()

      // Should use the default URL pattern
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/https:\/\/.+\.capliquify\.com\/v1\/dashboard\/summary/),
        expect.any(Object)
      )
    })

    it('should handle AbortError specifically', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'

      global.fetch.mockRejectedValueOnce(abortError)

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mock')
      expect(result.payload).toBeDefined()
    })

    it('should handle undefined metrics in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          generatedAt: '2025-10-20T12:00:00.000Z',
          alerts: [],
          // metrics is missing
        }),
      })

      const result = await fetchDashboardSummary()

      expect(result.source).toBe('mcp')
      expect(result.payload).toHaveProperty('generatedAt')
      expect(result.payload).not.toHaveProperty('metrics')
    })
  })
})
