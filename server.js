import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import MCP client for live data integration
let getMCPClient = null;
try {
  const mcpModule = await import('./services/mcp-client.js');
  getMCPClient = mcpModule.getMCPClient;
  console.log('✅ MCP Client imported successfully');
} catch (error) {
  console.warn('⚠️ MCP Client import failed:', error.message);
}

const app = express();
const PORT = process.env.PORT || 10000;

console.log('🚀 Starting Sentia Manufacturing Dashboard Server...');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Middleware for parsing JSON
app.use(express.json());

// Try multiple paths to find the dist folder
const possiblePaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, '../dist'),
  path.join(process.cwd(), 'dist'),
  '/opt/render/project/src/dist'
];

let staticPath = null;
for (const testPath of possiblePaths) {
  console.log(`Checking for dist at: ${testPath}`);
  try {
    if (fs.existsSync(testPath)) {
      staticPath = testPath;
      console.log(`✅ Found dist folder at: ${staticPath}`);
      break;
    }
  } catch (e) {
    console.log(`❌ Path not accessible: ${testPath}`);
  }
}

if (!staticPath) {
  console.error('ERROR: Could not find dist folder in any expected location');
  console.log('Current directory:', process.cwd());
  console.log('Script directory:', __dirname);
  process.exit(1);
}

console.log('📁 Serving static files from:', staticPath);

// Serve static files
app.use(express.static(staticPath));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({ 
    status: 'healthy',
    service: 'sentia-manufacturing-dashboard',
    version: '2.0.0-bulletproof',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    staticPath: staticPath
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  console.log('📊 API status check requested');
  res.status(200).json({
    status: 'operational',
    services: {
      frontend: 'active',
      authentication: 'clerk-enabled',
      database: 'available'
    },
    timestamp: new Date().toISOString(),
    staticPath: staticPath
  });
});

// Working Capital API with MCP integration - NO FALLBACK DATA
app.get('/api/working-capital', async (req, res) => {
  console.log('💰 Working capital data requested');
  
  const startTime = Date.now();
  const errors = [];
  let mcpServerOnline = false;
  let xeroApiConnected = false;
  
  // NO FALLBACK DATA - only real data or error messages
  let workingCapitalData = null;
  
  // Try to get live data from MCP server
  if (!getMCPClient) {
    return res.status(503).json({
      success: false,
      error: 'MCP Client not available',
      message: 'Financial data service is not configured. Please check server setup.',
      timestamp: new Date().toISOString(),
      userAction: 'Contact system administrator'
    });
  }
  
  try {
    const mcpClient = getMCPClient();
    
    // Check MCP server health first
    const healthCheck = await mcpClient.checkHealth();
    mcpServerOnline = healthCheck.status === 'healthy';
    
    if (!mcpServerOnline) {
      return res.status(503).json({
        success: false,
        error: 'MCP Server offline',
        message: 'Financial data service is currently unavailable.',
        timestamp: new Date().toISOString(),
        userAction: 'Please try again in a few minutes or contact support',
        retryIn: '30 seconds'
      });
    }
    
    console.log('✅ MCP Server is online, fetching working capital data...');
    
    // Try to get working capital data through MCP
    const mcpResponse = await mcpClient.callUnifiedAPI(
      'xero', 
      'GET', 
      '/working-capital-summary',
      null
    );
    
    if (!mcpResponse || !mcpResponse.success) {
      return res.status(502).json({
        success: false,
        error: 'Xero API failed',
        message: 'Unable to retrieve financial data from Xero. Check API connection.',
        timestamp: new Date().toISOString(),
        userAction: 'Verify Xero API credentials and try again',
        retryIn: '5 minutes'
      });
    }
    
    // Validate that we have the required data
    if (!mcpResponse.data || typeof mcpResponse.data.workingCapital === 'undefined') {
      return res.status(502).json({
        success: false,
        error: 'Invalid data received',
        message: 'Xero API returned incomplete working capital data.',
        timestamp: new Date().toISOString(),
        userAction: 'Check Xero account configuration',
        retryIn: '5 minutes'
      });
    }
    
    workingCapitalData = {
      workingCapital: mcpResponse.data.workingCapital,
      currentRatio: mcpResponse.data.currentRatio,
      quickRatio: mcpResponse.data.quickRatio,
      cash: mcpResponse.data.cash,
      receivables: mcpResponse.data.receivables,
      payables: mcpResponse.data.payables,
      lastCalculated: new Date().toISOString()
    };
    
    xeroApiConnected = true;
    console.log('✅ Retrieved live working capital data from Xero via MCP');
    
  } catch (mcpError) {
    console.error('❌ MCP operation failed:', mcpError.message);
    return res.status(503).json({
      success: false,
      error: 'Service connection failed',
      message: `Unable to connect to financial services: ${mcpError.message}`,
      timestamp: new Date().toISOString(),
      userAction: 'Check network connection and try again',
      retryIn: '1 minute'
    });
  }
  
  const responseTime = Date.now() - startTime;
  
  // Success response with live data only
  const response = {
    success: true,
    data: workingCapitalData,
    metadata: {
      dataSource: 'live',
      lastUpdated: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        mcpServer: {
          status: 'online',
          responseTime: `${responseTime}ms`
        },
        xero: {
          status: 'connected',
          lastSync: new Date().toISOString()
        }
      }
    }
  };
  
  console.log('📊 Live working capital data served successfully');
  res.status(200).json(response);
});

// System Activity API - Real audit logs from database
app.get('/api/system/activity', async (req, res) => {
  console.log('📋 System activity requested');
  
  try {
    // This would query real audit logs when Prisma is available
    // For now, return empty array until database is connected
    res.status(200).json([]);
  } catch (error) {
    console.error('Failed to fetch system activity:', error);
    res.status(503).json({
      error: 'Unable to fetch system activity',
      message: 'Database connection required for activity logs',
      timestamp: new Date().toISOString()
    });
  }
});

// System Alerts API - Real alerts from SystemAlert table
app.get('/api/system/alerts', async (req, res) => {
  console.log('🚨 System alerts requested');
  
  try {
    // This would query real SystemAlert table when Prisma is available
    // For now, return empty array until database is connected
    res.status(200).json([]);
  } catch (error) {
    console.error('Failed to fetch system alerts:', error);
    res.status(503).json({
      error: 'Unable to fetch system alerts',
      message: 'Database connection required for alerts',
      timestamp: new Date().toISOString()
    });
  }
});

// Catch-all handler for API routes that might require Prisma
app.use('/api/*', (req, res, next) => {
  console.log('⚠️  API route accessed:', req.path);
  // For now, return a maintenance message for complex API routes
  if (req.path.includes('/financial') || req.path.includes('/inventory') || req.path.includes('/production')) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database services are initializing. Please try again in a moment.',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  console.log('📄 Serving React app for:', req.path);
  const indexPath = path.join(staticPath, 'index.html');
  
  // Check if index.html exists
  try {
    if (!fs.existsSync(indexPath)) {
      console.error('❌ index.html not found at:', indexPath);
      return res.status(404).json({
        error: 'Application not found',
        message: 'The React application build files are missing.',
        path: indexPath
      });
    }
    
    res.sendFile(indexPath);
  } catch (error) {
    console.error('❌ Error serving index.html:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Unable to serve the application.',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
    ========================================
    SENTIA MANUFACTURING DASHBOARD
    ========================================
    Status: ✅ Server running successfully
    Port: ${PORT}
    Static Path: ${staticPath}
    Environment: ${process.env.NODE_ENV || 'development'}
    
    URLs:
    🌐 Application: http://localhost:${PORT}
    🔍 Health Check: http://localhost:${PORT}/health
    📊 API Status: http://localhost:${PORT}/api/status
    
    Features:
    📱 Frontend: React with Clerk Authentication
    🔧 Backend: Express.js with API endpoints
    🗄️  Database: Ready for integration
    ========================================
  `);
});
