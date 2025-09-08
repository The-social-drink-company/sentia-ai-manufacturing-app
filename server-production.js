import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://web-production-1f10.up.railway.app',
    'https://sentia-manufacturing-dashboard-production.up.railway.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic API endpoints with mock data
app.get('/api/production/status', (req, res) => {
  res.json({
    overallEfficiency: 94.2,
    efficiencyChange: 2.3,
    unitsProduced: 2847,
    unitsChange: 143,
    qualityRate: 98.1,
    qualityChange: 1.2,
    downtimeMinutes: 23,
    downtimeChange: 8,
    lines: [
      { id: 'line-a', name: 'Line A - GABA Red', status: 'running', efficiency: 96.1, outputRate: 456, target: 480 },
      { id: 'line-b', name: 'Line B - GABA Clear', status: 'running', efficiency: 92.3, outputRate: 387, target: 420 },
      { id: 'line-c', name: 'Line C - Packaging', status: 'paused', efficiency: 89.7, outputRate: 0, target: 350 }
    ],
    currentBatches: [
      { id: 'B2025001', product: 'GABA Red 500ml', status: 'processing', completion: 65, startTime: '2025-09-08T06:00:00Z' },
      { id: 'B2025002', product: 'GABA Clear 500ml', status: 'quality-check', completion: 89, startTime: '2025-09-08T04:30:00Z' }
    ],
    qualityAlerts: [
      { title: 'Temperature Variance', description: 'Line A temperature 2°C above target', time: '10 minutes ago' }
    ],
    maintenanceSchedule: [
      { equipment: 'Bottling Line A', type: 'Preventive Maintenance', priority: 'medium', scheduled: 'Tomorrow 8:00 AM' }
    ]
  });
});

app.get('/api/quality/metrics', (req, res) => {
  res.json({
    passRate: 98.1,
    defectRate: 1.9,
    activeTests: [
      { id: 'QT001', product: 'GABA Red', status: 'running', completion: 75 }
    ],
    alerts: []
  });
});

app.get('/api/forecasting/demand', (req, res) => {
  res.json({
    forecast: [2400, 2450, 2380, 2500, 2420, 2480, 2390],
    confidence: 0.85,
    model: 'AI Ensemble',
    insights: ['Demand expected to increase 3.2% next week']
  });
});

app.get('/api/working-capital/kpis', (req, res) => {
  res.json({
    cashFlow: 485000,
    accountsReceivable: 1200000,
    accountsPayable: 785000,
    inventory: 950000,
    workingCapitalRatio: 1.8
  });
});

app.get('/api/working-capital/kpis/trends', (req, res) => {
  res.json({
    trends: [
      { date: '2025-09-01', cashFlow: 450000 },
      { date: '2025-09-02', cashFlow: 465000 },
      { date: '2025-09-03', cashFlow: 470000 },
      { date: '2025-09-04', cashFlow: 475000 },
      { date: '2025-09-05', cashFlow: 480000 },
      { date: '2025-09-06', cashFlow: 485000 }
    ]
  });
});

app.get('/api/inventory/status', (req, res) => {
  res.json({
    totalValue: 950000,
    lowStockItems: 3,
    overStockItems: 1,
    categories: [
      { name: 'Raw Materials', value: 400000, status: 'good' },
      { name: 'Work in Progress', value: 250000, status: 'good' },
      { name: 'Finished Goods', value: 300000, status: 'low' }
    ]
  });
});

// Catch all handler - serve React app for any route not handled above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Serving React app from: ${path.join(__dirname, 'dist')}`);
});

export default app;