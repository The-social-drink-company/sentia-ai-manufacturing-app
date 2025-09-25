/**
 * API Routes Index
 * Central registration point for all API routes
 */

import financialRoutes from './financial.js';
import workingCapitalExpertRoutes from './working-capital-expert.js';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


export function setupAPIRoutes(app) {
  logDebug('Setting up API routes...');

  // Financial routes
  try {
    app.use('/api/financial', financialRoutes);
    logDebug('  ✓ Financial routes registered at /api/financial');
  } catch (error) {
    logError('  ✗ Failed to register financial routes:', error.message);
  }

  // Working Capital Expert routes
  try {
    app.use('/api/working-capital-expert', workingCapitalExpertRoutes);
    logDebug('  ✓ Working Capital Expert routes registered at /api/working-capital-expert');
  } catch (error) {
    logError('  ✗ Failed to register working capital expert routes:', error.message);
  }

  // Working Capital endpoint (from financial routes)
  app.get('/api/working-capital/overview', async (req, res) => {
    try {
      // Fetch from financial routes
      const response = await fetch(`http://localhost:${process.env.PORT 0}/api/financial/working-capital`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      logError('Working capital overview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch working capital data. Please ensure database connection is active.',
        message: error.message
      });
    }
  });

  // Test endpoint to verify API is working
  app.get('/api/test', (req, res) => {
    res.json({
      success: true,
      message: 'API routes are working',
      timestamp: new Date().toISOString()
    });
  });

  logDebug('API routes setup complete');
}

export default setupAPIRoutes;