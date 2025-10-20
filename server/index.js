/**
 * BULLETPROOF ENTERPRISE SERVER
 * Properly configured Express server with guaranteed API routing
 */

import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import fs from 'fs'
import workingCapitalRouter from './api/working-capital.js'
import realApiRouter from './api/real-api.js'
import enterpriseApiRouter from './api/enterprise-api.js'
import enhancedForecastingRouter from './api/enhanced-forecasting.js'

// ES module compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 10000
const isClerkConfigured = Boolean(process.env.VITE_CLERK_PUBLISHABLE_KEY)
const isDevelopmentMode = process.env.VITE_DEVELOPMENT_MODE === 'true'

// Logging middleware
const logger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://clerk.financeflo.ai',
          'https://*.clerk.accounts.dev',
          'https://*.clerk.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'https://clerk.financeflo.ai',
          'https://*.clerk.accounts.dev',
          'https://*.clerk.com',
          'https://mcp-server-yacx.onrender.com',
        ],
      },
    },
  })
)

// Standard middleware
app.use(compression())
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(logger)

// ==========================================
// API ROUTES (HIGHEST PRIORITY)
// ==========================================

// Health check endpoint (for Render healthCheckPath: /api/health)
const healthResponse = () => ({
  status: 'healthy',
  service: 'sentia-manufacturing-dashboard',
  version: '2.0.0-bulletproof',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  clerk: {
    configured: isClerkConfigured,
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT_SET',
  },
  authentication: {
    mode: isDevelopmentMode ? 'development-bypass' : 'production-clerk',
    developmentMode: isDevelopmentMode,
  },
})

app.get('/health', (req, res) => {
  res.json(healthResponse())
})

app.get('/api/health', (req, res) => {
  res.json(healthResponse())
})

app.get('/ready', (req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  })
})

app.get('/alive', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  })
})

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'sentia-manufacturing-dashboard',
      version: '2.0.0-bulletproof',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      clerk: {
        configured: isClerkConfigured,
      },
      authentication: {
        mode: isDevelopmentMode ? 'development-bypass' : 'production-clerk',
        developmentMode: isDevelopmentMode,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: Math.random().toString(36).substr(2, 9),
    },
  })
})

// Mount working capital router for MCP integration
app.use('/api/working-capital', workingCapitalRouter)
app.use('/api/enterprise', enterpriseApiRouter)
app.use('/api/forecasting/enhanced', enhancedForecastingRouter)
app.use('/api', realApiRouter)

// MCP Status endpoint
app.get('/api/mcp/status', async (req, res) => {
  try {
    const response = await fetch('https://mcp-server-yacx.onrender.com/health', {
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const data = await response.json()
      res.json({
        connected: true,
        ...data,
      })
    } else {
      res.json({
        connected: false,
        error: `MCP Server returned ${response.status}`,
        url: 'https://mcp-server-yacx.onrender.com',
      })
    }
  } catch (error) {
    res.json({
      connected: false,
      error: error.message,
      url: 'https://mcp-server-yacx.onrender.com',
    })
  }
})

// Catch-all API handler to prevent static file serving for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  })
})

// ==========================================
// STATIC FILE SERVING (LOWER PRIORITY)
// ==========================================

// Custom static file middleware that excludes /api routes
const customStaticMiddleware = (req, res, next) => {
  // Skip static file serving for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return next()
  }

  const distPath = path.join(__dirname, '../dist')
  const filePath = path.join(distPath, req.path)

  // Check if file exists
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath)
  } else {
    next()
  }
}

app.use(customStaticMiddleware)

// SPA fallback route (must be last)
app.get('*', (req, res) => {
  const distPath = path.join(__dirname, '../dist')
  const indexPath = path.join(distPath, 'index.html')

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CapLiquify Manufacturing Platform</title>
        <style>
          body {
            font-family: system-ui;
            text-align: center;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
          }
          .status { color: #059669; font-weight: bold; }
          .error { color: #dc2626; }
          .info { background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
          .api-list { text-align: left; background: #f9fafb; padding: 1rem; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ CapLiquify Manufacturing Platform</h1>
        <p class="status">Server is running successfully</p>
        <p class="error">Frontend build not found - please run build process</p>

        <div class="info">
          <h3>Available API Endpoints:</h3>
          <div class="api-list">
            <p><strong>Health:</strong> <a href="/health">/health</a></p>
            <p><strong>API Status:</strong> <a href="/api/status">/api/status</a></p>
            <p><strong>Dashboard:</strong> <a href="/api/dashboard/summary">/api/dashboard/summary</a></p>
            <p><strong>Working Capital:</strong> <a href="/api/financial/working-capital">/api/financial/working-capital</a></p>
            <p><strong>Cash Flow:</strong> <a href="/api/financial/cash-flow">/api/financial/cash-flow</a></p>
            <p><strong>MCP Status:</strong> <a href="/api/mcp/status">/api/mcp/status</a></p>
          </div>
        </div>

        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Version:</strong> 2.0.0-bulletproof</p>
      </body>
      </html>
    `)
  }
})

// Error handling middleware
app.use((err, req, res) => {
  console.error('Server error:', err)

  if (req.path.startsWith('/api/')) {
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString(),
    })
  } else {
    res.status(500).send('Internal Server Error')
  }
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================')
  console.log('SENTIA MANUFACTURING DASHBOARD')
  console.log('BULLETPROOF CONFIGURATION')
  console.log('========================================')
  console.log(`Server: http://localhost:${PORT}`)
  console.log(`Health: http://localhost:${PORT}/health`)
  console.log(`API: http://localhost:${PORT}/api/status`)
  console.log(`Dashboard: http://localhost:${PORT}/api/dashboard/summary`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Authentication: ${isDevelopmentMode ? 'Development Bypass' : 'Production Clerk'}`)
  console.log(`Clerk: ${isClerkConfigured ? 'Configured' : 'Not configured'}`)
  console.log('========================================\n')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export default app
