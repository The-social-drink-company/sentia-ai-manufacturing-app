#!/usr/bin/env node

/**
 * RENDER PRODUCTION STARTUP SCRIPT
 * Ensures clean startup for all three branches
 */

console.log('='.repeat(70));
console.log('SENTIA MANUFACTURING DASHBOARD - RENDER DEPLOYMENT');
console.log('='.repeat(70));
console.log(`Time: ${new Date().toISOString()}`);
console.log(`Node Version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Branch: ${process.env.RENDER_GIT_BRANCH || 'unknown'}`);
console.log(`Service: ${process.env.RENDER_SERVICE_NAME || 'unknown'}`);
console.log(`Port: ${process.env.PORT || 5000}`);
console.log('='.repeat(70));

// Critical environment check
const criticalVars = {
  'DATABASE_URL': process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
  'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing',
  'VITE_CLERK_PUBLISHABLE_KEY': process.env.VITE_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
};

console.log('\nEnvironment Check:');
Object.entries(criticalVars).forEach(([key, status]) => {
  console.log(`  ${key}: ${status}`);
});

// Set critical defaults for Render
if (process.env.RENDER) {
  // Ensure Prisma can connect
  process.env.DATABASE_CONNECTION_LIMIT = process.env.DATABASE_CONNECTION_LIMIT || '10';
  process.env.DATABASE_POOL_TIMEOUT = process.env.DATABASE_POOL_TIMEOUT || '60000';

  // Disable problematic features during startup
  process.env.SKIP_ENTERPRISE_INIT = 'true';
  process.env.DISABLE_AUTONOMOUS_TESTING = 'true';

  console.log('\n✅ Render environment configured');
}

// Start the main server
console.log('\nStarting main server...\n');
console.log('='.repeat(70));

// Use dynamic import for ES modules
import('./server.js').catch(error => {
  console.error('❌ FATAL: Failed to start server:', error);
  console.error('Stack:', error.stack);

  // Start minimal fallback server for debugging
  import('express').then(({ default: express }) => {
    const app = express();
    const PORT = process.env.PORT || 5000;

    // Health endpoint that always works
    app.get('/health', (req, res) => {
      res.json({
        status: 'degraded',
        message: 'Main server failed to start',
        error: error.message,
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          RENDER: process.env.RENDER ? 'true' : 'false',
          DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing',
          CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'configured' : 'missing'
        }
      });
    });

    // Root endpoint
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sentia Manufacturing Dashboard</title>
          <style>
            body { font-family: system-ui; padding: 2rem; background: #f3f4f6; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; }
            h1 { color: #1f2937; }
            .status { padding: 1rem; background: #fee2e2; border-radius: 4px; color: #991b1b; }
            .info { margin-top: 1rem; padding: 1rem; background: #f9fafb; border-radius: 4px; }
            code { background: #e5e7eb; padding: 2px 4px; border-radius: 2px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Sentia Manufacturing Dashboard</h1>
            <div class="status">
              ⚠️ <strong>Service Starting</strong><br>
              The application is initializing. Please refresh in a moment.
            </div>
            <div class="info">
              <p>Environment: <code>${process.env.NODE_ENV || 'development'}</code></p>
              <p>Service: <code>${process.env.RENDER_SERVICE_NAME || 'unknown'}</code></p>
              <p>Health Check: <a href="/health">/health</a></p>
            </div>
          </div>
        </body>
        </html>
      `);
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Fallback server running on port ${PORT}`);
      console.log(`   Access URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
    });
  });
});