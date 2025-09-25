import express from 'express';
import { upload, handleUploadError } from '../middleware/upload.js';
import { sendSSEEvent } from './sse.js';
import { logInfo, logError } from '../../services/observability/structuredLogger.js';

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

// Get all manufacturing data
router.get('/manufacturing', (req, res) => {
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

// Get specific data type
router.get('/manufacturing/:type', (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['production', 'quality', 'inventory', 'maintenance', 'financials'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }
    
    logInfo('Specific manufacturing data requested', { type });
    res.json({
      type,
      data: manufacturingData[type] || [],
      lastUpdated: manufacturingData.lastUpdated,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logError('Error retrieving specific manufacturing data', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// Upload data files
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
        const dataType = determineDataType(file.originalname);
        
        results.push({
          filename: file.originalname,
          records: processedData.length,
          type: dataType
        });
        
        // Update manufacturing data
        updateManufacturingData(processedData, dataType);
      }
      
      // Send SSE update
      sendSSEEvent('data-upload', { files: results });
      
      res.json({
        success: true,
        message: 'Files processed successfully',
        files: results,
        totalRecords: results.reduce((sum, file) => sum + file.records, 0)
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
    
    let data;
    if (type === 'all') {
      data = manufacturingData;
    } else if (manufacturingData[type]) {
      data = { [type]: manufacturingData[type], lastUpdated: manufacturingData.lastUpdated };
    } else {
      return res.status(400).json({ error: 'Invalid data type' });
    }
    
    const timestamp = Date.now();
    const filename = `sentia-${type}-data-${timestamp}`;
    
    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        exportedAt: new Date().toISOString(),
        dataType: type,
        ...data
      });
    }
    
  } catch (error) {
    logError('Data export error', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Add new data entry
router.post('/add', express.json(), (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }
    
    const validTypes = ['production', 'quality', 'inventory', 'maintenance', 'financials'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }
    
    // Add timestamp and ID
    const entry = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    manufacturingData[type].push(entry);
    manufacturingData.lastUpdated = new Date().toISOString();
    
    // Send SSE update
    sendSSEEvent('data-added', { type, entry });
    
    logInfo('Data entry added', { type, entryId: entry.id });
    
    res.status(201).json({
      success: true,
      message: 'Data entry added successfully',
      entry
    });
    
  } catch (error) {
    logError('Error adding data entry', error);
    res.status(500).json({ error: 'Failed to add data entry' });
  }
});

// Helper functions
async function processUploadedFile(file) {
  // Mock implementation - in production, this would parse CSV/Excel files
  const mockData = [];
  for (let i = 0; i < 10; i++) {
    mockData.push({
      id: `${file.filename}-${i}`,
      value: Math.random() * 1000,
      timestamp: new Date().toISOString(),
      source: file.originalname
    });
  }
  return mockData;
}

function determineDataType(filename) {
  const name = filename.toLowerCase();
  if (name.includes('production')) return 'production';
  if (name.includes('quality')) return 'quality';
  if (name.includes('inventory')) return 'inventory';
  if (name.includes('maintenance')) return 'maintenance';
  if (name.includes('financial')) return 'financials';
  return 'production'; // default
}

function updateManufacturingData(processedData, dataType) {
  if (!manufacturingData[dataType]) {
    manufacturingData[dataType] = [];
  }
  manufacturingData[dataType] = [...manufacturingData[dataType], ...processedData];
  manufacturingData.lastUpdated = new Date().toISOString();
}

function convertToCSV(data) {
  if (typeof data !== 'object') return '';
  
  let csvContent = '';
  
  // Handle different data structures
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0) {
      csvContent += `# ${key.toUpperCase()}\n`;
      const headers = Object.keys(value[0]).join(',');
      const rows = value.map(item => 
        Object.values(item).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      ).join('\n');
      csvContent += headers + '\n' + rows + '\n\n';
    }
  }
  
  return csvContent || 'No data available';
}

export default router;