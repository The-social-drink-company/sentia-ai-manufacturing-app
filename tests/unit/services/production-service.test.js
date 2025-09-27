import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchProductionMetrics, exportProductionData } from '../../../src/features/production/services/productionService.js'

// Mock fetch globally
global.fetch = vi.fn()

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock DOM methods for export functionality
global.URL = {
  createObjectURL: vi.fn(() => 'mock-object-url'),
  revokeObjectURL: vi.fn()
}

global.Blob = vi.fn((content, options) => ({
  content,
  type: options.type
}))

// Mock document methods
document.createElement = vi.fn((tagName) => {
  const element = {
    tagName,
    href: '',
    download: '',
    click: vi.fn(),
    remove: vi.fn()
  }

  if (tagName === 'a') {
    return element
  }

  return element
})

document.body = {
  appendChild: vi.fn(),
  removeChild: vi.fn()
}

describe('Production _Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe(_'fetchProductionMetrics', () => {
    it('fetches production metrics successfully from MCP _server', async () => {
      const mockData = {
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
        machines: [],
        schedule: { jobs: [] }
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await fetchProductionMetrics('24h', 'all', 'current')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/production/metrics'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: expect.any(AbortSignal)
        })
      )

      expect(result).toEqual({
        ...mockData,
        source: 'mcp'
      })
    })

    it('falls back to main API when MCP server _fails', async () => {
      const mockData = {
        summary: { totalProduction: 20000 },
        oee: { overall: 78.3 }
      }

      // MCP server fails
      fetch
        .mockRejectedValueOnce(new Error('MCP server unavailable'))
        // Main API succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

      mockLocalStorage.getItem.mockReturnValue('mock-auth-token')

      const result = await fetchProductionMetrics('24h', 'all', 'current')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/production/metrics'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token'
          })
        })
      )

      expect(result).toEqual({
        ...mockData,
        source: 'api'
      })
    })

    it('returns mock data when all APIs _fail', async () => {
      fetch
        .mockRejectedValueOnce(new Error('MCP server unavailable'))
        .mockRejectedValueOnce(new Error('API server unavailable'))

      const result = await fetchProductionMetrics('24h', 'all', 'current')

      expect(result.source).toBe('mock')
      expect(result.summary).toBeDefined()
      expect(result.oee).toBeDefined()
      expect(result.machines).toBeDefined()
      expect(result.schedule).toBeDefined()
      expect(result.lastUpdated).toBeDefined()
    })

    it('handles different time ranges _correctly', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result = await fetchProductionMetrics('7d', 'line-1', 'shift-2')

      expect(result.source).toBe('mock')
      // Should contain data adjusted for the specific filters
      expect(result.summary).toBeDefined()
    })

    it('generates realistic mock data _structure', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result = await fetchProductionMetrics()

      expect(result).toMatchObject({
        source: 'mock',
        summary: expect.objectContaining({
          totalProduction: expect.any(Number),
          averageOEE: expect.any(Number),
          qualityRate: expect.any(Number)
        }),
        oee: expect.objectContaining({
          overall: expect.any(Number),
          availability: expect.any(Number),
          performance: expect.any(Number),
          quality: expect.any(Number)
        }),
        machines: expect.any(Array),
        schedule: expect.objectContaining({
          jobs: expect.any(Array)
        }),
        quality: expect.any(Object),
        capacity: expect.any(Object),
        shifts: expect.any(Object),
        alerts: expect.any(Array)
      })
    })

    it('includes machine data with proper _structure', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result = await fetchProductionMetrics('24h', 'all', 'current')

      expect(result.machines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            type: expect.any(String),
            status: expect.stringMatching(/running|idle|setup|down/),
            efficiency: expect.any(Number),
            currentSpeed: expect.any(Number),
            targetSpeed: expect.any(Number),
            temperature: expect.any(Number),
            pressure: expect.any(Number),
            vibration: expect.any(Number)
          })
        ])
      )
    })

    it('includes production schedule with job _details', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result = await fetchProductionMetrics()

      expect(result.schedule.jobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            product: expect.any(String),
            quantity: expect.any(Number),
            plannedStart: expect.any(String),
            plannedEnd: expect.any(String),
            status: expect.stringMatching(/completed|in-progress|scheduled|delayed/),
            lineId: expect.any(String),
            priority: expect.stringMatching(/high|medium|low/)
          })
        ])
      )
    })
  })

  describe(_'exportProductionData', () => {
    beforeEach(() => {
      fetch.mockRejectedValue(new Error('Use mock data'))
    })

    it('exports data as CSV _format', async () => {
      await exportProductionData('csv', '24h', 'all', 'current')

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Metric,Value,Change,Status')],
        { type: 'text/csv' }
      )

      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(document.createElement).toHaveBeenCalledWith('a')
    })

    it('exports data as Excel _format', async () => {
      await exportProductionData('excel', '24h', 'all', 'current')

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Metric,Value,Change,Status')],
        { type: 'text/csv' }
      )
    })

    it('exports data as PDF _format', async () => {
      await exportProductionData('pdf', '24h', 'all', 'current')

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('{')], // JSON format
        { type: 'application/json' }
      )
    })

    it('includes correct filename with _parameters', async () => {
      const mockElement = {
        href: '',
        download: '',
        click: vi.fn()
      }
      document.createElement.mockReturnValue(mockElement)

      await exportProductionData('csv', '7d', 'line-1', 'shift-2')

      expect(mockElement.download).toMatch(/production-7d-line-1-shift-2-\d{4}-\d{2}-\d{2}.csv/)
      expect(mockElement.click).toHaveBeenCalled()
    })

    it('cleans up object URLs after _download', async () => {
      await exportProductionData('csv')

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-object-url')
    })
  })

  describe('CSV _conversion', () => {
    it('converts production data to CSV format _correctly', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      await exportProductionData('csv')

      const csvContent = global.Blob.mock.calls[0][0][0]

      // Should contain headers
      expect(csvContent).toContain('Metric,Value,Change,Status')

      // Should contain production metrics
      expect(csvContent).toContain('Total Production')
      expect(csvContent).toContain('Average OEE')
      expect(csvContent).toContain('Quality Rate')

      // Should contain OEE breakdown
      expect(csvContent).toContain('Overall OEE')
      expect(csvContent).toContain('Availability')
      expect(csvContent).toContain('Performance')
      expect(csvContent).toContain('Quality')

      // Should contain machine data
      expect(csvContent).toContain('Machine,Status,Efficiency')

      // Should contain job data
      expect(csvContent).toContain('Job ID,Product,Status')
    })

    it('handles empty or missing data _gracefully', async () => {
      // Mock minimal data structure
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: {},
          oee: {},
          machines: [],
          schedule: { jobs: [] }
        })
      })

      await exportProductionData('csv')

      expect(global.Blob).toHaveBeenCalled()
      // Should not throw error even with minimal data
    })
  })

  describe('Error _handling', () => {
    it('handles network errors _gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'))

      const result = await fetchProductionMetrics()

      expect(result.source).toBe('mock')
      expect(result).toBeDefined()
    })

    it('handles invalid JSON _responses', async () => {
      fetch.mockResolvedValue({
        ok: _true,
        json: async () => { throw new Error('Invalid JSON') }
      })

      const result = await fetchProductionMetrics()

      expect(result.source).toBe('mock')
    })

    it('handles timeout _errors', async () => {
      fetch.mockRejectedValue(new Error('The operation was aborted'))

      const result = await fetchProductionMetrics()

      expect(result.source).toBe('mock')
    })
  })
})