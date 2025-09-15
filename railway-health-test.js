// Minimal health check server for Railway testing
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Railway deployment working!',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send(`
    <h1>Railway Test Server Running</h1>
    <p>Port: ${PORT}</p>
    <p>Time: ${new Date().toISOString()}</p>
    <p><a href="/health">Health Check</a></p>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://0.0.0.0:${PORT}`);
});