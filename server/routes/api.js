import express from 'express';
import { upload, handleUploadError } from '../middleware/upload.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendSSEEvent } from './sse.js';
import xeroService from '../../services/xeroService.js';
import aiAnalyticsService from '../../services/aiAnalyticsService.js';
import { logInfo, logError, logWarn } from '../../services/observability/structuredLogger.js';

const router = express.Router();

// In-memory data storage (replace with database in production)
let manufacturingData = {
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
async function processUploadedFile(file) {
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
    return headers + '\n' + rows;
  }
  return JSON.stringify(data);
}

export default router;