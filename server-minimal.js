import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: PORT,
    message: 'Sentia Manufacturing Dashboard API is running'
  });
});

// Basic dashboard data endpoint
app.get('/api/dashboard/overview', (req, res) => {
  res.json({
    kpis: {
      production: { value: 94.8, trend: 'up', change: 2.3 },
      quality: { value: 99.2, trend: 'up', change: 0.8 },
      efficiency: { value: 87.5, trend: 'down', change: -1.2 },
      uptime: { value: 96.8, trend: 'up', change: 1.5 }
    },
    alerts: [],
    timestamp: new Date().toISOString()
  });
});

// Supply chain endpoint
app.get('/api/supply-chain/dashboard', (req, res) => {
  res.json({
    overview: {
      totalSuppliers: 847,
      activeOrders: 156,
      onTimeDelivery: 94.8,
      costSavings: 285000
    },
    timestamp: new Date().toISOString()
  });
});

// Maintenance endpoint
app.get('/api/maintenance/dashboard', (req, res) => {
  res.json({
    overview: {
      totalEquipment: 156,
      activeWorkOrders: 23,
      overdueMaintenance: 7,
      uptime: 96.8
    },
    timestamp: new Date().toISOString()
  });
});

// Catch-all handler for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MINIMAL SENTIA SERVER RUNNING ON PORT ${PORT}`);
  console.log(`🔗 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log('✅ Server is healthy and ready for connections');
});

export default app;
