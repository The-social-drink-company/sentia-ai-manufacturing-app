import express from 'express';
import { createServer } from 'http';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 10003;

// Minimal route
app.get('/health', (req, res) => {
  console.log('Health check received');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  console.log('Root request received');
  res.send('Minimal server is working!');
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  const address = httpServer.address();
  console.log(`Minimal server started on ${address.address}:${address.port}`);
  console.log(`Test: curl http://localhost:${PORT}/health`);
});

httpServer.on('error', (error) => {
  console.error('Server error:', error);
});
