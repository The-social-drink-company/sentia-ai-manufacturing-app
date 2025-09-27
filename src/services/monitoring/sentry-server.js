import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { createLogger } from '../logger/enterprise-logger.js';

const logger = createLogger('SentryServer');

/**
 * Enterprise Sentry Configuration for Backend/Server
 * Provides comprehensive error tracking, performance monitoring,
 * and profiling for Node.js manufacturing backend
 */

export const initializeSentryServer = () => {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Server Sentry initialization skipped in development environment');
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.warn('Server Sentry DSN not configured, monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,

    // Environment configuration
    environment: process.env.NODE_ENV || 'production',
    release: process.env.APP_VERSION || '1.0.0',

    // Performance monitoring and profiling
    integrations: [
      // Profiling integration for performance insights
      nodeProfilingIntegration(),
    ],

    // Sample rates
    tracesSampleRate: 0.1, // 10% of transactions
    profilesSampleRate: 0.1, // 10% of transactions for profiling

    // Server-specific configuration
    serverName: process.env.SERVER_NAME || 'sentia-manufacturing-server',

    // Error filtering and processing
    beforeSend(event, hint) {
      // Filter sensitive data from manufacturing operations
      if (event.request?.headers) {
        // Remove sensitive headers
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-api-key'];
      }

      // Filter out common server false positives
      if (event.exception?.values?.[0]?.type === 'AbortError') {
        // Client disconnections are normal
        return null;
      }

      // Add manufacturing server context
      event.tags = {
        ...event.tags,
        component: 'manufacturing-server',
        deployment: process.env.DEPLOYMENT_STAGE || 'production',
        nodeVersion: process.version
      };

      logger.info('Server Sentry error captured', {
        eventId: event.event_id,
        level: event.level,
        message: event.message,
        request: event.request?.url
      });

      return event;
    },

    // Initial scope for server context
    initialScope: {
      tags: {
        component: 'sentia-manufacturing-backend',
        version: process.env.APP_VERSION || '1.0.0',
        platform: process.platform,
        nodeVersion: process.version
      }
    }
  });

  logger.info('Server Sentry monitoring initialized', {
    environment: process.env.NODE_ENV,
    release: process.env.APP_VERSION,
    serverName: process.env.SERVER_NAME
  });
};

/**
 * Express middleware for Sentry request handling
 */
export const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler({
    ip: true, // Include IP address
    request: ['method', 'url', 'headers'], // Request data to capture
    user: ['id', 'email', 'role'] // User data to capture
  });
};

/**
 * Express middleware for Sentry error handling
 */
export const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Always capture 5xx errors
      if (error.status >= 500) {
        return true;
      }

      // Capture specific manufacturing errors
      if (error.code && error.code.startsWith('MFG')) {
        return true;
      }

      return false;
    }
  });
};

/**
 * Set manufacturing operation context
 */
export const setSentryOperationContext = (operation, module, metadata = {}) => {
  Sentry.setContext('manufacturing_operation', {
    operation,
    module,
    timestamp: new Date().toISOString(),
    ...metadata
  });

  logger.info('Server Sentry operation context updated', {
    operation,
    module,
    metadata
  });
};

/**
 * Capture manufacturing-specific exception
 */
export const captureManufacturingException = (error, context = _{}) => {
  Sentry.withScope(scope => {
    // Add manufacturing context
    scope.setTag('manufacturing_module', context.module || 'unknown');
    scope.setTag('operation_type', context.operationType || 'unknown');
    scope.setLevel(context.level || 'error');

    // Add manufacturing-specific extra data
    if (context.jobId) {
      scope.setExtra('jobId', context.jobId);
    }
    if (context.workstationId) {
      scope.setExtra('workstationId', context.workstationId);
    }
    if (context.productionLine) {
      scope.setExtra('productionLine', context.productionLine);
    }

    Sentry.captureException(error);
  });

  logger.error('Manufacturing exception captured by Server Sentry', error, context);
};

/**
 * Capture manufacturing performance metrics
 */
export const capturePerformanceMetric = (_metricName, _value, unit = 'ms', context = _{}) => {
  Sentry.withScope(scope => {
    scope.setTag('metric_type', 'performance');
    scope.setTag('manufacturing_module', context.module || 'unknown');

    scope.setExtra('metric_name', metricName);
    scope.setExtra('metric_value', value);
    scope.setExtra('metric_unit', unit);

    Sentry.captureMessage(`Performance Metric: ${metricName}`, 'info');
  });

  logger.info('Performance metric captured by Server Sentry', {
    metricName,
    value,
    unit,
    context
  });
};

/**
 * Start server transaction for manufacturing API operations
 */
export const startServerTransaction = (_name, operation = 'manufacturing_api') => {
  const transaction = Sentry.startTransaction({
    name,
    op: operation,
    tags: {
      component: 'manufacturing-server',
      environment: process.env.NODE_ENV
    }
  });

  logger.info('Server Sentry transaction started', {
    name,
    operation,
    transactionId: transaction.traceId
  });

  return transaction;
};

/**
 * Monitor database operations
 */
export const monitorDatabaseOperation = (_operationName, queryType = 'read') => {
  return Sentry.startTransaction({
    name: `db.${operationName}`,
    op: 'db.query',
    tags: {
      'db.type': 'postgresql',
      'db.operation': queryType,
      component: 'manufacturing-database'
    }
  });
};

/**
 * Monitor external API calls
 */
export const monitorExternalAPI = (apiName, _endpoint) => {
  return Sentry.startTransaction({
    name: `api.${apiName}`,
    op: 'http.client',
    tags: {
      'api.name': apiName,
      'api.endpoint': endpoint,
      component: 'external-integration'
    }
  });
};

export default {
  initializeSentryServer,
  sentryRequestHandler,
  sentryErrorHandler,
  setSentryOperationContext,
  captureManufacturingException,
  capturePerformanceMetric,
  startServerTransaction,
  monitorDatabaseOperation,
  monitorExternalAPI
};