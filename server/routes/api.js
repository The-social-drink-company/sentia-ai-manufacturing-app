import express from 'express';

import aiAnalyticsService from '../../services/aiAnalyticsService.js';
import { logInfo, logError } from '../../services/observability/structuredLogger.js';
import xeroService from '../../services/xeroService.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';

import { sendSSEEvent } from './sse.js';


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