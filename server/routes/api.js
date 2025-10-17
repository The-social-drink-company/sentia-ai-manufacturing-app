import express from 'express'

const router = express.Router()

const deprecatedMessage = {
  error: 'Legacy API endpoints disabled',
  message:
    'Use the production routes under /api/enterprise or /api/financial provided by the real data controllers.',
  documentation: '/api/docs',
}

router.get('/dashboard/summary', (_req, res) => res.status(410).json(deprecatedMessage))
router.get('/dashboard/metrics', (_req, res) => res.status(410).json(deprecatedMessage))
router.get('/dashboard/kpis', (_req, res) => res.status(410).json(deprecatedMessage))
router.get('/dashboard/status', (_req, res) => res.status(410).json(deprecatedMessage))
router.get('/working-capital/history', (_req, res) => res.status(410).json(deprecatedMessage))
router.get('/financial/cash-flow', (_req, res) => res.status(410).json(deprecatedMessage))
router.get('/mcp/status', (_req, res) => res.status(410).json(deprecatedMessage))
router.get('/ai/status', (_req, res) => res.status(410).json(deprecatedMessage))
router.post('/ai/insights', (_req, res) => res.status(410).json(deprecatedMessage))
router.post('/forecasting/enhanced', (_req, res) => res.status(410).json(deprecatedMessage))
router.get('/health/database', (_req, res) => res.status(410).json(deprecatedMessage))

export default router
