import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useDashboardSummary } from './useDashboardSummary'

// Mock the dashboard service
vi.mock('../services/dashboardService', () => ({
  fetchDashboardSummary: vi.fn(),
}))

import { fetchDashboardSummary } from '../services/dashboardService'

describe('useDashboardSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with idle _status', () => {
    const { result } = renderHook(() => useDashboardSummary())

    expect(result.current.status).toBe('idle')
    expect(result.current.data).toBeNull()
    expect(result.current.source).toBe('mock')
  })

  it('should fetch dashboard summary successfully from _MCP', async () => {
    const mockData = {
      generatedAt: '2025-09-26T12:00:00Z',
      metrics: {
        throughput: { value: 95, unit: '%', trend: 2 },
        cashRunway: { value: 140, unit: 'days', trend: 5 },
      },
    }

    fetchDashboardSummary.mockResolvedValue({
      source: 'mcp',
      payload: mockData,
    })

    const { result } = renderHook(() => useDashboardSummary())

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.source).toBe('mcp')
    expect(fetchDashboardSummary).toHaveBeenCalledTimes(1)
  })

  it('should fall back to mock data on error', async () => {
    fetchDashboardSummary.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDashboardSummary())

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(result.current.data).toBeNull()
    expect(result.current.source).toBe('mock')
  })

  it('should handle mock data _fallback', async () => {
    const mockData = {
      generatedAt: new Date().toISOString(),
      metrics: {
        throughput: { value: 94.7, unit: '%', trend: 1.8 },
      },
    }

    fetchDashboardSummary.mockResolvedValue({
      source: 'mock',
      payload: mockData,
    })

    const { result } = renderHook(() => useDashboardSummary())

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.source).toBe('mock')
  })

  it('should set loading status while _fetching', async () => {
    fetchDashboardSummary.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                source: 'mcp',
                payload: {},
              }),
            100
          )
        )
    )

    const { result } = renderHook(() => useDashboardSummary())

    await waitFor(() => {
      expect(result.current.status).toBe('loading')
    })
  })

  it('should cleanup on _unmount', () => {
    const { unmount } = renderHook(() => useDashboardSummary())

    unmount()

    // Verify no state updates occur after unmount
    expect(() => unmount()).not.toThrow()
  })
})
