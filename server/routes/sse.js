import express from 'express';

const router = express.Router();

const notConfiguredResponse = {
  error: 'Real-time streaming not configured',
  message: 'Connect the production telemetry pipeline (Kafka/Redis stream or MCP feed) before enabling SSE.',
  requiredIntegrations: [
    'Real-time telemetry source (e.g. Kafka topic, Redis stream, or MCP feed)',
    'Monitoring/observability pipeline to publish live events',
    'Authentication/authorization layer for live data access'
  ]
};

router.get('/live-data', (_req, res) => {
  res.status(503).json(notConfiguredResponse);
});

router.post('/trigger/:eventType', express.json(), (_req, res) => {
  res.status(503).json(notConfiguredResponse);
});

router.get('/clients', (_req, res) => {
  res.status(503).json({ ...notConfiguredResponse, clients: [] });
});

export const sendSSEEvent = () => {
  throw new Error('SSE streaming is not configured. Connect the real-time pipeline before broadcasting events.');
};

export default router;
