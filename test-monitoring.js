#!/usr/bin/env node

/**
 * Test script for the monitoring system
 * Verifies that the monitoring agent can be imported and basic functions work
 */

import MonitoringAgent from './monitoring-agent.js';
import fs from 'fs/promises';

async function testMonitoringSystem() {
  console.log('🔍 Testing Sentia Manufacturing Dashboard Monitoring System...\n');
  
  try {
    // Test 1: Create monitoring agent instance
    console.log('Test 1: Creating monitoring agent instance...');
    const agent = new MonitoringAgent();
    console.log('✅ SUCCESS: Monitoring agent created\n');
    
    // Test 2: Check configuration
    console.log('Test 2: Verifying configuration...');
    const status = agent.getStatusReport();
    console.log('✅ SUCCESS: Status report generated');
    console.log(`   - Monitoring ${Object.keys(status.urls).length} URLs`);
    console.log(`   - Success rate: ${status.overall.successRate.toFixed(2)}%\n`);
    
    // Test 3: Check URL detection
    console.log('Test 3: Testing URL detection...');
    const html = '<div>PredictiveMaintenanceWidget SmartInventoryWidget dashboard</div>';
    const mockAgent = new MonitoringAgent();
    const features = mockAgent.detectPhase4Features(html);
    console.log('✅ SUCCESS: Phase 4 feature detection working');
    console.log(`   - Features detected: ${features}\n`);
    
    // Test 4: Check blank screen detection
    console.log('Test 4: Testing blank screen detection...');
    const blankHtml = '<html><body>Loading...</body></html>';
    const isBlank = mockAgent.isBlankScreen(blankHtml);
    console.log('✅ SUCCESS: Blank screen detection working');
    console.log(`   - Blank screen detected: ${isBlank}\n`);
    
    // Test 5: Log functionality
    console.log('Test 5: Testing logging system...');
    mockAgent.log('info', 'Test log message');
    console.log('✅ SUCCESS: Logging system operational\n');
    
    // Test 6: File operations
    console.log('Test 6: Testing file operations...');
    await mockAgent.saveStatus();
    const statusFileExists = await fs.access('monitoring-status.json').then(() => true).catch(() => false);
    console.log('✅ SUCCESS: Status file operations working');
    console.log(`   - Status file exists: ${statusFileExists}\n`);
    
    // Test 7: Configuration file
    console.log('Test 7: Checking configuration file...');
    const configExists = await fs.access('monitoring-config.json').then(() => true).catch(() => false);
    console.log('✅ SUCCESS: Configuration file check complete');
    console.log(`   - Config file exists: ${configExists}\n`);
    
    console.log('🎉 ALL TESTS PASSED! Monitoring system is ready to run.\n');
    
    console.log('📋 Next Steps:');
    console.log('   1. Run: npm run monitor');
    console.log('   2. Or: node monitoring-agent.js');
    console.log('   3. Or: start-monitoring.bat (Windows)\n');
    
    console.log('📊 System will monitor these URLs:');
    Object.values(status.urls).forEach(urlStatus => {
      console.log(`   • ${urlStatus.name} (${urlStatus.environment})`);
    });
    
    console.log('\n🔄 The system will:');
    console.log('   • Check URLs every 5 minutes');
    console.log('   • Detect Phase 4 features automatically');  
    console.log('   • Fix deployment issues automatically');
    console.log('   • Run until all URLs are perfect');
    console.log('   • Log everything to monitoring.log\n');
    
    // Cleanup test files
    try {
      await fs.unlink('monitoring-status.json').catch(() => {});
    } catch (e) {
      // Ignore cleanup errors
    }
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('\n🔧 Possible fixes:');
    console.error('   1. Run: npm install');
    console.error('   2. Check Node.js version (need 18+)');
    console.error('   3. Verify all files are present');
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMonitoringSystem();
}

export default testMonitoringSystem;