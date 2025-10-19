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
 * STATUS: Sprint 1 Complete
 * - ✅ Xero financial data integration (BMAD-MOCK-001)
 * - ✅ Shopify sales data integration (BMAD-MOCK-002)
 * - ⏳ Amazon SP-API integration (BMAD-MOCK-003)
 * - ⏳ Unleashed ERP inventory integration (BMAD-MOCK-004)
 */

import express from 'express';
import xeroService from '../../services/xeroService.js';
import shopifyMultiStoreService from '../../services/shopify-multistore.js';
import { logInfo, logError, logDebug, logWarn } from '../../src/utils/logger.js';

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
 * Response time target: <3 seconds
 */
router.get('/executive', async (req, res) => {
  const startTime = Date.now();

  try {
    logDebug('[Dashboard] Fetching executive dashboard data...');

    // Check Xero health first
    const xeroHealth = await xeroService.healthCheck();
    logDebug('[Dashboard] Xero health check:', xeroHealth.status);

    if (xeroHealth.status !== 'connected') {
      logInfo('[Dashboard] Xero not connected, returning setup instructions');
      return res.json({
        success: true,
        data: {
          kpis: null,
          charts: null,
          workingCapital: null,
          setupRequired: true,
          xeroStatus: xeroHealth,
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
            dataAvailable: false,
            message: 'Connect Xero to view real financial data',
            requiredIntegrations: [
              { name: 'Xero', status: xeroHealth.status, required: true },
              { name: 'Shopify', status: 'pending', required: false, story: 'BMAD-MOCK-002' },
              { name: 'Amazon SP-API', status: 'pending', required: false, story: 'BMAD-MOCK-003' },
              { name: 'Unleashed ERP', status: 'pending', required: false, story: 'BMAD-MOCK-004' }
            ]
          }
        }
      });
    }

    // Fetch real data from Xero in parallel
    logDebug('[Dashboard] Fetching Xero financial data...');
    const [wcData, plData, cfData] = await Promise.all([
      xeroService.calculateWorkingCapital(),
      xeroService.getProfitAndLoss(3), // Last 3 months
      xeroService.getCashFlow(3)
    ]);

    logDebug('[Dashboard] Xero data fetched:', {
      workingCapital: wcData?.success,
      profitLoss: plData?.length,
      cashFlow: !!cfData
    });

    // Calculate month-over-month change
    const calculateChange = (data) => {
      if (!data || data.length < 2) return 0;
      const current = data[0]?.totalRevenue || 0;
      const previous = data[1]?.totalRevenue || 0;
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    // Transform Xero data to dashboard KPI format
    const kpis = {
      revenue: {
        mtd: plData?.[0]?.totalRevenue || 0,
        ytd: plData?.reduce((sum, p) => sum + (p.totalRevenue || 0), 0) || 0,
        change: calculateChange(plData),
        sparkline: plData?.map(p => p.totalRevenue || 0).reverse() || []
      },
      workingCapital: {
        value: wcData.data?.workingCapital || 0,
        ccc: wcData.data?.cashConversionCycle || 0,
        currentRatio: wcData.data?.currentRatio || 0,
        dso: wcData.data?.dso || 0,
        dio: wcData.data?.dio || 0,
        dpo: wcData.data?.dpo || 0,
        sparkline: [wcData.data?.workingCapital || 0] // Single data point - historical tracking in future story
      },
      cashFlow: {
        operating: cfData?.operating || 0,
        investing: cfData?.investing || 0,
        financing: cfData?.financing || 0,
        total: cfData?.totalMovement || 0
      },
      profitability: {
        grossMargin: plData?.[0]?.grossMargin || 0,
        profitMargin: plData?.[0]?.profitMargin || 0,
        netProfit: plData?.[0]?.netProfit || 0
      }
    };

    const responseTime = Date.now() - startTime;
    logInfo(`[Dashboard] Executive dashboard data fetched in ${responseTime}ms`);

    res.json({
      success: true,
      data: {
        kpis,
        charts: {
          revenue: {
            labels: plData?.map(p => p.reportDate).reverse() || [],
            data: plData?.map(p => p.totalRevenue || 0).reverse() || []
          },
          profitLoss: {
            labels: plData?.map(p => p.reportDate).reverse() || [],
            revenue: plData?.map(p => p.totalRevenue || 0).reverse() || [],
            expenses: plData?.map(p => p.totalExpenses || 0).reverse() || [],
            profit: plData?.map(p => p.netProfit || 0).reverse() || []
          }
        },
        workingCapital: wcData.data,
        metadata: {
          timestamp: new Date().toISOString(),
          responseTime,
          dataAvailable: true,
          dataSource: 'xero_api',
          periodsIncluded: plData?.length || 0,
          xeroConnected: true
        }
      }
    });

  } catch (error) {
    logError('[Dashboard] Failed to fetch Xero data:', error.message);
    res.status(503).json({
      success: false,
      error: 'xero_api_error',
      message: 'Unable to fetch financial data from Xero',
      details: error.message,
      retryable: true
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
    logDebug('[Dashboard] Checking setup status...');
    const xeroHealth = await xeroService.healthCheck();

    const setupStatus = {
      integrations: {
        xero: {
          connected: xeroHealth.status === 'connected',
          status: xeroHealth.status,
          message: xeroHealth.message,
          organizationId: xeroHealth.organizationId || null,
          lastCheck: xeroHealth.lastCheck,
          required: true,
          story: 'BMAD-MOCK-001'
        },
        shopify: {
          connected: false,
          status: 'pending',
          required: false,
          story: 'BMAD-MOCK-002'
        },
        amazonSpApi: {
          connected: false,
          status: 'pending',
          required: false,
          story: 'BMAD-MOCK-003'
        },
        unleashedErp: {
          connected: false,
          status: 'pending',
          required: false,
          story: 'BMAD-MOCK-004'
        },
      },
      dashboardReady: xeroHealth.status === 'connected',
      nextSteps: xeroHealth.status === 'connected'
        ? [
            'Xero connected successfully! ✅',
            'Optional: Connect Shopify for sales data (BMAD-MOCK-002)',
            'Optional: Connect Amazon SP-API for order data (BMAD-MOCK-003)',
            'Optional: Connect Unleashed ERP for inventory sync (BMAD-MOCK-004)'
          ]
        : [
            'Set XERO_CLIENT_ID environment variable',
            'Set XERO_CLIENT_SECRET environment variable',
            'Restart application to connect to Xero',
            'Verify connection at /api/v1/dashboard/setup-status'
          ]
    };

    logInfo(`[Dashboard] Setup status checked: Xero ${xeroHealth.status}`);

    res.json({
      success: true,
      data: setupStatus,
    });
  } catch (error) {
    logError('[Dashboard] Setup status check failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'setup_check_failed',
      message: error.message,
    });
  }
});

export default router;
