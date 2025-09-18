#!/usr/bin/env node

// Render Deployment Monitor with API Integration
// Uses Render REST API to fetch deployment logs and status

import https from 'https';
import fs from 'fs/promises';

const CONFIG = {
  apiKey: process.env.RENDER_API_KEY || '', // You'll need to set this
  baseUrl: 'https://api.render.com/v1',
  services: {
    development: 'srv-ct5lllq3esus73dhk5e0', // Update with actual service IDs
    testing: 'srv-ct5lllq3esus73dhk5f0',
    production: 'srv-ct5lllq3esus73dhk5g0',
    'mcp-server': 'srv-ct5lllq3esus73dhk5h0',
    'autonomous-monitor': 'srv-ct5lllq3esus73dhk5i0'
  }
};

class RenderDeploymentMonitor {
  constructor() {
    this.apiKey = CONFIG.apiKey;
    if (!this.apiKey) {
      console.error('ERROR: RENDER_API_KEY environment variable not set');
      console.log('Please set your Render API key:');
      console.log('  export RENDER_API_KEY=your-api-key-here');
      console.log('\nYou can get your API key from:');
      console.log('  https://dashboard.render.com/u/settings/api-keys');
      process.exit(1);
    }
  }

  async makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.render.com',
        port: 443,
        path: `/v1${path}`,
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async getServices() {
    console.log('Fetching Render services...\n');
    const response = await this.makeRequest('/services?limit=20');

    if (response.error) {
      console.error('API Error:', response.error);
      return [];
    }

    return response;
  }

  async getServiceDetails(serviceId) {
    return await this.makeRequest(`/services/${serviceId}`);
  }

  async getDeployments(serviceId, limit = 5) {
    return await this.makeRequest(`/services/${serviceId}/deploys?limit=${limit}`);
  }

  async getDeploymentLogs(serviceId, deployId) {
    // Note: This endpoint might require different authentication
    return await this.makeRequest(`/services/${serviceId}/deploys/${deployId}/logs`);
  }

  async monitorAllServices() {
    console.log('='.repeat(80));
    console.log('RENDER DEPLOYMENT MONITOR');
    console.log('='.repeat(80));
    console.log(`Time: ${new Date().toISOString()}\n`);

    // Get all services
    const services = await this.getServices();

    if (!services || services.length === 0) {
      console.log('No services found or API error. Check your API key.');
      return;
    }

    // Monitor each service
    for (const service of services) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`SERVICE: ${service.name}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Type: ${service.type}`);
      console.log(`Status: ${service.suspended ? 'SUSPENDED' : 'ACTIVE'}`);
      console.log(`URL: ${service.serviceDetails?.url || 'N/A'}`);
      console.log(`Branch: ${service.repo?.branch || 'N/A'}`);
      console.log(`Created: ${new Date(service.createdAt).toLocaleString()}`);
      console.log(`Updated: ${new Date(service.updatedAt).toLocaleString()}`);

      // Get recent deployments
      console.log('\nRecent Deployments:');
      console.log('-'.repeat(40));

      const deploys = await this.getDeployments(service.id);

      if (deploys && deploys.length > 0) {
        for (const deploy of deploys.slice(0, 3)) {
          const status = deploy.status;
          const statusIcon = status === 'live' ? '✅' :
                           status === 'build_failed' ? '❌' :
                           status === 'deactivated' ? '⚫' : '🔄';

          console.log(`\n${statusIcon} Deploy #${deploy.id.slice(-8)}`);
          console.log(`  Status: ${status.toUpperCase()}`);
          console.log(`  Commit: ${deploy.commit?.message || 'N/A'}`);
          console.log(`  Created: ${new Date(deploy.createdAt).toLocaleString()}`);

          if (deploy.finishedAt) {
            const duration = (new Date(deploy.finishedAt) - new Date(deploy.createdAt)) / 1000;
            console.log(`  Duration: ${Math.round(duration)}s`);
          }
        }
      } else {
        console.log('No deployments found');
      }
    }

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('SUMMARY');
    console.log(`${'='.repeat(80)}`);
    console.log(`Total Services: ${services.length}`);

    const activeServices = services.filter(s => !s.suspended);
    const suspendedServices = services.filter(s => s.suspended);

    console.log(`Active: ${activeServices.length}`);
    console.log(`Suspended: ${suspendedServices.length}`);

    // Save to log file
    await this.saveToLog({
      timestamp: new Date().toISOString(),
      services: services.length,
      active: activeServices.length,
      suspended: suspendedServices.length,
      details: services.map(s => ({
        name: s.name,
        status: s.suspended ? 'suspended' : 'active',
        url: s.serviceDetails?.url
      }))
    });
  }

  async saveToLog(data) {
    try {
      const logFile = 'render-deployment-status.json';
      await fs.writeFile(logFile, JSON.stringify(data, null, 2));
      console.log(`\nStatus saved to ${logFile}`);
    } catch (error) {
      console.error('Failed to save log:', error.message);
    }
  }

  async monitorContinuously(intervalMinutes = 5) {
    console.log(`Starting continuous monitoring (every ${intervalMinutes} minutes)...\n`);

    // Initial check
    await this.monitorAllServices();

    // Set up interval
    setInterval(() => {
      this.monitorAllServices();
    }, intervalMinutes * 60 * 1000);
  }

  async checkBuildLogs(serviceId, deployId) {
    console.log(`\nFetching build logs for deploy ${deployId}...`);
    const logs = await this.makeRequest(`/services/${serviceId}/deploys/${deployId}/logs`);

    if (logs && logs.length > 0) {
      console.log('Build Logs:');
      console.log('-'.repeat(60));
      logs.forEach(log => {
        console.log(log);
      });
    } else {
      console.log('No logs available or insufficient permissions');
    }
  }
}

// CLI Usage
async function main() {
  const monitor = new RenderDeploymentMonitor();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'services':
      // List all services
      const services = await monitor.getServices();
      console.log(JSON.stringify(services, null, 2));
      break;

    case 'monitor':
      // One-time monitoring
      await monitor.monitorAllServices();
      break;

    case 'continuous':
      // Continuous monitoring
      const interval = parseInt(args[1]) || 5;
      await monitor.monitorContinuously(interval);
      break;

    case 'logs':
      // Get logs for specific deployment
      const serviceId = args[1];
      const deployId = args[2];
      if (!serviceId || !deployId) {
        console.log('Usage: node render-deployment-monitor.js logs <serviceId> <deployId>');
        break;
      }
      await monitor.checkBuildLogs(serviceId, deployId);
      break;

    default:
      console.log('Render Deployment Monitor');
      console.log('========================');
      console.log('\nUsage:');
      console.log('  node render-deployment-monitor.js services     - List all services');
      console.log('  node render-deployment-monitor.js monitor      - Check all deployments once');
      console.log('  node render-deployment-monitor.js continuous   - Monitor continuously (default: every 5 min)');
      console.log('  node render-deployment-monitor.js continuous 10 - Monitor every 10 minutes');
      console.log('  node render-deployment-monitor.js logs <serviceId> <deployId> - Get deployment logs');
      console.log('\nEnvironment:');
      console.log('  RENDER_API_KEY - Your Render API key (required)');
      console.log('\nGet your API key from: https://dashboard.render.com/u/settings/api-keys');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

export default RenderDeploymentMonitor;