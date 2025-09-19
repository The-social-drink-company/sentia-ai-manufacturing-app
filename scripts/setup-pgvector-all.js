#!/usr/bin/env node

/**
 * Setup pgvector extension on ALL Render PostgreSQL databases
 * This script installs pgvector on dev, test, and production databases
 */

import pg from 'pg';

// Render database connections
const DATABASES = {
  development: {
    name: 'Development',
    url: 'postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_dev'
  },
  test: {
    name: 'Test',
    url: 'postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a.oregon-postgres.render.com/sentia_manufacturing_test'
  },
  production: {
    name: 'Production',
    url: 'postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a.oregon-postgres.render.com/sentia_manufacturing_prod'
  }
};

async function setupPgVector(environment, connectionString) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Setting up pgvector for ${environment} database`);
  console.log('='.repeat(60));

  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully');

    // Check current user and database
    const userResult = await client.query('SELECT current_user, current_database()');
    console.log('User:', userResult.rows[0].current_user);
    console.log('Database:', userResult.rows[0].current_database);

    // Try to create the extension
    console.log('Installing pgvector extension...');
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✓ pgvector extension installed successfully!');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✓ pgvector extension already exists');
      } else {
        throw error;
      }
    }

    // Verify installation
    const extResult = await client.query(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
    );

    if (extResult.rows.length > 0) {
      console.log('✓ pgvector verified - Version:', extResult.rows[0].extversion);

      // Quick functionality test
      await client.query('DROP TABLE IF EXISTS vector_test_temp');
      await client.query('CREATE TABLE vector_test_temp (id SERIAL PRIMARY KEY, vec vector(3))');
      await client.query("INSERT INTO vector_test_temp (vec) VALUES ('[1,2,3]')");
      const testResult = await client.query('SELECT * FROM vector_test_temp LIMIT 1');
      console.log('✓ Vector operations working');
      await client.query('DROP TABLE vector_test_temp');
    } else {
      console.log('⚠ pgvector extension not found');
      return false;
    }

    return true;

  } catch (error) {
    console.error('✗ Error:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function setupAll() {
  console.log('pgvector Installation for Render PostgreSQL Databases');
  console.log('=' .repeat(60));

  const results = {
    development: false,
    test: false,
    production: false
  };

  // Setup development database
  if (DATABASES.development.url && !DATABASES.development.url.includes('dummy')) {
    results.development = await setupPgVector(DATABASES.development.name, DATABASES.development.url);
  }

  // Setup test database
  if (DATABASES.test.url && !DATABASES.test.url.includes('dummy')) {
    results.test = await setupPgVector(DATABASES.test.name, DATABASES.test.url);
  }

  // Setup production database (if URL is provided)
  if (DATABASES.production.url && !DATABASES.production.url.includes('production_user')) {
    results.production = await setupPgVector(DATABASES.production.name, DATABASES.production.url);
  } else {
    console.log('\n⚠ Skipping production database (no URL configured)');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('INSTALLATION SUMMARY');
  console.log('='.repeat(60));
  console.log('Development:', results.development ? '✓ SUCCESS' : '✗ FAILED');
  console.log('Test:', results.test ? '✓ SUCCESS' : '✗ FAILED');
  console.log('Production:', results.production ? '✓ SUCCESS' : '⚠ SKIPPED');

  if (results.development && results.test) {
    console.log('\n✓ All configured databases have pgvector installed!');
    console.log('\nNext steps:');
    console.log('1. Ensure embedding field is uncommented in prisma/schema.prisma');
    console.log('2. Deploy to all environments');
    console.log('3. AI/ML features are now enabled!');
  }
}

// Run setup for all databases
setupAll().catch(console.error);