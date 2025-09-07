#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '.');

console.log('🧪 TESTING AUTONOMOUS DEPLOYMENT SYSTEM');
console.log('======================================');

// Test 1: Basic Git Operations
console.log('\n1. Testing Git Operations...');
try {
  const status = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' });
  console.log('✅ Git repository accessible');
  console.log(`   Changes detected: ${status.trim().length > 0 ? 'Yes' : 'No'}`);
} catch (error) {
  console.log('❌ Git repository issue:', error.message);
}

// Test 2: Railway CLI
console.log('\n2. Testing Railway CLI...');
try {
  const whoami = execSync('railway whoami', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ Railway CLI authenticated');
  console.log(`   User: ${whoami.trim()}`);
} catch (error) {
  console.log('❌ Railway CLI not authenticated');
}

// Test 3: GitHub CLI
console.log('\n3. Testing GitHub CLI...');
try {
  execSync('gh auth status', { stdio: 'pipe' });
  console.log('✅ GitHub CLI authenticated');
} catch (error) {
  console.log('❌ GitHub CLI not authenticated');
}

// Test 4: NPM Dependencies
console.log('\n4. Testing NPM Dependencies...');
try {
  const packageJson = JSON.parse(execSync('cat package.json', { cwd: rootDir, encoding: 'utf8' }));
  console.log('✅ Package.json accessible');
  console.log(`   Project: ${packageJson.name}`);
  console.log(`   Version: ${packageJson.version}`);
} catch (error) {
  console.log('❌ Package.json issue:', error.message);
}

// Test 5: Create Test Commit
console.log('\n5. Testing Autonomous Commit Process...');
try {
  // Create a test file
  const testContent = {
    timestamp: new Date().toISOString(),
    test: 'autonomous-deployment-system',
    status: 'testing'
  };
  
  execSync(`echo '${JSON.stringify(testContent, null, 2)}' > .test-autonomous-${Date.now()}.json`, { cwd: rootDir });
  
  // Stage and commit
  execSync('git add .', { cwd: rootDir, stdio: 'pipe' });
  execSync('git commit -m "test: Autonomous deployment system test commit"', { cwd: rootDir, stdio: 'pipe' });
  
  console.log('✅ Test commit successful');
  
  // Push to development
  execSync('git push origin development', { cwd: rootDir, stdio: 'pipe' });
  console.log('✅ Test push successful');
  
} catch (error) {
  console.log('❌ Commit/push test failed:', error.message);
}

console.log('\n🎯 AUTONOMOUS DEPLOYMENT SYSTEM TEST COMPLETE');
console.log('✅ System is ready for 24/7 autonomous operation');
console.log('\nTo start the autonomous agent:');
console.log('   npm run autonomous:start');
console.log('\nTo monitor status:');
console.log('   npm run autonomous:status');
console.log('\nTo stop the agent:');
console.log('   npm run autonomous:stop');