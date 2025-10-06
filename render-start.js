#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Starting Sentia Manufacturing Dashboard with migration resolution...');

try {
  // First, try to resolve the failed migration
  console.log('📋 Resolving failed migration 20250909_api_keys_management...');
  try {
    execSync('pnpm prisma migrate resolve --rolled-back 20250909_api_keys_management', { stdio: 'inherit' });
    console.log('✅ Migration resolved successfully');
  } catch (error) {
    console.log('⚠️  Migration resolution failed or not needed:', error.message);
    // Continue anyway - the migration might not need resolution
  }

  // Deploy all migrations
  console.log('🔄 Deploying migrations...');
  execSync('pnpm prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrations deployed successfully');

  // Generate Prisma client again to ensure it's available at runtime
  console.log('🔧 Ensuring Prisma client is available...');
  try {
    execSync('pnpm prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.log('⚠️  Prisma client generation failed:', error.message);
  }

  // Run the Prisma sync script to ensure client is in the right location
  console.log('📦 Syncing Prisma client...');
  try {
    execSync('node scripts/sync-prisma-client.mjs', { stdio: 'inherit' });
    console.log('✅ Prisma client synced successfully');
  } catch (error) {
    console.log('⚠️  Prisma client sync failed:', error.message);
  }

  // Start the server
  console.log('🌟 Starting server...');
  execSync('node server-enterprise-complete.js', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Startup failed:', error.message);
  process.exit(1);
}