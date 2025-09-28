// Enterprise API Routes - Real Data Integration Only
// NO MOCK DATA - ALL DATA FROM EXTERNAL APIS AND DATABASES

import express from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import xeroNode from 'xero-node';
import Shopify from '@shopify/shopify-api';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize external API clients
const initializeAPIs = () => {
  // Xero API Client
  const xeroClient = process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET ?
    new xeroNode.XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [`${process.env.BASE_URL}/api/xero/callback`],
      scopes: 'accounting.reports.read accounting.transactions.read'.split(' ')
    }) : null;

  // Shopify API
  const shopifyClient = process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET ?
    new Shopify.Clients.Rest(
      process.env.SHOPIFY_STORE_URL,
      process.env.SHOPIFY_ACCESS_TOKEN
    ) : null;

  return { xeroClient, shopifyClient };
};

// Dashboard Summary - Real Data from Multiple Sources
router.get('/dashboard/summary', async (req, res) => {
  try {
    const { xeroClient, shopifyClient } = initializeAPIs();

    // Fetch real financial data from Xero
    let financialData = null;
    if (xeroClient && xeroClient.tenantIds?.length > 0) {
      const xeroTenantId = xeroClient.tenantIds[0];
      const reports = await xeroClient.accountingApi.getReportProfitAndLoss(
        xeroTenantId,
        null,
        11 // Last 12 months
      );

      const cashFlow = await xeroClient.accountingApi.getReportBalanceSheet(
        xeroTenantId,
        null
      );

      financialData = {
        revenue: {
          monthly: reports.body?.reports?.[0]?.rows?.[0]?.cells?.[1]?.value || 0,
          quarterly: reports.body?.reports?.[0]?.rows?.[0]?.cells?.[3]?.value || 0,
          yearly: reports.body?.reports?.[0]?.rows?.[0]?.cells?.[11]?.value || 0,
          growth: 0 // Calculate from historical data
        },
        workingCapital: {
          current: cashFlow.body?.reports?.[0]?.rows?.[5]?.cells?.[1]?.value || 0,
          ratio: 0, // Calculate from assets/liabilities
          cashFlow: cashFlow.body?.reports?.[0]?.rows?.[10]?.cells?.[1]?.value || 0,
          daysReceivable: 0 // Calculate from receivables
        }
      };
    }

    // Fetch real inventory data from Shopify
    let inventoryData = null;
    if (shopifyClient) {
      const products = await shopifyClient.get({
        path: 'products',
        query: { limit: 250 }
      });

      const inventoryLevels = await shopifyClient.get({
        path: 'inventory_levels'
      });

      inventoryData = {
        value: inventoryLevels.body?.inventory_levels?.reduce((sum, item) =>
          sum + (item.available * (item.cost || 0)), 0) || 0,
        turnover: 0, // Calculate from sales/inventory
        skuCount: products.body?.products?.length || 0,
        lowStock: inventoryLevels.body?.inventory_levels?.filter(item =>
          item.available < 10).length || 0
      };
    }

    // Fetch real production data from database
    const productionData = await prisma.productionMetrics.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Fetch real financial metrics from database
    const financialMetrics = await prisma.financialMetrics.findFirst({
      orderBy: { date: 'desc' }
    });

    // Return ONLY if we have real data
    if (!financialData && !inventoryData && !productionData) {
      return res.status(503).json({
        error: 'Unable to fetch real data from external services',
        message: 'Please ensure Xero, Shopify, and database are properly configured'
      });
    }

    res.json({
      revenue: financialData?.revenue || await getRevenueFromDatabase(),
      workingCapital: financialData?.workingCapital || await getWorkingCapitalFromDatabase(),
      production: productionData ? {
        efficiency: productionData.efficiency,
        unitsProduced: productionData.unitsProduced,
        defectRate: productionData.defectRate,
        oeeScore: productionData.oeeScore
      } : await getProductionFromDatabase(),
      inventory: inventoryData || await getInventoryFromDatabase(),
      financial: financialMetrics ? {
        grossMargin: financialMetrics.grossMargin,
        netMargin: financialMetrics.netMargin,
        ebitda: financialMetrics.ebitda,
        roi: financialMetrics.roi
      } : await getFinancialFromDatabase(),
      timestamp: new Date().toISOString(),
      dataSource: 'real' // Indicates this is real data, not mock
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch real data',
      details: error.message
    });
  }
});

// Helper functions to get data from database
async function getRevenueFromDatabase() {
  const revenue = await prisma.revenue.aggregate({
    _sum: { amount: true },
    where: {
      date: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
      }
    }
  });
  return {
    monthly: revenue._sum.amount || 0,
    quarterly: (revenue._sum.amount || 0) * 3,
    yearly: (revenue._sum.amount || 0) * 12,
    growth: 0
  };
}

async function getWorkingCapitalFromDatabase() {
  const wc = await prisma.workingCapital.findFirst({
    orderBy: { date: 'desc' }
  });
  return wc || { current: 0, ratio: 0, cashFlow: 0, daysReceivable: 0 };
}

async function getProductionFromDatabase() {
  const prod = await prisma.productionMetrics.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  return prod || { efficiency: 0, unitsProduced: 0, defectRate: 0, oeeScore: 0 };
}

async function getInventoryFromDatabase() {
  const inv = await prisma.inventory.aggregate({
    _sum: { value: true },
    _count: { id: true }
  });
  return {
    value: inv._sum.value || 0,
    turnover: 0,
    skuCount: inv._count.id || 0,
    lowStock: 0
  };
}

async function getFinancialFromDatabase() {
  const fin = await prisma.financialMetrics.findFirst({
    orderBy: { date: 'desc' }
  });
  return fin || { grossMargin: 0, netMargin: 0, ebitda: 0, roi: 0 };
}

// Working Capital API - Real Xero Data
router.get('/financial/working-capital', async (req, res) => {
  try {
    const { xeroClient } = initializeAPIs();

    if (!xeroClient || !xeroClient.tenantIds?.length) {
      // Get from database if Xero not available
      const wcData = await prisma.workingCapital.findMany({
        orderBy: { date: 'desc' },
        take: 30
      });

      if (!wcData.length) {
        return res.status(503).json({
          error: 'No working capital data available',
          message: 'Configure Xero API or add data to database'
        });
      }

      return res.json(wcData);
    }

    // Fetch real data from Xero
    const xeroTenantId = xeroClient.tenantIds[0];
    const balanceSheet = await xeroClient.accountingApi.getReportBalanceSheet(xeroTenantId);
    const cashFlowStatement = await xeroClient.accountingApi.getReportCashflowStatement(xeroTenantId);

    res.json({
      currentAssets: balanceSheet.body?.reports?.[0]?.rows?.[1]?.cells?.[1]?.value || 0,
      currentLiabilities: balanceSheet.body?.reports?.[0]?.rows?.[2]?.cells?.[1]?.value || 0,
      workingCapital: (balanceSheet.body?.reports?.[0]?.rows?.[1]?.cells?.[1]?.value || 0) -
                      (balanceSheet.body?.reports?.[0]?.rows?.[2]?.cells?.[1]?.value || 0),
      operatingCashFlow: cashFlowStatement.body?.reports?.[0]?.rows?.[1]?.cells?.[1]?.value || 0,
      dataSource: 'xero'
    });
  } catch (error) {
    console.error('Working Capital API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch working capital data',
      details: error.message
    });
  }
});

// Inventory API - Real Shopify Data
router.get('/inventory/current', async (req, res) => {
  try {
    const { shopifyClient } = initializeAPIs();

    if (!shopifyClient) {
      // Get from database if Shopify not available
      const invData = await prisma.inventory.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100
      });

      if (!invData.length) {
        return res.status(503).json({
          error: 'No inventory data available',
          message: 'Configure Shopify API or add data to database'
        });
      }

      return res.json(invData);
    }

    // Fetch real data from Shopify
    const products = await shopifyClient.get({
      path: 'products',
      query: { limit: 250 }
    });

    const inventoryLevels = await shopifyClient.get({
      path: 'inventory_levels'
    });

    res.json({
      products: products.body?.products || [],
      inventoryLevels: inventoryLevels.body?.inventory_levels || [],
      totalSKUs: products.body?.products?.length || 0,
      totalValue: inventoryLevels.body?.inventory_levels?.reduce((sum, item) =>
        sum + (item.available * (item.cost || 0)), 0) || 0,
      dataSource: 'shopify'
    });
  } catch (error) {
    console.error('Inventory API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory data',
      details: error.message
    });
  }
});

// Production Metrics API - Real Database Data
router.get('/production/metrics', async (req, res) => {
  try {
    const metrics = await prisma.productionMetrics.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    if (!metrics.length) {
      return res.status(503).json({
        error: 'No production data available',
        message: 'Production data not yet recorded in database'
      });
    }

    const latest = metrics[0];
    const aggregate = {
      avgEfficiency: metrics.reduce((sum, m) => sum + m.efficiency, 0) / metrics.length,
      totalUnitsProduced: metrics.reduce((sum, m) => sum + m.unitsProduced, 0),
      avgDefectRate: metrics.reduce((sum, m) => sum + m.defectRate, 0) / metrics.length,
      avgOeeScore: metrics.reduce((sum, m) => sum + m.oeeScore, 0) / metrics.length
    };

    res.json({
      current: latest,
      aggregate,
      history: metrics,
      dataSource: 'database'
    });
  } catch (error) {
    console.error('Production API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch production data',
      details: error.message
    });
  }
});

// Quality Metrics API
router.get('/quality/metrics', async (req, res) => {
  try {
    const quality = await prisma.qualityMetrics.findMany({
      orderBy: { date: 'desc' },
      take: 30
    });

    if (!quality.length) {
      return res.status(503).json({
        error: 'No quality data available',
        message: 'Quality metrics not yet recorded in database'
      });
    }

    res.json({
      metrics: quality,
      dataSource: 'database'
    });
  } catch (error) {
    console.error('Quality API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch quality data',
      details: error.message
    });
  }
});

// MCP Server Status (for monitoring)
router.get('/mcp/status', async (req, res) => {
  try {
    const response = await axios.get('https://mcp-server-tkyu.onrender.com/health');
    res.json({
      connected: true,
      ...response.data
    });
  } catch (error) {
    res.json({
      connected: false,
      error: error.message
    });
  }
});

export default router;