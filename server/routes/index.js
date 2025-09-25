import authRoutes from './auth.js';
import apiRoutes from './api.js';
import dataRoutes from './data.js';
import sseRoutes from './sse.js';
import { logInfo } from '../../services/observability/structuredLogger.js';

export function setupRoutes(app) {
  logInfo('Setting up routes');
  
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/data', dataRoutes);
  app.use('/api', apiRoutes);
  
  // Server-Sent Events
  app.use('/api/events', sseRoutes);
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });
  
  // API documentation endpoint
  app.get('/api/docs', (req, res) => {
    res.json({
      endpoints: {
        auth: {
          'POST /api/auth/signin': 'User authentication',
          'POST /api/auth/signout': 'User logout'
        },
        data: {
          'GET /api/data/manufacturing': 'Get manufacturing data',
          'POST /api/data/upload': 'Upload data files',
          'GET /api/data/export': 'Export data'
        },
        sse: {
          'GET /api/events': 'Server-sent events stream'
        },
        health: {
          'GET /api/health': 'Health check',
          'GET /api/docs': 'API documentation'
        }
      }
    });
  });
}