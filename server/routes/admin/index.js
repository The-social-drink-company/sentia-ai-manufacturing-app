import express from 'express'
import { requireAdmin } from '../../middleware/adminAuth.js'
import { requireMfa } from '../../middleware/adminMfa.js'
import { audit } from '../../middleware/adminAudit.js'
import {
  getDashboard,
  listUsers,
  createUser,
  getApprovalRequests,
  createApprovalRequest,
  approveRequest,
  rejectRequest,
  getApprovalHistory,
  requestMFACode,
  verifyMFACode,
  getFeatureFlags,
  createFeatureFlag,
  toggleFeatureFlag,
  getIntegrations,
  getIntegrationById,
  testIntegration,
  syncIntegration,
  pauseIntegration,
  resumeIntegration,
  getQueues,
  getQueueById,
  pauseQueue,
  resumeQueue,
  retryFailedJobs,
  cleanQueue,
  getAuditLogs,
  getAuditLogById,
  exportAuditLogs,
  getSystemHealth,
  getProcessMetrics,
  getHealthAlerts,
} from '../../controllers/admin/index.js'

const router = express.Router()

router.use(requireAdmin)

router.get('/dashboard', getDashboard)

router
  .route('/users')
  .all(requireMfa, audit)
  .get(listUsers)
  .post(createUser)

router.use('/roles', requireMfa, audit, (req, res) => {
  res.status(501).json({ message: 'Admin roles endpoints not implemented yet.' })
})

// Feature Flags endpoints
router
  .route('/feature-flags')
  .all(requireMfa, audit)
  .get(getFeatureFlags)
  .post(createFeatureFlag)

router
  .route('/feature-flags/:id/toggle')
  .all(requireMfa, audit)
  .post(toggleFeatureFlag)

// Integrations endpoints
router
  .route('/integrations')
  .all(requireMfa, audit)
  .get(getIntegrations)

router
  .route('/integrations/:id')
  .all(requireMfa, audit)
  .get(getIntegrationById)

router
  .route('/integrations/:id/test')
  .all(requireMfa, audit)
  .post(testIntegration)

router
  .route('/integrations/:id/sync')
  .all(requireMfa, audit)
  .post(syncIntegration)

router
  .route('/integrations/:id/pause')
  .all(requireMfa, audit)
  .post(pauseIntegration)

router
  .route('/integrations/:id/resume')
  .all(requireMfa, audit)
  .post(resumeIntegration)

// Queues endpoints
router
  .route('/queues')
  .all(requireMfa, audit)
  .get(getQueues)

router
  .route('/queues/:id')
  .all(requireMfa, audit)
  .get(getQueueById)

router
  .route('/queues/:id/pause')
  .all(requireMfa, audit)
  .post(pauseQueue)

router
  .route('/queues/:id/resume')
  .all(requireMfa, audit)
  .post(resumeQueue)

router
  .route('/queues/:id/retry')
  .all(requireMfa, audit)
  .post(retryFailedJobs)

router
  .route('/queues/:id/clean')
  .all(requireMfa, audit)
  .post(cleanQueue)

// Audit Logs endpoints
router
  .route('/audit-logs')
  .all(audit)
  .get(getAuditLogs)

router
  .route('/audit-logs/:id')
  .all(audit)
  .get(getAuditLogById)

router
  .route('/audit-logs/export')
  .all(requireMfa, audit)
  .post(exportAuditLogs)

// System Health endpoints
router
  .route('/system-health')
  .all(audit)
  .get(getSystemHealth)

router
  .route('/system-health/process')
  .all(audit)
  .get(getProcessMetrics)

router
  .route('/system-health/alerts')
  .all(audit)
  .get(getHealthAlerts)

router.use('/environment', requireMfa, audit, (req, res) => {
  res.status(501).json({ message: 'Admin environment endpoints not implemented yet.' })
})

// MFA endpoints (no MFA required to request/verify MFA codes)
router.route('/mfa/request').all(audit).post(requestMFACode)

router.route('/mfa/verify').all(audit).post(verifyMFACode)

// Approval endpoints
router
  .route('/approvals')
  .all(requireMfa, audit)
  .get(getApprovalRequests)
  .post(createApprovalRequest)

router
  .route('/approvals/:id/approve')
  .all(requireMfa, audit)
  .post(approveRequest)

router
  .route('/approvals/:id/reject')
  .all(requireMfa, audit)
  .post(rejectRequest)

router.route('/approvals/:id/history').all(audit).get(getApprovalHistory)

export default router
