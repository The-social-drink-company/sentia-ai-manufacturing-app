import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/integrations';
import logger from '../logger/enterprise-logger.js';

/**
 * Enterprise Sentry Configuration for Frontend
 * Provides comprehensive error tracking, performance monitoring,
 * and user session recording for production environments
 */

export const initializeSentry = () => {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Sentry initialization skipped in development environment');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    logger.warn('Sentry DSN not configured, monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,

    // Environment configuration
    environment: import.meta.env.VITE_NODE_ENV || 'production',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Performance monitoring
    integrations: [
      new BrowserTracing({
        // Trace navigation and user interactions
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),

        // Monitor performance for key manufacturing operations
        tracePropagationTargets: [
          'localhost',
          /^https://sentia-manufacturing-/,
          /^https:\/\/.*\.onrender\.com$/,
          /^https:\/\/.*\.financeflo\.ai$/
        ],
      }),
    ],

    // Sample rates for performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session recording for debugging
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions

    // Error filtering and processing
    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.request?.url) {
        // Remove query parameters that might contain sensitive data
        event.request.url = event.request.url.split('?')[0];
      }

      // Filter out common false positives
      if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
        // Chunk load errors are usually due to deployment updates
        return null;
      }

      // Add manufacturing context
      event.tags = {
        ...event.tags,
        component: 'manufacturing-dashboard',
        deployment: import.meta.env.VITE_DEPLOYMENT_STAGE || 'production'
      };

      logger.info('Sentry error captured', {
        eventId: event.event_id,
        level: event.level,
        message: event.message
      });

      return event;
    },

    // User context configuration
    initialScope: {
      tags: {
        component: 'sentia-manufacturing-frontend',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0'
      }
    }
  });

  logger.info('Sentry monitoring initialized for frontend', {
    environment: import.meta.env.VITE_NODE_ENV,
    release: import.meta.env.VITE_APP_VERSION
  });
};

/**
 * Set user context for Sentry tracking
 */
export const setSentryUser = (user) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
    organization: user.organization
  });

  logger.info('Sentry user context updated', {
    userId: user.id,
    role: user.role
  });
};

/**
 * Add manufacturing operation context
 */
export const setSentryContext = (context) => {
  Sentry.setContext('manufacturing', context);

  logger.info('Sentry manufacturing context updated', {
    operation: context.operation,
    module: context.module
  });
};

/**
 * Manually capture exception with manufacturing context
 */
export const captureException = (error, context = _{}) => {
  Sentry.withScope(scope => {
    // Add manufacturing-specific context
    scope.setTag('module', context.module || 'unknown');
    scope.setTag('operation', context.operation || 'unknown');
    scope.setLevel(context.level || 'error');

    // Add extra context
    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra[key]);
      });
    }

    Sentry.captureException(error);
  });

  logger.error('Exception captured by Sentry', error, context);
};

/**
 * Capture custom message for manufacturing events
 */
export const captureMessage = (message, level = 'info', context = _{}) => {
  Sentry.withScope(scope => {
    scope.setLevel(level);
    scope.setTag('module', context.module || 'unknown');

    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra[key]);
      });
    }

    Sentry.captureMessage(message);
  });

  logger.info('Message captured by Sentry', {
    message,
    level,
    context
  });
};

/**
 * Start performance transaction for manufacturing operations
 */
export const startTransaction = (_name, operation = 'manufacturing') => {
  const transaction = Sentry.startTransaction({
    name,
    op: operation,
    tags: {
      component: 'manufacturing-dashboard'
    }
  });

  logger.info('Sentry transaction started', {
    name,
    operation,
    transactionId: transaction.traceId
  });

  return transaction;
};

export default {
  initializeSentry,
  setSentryUser,
  setSentryContext,
  captureException,
  captureMessage,
  startTransaction
};