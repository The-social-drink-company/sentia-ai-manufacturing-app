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
    // TODO: Replace with real data fetching from services
    // For now, return structured mock data that components expect

    const dashboardData = {
      kpis: generateKPIData(),
      charts: {
        salesRevenue: generateSalesRevenueData(),
        productionOutput: generateProductionOutputData(),
        inventoryLevels: generateInventoryLevelsData(),
      },
      workingCapital: generateWorkingCapitalData(),
      recentAlerts: generateRecentAlerts(),
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime: null, // Will be set below
      },
    };

    const responseTime = Date.now() - startTime;
    dashboardData.metadata.responseTime = responseTime;

    // Log performance warning if response time exceeds target
    if (responseTime > 500) {
      console.warn(`[Dashboard API] Response time: ${responseTime}ms (target: <500ms)`);
    }

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('[Dashboard API] Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message,
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
    const kpiData = generateKPIData();

    res.json({
      success: true,
      data: kpiData,
    });
  } catch (error) {
    console.error('[Dashboard API] Error fetching KPI data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KPI data',
      message: error.message,
    });
  }
});

/**
 * Helper Functions to Generate Dashboard Data
 *
 * TODO: Replace these with real data fetching from:
 * - Shopify API (sales/revenue)
 * - Production database (manufacturing data)
 * - Inventory management system
 * - Financial services (working capital)
 * - Forecasting engine (accuracy metrics)
 */

function generateKPIData() {
  const now = new Date();

  return {
    revenue: {
      today: 95000,
      mtd: 1850000,
      ytd: 18500000,
      target: 100000,
      change: 12.5,
      sparkline: generateSparkline(30, 80000, 110000),
    },
    production: {
      units: 12500,
      target: 13000,
      oee: 87.3,
      sparkline: generateSparkline(30, 11000, 14000),
    },
    inventory: {
      value: 425000,
      units: 8450,
      skus: 9,
      change: -3.2,
      sparkline: generateSparkline(30, 400000, 450000),
    },
    ccc: {
      days: 52,
      dio: 35,
      dso: 28,
      dpo: 11,
      sparkline: generateSparkline(30, 48, 58),
    },
    otd: {
      rate: 94.5,
      onTime: 189,
      total: 200,
      change: 2.1,
      sparkline: generateSparkline(30, 92, 96),
    },
    forecast: {
      accuracy: 88.2,
      mape: 11.8,
      models: 4,
      sparkline: generateSparkline(30, 85, 92),
    },
  };
}

function generateSalesRevenueData() {
  const data = [];
  const now = new Date();

  // Generate 90 days of data
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(80000 + Math.random() * 40000 + Math.sin(i / 7) * 15000),
      orders: Math.floor(150 + Math.random() * 100 + Math.sin(i / 7) * 30),
    });
  }

  return data;
}

function generateProductionOutputData() {
  const data = [];
  const now = new Date();

  // Generate 90 days of data
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    const baseOutput = 12000;
    const variation = Math.random() * 3000;
    const unitsProduced = Math.floor(baseOutput + variation);
    const target = 13000;

    data.push({
      date: date.toISOString().split('T')[0],
      unitsProduced,
      target,
      targetPercent: Math.round((unitsProduced / target) * 100),
      oee: Math.round(75 + Math.random() * 20),
      oeeTarget: 85,
    });
  }

  return data;
}

function generateInventoryLevelsData() {
  const timeSeriesData = [];
  const now = new Date();

  // Generate 90 days of inventory time series
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    timeSeriesData.push({
      date: date.toISOString().split('T')[0],
      inventoryValue: Math.floor(400000 + Math.random() * 60000 + Math.sin(i / 14) * 40000),
      totalUnits: Math.floor(8000 + Math.random() * 1200 + Math.sin(i / 14) * 800),
      reorderPoint: 600,
      turnoverRate: Math.round(30 + Math.random() * 10),
    });
  }

  // Generate SKU-level data
  const skuData = [
    { sku: 'PROD-001', currentStock: 1200, reorderPoint: 800 },
    { sku: 'PROD-002', currentStock: 980, reorderPoint: 900 },
    { sku: 'PROD-003', currentStock: 750, reorderPoint: 700 },
    { sku: 'PROD-004', currentStock: 650, reorderPoint: 800 },
    { sku: 'PROD-005', currentStock: 1100, reorderPoint: 750 },
    { sku: 'PROD-006', currentStock: 580, reorderPoint: 600 },
    { sku: 'PROD-007', currentStock: 420, reorderPoint: 650 },
    { sku: 'PROD-008', currentStock: 890, reorderPoint: 550 },
    { sku: 'PROD-009', currentStock: 680, reorderPoint: 500 },
  ];

  return {
    timeSeries: timeSeriesData,
    skuData,
  };
}

function generateWorkingCapitalData() {
  return {
    ccc: {
      value: 52,
      status: 'good',
      components: {
        dio: 35,
        dso: 28,
        dpo: 11,
      },
    },
    runway: {
      months: 8.5,
      cashBalance: 425000,
      burnRate: 50000,
      projection: generateRunwayProjection(),
    },
    breaches: [
      {
        month: 7,
        date: new Date(Date.now() + 7 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectedBalance: -15000,
        deficit: 15000,
        severity: 'warning',
      },
    ],
    mitigationActions: [
      {
        id: 'accelerate-collections',
        title: 'Accelerate Collections',
        description: 'Reduce DSO by 5 days',
        impact: 15000,
      },
      {
        id: 'extend-payables',
        title: 'Extend Payables',
        description: 'Negotiate 15-day extension',
        impact: 12000,
      },
      {
        id: 'optimize-inventory',
        title: 'Optimize Inventory',
        description: 'Reduce DIO by 3 days',
        impact: 8500,
      },
    ],
  };
}

function generateRunwayProjection() {
  const projection = [];
  let balance = 425000;
  const burnRate = 50000;

  for (let i = 0; i < 12; i++) {
    balance -= burnRate;
    projection.push({
      month: i,
      balance,
    });
  }

  return projection;
}

function generateRecentAlerts() {
  return [
    {
      id: 'alert-1',
      type: 'warning',
      title: 'Low Inventory: PROD-007',
      message: 'Stock level below reorder point',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-2',
      type: 'info',
      title: 'Production Target Achieved',
      message: 'Daily production goal exceeded by 8%',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-3',
      type: 'critical',
      title: 'Cash Runway Warning',
      message: 'Projected cash deficit in 7 months',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function generateSparkline(points, min, max) {
  const data = [];
  for (let i = 0; i < points; i++) {
    data.push(Math.floor(min + Math.random() * (max - min)));
  }
  return data;
}

export default router;
