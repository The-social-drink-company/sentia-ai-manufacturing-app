import express from 'express';

import aiAnalyticsService from '../../services/aiAnalyticsService.js';
import { logInfo, logError, logWarn } from '../../services/observability/structuredLogger.js';
import xeroService from '../../services/xeroService.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';

import { sendSSEEvent } from './sse.js';\r\nimport { ensureDatabaseConnection, getPrismaClient } from '../database/client.js';\r\nimport { buildTimeSeries, summarizeSeries, toCurrency, determineTrend } from '../utils/dataTransforms.js';\r\n\r\n
const router = express.Router();

// In-memory data storage (replace with database in production)
const manufacturingData = {
  production: [],
  quality: [],
  inventory: [],
  maintenance: [],
  financials: [],
  lastUpdated: null
};

const MAX_WORKING_CAPITAL_ROWS = 24;
const FORECAST_PERIODS = 6;
const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });

const formatNumber = (value, digits = 2) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  const factor = Math.pow(10, digits);
  return Math.round(numericValue * factor) / factor;
};

const formatMonthLabel = (date) => monthFormatter.format(date instanceof Date ? date : new Date(date));

async function loadWorkingCapital(prisma) {
  try {
    const rows = await prisma.workingCapital.findMany({
      orderBy: { date: 'desc' },
      take: MAX_WORKING_CAPITAL_ROWS
    });

    const orderedHistory = rows.slice().reverse();
    const latest = orderedHistory.length ? orderedHistory[orderedHistory.length - 1] : null;

    return { orderedHistory, latest };
  } catch (error) {
    logError('Failed to load working capital from database', error);
    return { orderedHistory: [], latest: null };
  }
}

function serializeHistory(entries) {
  return entries.map((entry) => ({
    ...entry,
    date: entry.date instanceof Date ? entry.date.toISOString() : entry.date
  }));
}

function buildWorkingCapitalPayload(orderedHistory, latest) {
  if (!latest) {
    return null;
  }

  const netSeries = buildTimeSeries(orderedHistory, (entry) => (entry.currentAssets ?? 0) - (entry.currentLiabilities ?? 0));
  const inventorySeries = buildTimeSeries(orderedHistory, (entry) => entry.inventory ?? 0);
  const receivableSeries = buildTimeSeries(orderedHistory, (entry) => entry.accountsReceivable ?? 0);
  const payableSeries = buildTimeSeries(orderedHistory, (entry) => entry.accountsPayable ?? 0);
  const cashSeries = buildTimeSeries(orderedHistory, (entry) => entry.cash ?? 0);

  const netSummary = summarizeSeries(netSeries);
  const quickRatio = latest.quickRatio ?? 0;
  const currentRatio = latest.workingCapitalRatio ?? ((latest.currentAssets ?? 0) / Math.max(latest.currentLiabilities ?? 1, 1));
  const cashRatio = (latest.cash ?? 0) / Math.max(latest.currentLiabilities ?? 1, 1);

  return {
    source: 'database',
    current: {
      totalWorkingCapital: toCurrency((latest.currentAssets ?? 0) - (latest.currentLiabilities ?? 0)),
      currentAssets: toCurrency(latest.currentAssets ?? 0),
      currentLiabilities: toCurrency(latest.currentLiabilities ?? 0),
      cashFlow: toCurrency(latest.cash ?? 0)
    },
    breakdown: {
      inventory: toCurrency(latest.inventory ?? 0),
      accountsReceivable: toCurrency(latest.accountsReceivable ?? 0),
      cash: toCurrency(latest.cash ?? 0),
      accountsPayable: toCurrency(latest.accountsPayable ?? 0),
      shortTermDebt: toCurrency(Math.max((latest.currentLiabilities ?? 0) - (latest.accountsPayable ?? 0), 0))
    },
    trends: netSeries.map((point) => ({
      month: formatMonthLabel(point.date),
      workingCapital: toCurrency(point.value)
    })),
    ratios: {
      currentRatio: formatNumber(currentRatio),
      quickRatio: formatNumber(quickRatio),
      cashRatio: formatNumber(cashRatio),
      change: formatNumber(netSummary.change),
      trend: netSummary.trend
    },
    breakdownSeries: {
      inventory: inventorySeries.map((point) => ({ month: formatMonthLabel(point.date), value: toCurrency(point.value) })),
      receivables: receivableSeries.map((point) => ({ month: formatMonthLabel(point.date), value: toCurrency(point.value) })),
      payables: payableSeries.map((point) => ({ month: formatMonthLabel(point.date), value: toCurrency(point.value) })),
      cash: cashSeries.map((point) => ({ month: formatMonthLabel(point.date), value: toCurrency(point.value) }))
    },
    history: serializeHistory(orderedHistory),
    timestamp: new Date().toISOString()
  };
}

function buildDashboardAlerts(latest) {
  const alerts = [];
  const currentRatio = latest.workingCapitalRatio ?? ((latest.currentAssets ?? 0) / Math.max(latest.currentLiabilities ?? 1, 1));
  const cashConversionCycle = latest.cashConversionCycle ?? 0;

  if (currentRatio < 1.2) {
    alerts.push({
      type: 'warning',
      message: 'Current ratio below recommended threshold',
      metric: 'current_ratio',
      value: formatNumber(currentRatio)
    });
  }

  if ((latest.cash ?? 0) < (latest.currentLiabilities ?? 0) * 0.3) {
    alerts.push({
      type: 'info',
      message: 'Cash reserves trending low relative to liabilities',
      metric: 'cash',
      value: toCurrency(latest.cash ?? 0)
    });
  }

  if (cashConversionCycle > 80) {
    alerts.push({
      type: 'info',
      message: 'Cash conversion cycle increasing month over month',
      metric: 'ccc',
      value: formatNumber(cashConversionCycle)
    });
  }

  return alerts;
}

function buildDashboardMetrics(orderedHistory, latest, productionSummary) {
  const netSeries = buildTimeSeries(orderedHistory, (entry) => (entry.currentAssets ?? 0) - (entry.currentLiabilities ?? 0));
  const assetSeries = buildTimeSeries(orderedHistory, (entry) => entry.currentAssets ?? 0);
  const liabilitySeries = buildTimeSeries(orderedHistory, (entry) => entry.currentLiabilities ?? 0);
  const cashSeries = buildTimeSeries(orderedHistory, (entry) => entry.cash ?? 0);

  const netSummary = summarizeSeries(netSeries);
  const assetSummary = summarizeSeries(assetSeries);
  const liabilitySummary = summarizeSeries(liabilitySeries);
  const cashSummary = summarizeSeries(cashSeries);

  const openOrders = productionSummary && productionSummary.open ? productionSummary.open : 0;
  const productionChange = productionSummary && productionSummary.change ? productionSummary.change : 0;

  return {
    kpis: {
      revenue: {
        value: toCurrency(assetSummary.current),
        change: formatNumber(assetSummary.change),
        trend: assetSummary.trend
      },
      orders: {
        value: formatNumber(openOrders, 0),
        change: formatNumber(productionChange),
        trend: determineTrend(productionChange)
      },
      efficiency: {
        value: formatNumber(Math.max(0, Math.min(100, 100 - (latest.cashConversionCycle ?? 0)))),
        change: formatNumber(netSummary.change),
        trend: netSummary.trend
      },
      quality: {
        value: formatNumber(Math.min(100, (latest.quickRatio ?? 0) * 50)),
        change: formatNumber(cashSummary.change),
        trend: cashSummary.trend
      }
    },
    charts: {
      salesTrend: assetSeries.map((point) => ({
        month: formatMonthLabel(point.date),
        sales: toCurrency(point.value)
      })),
      workingCapital: netSeries.map((point) => ({
        month: formatMonthLabel(point.date),
        value: toCurrency(point.value)
      }))
    },
    alerts: buildDashboardAlerts(latest),
    timestamp: new Date().toISOString()
  };
}

function buildDemandForecast(orderedHistory) {
  const baseSeries = buildTimeSeries(orderedHistory, (entry) => entry.accountsReceivable ?? entry.currentAssets ?? 0);
  if (!baseSeries.length) {
    return { historical: [], forecast: [], accuracy: 0 };
  }

  const historical = baseSeries.map((point) => ({
    month: formatMonthLabel(point.date),
    actual: toCurrency(point.value)
  }));

  let growthSum = 0;
  let growthCount = 0;
  for (let index = 1; index < baseSeries.length; index += 1) {
    const previous = baseSeries[index - 1].value ?? 0;
    const current = baseSeries[index].value ?? 0;
    if (previous !== 0) {
      growthSum += (current - previous) / Math.abs(previous);
      growthCount += 1;
    }
  }

  const averageGrowth = growthCount ? growthSum / growthCount : 0;
  const forecast = [];
  let currentDate = baseSeries[baseSeries.length - 1].date instanceof Date
    ? new Date(baseSeries[baseSeries.length - 1].date)
    : new Date(baseSeries[baseSeries.length - 1].date);
  let currentValue = baseSeries[baseSeries.length - 1].value ?? 0;

  for (let step = 0; step < FORECAST_PERIODS; step += 1) {
    currentDate = new Date(currentDate.getTime());
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentValue = currentValue * (1 + averageGrowth);

    forecast.push({
      month: formatMonthLabel(currentDate),
      demand: toCurrency(currentValue),
      confidence: formatNumber(85 - Math.min(25, Math.abs(averageGrowth * 100)))
    });
  }

  const accuracy = formatNumber(90 - Math.min(30, Math.abs(averageGrowth * 100)));

  return { historical, forecast, accuracy };
}

async function computeProductionSummary(prisma) {
  try {
    const results = await prisma.production.groupBy({
      by: ['status'],
      _count: { _all: true }
    });

    const summary = { open: 0, completed: 0, delayed: 0, change: 0 };
    results.forEach((row) => {
      const key = (row.status || '').toLowerCase();
      if (key === 'pending' || key === 'in_progress') {
        summary.open += row._count._all;
      }
      if (key === 'completed') {
        summary.completed += row._count._all;
      }
      if (key === 'delayed' || key === 'cancelled') {
        summary.delayed += row._count._all;
      }
    });

    return summary;
  } catch (error) {
    if (error && error.code === 'P2021') {
      logWarn('Production table not available yet', error);
    } else {
      logWarn('Unable to compute production summary', error);
    }
    return { open: 0, completed: 0, delayed: 0, change: 0 };
  }
}

// Get manufacturing data
router.get('/manufacturing-data', (req, res) => {
  try {
    logInfo('Manufacturing data requested');
    res.json({
      ...manufacturingData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Error retrieving manufacturing data', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// Get dashboard data
router.get('/dashboard-data', (req, res) => {
  try {
    logInfo('Dashboard data requested');
    
    const dashboardData = {
      kpis: {
        revenue: { value: 2847500, change: 12.5, trend: 'up' },
        orders: { value: 1543, change: -3.2, trend: 'down' },
        efficiency: { value: 94.2, change: 2.1, trend: 'up' },
        quality: { value: 98.7, change: 0.5, trend: 'up' }
      },
      charts: {
        salesTrend: [
          { month: 'Jan', sales: 2400000 },
          { month: 'Feb', sales: 2100000 },
          { month: 'Mar', sales: 2800000 },
          { month: 'Apr', sales: 2600000 },
          { month: 'May', sales: 3200000 },
          { month: 'Jun', sales: 2847500 }
        ],
        productionMetrics: {
          efficiency: 94.2,
          quality: 98.7,
          capacity: 87.3,
          downtime: 2.1
        }
      },
      alerts: [
        { type: 'warning', message: 'Production line 2 efficiency below target' },
        { type: 'info', message: 'Scheduled maintenance tomorrow at 6 AM' }
      ],
      timestamp: new Date().toISOString()
    };
    
    res.json(dashboardData);
  } catch (error) {
    logError('Error retrieving dashboard data', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
});

// Get demand forecasting data
router.get('/demand-forecasting', (req, res) => {
  try {
    logInfo('Demand forecasting data requested');
    
    const forecastData = {
      forecast: [
        { month: 'Jul 2025', demand: 3100000, confidence: 85 },
        { month: 'Aug 2025', demand: 3400000, confidence: 82 },
        { month: 'Sep 2025', demand: 3200000, confidence: 78 },
        { month: 'Oct 2025', demand: 2900000, confidence: 75 },
        { month: 'Nov 2025', demand: 3600000, confidence: 72 },
        { month: 'Dec 2025', demand: 4200000, confidence: 68 }
      ],
      historical: [
        { month: 'Jan 2025', actual: 2400000 },
        { month: 'Feb 2025', actual: 2100000 },
        { month: 'Mar 2025', actual: 2800000 },
        { month: 'Apr 2025', actual: 2600000 },
        { month: 'May 2025', actual: 3200000 },
        { month: 'Jun 2025', actual: 2847500 }
      ],
      accuracy: {
        lastMonth: 94.2,
        last3Months: 91.5,
        last6Months: 88.7
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(forecastData);
  } catch (error) {
    logError('Error retrieving demand forecasting data', error);
    res.status(500).json({ error: 'Failed to retrieve forecasting data' });
  }
});

// Get working capital data
router.get('/working-capital', (req, res) => {
  try {
    logInfo('Working capital data requested');
    
    const workingCapitalData = {
      current: {
        totalWorkingCapital: 15420000,
        currentAssets: 28650000,
        currentLiabilities: 13230000,
        cashFlow: 2890000
      },
      breakdown: {
        inventory: 12500000,
        accountsReceivable: 8950000,
        cash: 7200000,
        accountsPayable: 9800000,
        shortTermDebt: 3430000
      },
      trends: [
        { month: 'Jan', workingCapital: 14200000 },
        { month: 'Feb', workingCapital: 13800000 },
        { month: 'Mar', workingCapital: 15100000 },
        { month: 'Apr', workingCapital: 14900000 },
        { month: 'May', workingCapital: 15800000 },
        { month: 'Jun', workingCapital: 15420000 }
      ],
      ratios: {
        currentRatio: 2.17,
        quickRatio: 1.23,
        cashRatio: 0.54
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(workingCapitalData);
  } catch (error) {
    logError('Error retrieving working capital data', error);
    res.status(500).json({ error: 'Failed to retrieve working capital data' });
  }
});

// Upload and process data files
router.post('/upload', 
  upload.array('files', 5), 
  handleUploadError,
  async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const results = [];
      
      for (const file of files) {
        logInfo('Processing uploaded file', { filename: file.filename, size: file.size });
        
        // Process the file based on type
        const processedData = await processUploadedFile(file);
        results.push({
          filename: file.originalname,
          records: processedData.length,
          type: determineDataType(file.originalname)
        });
        
        // Update manufacturing data
        updateManufacturingData(processedData, file.originalname);
      }
      
      // Send SSE update
      sendSSEEvent('data-upload', { files: results });
      
      res.json({
        success: true,
        message: 'Files processed successfully',
        files: results
      });
      
    } catch (error) {
      logError('File upload processing error', error);
      res.status(500).json({ error: 'Failed to process uploaded files' });
    }
  }
);

// Export data
router.get('/export', (req, res) => {
  try {
    const { format = 'json', type = 'all' } = req.query;
    
    logInfo('Data export requested', { format, type });
    
    const data = type === 'all' ? manufacturingData : manufacturingData[type] || {};
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sentia-data-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="sentia-data-${Date.now()}.json"`);
      res.json(data);
    }
    
  } catch (error) {
    logError('Data export error', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Xero integration endpoints
router.get('/xero/health', async (req, res) => {
  try {
    const health = await xeroService.healthCheck();
    res.json(health);
  } catch (error) {
    logError('Xero health check error', error);
    res.status(500).json({ error: 'Xero service unavailable' });
  }
});

router.get('/xero/data', authMiddleware, async (req, res) => {
  try {
    const data = await xeroService.getFinancialData();
    res.json(data);
  } catch (error) {
    logError('Xero data retrieval error', error);
    res.status(500).json({ error: 'Failed to retrieve Xero data' });
  }
});

// AI Analytics endpoints
router.get('/ai/health', async (req, res) => {
  try {
    const health = await aiAnalyticsService.healthCheck();
    res.json(health);
  } catch (error) {
    logError('AI Analytics health check error', error);
    res.status(500).json({ error: 'AI Analytics service unavailable' });
  }
});

router.post('/ai/analyze', authMiddleware, express.json(), async (req, res) => {
  try {
    const { data, analysisType = 'general' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required for analysis' });
    }
    
    const analysis = await aiAnalyticsService.analyze(data, analysisType);
    res.json(analysis);
    
  } catch (error) {
    logError('AI analysis error', error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// Helper functions
async function processUploadedFile(_file) {
  // Implementation would process CSV/Excel files
  // For now, return mock data
  return [
    { id: 1, type: 'production', value: Math.random() * 1000 },
    { id: 2, type: 'quality', value: Math.random() * 100 }
  ];
}

function determineDataType(filename) {
  const name = filename.toLowerCase();
  if (name.includes('production')) return 'production';
  if (name.includes('quality')) return 'quality';
  if (name.includes('inventory')) return 'inventory';
  if (name.includes('financial')) return 'financials';
  return 'general';
}

function updateManufacturingData(processedData, filename) {
  const dataType = determineDataType(filename);
  if (manufacturingData[dataType]) {
    manufacturingData[dataType] = [...manufacturingData[dataType], ...processedData];
  } else {
    manufacturingData[dataType] = processedData;
  }
  manufacturingData.lastUpdated = new Date().toISOString();
}

function convertToCSV(data) {
  // Simple CSV conversion - would need proper implementation for complex data
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    return `${headers  }\n${  rows}`;
  }
  return JSON.stringify(data);
}

export default router;


