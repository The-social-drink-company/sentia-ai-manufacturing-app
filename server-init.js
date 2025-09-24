/**
 * Universal Server Initialization for Render
 * Works with all three branches: development, test, production
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('='.repeat(70));
console.log('🚀 SENTIA MANUFACTURING DASHBOARD - RENDER STARTUP');
console.log('='.repeat(70));
console.log(`Time: ${new Date().toISOString()}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Branch: ${process.env.RENDER_GIT_BRANCH || 'unknown'}`);
console.log(`Service: ${process.env.RENDER_SERVICE_NAME || 'unknown'}`);
console.log(`Database: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
console.log(`Clerk: ${process.env.CLERK_SECRET_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`MCP Server: ${process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com'}`);
console.log('='.repeat(70));

// Set critical environment variables for Render
if (process.env.RENDER) {
  // Disable problematic features
  process.env.SKIP_ENTERPRISE_INIT = 'true';
  process.env.DISABLE_AUTONOMOUS_TESTING = 'true';
  process.env.MCP_SERVER_MODE = 'false';

  // Configure database
  process.env.DATABASE_CONNECTION_LIMIT = process.env.DATABASE_CONNECTION_LIMIT || '10';
  process.env.DATABASE_POOL_TIMEOUT = process.env.DATABASE_POOL_TIMEOUT || '60000';

  console.log('✅ Render environment configured');
}

// Check if dist folder exists
const distExists = existsSync(path.join(__dirname, 'dist'));
console.log(`Build artifacts: ${distExists ? '✅ Found' : '⚠️ Missing'}`);

// Generate Prisma Client if needed
try {
  console.log('\n📦 Checking Prisma Client...');
  const prismaClientPath = path.join(__dirname, 'node_modules', '.prisma', 'client');

  if (!existsSync(prismaClientPath)) {
    console.log('Generating Prisma Client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: __dirname
    });
    console.log('✅ Prisma Client generated');
  } else {
    console.log('✅ Prisma Client already exists');
  }
} catch (error) {
  console.warn('⚠️ Prisma generation warning:', error.message);
}

// Start the main server
console.log('\n🌐 Starting main server...');
console.log('='.repeat(70));

try {
  await import('./server.js');
} catch (error) {
  console.error('❌ Server startup failed:', error);
  console.error('Stack:', error.stack);

  // Start fallback server
  console.log('\n🔧 Starting fallback server...');
  const { default: express } = await import('express');
  const { join } = await import('path');

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Serve static files if they exist
  if (distExists) {
    app.use(express.static(join(__dirname, 'dist')));
  }

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'degraded',
      message: 'Main server failed - fallback active',
      error: error.message,
      timestamp: new Date().toISOString(),
      service: process.env.RENDER_SERVICE_NAME,
      branch: process.env.RENDER_GIT_BRANCH
    });
  });

  // Fallback UI
  app.get('*', (req, res) => {
    if (distExists) {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sentia Manufacturing</title>
          <style>
            body {
              font-family: -apple-system, system-ui, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 3rem;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 500px;
              text-align: center;
            }
            h1 { color: #1a202c; margin-bottom: 1rem; }
            .status {
              background: #fef2e5;
              color: #92400e;
              padding: 1rem;
              border-radius: 8px;
              margin: 1.5rem 0;
            }
            .info { color: #4a5568; line-height: 1.6; }
            a { color: #667eea; text-decoration: none; font-weight: 500; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Sentia Manufacturing</h1>
            <div class="status">
              <strong>Service Initializing</strong><br>
              Please refresh in a few moments
            </div>
            <div class="info">
              <p>Branch: <strong>${process.env.RENDER_GIT_BRANCH || 'unknown'}</strong></p>
              <p>Service: <strong>${process.env.RENDER_SERVICE_NAME || 'unknown'}</strong></p>
              <p><a href="/health">Check Health Status</a></p>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Fallback server running on port ${PORT}`);
    console.log(`   URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
  });
}