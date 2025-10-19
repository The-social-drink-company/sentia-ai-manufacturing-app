/**
 * Dashboard API Endpoints
 *
 * Provides aggregated data for the executive dashboard:
 * - KPI summary data (6 key metrics)
 * - Time series data for charts (sales, production, inventory)
 * - Working capital snapshot
 * - Recent alerts and notifications
 *
 * Target: <3 second response time for full dashboard load
 *
 * STATUS: Awaiting real data integration (EPIC-002)
 * - BMAD-MOCK-001: Xero financial data integration
 * - BMAD-MOCK-002: Shopify sales data integration
 * - BMAD-MOCK-003: Amazon SP-API integration
 * - BMAD-MOCK-004: Unleashed ERP inventory integration
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/v1/dashboard/executive
 *
 * Returns complete dashboard data including:
 * - KPIs (revenue, production, inventory, CCC, OTD, forecast accuracy)
 * - Chart data (sales/revenue, production output, inventory levels)
 * - Working capital summary
 * - Recent alerts
 *
 * Response time target: <500ms
 */
router.get('/executive', async (req, res) => {
  const startTime = Date.now();

  try {
    // Return empty state with setup instructions
    // Real data integration pending: EPIC-002
    const dashboardData = {
      kpis: null,
      charts: null,
      workingCapital: null,
      recentAlerts: [],
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        dataAvailable: false,
        setupRequired: true,
        message: 'Dashboard data not available. Connect your data sources to get started.',
        requiredIntegrations: [
          { name: 'Xero', status: 'pending', story: 'BMAD-MOCK-001' },
          { name: 'Shopify', status: 'pending', story: 'BMAD-MOCK-002' },
          { name: 'Amazon SP-API', status: 'pending', story: 'BMAD-MOCK-003' },
          { name: 'Unleashed ERP', status: 'pending', story: 'BMAD-MOCK-004' }
        ]
      },
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('[Dashboard API] Error fetching dashboard data:', error);
    res.status(503).json({
      success: false,
      error: 'Dashboard service unavailable',
      message: 'Unable to fetch dashboard data. Please ensure data integrations are configured.',
      retryable: true,
    });
  }
});

/**
 * GET /api/v1/dashboard/kpis
 *
 * Returns only KPI data (for quick updates)
 */
router.get('/kpis', async (req, res) => {
  try {
    res.json({
      success: true,
      data: null,
      message: 'KPI data not available. Connect your financial and operational data sources.',
      setupRequired: true,
    });
  } catch (error) {
    console.error('[Dashboard API] Error fetching KPI data:', error);
    res.status(503).json({
      success: false,
      error: 'KPI service unavailable',
      message: error.message,
      retryable: true,
    });
  }
});

/**
 * GET /api/v1/dashboard/setup-status
 *
 * Returns integration setup status for dashboard
 */
router.get('/setup-status', async (req, res) => {
  try {
    const setupStatus = {
      integrations: {
        xero: { connected: false, required: true, story: 'BMAD-MOCK-001' },
        shopify: { connected: false, required: true, story: 'BMAD-MOCK-002' },
        amazonSpApi: { connected: false, required: true, story: 'BMAD-MOCK-003' },
        unleashedErp: { connected: false, required: true, story: 'BMAD-MOCK-004' },
      },
      dashboardReady: false,
      nextSteps: [
        'Configure Xero financial data integration',
        'Connect Shopify sales channels',
        'Set up Amazon SP-API credentials',
        'Integrate Unleashed ERP for inventory data',
      ],
    };

    res.json({
      success: true,
      data: setupStatus,
    });
  } catch (error) {
    console.error('[Dashboard API] Error fetching setup status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch setup status',
      message: error.message,
    });
  }
});

export default router;
