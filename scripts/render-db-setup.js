#!/usr/bin/env node

/**
 * Render Database Setup Script
 * Initializes database schema for Render deployments
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('========================================');
console.log('Render Database Setup');
console.log('========================================');

const environment = process.argv[2] || 'development';

console.log(`Setting up database for ${environment} environment...`);

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  console.log('\nPlease set DATABASE_URL in your .env file or environment variables');
  console.log('Format: postgresql://user:password@host:port/database');
  process.exit(1);
}

console.log('\nDatabase URL detected:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

try {
  // Step 1: Generate Prisma client
  console.log('\n1. Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Step 2: Push schema to database (creates tables)
  console.log('\n2. Pushing schema to database...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });

  // Step 3: Seed database with initial data (optional)
  console.log('\n3. Seeding database (if seed file exists)...');
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('Database seeded successfully!');
  } catch (seedError) {
    console.log('No seed file found or seeding skipped');
  }

  console.log('\n========================================');
  console.log('✅ Database setup completed successfully!');
  console.log('========================================');
  console.log('\nYour database is ready for use.');
  console.log('Tables created and schema synchronized.');

} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check DATABASE_URL is correct');
  console.log('2. Ensure database service is running');
  console.log('3. Verify network connectivity to database');
  console.log('4. Check Prisma schema file exists at prisma/schema.prisma');
  process.exit(1);
}

console.log('\nNext steps:');
console.log('1. Restart your application');
console.log('2. Verify tables exist with: npx prisma studio');
console.log('3. Check application logs for any remaining issues');