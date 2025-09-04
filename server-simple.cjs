// SIMPLE PRODUCTION SERVER - NO EXTRA DEPENDENCIES
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Log environment info
console.log('Environment PORT:', process.env.PORT);
console.log('Using PORT:', PORT);

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({ message: 'API is running' });
});

app.get('/api/*', (req, res) => {
  res.json({ message: 'API endpoint', path: req.path });
});

// Serve static files from dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Serve index.html for all other routes (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('SENTIA MANUFACTURING DASHBOARD');
  console.log(`Server running on port ${PORT}`);
  console.log('========================================');
});