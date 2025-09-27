#!/usr/bin/env node

/**
 * Test All Render Deployments for Client Handover
 * Checks all three branches and reports status
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

const DEPLOYMENTS = [
  {
    name: 'Development',
    url: 'https://sentia-manufacturing-development.onrender.com',
    branch: 'development'
  },
  {
    name: 'Testing',
    url: 'https://sentia-manufacturing-testing.onrender.com',
    branch: 'test'
  },
  {
    name: 'Production',
    url: 'https://sentia-manufacturing-production.onrender.com',
    branch: 'production'
  }
];

const MCPSERVER = {
  name: 'MCP Server',
  url: 'https://mcp-server-tkyu.onrender.com',
  endpoint: '/health'
};

async function checkDeployment(deployment) {
  const results = {
    name: deployment.name,
    branch: deployment.branch,
    url: deployment.url,
    health: null,
    home: null,
    api: null,
    auth: null,
    errors: []
  };

  try {
    // Check health endpoint
    console.log(chalk.cyan(`Testing ${deployment.name} health endpoint...`));
    const healthRes = await fetch(`${deployment.url}/health`, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Sentia-Test-Agent' }
    });
    results.health = {
      status: healthRes.status,
      ok: healthRes.ok,
      statusText: healthRes.statusText
    };

    if (healthRes.ok) {
      try {
        const healthData = await healthRes.json();
        results.health.data = healthData;
      } catch (e) {
        results.health.data = 'Non-JSON response';
      }
    }

    // Check home page
    console.log(chalk.cyan(`Testing ${deployment.name} home page...`));
    const homeRes = await fetch(deployment.url, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Sentia-Test-Agent' }
    });
    results.home = {
      status: homeRes.status,
      ok: homeRes.ok,
      statusText: homeRes.statusText
    };

    // Check API endpoint
    console.log(chalk.cyan(`Testing ${deployment.name} API...`));
    const apiRes = await fetch(`${deployment.url}/api/status`, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Sentia-Test-Agent' }
    });
    results.api = {
      status: apiRes.status,
      ok: apiRes.ok,
      statusText: apiRes.statusText
    };

    if (apiRes.ok) {
      try {
        const apiData = await apiRes.json();
        results.api.data = apiData;
      } catch (e) {
        results.api.data = 'Non-JSON response';
      }
    }

  } catch (error) {
    results.errors.push(error.message);
  }

  return results;
}

async function checkMCPServer() {
  console.log(chalk.yellow('\n=== MCP Server Status ==='));
  
  try {
    const res = await fetch(`${MCP_SERVER.url}${MCP_SERVER.endpoint}`, {
      timeout: 10000,
      headers: { 'User-Agent': 'Sentia-Test-Agent' }
    });

    if (res.ok) {
      const data = await res.json();
      console.log(chalk.green('✓ MCP Server is ONLINE'));
      console.log(`  Status: ${data.status}`);
      console.log(`  Message: ${data.message}`);
    } else {
      console.log(chalk.red('✗ MCP Server is DOWN'));
      console.log(`  Status: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.log(chalk.red('✗ MCP Server is UNREACHABLE'));
    console.log(`  Error: ${error.message}`);
  }
}

async function runTests() {
  console.log(chalk.blue.bold('\n🚀 SENTIA MANUFACTURING - CLIENT HANDOVER TEST'));
  console.log(chalk.blue('=' .repeat(60)));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(chalk.blue('=' .repeat(60)));

  // Check MCP Server first
  await checkMCPServer();

  // Check all deployments
  console.log(chalk.yellow('\n=== Deployment Status ==='));
  
  for (const deployment of DEPLOYMENTS) {
    console.log(chalk.blue(`\nChecking ${deployment.name} (${deployment.branch})...`));
    const results = await checkDeployment(deployment);
    
    // Print results
    console.log(`\n${chalk.bold(deployment.name)} Results:`);
    console.log(`URL: ${deployment.url}`);
    
    // Health check
    if (results.health?.ok) {
      console.log(chalk.green(`✓ Health: ${results.health.status} - PASS`));
      if (results.health.data?.status) {
        console.log(`  Status: ${results.health.data.status}`);
      }
    } else {
      console.log(chalk.red(`✗ Health: ${results.health?.status || 'ERROR'} - FAIL`));
    }
    
    // Home page
    if (results.home?.ok) {
      console.log(chalk.green(`✓ Home Page: ${results.home.status} - PASS`));
    } else {
      console.log(chalk.red(`✗ Home Page: ${results.home?.status || 'ERROR'} - FAIL`));
    }
    
    // API
    if (results.api?.ok) {
      console.log(chalk.green(`✓ API: ${results.api.status} - PASS`));
      if (results.api.data) {
        console.log(`  Database: ${results.api.data.database || 'unknown'}`);
        console.log(`  Services: ${results.api.data.services ? Object.keys(results.api.data.services).length : 0}`);
      }
    } else {
      console.log(chalk.yellow(`Warning API: ${results.api?.status || 'ERROR'}`));
    }
    
    // Errors
    if (results.errors.length > 0) {
      console.log(chalk.red('Errors:'));
      results.errors.forEach(err => console.log(`  - ${err}`));
    }
  }

  // Summary
  console.log(chalk.blue('\n' + '='.repeat(60)));
  console.log(chalk.bold('CLIENT HANDOVER CHECKLIST:'));
  console.log('[ ] All deployments return 200 status');
  console.log('[ ] Health endpoints are accessible');
  console.log('[ ] API endpoints return JSON data');
  console.log('[ ] MCP Server is online and healthy');
  console.log('[ ] Clerk authentication configured');
  console.log('[ ] Database connections established');
  console.log('[ ] Real data flowing from APIs');
  console.log(chalk.blue('=' .repeat(60)));
}

// Run tests
runTests().catch(console.error);