import express from 'express'
import { requireAdmin } from '../../middleware/adminAuth.js'
import { requireMfa } from '../../middleware/adminMfa.js'
import { audit } from '../../middleware/adminAudit.js'
import {
  getDashboard,
  listUsers,
  createUser,
  listApprovals,
  submitApproval,
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

router.use('/queues', requireMfa, audit, (req, res) => {
  res.status(501).json({ message: 'Admin queues endpoints not implemented yet.' })
})

router.use('/audit', audit, (req, res) => {
  res.status(501).json({ message: 'Admin audit endpoints not implemented yet.' })
})

router.use('/system-health', requireMfa, audit, (req, res) => {
  res.status(501).json({ message: 'Admin system health endpoints not implemented yet.' })
})

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
