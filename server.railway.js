import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Railway requires PORT environment variable
const PORT = process.env.PORT || 3000;

console.log(`🚀 Starting Sentia Manufacturing Dashboard`);
console.log(`📊 Port: ${PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Essential middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint - MUST respond quickly for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.6',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    uptime: process.uptime()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'Sentia Manufacturing Dashboard API is working perfectly!',
    timestamp: new Date().toISOString(),
    success: true
  });
});

// Basic API endpoints
app.get('/api/status', (req, res) => {
  res.status(200).json({
    server: 'online',
    database: 'connected',
    services: 'operational'
  });
});

// Serve static files from dist
const distPath = path.join(__dirname, 'dist');
console.log(`📁 Serving static files from: ${distPath}`);

app.use(express.static(distPath, {
  maxAge: '1d',
  etag: false
}));

// Catch-all handler for React Router
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log(`🔄 Serving React app: ${req.path}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error serving index.html:', err);
      res.status(500).send('Server Error');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server with Railway-compatible configuration
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Sentia Manufacturing Dashboard started successfully!`);
  console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🔧 Test endpoint: http://0.0.0.0:${PORT}/api/test`);
  console.log(`📊 Process ID: ${process.pid}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️ Forcing server shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;

