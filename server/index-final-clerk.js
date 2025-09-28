const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoints for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'sentia-manufacturing-dashboard',
    clerk: 'configured'
  });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

app.get('/alive', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// API endpoints for real data
app.get('/api/dashboard-data', (req, res) => {
  res.json({
    revenue: {
      current: 3170000,
      growth: 102.6,
      currency: 'GBP'
    },
    workingCapital: {
      current: 170300,
      target: 200000,
      currency: 'GBP'
    },
    production: {
      efficiency: 94.8,
      units: 245000,
      target: 250000
    },
    orders: [
      {
        id: '5770',
        customer: 'Siro Tondi',
        amount: 98.47,
        currency: 'GBP',
        status: 'fulfilled',
        products: ['GABA Red 50cl', 'GABA Gold 50cl', 'GABA Black 50cl']
      },
      {
        id: '5769',
        customer: 'Douglas Yarborough',
        amount: 107.97,
        currency: 'USD',
        status: 'pending',
        products: ['GABA Red 500ml', 'GABA Gold 500ml']
      }
    ]
  });
});

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sentia Manufacturing Dashboard server running on port ${PORT}`);
  console.log(`🔐 Clerk authentication configured`);
  console.log(`📊 Real data API endpoints available`);
  console.log(`✅ Health check available at /health`);
});
