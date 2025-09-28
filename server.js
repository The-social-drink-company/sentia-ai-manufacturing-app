/**
<<<<<<< HEAD
 * Render Deployment Entry Point
 * This file imports and starts the enterprise server to match Render's start command expectations
 */

import './server-enterprise-complete.js';
=======
 * SENTIA MANUFACTURING DASHBOARD - BULLETPROOF SERVER
 * Serves a pre-built React application with 100% reliability
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'sentia-manufacturing-dashboard',
    version: '2.0.0-bulletproof',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    clerk: {
      configured: true,
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT_SET'
    }
  });
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sentia Manufacturing Dashboard (Bulletproof) running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
>>>>>>> baed00d3308a0840f08ad991048d6e31660a3b56
