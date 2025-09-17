#!/usr/bin/env node
// Test database connection script
import { prisma, testDatabaseConnection } from './lib/prisma.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('='.repeat(60));
console.log('Database Connection Test');
console.log('='.repeat(60));

// Display connection info (without password)
const dbUrl = process.env.DATABASE_URL || 'Not set';
const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
console.log('DATABASE_URL:', maskedUrl);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Render deployment:', process.env.RENDER ? 'Yes' : 'No');
console.log('');

// Test the connection
async function testConnection() {
  try {
    console.log('Testing connection...');

    // Method 1: Using Prisma $connect
    await prisma.$connect();
    console.log('✅ Prisma.$connect() successful');

    // Method 2: Running a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Database query successful');
    console.log('  Server time:', result[0].current_time);
    console.log('  PostgreSQL version:', result[0].pg_version);

    // Method 3: Check for tables
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
      LIMIT 10
    `;
    console.log('✅ Found', tables.length, 'tables in public schema');
    if (tables.length > 0) {
      console.log('  Tables:', tables.map(t => t.tablename).join(', '));
    }

    // Test if User table exists
    try {
      const userCount = await prisma.user.count();
      console.log('✅ User table accessible, contains', userCount, 'records');
    } catch (err) {
      console.log('⚠️ User table not accessible:', err.message);
    }

    console.log('\n🎉 Database connection test PASSED!');

  } catch (error) {
    console.error('\n❌ Database connection test FAILED!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check DATABASE_URL environment variable');
    console.error('2. Ensure PostgreSQL server is running');
    console.error('3. Verify database credentials');
    console.error('4. Check network connectivity');
    console.error('5. For Render: Ensure PostgreSQL service is attached');
  } finally {
    await prisma.$disconnect();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testConnection();