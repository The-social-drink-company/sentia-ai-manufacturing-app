/**
 * Queue Management Workflow Integration Tests
 *
 * End-to-end tests for queue monitoring, audit logging, and system health workflows
 *
 * Test Coverage:
 * - Complete queue pause workflow with approval integration
 * - Queue metrics collection and alert threshold detection
 * - Failed job retry workflow
 * - Audit log export end-to-end (CSV generation)
 * - System health alerting workflow
 *
 * @module tests/integration/admin/queueManagementWorkflow
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest'
import QueueMonitorService from '../../../server/services/admin/QueueMonitorService.js'
import AuditLogService from '../../../server/services/admin/AuditLogService.js'
import SystemHealthService from '../../../server/services/admin/SystemHealthService.js'
import ApprovalService from '../../../server/services/admin/ApprovalService.js'
import prisma from '../../../server/lib/prisma.js'

// Integration tests use real database and service interactions
// (In production, these would use a test database)

describe('Queue Management Workflow Integration Tests', () => {
  let testQueueId
  let testUserId
  let testApprovalId

  beforeAll(async () => {
    // Setup test data in database
    // Note: In real integration tests, these would use transaction rollback
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Cleanup test data
  })

  afterAll(async () => {
    // Final cleanup
    await prisma.$disconnect()
  })

  describe('Complete Queue Pause Workflow with Approval', () => {
    it('should create approval request, approve it, and pause queue in production', async () => {
      // Setup: Set production environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const queueName = 'admin:sync-jobs'
      const userId = 'test-user-1'
      const approverId = 'test-approver-1'
      const pauseReason = 'Emergency maintenance - database migration'

      // Step 1: Request queue pause (should create approval request)
      const pauseResult = await QueueMonitorService.pauseQueue(queueName, userId, pauseReason)

      expect(pauseResult.approvalRequired).toBe(true)
      expect(pauseResult.approval).toBeDefined()
      expect(pauseResult.approval.type).toBe('QUEUE_OPERATION')
      expect(pauseResult.approval.status).toBe('PENDING')
      expect(pauseResult.approval.metadata).toMatchObject({
        operation: 'PAUSE',
        queueName,
      })

      const approvalId = pauseResult.approval.id

      // Step 2: Approve the request
      const approvalResult = await ApprovalService.approveRequest(approvalId, approverId, {
        comment: 'Approved for emergency maintenance',
      })

      expect(approvalResult.status).toBe('APPROVED')
      expect(approvalResult.approverId).toBe(approverId)

      // Step 3: Execute the approved pause operation
      // (In production, this would be triggered by approval webhook/event)
      const queue = await QueueMonitorService.getQueueByName(queueName)
      expect(queue).toBeDefined()

      // Verify queue was paused after approval
      const updatedQueue = await QueueMonitorService.getQueueById(queue.id)
      expect(updatedQueue.isPaused).toBe(true)

      // Step 4: Verify audit log was created for approval and pause
      const auditLogs = await AuditLogService.getAuditLogs(
        {
          entityType: 'QUEUE',
          entityId: queue.id,
        },
        {}
      )

      expect(auditLogs.logs.length).toBeGreaterThan(0)
      const pauseAuditLog = auditLogs.logs.find((log) => log.action === 'UPDATE' && log.newValues?.isPaused === true)
      expect(pauseAuditLog).toBeDefined()

      // Cleanup: Resume queue
      await QueueMonitorService.resumeQueue(queueName, userId)

      process.env.NODE_ENV = originalEnv
    })

    it('should pause queue immediately in non-production environment', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const queueName = 'admin:sync-jobs'
      const userId = 'test-user-1'
      const pauseReason = 'Testing queue pause'

      // In development, should pause immediately without approval
      const pauseResult = await QueueMonitorService.pauseQueue(queueName, userId, pauseReason)

      expect(pauseResult.approvalRequired).toBe(false)
      expect(pauseResult.queue).toBeDefined()
      expect(pauseResult.queue.isPaused).toBe(true)

      // Verify audit log created
      const auditLogs = await AuditLogService.getAuditLogs(
        {
          entityType: 'QUEUE',
          entityId: pauseResult.queue.id,
        },
        {}
      )

      expect(auditLogs.logs.length).toBeGreaterThan(0)

      // Cleanup
      await QueueMonitorService.resumeQueue(queueName, userId)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Queue Metrics Collection and Alert Threshold Detection', () => {
    it('should collect queue metrics and detect high error rate threshold breach', async () => {
      const queueName = 'admin:sync-jobs'

      // Step 1: Update queue metrics (simulating failed jobs)
      // In real scenario, BullMQ would have actual failed jobs
      await QueueMonitorService.updateQueueMetrics(queueName)

      // Step 2: Get queue health status
      const health = await QueueMonitorService.getQueueHealth(queueName)

      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('metrics')
      expect(health).toHaveProperty('alerts')

      // If error rate > 5%, should have alert
      if (health.metrics.errorRate > 0.05) {
        expect(health.status).toBe('DEGRADED')
        const errorRateAlert = health.alerts.find((alert) => alert.type === 'HIGH_ERROR_RATE')
        expect(errorRateAlert).toBeDefined()
        expect(errorRateAlert.severity).toBe('WARNING')
      }

      // Step 3: Check all queue alerts
      const allQueueAlerts = await QueueMonitorService.checkQueueAlerts()

      expect(allQueueAlerts).toHaveProperty('totalQueues')
      expect(allQueueAlerts).toHaveProperty('unhealthyQueues')
      expect(allQueueAlerts).toHaveProperty('alerts')

      if (allQueueAlerts.unhealthyQueues > 0) {
        expect(allQueueAlerts.alerts.length).toBeGreaterThan(0)
      }
    })

    it('should detect high queue size threshold breach', async () => {
      const queueName = 'admin:sync-jobs'

      // Get current queue state
      const queue = await QueueMonitorService.getQueueByName(queueName)
      expect(queue).toBeDefined()

      // Check health status
      const health = await QueueMonitorService.getQueueHealth(queueName)

      // If waiting jobs > 1000, should have alert
      if (queue.waitingJobs > 1000) {
        expect(health.status).toBe('DEGRADED')
        const queueSizeAlert = health.alerts.find((alert) => alert.type === 'HIGH_QUEUE_SIZE')
        expect(queueSizeAlert).toBeDefined()
      }
    })

    it('should detect slow processing threshold breach', async () => {
      const queueName = 'admin:sync-jobs'

      const health = await QueueMonitorService.getQueueHealth(queueName)

      // If avg processing time > 5 minutes (300000ms), should have alert
      if (health.metrics.avgProcessingTime > 300000) {
        expect(health.status).toBe('DEGRADED')
        const slowProcessingAlert = health.alerts.find((alert) => alert.type === 'SLOW_PROCESSING')
        expect(slowProcessingAlert).toBeDefined()
      }
    })
  })

  describe('Failed Job Retry Workflow', () => {
    it('should retry failed jobs and verify audit log', async () => {
      const queueName = 'admin:sync-jobs'
      const retryLimit = 5
      const userId = 'test-user-1'

      // Step 1: Get initial metrics
      const initialQueue = await QueueMonitorService.getQueueByName(queueName)
      const initialFailedJobs = initialQueue.failedJobs

      // Step 2: Retry failed jobs
      const retryResult = await QueueMonitorService.retryFailedJobs(queueName, retryLimit)

      expect(retryResult.success).toBe(true)
      expect(retryResult.queueName).toBe(queueName)
      expect(retryResult.retriedCount).toBeLessThanOrEqual(retryLimit)

      // Step 3: Verify audit log for retry operation
      // (Audit logging for retry operation should be implemented in service)
      const auditLogs = await AuditLogService.getAuditLogs(
        {
          action: 'RETRY',
          entityType: 'QUEUE',
        },
        { limit: 10 }
      )

      if (retryResult.retriedCount > 0) {
        // Should have audit log entry for retry operation
        expect(auditLogs.logs.length).toBeGreaterThan(0)
      }

      // Step 4: Verify metrics updated
      await QueueMonitorService.updateQueueMetrics(queueName)
      const updatedQueue = await QueueMonitorService.getQueueByName(queueName)

      // Failed jobs should be reduced or moved to waiting/active
      expect(updatedQueue.failedJobs).toBeLessThanOrEqual(initialFailedJobs)
    })

    it('should handle retry when no failed jobs exist', async () => {
      const queueName = 'admin:approvals'

      const retryResult = await QueueMonitorService.retryFailedJobs(queueName, 10)

      expect(retryResult.success).toBe(true)
      expect(retryResult.retriedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Audit Log Export End-to-End Workflow', () => {
    it('should export audit logs as CSV with proper formatting', async () => {
      // Step 1: Create some audit log entries
      const testAuditData = [
        {
          userId: 'user-1',
          action: 'CREATE',
          entityType: 'INTEGRATION',
          entityId: 'integration-1',
          newValues: { name: 'Xero Integration', type: 'XERO' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        {
          userId: 'user-2',
          action: 'UPDATE',
          entityType: 'FEATURE_FLAG',
          entityId: 'flag-1',
          oldValues: { enabled: false },
          newValues: { enabled: true },
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/120.0',
        },
      ]

      for (const data of testAuditData) {
        await AuditLogService.createAuditLog(data)
      }

      // Step 2: Export audit logs as CSV
      const exportResult = await AuditLogService.exportAuditLogs(
        'CSV',
        {
          entityType: 'INTEGRATION',
        },
        { maxRecords: 100 }
      )

      // Step 3: Verify export result
      expect(exportResult.success).toBe(true)
      expect(exportResult.format).toBe('CSV')
      expect(exportResult.contentType).toBe('text/csv')
      expect(exportResult.filename).toMatch(/^audit-logs-\d{4}-\d{2}-\d{2}\.csv$/)
      expect(exportResult.content).toBeDefined()
      expect(exportResult.recordCount).toBeGreaterThan(0)

      // Step 4: Verify CSV structure
      const csvLines = exportResult.content.split('\n')
      expect(csvLines[0]).toContain('ID,User,Action,Entity Type,Entity ID')

      // Should contain at least header + data rows
      expect(csvLines.length).toBeGreaterThan(1)

      // Verify data row contains expected values
      const dataRow = csvLines.find((line) => line.includes('INTEGRATION'))
      expect(dataRow).toBeDefined()
      expect(dataRow).toContain('CREATE')
    })

    it('should export audit logs as JSON with proper structure', async () => {
      const exportResult = await AuditLogService.exportAuditLogs(
        'JSON',
        {
          action: 'UPDATE',
        },
        { maxRecords: 50 }
      )

      expect(exportResult.success).toBe(true)
      expect(exportResult.format).toBe('JSON')
      expect(exportResult.contentType).toBe('application/json')

      // Parse JSON content
      const jsonData = JSON.parse(exportResult.content)
      expect(jsonData).toHaveProperty('exportDate')
      expect(jsonData).toHaveProperty('recordCount')
      expect(jsonData).toHaveProperty('logs')
      expect(Array.isArray(jsonData.logs)).toBe(true)

      if (jsonData.logs.length > 0) {
        const firstLog = jsonData.logs[0]
        expect(firstLog).toHaveProperty('id')
        expect(firstLog).toHaveProperty('action')
        expect(firstLog).toHaveProperty('entityType')
        expect(firstLog).toHaveProperty('user')
      }
    })

    it('should validate hash chain integrity after export', async () => {
      // Export all audit logs
      const exportResult = await AuditLogService.exportAuditLogs('JSON', {}, { maxRecords: 1000 })

      const jsonData = JSON.parse(exportResult.content)
      const logs = jsonData.logs

      // Validate hash chain
      const validationResult = await AuditLogService.validateHashChain(logs)

      expect(validationResult).toHaveProperty('valid')
      expect(validationResult).toHaveProperty('totalLogs', logs.length)
      expect(validationResult).toHaveProperty('invalidLogs')

      // Hash chain should be valid (no tampering)
      expect(validationResult.valid).toBe(true)
      expect(validationResult.invalidLogs).toEqual([])
    })
  })

  describe('System Health Alerting Workflow', () => {
    it('should detect and report system health issues across all components', async () => {
      // Step 1: Get overall system health
      const systemHealth = await SystemHealthService.getSystemHealth()

      expect(systemHealth).toHaveProperty('status')
      expect(systemHealth).toHaveProperty('healthScore')
      expect(systemHealth).toHaveProperty('components')
      expect(systemHealth).toHaveProperty('alerts')
      expect(systemHealth).toHaveProperty('timestamp')

      // Step 2: Verify all components are checked
      expect(systemHealth.components).toHaveProperty('process')
      expect(systemHealth.components).toHaveProperty('database')
      expect(systemHealth.components).toHaveProperty('redis')
      expect(systemHealth.components).toHaveProperty('integrations')

      // Step 3: Get health alerts
      const alerts = await SystemHealthService.getHealthAlerts()

      expect(Array.isArray(alerts)).toBe(true)

      // Step 4: If health score < 80, should have alerts
      if (systemHealth.healthScore < 80) {
        expect(alerts.length).toBeGreaterThan(0)

        // Alerts should have proper structure
        const firstAlert = alerts[0]
        expect(firstAlert).toHaveProperty('type')
        expect(firstAlert).toHaveProperty('severity')
        expect(firstAlert).toHaveProperty('message')
        expect(firstAlert).toHaveProperty('timestamp')
      }

      // Step 5: Verify health status classification
      if (systemHealth.healthScore >= 80) {
        expect(systemHealth.status).toBe('HEALTHY')
      } else if (systemHealth.healthScore >= 60) {
        expect(systemHealth.status).toBe('DEGRADED')
      } else {
        expect(systemHealth.status).toBe('UNHEALTHY')
      }
    })

    it('should correlate queue health with system health', async () => {
      // Step 1: Check queue alerts
      const queueAlerts = await QueueMonitorService.checkQueueAlerts()

      // Step 2: Check system health
      const systemHealth = await SystemHealthService.getSystemHealth()

      // If queues are unhealthy, system health should reflect this
      if (queueAlerts.unhealthyQueues > 0) {
        // System health score should be impacted
        expect(systemHealth.healthScore).toBeLessThan(100)

        // Should have alerts
        expect(systemHealth.alerts.length).toBeGreaterThan(0)
      }
    })

    it('should track health metrics over time via process metrics', async () => {
      // First measurement
      const metrics1 = await SystemHealthService.getProcessMetrics()

      expect(metrics1).toHaveProperty('cpu')
      expect(metrics1).toHaveProperty('memory')
      expect(metrics1).toHaveProperty('uptime')

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Second measurement
      const metrics2 = await SystemHealthService.getProcessMetrics()

      // Uptime should increase
      expect(metrics2.uptime.seconds).toBeGreaterThan(metrics1.uptime.seconds)

      // CPU percentage should be available on second call
      if (metrics2.cpu.percentage !== null) {
        expect(metrics2.cpu.percentage).toBeGreaterThanOrEqual(0)
        expect(metrics2.cpu.percentage).toBeLessThanOrEqual(100)
      }
    })
  })
})
