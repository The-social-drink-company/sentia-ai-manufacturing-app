#!/usr/bin/env node

/**
 * PRODUCTION SERVER STARTUP
 * Clean production deployment without any test components
 */

console.log('='.repeat(70));
console.log('SENTIA MANUFACTURING - PRODUCTION SERVER');
console.log('='.repeat(70));
console.log('Starting time:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('='.repeat(70));

// CRITICAL: Force disable all testing components
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.DISABLE_AUTONOMOUS_TESTING = 'true';
process.env.ENABLE_AUTONOMOUS_TESTING = 'false';
process.env.AUTO_FIX_ENABLED = 'false';
process.env.AUTO_DEPLOY_ENABLED = 'false';
process.env.SKIP_ENTERPRISE_INIT = 'true';

// Disable MCP mode for main server
process.env.MCP_SERVER_MODE = 'false';

console.log('Security settings applied:');
console.log('- Autonomous testing: DISABLED');
console.log('- Auto-fix: DISABLED');
console.log('- Auto-deploy: DISABLED');
console.log('- Test data factory: DISABLED');
console.log('='.repeat(70));

// Start the main server
import('./server.js').then(() => {
  console.log('Server started successfully');
}).catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});