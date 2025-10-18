import express from 'express'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import sseService from '../services/sse/index.cjs'

const {
  streamChannel,
  streamJobChannel,
  streamMultiChannel,
  emitAdminBroadcast,
  getStatusSummary,
} = sseService

const router = express.Router()

router.use(authMiddleware)

router.get('/dashboard', (req, res) => streamChannel('dashboard', req, res))
router.get('/production', (req, res) => streamChannel('production', req, res))
router.get('/inventory', (req, res) => streamChannel('inventory', req, res))
router.get('/alerts', (req, res) => streamChannel('alerts', req, res))
router.get('/forecast', (req, res) => streamChannel('forecast', req, res))
router.get('/working-capital', (req, res) => streamChannel('working-capital', req, res))
router.get('/jobs/:jobId', (req, res) => streamJobChannel(req.params.jobId, req, res))
router.get('/subscribe', (req, res) => streamMultiChannel(req, res))

router.get('/status', requireRole('admin', 'manager'), (_req, res) => {
  res.json(getStatusSummary())
})

router.post(
  '/broadcast',
  requireRole('admin'),
  express.json(),
  (req, res) => {
    const {
      channel = 'system',
      event = 'admin:broadcast',
      data = {},
    } = req.body ?? {}

    emitAdminBroadcast(channel, event, data, {
      userId: req.user?.id ?? null,
    })

    res.json({ success: true })
  }
)

export default router
