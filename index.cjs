// MINIMAL RAILWAY SERVER - COMMONJS VERSION
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting index.cjs server on port:', PORT);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: system-ui; text-align: center; padding: 50px;">
        <h1>Sentia Dashboard - Working!</h1>
        <p>Server running on port ${PORT}</p>
        <p><a href="/health">Health Check</a></p>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});