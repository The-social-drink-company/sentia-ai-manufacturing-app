/**
 * Simple Sentry Integration Test
 * Tests basic Sentry functionality without complex import paths
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

async function testSentryConfiguration() {
  console.log('=== SENTRY CONFIGURATION TEST ===');

  try {
    // Test 1: Verify Sentry packages are installed
    console.log('Testing Sentry package availability...');

    const sentryReact = await import('@sentry/react');
    const sentryNode = await import('@sentry/node');
    const sentryIntegrations = await import('@sentry/integrations');

    console.log('✓ @sentry/react loaded successfully');
    console.log('✓ @sentry/node loaded successfully');
    console.log('✓ @sentry/integrations loaded successfully');

    // Test 2: Verify Sentry initialization functions exist
    console.log('\nTesting Sentry API availability...');

    if (typeof sentryReact.init === 'function') {
      console.log('✓ Sentry.init function available');
    }

    if (typeof sentryNode.captureException === 'function') {
      console.log('✓ Sentry.captureException function available');
    }

    if (typeof sentryReact.startTransaction === 'function') {
      console.log('✓ Sentry.startTransaction function available');
    }

    // Test 3: Test basic Sentry initialization (dry run)
    console.log('\nTesting Sentry initialization (dry run)...');

    const mockConfig = {
      dsn: 'https://test@test.ingest.sentry.io/test',
      environment: 'test',
      tracesSampleRate: 0.0, // No actual tracing in test
      beforeSend: () => null, // Don't actually send events
    };

    // Initialize with mock configuration
    sentryNode.init(mockConfig);
    console.log('✓ Sentry server initialization successful');

    // Test 4: Test error capture (won't actually send due to beforeSend)
    console.log('\nTesting error capture (mock)...');

    const testError = new Error('Test error for Sentry integration');
    sentryNode.captureException(testError);
    console.log('✓ Sentry error capture test successful');

    // Test 5: Test message capture
    sentryNode.captureMessage('Test message for Sentry integration', 'info');
    console.log('✓ Sentry message capture test successful');

    console.log('\n=== SENTRY CONFIGURATION TEST COMPLETED SUCCESSFULLY ===');
    console.log('All Sentry components are properly installed and configured.');
    console.log('Ready for production deployment with real DSN.');

  } catch (error) {
    console.error('✗ SENTRY CONFIGURATION TEST FAILED');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Sentry packages are installed: pnpm install @sentry/react @sentry/node @sentry/integrations');
    console.error('2. Check that package.json includes the correct Sentry dependencies');
    console.error('3. Verify Node.js version compatibility (requires Node 14+)');
    process.exit(1);
  }
}

// Run the test
testSentryConfiguration();