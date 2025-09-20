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

// Use minimal-server.js for fast, reliable startup on Render
console.log('Starting minimal-server.js for optimized production deployment...');
import('./minimal-server.js');