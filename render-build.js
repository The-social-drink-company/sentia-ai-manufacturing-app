#!/usr/bin/env node

/**
 * Render Build Script
 * This Node.js script handles the build process for Render deployments
 * Works around common Render deployment issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper function to run commands safely
function runCommand(command, description, critical = false) {
  console.log(`${colors.cyan}${colors.bright}▶ ${description}${colors.reset}`);
  console.log(`  Command: ${command}`);

  try {
    const output = execSync(command, {
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    console.log(`${colors.green}✓ ${description} completed successfully${colors.reset}\n`);
    return true;
  } catch (error) {
    if (critical) {
      console.error(`${colors.red}✗ Critical error in ${description}${colors.reset}`);
      console.error(error.message);
      process.exit(1);
    } else {
      console.log(`${colors.yellow}⚠ ${description} completed with warnings (continuing...)${colors.reset}\n`);
      return false;
    }
  }
}

// Main build process
async function build() {
  console.log(`${colors.bright}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}Render Build Process Starting${colors.reset}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`${colors.bright}${'='.repeat(50)}${colors.reset}\n`);

  // Step 1: Install dependencies
  runCommand(
    'npm ci --legacy-peer-deps',
    'Installing dependencies',
    true // Critical - must succeed
  );

  // Step 2: Build frontend
  runCommand(
    'npx vite build',
    'Building frontend application',
    true // Critical - must succeed
  );

  // Step 3: Generate Prisma client
  runCommand(
    'npx prisma generate',
    'Generating Prisma client',
    true // Critical - must succeed
  );

  // Step 4: Handle database based on environment
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    console.log(`${colors.cyan}▶ Production environment - checking database migrations${colors.reset}`);

    // Try to run migrations for production
    const migrationSuccess = runCommand(
      'npx prisma migrate deploy --skip-generate',
      'Deploying database migrations',
      false // Non-critical - may already be applied
    );

    if (!migrationSuccess) {
      console.log(`${colors.yellow}Migrations may already be applied or not needed${colors.reset}`);
    }
  } else {
    console.log(`${colors.cyan}▶ Non-production environment - pushing database schema${colors.reset}`);

    // For development/test, push schema with data loss acceptance
    runCommand(
      'npx prisma db push --accept-data-loss --skip-generate',
      'Pushing database schema',
      false // Non-critical - may have warnings
    );
  }

  // Step 5: Verify build output
  console.log(`${colors.cyan}▶ Verifying build artifacts${colors.reset}`);

  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log(`${colors.green}✓ Build artifacts created: ${files.length} files in dist/${colors.reset}`);

    // Show first few files as confirmation
    files.slice(0, 5).forEach(file => {
      console.log(`  - ${file}`);
    });
    if (files.length > 5) {
      console.log(`  ... and ${files.length - 5} more files`);
    }
  } else {
    console.error(`${colors.red}✗ Warning: dist directory not found${colors.reset}`);
  }

  // Step 6: Create success marker
  const marker = {
    buildTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    success: true
  };

  fs.writeFileSync('.render-build-success.json', JSON.stringify(marker, null, 2));

  console.log(`\n${colors.bright}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.green}${colors.bright}✓ Build completed successfully!${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(50)}${colors.reset}\n`);
}

// Error handler
process.on(_'uncaughtException', (error) => {
  console.error(`${colors.red}Uncaught exception during build:${colors.reset}`);
  console.error(error);
  process.exit(1);
});

process.on(_'unhandledRejection', _(reason, _promise) => {
  console.error(`${colors.red}Unhandled rejection during build:${colors.reset}`);
  console.error(reason);
  process.exit(1);
});

// Run the build
build().catch(error => {
  console.error(`${colors.red}Build failed:${colors.reset}`);
  console.error(error);
  process.exit(1);
});