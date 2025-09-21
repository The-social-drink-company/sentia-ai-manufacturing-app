import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // API endpoint
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Sentia Manufacturing Dashboard API is running',
      version: '1.0.5',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Return the manufacturing dashboard
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sentia Manufacturing Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          min-height: 100vh;
          overflow-x: hidden;
        }
        .header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 20px 0;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-top: 40px;
        }
        .card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 30px;
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .card-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          display: block;
        }
        .card h3 {
          font-size: 1.5rem;
          margin-bottom: 15px;
          color: #fff;
        }
        .card p {
          opacity: 0.9;
          line-height: 1.6;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 40px 0;
        }
        .metric {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        .metric-value {
          font-size: 2rem;
          font-weight: bold;
          color: #4ade80;
        }
        .metric-label {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-top: 5px;
        }
        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          background: #4ade80;
          border-radius: 50%;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .footer {
          text-align: center;
          padding: 40px 20px;
          opacity: 0.7;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: 60px;
        }
        @media (max-width: 768px) {
          .header h1 { font-size: 2rem; }
          .dashboard-grid { grid-template-columns: 1fr; gap: 20px; }
          .container { padding: 20px 15px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏭 Sentia Manufacturing Dashboard</h1>
        <p><span class="status-indicator"></span>Enterprise Manufacturing Intelligence Platform</p>
      </div>
      
      <div class="container">
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">98.5%</div>
            <div class="metric-label">System Uptime</div>
          </div>
          <div class="metric">
            <div class="metric-value">1,247</div>
            <div class="metric-label">Units Produced Today</div>
          </div>
          <div class="metric">
            <div class="metric-value">94.2%</div>
            <div class="metric-label">Quality Score</div>
          </div>
          <div class="metric">
            <div class="metric-value">$2.4M</div>
            <div class="metric-label">Revenue This Month</div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <span class="card-icon">📊</span>
            <h3>Production Overview</h3>
            <p>Real-time production metrics, efficiency tracking, and performance analytics. Monitor production lines, output rates, and operational KPIs.</p>
          </div>
          
          <div class="card">
            <span class="card-icon">📦</span>
            <h3>Inventory Management</h3>
            <p>Advanced inventory tracking, stock level optimization, and supply chain management. Real-time visibility into raw materials and finished goods.</p>
          </div>
          
          <div class="card">
            <span class="card-icon">🔍</span>
            <h3>Quality Control</h3>
            <p>Comprehensive quality metrics, compliance tracking, and defect analysis. Ensure product quality meets industry standards.</p>
          </div>
          
          <div class="card">
            <span class="card-icon">💰</span>
            <h3>Financial Analytics</h3>
            <p>Working capital analysis, cost optimization, and financial performance tracking. Integrated with Xero and Shopify for complete visibility.</p>
          </div>
          
          <div class="card">
            <span class="card-icon">🔧</span>
            <h3>Maintenance Scheduling</h3>
            <p>Predictive maintenance, equipment monitoring, and downtime prevention. Optimize equipment lifecycle and reduce operational costs.</p>
          </div>
          
          <div class="card">
            <span class="card-icon">📈</span>
            <h3>Performance Analytics</h3>
            <p>Advanced analytics powered by AI, trend analysis, and predictive insights. Make data-driven decisions for operational excellence.</p>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>Sentia Manufacturing Dashboard v1.0.5 | Enterprise Edition</p>
        <p>Powered by AI-driven manufacturing intelligence</p>
      </div>
    </body>
    </html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sentia Manufacturing Dashboard server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API status: http://localhost:${PORT}/api/status`);
  console.log(`🌐 Main app: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
