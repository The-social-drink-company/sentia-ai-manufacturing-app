const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Sentia Manufacturing Dashboard',
    version: '1.0.10',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    clerk: {
      configured: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
      environment: process.env.VITE_CLERK_PUBLISHABLE_KEY?.includes('_live_') ? 'production' : 'development'
    }
  });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Clerk configured: ${!!process.env.VITE_CLERK_PUBLISHABLE_KEY}`);
  console.log(`📁 Serving from: ${path.join(__dirname, 'dist')}`);
});

module.exports = app;
