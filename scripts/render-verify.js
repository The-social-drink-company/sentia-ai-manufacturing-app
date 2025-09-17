#!/usr/bin/env node

/**
 * Render Verification Script
 * Verifies deployment status and health of Render services
 */

// Node 18+ has global fetch

const services = {
  development: 'https://sentia-manufacturing-development.onrender.com',
  testing: 'https://sentia-manufacturing-testing.onrender.com',
  production: 'https://sentia-manufacturing-production.onrender.com'
};

async function checkHealth(url, name) {
  console.log(`\nChecking ${name}...`);

  try {
    // Check main page
    console.log(`- Main page: ${url}`);
    const mainResponse = await fetch(url, { timeout: 10000 });
    if (mainResponse.ok) {
      console.log(`  ✓ Main page responding (${mainResponse.status})`);
    } else {
      console.log(`  ✗ Main page error (${mainResponse.status})`);
    }

    // Check health endpoint
    console.log(`- Health check: ${url}/health`);
    const healthResponse = await fetch(`${url}/health`, { timeout: 10000 });
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`  ✓ Health check passed`);
      console.log(`    Status: ${health.status}`);
      console.log(`    Environment: ${health.environment}`);
      console.log(`    Database: ${health.services?.database || 'unknown'}`);
    } else {
      console.log(`  ✗ Health check failed (${healthResponse.status})`);
    }

    // Check API endpoint
    console.log(`- API check: ${url}/api/health`);
    const apiResponse = await fetch(`${url}/api/health`, { timeout: 10000 });
    if (apiResponse.ok) {
      const api = await apiResponse.json();
      console.log(`  ✓ API responding`);
      console.log(`    Service: ${api.service}`);
      console.log(`    Version: ${api.version}`);
    } else {
      console.log(`  ✗ API error (${apiResponse.status})`);
    }

    return true;
  } catch (error) {
    console.log(`  ✗ Service unreachable: ${error.message}`);
    return false;
  }
}

async function verifyAllServices() {
  console.log('========================================');
  console.log('Render Deployment Verification');
  console.log('========================================');

  const results = {};

  for (const [env, url] of Object.entries(services)) {
    results[env] = await checkHealth(url, `${env} environment`);
  }

  console.log('\n========================================');
  console.log('Summary:');
  console.log('========================================');

  let allHealthy = true;
  for (const [env, healthy] of Object.entries(results)) {
    const status = healthy ? '✓ ONLINE' : '✗ OFFLINE';
    const emoji = healthy ? '🟢' : '🔴';
    console.log(`${emoji} ${env.padEnd(12)}: ${status}`);
    if (!healthy) allHealthy = false;
  }

  console.log('========================================');

  if (allHealthy) {
    console.log('\n✅ All services are healthy!');
  } else {
    console.log('\n⚠️  Some services need attention.');
    console.log('Check the Render dashboard for deployment logs.');
  }

  console.log('\nDashboard: https://dashboard.render.com');
}

// Check specific environment if provided, otherwise check all
const environment = process.argv[2];

if (environment && services[environment]) {
  console.log(`Verifying ${environment} deployment...`);
  checkHealth(services[environment], environment).then(healthy => {
    if (healthy) {
      console.log(`\n✅ ${environment} deployment is healthy!`);
    } else {
      console.log(`\n❌ ${environment} deployment needs attention.`);
      process.exit(1);
    }
  });
} else {
  verifyAllServices().catch(console.error);
}