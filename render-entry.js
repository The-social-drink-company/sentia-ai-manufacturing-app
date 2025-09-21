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

// ALWAYS use server-fixed.js which has the correct Clerk authentication fix
console.log('Starting SERVER-FIXED.JS with Clerk authentication fix...');
console.log('This server has health check BEFORE authentication middleware');
import('./server-fixed.js');