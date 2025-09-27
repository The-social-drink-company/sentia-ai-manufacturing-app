import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchInventoryMetrics, exportInventoryData } from '../services/inventoryService'

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

document.createElement = vi.fn((tagName) => {
  const element = {
    tagName,
    href: '',
    download: '',
    click: vi.fn(),
    remove: vi.fn()
  }
  return element
})

document.body = {
  appendChild: vi.fn(),
  removeChild: vi.fn()
}

describe('Inventory Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchInventoryMetrics', () => {
    it('fetches inventory metrics successfully from MCP server', async () => {
      const mockData = {
        summary: {
          totalItems: 1250,
          totalValue: 2850000,
          lowStock: 45,
          outOfStock: 12,
          turnoverRate: 6.2,
          averageDaysOnHand: 58
        },
        categories: [
          { name: 'Raw Materials', value: 1200000, count: 450 },
          { name: 'Finished Goods', value: 980000, count: 380 }
        ],
        locations: [
          { name: 'Warehouse A', value: 1500000, utilization: 85 }
        ],
        reorderPoints: [
          { sku: 'SKU001', currentStock: 50, reorderPoint: 100 }
        ]
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await fetchInventoryMetrics('30d', 'all', 'all')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/inventory/metrics'),
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

    it('falls back to main API when MCP server fails', async () => {
      const mockData = {
        summary: { totalItems: 1000, totalValue: 2000000 },
        categories: [],
        locations: [],
        reorderPoints: []
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

      const result = await fetchInventoryMetrics('30d', 'all', 'all')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/inventory/metrics'),
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

    it('returns mock data when all APIs fail', async () => {
      fetch
        .mockRejectedValueOnce(new Error('MCP server unavailable'))
        .mockRejectedValueOnce(new Error('API server unavailable'))

      const result = await fetchInventoryMetrics('30d', 'all', 'all')

      expect(result.source).toBe('mock')
      expect(result.summary).toBeDefined()
      expect(result.categories).toBeDefined()
      expect(result.locations).toBeDefined()
      expect(result.reorderPoints).toBeDefined()
      expect(result.lastUpdated).toBeDefined()
    })

    it('handles different filter parameters correctly', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result = await fetchInventoryMetrics('7d', 'warehouse-a', 'electronics')

      expect(result.source).toBe('mock')
      expect(result.summary).toBeDefined()
    })

    it('generates realistic mock inventory data', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result = await fetchInventoryMetrics()

      expect(result).toMatchObject({
        source: 'mock',
        summary: expect.objectContaining({
          totalItems: expect.any(Number),
          totalValue: expect.any(Number),
          lowStock: expect.any(Number),
          outOfStock: expect.any(Number),
          turnoverRate: expect.any(Number),
          averageDaysOnHand: expect.any(Number)
        }),
        categories: expect.any(Array),
        locations: expect.any(Array),
        reorderPoints: expect.any(Array),
        inventory: expect.any(Array)
      })
    })

    it('includes inventory items with proper structure', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result = await fetchInventoryMetrics('30d', 'all', 'all')

      expect(result.inventory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sku: expect.any(String),
            name: expect.any(String),
            category: expect.any(String),
            location: expect.any(String),
            quantity: expect.any(Number),
            unitCost: expect.any(Number),
            totalValue: expect.any(Number),
            reorderPoint: expect.any(Number),
            leadTime: expect.any(Number),
            supplier: expect.any(String),
            lastMovement: expect.any(String)
          })
        ])
      )
    })

    it('includes ABC analysis data', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result = await fetchInventoryMetrics()

      expect(result.abcAnalysis).toEqual(
        expect.objectContaining({
          classA: expect.objectContaining({
            count: expect.any(Number),
            percentage: expect.any(Number),
            value: expect.any(Number)
          }),
          classB: expect.objectContaining({
            count: expect.any(Number),
            percentage: expect.any(Number),
            value: expect.any(Number)
          }),
          classC: expect.objectContaining({
            count: expect.any(Number),
            percentage: expect.any(Number),
            value: expect.any(Number)
          })
        })
      )
    })

    it('includes demand forecast data', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result = await fetchInventoryMetrics()

      expect(result.demandForecast).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            period: expect.any(String),
            forecast: expect.any(Number),
            confidence: expect.any(Number)
          })
        ])
      )
    })
  })

  describe('exportInventoryData', () => {
    beforeEach(() => {
      fetch.mockRejectedValue(new Error('Use mock data'))
    })

    it('exports data as CSV format', async () => {
      await exportInventoryData('csv', '30d', 'all', 'all')

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('SKU,Product Name,Category,Location')],
        { type: 'text/csv' }
      )

      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(document.createElement).toHaveBeenCalledWith('a')
    })

    it('exports data as Excel format', async () => {
      await exportInventoryData('excel', '30d', 'all', 'all')

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('SKU,Product Name,Category,Location')],
        { type: 'text/csv' }
      )
    })

    it('exports data as PDF format', async () => {
      await exportInventoryData('pdf', '30d', 'all', 'all')

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('{')], // JSON format
        { type: 'application/json' }
      )
    })

    it('includes correct filename with parameters', async () => {
      const mockElement = {
        href: '',
        download: '',
        click: vi.fn()
      }
      document.createElement.mockReturnValue(mockElement)

      await exportInventoryData('csv', '7d', 'warehouse-a', 'electronics')

      expect(mockElement.download).toMatch(/inventory-7d-warehouse-a-electronics-\d{4}-\d{2}-\d{2}\.csv/)
      expect(mockElement.click).toHaveBeenCalled()
    })

    it('cleans up object URLs after download', async () => {
      await exportInventoryData('csv')

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-object-url')
    })
  })

  describe('CSV conversion', () => {
    it('converts inventory data to CSV format correctly', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      await exportInventoryData('csv')

      const csvContent = global.Blob.mock.calls[0][0][0]

      // Should contain headers
      expect(csvContent).toContain('SKU,Product Name,Category,Location')

      // Should contain inventory metrics
      expect(csvContent).toContain('Quantity,Unit Cost,Total Value')
      expect(csvContent).toContain('Reorder Point,Lead Time,Supplier')

      // Should contain summary data
      expect(csvContent).toContain('Total Items')
      expect(csvContent).toContain('Total Value')
      expect(csvContent).toContain('Low Stock')
      expect(csvContent).toContain('Turnover Rate')
    })

    it('handles empty or missing data gracefully', async () => {
      // Mock minimal data structure
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: {},
          categories: [],
          locations: [],
          inventory: []
        })
      })

      await exportInventoryData('csv')

      expect(global.Blob).toHaveBeenCalled()
      // Should not throw error even with minimal data
    })
  })

  describe('Error handling', () => {
    it('handles network errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'))

      const result = await fetchInventoryMetrics()

      expect(result.source).toBe('mock')
      expect(result).toBeDefined()
    })

    it('handles invalid JSON responses', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') }
      })

      const result = await fetchInventoryMetrics()

      expect(result.source).toBe('mock')
    })

    it('handles timeout errors', async () => {
      fetch.mockRejectedValue(new Error('The operation was aborted'))

      const result = await fetchInventoryMetrics()

      expect(result.source).toBe('mock')
    })

    it('handles API rate limiting', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      })

      const result = await fetchInventoryMetrics()

      expect(result.source).toBe('mock')
    })
  })

  describe('Mock data generation', () => {
    it('generates consistent mock data structure', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const result1 = await fetchInventoryMetrics()
      const result2 = await fetchInventoryMetrics()

      expect(result1.summary).toMatchObject(result2.summary)
      expect(result1.categories.length).toBe(result2.categories.length)
      expect(result1.locations.length).toBe(result2.locations.length)
    })

    it('varies mock data based on filters', async () => {
      fetch.mockRejectedValue(new Error('Use mock data'))

      const allData = await fetchInventoryMetrics('30d', 'all', 'all')
      const filteredData = await fetchInventoryMetrics('7d', 'warehouse-a', 'electronics')

      expect(allData.summary.totalItems).toBeGreaterThan(filteredData.summary.totalItems)
    })
  })
})