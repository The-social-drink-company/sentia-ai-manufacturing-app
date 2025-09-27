/**
 * Production Metrics Hook Test Suite
 * Tests for the main production metrics integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProductionMetrics } from '../hooks/useProductionMetrics'

// Mock the production service
const mockProductionService = {
  fetchProductionMetrics: vi.fn(),
  exportProductionData: vi.fn()
}

vi.mock('../services/productionService', () => mockProductionService)

// Mock IoT integration hook
const mockIoTMetrics = {
  isLoading: false,
  isError: false,
  summary: {
    totalMachines: 5,
    onlineMachines: 4,
    runningMachines: 3,
    avgOEE: 82.5,
    totalProduction: 1500,
    avgQuality: 94.2
  },
  machineData: [
    {
      machineId: 'CNC_001',
      status: 'online',
      sensors: { productionCount: { value: 500 } }
    }
  ]
}

vi.mock('./useIoTIntegration', () => ({
  useIoTProductionMetrics: () => mockIoTMetrics
}))

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  })

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useProductionMetrics', _() => {
  beforeEach(_() => {
    vi.clearAllMocks()
  })

  afterEach(_() => {
    vi.resetAllMocks()
  })

  describe('IoT Data _Integration', _() => {
    it('should use IoT data when available and _healthy', async _() => {
      const { result } = renderHook(
        () => useProductionMetrics({ line: 'all', shift: 'current', timeRange: '24h' }),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.isRealTimeData).toBe(true)
      expect(result.current.dataSource).toBe('iot_sensors')
      expect(result.current.data.summary.totalMachines).toBe(5)
    })

    it('should include filter context with IoT _data', async _() => {
      const filters = { line: 'line-1', shift: 'shift-1', timeRange: '4h' }

      const { result } = renderHook(
        () => useProductionMetrics(filters),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.data?.filters).toEqual(filters)
      })
    })

    it('should mark data as real-time when using _IoT', async _() => {
      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.data?.isRealTimeData).toBe(true)
        expect(result.current.data?.source).toBe('iot_sensors')
        expect(result.current.iotConnectionStatus).toBe('connected')
      })
    })
  })

  describe('Fallback to Mock _Data', _() => {
    beforeEach(_() => {
      // Mock IoT data as unavailable
      vi.doMock('./useIoTIntegration', () => ({
        useIoTProductionMetrics: () => ({
          isLoading: false,
          isError: true,
          summary: null
        })
      }))

      mockProductionService.fetchProductionMetrics.mockResolvedValue({
        summary: {
          totalProduction: 1200,
          efficiency: 78.5,
          qualityScore: 92.1
        },
        oee: {
          overall: 75.2,
          availability: 85.0,
          performance: 88.5,
          quality: 94.2
        },
        machines: [
          {
            id: 'CNC_001',
            status: 'running',
            oee: 82.1
          }
        ]
      })
    })

    it('should fallback to service data when IoT _unavailable', async _() => {
      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockProductionService.fetchProductionMetrics).toHaveBeenCalled()
      expect(result.current.data?.isRealTimeData).toBe(false)
      expect(result.current.data?.source).toBe('mock_data')
    })

    it('should pass correct parameters to _service', async _() => {
      const params = { line: 'line-2', shift: 'shift-2', timeRange: '7d' }

      renderHook(
        () => useProductionMetrics(params),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(mockProductionService.fetchProductionMetrics).toHaveBeenCalledWith(
          params.timeRange,
          params.line,
          params.shift
        )
      })
    })
  })

  describe('Loading _States', _() => {
    it('should show loading state _initially', _() => {
      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeNull()
    })

    it('should show loading state when IoT is _loading', _() => {
      vi.doMock('./useIoTIntegration', () => ({
        useIoTProductionMetrics: () => ({
          isLoading: true,
          isError: false,
          summary: null
        })
      }))

      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      expect(result.current.loading).toBe(true)
    })
  })

  describe('Error _Handling', _() => {
    it('should handle service errors _gracefully', async _() => {
      vi.doMock('./useIoTIntegration', () => ({
        useIoTProductionMetrics: () => ({
          isLoading: false,
          isError: true,
          summary: null
        })
      }))

      const serviceError = new Error('Service unavailable')
      mockProductionService.fetchProductionMetrics.mockRejectedValue(serviceError)

      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.error).toBe(serviceError)
        expect(result.current.loading).toBe(false)
      })
    })

    it('should set IoT connection status to error when IoT _fails', async _() => {
      vi.doMock('./useIoTIntegration', () => ({
        useIoTProductionMetrics: () => ({
          isLoading: false,
          isError: true,
          summary: null
        })
      }))

      mockProductionService.fetchProductionMetrics.mockResolvedValue({
        summary: { totalProduction: 1000 }
      })

      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.iotConnectionStatus).toBe('error')
      })
    })
  })

  describe('Data _Export', _() => {
    beforeEach(_() => {
      mockProductionService.exportProductionData.mockResolvedValue(undefined)
    })

    it('should export data with correct _parameters', async _() => {
      const params = { line: 'line-1', shift: 'shift-1', timeRange: '24h' }

      const { result } = renderHook(
        () => useProductionMetrics(params),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.loading).toBe(false)
      })

      await result.current.exportData('pdf')

      expect(mockProductionService.exportProductionData).toHaveBeenCalledWith(
        'pdf',
        params.timeRange,
        params.line,
        params.shift
      )
    })

    it('should handle export _errors', async _() => {
      const exportError = new Error('Export failed')
      mockProductionService.exportProductionData.mockRejectedValue(exportError)

      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(result.current.exportData('excel')).rejects.toThrow('Export failed: Export failed')
    })
  })

  describe('Data _Refresh', _() => {
    it('should refetch data when _called', async _() => {
      mockProductionService.fetchProductionMetrics.mockResolvedValue({
        summary: { totalProduction: 1000 }
      })

      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear previous calls
      mockProductionService.fetchProductionMetrics.mockClear()

      // Trigger refetch
      result.current.refetch()

      await waitFor(_() => {
        expect(mockProductionService.fetchProductionMetrics).toHaveBeenCalled()
      })
    })
  })

  describe('Parameter _Changes', _() => {
    it('should refetch when parameters _change', async _() => {
      mockProductionService.fetchProductionMetrics.mockResolvedValue({
        summary: { totalProduction: 1000 }
      })

      const { result, rerender } = renderHook(
        ({ line, shift, timeRange }) => useProductionMetrics({ line, shift, timeRange }),
        {
          wrapper: createWrapper(),
          initialProps: { line: 'all', shift: 'current', timeRange: '24h' }
        }
      )

      await waitFor(_() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear previous calls
      mockProductionService.fetchProductionMetrics.mockClear()

      // Change parameters
      rerender({ line: 'line-1', shift: 'shift-1', timeRange: '7d' })

      await waitFor(_() => {
        expect(mockProductionService.fetchProductionMetrics).toHaveBeenCalledWith(
          '7d', 'line-1', 'shift-1'
        )
      })
    })
  })

  describe('Real-time Data _Status', _() => {
    it('should indicate when using real-time _data', async _() => {
      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.isRealTimeData).toBe(true)
        expect(result.current.iotConnectionStatus).toBe('connected')
      })
    })

    it('should indicate when using mock _data', async _() => {
      vi.doMock('./useIoTIntegration', () => ({
        useIoTProductionMetrics: () => ({
          isLoading: false,
          isError: false,
          summary: null // No summary = no IoT data
        })
      }))

      mockProductionService.fetchProductionMetrics.mockResolvedValue({
        summary: { totalProduction: 1000 }
      })

      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.isRealTimeData).toBe(false)
        expect(result.current.iotConnectionStatus).toBe('disconnected')
        expect(result.current.dataSource).toBe('mock_data')
      })
    })

    it('should show connecting status when IoT is _loading', _() => {
      vi.doMock('./useIoTIntegration', () => ({
        useIoTProductionMetrics: () => ({
          isLoading: true,
          isError: false,
          summary: null
        })
      }))

      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      expect(result.current.iotConnectionStatus).toBe('connecting')
    })
  })

  describe('Data Structure _Validation', _() => {
    it('should maintain consistent data structure for IoT _data', async _() => {
      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.data).toBeDefined()
      })

      const data = result.current.data

      // Check required properties
      expect(data).toHaveProperty('summary')
      expect(data).toHaveProperty('filters')
      expect(data).toHaveProperty('isRealTimeData')
      expect(data).toHaveProperty('source')
      expect(data).toHaveProperty('lastUpdated')

      // Check filter structure
      expect(data.filters).toHaveProperty('line')
      expect(data.filters).toHaveProperty('shift')
      expect(data.filters).toHaveProperty('timeRange')
    })

    it('should maintain consistent data structure for mock _data', async _() => {
      vi.doMock('./useIoTIntegration', () => ({
        useIoTProductionMetrics: () => ({
          isLoading: false,
          isError: false,
          summary: null
        })
      }))

      mockProductionService.fetchProductionMetrics.mockResolvedValue({
        summary: { totalProduction: 1000 },
        oee: { overall: 75 },
        machines: []
      })

      const { result } = renderHook(
        () => useProductionMetrics(),
        { wrapper: createWrapper() }
      )

      await waitFor(_() => {
        expect(result.current.data).toBeDefined()
      })

      const data = result.current.data

      expect(data).toHaveProperty('summary')
      expect(data).toHaveProperty('oee')
      expect(data).toHaveProperty('machines')
      expect(data).toHaveProperty('isRealTimeData', false)
      expect(data).toHaveProperty('source', 'mock_data')
    })
  })
})