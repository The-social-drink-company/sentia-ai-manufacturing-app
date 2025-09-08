import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005', 'http://localhost:3006', 'http://localhost:3007'],
  credentials: true
}));

app.use(express.json());

// Mock manufacturing data for enterprise dashboard
const mockData = {
  production: {
    totalUnits: 15420,
    efficiency: 94.2,
    downtime: 2.3,
    oee: 89.1,
    trend: 'up',
    trendPercentage: '+3.2%'
  },
  quality: {
    passRate: 98.7,
    defectRate: 1.3,
    inspections: 2850,
    trend: 'up',
    trendPercentage: '+0.8%'
  },
  inventory: {
    totalValue: 2840000,
    turnover: 6.2,
    stockouts: 3,
    trend: 'up',
    trendPercentage: '+1.5%'
  },
  financial: {
    revenue: 5420000,
    costs: 3280000,
    profit: 2140000,
    margin: 39.5,
    trend: 'up',
    trendPercentage: '+2.1%'
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'enterprise-minimal'
  });
});

// Server-Sent Events endpoint for real-time updates
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial data
  res.write(`data: ${JSON.stringify({ 
    type: 'dashboard-data', 
    data: mockData,
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Send periodic updates
  const interval = setInterval(() => {
    // Update mock data with slight variations
    const updatedData = {
      ...mockData,
      production: {
        ...mockData.production,
        totalUnits: mockData.production.totalUnits + Math.floor(Math.random() * 100),
        efficiency: +(mockData.production.efficiency + (Math.random() - 0.5) * 2).toFixed(1)
      }
    };

    res.write(`data: ${JSON.stringify({ 
      type: 'production-update', 
      data: updatedData,
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 5000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Dashboard data endpoint
app.get('/api/dashboard-data', (req, res) => {
  res.json({
    success: true,
    data: mockData,
    timestamp: new Date().toISOString()
  });
});

// Manufacturing KPIs
app.get('/api/manufacturing/kpis', (req, res) => {
  res.json({
    success: true,
    kpis: [
      { id: 'production', label: 'Production Units', value: mockData.production.totalUnits, trend: 'up' },
      { id: 'quality', label: 'Quality Pass Rate', value: `${mockData.quality.passRate}%`, trend: 'up' },
      { id: 'efficiency', label: 'Overall Efficiency', value: `${mockData.production.efficiency}%`, trend: 'up' },
      { id: 'revenue', label: 'Revenue', value: `$${(mockData.financial.revenue / 1000000).toFixed(1)}M`, trend: 'up' }
    ]
  });
});

// Working capital data
app.get('/api/working-capital', (req, res) => {
  res.json({
    success: true,
    data: {
      currentRatio: 2.4,
      quickRatio: 1.8,
      cashFlow: 890000,
      accountsReceivable: 1200000,
      accountsPayable: 850000,
      inventory: mockData.inventory.totalValue
    }
  });
});

// What-if analysis scenarios
app.get('/api/scenarios', (req, res) => {
  res.json({
    success: true,
    scenarios: [
      { id: 1, name: 'Increase Production 20%', impact: '+$420K revenue' },
      { id: 2, name: 'Reduce Inventory 15%', impact: '+$180K cash flow' },
      { id: 3, name: 'Optimize Quality Process', impact: '-$95K costs' }
    ]
  });
});

// AI Analytics insights
app.get('/api/ai-insights', (req, res) => {
  res.json({
    success: true,
    insights: [
      { 
        type: 'optimization',
        title: 'Production Line Efficiency',
        description: 'Line 3 showing 12% improvement opportunity',
        impact: 'High',
        confidence: 89
      },
      {
        type: 'prediction',
        title: 'Demand Forecast',
        description: 'Q4 demand expected to increase 8%',
        impact: 'Medium',
        confidence: 76
      }
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log('=====================================');
  console.log('🚀 ENTERPRISE SERVER STARTED');
  console.log(`Port: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('=====================================');
});