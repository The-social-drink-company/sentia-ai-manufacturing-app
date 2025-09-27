import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProductionMetrics } from '../../../src/features/production/hooks/useProductionMetrics.js'

// Mock the dependencies
vi.mock('../../../src/features/production/services/productionService', () => ({
  fetchProductionMetrics: vi.fn(),
  exportProductionData: vi.fn()
}))

vi.mock('../../../src/features/production/hooks/useIoTIntegration', () => ({
  useIoTProductionMetrics: vi.fn()
}))

describe('useProductionMetrics', () => {
  const mockProductionData = {
    summary: {
      totalProduction: 25000,
      averageOEE: 82.5,
      qualityRate: 96.2
    },
    oee: {
      overall: 82.5,
      availability: 87.2,
      performance: 82.1,
      quality: 95.8
    },
    machines: [
      {
        id: 'line-1',
        name: 'Production Line 1',
        status: 'running',
        efficiency: 87.5
      }
    ],
    schedule: { jobs: [] },
    quality: {},
    capacity: {},
    shifts: {},
    alerts: []
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Mock IoT integration to return no data by default
    const { useIoTProductionMetrics } = await import('../../../src/features/production/hooks/useIoTIntegration')
    useIoTProductionMetrics.mockReturnValue({
      isLoading: false,
      isError: false,
      summary: null
    })

    // Mock production service to return mock data
    const { fetchProductionMetrics } = await import('../../../src/features/production/services/productionService')
    fetchProductionMetrics.mockResolvedValue(mockProductionData)
  })

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useProductionMetrics())

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('fetches production metrics on mount', async () => {
    const { fetchProductionMetrics } = await import('../../../src/features/production/services/productionService')

    const { result } = renderHook(() => useProductionMetrics())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchProductionMetrics).toHaveBeenCalledWith('24h', 'all', 'current')
    expect(result.current.data).toEqual({
      ...mockProductionData,
      isRealTimeData: false,
      source: 'mock_data'
    })
  })

  it('uses custom parameters for fetching', async () => {
    const { fetchProductionMetrics } = await import('../../../src/features/production/services/productionService')

    const { result } = renderHook(() =>
      useProductionMetrics({
        line: 'line-1',
        shift: 'shift-2',
        timeRange: '7d'
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchProductionMetrics).toHaveBeenCalledWith('7d', 'line-1', 'shift-2')
  })

  it('prioritizes IoT data when available', async () => {
    const mockIoTData = {
      summary: { totalProduction: 30000 },
      oee: { overall: 85.2 }
    }

    const { useIoTProductionMetrics } = await import('../../../src/features/production/hooks/useIoTIntegration')
    useIoTProductionMetrics.mockReturnValue({
      isLoading: false,
      isError: false,
      summary: mockIoTData.summary,
      oee: mockIoTData.oee
    })

    const { result } = renderHook(() => useProductionMetrics())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(
      expect.objectContaining({
        summary: mockIoTData.summary,
        oee: mockIoTData.oee,
        isRealTimeData: true,
        source: 'iot_sensors'
      })
    )
    expect(result.current.isRealTimeData).toBe(true)
    expect(result.current.dataSource).toBe('iot_sensors')
  })

  it('falls back to service data when IoT is unavailable', async () => {
    const { useIoTProductionMetrics } = await import('../../../src/features/production/hooks/useIoTIntegration')
    useIoTProductionMetrics.mockReturnValue({
      isLoading: false,
      isError: true,
      summary: null
    })

    const { result } = renderHook(() => useProductionMetrics())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isRealTimeData).toBe(false)
    expect(result.current.iotConnectionStatus).toBe('error')
  })

  it('handles fetch errors properly', async () => {
    const mockError = new Error('Failed to fetch production metrics')
    const { fetchProductionMetrics } = await import('../../../src/features/production/services/productionService')
    fetchProductionMetrics.mockRejectedValue(mockError)

    const { result } = renderHook(() => useProductionMetrics())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(mockError)
    expect(result.current.data).toBe(null)
  })

  it('provides refetch functionality', async () => {
    const { fetchProductionMetrics } = await import('../../../src/features/production/services/productionService')

    const { result } = renderHook(() => useProductionMetrics())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear previous calls
    fetchProductionMetrics.mockClear()

    // Call refetch
    result.current.refetch()

    await waitFor(() => {
      expect(fetchProductionMetrics).toHaveBeenCalledTimes(1)
    })
  })

  it('provides export functionality', async () => {
    const { exportProductionData } = await import('../../../src/features/production/services/productionService')

    const { result } = renderHook(() =>
      useProductionMetrics({
        line: 'line-1',
        shift: 'shift-2',
        timeRange: '7d'
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.exportData('csv')

    expect(exportProductionData).toHaveBeenCalledWith('csv', '7d', 'line-1', 'shift-2')
  })

  it('handles export errors', async () => {
    const { exportProductionData } = await import('../../../src/features/production/services/productionService')
    exportProductionData.mockRejectedValue(new Error('Export failed'))

    const { result } = renderHook(() => useProductionMetrics())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(result.current.exportData('pdf')).rejects.toThrow('Export failed')
  })

  it('updates data when parameters change', async () => {
    const { fetchProductionMetrics } = await import('../../../src/features/production/services/productionService')

    const { result, rerender } = renderHook(
      ({ line, shift, timeRange }) => useProductionMetrics({ line, shift, timeRange }),
      {
        initialProps: {
          line: 'all',
          shift: 'current',
          timeRange: '24h'
        }
      }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchProductionMetrics).toHaveBeenCalledWith('24h', 'all', 'current')

    // Change parameters
    rerender({
      line: 'line-1',
      shift: 'shift-1',
      timeRange: '7d'
    })

    await waitFor(() => {
      expect(fetchProductionMetrics).toHaveBeenCalledWith('7d', 'line-1', 'shift-1')
    })
  })

  it('provides correct IoT connection status', async () => {
    const { useIoTProductionMetrics } = await import('../../../src/features/production/hooks/useIoTIntegration')

    // Test connecting state
    useIoTProductionMetrics.mockReturnValue({
      isLoading: true,
      isError: false,
      summary: null
    })

    const { result, rerender } = renderHook(() => useProductionMetrics())

    expect(result.current.iotConnectionStatus).toBe('connecting')

    // Test connected state
    useIoTProductionMetrics.mockReturnValue({
      isLoading: false,
      isError: false,
      summary: { totalProduction: 25000 }
    })

    rerender()

    await waitFor(() => {
      expect(result.current.iotConnectionStatus).toBe('connected')
    })

    // Test error state
    useIoTProductionMetrics.mockReturnValue({
      isLoading: false,
      isError: true,
      summary: null
    })

    rerender()

    await waitFor(() => {
      expect(result.current.iotConnectionStatus).toBe('error')
    })

    // Test disconnected state
    useIoTProductionMetrics.mockReturnValue({
      isLoading: false,
      isError: false,
      summary: null
    })

    rerender()

    await waitFor(() => {
      expect(result.current.iotConnectionStatus).toBe('disconnected')
    })
  })

  it('maintains stable reference for callbacks', () => {
    const { result, rerender } = renderHook(() => useProductionMetrics())

    const firstRefetch = result.current.refetch
    const firstExportData = result.current.exportData

    rerender()

    expect(result.current.refetch).toBe(firstRefetch)
    expect(result.current.exportData).toBe(firstExportData)
  })

  it('handles concurrent fetch requests properly', async () => {
    const { fetchProductionMetrics } = await import('../../../src/features/production/services/productionService')

    // Make fetchProductionMetrics return a promise that resolves after a delay
    fetchProductionMetrics.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve(mockProductionData), 100)
      )
    )

    const { result } = renderHook(() => useProductionMetrics())

    // Trigger multiple refetches quickly
    result.current.refetch()
    result.current.refetch()
    result.current.refetch()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should have valid data despite concurrent requests
    expect(result.current.data).toBeDefined()
    expect(result.current.error).toBe(null)
  })

  it('cleans up properly on unmount', async () => {
    const { unmount } = renderHook(() => useProductionMetrics())

    // Should not throw errors when unmounting during loading
    unmount()

    // No assertions needed - just ensuring no errors are thrown
  })
})