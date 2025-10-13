#!/usr/bin/env node

// Simple Render Status Checker - Uses public health endpoints
// No API key required - monitors deployment health via HTTP

import https from 'https';
import fs from 'fs/promises';

const DEPLOYMENTS = {
  development: 'https://sentia-manufacturing-development.onrender.com',
  testing: 'https://sentia-manufacturing-testing.onrender.com',
  production: 'https://sentia-manufacturing-production.onrender.com',
  'mcp-server': 'https://mcp-server-tkyu.onrender.com',
  'autonomous-monitor': 'https://autonomous-render-monitor.onrender.com'
};

class RenderStatusChecker {
  constructor() {
    this.results = {};
    this.startTime = new Date();
  }

  async checkHealth(name, url) {
    return new Promise(_(resolve) => {
      const startTime = Date.now();
      const healthUrl = `${url}/health`;

      https.get(healthUrl, { timeout: 30000 }, _(res) => {
        let data = '';

        res.on('data', _(chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const isHealthy = res.statusCode === 200;

          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = { raw: data };
          }

          resolve({
            name,
            url,
            healthy: isHealthy,
            statusCode: res.statusCode,
            responseTime,
            response: parsedData,
            timestamp: new Date().toISOString()
          });
        });
      }).on('error', (error) => {
        resolve({
          name,
          url,
          healthy: false,
          statusCode: 0,
          error: error.message,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async checkAllDeployments() {
    console.log('='.repeat(80));
    console.log('RENDER DEPLOYMENT STATUS CHECK');
    console.log('='.repeat(80));
    console.log(`Time: ${new Date().toISOString()}\n`);

    const results = [];

    for (const [name, url] of Object.entries(DEPLOYMENTS)) {
      process.stdout.write(`Checking ${name}...`);
      const result = await this.checkHealth(name, url);
      results.push(result);

      const statusIcon = result.healthy ? '✅' :
                        result.statusCode === 502 ? '❌ (502 Bad Gateway)' :
                        result.statusCode === 503 ? '⚠️  (503 Service Unavailable)' :
                        result.statusCode === 404 ? '❓ (404 Not Found)' :
                        '❌ (Error)';

      console.log(` ${statusIcon}`);
    }

    // Display detailed results
    console.log('\n' + '='.repeat(80));
    console.log('DETAILED STATUS');
    console.log('='.repeat(80));

    for (const result of results) {
      console.log(`\n${result.name.toUpperCase()}`);
      console.log('-'.repeat(40));
      console.log(`URL: ${result.url}`);
      console.log(`Status: ${result.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      console.log(`HTTP Code: ${result.statusCode}`);
      console.log(`Response Time: ${result.responseTime}ms`);

      if (result.error) {
        console.log(`Error: ${result.error}`);
      }

      if (result.response && result.response.status) {
        console.log(`Service Status: ${result.response.status}`);
        if (result.response.version) {
          console.log(`Version: ${result.response.version}`);
        }
        if (result.response.environment) {
          console.log(`Environment: ${result.response.environment}`);
        }
        if (result.response.uptime) {
          console.log(`Uptime: ${Math.floor(result.response.uptime / 60)} minutes`);
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));

    const healthy = results.filter(r => r.healthy);
    const unhealthy = results.filter(r => !r.healthy);
    const errors502 = results.filter(r => r.statusCode === 502);
    const errors503 = results.filter(r => r.statusCode === 503);

    console.log(`Total Deployments: ${results.length}`);
    console.log(`✅ Healthy: ${healthy.length}`);
    console.log(`❌ Unhealthy: ${unhealthy.length}`);

    if (errors502.length > 0) {
      console.log(`   - 502 Bad Gateway: ${errors502.length} (${errors502.map(e => e.name).join(', ')})`);
    }
    if (errors503.length > 0) {
      console.log(`   - 503 Service Unavailable: ${errors503.length} (${errors503.map(e => e.name).join(', ')})`);
    }

    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);

    // Save results
    await this.saveResults(results);

    return results;
  }

  async saveResults(results) {
    const data = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        healthy: results.filter(r => r.healthy).length,
        unhealthy: results.filter(r => !r.healthy).length
      },
      deployments: results
    };

    try {
      await fs.writeFile(
        'scripts/deployment-status.json',
        JSON.stringify(data, null, 2)
      );
      console.log('\nStatus saved to scripts/deployment-status.json');
    } catch (error) {
      console.error('Failed to save status:', error.message);
    }
  }

  async monitorContinuously(intervalMinutes = 2) {
    console.log(`Starting continuous monitoring (every ${intervalMinutes} minutes)...\n`);

    // Initial check
    await this.checkAllDeployments();

    // Set up interval
    setInterval(async () => {
      console.log('\n' + '='.repeat(80));
      await this.checkAllDeployments();
    }, intervalMinutes * 60 * 1000);
  }

  async analyzeTrends() {
    try {
      const data = await fs.readFile('scripts/deployment-status.json', 'utf-8');
      const status = JSON.parse(data);

      console.log('\n' + '='.repeat(80));
      console.log('DEPLOYMENT TRENDS');
      console.log('='.repeat(80));

      for (const deployment of status.deployments) {
        const trend = deployment.healthy ? '📈' : '📉';
        console.log(`${trend} ${deployment.name}: ${deployment.healthy ? 'UP' : 'DOWN'}`);
      }
    } catch (error) {
      console.log('No previous data for trend analysis');
    }
  }
}

// Main execution
async function main() {
  const checker = new RenderStatusChecker();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check':
      // One-time check
      await checker.checkAllDeployments();
      await checker.analyzeTrends();
      break;

    case 'monitor':
      // Continuous monitoring
      const interval = parseInt(args[1]) || 2;
      await checker.monitorContinuously(interval);
      break;

    case 'trends':
      // Show trends only
      await checker.analyzeTrends();
      break;

    default:
      console.log('Render Status Checker');
      console.log('====================');
      console.log('\nUsage:');
      console.log('  node render-status-checker.js check    - Check all deployments once');
      console.log('  node render-status-checker.js monitor  - Monitor continuously (every 2 min)');
      console.log('  node render-status-checker.js monitor 5 - Monitor every 5 minutes');
      console.log('  node render-status-checker.js trends   - Show deployment trends');
      console.log('\nDeployments monitored:');
      Object.entries(DEPLOYMENTS).forEach(_([name, url]) => {
        console.log(`  - ${name}: ${url}`);
      });
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

export default RenderStatusChecker;