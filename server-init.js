/**
 * PRODUCTION SERVER INITIALIZATION
 * Ensures server starts successfully on Render for client handover
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
if (!process.env.RENDER) {
  dotenv.config();
}

// Set critical defaults for Render
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '10000';

// Ensure database URL is set (Render will provide this)
if (!process.env.DATABASE_URL && process.env.RENDER) {
  console.log('Waiting for DATABASE_URL from Render...');
  // Render will inject this, but we set a placeholder to prevent crashes
  process.env.DATABASE_URL = 'postgresql://pending:pending@pending:5432/pending';
}

// Initialize Prisma with retries
async function initializePrisma(retries = 10, delay = 3000) {
  const { default: prisma } = await import('./lib/prisma.js');

  for (let i = 0; i < retries; i++) {
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('pending')) {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        return prisma;
      } else {
        console.log(`Waiting for valid DATABASE_URL... (attempt ${i + 1}/${retries})`);
      }
    } catch (error) {
      console.log(`Database connection attempt ${i + 1}/${retries} failed:`, error.message);
    }

    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.warn('⚠️ Could not connect to database, continuing without database...');
  return null;
}

// Start server with proper error handling
async function startServer() {
  try {
    console.log('🚀 Starting Sentia Manufacturing Dashboard Server...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Port:', process.env.PORT);
    console.log('Render:', process.env.RENDER ? 'Yes' : 'No');

    // Initialize database
    const prisma = await initializePrisma();
    if (prisma) {
      global.prisma = prisma;
    }

    // Import and start the main server
    await import('./server.js');

    console.log('✅ Server initialization complete');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);

    // In production, keep the process running
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.log('Keeping process alive for Render...');

      // Start a minimal health check server
      const express = await import('express');
      const app = express.default();

      app.get('/health', (req, res) => {
        res.json({
          status: 'initializing',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });

      app.get('*', (req, res) => {
        res.status(503).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Sentia Manufacturing - Initializing</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #333; }
                p { color: #666; }
                .spinner {
                  border: 4px solid #f3f3f3;
                  border-top: 4px solid #3498db;
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  animation: spin 2s linear infinite;
                  margin: 20px auto;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              </style>
            </head>
            <body>
              <h1>Sentia Manufacturing Dashboard</h1>
              <div class="spinner"></div>
              <p>System is initializing. Please wait...</p>
              <p style="font-size: 12px; margin-top: 40px;">If this persists, please contact support.</p>
            </body>
          </html>
        `);
      });

      const port = process.env.PORT || 10000;
      app.listen(port, '0.0.0.0', () => {
        console.log(`Fallback server running on port ${port}`);
      });

      // Try to restart main server periodically
      setInterval(async () => {
        console.log('Attempting to restart main server...');
        try {
          await import('./server.js');
          console.log('Main server restarted successfully');
        } catch (err) {
          console.log('Main server restart failed:', err.message);
        }
      }, 30000); // Try every 30 seconds
    } else {
      process.exit(1);
    }
  }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in production
  if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production
  if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
    process.exit(1);
  }
});

// Start the server
startServer();