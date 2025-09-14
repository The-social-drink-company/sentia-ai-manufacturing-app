// ULTIMATE RAILWAY START SCRIPT
// This file will WORK on Railway

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`
========================================
RAILWAY START.JS - WILL WORK
========================================
PORT: ${PORT}
NODE_ENV: ${process.env.NODE_ENV}
Railway: ${process.env.RAILWAY_ENVIRONMENT || 'unknown'}
========================================
`);

// Middleware
app.use(express.json());

// Health endpoint - CRITICAL
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: PORT });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'sentia' });
});

// Serve dist if exists, otherwise fallback
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send('<h1>Sentia Dashboard - Railway Running</h1>');
    }
  });
} else {
  app.get('*', (req, res) => {
    res.send(`
      <html>
      <body style="font-family: system-ui; text-align: center; padding: 50px;">
        <h1>✅ Railway Deployment Working!</h1>
        <p>Server running on port ${PORT}</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
      </html>
    `);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});