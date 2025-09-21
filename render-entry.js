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

// Use the FULL ENTERPRISE server.js - not a minimal version!
console.log('Starting FULL ENTERPRISE SERVER.JS with all features...');
console.log('Loading complete Sentia Manufacturing Dashboard with:');
console.log('- Full Clerk Authentication');
console.log('- Complete API integrations (Xero, Shopify, Unleashed)');
console.log('- AI/ML features via MCP Server');
console.log('- Enterprise sidebar navigation');
console.log('- All dashboard pages and features');
import('./server.js');