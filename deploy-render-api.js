#!/usr/bin/env node

/**
 * Render API Deployment Script
 * Automatically creates service with all environment variables
 */

import https from 'https';
import fs from 'fs';
import yaml from 'js-yaml';

// Parse render.yaml to get all environment variables
const renderConfig = yaml.load(fs.readFileSync('render.yaml', 'utf8'));
const service = renderConfig.services[0];

// Extract all environment variables
const envVars = {};
service.envVars.forEach(v => {
  if (v.generateValue) {
    // Skip auto-generated values
    return;
  }
  envVars[v.key] = v.value || '';
});

console.log('Found', Object.keys(envVars).length, 'environment variables to deploy');

// Render API configuration
const RENDER_API_KEY = process.env.RENDER_API_KEY;
if (!RENDER_API_KEY) {
  console.error('\n[ERROR] RENDER_API_KEY not found in environment variables');
  console.log('\nTo get your Render API key:');
  console.log('1. Go to https://dashboard.render.com/u/settings/api-keys');
  console.log('2. Create a new API key');
  console.log('3. Set it as environment variable:');
  console.log('   Windows: set RENDER_API_KEY=your-api-key');
  console.log('   Mac/Linux: export RENDER_API_KEY=your-api-key');
  console.log('\nThen run this script again.');
  process.exit(1);
}

// Create service via Render API
const serviceData = {
  type: 'web_service',
  name: service.name,
  ownerId: 'usr-default', // Will be replaced with actual owner ID
  repo: 'https://github.com/The-social-drink-company/sentia-manufacturing-dashboard',
  branch: 'development',
  runtime: 'node',
  region: service.region || 'oregon',
  plan: service.plan || 'free',
  buildCommand: service.buildCommand,
  startCommand: service.startCommand,
  healthCheckPath: service.healthCheckPath || '/health',
  envVars: Object.entries(envVars).map(([key, value]) => ({
    key,
    value: String(value)
  }))
};

const options = {
  hostname: 'api.render.com',
  port: 443,
  path: '/v1/services',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

console.log('\nCreating Render service with all environment variables...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 201) {
      const response = JSON.parse(data);
      console.log('\n[SUCCESS] Service created successfully!');
      console.log('Service ID:', response.service.id);
      console.log('Service URL:', `https://${response.service.slug}.onrender.com`);
      console.log('\nAll', Object.keys(envVars).length, 'environment variables have been deployed!');
      console.log('\nView your service at:');
      console.log(`https://dashboard.render.com/web/${response.service.id}`);
    } else {
      console.error('\n[ERROR] Failed to create service');
      console.error('Status:', res.statusCode);
      console.error('Response:', data);

      if (res.statusCode === 401) {
        console.log('\nYour API key may be invalid. Please check and try again.');
      } else if (res.statusCode === 402) {
        console.log('\nYour Render account may need upgrading for this service.');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('\n[ERROR] Request failed:', error.message);
});

// Send the request
req.write(JSON.stringify(serviceData));
req.end();

console.log('\nSending request to Render API...');