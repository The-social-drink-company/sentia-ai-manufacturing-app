#!/usr/bin/env node

import fetch from 'node-fetch';

const urls = [
  'https://sentia-manufacturing-development.onrender.com',
  'https://sentia-manufacturing-testing.onrender.com',
  'https://sentia-manufacturing-production.onrender.com'
];

async function testDeployment(url) {
  console.log(`\nTesting ${url}...`);

  try {
    // Test main page
    const mainResponse = await fetch(url, { timeout: 10000 });
    console.log(`  Main page: ${mainResponse.status} ${mainResponse.statusText}`);

    // Test health endpoint
    const healthResponse = await fetch(`${url}/health`, { timeout: 10000 });
    console.log(`  Health endpoint: ${healthResponse.status}`);

    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`  Status: ${health.status}`);
      console.log(`  Version: ${health.version}`);
    }

    // Test a JS file
    const jsResponse = await fetch(`${url}/js/index-D392nfhp.js`, { timeout: 10000 });
    console.log(`  JS file test: ${jsResponse.status}`);

    // Test API status
    const apiResponse = await fetch(`${url}/api/status`, { timeout: 10000 });
    console.log(`  API status: ${apiResponse.status}`);

  } catch (error) {
    console.log(`  ERROR: ${error.message}`);
  }
}

console.log('='.repeat(60));
console.log('RENDER DEPLOYMENT DIAGNOSTIC TEST');
console.log('='.repeat(60));

for (const url of urls) {
  await testDeployment(url);
}

console.log('\n' + '='.repeat(60));
console.log('Test complete');