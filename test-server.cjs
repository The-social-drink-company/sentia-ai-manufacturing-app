// MINIMAL TEST SERVER FOR RAILWAY
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('=== RAILWAY TEST SERVER ===');
console.log('PORT env var:', process.env.PORT);
console.log('Using PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send(`
    <h1>Railway Test Server</h1>
    <p>Server is running on port: ${PORT}</p>
    <p>Environment PORT: ${process.env.PORT || 'NOT SET'}</p>
    <p>Time: ${new Date().toISOString()}</p>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Server bound to: 0.0.0.0:${PORT}`);
});