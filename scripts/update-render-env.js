#!/usr/bin/env node

// Script to update Render environment variables using API token
import https from 'https';

const RENDER_API_TOKEN = process.env.RENDER_API_TOKEN || 'YOUR_RENDER_API_TOKEN_HERE';
const SERVICE_ID = 'srv-ctg8hkpu0jms73ab8m00'; // Your Render service ID

// Environment variables to update
const envVarsToUpdate = [
  { key: 'VITE_DISABLE_CLERK', value: 'false' },
  { key: 'DISABLE_CLERK', value: 'false' },
  { key: 'VITE_CLERK_PUBLISHABLE_KEY', value: 'pk_live_REDACTED' },
  { key: 'CLERK_SECRET_KEY', value: 'sk_live_REDACTED' },
  { key: 'CLERK_WEBHOOK_SECRET', value: 'whsec_REDACTED' },
  { key: 'VITE_CLERK_DOMAIN', value: 'clerk.financeflo.ai' },
  { key: 'CLERK_ENVIRONMENT', value: 'production' }
];

async function updateEnvVars() {
  console.log('Updating Render environment variables...');

  for (const envVar of envVarsToUpdate) {
    const data = JSON.stringify([{
      key: envVar.key,
      value: envVar.value
    }]);

    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${SERVICE_ID}/env-vars`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${RENDER_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`SUCCESS: Updated ${envVar.key} = ${envVar.value.substring(0, 20)}...`);
            resolve();
          } else {
            console.log(`WARNING: ${envVar.key} - Status ${res.statusCode}`);
            resolve(); // Continue with other vars
          }
        });
      });

      req.on('error', (error) => {
        console.error(`ERROR updating ${envVar.key}:`, error.message);
        resolve(); // Continue with other vars
      });

      req.write(data);
      req.end();
    });

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\nEnvironment variables update complete!');
  console.log('Render will automatically redeploy with the new settings.');
}

updateEnvVars().catch(console.error);