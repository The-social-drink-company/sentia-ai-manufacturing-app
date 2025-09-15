/**
 * MINIMAL RAILWAY TEST SERVER
 * This is the absolute minimum to test Railway deployment
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

console.log('=== MINIMAL TEST SERVER ===');
console.log('PORT env:', process.env.PORT);
console.log('Using PORT:', PORT);
console.log('===========================');

// Root endpoint
app.get('/', (req, res) => {
  res.send('MINIMAL SERVER WORKING');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server listening on 0.0.0.0:${PORT}`);
});

// Keep alive
setInterval(() => {
  console.log(`[ALIVE] ${new Date().toISOString()} on port ${PORT}`);
}, 30000);