// Sentry Error Tracking Configuration
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole } from '@sentry/integrations';
import { Replay } from '@sentry/replay';

export const initSentry = () => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENV || 'production',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
        tracingOrigins: [
          'localhost',
          /^https:\/\/.*\.sentia-manufacturing\.com/,
          /^https:\/\/api\.sentia-manufacturing\.com/
        ]
      }),
      new CaptureConsole({
        levels: ['error', 'warn']
      }),
      new Replay({
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
        sampling: {
          session: 0.1,
          error: 1.0
        }
      })
    ],

    // Performance Configuration
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Error Filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      
      // Ignore network errors in development
      if (!import.meta.env.PROD && error?.message?.includes('Network')) {
        return null;
      }

      // Ignore browser extension errors
      if (error?.message?.match(/extension:|chrome-extension:|moz-extension:/)) {
        return null;
      }

      // Add user context
      const user = getCurrentUser();
      if (user) {
        event.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        };
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          version: import.meta.env.VITE_APP_VERSION,
          build: import.meta.env.VITE_BUILD_ID,
          environment: import.meta.env.VITE_ENV
        }
      };

      return event;
    },

    // Breadcrumb Configuration
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }

      // Add custom data to navigation breadcrumbs
      if (breadcrumb.category === 'navigation') {
        breadcrumb.data = {
          ...breadcrumb.data,
          timestamp: new Date().toISOString()
        };
      }

      return breadcrumb;
    },

    // Auto Session Tracking
    autoSessionTracking: true,

    // Release Health
    attachStacktrace: true,
    normalizeDepth: 5
  });

  // Configure scope
  Sentry.configureScope((scope) => {
    scope.setTag('app.name', 'sentia-dashboard');
    scope.setTag('app.type', 'spa');
    scope.setLevel('error');
  });
};

// Custom error boundary
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Performance monitoring utilities
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op });
};

export const measurePerformance = (name: string, fn: () => any) => {
  const transaction = startTransaction(name, 'function');
  try {
    const result = fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
};

// User identification
export const identifyUser = (user: any) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  });
};

// Custom error reporting
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureException(error);
  });
};

// Feature flag tracking
export const trackFeatureFlag = (flag: string, value: boolean) => {
  Sentry.addBreadcrumb({
    category: 'feature-flag',
    message: `Feature flag ${flag} is ${value ? 'enabled' : 'disabled'}`,
    level: 'info',
    data: { flag, value }
  });
};

// Business metric tracking
export const trackBusinessMetric = (metric: string, value: number, tags?: Record<string, string>) => {
  Sentry.addBreadcrumb({
    category: 'business-metric',
    message: `${metric}: ${value}`,
    level: 'info',
    data: { metric, value, ...tags }
  });
};

// Helper function to get current user
function getCurrentUser() {
  // This should be replaced with actual user retrieval logic
  return {
    id: localStorage.getItem('userId'),
    email: localStorage.getItem('userEmail'),
    username: localStorage.getItem('username'),
    role: localStorage.getItem('userRole')
  };
}