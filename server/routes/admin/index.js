import express from 'express'
import { requireAdmin } from '../../middleware/adminAuth.js'
import { requireMfa } from '../../middleware/adminMfa.js'
import { audit } from '../../middleware/adminAudit.js'
import { getDashboard, listUsers, createUser, listApprovals, submitApproval } from '../../controllers/admin/index.js'

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

router.use('/feature-flags', requireMfa, audit, (req, res) => {
  res.status(501).json({ message: 'Admin feature flags endpoints not implemented yet.' })
})

router.use('/integrations', requireMfa, audit, (req, res) => {
  res.status(501).json({ message: 'Admin integrations endpoints not implemented yet.' })
})

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

router
  .route('/approvals')
  .all(requireMfa, audit)
  .get(listApprovals)
  .post(submitApproval)

export default router
