import { captureException, captureMessage, startTransaction } from '@/services/monitoring/sentry-config.js';
import { captureManufacturingException, capturePerformanceMetric } from '@/services/monitoring/sentry-server.js';
import { logger } from '@/services/logger/enterprise-logger.js';

/**
 * Test Sentry Integration
 * Verifies that error tracking and performance monitoring work correctly
 */

export const testSentryIntegration = () => {
  logger.info('Testing Sentry integration...');

  // Test 1: Basic message capture
  try {
    captureMessage('Sentry integration test message', 'info', {
      module: 'test',
      extra: {
        testType: 'integration',
        timestamp: new Date().toISOString()
      }
    });
    logger.info('Sentry message capture test completed');
  } catch (error) {
    logger.error('Sentry message capture test failed', error);
  }

  // Test 2: Exception capture
  try {
    const testError = new Error('Test error for Sentry integration');
    captureException(testError, {
      module: 'test',
      operation: 'sentry_test',
      level: 'error',
      extra: {
        testType: 'exception',
        expected: true
      }
    });
    logger.info('Sentry exception capture test completed');
  } catch (error) {
    logger.error('Sentry exception capture test failed', error);
  }

  // Test 3: Performance monitoring
  try {
    const transaction = startTransaction('test_operation', 'test');

    // Simulate some work
    setTimeout(() => {
      transaction.finish();
      logger.info('Sentry performance monitoring test completed');
    }, 100);
  } catch (error) {
    logger.error('Sentry performance monitoring test failed', error);
  }

  logger.info('Sentry integration test suite completed');
};

// Manufacturing-specific test for server environments
export const testSentryManufacturingIntegration = () => {
  if (typeof window !== 'undefined') {
    logger.warn('Manufacturing Sentry test skipped - not in server environment');
    return;
  }

  logger.info('Testing Sentry manufacturing integration...');

  try {
    // Test manufacturing exception
    const manufacturingError = new Error('Test manufacturing error');
    captureManufacturingException(manufacturingError, {
      module: 'production',
      operationType: 'quality_check',
      jobId: 'TEST-001',
      workstationId: 'WS-001',
      productionLine: 'LINE-A'
    });

    // Test performance metric
    capturePerformanceMetric('test_operation_time', 250, 'ms', {
      module: 'production'
    });

    logger.info('Sentry manufacturing integration test completed');
  } catch (error) {
    logger.error('Sentry manufacturing integration test failed', error);
  }
};

// Automated test runner
export const runSentryTests = () => {
  logger.info('Starting comprehensive Sentry test suite...');

  testSentryIntegration();

  // Run server tests only in Node.js environment
  if (typeof window === 'undefined') {
    testSentryManufacturingIntegration();
  }

  logger.info('Sentry test suite completed successfully');
};

export default {
  testSentryIntegration,
  testSentryManufacturingIntegration,
  runSentryTests
};