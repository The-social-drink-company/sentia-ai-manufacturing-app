import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

console.log('==================================================');
console.log('SENTIA MANUFACTURING DASHBOARD - SIMPLIFIED');
console.log('==================================================');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Port: ${PORT}`);
console.log('==================================================');

// Basic middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://deployrend.financeflo.ai',
    'https://testingrend.financeflo.ai',
    'https://prodrend.financeflo.ai'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints (BEFORE static files)
app.get('/health', (req, res) => {
  const usage = process.memoryUsage();
  const heapUsedMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (usage.heapTotal / 1024 / 1024).toFixed(2);
  const heapUsagePercent = ((usage.heapUsed / usage.heapTotal) * 100).toFixed(1);
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      heapUsedMB,
      heapTotalMB,
      heapUsagePercent: `${heapUsagePercent}%`,
      rssMB: (usage.rss / 1024 / 1024).toFixed(2)
    },
    uptime: process.uptime(),
    server: 'simplified'
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// Garbage collection endpoint (if available)
app.post('/admin/gc', (req, res) => {
  if (global.gc) {
    const before = process.memoryUsage();
    global.gc();
    const after = process.memoryUsage();
    
    res.json({
      message: 'Garbage collection triggered',
      before: {
        heapUsed: (before.heapUsed / 1024 / 1024).toFixed(2) + 'MB'
      },
      after: {
        heapUsed: (after.heapUsed / 1024 / 1024).toFixed(2) + 'MB'
      },
      freed: ((before.heapUsed - after.heapUsed) / 1024 / 1024).toFixed(2) + 'MB'
    });
  } else {
    res.status(503).json({ 
      error: 'Garbage collection not available. Start with --expose-gc flag.' 
    });
  }
});

// Static file serving (BEFORE catch-all route)
const distPath = path.join(__dirname, 'dist');
console.log(`[SERVER] Serving static files from: ${distPath}`);

app.use(express.static(distPath));

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing Dashboard',
    version: '1.0.0-simplified',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    server: 'simplified'
  });
});

// Catch-all route for React Router (AFTER static files)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log(`[CATCH-ALL] Request for: ${req.path}`);
  console.log(`[CATCH-ALL] Serving React app from: ${indexPath}`);
  res.sendFile(indexPath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Static files: ${distPath}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 Application: http://localhost:${PORT}`);
});

export default app;
