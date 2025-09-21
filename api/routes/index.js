/**
 * API Routes Index
 * Central registration point for all API routes
 */

import financialRoutes from './financial.js';
import workingCapitalExpertRoutes from './working-capital-expert.js';

export function setupAPIRoutes(app) {
  console.log('Setting up API routes...');

  // Financial routes
  try {
    app.use('/api/financial', financialRoutes);
    console.log('  ✓ Financial routes registered at /api/financial');
  } catch (error) {
    console.error('  ✗ Failed to register financial routes:', error.message);
  }

  // Working Capital Expert routes
  try {
    app.use('/api/working-capital-expert', workingCapitalExpertRoutes);
    console.log('  ✓ Working Capital Expert routes registered at /api/working-capital-expert');
  } catch (error) {
    console.error('  ✗ Failed to register working capital expert routes:', error.message);
  }

  // Working Capital endpoint (from financial routes)
  app.get('/api/working-capital/overview', async (req, res) => {
    try {
      // Fetch from financial routes
      const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/financial/working-capital`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Working capital overview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch working capital data',
        fallback: true,
        data: {
          current: 789200,
          projected: 850000,
          optimizationPct: 15,
          trend: '+7.5%',
          lastUpdated: new Date().toISOString(),
          alerts: []
        }
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

  console.log('API routes setup complete');
}

export default setupAPIRoutes;