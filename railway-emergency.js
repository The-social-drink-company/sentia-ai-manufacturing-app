// EMERGENCY RAILWAY SERVER - ABSOLUTE MINIMUM
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Log everything for debugging
console.log('EMERGENCY SERVER STARTING');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Basic middleware
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Emergency server running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sentia Emergency Mode</title>
      <style>
        body { font-family: sans-serif; padding: 20px; background: #f0f0f0; }
        .status { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { color: green; }
        .warning { color: orange; }
      </style>
    </head>
    <body>
      <h1>Sentia Manufacturing Dashboard</h1>
      <div class="status">
        <h2 class="success">✓ Railway Deployment Working!</h2>
        <p>Emergency server is running on port ${PORT}</p>
        <p>Environment: ${process.env.NODE_ENV || 'unknown'}</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p><a href="/api/health">Check API Health</a></p>
      </div>
      <div class="status">
        <h3 class="warning">Next Steps:</h3>
        <ol>
          <li>This emergency server confirms Railway can deploy</li>
          <li>Now we can gradually add back the real server code</li>
          <li>Check logs for any specific errors</li>
        </ol>
      </div>
    </body>
    </html>
  `);
});

// Catch all API routes
app.get('/api/*', (req, res) => {
  res.json({
    message: 'API endpoint not implemented in emergency mode',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('EMERGENCY SERVER STARTED SUCCESSFULLY');
  console.log(`Listening on http://0.0.0.0:${PORT}`);
  console.log('========================================');
});

// Keep alive
setInterval(() => {
  console.log(`[HEARTBEAT] Server alive at ${new Date().toISOString()}`);
}, 60000);