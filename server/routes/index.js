import { logInfo } from '../../services/observability/structuredLogger.js'

import apiRoutes from './api.js'
import authRoutes from './auth.js'
import dataRoutes from './data.js'
import sseRoutes from './sse.js'
import adminRoutes from './admin/index.js'

export function setupRoutes(app) {
  logInfo('Setting up routes')

  // API routes
  app.use('/api/auth', authRoutes)
  app.use('/api/data', dataRoutes)
  app.use('/api', apiRoutes)
  app.use('/admin', adminRoutes)

  // Server-Sent Events
  app.use('/api/events', sseRoutes)

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    })
  })

  // API documentation endpoint
  app.get('/api/docs', (req, res) => {
    res.json({
      endpoints: {
        auth: {
          'POST /api/auth/signin': 'User authentication',
          'POST /api/auth/signout': 'User logout',
        },
        data: {
          'GET /api/data/manufacturing': '503 - data ingestion pipeline not connected',
          'POST /api/data/upload': '503 - data ingestion pipeline not connected',
        },
        sse: {
          'GET /api/events/live-data': '503 - real-time telemetry not configured',
        },
        health: {
          'GET /api/health': 'Health check',
          'GET /api/docs': 'API documentation',
        },
      },
    })
  })
}
