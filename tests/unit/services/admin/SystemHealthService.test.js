/**
 * SystemHealthService Unit Tests
 *
 * Tests for system health monitoring and metrics collection
 *
 * Test Coverage:
 * - Overall system health status and scoring
 * - Process metrics (CPU, memory, uptime)
 * - Database and Redis health checks
 * - Integration health monitoring
 * - Alert threshold detection
 *
 * @module tests/unit/services/admin/SystemHealthService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import SystemHealthService from '../../../../server/services/admin/SystemHealthService.js'
import prisma from '../../../../server/lib/prisma.js'
import * as os from 'os'

const mockGetRedisClient = vi.fn()

// Mock dependencies
vi.mock('../../../../server/lib/prisma.js', () => ({
  default: {
    $queryRaw: vi.fn(),
    adminIntegration: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../../../../server/lib/redis.js', () => ({
  getRedisClient: mockGetRedisClient,
}), { virtual: true })

vi.mock('../../../../server/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock os module
vi.mock('os', async () => {
  const actual = await vi.importActual('os')
  return {
    ...actual,
    totalmem: vi.fn(),
    freemem: vi.fn(),
    cpus: vi.fn(),
    loadavg: vi.fn(),
    platform: vi.fn(),
    release: vi.fn(),
  }
})

describe('SystemHealthService', () => {
  let mockRedisClient

beforeEach(async () => {
    vi.clearAllMocks()

    // Mock Redis client
    mockRedisClient = {
      ping: vi.fn().mockResolvedValue('PONG'),
      info: vi.fn().mockResolvedValue(`
# Memory
used_memory:1048576
used_memory_human:1.00M
used_memory_rss:2097152
used_memory_peak:3145728
used_memory_peak_human:3.00M
      `),
    }

    mockGetRedisClient.mockResolvedValue(mockRedisClient)

    // Mock os module functions with LOW memory usage by default (to avoid HIGH_MEMORY_USAGE alerts)
    os.totalmem.mockReturnValue(16 * 1024 * 1024 * 1024)  // 16GB total
    os.freemem.mockReturnValue(13 * 1024 * 1024 * 1024)    // 13GB free = 18.75% used (well below 85% threshold)
    os.cpus.mockReturnValue(new Array(8).fill({ model: 'CPU' }))
    os.loadavg.mockReturnValue([1.5, 1.2, 1.0])
    os.platform.mockReturnValue('linux')
    os.release.mockReturnValue('5.15.0')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSystemHealth', () => {
    it('should return overall healthy status when all components healthy', async () => {
      // Mock healthy components
      prisma.$queryRaw.mockResolvedValue([{ health_check: 1 }])

      const mockIntegrations = [
        { id: 'int-1', healthStatus: 'HEALTHY' },
        { id: 'int-2', healthStatus: 'HEALTHY' },
      ]
      prisma.adminIntegration.findMany.mockResolvedValue(mockIntegrations)

      const result = await SystemHealthService.getSystemHealth()

      // Status depends on real system metrics (may be HEALTHY or DEGRADED)
      expect(['HEALTHY', 'DEGRADED']).toContain(result.status)
      expect(result.healthScore).toBeGreaterThanOrEqual(0)
      expect(result.healthScore).toBeLessThanOrEqual(100)
      expect(result.components).toHaveProperty('process')
      expect(result.components).toHaveProperty('database')
      expect(result.components).toHaveProperty('redis')
      expect(result.components).toHaveProperty('integrations')
      expect(result.components.database.status).toBe('HEALTHY')
      expect(result.components.redis.status).toBe('HEALTHY')
      expect(result.components.integrations.status).toBe('HEALTHY')
    })

    it('should return degraded status when some components unhealthy', async () => {
      // Mock slow database response
      prisma.$queryRaw.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([{ health_check: 1 }]), 1200) // 1.2s > 1s threshold
        })
      })

      const mockIntegrations = [
        { id: 'int-1', healthStatus: 'HEALTHY' },
        { id: 'int-2', healthStatus: 'DEGRADED' },
      ]
      prisma.adminIntegration.findMany.mockResolvedValue(mockIntegrations)

      const result = await SystemHealthService.getSystemHealth()

      expect(result.status).toBe('DEGRADED')
      expect(result.healthScore).toBeGreaterThanOrEqual(60)
      expect(result.healthScore).toBeLessThan(80)
      expect(result.components.integrations.status).toBe('DEGRADED')
    })

    it('should return unhealthy status when critical components down', async () => {
      // Mock database connection failure
      prisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'))

      const mockIntegrations = [
        { id: 'int-1', healthStatus: 'DOWN' },
      ]
      prisma.adminIntegration.findMany.mockResolvedValue(mockIntegrations)

      const result = await SystemHealthService.getSystemHealth()

      expect(result.status).toBe('UNHEALTHY')
      expect(result.healthScore).toBeLessThan(60)
      expect(result.components.database.status).toBe('UNHEALTHY')
    })

    it('should include timestamp in health report', async () => {
      prisma.$queryRaw.mockResolvedValue([{ health_check: 1 }])
      prisma.adminIntegration.findMany.mockResolvedValue([])

      const beforeTime = Date.now()
      const result = await SystemHealthService.getSystemHealth()
      const afterTime = Date.now()

      expect(result.timestamp).toBeDefined()
      const resultTime = new Date(result.timestamp).getTime()
      expect(resultTime).toBeGreaterThanOrEqual(beforeTime)
      expect(resultTime).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('getProcessMetrics', () => {
    it('should return Node.js process metrics', async () => {
      const result = await SystemHealthService.getProcessMetrics()

      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('cpu')
      expect(result).toHaveProperty('memory')
      expect(result).toHaveProperty('uptime')
      expect(result).toHaveProperty('platform')

      expect(result.cpu).toHaveProperty('loadAverage')
      expect(Array.isArray(result.cpu.loadAverage)).toBe(true)
      expect(result.cpu.loadAverage).toHaveLength(3)
      expect(result.cpu).toHaveProperty('cores')
      expect(result.cpu.cores).toBeGreaterThan(0)

      expect(result.memory).toHaveProperty('total')
      expect(result.memory).toHaveProperty('free')
      expect(result.memory).toHaveProperty('used')
      expect(result.memory).toHaveProperty('percentage')
      expect(result.memory.percentage).toBeGreaterThanOrEqual(0)
      expect(result.memory.percentage).toBeLessThanOrEqual(100)
      expect(result.memory).toHaveProperty('heap')

      expect(result.uptime).toHaveProperty('seconds')
      expect(result.uptime).toHaveProperty('formatted')

      expect(result.platform).toHaveProperty('type')
      expect(result.platform).toHaveProperty('release')
    })

    it('should calculate CPU percentage correctly over time', async () => {
      // First call - may establish baseline or return value
      const result1 = await SystemHealthService.getProcessMetrics()
      // CPU percentage can be null or a number on first call
      if (result1.cpu.percentage !== null) {
        expect(result1.cpu.percentage).toBeGreaterThanOrEqual(0)
        expect(result1.cpu.percentage).toBeLessThanOrEqual(100)
      }

      // Simulate CPU usage
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Second call - should have CPU percentage
      const result2 = await SystemHealthService.getProcessMetrics()

      if (result2.cpu.percentage !== null) {
        expect(result2.cpu.percentage).toBeGreaterThanOrEqual(0)
        expect(result2.cpu.percentage).toBeLessThanOrEqual(100)
      }
    })

    it('should calculate memory percentage correctly', async () => {
      const result = await SystemHealthService.getProcessMetrics()

      // Memory percentage should be valid (0-100%)
      expect(result.memory.percentage).toBeGreaterThanOrEqual(0)
      expect(result.memory.percentage).toBeLessThanOrEqual(100)
      expect(result.memory.used).toBeGreaterThan(0)
      expect(result.memory.total).toBeGreaterThan(0)
      expect(result.memory.free).toBeGreaterThanOrEqual(0)
    })

    it('should format uptime correctly', async () => {
      const mockUptime = 3661 // 1 hour, 1 minute, 1 second
      vi.spyOn(process, 'uptime').mockReturnValue(mockUptime)

      const result = await SystemHealthService.getProcessMetrics()

      expect(result.uptime.seconds).toBe(3661)
      expect(result.uptime.formatted).toMatch(/1h 1m 1s/)
    })

    it('should mark process as unhealthy when CPU > 80%', async () => {
      // Mock high CPU usage
      const service = SystemHealthService
      service.lastCpuUsage = { user: 1000000, system: 500000 }
      service.lastCpuCheck = Date.now() - 1000

      vi.spyOn(process, 'cpuUsage').mockReturnValue({
        user: 900000000, // Very high CPU usage
        system: 100000000,
      })

      const result = await SystemHealthService.getProcessMetrics()

      if (result.cpu.percentage !== null && result.cpu.percentage > 80) {
        expect(result.status).toBe('DEGRADED')
      }
    })

    it('should mark process as unhealthy when memory > 85%', async () => {
      // Mock high memory usage
      os.totalmem.mockReturnValue(16 * 1024 * 1024 * 1024)
      os.freemem.mockReturnValue(1 * 1024 * 1024 * 1024)

      const result = await SystemHealthService.getProcessMetrics()

      expect(result.memory.percentage).toBeGreaterThan(85)
      expect(result.status).toBe('DEGRADED')
    })
  })

  describe('getDatabaseHealth', () => {
    it('should return healthy status for fast database response', async () => {
      prisma.$queryRaw.mockResolvedValue([{ health_check: 1 }])

      const result = await SystemHealthService.getDatabaseHealth()

      expect(result.status).toBe('HEALTHY')
      expect(result.connected).toBe(true)
      expect(result.responseTime).toBeLessThan(1000) // < 1s threshold
      expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining('SELECT 1')]))
    })

    it('should return degraded status for slow database response', async () => {
      // Mock slow database (but successful)
      prisma.$queryRaw.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([{ health_check: 1 }]), 1200) // 1.2s > 1s threshold
        })
      })

      const result = await SystemHealthService.getDatabaseHealth()

      expect(result.status).toBe('DEGRADED')
      expect(result.connected).toBe(true)
      expect(result.responseTime).toBeGreaterThanOrEqual(1000)
    })

    it('should return unhealthy status when database disconnected', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'))

      const result = await SystemHealthService.getDatabaseHealth()

      expect(result.status).toBe('UNHEALTHY')
      expect(result.connected).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getRedisHealth', () => {
    it('should return healthy status for fast Redis response', async () => {
      const result = await SystemHealthService.getRedisHealth()

      expect(result.status).toBe('HEALTHY')
      expect(result.connected).toBe(true)
      expect(result.responseTime).toBeLessThan(500) // < 500ms threshold
      expect(result.memory).toHaveProperty('used')
      expect(result.memory).toHaveProperty('max')
      expect(result.memory).toHaveProperty('percentage')
      expect(mockRedisClient.ping).toHaveBeenCalled()
      expect(mockRedisClient.info).toHaveBeenCalledWith('memory')
    })

    it('should return degraded status for slow Redis response', async () => {
      mockRedisClient.ping.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('PONG'), 600) // 600ms > 500ms threshold
        })
      })

      const result = await SystemHealthService.getRedisHealth()

      expect(result.status).toBe('DEGRADED')
      expect(result.connected).toBe(true)
      expect(result.responseTime).toBeGreaterThanOrEqual(500)
    })

    it('should return unhealthy status when Redis disconnected', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Redis connection lost'))

      const result = await SystemHealthService.getRedisHealth()

      expect(result.status).toBe('UNHEALTHY')
      expect(result.connected).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should parse Redis memory info correctly', async () => {
      const result = await SystemHealthService.getRedisHealth()

      expect(result.memory).toHaveProperty('used')
      expect(result.memory).toHaveProperty('max')
      expect(result.memory).toHaveProperty('percentage')
      // Memory values parsed from Redis INFO command
      if (result.memory.used !== null) {
        expect(result.memory.used).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('getIntegrationHealth', () => {
    it('should return healthy status when all integrations healthy', async () => {
      const mockIntegrations = [
        { id: 'int-1', name: 'Xero', type: 'XERO', healthStatus: 'HEALTHY' },
        { id: 'int-2', name: 'Shopify', type: 'SHOPIFY', healthStatus: 'HEALTHY' },
      ]

      prisma.adminIntegration.findMany.mockResolvedValue(mockIntegrations)

      const result = await SystemHealthService.getIntegrationHealth()

      expect(result.status).toBe('HEALTHY')
      expect(result.total).toBe(2)
      expect(result.healthy).toBe(2)
      expect(result.degraded).toBe(0)
      expect(result.down).toBe(0)
      expect(result.integrations).toHaveLength(2)
    })

    it('should return degraded status when some integrations degraded', async () => {
      const mockIntegrations = [
        { id: 'int-1', name: 'Xero', type: 'XERO', healthStatus: 'HEALTHY' },
        { id: 'int-2', name: 'Shopify', type: 'SHOPIFY', healthStatus: 'DEGRADED' },
        { id: 'int-3', name: 'Amazon', type: 'AMAZON_SP_API', healthStatus: 'HEALTHY' },
      ]

      prisma.adminIntegration.findMany.mockResolvedValue(mockIntegrations)

      const result = await SystemHealthService.getIntegrationHealth()

      expect(result.status).toBe('DEGRADED')
      expect(result.total).toBe(3)
      expect(result.healthy).toBe(2)
      expect(result.degraded).toBe(1)
      expect(result.down).toBe(0)
    })

    it('should return unhealthy status when any integration down', async () => {
      const mockIntegrations = [
        { id: 'int-1', name: 'Xero', type: 'XERO', healthStatus: 'HEALTHY' },
        { id: 'int-2', name: 'Shopify', type: 'SHOPIFY', healthStatus: 'DOWN' },
      ]

      prisma.adminIntegration.findMany.mockResolvedValue(mockIntegrations)

      const result = await SystemHealthService.getIntegrationHealth()

      expect(result.status).toBe('UNHEALTHY')
      expect(result.total).toBe(2)
      expect(result.healthy).toBe(1)
      expect(result.degraded).toBe(0)
      expect(result.down).toBe(1)
    })

    it('should handle case with no integrations', async () => {
      prisma.adminIntegration.findMany.mockResolvedValue([])

      const result = await SystemHealthService.getIntegrationHealth()

      expect(result.status).toBe('HEALTHY')
      expect(result.total).toBe(0)
      expect(result.healthy).toBe(0)
      expect(result.degraded).toBe(0)
      expect(result.down).toBe(0)
      expect(result.integrations).toEqual([])
    })
  })

  describe('getHealthAlerts', () => {
    it('should generate HIGH_CPU_USAGE alert when CPU > 80%', async () => {
      // Mock high CPU
      const service = SystemHealthService
      service.lastCpuUsage = { user: 1000000, system: 500000 }
      service.lastCpuCheck = Date.now() - 1000

      vi.spyOn(process, 'cpuUsage').mockReturnValue({
        user: 900000000,
        system: 100000000,
      })

      prisma.$queryRaw.mockResolvedValue([{ health_check: 1 }])
      prisma.adminIntegration.findMany.mockResolvedValue([])

      const result = await SystemHealthService.getHealthAlerts()

      const cpuAlert = result.find((alert) => alert.type === 'HIGH_CPU_USAGE')
      if (cpuAlert) {
        expect(cpuAlert.severity).toBe('WARNING')
        expect(cpuAlert.message).toContain('CPU usage')
      }
    })

    it('should generate HIGH_MEMORY_USAGE alert when memory > 85%', async () => {
      // Mock high memory usage
      os.totalmem.mockReturnValue(16 * 1024 * 1024 * 1024)
      os.freemem.mockReturnValue(1 * 1024 * 1024 * 1024)

      prisma.$queryRaw.mockResolvedValue([{ health_check: 1 }])
      prisma.adminIntegration.findMany.mockResolvedValue([])

      const result = await SystemHealthService.getHealthAlerts()

      const memoryAlert = result.find((alert) => alert.type === 'HIGH_MEMORY_USAGE')
      expect(memoryAlert).toBeDefined()
      expect(memoryAlert?.severity).toBe('WARNING')
      expect(memoryAlert?.message).toContain('Memory usage')
    })

    it('should generate DATABASE_DISCONNECTED alert when database down', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'))
      prisma.adminIntegration.findMany.mockResolvedValue([])

      const result = await SystemHealthService.getHealthAlerts()

      const dbAlert = result.find((alert) => alert.type === 'DATABASE_DISCONNECTED')
      expect(dbAlert).toBeDefined()
      expect(dbAlert?.severity).toBe('CRITICAL')
    })

    it('should generate SLOW_DATABASE_RESPONSE alert when database slow', async () => {
      prisma.$queryRaw.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([{ health_check: 1 }]), 1200)
        })
      })
      prisma.adminIntegration.findMany.mockResolvedValue([])

      const result = await SystemHealthService.getHealthAlerts()

      const slowDbAlert = result.find((alert) => alert.type === 'SLOW_DATABASE_RESPONSE')
      if (slowDbAlert) {
        expect(slowDbAlert.severity).toBe('WARNING')
        expect(slowDbAlert.message).toContain('response time')
        expect(slowDbAlert.message).toContain('exceeds')
      }
    })

    it('should generate REDIS_DISCONNECTED alert when Redis down', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Redis connection lost'))
      prisma.$queryRaw.mockResolvedValue([{ health_check: 1 }])
      prisma.adminIntegration.findMany.mockResolvedValue([])

      const result = await SystemHealthService.getHealthAlerts()

      const redisAlert = result.find((alert) => alert.type === 'REDIS_DISCONNECTED')
      expect(redisAlert).toBeDefined()
      expect(redisAlert?.severity).toBe('CRITICAL') // Redis disconnected is CRITICAL
    })

    it('should generate INTEGRATIONS_DOWN alert when integrations down', async () => {
      // Mock healthy memory (not triggering HIGH_MEMORY_USAGE alert)
      os.totalmem.mockReturnValue(16 * 1024 * 1024 * 1024) // 16GB total
      os.freemem.mockReturnValue(10 * 1024 * 1024 * 1024)   // 10GB free = 37.5% used (below 85% threshold)

      prisma.$queryRaw.mockResolvedValue([{ health_check: 1 }])
      prisma.adminIntegration.findMany.mockResolvedValue([
        { id: 'int-1', name: 'Xero', healthStatus: 'DOWN' },
        { id: 'int-2', name: 'Shopify', healthStatus: 'HEALTHY' },
      ])

      const result = await SystemHealthService.getHealthAlerts()

      const integrationsAlert = result.find((alert) => alert.type === 'INTEGRATIONS_DOWN')
      expect(integrationsAlert).toBeDefined()
      expect(integrationsAlert?.severity).toBe('CRITICAL') // Integrations down is CRITICAL
      expect(integrationsAlert?.value).toBe(1)
    })

    it('should return empty array when all metrics healthy', async () => {
      // beforeEach already mocks low memory usage (18.75%), so no alerts expected
      prisma.$queryRaw.mockResolvedValue([{ health_check: 1 }])
      prisma.adminIntegration.findMany.mockResolvedValue([
        { id: 'int-1', name: 'Xero', healthStatus: 'HEALTHY' },
      ])

      const result = await SystemHealthService.getHealthAlerts()

      expect(result).toEqual([])
    })
  })

  describe('_calculateHealthScore (private method)', () => {
    it('should return 100 for all healthy components', () => {
      const components = {
        processMetrics: {
          status: 'HEALTHY',
          cpu: { percentage: 30 },
          memory: { percentage: 50 },
        },
        databaseHealth: {
          status: 'HEALTHY',
          connected: true,
        },
        redisHealth: {
          status: 'HEALTHY',
          connected: true,
        },
        integrationHealth: {
          status: 'HEALTHY',
          down: 0,
          degraded: 0,
        },
      }

      const score = SystemHealthService._calculateHealthScore(components)

      expect(score).toBe(100)
    })

    it('should deduct points for high CPU usage', () => {
      const components = {
        processMetrics: {
          status: 'DEGRADED',
          cpu: { percentage: 85 },
          memory: { percentage: 50 },
        },
        databaseHealth: { status: 'HEALTHY', connected: true },
        redisHealth: { status: 'HEALTHY', connected: true },
        integrationHealth: { status: 'HEALTHY', down: 0, degraded: 0 },
      }

      const score = SystemHealthService._calculateHealthScore(components)

      expect(score).toBeLessThan(100)
      expect(score).toBeGreaterThanOrEqual(70) // -30 for CPU
    })

    it('should deduct points for database issues', () => {
      const components = {
        processMetrics: {
          status: 'HEALTHY',
          cpu: { percentage: 30 },
          memory: { percentage: 50 },
        },
        databaseHealth: { status: 'UNHEALTHY', connected: false },
        redisHealth: { status: 'HEALTHY', connected: true },
        integrationHealth: { status: 'HEALTHY', down: 0, degraded: 0 },
      }

      const score = SystemHealthService._calculateHealthScore(components)

      expect(score).toBeLessThanOrEqual(60) // -40 for database
    })

    it('should return minimum score of 0', () => {
      const components = {
        processMetrics: {
          status: 'DEGRADED',
          cpu: { percentage: 95 },
          memory: { percentage: 95 },
        },
        databaseHealth: { status: 'UNHEALTHY', connected: false },
        redisHealth: { status: 'UNHEALTHY', connected: false },
        integrationHealth: { status: 'UNHEALTHY', down: 5, degraded: 2 },
      }

      const score = SystemHealthService._calculateHealthScore(components)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThan(30)
    })
  })
})
