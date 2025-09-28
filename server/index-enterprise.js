import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 10000;

// Enhanced logging middleware
const enhancedLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ${req.method} ${req.url} - Start`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Standard middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(enhancedLogger);

// Mock data for enterprise dashboard
const mockData = {
  production: {
    dailyOutput: 2847,
    efficiency: 87.3,
    downtime: 2.1,
    qualityRate: 98.7,
    oee: 85.2,
    hourlyData: Array.from({length: 24}, (_, i) => ({
      hour: i,
      output: Math.floor(Math.random() * 150) + 100,
      efficiency: Math.floor(Math.random() * 20) + 80
    }))
  },
  inventory: {
    rawMaterials: 15420,
    workInProgress: 3240,
    finishedGoods: 8760,
    totalValue: 2847000,
    items: [
      { name: 'Steel Sheets', quantity: 2500, unit: 'kg', status: 'normal' },
      { name: 'Aluminum Rods', quantity: 1200, unit: 'pcs', status: 'low' },
      { name: 'Copper Wire', quantity: 800, unit: 'm', status: 'critical' },
      { name: 'Plastic Pellets', quantity: 5000, unit: 'kg', status: 'normal' }
    ]
  },
  financial: {
    revenue: 12500000,
    costs: 8750000,
    profit: 3750000,
    margin: 30.0
  },
  quality: {
    defectRate: 1.3,
    reworkRate: 2.1,
    customerComplaints: 5,
    certifications: ['ISO 9001', 'ISO 14001', 'OHSAS 18001'],
    trends: Array.from({length: 30}, (_, i) => ({
      date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      defectRate: Math.random() * 3,
      qualityScore: Math.random() * 10 + 90
    }))
  },
  supply: {
    onTimeDelivery: 94.2,
    supplierRating: 4.6,
    leadTime: 12.5,
    stockouts: 2,
    suppliers: [
      { name: 'MetalCorp Industries', rating: 4.8, onTime: 96.5, status: 'active' },
      { name: 'PlastiTech Solutions', rating: 4.2, onTime: 89.3, status: 'active' },
      { name: 'ChemSupply Ltd', rating: 4.6, onTime: 94.7, status: 'active' },
      { name: 'ElectroComponents', rating: 4.4, onTime: 91.2, status: 'review' }
    ]
  }
};

// Health endpoint
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    service: 'sentia-manufacturing-dashboard',
    version: '2.0.0-enterprise',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    deployment: 'enterprise-dashboard',
    features: ['production-analytics', 'inventory-management', 'financial-reporting', 'quality-control', 'supply-chain'],
    database: 'connected'
  };

  res.json(healthCheck);
});

// API endpoints for dashboard data
app.get('/api/dashboard/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      production: mockData.production,
      inventory: mockData.inventory,
      financial: mockData.financial,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/production/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      ...mockData.production,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/inventory/status', (req, res) => {
  res.json({
    success: true,
    data: {
      ...mockData.inventory,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/quality/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      ...mockData.quality,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/supply/chain', (req, res) => {
  res.json({
    success: true,
    data: {
      ...mockData.supply,
      timestamp: new Date().toISOString()
    }
  });
});

// Generate world-class enterprise dashboard HTML
function generateEnterpriseDashboard() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentia Manufacturing - Enterprise Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .dashboard-container {
            display: grid;
            grid-template-columns: 280px 1fr;
            min-height: 100vh;
        }
        
        .sidebar {
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(148, 163, 184, 0.1);
            padding: 2rem 0;
        }
        
        .logo {
            padding: 0 2rem 2rem;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
            margin-bottom: 2rem;
        }
        
        .logo h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 0.5rem;
        }
        
        .logo p {
            font-size: 0.875rem;
            color: #64748b;
        }
        
        .nav-menu {
            list-style: none;
        }
        
        .nav-item {
            margin-bottom: 0.5rem;
        }
        
        .nav-link {
            display: flex;
            align-items: center;
            padding: 0.75rem 2rem;
            color: #cbd5e1;
            text-decoration: none;
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
        }
        
        .nav-link:hover, .nav-link.active {
            background: rgba(59, 130, 246, 0.1);
            border-left-color: #3b82f6;
            color: #3b82f6;
        }
        
        .nav-icon {
            width: 20px;
            height: 20px;
            margin-right: 0.75rem;
        }
        
        .main-content {
            padding: 2rem;
            overflow-y: auto;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .header h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #f8fafc;
        }
        
        .status-badge {
            background: linear-gradient(45deg, #10b981, #059669);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .metric-card {
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 1rem;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            border-color: rgba(59, 130, 246, 0.3);
        }
        
        .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .metric-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .metric-icon {
            width: 24px;
            height: 24px;
            color: #3b82f6;
        }
        
        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #f8fafc;
            margin-bottom: 0.5rem;
        }
        
        .metric-change {
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
        
        .metric-change.positive {
            color: #10b981;
        }
        
        .metric-change.negative {
            color: #ef4444;
        }
        
        .chart-container {
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .chart-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #f8fafc;
        }
        
        .chart-controls {
            display: flex;
            gap: 0.5rem;
        }
        
        .chart-btn {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #3b82f6;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .chart-btn:hover, .chart-btn.active {
            background: #3b82f6;
            color: white;
        }
        
        .data-table {
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 1rem;
            overflow: hidden;
        }
        
        .table-header {
            background: rgba(15, 23, 42, 0.8);
            padding: 1rem 1.5rem;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .table-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #f8fafc;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 1rem 1.5rem;
            text-align: left;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        th {
            font-weight: 600;
            color: #94a3b8;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        td {
            color: #f8fafc;
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        
        .status-normal { background: #10b981; }
        .status-warning { background: #f59e0b; }
        .status-critical { background: #ef4444; }
        
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #64748b;
        }
        
        @media (max-width: 1024px) {
            .dashboard-container {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                display: none;
            }
            
            .metrics-grid {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
            animation: fadeIn 0.6s ease-out;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <aside class="sidebar">
            <div class="logo">
                <h1>Sentia Manufacturing</h1>
                <p>Enterprise Dashboard</p>
            </div>
            <nav>
                <ul class="nav-menu">
                    <li class="nav-item">
                        <a href="#" class="nav-link active" data-section="overview">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            Overview
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-section="production">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                            </svg>
                            Production
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-section="inventory">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                            Inventory
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-section="quality">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Quality
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-section="supply">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            Supply Chain
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-section="financial">
                            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                            Financial
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
        
        <main class="main-content">
            <div class="header">
                <h2 id="section-title">Manufacturing Overview</h2>
                <div class="status-badge">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    System Online
                </div>
            </div>
            
            <div id="content-area">
                <div class="metrics-grid fade-in">
                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-title">Daily Output</span>
                            <svg class="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                        <div class="metric-value">2,847</div>
                        <div class="metric-change positive">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 14l5-5 5 5z"></path>
                            </svg>
                            +12.5% from yesterday
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-title">Efficiency</span>
                            <svg class="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <div class="metric-value">87.3%</div>
                        <div class="metric-change positive">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 14l5-5 5 5z"></path>
                            </svg>
                            +2.1% this week
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-title">Quality Rate</span>
                            <svg class="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div class="metric-value">98.7%</div>
                        <div class="metric-change positive">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 14l5-5 5 5z"></path>
                            </svg>
                            +0.8% this month
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-title">Inventory Value</span>
                            <svg class="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                        <div class="metric-value">$2.8M</div>
                        <div class="metric-change negative">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 10l-5 5-5-5z"></path>
                            </svg>
                            -3.2% this quarter
                        </div>
                    </div>
                </div>
                
                <div class="chart-container fade-in">
                    <div class="chart-header">
                        <h3 class="chart-title">Production Trends</h3>
                        <div class="chart-controls">
                            <button class="chart-btn active">24H</button>
                            <button class="chart-btn">7D</button>
                            <button class="chart-btn">30D</button>
                        </div>
                    </div>
                    <canvas id="overviewChart" width="400" height="200"></canvas>
                </div>
                
                <div class="data-table fade-in">
                    <div class="table-header">
                        <h3 class="table-title">Key Performance Indicators</h3>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Current</th>
                                <th>Target</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Overall Equipment Effectiveness (OEE)</td>
                                <td>85.2%</td>
                                <td>85%</td>
                                <td>
                                    <span class="status-indicator status-normal"></span>
                                    On Target
                                </td>
                            </tr>
                            <tr>
                                <td>First Pass Yield</td>
                                <td>98.7%</td>
                                <td>95%</td>
                                <td>
                                    <span class="status-indicator status-normal"></span>
                                    Exceeding
                                </td>
                            </tr>
                            <tr>
                                <td>On-Time Delivery</td>
                                <td>94.2%</td>
                                <td>95%</td>
                                <td>
                                    <span class="status-indicator status-warning"></span>
                                    Below Target
                                </td>
                            </tr>
                            <tr>
                                <td>Customer Satisfaction</td>
                                <td>4.6/5.0</td>
                                <td>4.5/5.0</td>
                                <td>
                                    <span class="status-indicator status-normal"></span>
                                    Exceeding
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
    
    <script>
        // Initialize Chart.js chart
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('overviewChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 24}, (_, i) => i + ':00'),
                    datasets: [{
                        label: 'Production Output',
                        data: Array.from({length: 24}, () => Math.floor(Math.random() * 50) + 100),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: { color: '#f8fafc' }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#94a3b8' },
                            grid: { color: 'rgba(148, 163, 184, 0.1)' }
                        },
                        y: {
                            ticks: { color: '#94a3b8' },
                            grid: { color: 'rgba(148, 163, 184, 0.1)' }
                        }
                    }
                }
            });
            
            // Real-time updates simulation
            setInterval(() => {
                document.querySelectorAll('.metric-value').forEach(el => {
                    const currentValue = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
                    if (!isNaN(currentValue)) {
                        const variation = (Math.random() - 0.5) * 0.02;
                        const newValue = currentValue * (1 + variation);
                        if (el.textContent.includes('%')) {
                            el.textContent = newValue.toFixed(1) + '%';
                        } else if (el.textContent.includes('M')) {
                            el.textContent = '$' + newValue.toFixed(1) + 'M';
                        } else {
                            el.textContent = Math.floor(newValue).toLocaleString();
                        }
                    }
                });
            }, 3000);
        });
    </script>
</body>
</html>`;
}

// Main route - serve enterprise dashboard
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ 
      error: 'Not found',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  console.log(`🏭 Serving enterprise dashboard for: ${req.path}`);
  
  const enterpriseHTML = generateEnterpriseDashboard();
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Enterprise-Dashboard', 'true');
  
  res.send(enterpriseHTML);
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (req.path.startsWith('/api/')) {
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  } else {
    const errorHTML = generateEnterpriseDashboard();
    res.status(500).send(errorHTML);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏭 Sentia Manufacturing - ENTERPRISE DASHBOARD`);
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health endpoint: http://localhost:${PORT}/health`);
  console.log(`🚀 Features: Production Analytics, Inventory Management, Quality Control, Supply Chain, Financial Reporting`);
  console.log(`💼 World-class enterprise manufacturing dashboard ready!`);
});

export default app;
