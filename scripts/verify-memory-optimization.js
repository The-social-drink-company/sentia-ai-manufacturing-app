#!/usr/bin/env node

/**
 * Verify Memory Optimization Deployment
 * Checks if the ultra-light server is deployed and working correctly
 */

import fetch from 'node-fetch';

const ENVIRONMENTS = {
  development: 'https://sentia-manufacturing-development.onrender.com',
  testing: 'https://sentia-manufacturing-testing.onrender.com',
  production: 'https://sentia-manufacturing-production.onrender.com'
};

async function verifyDeployment(name, url) {
  console.log(`\nChecking ${name}...`);

  try {
    // Check health endpoint
    const healthResponse = await fetch(`${url}/health`, {
      timeout: 5000,
      headers: { 'User-Agent': 'Memory-Verify/1.0' }
    });

    if (!healthResponse.ok) {
      console.error(`  ❌ Health check failed: HTTP ${healthResponse.status}`);
      return false;
    }

    const healthData = await healthResponse.json();

    // Check for memory metrics (ultra-light server provides these)
    if (healthData.memory) {
      const { heapUsedMB, heapTotalMB, heapPercent, rssMB } = healthData.memory;
      console.log(`  ✅ Ultra-light server detected!`);
      console.log(`     Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercent})`);
      console.log(`     RSS: ${rssMB}MB`);

      // Check if memory is actually optimized
      const rssValue = parseFloat(rssMB);
      if (rssValue < 60) {
        console.log(`  ✅ Memory optimization successful! RSS < 60MB`);
        return true;
      } else {
        console.log(`  ⚠️ Memory still high: ${rssMB}MB (target < 60MB)`);
        return false;
      }
    } else {
      console.log(`  ❌ Old server detected (no memory metrics)`);
      console.log(`     Response:`, JSON.stringify(healthData, null, 2));
      return false;
    }

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('MEMORY OPTIMIZATION VERIFICATION');
  console.log('='.repeat(50));
  console.log('Checking if ultra-light server is deployed...\n');

  const results = {};

  for (const [name, url] of Object.entries(ENVIRONMENTS)) {
    results[name] = await verifyDeployment(name, url);
  }

  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));

  let optimizedCount = 0;
  for (const [name, success] of Object.entries(results)) {
    if (success) {
      console.log(`✅ ${name}: OPTIMIZED`);
      optimizedCount++;
    } else {
      console.log(`❌ ${name}: NOT OPTIMIZED`);
    }
  }

  console.log('\n' + '='.repeat(50));
  if (optimizedCount === 0) {
    console.log('⚠️ NO ENVIRONMENTS ARE OPTIMIZED YET');
    console.log('The deployment may still be in progress.');
    console.log('Wait 5-10 minutes and run this script again.');
  } else if (optimizedCount === Object.keys(results).length) {
    console.log('🎉 ALL ENVIRONMENTS ARE OPTIMIZED!');
  } else {
    console.log(`⏳ ${optimizedCount}/${Object.keys(results).length} environments optimized`);
  }

  console.log('\nNext steps:');
  console.log('1. Check Render dashboard for deployment status');
  console.log('2. Review build logs for any errors');
  console.log('3. Ensure render.yaml is using server-ultra-light.js');
  console.log('4. Run this script again in a few minutes');
}

main().catch(console.error);