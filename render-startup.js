/**
 * Render Startup Script
 * Ensures proper initialization for all Render deployments
 * Handles Prisma generation and server startup
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Sentia Manufacturing Dashboard on Render...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Database URL:', process.env.DATABASE_URL ? 'Configured' : 'Not configured');

// Step 1: Generate Prisma Client
try {
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Prisma Client generated successfully');
} catch (error) {
  console.error('⚠️ Prisma generation warning:', error.message);
  // Continue anyway - Prisma might already be generated
}

// Step 2: Run database migrations (if needed)
if (process.env.NODE_ENV === 'production') {
  try {
    console.log('🗄️ Running database migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.log('ℹ️ Migration info:', error.message);
    // Continue - migrations might already be applied
  }
}

// Step 3: Start the server
console.log('🌐 Starting Express server...');
require('./server.js');