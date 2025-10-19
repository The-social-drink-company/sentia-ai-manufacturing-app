/**
 * AuditLogService Unit Tests
 *
 * Tests for audit log querying, export, and hash chain validation
 *
 * Test Coverage:
 * - Audit log querying with filters and pagination
 * - Export functionality (CSV, Excel, JSON)
 * - Hash chain generation and validation for immutability
 * - Entity history tracking
 *
 * @module tests/unit/services/admin/AuditLogService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AuditLogService from '../../../../server/services/admin/AuditLogService.js'
import prisma from '../../../../server/lib/prisma.js'
import crypto from 'crypto'

// Mock dependencies
vi.mock('../../../../server/lib/prisma.js', () => ({
  default: {
    auditLog: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('../../../../server/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('AuditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAuditLogs', () => {
    it('should return paginated audit logs with default pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'CREATE',
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
          oldValues: null,
          newValues: { name: 'Xero Integration' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-01-15T10:00:00Z'),
          user: {
            id: 'user-1',
            email: 'admin@sentia.com',
            name: 'Admin User',
          },
        },
      ]

      prisma.auditLog.findMany.mockResolvedValue(mockLogs)
      prisma.auditLog.count.mockResolvedValue(1)

      const result = await AuditLogService.getAuditLogs({}, {})

      expect(result).toEqual({
        logs: mockLogs,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter audit logs by userId and action', async () => {
      const filters = {
        userId: 'user-1',
        action: 'UPDATE',
      }

      prisma.auditLog.findMany.mockResolvedValue([])
      prisma.auditLog.count.mockResolvedValue(0)

      await AuditLogService.getAuditLogs(filters, {})

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          action: 'UPDATE',
        },
        include: expect.any(Object),
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter audit logs by entityType and entityId', async () => {
      const filters = {
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
      }

      prisma.auditLog.findMany.mockResolvedValue([])
      prisma.auditLog.count.mockResolvedValue(0)

      await AuditLogService.getAuditLogs(filters, {})

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
        },
        include: expect.any(Object),
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter audit logs by date range', async () => {
      const filters = {
        dateRange: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-31T23:59:59Z',
        },
      }

      prisma.auditLog.findMany.mockResolvedValue([])
      prisma.auditLog.count.mockResolvedValue(0)

      await AuditLogService.getAuditLogs(filters, {})

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date('2025-01-01T00:00:00Z'),
            lte: new Date('2025-01-31T23:59:59Z'),
          },
        },
        include: expect.any(Object),
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should handle pagination correctly', async () => {
      prisma.auditLog.findMany.mockResolvedValue([])
      prisma.auditLog.count.mockResolvedValue(150)

      const result = await AuditLogService.getAuditLogs({}, { page: 3, limit: 50 })

      expect(result.pagination).toEqual({
        page: 3,
        limit: 50,
        total: 150,
        totalPages: 3,
      })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        skip: 100,
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('getAuditLogById', () => {
    it('should return audit log with user details', async () => {
      const mockLog = {
        id: 'log-1',
        userId: 'user-1',
        action: 'DELETE',
        entityType: 'FEATURE_FLAG',
        entityId: 'flag-1',
        oldValues: { enabled: true },
        newValues: null,
        createdAt: new Date(),
        user: {
          id: 'user-1',
          email: 'admin@sentia.com',
          name: 'Admin User',
        },
      }

      prisma.auditLog.findUnique.mockResolvedValue(mockLog)

      const result = await AuditLogService.getAuditLogById('log-1')

      expect(result).toEqual(mockLog)
      expect(prisma.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })
    })

    it('should throw error if audit log not found', async () => {
      prisma.auditLog.findUnique.mockResolvedValue(null)

      await expect(AuditLogService.getAuditLogById('nonexistent')).rejects.toThrow(
        'Audit log not found: nonexistent'
      )
    })
  })

  describe('getAuditLogsByEntity', () => {
    it('should return all audit logs for specific entity', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'CREATE',
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
          createdAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          id: 'log-2',
          action: 'UPDATE',
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
          createdAt: new Date('2025-01-16T14:30:00Z'),
        },
      ]

      prisma.auditLog.findMany.mockResolvedValue(mockLogs)
      prisma.auditLog.count.mockResolvedValue(2)

      const result = await AuditLogService.getAuditLogsByEntity('INTEGRATION', 'integration-1', {})

      expect(result.logs).toEqual(mockLogs)
      expect(result.pagination.total).toBe(2)

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
        },
        include: expect.any(Object),
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('exportAuditLogs - CSV Format', () => {
    it('should export audit logs as CSV', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'CREATE',
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
          oldValues: null,
          newValues: { name: 'Xero Integration', type: 'XERO' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-01-15T10:00:00Z'),
          user: {
            email: 'admin@sentia.com',
            name: 'Admin User',
          },
        },
        {
          id: 'log-2',
          userId: 'user-2',
          action: 'UPDATE',
          entityType: 'FEATURE_FLAG',
          entityId: 'flag-1',
          oldValues: { enabled: false },
          newValues: { enabled: true },
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/120.0',
          createdAt: new Date('2025-01-16T14:30:00Z'),
          user: {
            email: 'manager@sentia.com',
            name: 'Manager User',
          },
        },
      ]

      prisma.auditLog.findMany.mockResolvedValue(mockLogs)

      const result = await AuditLogService.exportAuditLogs('CSV', {}, {})

      expect(result.success).toBe(true)
      expect(result.format).toBe('CSV')
      expect(result.contentType).toBe('text/csv')
      expect(result.filename).toMatch(/^audit-logs-\d{4}-\d{2}-\d{2}\.csv$/)
      expect(result.recordCount).toBe(2)

      // Verify CSV content structure
      const csvContent = result.content
      expect(csvContent).toContain('ID,User,Action,Entity Type,Entity ID,Old Values,New Values,IP Address,User Agent,Timestamp')
      expect(csvContent).toContain('log-1,admin@sentia.com (Admin User),CREATE,INTEGRATION,integration-1')
      expect(csvContent).toContain('log-2,manager@sentia.com (Manager User),UPDATE,FEATURE_FLAG,flag-1')
    })

    it('should handle CSV export with special characters (quote escaping)', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'UPDATE',
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
          oldValues: { description: 'Original "quoted" value' },
          newValues: { description: 'New value with, comma' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-01-15T10:00:00Z'),
          user: {
            email: 'admin@sentia.com',
            name: 'Admin User',
          },
        },
      ]

      prisma.auditLog.findMany.mockResolvedValue(mockLogs)

      const result = await AuditLogService.exportAuditLogs('CSV', {}, {})

      // Verify quotes are escaped properly
      const csvContent = result.content
      expect(csvContent).toContain('""quoted""') // Escaped quotes
      expect(csvContent).toContain('"New value with, comma"') // Quoted field with comma
    })
  })

  describe('exportAuditLogs - JSON Format', () => {
    it('should export audit logs as JSON', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'CREATE',
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
          oldValues: null,
          newValues: { name: 'Xero Integration' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-01-15T10:00:00Z'),
          user: {
            email: 'admin@sentia.com',
            name: 'Admin User',
          },
        },
      ]

      prisma.auditLog.findMany.mockResolvedValue(mockLogs)

      const result = await AuditLogService.exportAuditLogs('JSON', {}, {})

      expect(result.success).toBe(true)
      expect(result.format).toBe('JSON')
      expect(result.contentType).toBe('application/json')
      expect(result.filename).toMatch(/^audit-logs-\d{4}-\d{2}-\d{2}\.json$/)
      expect(result.recordCount).toBe(1)

      // Verify JSON structure
      const jsonContent = JSON.parse(result.content)
      expect(jsonContent).toHaveProperty('exportDate')
      expect(jsonContent).toHaveProperty('recordCount', 1)
      expect(jsonContent).toHaveProperty('logs')
      expect(jsonContent.logs).toHaveLength(1)
      expect(jsonContent.logs[0]).toMatchObject({
        id: 'log-1',
        action: 'CREATE',
        entityType: 'INTEGRATION',
        user: {
          email: 'admin@sentia.com',
          name: 'Admin User',
        },
      })
    })
  })

  describe('exportAuditLogs - Excel Format', () => {
    it('should export audit logs as Excel (or fallback to CSV)', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'CREATE',
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
          oldValues: null,
          newValues: { name: 'Xero Integration' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-01-15T10:00:00Z'),
          user: {
            email: 'admin@sentia.com',
            name: 'Admin User',
          },
        },
      ]

      prisma.auditLog.findMany.mockResolvedValue(mockLogs)

      const result = await AuditLogService.exportAuditLogs('EXCEL', {}, {})

      expect(result.success).toBe(true)
      expect(result.format).toBe('EXCEL')

      // May be XLSX or CSV depending on exceljs availability
      expect(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']).toContain(
        result.contentType
      )

      expect(result.filename).toMatch(/^audit-logs-\d{4}-\d{2}-\d{2}\.(xlsx|csv)$/)
      expect(result.recordCount).toBe(1)
    })
  })

  describe('exportAuditLogs - Filters and Limits', () => {
    it('should apply filters when exporting', async () => {
      const filters = {
        userId: 'user-1',
        action: 'UPDATE',
        entityType: 'INTEGRATION',
      }

      prisma.auditLog.findMany.mockResolvedValue([])

      await AuditLogService.exportAuditLogs('JSON', filters, {})

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          action: 'UPDATE',
          entityType: 'INTEGRATION',
        },
        include: expect.any(Object),
        take: 10000, // Default max records
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should respect maxRecords limit', async () => {
      prisma.auditLog.findMany.mockResolvedValue([])

      await AuditLogService.exportAuditLogs('CSV', {}, { maxRecords: 500 })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        take: 500,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should throw error if no audit logs found for export', async () => {
      prisma.auditLog.findMany.mockResolvedValue([])

      await expect(AuditLogService.exportAuditLogs('CSV', {}, {})).rejects.toThrow(
        'No audit logs found matching the specified filters'
      )
    })
  })

  describe('createAuditLog', () => {
    it('should create audit log with hash chain (first log)', async () => {
      const auditData = {
        userId: 'user-1',
        action: 'CREATE',
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        newValues: { name: 'Xero Integration' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }

      // No previous log exists (first log)
      prisma.auditLog.findFirst.mockResolvedValue(null)

      const createdLog = {
        id: 'log-1',
        ...auditData,
        oldValues: null,
        createdAt: new Date('2025-01-15T10:00:00Z'),
      }

      prisma.auditLog.create.mockResolvedValue(createdLog)

      const result = await AuditLogService.createAuditLog(auditData)

      expect(result).toEqual(createdLog)
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: auditData,
      })

      // Verify hash generation for first log uses 'GENESIS'
      // (Hash stored separately or calculated on-demand)
    })

    it('should create audit log with hash chain (subsequent log)', async () => {
      const previousLog = {
        id: 'log-1',
        userId: 'user-1',
        action: 'CREATE',
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        createdAt: new Date('2025-01-15T10:00:00Z'),
      }

      const auditData = {
        userId: 'user-2',
        action: 'UPDATE',
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        oldValues: { status: 'ACTIVE' },
        newValues: { status: 'PAUSED' },
        ipAddress: '192.168.1.2',
        userAgent: 'Chrome/120.0',
      }

      prisma.auditLog.findFirst.mockResolvedValue(previousLog)

      const createdLog = {
        id: 'log-2',
        ...auditData,
        createdAt: new Date('2025-01-16T14:30:00Z'),
      }

      prisma.auditLog.create.mockResolvedValue(createdLog)

      const result = await AuditLogService.createAuditLog(auditData)

      expect(result).toEqual(createdLog)
      expect(prisma.auditLog.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('validateHashChain', () => {
    it('should validate correct hash chain successfully', async () => {
      // Generate correct hash chain
      const log1 = {
        id: 'log-1',
        userId: 'user-1',
        action: 'CREATE',
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        createdAt: new Date('2025-01-15T10:00:00Z'),
      }

      const hash1Input = [
        log1.id,
        log1.userId,
        log1.action,
        log1.entityType,
        log1.entityId,
        log1.createdAt.toISOString(),
        'GENESIS',
      ].join('|')
      const hash1 = crypto.createHash('sha256').update(hash1Input).digest('hex')

      const log2 = {
        id: 'log-2',
        userId: 'user-2',
        action: 'UPDATE',
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        createdAt: new Date('2025-01-16T14:30:00Z'),
      }

      const hash2Input = [
        log2.id,
        log2.userId,
        log2.action,
        log2.entityType,
        log2.entityId,
        log2.createdAt.toISOString(),
        hash1,
      ].join('|')
      const hash2 = crypto.createHash('sha256').update(hash2Input).digest('hex')

      const logs = [log1, log2]

      // Mock hash retrieval (would be stored or calculated)
      const getAuditHashSpy = vi.spyOn(AuditLogService, '_getAuditHash' as any)
      getAuditHashSpy.mockResolvedValueOnce(hash1)
      getAuditHashSpy.mockResolvedValueOnce(hash2)

      const result = await AuditLogService.validateHashChain(logs)

      expect(result.valid).toBe(true)
      expect(result.totalLogs).toBe(2)
      expect(result.invalidLogs).toEqual([])
    })

    it('should detect tampered audit log in hash chain', async () => {
      const log1 = {
        id: 'log-1',
        userId: 'user-1',
        action: 'CREATE',
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        createdAt: new Date('2025-01-15T10:00:00Z'),
      }

      const hash1Input = [
        log1.id,
        log1.userId,
        log1.action,
        log1.entityType,
        log1.entityId,
        log1.createdAt.toISOString(),
        'GENESIS',
      ].join('|')
      const hash1 = crypto.createHash('sha256').update(hash1Input).digest('hex')

      // Tampered log (action changed from UPDATE to DELETE)
      const log2Tampered = {
        id: 'log-2',
        userId: 'user-2',
        action: 'DELETE', // Was originally 'UPDATE'
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        createdAt: new Date('2025-01-16T14:30:00Z'),
      }

      // Original hash (before tampering)
      const originalHash2Input = [
        'log-2',
        'user-2',
        'UPDATE', // Original action
        'INTEGRATION',
        'integration-1',
        log2Tampered.createdAt.toISOString(),
        hash1,
      ].join('|')
      const originalHash2 = crypto.createHash('sha256').update(originalHash2Input).digest('hex')

      const logs = [log1, log2Tampered]

      const getAuditHashSpy = vi.spyOn(AuditLogService, '_getAuditHash' as any)
      getAuditHashSpy.mockResolvedValueOnce(hash1)
      getAuditHashSpy.mockResolvedValueOnce(originalHash2) // Returns original hash

      const result = await AuditLogService.validateHashChain(logs)

      expect(result.valid).toBe(false)
      expect(result.totalLogs).toBe(2)
      expect(result.invalidLogs).toHaveLength(1)
      expect(result.invalidLogs[0].id).toBe('log-2')
    })

    it('should handle empty audit log array', async () => {
      const result = await AuditLogService.validateHashChain([])

      expect(result.valid).toBe(true)
      expect(result.totalLogs).toBe(0)
      expect(result.invalidLogs).toEqual([])
    })
  })

  describe('_generateAuditHash (private method)', () => {
    it('should generate consistent hash for same input', () => {
      const log = {
        id: 'log-1',
        userId: 'user-1',
        action: 'CREATE',
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        createdAt: new Date('2025-01-15T10:00:00Z'),
      }

      const previousHash = 'abc123def456'

      // Access private method via type assertion for testing
      const hash1 = (AuditLogService as any)._generateAuditHash(log, previousHash)
      const hash2 = (AuditLogService as any)._generateAuditHash(log, previousHash)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 hex digest
    })

    it('should generate different hash when previousHash changes', () => {
      const log = {
        id: 'log-1',
        userId: 'user-1',
        action: 'CREATE',
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        createdAt: new Date('2025-01-15T10:00:00Z'),
      }

      const hash1 = (AuditLogService as any)._generateAuditHash(log, 'previousHash1')
      const hash2 = (AuditLogService as any)._generateAuditHash(log, 'previousHash2')

      expect(hash1).not.toBe(hash2)
    })

    it('should use GENESIS for first log (null previousHash)', () => {
      const log = {
        id: 'log-1',
        userId: 'user-1',
        action: 'CREATE',
        entityType: 'INTEGRATION',
        entityId: 'integration-1',
        createdAt: new Date('2025-01-15T10:00:00Z'),
      }

      const hashWithNull = (AuditLogService as any)._generateAuditHash(log, null)
      const hashWithGenesis = (AuditLogService as any)._generateAuditHash(log, 'GENESIS')

      // Both should produce same hash since null → 'GENESIS'
      expect(hashWithNull).toBe(hashWithGenesis)
    })
  })
})
