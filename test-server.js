import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// What-If Analysis endpoints for testing
app.get('/api/analytics/whatif-analysis', (req, res) => {
  res.json({
    success: true,
    system: 'operational',
    parameters: {
      rawMaterials: { min: 0, max: 100, default: 50 },
      manufacturing: { min: 0, max: 100, default: 50 },
      shipping: { min: 0, max: 100, default: 50 },
      seasonality: { min: 0.5, max: 1.5, default: 1.0 },
      interestRate: { min: 1.0, max: 10.0, default: 3.5 }
    },
    markets: ['UK', 'USA', 'Europe', 'Asia'],
    initialized: true
  });
});

app.post('/api/analytics/whatif-analysis/calculate', (req, res) => {
  const { rawMaterials, manufacturing, shipping, seasonality, interestRate, market } = req.body;
  
  const mockResponse = {
    success: true,
    workingCapital: {
      current: 1250000,
      projected: 1250000 + (rawMaterials || 50) * 5000 + (manufacturing || 50) * 8000,
      change: (rawMaterials || 50) * 5000 + (manufacturing || 50) * 8000,
      improvement: ((rawMaterials || 50) * 5000 + (manufacturing || 50) * 8000) / 1250000 * 100
    },
    cashFlow: {
      monthly: [120000, 135000, 148000, 162000, 175000, 189000],
      quarterly: 543000,
      annual: 2172000
    },
    borrowingRequirements: {
      amount: 450000,
      interestRate: interestRate || 3.5,
      monthlyPayment: 13247,
      totalCost: 476940
    },
    marketAnalysis: {
      market: market || 'UK',
      demandForecast: Math.floor(Math.random() * 1000000) + 500000,
      seasonalityFactor: seasonality || 1.0,
      competitiveIndex: Math.random() * 100,
      riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    },
    workingCapitalSummary: {
      currentAssets: 2100000,
      currentLiabilities: 850000,
      netWorkingCapital: 1250000,
      ratio: 2.47
    },
    breakdown: {
      inventory: 800000,
      receivables: 600000,
      payables: 400000,
      cash: 700000
    },
    confidence: Math.floor(Math.random() * 20) + 80,
    calculationTime: Math.random() * 1000 + 500,
    timestamp: new Date().toISOString()
  };
  
  res.json(mockResponse);
});

app.get('/api/analytics/whatif-analysis/market/:market', (req, res) => {
  const { market } = req.params;
  
  const mockResponse = {
    success: true,
    market,
    data: {
      demandForecast: Math.floor(Math.random() * 1000000) + 500000,
      seasonalityFactor: Math.random() * 0.4 + 0.8,
      competitiveIndex: Math.random() * 100,
      riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    },
    marketAnalysis: {
      market,
      performance: 'good',
      trend: 'improving'
    },
    confidence: Math.floor(Math.random() * 20) + 80
  };
  
  res.json(mockResponse);
});

app.post('/api/analytics/whatif-analysis/save-scenario', (req, res) => {
  const { name, parameters } = req.body;
  
  res.json({
    success: true,
    id: `scenario_${Date.now()}`,
    scenarioId: `scenario_${Date.now()}`,
    name: name || 'Saved Scenario',
    message: 'Scenario saved successfully',
    parameters: parameters || {},
    timestamp: new Date().toISOString()
  });
});

app.get('/api/analytics/whatif-analysis/scenarios', (req, res) => {
  res.json({
    success: true,
    scenarios: [
      {
        id: 'scenario_1',
        name: 'Base Case',
        parameters: { rawMaterials: 50, manufacturing: 50, shipping: 50 },
        createdAt: new Date().toISOString()
      },
      {
        id: 'scenario_2',
        name: 'High Growth',
        parameters: { rawMaterials: 80, manufacturing: 75, shipping: 60 },
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Mock other API endpoints that tests might need
app.get('/api/services/status', (req, res) => {
  res.json({
    database: { status: 'connected', latency: '12ms' },
    redis: { status: 'connected', latency: '5ms' },
    xero: { status: 'configured', lastSync: new Date().toISOString() },
    shopify: { status: 'configured', lastSync: new Date().toISOString() }
  });
});

app.get('/api/analytics/kpis', (req, res) => {
  res.json({
    revenue: 2450000,
    workingCapital: 1250000,
    cashFlow: 320000,
    profitMargin: 18.5
  });
});

app.get('/api/working-capital/overview', (req, res) => {
  res.json({
    currentRatio: 2.1,
    quickRatio: 1.8,
    cashRatio: 0.9,
    workingCapital: 1250000,
    trend: 'improving'
  });
});

// Production endpoints
app.get('/api/production/status', (req, res) => {
  res.json({
    status: 'operational',
    activeJobs: 12,
    completedToday: 8,
    efficiency: 94.5
  });
});

app.post('/api/production/control', (req, res) => {
  res.json({ success: true, message: 'Production control updated' });
});

app.get('/api/production/metrics', (req, res) => {
  res.json({
    throughput: 156,
    downtime: 2.3,
    oee: 87.2,
    defectRate: 0.8
  });
});

app.get('/api/production/batches', (req, res) => {
  res.json({
    batches: [
      { id: 'B001', status: 'in-progress', completion: 75 },
      { id: 'B002', status: 'completed', completion: 100 }
    ]
  });
});

app.post('/api/production/batch/update', (req, res) => {
  res.json({ success: true, message: 'Batch updated successfully' });
});

// Quality endpoints
app.get('/api/quality/dashboard', (req, res) => {
  res.json({
    overallScore: 96.2,
    testsToday: 45,
    passRate: 97.8,
    issues: 1
  });
});

app.post('/api/quality/test/submit', (req, res) => {
  res.json({ success: true, testId: `TEST_${Date.now()}` });
});

app.post('/api/quality/batch/approve', (req, res) => {
  res.json({ success: true, message: 'Batch approved' });
});

app.post('/api/quality/alert/resolve', (req, res) => {
  res.json({ success: true, message: 'Alert resolved' });
});

app.get('/api/quality/tests/schedule', (req, res) => {
  res.json({
    scheduled: [
      { id: 'T001', type: 'dimensional', time: '10:00' },
      { id: 'T002', type: 'material', time: '14:00' }
    ]
  });
});

// Inventory endpoints
app.get('/api/inventory/dashboard', (req, res) => {
  res.json({
    totalItems: 1247,
    lowStock: 8,
    value: 2840000,
    turnover: 4.2
  });
});

app.post('/api/inventory/stock/update', (req, res) => {
  res.json({ success: true, message: 'Stock updated' });
});

app.get('/api/inventory/alerts', (req, res) => {
  res.json({
    alerts: [
      { item: 'Raw Material A', level: 'low', quantity: 45 },
      { item: 'Component B', level: 'critical', quantity: 12 }
    ]
  });
});

app.post('/api/inventory/reorder', (req, res) => {
  res.json({ success: true, orderId: `ORD_${Date.now()}` });
});

// Working capital endpoints
app.get('/api/working-capital/metrics', (req, res) => {
  res.json({
    current: 1250000,
    ratio: 2.1,
    daysOutstanding: 45,
    cashCycle: 68
  });
});

app.get('/api/working-capital/projections', (req, res) => {
  res.json({
    projections: [
      { month: 'Jan', amount: 1250000 },
      { month: 'Feb', amount: 1320000 },
      { month: 'Mar', amount: 1450000 }
    ]
  });
});

app.get('/api/working-capital/ai-recommendations', (req, res) => {
  res.json({
    recommendations: [
      'Optimize payment terms with suppliers',
      'Improve inventory turnover rates',
      'Consider factoring for faster cash conversion'
    ]
  });
});

app.post('/api/working-capital/upload-financial-data', (req, res) => {
  res.json({ success: true, message: 'Financial data uploaded' });
});

// Xero endpoints
app.get('/api/xero/balance-sheet', (req, res) => {
  res.json({
    assets: 5200000,
    liabilities: 2100000,
    equity: 3100000,
    date: new Date().toISOString()
  });
});

app.get('/api/xero/cash-flow', (req, res) => {
  res.json({
    operating: 450000,
    investing: -125000,
    financing: -80000,
    net: 245000
  });
});

app.get('/api/xero/profit-loss', (req, res) => {
  res.json({
    revenue: 2800000,
    expenses: 2100000,
    profit: 700000,
    margin: 25.0
  });
});

// Shopify endpoints
app.get('/api/shopify/dashboard-data', (req, res) => {
  res.json({
    orders: 1247,
    revenue: 89420,
    conversion: 3.2,
    visitors: 12840
  });
});

app.get('/api/shopify/orders', (req, res) => {
  res.json({
    orders: [
      { id: 'ORD001', amount: 245.50, status: 'fulfilled' },
      { id: 'ORD002', amount: 189.99, status: 'pending' }
    ]
  });
});

// Analytics endpoints
app.get('/api/analytics/trends', (req, res) => {
  res.json({
    sales: { trend: 'up', change: 12.5 },
    profit: { trend: 'up', change: 8.2 },
    costs: { trend: 'down', change: -3.1 }
  });
});

app.get('/api/analytics/ai-insights', (req, res) => {
  res.json({
    insights: [
      'Revenue growth accelerating in Q4',
      'Inventory optimization opportunity identified',
      'Customer retention improving significantly'
    ]
  });
});

// Data endpoints
app.post('/api/data/upload', (req, res) => {
  res.json({ success: true, message: 'Data uploaded successfully' });
});

app.get('/api/data/status', (req, res) => {
  res.json({
    lastSync: new Date().toISOString(),
    status: 'synchronized',
    records: 12847
  });
});

// Admin endpoints
app.get('/api/admin/users', (req, res) => {
  res.json({
    users: [
      { id: 1, email: 'admin@sentia.com', role: 'admin' },
      { id: 2, email: 'user@sentia.com', role: 'user' }
    ]
  });
});

app.get('/api/admin/system-stats', (req, res) => {
  res.json({
    uptime: '99.9%',
    users: 24,
    storage: '45.2GB',
    requests: 128947
  });
});

// Catch all other API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  POST /api/analytics/whatif-analysis/calculate');
  console.log('  GET  /api/analytics/whatif-analysis/market/:market');
  console.log('  POST /api/analytics/whatif-analysis/save-scenario');
  console.log('  GET  /api/services/status');
  console.log('  GET  /api/analytics/kpis');
  console.log('  GET  /api/working-capital/overview');
});

export default app;