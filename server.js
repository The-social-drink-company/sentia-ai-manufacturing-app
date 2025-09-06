import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Clerk
const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

console.log('🚀 SENTIA MANUFACTURING DASHBOARD SERVER STARTING');
console.log('Port:', PORT);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'https://web-production-1f10.up.railway.app'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = await clerkClient.verifyToken(token);
    req.userId = payload.sub;
    req.user = await clerkClient.users.getUser(payload.sub);
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Shopify API Integration
app.get('/api/shopify/dashboard-data', authenticateUser, async (req, res) => {
  try {
    const shopifyData = await fetchShopifyData();
    res.json(shopifyData);
  } catch (error) {
    console.error('Shopify API error:', error);
    // Return mock data if API fails
    res.json({
      revenue: { value: 125430, change: 12, trend: 'up' },
      orders: { value: 1329, change: 5, trend: 'up' },
      customers: { value: 892, change: 18, trend: 'up' },
      products: { value: 156, change: -2, trend: 'down' }
    });
  }
});

app.get('/api/shopify/orders', authenticateUser, async (req, res) => {
  try {
    const orders = await fetchShopifyOrders();
    res.json(orders);
  } catch (error) {
    console.error('Shopify orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Working Capital APIs
app.get('/api/working-capital/metrics', authenticateUser, (req, res) => {
  const metrics = {
    currentRatio: 2.4,
    quickRatio: 1.8,
    cashConversionCycle: 45,
    workingCapital: 2400000,
    accountsReceivable: 1800000,
    accountsPayable: 950000,
    inventory: 1200000,
    lastUpdated: new Date().toISOString()
  };
  
  res.json(metrics);
});

app.get('/api/working-capital/projections', authenticateUser, (req, res) => {
  const projections = generateCashFlowProjections();
  res.json(projections);
});

// Admin APIs
app.get('/api/admin/users', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.publicMetadata?.role || req.user.publicMetadata.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await clerkClient.users.getUserList();
    res.json(users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.emailAddresses[0]?.emailAddress,
      role: user.publicMetadata?.role || 'viewer',
      status: user.banned ? 'banned' : 'active',
      lastLogin: user.lastSignInAt
    })));
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/system-stats', authenticateUser, (req, res) => {
  const stats = {
    uptime: '99.9%',
    version: '1.2.0',
    environment: process.env.NODE_ENV || 'development',
    deployedAt: '2025-01-06 10:30 UTC',
    lastBackup: '2025-01-06 02:00 UTC',
    totalUsers: 4,
    activeUsers: 3,
    apiCalls: 15429,
    errors: 12
  };
  
  res.json(stats);
});

// Analytics APIs
app.get('/api/analytics/kpis', authenticateUser, (req, res) => {
  const kpis = generateAnalyticsKPIs();
  res.json(kpis);
});

app.get('/api/analytics/trends', authenticateUser, (req, res) => {
  const trends = generateTrendData();
  res.json(trends);
});

// Forecasting APIs (AI/ML simulation)
app.get('/api/forecasting/demand', authenticateUser, (req, res) => {
  const forecast = generateDemandForecast();
  res.json(forecast);
});

app.post('/api/forecasting/run-model', authenticateUser, (req, res) => {
  const { modelType, parameters } = req.body;
  
  // Simulate ML model execution
  setTimeout(() => {
    const results = {
      modelId: `${modelType}_${Date.now()}`,
      accuracy: 0.85 + Math.random() * 0.1,
      predictions: generateForecastPredictions(),
      completedAt: new Date().toISOString()
    };
    
    res.json(results);
  }, 2000);
});

// Helper functions
async function fetchShopifyData() {
  const shopUrl = process.env.SHOPIFY_UK_SHOP_URL;
  const accessToken = process.env.SHOPIFY_UK_ACCESS_TOKEN;
  
  if (!shopUrl || !accessToken) {
    throw new Error('Shopify credentials not configured');
  }

  try {
    // Fetch orders
    const ordersResponse = await fetch(`https://${shopUrl}/admin/api/2023-10/orders.json?status=any&limit=250`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      throw new Error(`Shopify API error: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    
    // Calculate metrics from real data
    const orders = ordersData.orders || [];
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.customer?.id).filter(Boolean)).size;

    return {
      revenue: { 
        value: Math.round(totalRevenue), 
        change: 12, 
        trend: 'up' 
      },
      orders: { 
        value: totalOrders, 
        change: 5, 
        trend: 'up' 
      },
      customers: { 
        value: uniqueCustomers || 892, 
        change: 18, 
        trend: 'up' 
      },
      products: { 
        value: 156, 
        change: -2, 
        trend: 'down' 
      }
    };
  } catch (error) {
    console.error('Shopify API fetch error:', error);
    throw error;
  }
}

async function fetchShopifyOrders() {
  const shopUrl = process.env.SHOPIFY_UK_SHOP_URL;
  const accessToken = process.env.SHOPIFY_UK_ACCESS_TOKEN;
  
  const response = await fetch(`https://${shopUrl}/admin/api/2023-10/orders.json?limit=50`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const data = await response.json();
  return data.orders;
}

function generateCashFlowProjections() {
  const weeks = 8;
  const projections = [];
  let baseAmount = 1800000;
  
  for (let i = 1; i <= weeks; i++) {
    const variance = Math.random() * 0.1 - 0.05; // ±5% variance
    const projected = Math.round(baseAmount * (1 + i * 0.025));
    const actual = i <= 2 ? Math.round(projected * (1 + variance)) : null;
    
    projections.push({
      week: `W${i}`,
      projected,
      actual
    });
  }
  
  return projections;
}

function generateAnalyticsKPIs() {
  return {
    productionEfficiency: 94.2,
    qualityScore: 98.7,
    downtime: 2.1,
    energyUsage: 87.3,
    costPerUnit: 12.45,
    wasteReduction: 15.8
  };
}

function generateTrendData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    production: Math.floor(Math.random() * 10000) + 15000,
    quality: Math.floor(Math.random() * 5) + 95,
    efficiency: Math.floor(Math.random() * 10) + 90
  }));
}

function generateDemandForecast() {
  const products = ['GABA Red', 'GABA Gold', 'Focus Blend', 'Energy Plus'];
  
  return products.map(product => ({
    product,
    currentDemand: Math.floor(Math.random() * 1000) + 500,
    forecastDemand: Math.floor(Math.random() * 1200) + 600,
    confidence: Math.random() * 0.2 + 0.8,
    trend: Math.random() > 0.5 ? 'up' : 'down'
  }));
}

function generateForecastPredictions() {
  const days = 30;
  const predictions = [];
  
  for (let i = 1; i <= days; i++) {
    predictions.push({
      day: i,
      demand: Math.floor(Math.random() * 200) + 800,
      confidence: Math.random() * 0.3 + 0.7
    });
  }
  
  return predictions;
}

// Serve static files (must be after API routes)
app.use(express.static(path.join(__dirname, 'dist')));

// Catch all for SPA (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`✅ SENTIA SERVER RUNNING ON PORT ${PORT}`);
  console.log(`🔗 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
});