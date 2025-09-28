const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

console.log('🚀 Starting Sentia Manufacturing Dashboard Server...');
console.log('📁 Serving from:', path.join(__dirname, 'dist'));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.status(200).json({ 
    status: 'healthy',
    service: 'sentia-manufacturing-dashboard',
    version: '2.0.0-bulletproof',
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  console.log('📄 Serving React app for:', req.path);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('🎉 Sentia Manufacturing Dashboard is ready!');
});
