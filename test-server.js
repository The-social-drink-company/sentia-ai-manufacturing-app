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
app.post('/api/analytics/whatif-analysis/calculate', (req, res) => {
  const mockResponse = {
    workingCapital: {
      current: 1250000,
      projected: 1480000,
      change: 230000,
      improvement: 18.4
    },
    cashFlow: {
      monthly: [120000, 135000, 148000, 162000, 175000, 189000],
      quarterly: 543000,
      annual: 2172000
    },
    borrowingRequirements: {
      amount: 450000,
      interestRate: req.body.interestRate || 3.5,
      monthlyPayment: 13247,
      totalCost: 476940
    },
    confidence: 87,
    calculationTime: Math.random() * 1000 + 500
  };
  
  res.json(mockResponse);
});

app.get('/api/analytics/whatif-analysis/market/:market', (req, res) => {
  const { market } = req.params;
  
  const mockResponse = {
    market,
    data: {
      demandForecast: Math.floor(Math.random() * 1000000) + 500000,
      seasonalityFactor: Math.random() * 0.4 + 0.8,
      competitiveIndex: Math.random() * 100,
      riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    },
    confidence: 85
  };
  
  res.json(mockResponse);
});

app.post('/api/analytics/whatif-analysis/save-scenario', (req, res) => {
  res.json({
    success: true,
    scenarioId: `scenario_${Date.now()}`,
    message: 'Scenario saved successfully'
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