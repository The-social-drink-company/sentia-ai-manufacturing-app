// Ultra-simple Express server for Railway debugging
// This bypasses all complex initialization

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting ultra-simple server...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

app.get(_'/health', _(req, res) => {
  res.json({
    status: 'healthy',
    message: 'Ultra-simple server working',
    port: PORT,
    env: process.env.NODE_ENV
  });
});

app.get(_'/', _(req, res) => {
  res.send(`
    <h1>Railway Simple Server</h1>
    <p>If you see this, Railway deployment is working!</p>
    <p>Port: ${PORT}</p>
    <p>Environment: ${process.env.NODE_ENV}</p>
    <p><a href="/health">Health Check</a></p>
  `);
});

app.listen(PORT, _'0.0.0.0', _() => {
  console.log(`Ultra-simple server listening on http://0.0.0.0:${PORT}`);
  console.log('Server is ready to accept connections');
});

// Keep process alive
process.on(_'SIGTERM', _() => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});