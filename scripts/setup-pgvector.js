#!/usr/bin/env node

/**
 * Setup pgvector extension on Render PostgreSQL
 * This script connects to the Render database and installs pgvector
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Render database connection - TEST DATABASE
const DATABASE_URL = 'postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a.oregon-postgres.render.com/sentia_manufacturing_test';

async function setupPgVector() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Render database...');
    await client.connect();
    console.log('✓ Connected successfully');

    // Check if we have necessary privileges
    console.log('\nChecking database privileges...');
    const userResult = await client.query('SELECT current_user, current_database()');
    console.log('Current user:', userResult.rows[0].current_user);
    console.log('Current database:', userResult.rows[0].current_database);

    // Try to create the extension
    console.log('\nAttempting to install pgvector extension...');
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✓ pgvector extension installed successfully!');
    } catch (error) {
      if (error.message.includes('permission denied')) {
        console.error('✗ Permission denied. Render databases may not allow extension creation.');
        console.log('\nAlternative solution:');
        console.log('1. Contact Render support to enable pgvector');
        console.log('2. Or use Render\'s PostgreSQL with pgvector addon');
        console.log('3. Or migrate to Neon/Supabase which have pgvector pre-installed');
      } else if (error.message.includes('does not exist')) {
        console.error('✗ pgvector extension not available on this server');
        console.log('\nThe pgvector extension needs to be installed at the server level.');
        console.log('Contact Render support to add pgvector to your database.');
      } else {
        throw error;
      }
      return;
    }

    // Verify installation
    console.log('\nVerifying pgvector installation...');
    const extResult = await client.query(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
    );

    if (extResult.rows.length > 0) {
      console.log('✓ pgvector is installed!');
      console.log('  Version:', extResult.rows[0].extversion);

      // Test vector functionality
      console.log('\nTesting vector functionality...');
      await client.query('DROP TABLE IF EXISTS vector_test');
      await client.query('CREATE TABLE vector_test (id SERIAL PRIMARY KEY, embedding vector(3))');
      await client.query("INSERT INTO vector_test (embedding) VALUES ('[1,2,3]')");
      const testResult = await client.query('SELECT * FROM vector_test');
      console.log('✓ Vector operations working:', testResult.rows[0]);
      await client.query('DROP TABLE vector_test');

      console.log('\n✓ SUCCESS! pgvector is fully functional.');
      console.log('\nNext steps:');
      console.log('1. Uncomment the embedding field in prisma/schema.prisma');
      console.log('2. Commit and push the changes');
      console.log('3. Redeploy to Render');
    } else {
      console.log('✗ pgvector extension not found after installation attempt');
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the setup
console.log('='.repeat(60));
console.log('pgvector Setup for Render PostgreSQL');
console.log('='.repeat(60));

setupPgVector().catch(console.error);