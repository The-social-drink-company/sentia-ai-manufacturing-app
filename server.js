import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'sentia-manufacturing-dashboard',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes (placeholder for future backend functionality)
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'operational',
    version: '2.1.0-enterprise',
    features: {
      workingCapital: true,
      aiInsights: true,
      csvUpload: true,
      authentication: true
    }
  });
});

// Catch all handler: send back React's index.html file for SPA routing
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

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log('======================================================================');
  console.log('🚀 SENTIA MANUFACTURING DASHBOARD - ENTERPRISE');
  console.log('======================================================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on: http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`API endpoint: http://0.0.0.0:${PORT}/api/status`);
  console.log('======================================================================');
  console.log('✅ Enterprise dashboard ready for working capital intelligence');
  console.log('✅ Features: AI insights, CSV upload, authentication, analytics');
  console.log('======================================================================');
});

export default app;
