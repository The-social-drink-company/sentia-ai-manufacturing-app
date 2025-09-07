import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.resolve(__dirname, 'dist');

console.log('=== WORKING SERVER STARTING ===');
console.log('Port:', PORT);
console.log('Dist path:', distPath);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic API endpoints to prevent errors
app.post('/api/errors', (req, res) => {
  console.log('Error logged:', req.body);
  res.status(200).json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/user', (req, res) => {
  res.json({ 
    id: 'test-user',
    name: 'Test User', 
    role: 'admin',
    email: 'test@example.com'
  });
});

// Mock dashboard data
app.get('/api/dashboard', (req, res) => {
  res.json({
    kpis: [
      { title: 'Revenue', value: '$125,430', change: '+12%' },
      { title: 'Orders', value: '1,329', change: '+5%' },
      { title: 'Customers', value: '892', change: '+18%' }
    ],
    message: 'Dashboard working without authentication!'
  });
});

// Serve static files
app.use(express.static(distPath));

// Catch all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`WORKING SERVER RUNNING ON PORT ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}/?debug=true for bypass mode`);
});