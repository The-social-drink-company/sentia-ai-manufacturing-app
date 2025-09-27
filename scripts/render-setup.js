#!/usr/bin/env node

/**
 * Render Setup Script
 * Sets up environment variables for Render services
 */

// Node 18+ has global fetch
import fs from 'fs';
import path from 'path';

const RENDERAPI_KEY = process.env.RENDER_API_KEY || 'rnd_mYUAytWRkb2Pj5GJROqNYubYt25J';

const environments = {
  development: {
    serviceName: 'sentia-manufacturing-development',
    envFile: 'render-vars-DEVELOPMENT.txt',
    dbService: 'sentia-db-development'
  },
  testing: {
    serviceName: 'sentia-manufacturing-testing',
    envFile: 'render-vars-TESTING.txt',
    dbService: 'sentia-db-testing'
  },
  production: {
    serviceName: 'sentia-manufacturing-production',
    envFile: 'render-vars-PRODUCTION.txt',
    dbService: 'sentia-db-production'
  }
};

async function getServiceId(serviceName) {
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

async function getDatabaseUrl(dbServiceName) {
  const dbServiceId = await getServiceId(dbServiceName);
  if (!dbServiceId) {
    console.log(`Database service ${dbServiceName} not found`);
    return null;
  }

  try {
    const response = await fetch(`https://api.render.com/v1/services/${dbServiceId}`, {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const service = await response.json();
    // The connection string is usually in the environment variables or connection info
    console.log(`Database ${dbServiceName} found. Please copy connection string from Render dashboard.`);
    return null; // Connection strings are not exposed via API for security
  } catch (error) {
    console.error('Error getting database info:', error.message);
    return null;
  }
}

async function updateEnvironmentVariables(serviceId, variables) {
  try {
    const envArray = Object.entries(variables).map(([key, value]) => ({
      key,
      value: value.toString()
    }));

    const response = await fetch(`https://api.render.com/v1/services/${serviceId}/env-vars`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envArray)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error updating environment variables:', error.message);
    return false;
  }
}

async function setupEnvironment(env) {
  const config = environments[env];
  if (!config) {
    console.error(`Invalid environment: ${env}`);
    return;
  }

  console.log(`Setting up ${env} environment...`);
  console.log(`Service: ${config.serviceName}`);
  console.log(`Database: ${config.dbService}`);

  // Get service ID
  const serviceId = await getServiceId(config.serviceName);
  if (!serviceId) {
    console.error('Service not found. Please create it in Render dashboard first.');
    return;
  }

  // Read environment variables
  const envVars = {};
  const envFilePath = path.join(process.cwd(), config.envFile);

  if (fs.existsSync(envFilePath)) {
    const content = fs.readFileSync(envFilePath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
  } else {
    console.log(`Environment file ${config.envFile} not found, using defaults`);

    // Default environment variables
    envVars.NODEENV = env;
    envVars.PORT = '10000';
    envVars.CORSORIGINS = `https://${config.serviceName}.onrender.com`;
    envVars.VITEAPI_BASE_URL = `https://${config.serviceName}.onrender.com/api`;
    envVars.VITEAPP_TITLE = 'Sentia Manufacturing Dashboard';
    envVars.SESSIONSECRET = `sentia-session-secret-${env}-2025`;
    envVars.JWTSECRET = `sentia-jwt-secret-${env}-2025`;
  }

  // Get database URL
  console.log('\nChecking database connection...');
  await getDatabaseUrl(config.dbService);
  console.log('Note: Database URL must be set manually in Render dashboard');

  // Update environment variables
  console.log('\nUpdating environment variables...');
  const success = await updateEnvironmentVariables(serviceId, envVars);

  if (success) {
    console.log('Environment variables updated successfully!');
    console.log(`\nNext steps:`);
    console.log(`1. Go to https://dashboard.render.com`);
    console.log(`2. Navigate to ${config.serviceName}`);
    console.log(`3. Update DATABASE_URL with connection string from ${config.dbService}`);
    console.log(`4. Trigger a manual deploy`);
    console.log(`\nService will be available at: https://${config.serviceName}.onrender.com`);
  } else {
    console.error('Failed to update environment variables');
  }
}

// Main execution
const environment = process.argv[2] || 'development';
setupEnvironment(environment).catch(console.error);