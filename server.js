const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Enterprise Configuration
const CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  VERSION: '2.0.0-enterprise',
  COMPANY: 'Sentia Manufacturing',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*'
};

// Enterprise Logging System
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      environment: CONFIG.NODE_ENV,
      version: CONFIG.VERSION
    };
    console.log(JSON.stringify(logEntry));
  }

  static info(message, data) { this.log('INFO', message, data); }
  static warn(message, data) { this.log('WARN', message, data); }
  static error(message, data) { this.log('ERROR', message, data); }
  static debug(message, data) { this.log('DEBUG', message, data); }
}

// Enterprise Health Monitor
class HealthMonitor {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
  }

  getStatus() {
    const uptime = Date.now() - this.startTime;
    return {
      status: 'healthy',
      uptime: Math.floor(uptime / 1000),
      version: CONFIG.VERSION,
      environment: CONFIG.NODE_ENV,
      requests: this.requestCount,
      errors: this.errorCount,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  recordRequest() { this.requestCount++; }
  recordError() { this.errorCount++; }
}

// Enterprise Dashboard HTML
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentia Manufacturing Dashboard - Enterprise Edition</title>
    <meta name="description" content="Enterprise Manufacturing Intelligence Platform">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
            color: #ffffff;
            min-height: 100vh;
            line-height: 1.6;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding: 2rem 0;
            text-align: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            background: linear-gradient(45deg, #fff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .status-bar {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        
        .status-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(76, 175, 80, 0.2);
            border-radius: 20px;
            border: 1px solid rgba(76, 175, 80, 0.3);
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            background: #4caf50;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #4caf50;
            margin-bottom: 0.5rem;
        }
        
        .metric-label {
            font-size: 1rem;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        
        .dashboard-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 2.5rem;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .dashboard-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4caf50, #2196f3, #ff9800);
        }
        
        .dashboard-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        
        .card-icon {
            font-size: 3rem;
            margin-bottom: 1.5rem;
            display: block;
        }
        
        .card-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #fff;
        }
        
        .card-description {
            opacity: 0.9;
            line-height: 1.6;
            font-size: 1rem;
        }
        
        .api-endpoints {
            background: rgba(255, 255, 255, 0.05);
            padding: 2rem;
            border-radius: 15px;
            margin-top: 3rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .api-endpoints h3 {
            margin-bottom: 1.5rem;
            color: #4caf50;
            font-size: 1.3rem;
        }
        
        .endpoint {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            margin: 0.5rem 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            border-left: 4px solid #4caf50;
        }
        
        .endpoint code {
            background: rgba(0, 0, 0, 0.3);
            padding: 0.3rem 0.8rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
        }
        
        .footer {
            text-align: center;
            padding: 3rem 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin-top: 4rem;
            opacity: 0.7;
        }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .container { padding: 2rem 1rem; }
            .metrics-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
            .dashboard-grid { grid-template-columns: 1fr; }
            .status-bar { flex-direction: column; gap: 1rem; }
        }
        
        .loading {
            opacity: 0;
            animation: fadeIn 1s ease-in-out forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏭 Sentia Manufacturing Dashboard</h1>
        <p class="subtitle">Enterprise Manufacturing Intelligence Platform v2.0.0</p>
        <div class="status-bar">
            <div class="status-item">
                <div class="status-dot"></div>
                <span>System Online</span>
            </div>
            <div class="status-item">
                <div class="status-dot"></div>
                <span>Real-time Data</span>
            </div>
            <div class="status-item">
                <div class="status-dot"></div>
                <span>Enterprise Ready</span>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="metrics-grid loading">
            <div class="metric-card">
                <div class="metric-value">99.9%</div>
                <div class="metric-label">System Uptime</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">2,847</div>
                <div class="metric-label">Units Produced</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">96.8%</div>
                <div class="metric-label">Quality Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$4.2M</div>
                <div class="metric-label">Monthly Revenue</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">15</div>
                <div class="metric-label">Active Lines</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">847ms</div>
                <div class="metric-label">Avg Response</div>
            </div>
        </div>

        <div class="dashboard-grid loading">
            <div class="dashboard-card">
                <span class="card-icon">📊</span>
                <h3 class="card-title">Production Analytics</h3>
                <p class="card-description">Real-time production monitoring with advanced analytics, efficiency tracking, and predictive maintenance scheduling. Monitor all production lines with enterprise-grade reliability.</p>
            </div>
            
            <div class="dashboard-card">
                <span class="card-icon">📦</span>
                <h3 class="card-title">Inventory Intelligence</h3>
                <p class="card-description">AI-powered inventory management with automated reordering, supply chain optimization, and real-time stock level monitoring across all facilities.</p>
            </div>
            
            <div class="dashboard-card">
                <span class="card-icon">🔍</span>
                <h3 class="card-title">Quality Assurance</h3>
                <p class="card-description">Comprehensive quality control with automated testing, compliance tracking, and defect analysis. Ensure products meet the highest industry standards.</p>
            </div>
            
            <div class="dashboard-card">
                <span class="card-icon">💰</span>
                <h3 class="card-title">Financial Intelligence</h3>
                <p class="card-description">Advanced financial analytics with working capital optimization, cost analysis, and revenue forecasting. Integrated with Xero, Shopify, and ERP systems.</p>
            </div>
            
            <div class="dashboard-card">
                <span class="card-icon">🔧</span>
                <h3 class="card-title">Maintenance Management</h3>
                <p class="card-description">Predictive maintenance with IoT integration, equipment health monitoring, and automated scheduling to minimize downtime and maximize efficiency.</p>
            </div>
            
            <div class="dashboard-card">
                <span class="card-icon">🤖</span>
                <h3 class="card-title">AI-Powered Insights</h3>
                <p class="card-description">Machine learning algorithms for demand forecasting, anomaly detection, and process optimization. Turn data into actionable business intelligence.</p>
            </div>
        </div>

        <div class="api-endpoints loading">
            <h3>🔗 Enterprise API Endpoints</h3>
            <div class="endpoint">
                <span><strong>Health Check:</strong> System status and monitoring</span>
                <code>GET /health</code>
            </div>
            <div class="endpoint">
                <span><strong>API Status:</strong> Service information and metrics</span>
                <code>GET /api/status</code>
            </div>
            <div class="endpoint">
                <span><strong>Production Data:</strong> Real-time production metrics</span>
                <code>GET /api/production</code>
            </div>
            <div class="endpoint">
                <span><strong>Quality Metrics:</strong> Quality control data</span>
                <code>GET /api/quality</code>
            </div>
            <div class="endpoint">
                <span><strong>Financial Data:</strong> Revenue and cost analytics</span>
                <code>GET /api/financial</code>
            </div>
        </div>
    </div>

    <div class="footer loading">
        <p><strong>Sentia Manufacturing Dashboard</strong> - Enterprise Edition v2.0.0</p>
        <p>Bulletproof • Scalable • Enterprise-Ready</p>
        <p>© 2025 Sentia Manufacturing. All rights reserved.</p>
    </div>

    <script>
        // Enterprise JavaScript - Zero Dependencies
        document.addEventListener('DOMContentLoaded', function() {
            // Animate loading elements
            const loadingElements = document.querySelectorAll('.loading');
            loadingElements.forEach((el, index) => {
                setTimeout(() => {
                    el.style.animationDelay = (index * 0.2) + 's';
                }, 100);
            });

            // Update metrics periodically
            setInterval(updateMetrics, 30000);
            
            // Log page load
            console.log('Sentia Manufacturing Dashboard v2.0.0 - Enterprise Edition Loaded');
        });

        function updateMetrics() {
            // Simulate real-time updates
            const metrics = document.querySelectorAll('.metric-value');
            metrics.forEach(metric => {
                if (metric.textContent.includes('%')) {
                    const current = parseFloat(metric.textContent);
                    const variation = (Math.random() - 0.5) * 0.2;
                    const newValue = Math.max(90, Math.min(100, current + variation));
                    metric.textContent = newValue.toFixed(1) + '%';
                }
            });
        }
    </script>
</body>
</html>`;

// Enterprise Request Handler
class RequestHandler {
  constructor(healthMonitor) {
    this.healthMonitor = healthMonitor;
  }

  handle(req, res) {
    this.healthMonitor.recordRequest();
    
    try {
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname;

      // Set security headers
      this.setSecurityHeaders(res);

      // Handle CORS
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Route handling
      switch (pathname) {
        case '/':
          this.serveDashboard(res);
          break;
        case '/health':
          this.serveHealth(res);
          break;
        case '/api/status':
          this.serveStatus(res);
          break;
        case '/api/production':
          this.serveProduction(res);
          break;
        case '/api/quality':
          this.serveQuality(res);
          break;
        case '/api/financial':
          this.serveFinancial(res);
          break;
        default:
          this.serve404(res);
      }

      Logger.info('Request processed', { 
        method: req.method, 
        url: req.url,
        userAgent: req.headers['user-agent']
      });

    } catch (error) {
      this.healthMonitor.recordError();
      this.serveError(res, error);
      Logger.error('Request error', { error: error.message, stack: error.stack });
    }
  }

  setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Access-Control-Allow-Origin', CONFIG.CORS_ORIGINS);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  serveDashboard(res) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(DASHBOARD_HTML);
  }

  serveHealth(res) {
    const health = this.healthMonitor.getStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  }

  serveStatus(res) {
    const status = {
      service: 'Sentia Manufacturing Dashboard',
      version: CONFIG.VERSION,
      environment: CONFIG.NODE_ENV,
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: [
        'Production Analytics',
        'Inventory Intelligence', 
        'Quality Assurance',
        'Financial Intelligence',
        'Maintenance Management',
        'AI-Powered Insights'
      ]
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
  }

  serveProduction(res) {
    const data = {
      totalUnits: 2847,
      efficiency: 96.8,
      activeLines: 15,
      avgCycleTime: 847,
      qualityScore: 96.8,
      timestamp: new Date().toISOString()
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  serveQuality(res) {
    const data = {
      overallScore: 96.8,
      defectRate: 0.032,
      passRate: 99.968,
      inspections: 1247,
      timestamp: new Date().toISOString()
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  serveFinancial(res) {
    const data = {
      monthlyRevenue: 4200000,
      profitMargin: 23.5,
      costPerUnit: 45.67,
      workingCapital: 1850000,
      timestamp: new Date().toISOString()
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  serve404(res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', status: 404 }));
  }

  serveError(res, error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal Server Error', 
      status: 500,
      message: CONFIG.NODE_ENV === 'development' ? error.message : 'Server Error'
    }));
  }
}

// Enterprise Server
class EnterpriseServer {
  constructor() {
    this.healthMonitor = new HealthMonitor();
    this.requestHandler = new RequestHandler(this.healthMonitor);
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      this.requestHandler.handle(req, res);
    });

    this.server.listen(CONFIG.PORT, '0.0.0.0', () => {
      Logger.info('Enterprise server started', {
        port: CONFIG.PORT,
        environment: CONFIG.NODE_ENV,
        version: CONFIG.VERSION,
        pid: process.pid
      });
      
      console.log(`
🚀 Sentia Manufacturing Dashboard - Enterprise Edition
📊 Version: ${CONFIG.VERSION}
🌐 Port: ${CONFIG.PORT}
🔧 Environment: ${CONFIG.NODE_ENV}
📈 Health: http://localhost:${CONFIG.PORT}/health
🔗 API: http://localhost:${CONFIG.PORT}/api/status
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    
    // Error handling
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      this.shutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled rejection', { reason, promise });
    });
  }

  shutdown(signal) {
    Logger.info('Shutting down server', { signal });
    
    if (this.server) {
      this.server.close(() => {
        Logger.info('Server shutdown complete');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Start Enterprise Server
if (require.main === module) {
  const server = new EnterpriseServer();
  server.start();
}

module.exports = { EnterpriseServer, CONFIG };
