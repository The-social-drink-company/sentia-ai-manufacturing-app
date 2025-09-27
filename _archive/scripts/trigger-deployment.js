#!/usr/bin/env node

/**
 * Deployment Trigger Script
 * Forces a new deployment by making a small change to trigger Render's build process
 */

console.log('🚀 Triggering new deployment...');
console.log('Timestamp:', new Date().toISOString());
console.log('Build hash should be: index-D4EDaX83.js');
console.log('Current deployed hash: index-BAxjyLSZ.js');
console.log('This change will trigger a new Render deployment.');

// This file serves as a deployment trigger
// Any change to the repository will cause Render to rebuild and redeploy
