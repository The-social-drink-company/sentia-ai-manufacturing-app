/**
 * Working Capital API Routes
 * Real data integration with Xero, MCP Server, and external APIs
 */

import express from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// MCP Server configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';
const XERO_API_URL = 'https://api.xero.com/api.xro/2.0';

// Get Xero access token
const getXeroToken = async () => {
  // In production, this would use OAuth2 flow
  // For now, return stored token from environment
  return process.env.XERO_ACCESS_TOKEN;
};

/**
 * GET /api/working-capital/metrics
 * Fetch real-time working capital metrics from all sources
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // Fetch from multiple data sources in parallel
    const [xeroData, mcpData, dbData] = await Promise.all([
      // Xero API for accounting data
      fetchXeroMetrics(),
      // MCP Server for AI-enhanced metrics
      fetchMCPMetrics(),
      // Database for historical data
      fetchDatabaseMetrics()
    ]);

    // Calculate real metrics
    const metrics = {
      cashPosition: xeroData.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0),
      cashRunway: calculateCashRunway(xeroData, mcpData),
      wcRatio: calculateWorkingCapitalRatio(xeroData),
      quickRatio: calculateQuickRatio(xeroData),
      cashChange: calculateChange(xeroData.cashHistory),
      runwayChange: calculateRunwayChange(dbData),
      wcStatus: determineStatus(xeroData.wcRatio),
      quickStatus: determineStatus(xeroData.quickRatio),
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching working capital metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /api/xero/cashflow
 * Fetch cash flow data from Xero
 */
router.get('/xero/cashflow', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const token = await getXeroToken();

    // Fetch real cash flow from Xero
    const response = await axios.get(`${XERO_API_URL}/Reports/CashflowStatement`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Xero-tenant-id': process.env.XERO_TENANT_ID,
        'Accept': 'application/json'
      },
      params: {
        periods: getPeriodCount(period),
        timeframe: 'MONTH'
      }
    });

    // Parse Xero response and format for frontend
    const cashFlow = parseCashFlowData(response.data);

    // Get AI forecast from MCP server
    const forecast = await fetchAICashFlowForecast(cashFlow);

    res.json({
      historical: cashFlow,
      forecast: forecast,
      metadata: {
        source: 'xero',
        period: period,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching cash flow:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow data' });
  }
});

/**
 * GET /api/finance/ar-ap
 * Fetch accounts receivable and payable data
 */
router.get('/finance/ar-ap', authenticateToken, async (req, res) => {
  try {
    const token = await getXeroToken();

    // Fetch invoices (receivables)
    const [invoicesRes, billsRes] = await Promise.all([
      axios.get(`${XERO_API_URL}/Invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Xero-tenant-id': process.env.XERO_TENANT_ID
        },
        params: {
          where: 'Status=="AUTHORISED" OR Status=="SUBMITTED"',
          order: 'DueDate DESC'
        }
      }),
      axios.get(`${XERO_API_URL}/Invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Xero-tenant-id': process.env.XERO_TENANT_ID
        },
        params: {
          where: 'Type=="ACCPAY" AND (Status=="AUTHORISED" OR Status=="SUBMITTED")',
          order: 'DueDate DESC'
        }
      })
    ]);

    // Calculate aging and metrics
    const arData = calculateAging(invoicesRes.data.Invoices);
    const apData = calculateAging(billsRes.data.Invoices);

    res.json({
      receivables: arData.total,
      payables: apData.total,
      daysReceivables: arData.averageDays,
      daysPayables: apData.averageDays,
      aging: {
        receivables: arData.aging,
        payables: apData.aging
      },
      topDebtors: arData.top5,
      topCreditors: apData.top5
    });
  } catch (error) {
    console.error('Error fetching AR/AP data:', error);
    res.status(500).json({ error: 'Failed to fetch AR/AP data' });
  }
});

/**
 * GET /api/inventory/turnover
 * Fetch inventory turnover metrics
 */
router.get('/inventory/turnover', authenticateToken, async (req, res) => {
  try {
    // Fetch from Unleashed or inventory system
    const inventoryData = await fetchInventoryData();

    // Calculate turnover metrics
    const metrics = {
      value: inventoryData.totalValue,
      daysInventory: calculateDaysInventory(inventoryData),
      turnoverRate: inventoryData.turnoverRate,
      stockouts: inventoryData.stockouts,
      excessStock: inventoryData.excessStock,
      breakdown: inventoryData.categories
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching inventory metrics:', error);
    res.status(500).json({ error: 'Failed to fetch inventory metrics' });
  }
});

/**
 * GET /api/mcp/forecasts/cashflow
 * Get AI-driven cash flow forecasts from MCP server
 */
router.get('/mcp/forecasts/cashflow', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${MCP_SERVER_URL}/api/ai/forecast`, {
      type: 'cashflow',
      horizon: 90,
      confidence: 0.95,
      includeScenarios: true
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MCP_JWT_SECRET}`
      }
    });

    const forecast = response.data;

    // Add recommendations based on forecast
    const recommendations = generateRecommendations(forecast);

    res.json({
      cashflow: forecast.predictions,
      scenarios: forecast.scenarios,
      recommendations: recommendations,
      confidence: forecast.confidence,
      metadata: {
        model: 'gpt-4-turbo',
        generated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching AI forecasts:', error);
    res.status(500).json({ error: 'Failed to fetch AI forecasts' });
  }
});

// Helper functions
async function fetchXeroMetrics() {
  const token = await getXeroToken();

  const [balanceSheet, profitLoss, bankAccounts] = await Promise.all([
    axios.get(`${XERO_API_URL}/Reports/BalanceSheet`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Xero-tenant-id': process.env.XERO_TENANT_ID
      }
    }),
    axios.get(`${XERO_API_URL}/Reports/ProfitAndLoss`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Xero-tenant-id': process.env.XERO_TENANT_ID
      }
    }),
    axios.get(`${XERO_API_URL}/BankTransactions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Xero-tenant-id': process.env.XERO_TENANT_ID
      },
      params: {
        where: 'Status=="ACTIVE"'
      }
    })
  ]);

  return {
    balanceSheet: balanceSheet.data,
    profitLoss: profitLoss.data,
    bankAccounts: parseBankAccounts(bankAccounts.data)
  };
}

async function fetchMCPMetrics() {
  try {
    const response = await axios.get(`${MCP_SERVER_URL}/api/metrics/working-capital`, {
      headers: {
        'Authorization': `Bearer ${process.env.MCP_JWT_SECRET}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('MCP server error:', error);
    return {};
  }
}

async function fetchDatabaseMetrics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const metrics = await prisma.workingCapitalMetric.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 30
  });

  return metrics;
}

function calculateCashRunway(xeroData, mcpData) {
  const currentCash = xeroData.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const monthlyBurn = mcpData.averageMonthlyBurn || 500000; // Default burn rate

  return Math.floor(currentCash / (monthlyBurn / 30));
}

function calculateWorkingCapitalRatio(xeroData) {
  // Parse from Xero balance sheet
  const currentAssets = parseCurrentAssets(xeroData.balanceSheet);
  const currentLiabilities = parseCurrentLiabilities(xeroData.balanceSheet);

  return (currentAssets / currentLiabilities).toFixed(2);
}

function calculateQuickRatio(xeroData) {
  const currentAssets = parseCurrentAssets(xeroData.balanceSheet);
  const inventory = parseInventory(xeroData.balanceSheet);
  const currentLiabilities = parseCurrentLiabilities(xeroData.balanceSheet);

  return ((currentAssets - inventory) / currentLiabilities).toFixed(2);
}

function calculateAging(invoices) {
  const now = new Date();
  const aging = {
    current: 0,
    '30-60': 0,
    '60-90': 0,
    '90+': 0
  };

  let totalValue = 0;
  let totalDays = 0;
  let count = 0;

  invoices.forEach(invoice => {
    const dueDate = new Date(invoice.DueDate);
    const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
    const amount = invoice.AmountDue;

    totalValue += amount;
    totalDays += daysOverdue > 0 ? daysOverdue : 0;
    count++;

    if (daysOverdue <= 0) {
      aging.current += amount;
    } else if (daysOverdue <= 30) {
      aging.current += amount;
    } else if (daysOverdue <= 60) {
      aging['30-60'] += amount;
    } else if (daysOverdue <= 90) {
      aging['60-90'] += amount;
    } else {
      aging['90+'] += amount;
    }
  });

  const top5 = invoices
    .sort((a, b) => b.AmountDue - a.AmountDue)
    .slice(0, 5)
    .map(inv => ({
      name: inv.Contact.Name,
      amount: inv.AmountDue,
      daysOverdue: Math.floor((now - new Date(inv.DueDate)) / (1000 * 60 * 60 * 24))
    }));

  return {
    total: totalValue,
    averageDays: count > 0 ? Math.floor(totalDays / count) : 0,
    aging: aging,
    top5: top5
  };
}

function generateRecommendations(forecast) {
  const recommendations = [];

  // Analyze forecast for issues
  if (forecast.minimumCash < 1000000) {
    recommendations.push({
      priority: 'high',
      impact: 2000000,
      title: 'Cash position critical',
      description: 'Forecast shows cash dropping below $1M within 30 days'
    });
  }

  if (forecast.trends.receivables > 1.2) {
    recommendations.push({
      priority: 'medium',
      impact: 1500000,
      title: 'Accelerate collections',
      description: 'Receivables growing 20% faster than revenue'
    });
  }

  return recommendations;
}

export default router;