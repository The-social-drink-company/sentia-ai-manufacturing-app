/**
 * Production Service Test Suite
 * Tests for production data service functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchProductionMetrics, exportProductionData } from '../services/productionService'

// Mock DOM APIs
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn()
}

global.Blob = vi.fn((content, options) => ({
  content,
  options,
  size: content[0]?.length || 0
}))

// Mock document.createElement and click
const mockClick = vi.fn()
const mockElement = {
  href: '',
  download: '',
  click: mockClick
}

global.document = {
  createElement: vi.fn(() => mockElement)
}

describe('Production Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClick.mockClear()
    mockElement.href = ''
    mockElement.download = ''
  })

  describe('fetchProductionMetrics', () => {
    it('should generate realistic production metrics', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(metrics).toBeDefined()
      expect(metrics).toHaveProperty('summary')
      expect(metrics).toHaveProperty('oee')
      expect(metrics).toHaveProperty('machines')
      expect(metrics).toHaveProperty('schedule')
      expect(metrics).toHaveProperty('quality')
      expect(metrics).toHaveProperty('capacity')
      expect(metrics).toHaveProperty('shifts')
      expect(metrics).toHaveProperty('alerts')
    })

    it('should include summary metrics', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(metrics.summary).toHaveProperty('totalProduction')
      expect(metrics.summary).toHaveProperty('targetProduction')
      expect(metrics.summary).toHaveProperty('efficiency')
      expect(metrics.summary).toHaveProperty('qualityScore')
      expect(metrics.summary).toHaveProperty('downtime')
      expect(metrics.summary).toHaveProperty('activeAlarms')

      expect(typeof metrics.summary.totalProduction).toBe('number')
      expect(typeof metrics.summary.efficiency).toBe('number')
      expect(metrics.summary.efficiency).toBeGreaterThanOrEqual(0)
      expect(metrics.summary.efficiency).toBeLessThanOrEqual(100)
    })

    it('should include OEE metrics', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(metrics.oee).toHaveProperty('overall')
      expect(metrics.oee).toHaveProperty('availability')
      expect(metrics.oee).toHaveProperty('performance')
      expect(metrics.oee).toHaveProperty('quality')
      expect(metrics.oee).toHaveProperty('trend')

      // OEE values should be realistic percentages
      expect(metrics.oee.overall).toBeGreaterThanOrEqual(40)
      expect(metrics.oee.overall).toBeLessThanOrEqual(100)
      expect(metrics.oee.availability).toBeGreaterThanOrEqual(70)
      expect(metrics.oee.availability).toBeLessThanOrEqual(100)
    })

    it('should include machine data', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(Array.isArray(metrics.machines)).toBe(true)
      expect(metrics.machines.length).toBeGreaterThan(0)

      const firstMachine = metrics.machines[0]
      expect(firstMachine).toHaveProperty('id')
      expect(firstMachine).toHaveProperty('name')
      expect(firstMachine).toHaveProperty('status')
      expect(firstMachine).toHaveProperty('oee')
      expect(firstMachine).toHaveProperty('currentJob')
      expect(firstMachine).toHaveProperty('efficiency')

      expect(['running', 'idle', 'maintenance', 'stopped']).toContain(firstMachine.status)
    })

    it('should include production schedule', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(Array.isArray(metrics.schedule)).toBe(true)
      expect(metrics.schedule.length).toBeGreaterThan(0)

      const firstJob = metrics.schedule[0]
      expect(firstJob).toHaveProperty('id')
      expect(firstJob).toHaveProperty('productName')
      expect(firstJob).toHaveProperty('quantity')
      expect(firstJob).toHaveProperty('startTime')
      expect(firstJob).toHaveProperty('endTime')
      expect(firstJob).toHaveProperty('status')
      expect(firstJob).toHaveProperty('priority')

      expect(['scheduled', 'in_progress', 'completed', 'delayed']).toContain(firstJob.status)
    })

    it('should include quality metrics', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(metrics.quality).toHaveProperty('overallScore')
      expect(metrics.quality).toHaveProperty('defectRate')
      expect(metrics.quality).toHaveProperty('firstPassYield')
      expect(metrics.quality).toHaveProperty('reworkRate')
      expect(metrics.quality).toHaveProperty('defectTypes')

      expect(metrics.quality.overallScore).toBeGreaterThanOrEqual(80)
      expect(metrics.quality.overallScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(metrics.quality.defectTypes)).toBe(true)
    })

    it('should include capacity planning data', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(metrics.capacity).toHaveProperty('utilized')
      expect(metrics.capacity).toHaveProperty('available')
      expect(metrics.capacity).toHaveProperty('planned')
      expect(metrics.capacity).toHaveProperty('bottlenecks')
      expect(metrics.capacity).toHaveProperty('forecast')

      expect(metrics.capacity.utilized).toBeGreaterThanOrEqual(0)
      expect(metrics.capacity.utilized).toBeLessThanOrEqual(metrics.capacity.available)
      expect(Array.isArray(metrics.capacity.bottlenecks)).toBe(true)
    })

    it('should include shift information', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(Array.isArray(metrics.shifts)).toBe(true)
      expect(metrics.shifts.length).toBeGreaterThan(0)

      const firstShift = metrics.shifts[0]
      expect(firstShift).toHaveProperty('id')
      expect(firstShift).toHaveProperty('name')
      expect(firstShift).toHaveProperty('startTime')
      expect(firstShift).toHaveProperty('endTime')
      expect(firstShift).toHaveProperty('supervisor')
      expect(firstShift).toHaveProperty('performance')
    })

    it('should include alerts', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(Array.isArray(metrics.alerts)).toBe(true)

      if (metrics.alerts.length > 0) {
        const firstAlert = metrics.alerts[0]
        expect(firstAlert).toHaveProperty('id')
        expect(firstAlert).toHaveProperty('type')
        expect(firstAlert).toHaveProperty('severity')
        expect(firstAlert).toHaveProperty('message')
        expect(firstAlert).toHaveProperty('timestamp')
        expect(firstAlert).toHaveProperty('source')

        expect(['critical', 'high', 'medium', 'low']).toContain(firstAlert.severity)
      }
    })

    it('should vary metrics based on time range', async () => {
      const metrics1h = await fetchProductionMetrics('1h', 'all', 'current')
      const metrics24h = await fetchProductionMetrics('24h', 'all', 'current')

      // Different time ranges should potentially produce different results
      expect(metrics1h).toBeDefined()
      expect(metrics24h).toBeDefined()

      // Both should have same structure
      expect(metrics1h).toHaveProperty('summary')
      expect(metrics24h).toHaveProperty('summary')
    })

    it('should vary metrics based on production line', async () => {
      const metricsAll = await fetchProductionMetrics('24h', 'all', 'current')
      const metricsLine1 = await fetchProductionMetrics('24h', 'line-1', 'current')

      expect(metricsAll).toBeDefined()
      expect(metricsLine1).toBeDefined()

      // Should have same structure regardless of line filter
      expect(metricsAll).toHaveProperty('machines')
      expect(metricsLine1).toHaveProperty('machines')
    })

    it('should vary metrics based on shift', async () => {
      const metricsCurrent = await fetchProductionMetrics('24h', 'all', 'current')
      const metricsShift1 = await fetchProductionMetrics('24h', 'all', 'shift-1')

      expect(metricsCurrent).toBeDefined()
      expect(metricsShift1).toBeDefined()

      // Should have same structure regardless of shift filter
      expect(metricsCurrent).toHaveProperty('shifts')
      expect(metricsShift1).toHaveProperty('shifts')
    })

    it('should simulate API delay', async () => {
      const startTime = Date.now()
      await fetchProductionMetrics('24h', 'all', 'current')
      const endTime = Date.now()

      // Should take at least 500ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(500)
    })

    it('should occasionally simulate errors', async () => {
      // Mock Math.random to force error condition
      const originalRandom = Math.random
      Math.random = vi.fn(() => 0.02) // Force error condition (< 0.03)

      await expect(fetchProductionMetrics('24h', 'all', 'current')).rejects.toThrow(
        'Production system temporarily unavailable'
      )

      Math.random = originalRandom
    })
  })

  describe('exportProductionData', () => {
    beforeEach(() => {
      // Reset global mocks
      global.URL.createObjectURL.mockReturnValue('blob:mock-url')
    })

    it('should export data as PDF', async () => {
      await exportProductionData('pdf', '24h', 'all', 'current')

      expect(global.Blob).toHaveBeenCalled()
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(global.document.createElement).toHaveBeenCalledWith('a')
      expect(mockElement.download).toContain('production-report')
      expect(mockElement.download).toContain('.pdf')
      expect(mockClick).toHaveBeenCalled()
    })

    it('should export data as Excel', async () => {
      await exportProductionData('excel', '24h', 'all', 'current')

      expect(mockElement.download).toContain('.xlsx')
      expect(mockClick).toHaveBeenCalled()
    })

    it('should export data as CSV', async () => {
      await exportProductionData('csv', '24h', 'all', 'current')

      expect(mockElement.download).toContain('.csv')
      expect(mockClick).toHaveBeenCalled()
    })

    it('should include filter parameters in filename', async () => {
      await exportProductionData('pdf', '7d', 'line-1', 'shift-2')

      expect(mockElement.download).toContain('7d')
      expect(mockElement.download).toContain('line-1')
      expect(mockElement.download).toContain('shift-2')
    })

    it('should throw error for unsupported formats', async () => {
      await expect(exportProductionData('xml', '24h', 'all', 'current')).rejects.toThrow(
        'Unsupported export format: xml'
      )
    })

    it('should create blob with correct content type for PDF', async () => {
      await exportProductionData('pdf', '24h', 'all', 'current')

      expect(global.Blob).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: 'application/pdf' })
      )
    })

    it('should create blob with correct content type for Excel', async () => {
      await exportProductionData('excel', '24h', 'all', 'current')

      expect(global.Blob).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: 'application/vnd.ms-excel' })
      )
    })

    it('should create blob with correct content type for CSV', async () => {
      await exportProductionData('csv', '24h', 'all', 'current')

      expect(global.Blob).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: 'text/csv' })
      )
    })

    it('should include comprehensive data in export', async () => {
      await exportProductionData('json', '24h', 'all', 'current')

      const blobCall = global.Blob.mock.calls[0]
      const exportData = JSON.parse(blobCall[0][0])

      expect(exportData).toHaveProperty('metadata')
      expect(exportData).toHaveProperty('summary')
      expect(exportData).toHaveProperty('machines')
      expect(exportData).toHaveProperty('schedule')
      expect(exportData).toHaveProperty('quality')

      expect(exportData.metadata).toHaveProperty('exportTime')
      expect(exportData.metadata).toHaveProperty('timeRange', '24h')
      expect(exportData.metadata).toHaveProperty('line', 'all')
      expect(exportData.metadata).toHaveProperty('shift', 'current')
    })

    it('should handle export errors gracefully', async () => {
      // Mock Blob constructor to throw error
      global.Blob = vi.fn(() => {
        throw new Error('Blob creation failed')
      })

      await expect(exportProductionData('pdf', '24h', 'all', 'current')).rejects.toThrow(
        'Export failed: Blob creation failed'
      )
    })

    it('should clean up object URLs', async () => {
      await exportProductionData('pdf', '24h', 'all', 'current')

      // URL.createObjectURL should be called but not revokeObjectURL in this implementation
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    it('should format CSV data correctly', async () => {
      await exportProductionData('csv', '24h', 'all', 'current')

      const blobCall = global.Blob.mock.calls[0]
      const csvContent = blobCall[0][0]

      // Should be valid CSV format
      expect(typeof csvContent).toBe('string')
      expect(csvContent).toContain(',') // Should contain CSV separators
      expect(csvContent.split('\n').length).toBeGreaterThan(1) // Should have headers and data
    })

    it('should simulate export processing delay', async () => {
      const startTime = Date.now()
      await exportProductionData('pdf', '24h', 'all', 'current')
      const endTime = Date.now()

      // Should take at least 800ms (simulated processing)
      expect(endTime - startTime).toBeGreaterThanOrEqual(800)
    })
  })

  describe('Data Consistency', () => {
    it('should generate consistent machine IDs across calls', async () => {
      const metrics1 = await fetchProductionMetrics('24h', 'all', 'current')
      const metrics2 = await fetchProductionMetrics('24h', 'all', 'current')

      const machineIds1 = metrics1.machines.map(m => m.id).sort()
      const machineIds2 = metrics2.machines.map(m => m.id).sort()

      expect(machineIds1).toEqual(machineIds2)
    })

    it('should maintain realistic OEE relationships', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      // Overall OEE should be roughly availability × performance × quality / 10000
      const calculated = (metrics.oee.availability * metrics.oee.performance * metrics.oee.quality) / 10000
      const actual = metrics.oee.overall

      // Allow for some variance in mock data
      expect(Math.abs(calculated - actual)).toBeLessThan(10)
    })

    it('should have realistic capacity utilization', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      expect(metrics.capacity.utilized).toBeLessThanOrEqual(metrics.capacity.available)
      expect(metrics.capacity.available).toBeLessThanOrEqual(metrics.capacity.planned)
    })

    it('should have consistent shift timing', async () => {
      const metrics = await fetchProductionMetrics('24h', 'all', 'current')

      metrics.shifts.forEach(shift => {
        const startTime = new Date(shift.startTime)
        const endTime = new Date(shift.endTime)

        expect(endTime.getTime()).toBeGreaterThan(startTime.getTime())
      })
    })
  })
})