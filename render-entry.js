#!/usr/bin/env node

/**
 * RENDER ENTRY POINT
 * Ensures the correct server is started for Render deployment
 */

console.log('='.repeat(70));
console.log('RENDER ENTRY POINT - ROUTING TO CORRECT SERVER');
console.log('='.repeat(70));
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Service:', process.env.RENDER_SERVICE_NAME || 'unknown');
console.log('Port:', process.env.PORT || 5000);
console.log('='.repeat(70));

// Check environment and choose appropriate server
const isProduction = process.env.NODE_ENV === 'production';
const serviceName = process.env.RENDER_SERVICE_NAME || '';

if (isProduction || serviceName.includes('production')) {
  console.log('Starting PRODUCTION EMERGENCY SERVER - Ensuring operational status...');
  import('./production-emergency-server.js');
} else {
  console.log('Starting ULTRA-MINIMAL SERVER - No dependencies, instant startup...');
  import('./render-ultra-minimal.js');
}