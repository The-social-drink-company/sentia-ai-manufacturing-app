#!/usr/bin/env node

/**
 * Render Deployment Script
 * Deploys CapLiquify Manufacturing Platform to Render
 */

// Node 18+ has global fetch
import { execSync } from 'child_process';

const RENDERAPI_KEY = process.env.RENDER_API_KEY || 'rnd_mYUAytWRkb2Pj5GJROqNYubYt25J';
const environment = process.argv[2] || 'development';

const services = {
  development: 'sentia-manufacturing-development',
  testing: 'sentia-manufacturing-testing',
  production: 'sentia-manufacturing-production'
};

const serviceName = services[environment];

if (!serviceName) {
  console.error('Invalid environment. Use: development, testing, or production');
  process.exit(1);
}

console.log(`Deploying to Render: ${serviceName} (${environment})`);

async function getServiceId() {
  try {
    const response = await fetch('https://api.render.com/v1/services?limit=20', {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const services = await response.json();
    const service = services.find(s => s.service?.name === serviceName);

    if (!service) {
      console.error(`Service ${serviceName} not found`);
      return null;
    }

    return service.service.id;
  } catch (error) {
    console.error('Error getting service ID:', error.message);
    return null;
  }
}

async function triggerDeploy(serviceId) {
  try {
    const response = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clearCache: 'do_not_clear'
      })
    });

    if (!response.ok) {
      throw new Error(`Deploy error: ${response.status}`);
    }

    const deploy = await response.json();
    return deploy;
  } catch (error) {
    console.error('Error triggering deploy:', error.message);
    return null;
  }
}

async function main() {
  console.log('Step 1: Pushing to GitHub...');
  try {
    const branch = environment === 'production' ? 'production' : environment;
    execSync(`git push origin ${branch}`, { stdio: 'inherit' });
    console.log('Code pushed successfully');
  } catch (error) {
    console.error('Git push failed:', error.message);
    process.exit(1);
  }

  console.log('\nStep 2: Getting service ID...');
  const serviceId = await getServiceId();

  if (!serviceId) {
    console.error('Could not find service. Please create it manually in Render dashboard.');
    process.exit(1);
  }

  console.log(`Service ID: ${serviceId}`);

  console.log('\nStep 3: Triggering deployment...');
  const deploy = await triggerDeploy(serviceId);

  if (deploy) {
    console.log('Deployment triggered successfully!');
    console.log(`Deploy ID: ${deploy.id}`);
    console.log(`Monitor at: https://dashboard.render.com/web/${serviceId}/deploys/${deploy.id}`);
    console.log(`\nService URL: https://${serviceName}.onrender.com`);
  } else {
    console.error('Failed to trigger deployment');
    process.exit(1);
  }
}

main().catch(console.error);