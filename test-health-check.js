// Quick health check test for Sentia Manufacturing Dashboard
import https from 'https';

const environments = {
  development: 'https://sentia-manufacturing-development.onrender.com',
  testing: 'https://sentia-manufacturing-testing.onrender.com',
  production: 'https://sentia-manufacturing-production.onrender.com',
  mcp: 'https://mcp-server-tkyu.onrender.com'
};

console.log('========================================');
console.log('SENTIA HEALTH CHECK - QUICK TEST');
console.log('========================================\n');

async function checkHealth(name, url) {
  return new Promise((resolve) => {
    console.log(`Testing ${name}: ${url}`);

    const request = https.get(url + '/health', { timeout: 10000 }, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Result: ${res.statusCode === 200 ? 'PASS' : 'FAIL'}\n`);
      resolve({ name, url, status: res.statusCode });
    });

    request.on('error', (err) => {
      console.log(`  Error: ${err.message}`);
      console.log(`  Result: FAIL\n`);
      resolve({ name, url, error: err.message });
    });

    request.on('timeout', () => {
      console.log(`  Error: Request timeout`);
      console.log(`  Result: TIMEOUT\n`);
      request.destroy();
      resolve({ name, url, error: 'timeout' });
    });
  });
}

async function runHealthChecks() {
  const results = [];

  for (const [name, url] of Object.entries(environments)) {
    const result = await checkHealth(name, url);
    results.push(result);
  }

  // Summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');

  const passed = results.filter(r => r.status === 200).length;
  const failed = results.filter(r => r.error || (r.status && r.status !== 200)).length;

  console.log(`Total Environments: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  // Critical routes check
  console.log('\n========================================');
  console.log('CRITICAL ROUTES CHECK');
  console.log('========================================\n');

  const criticalRoutes = [
    { name: 'Working Capital', path: '/working-capital' },
    { name: 'What-If Analysis', path: '/what-if' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Forecasting', path: '/forecasting' }
  ];

  // Test critical routes on development environment
  const devUrl = environments.development;
  console.log(`Testing critical routes on: ${devUrl}\n`);

  for (const route of criticalRoutes) {
    await new Promise((resolve) => {
      console.log(`Testing ${route.name}: ${route.path}`);

      const request = https.get(devUrl + route.path, { timeout: 5000 }, (res) => {
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Result: ${res.statusCode < 500 ? 'PASS' : 'FAIL'}\n`);
        resolve();
      });

      request.on('error', (err) => {
        console.log(`  Error: ${err.message}`);
        console.log(`  Result: FAIL\n`);
        resolve();
      });

      request.on('timeout', () => {
        console.log(`  Error: Timeout\n`);
        request.destroy();
        resolve();
      });
    });
  }

  console.log('========================================');
  console.log('Health check complete!');
  console.log('========================================');
}

// Run the health checks
runHealthChecks().catch(console.error);