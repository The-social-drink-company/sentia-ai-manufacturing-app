#!/usr/bin/env node

/**
 * Database Connection Verification Script
 * Tests database connectivity and provides detailed diagnostics
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('='.repeat(60));
console.log('📊 DATABASE CONNECTION VERIFICATION');
console.log('='.repeat(60));

// Check environment
const isRender = !!process.env.RENDER;
const isDevelopment = process.env.NODEENV = == 'development';

console.log('Environment:', process.env.NODE_ENV || 'not set');
console.log('Platform:', isRender ? 'Render' : 'Local');
console.log('');

// Get database URL
const databaseUrl = process.env.DATABASE_URL || process.env.DEV_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No DATABASE_URL found in environment');
  console.log('Please set DATABASE_URL in your .env file or environment variables');
  process.exit(1);
}

// Log connection details (without password)
const urlForLogging = databaseUrl.replace(/:([^@]+)@/, ':****@');
console.log('🔗 Connecting to:', urlForLogging);
console.log('');

// Create Prisma client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  log: ['error', 'warn'],
  errorFormat: 'pretty'
});

// Test connection function
async function testConnection() {
  console.log('🔄 Testing connection...');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Test with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as connected, version() as version`;
    console.log('✅ Query test successful');

    if (result && result[0]) {
      console.log('📊 Database version:', result[0].version);
    }

    // Test table access (check if tables exist)
    try {
      const tableTest = await prisma.$queryRaw`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables
        WHERE tableschema = 'public'
      `;
      console.log('📋 Tables in database:', tableTest[0].table_count);
    } catch (error) {
      console.log('⚠️  Could not query table information');
    }

    // Test specific tables if they exist
    try {
      const userCount = await prisma.user.count();
      console.log('👥 Users in database:', userCount);
    } catch (error) {
      console.log('⚠️  User table not available or not migrated');
    }

    console.log('');
    console.log('🎉 DATABASE CONNECTION SUCCESSFUL!');
    console.log('');

    // Provide deployment guidance
    if (!isRender) {
      console.log('📌 For Render deployment:');
      console.log('   1. Ensure DATABASE_URL is set in Render environment');
      console.log('   2. Run migrations: npx prisma migrate deploy');
      console.log('   3. Verify with: node scripts/verify-database.js');
    }

    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('');

    // Provide helpful diagnostics
    if (error.code === 'P1001') {
      console.error('💡 Cannot reach database server.');
      console.error('   - Check if DATABASE_URL is correct');
      console.error('   - Ensure database server is running');
      console.error('   - Check network connectivity');
    } else if (error.code === 'P1002') {
      console.error('💡 Database server was reached but timed out.');
      console.error('   - Database might be overloaded');
      console.error('   - Check connection pool settings');
    } else if (error.code === 'P1003') {
      console.error('💡 Database does not exist.');
      console.error('   - Check database name in DATABASE_URL');
      console.error('   - Create database if needed');
    } else if (error.code === 'P1010') {
      console.error('💡 Access denied.');
      console.error('   - Check username and password');
      console.error('   - Verify user permissions');
    } else if (error.code === 'P2010') {
      console.error('💡 Raw query failed.');
      console.error('   - Database might not be properly initialized');
      console.error('   - Run: npx prisma migrate deploy');
    }

    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('   1. Verify DATABASE_URL format: postgresql://user:pass@host:port/db');
    console.log('   2. Test connection with psql or pgAdmin');
    console.log('   3. Check Render logs for database service');
    console.log('   4. Ensure pgvector extension is enabled (if needed)');

    return false;
  } finally {
    await prisma.$disconnect();
    console.log('');
    console.log('='.repeat(60));
  }
}

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});