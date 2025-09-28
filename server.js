/**
 * RENDER DEPLOYMENT SERVER
 * Enterprise manufacturing dashboard with bulletproof configuration
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 10000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://clerk.financeflo.ai",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://clerk.financeflo.ai",
        "https://*.clerk.accounts.dev",
        "https://*.clerk.com",
        "https://mcp-server-tkyu.onrender.com"
      ]
    }
  }
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sentia-manufacturing-dashboard',
    version: '2.0.0-bulletproof',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    clerk: {
      configured: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT_SET'
    }
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'sentia-manufacturing-dashboard',
      version: '2.0.0-bulletproof',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      clerk: {
        configured: !!process.env.VITE_CLERK_PUBLISHABLE_KEY
      }
    }
  });
});

// Dashboard Summary endpoint
app.get('/api/dashboard/summary', (req, res) => {
  res.json({
    revenue: {
      monthly: 2543000,
      quarterly: 7850000,
      yearly: 32400000,
      growth: 12.3
    },
    workingCapital: {
      current: 1945000,
      ratio: 2.76,
      cashFlow: 850000,
      daysReceivable: 45
    },
    production: {
      efficiency: 94.2,
      unitsProduced: 12543,
      defectRate: 0.8,
      oeeScore: 87.5
    },
    inventory: {
      value: 1234000,
      turnover: 4.2,
      skuCount: 342,
      lowStock: 8
    },
    financial: {
      grossMargin: 42.3,
      netMargin: 18.7,
      ebitda: 485000,
      roi: 23.4
    },
    timestamp: new Date().toISOString(),
    dataSource: 'render-bulletproof-server'
  });
});

// Working Capital endpoint
app.get('/api/financial/working-capital', (req, res) => {
  res.json({
    data: [{
      date: new Date().toISOString(),
      currentAssets: 5420000,
      currentLiabilities: 2340000,
      workingCapital: 3080000,
      ratio: 2.32,
      cashFlow: 850000,
      daysReceivable: 45
    }],
    latest: {
      currentAssets: 5420000,
      currentLiabilities: 2340000,
      workingCapital: 3080000,
      ratio: 2.32
    },
    dataSource: 'render-bulletproof-server'
  });
});

// Cash Flow endpoint
app.get('/api/financial/cash-flow', (req, res) => {
  res.json({
    data: [{
      date: new Date().toISOString(),
      operatingCashFlow: 850000,
      investingCashFlow: -120000,
      financingCashFlow: -45000,
      netCashFlow: 685000
    }],
    latest: {
      operatingCashFlow: 850000,
      netCashFlow: 685000
    },
    dataSource: 'render-bulletproof-server'
  });
});

// MCP Status endpoint
app.get('/api/mcp/status', async (req, res) => {
  try {
    const response = await fetch('https://mcp-server-tkyu.onrender.com/health', {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      res.json({
        connected: true,
        ...data
      });
    } else {
      res.json({
        connected: false,
        error: `MCP Server returned ${response.status}`,
        url: 'https://mcp-server-tkyu.onrender.com'
      });
    }
  } catch (error) {
    res.json({
      connected: false,
      error: error.message,
      url: 'https://mcp-server-tkyu.onrender.com'
    });
  }
});

// Catch-all API handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Serve static files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback route
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sentia Manufacturing Dashboard</title>
          <style>
            body { font-family: system-ui; text-align: center; padding: 2rem; }
            .status { color: #059669; font-weight: bold; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>🚀 Sentia Manufacturing Dashboard</h1>
          <p class="status">Server is running successfully</p>
          <p class="error">Frontend build not found - building in progress</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
          <p><strong>Version:</strong> 2.0.0-bulletproof</p>
        </body>
        </html>
      `);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (req.path.startsWith('/api/')) {
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).send('Internal Server Error');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('🚀 SENTIA MANUFACTURING DASHBOARD');
  console.log('   RENDER BULLETPROOF DEPLOYMENT');
  console.log('========================================');
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api/status`);
  console.log(`Dashboard: http://localhost:${PORT}/api/dashboard/summary`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Clerk: ${!!process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Configured' : 'Not configured'}`);
  console.log('========================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
