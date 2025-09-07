#!/usr/bin/env node

/**
 * 24/7 Autonomous Testing Service Starter
 * Easy startup script for the continuous deployment system
 */

import serviceManager from './service-manager.js';

console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                      🤖 AUTONOMOUS TESTING SERVICE 24/7                      ║
║                                                                               ║
║  🚀 Continuous deployment every 10 minutes                                   ║
║  🔄 Auto-deployment to Railway branches:                                     ║
║     • development.up.railway.app                                             ║
║     • sentiatest.financeflo.ai                                               ║
║     • production.up.railway.app                                              ║
║                                                                               ║
║  💚 Self-healing test system                                                 ║
║  📊 Comprehensive monitoring                                                 ║
║  🛡️  Enterprise reliability                                                  ║
║                                                                               ║
║  Press Ctrl+C to stop the service                                            ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Starting 24/7 service...
`);

// The service manager is already started by importing it
console.log('✅ 24/7 Autonomous Testing Service is now running!');
console.log('📊 Monitor logs in tests/autonomous/logs/');
console.log('🔍 Check status with: npm run autonomous:status');