#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 STARTING ENTERPRISE AUTONOMOUS DEPLOYMENT AGENT');
console.log('==================================================');
console.log('🔄 Commits every 5 minutes automatically');
console.log('📤 Pushes to development branch');
console.log('🔀 Creates PRs to test and production branches');
console.log('🌐 Monitors all 3 Railway environments');
console.log('🏠 Monitors localhost:3000');
console.log('🛡️  Enterprise-grade error handling and recovery');
console.log('🕐 24/7 operation until you stop it');
console.log('');

// Start the autonomous agent
const agentScript = path.join(__dirname, 'scripts', 'autonomous-deployment-agent.js');
const agentProcess = spawn('node', [agentScript, 'start'], {
  stdio: 'inherit',
  cwd: __dirname
});

agentProcess.on('exit', (code) => {
  console.log(`\n🛑 Autonomous agent exited with code ${code}`);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Received stop signal. Stopping autonomous agent...');
  agentProcess.kill();
  process.exit(0);
});

console.log('✅ Autonomous agent started successfully!');
console.log('');
console.log('🎛️  CONTROLS:');
console.log('   Status:  npm run autonomous:status');
console.log('   Stop:    npm run autonomous:stop');
console.log('   Health:  npm run autonomous:health');
console.log('');
console.log('🚀 RAILWAY ENVIRONMENTS:');
console.log('   Development: https://daring-reflection-development.up.railway.app');
console.log('   Testing: https://sentia-manufacturing-dashboard-testing.up.railway.app');
console.log('   Production: https://web-production-1f10.up.railway.app');
console.log('');
console.log('⏰ Agent will perform deployments every 5 minutes starting now...');
console.log('📊 Watch the logs above for real-time deployment activity');
console.log('');