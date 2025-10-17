import express from 'express'

const router = express.Router()

const notConfigured = {
  error: 'Enterprise data ingestion API not configured',
  message:
    'Connect the production data pipeline (ETL/ELT or MCP ingestion) before using this endpoint.',
  requiredIntegrations: [
    'ETL/ELT pipeline for manufacturing datasets',
    'Object storage or data warehouse for uploaded files',
    'Validation service to process imported records',
  ],
}

router.get('/manufacturing', (_req, res) => {
  res.status(503).json(notConfigured)
})

router.get('/manufacturing/:type', (_req, res) => {
  res.status(503).json(notConfigured)
})

router.post('/upload', (_req, res) => {
  res.status(503).json(notConfigured)
})

router.get('/export', (_req, res) => {
  res.status(503).json(notConfigured)
})

router.post('/add', (_req, res) => {
  res.status(503).json(notConfigured)
})

export default router
