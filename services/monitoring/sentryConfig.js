/**
 * Sentry Error Monitoring Configuration
 * Enterprise-grade error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole } from '@sentry/integrations';

/**
 * Initialize Sentry for React application
 */
export const initSentry = (app) => {
  const environment = process.env.NODE_ENV || 'development';
  const dsn = process.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      new BrowserTracing({
        // Set sampling rates
        tracingOrigins: [
          'localhost',
          /^https:\/\/.*\.railway\.app/,
          /^https:\/\/sentia-manufacturing/
        ],
        // Performance Monitoring
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      new CaptureConsole({
        levels: ['error', 'warn'] // Only capture errors and warnings
      }),
      new Sentry.Replay({
        // Session Replay for debugging
        maskAllText: false,
        blockAllMedia: false,
        sampleRate: environment === 'production' ? 0.1 : 1.0,
        errorSampleRate: 1.0
      })
    ],
    
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Release Tracking
    release: process.env.VITE_APP_VERSION || '1.0.0',
    
    // Session Tracking
    autoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    
    // Filtering
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Ignore network errors that are expected
        if (error?.message?.includes('Network request failed')) {
          return null;
        }
        
        // Ignore cancelled requests
        if (error?.name === 'AbortError') {
          return null;
        }
        
        // Add user context
        if (window.currentUser) {
          event.user = {
            id: window.currentUser.id,
            email: window.currentUser.email,
            username: window.currentUser.username
          };
        }
        
        // Add custom context
        event.contexts = {
          ...event.contexts,
          app: {
            version: process.env.VITE_APP_VERSION,
            environment,
            deployment: process.env.VITE_DEPLOYMENT_ID
          }
        };
      }
      
      return event;
    },
    
    // Breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      
      // Add more context to navigation breadcrumbs
      if (breadcrumb.category === 'navigation') {
        breadcrumb.data = {
          ...breadcrumb.data,
          timestamp: new Date().toISOString()
        };
      }
      
      return breadcrumb;
    },
    
    // Error boundaries
    errorBoundaryOptions: {
      showDialog: environment !== 'production',
      dialogOptions: {
        title: 'An error occurred',
        subtitle: 'Our team has been notified',
        subtitle2: 'If you\'d like to help, tell us what happened below.',
        labelName: 'Name',
        labelEmail: 'Email',
        labelComments: 'What happened?',
        labelClose: 'Close',
        labelSubmit: 'Submit',
        errorGeneric: 'An unknown error occurred while submitting your report. Please try again.',
        errorFormEntry: 'Some fields were invalid. Please correct the errors and try again.',
        successMessage: 'Your feedback has been sent. Thank you!'
      }
    }
  });

  // Set initial user context
  if (window.currentUser) {
    Sentry.setUser({
      id: window.currentUser.id,
      email: window.currentUser.email,
      username: window.currentUser.username
    });
  }

  // Log initialization
  console.log(`Sentry initialized for ${environment} environment`);
};

/**
 * Sentry Error Boundary Component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Sentry Profiler Component for performance monitoring
 */
export const SentryProfiler = Sentry.Profiler;

/**
 * Custom error capture with additional context
 */
export const captureError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    // Add custom context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Add tags for filtering
    scope.setTag('error.handled', true);
    scope.setTag('component', context.component || 'unknown');
    
    // Add breadcrumb
    scope.addBreadcrumb({
      message: `Error in ${context.component || 'unknown component'}`,
      level: 'error',
      data: context
    });
    
    // Capture the error
    Sentry.captureException(error);
  });
};

/**
 * Performance transaction monitoring
 */
export const measurePerformance = (name, operation) => {
  const transaction = Sentry.startTransaction({
    op: 'function',
    name,
    data: {
      startTime: Date.now()
    }
  });

  Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));

  try {
    const result = operation();
    
    if (result instanceof Promise) {
      return result
        .then(res => {
          transaction.setStatus('ok');
          return res;
        })
        .catch(err => {
          transaction.setStatus('internal_error');
          throw err;
        })
        .finally(() => {
          transaction.finish();
        });
    } else {
      transaction.setStatus('ok');
      transaction.finish();
      return result;
    }
  } catch (error) {
    transaction.setStatus('internal_error');
    transaction.finish();
    throw error;
  }
};

/**
 * Custom metrics tracking
 */
export const trackMetric = (name, value, unit = 'none', tags = {}) => {
  Sentry.metrics.increment(name, value, { 
    unit,
    tags: {
      ...tags,
      environment: process.env.NODE_ENV
    }
  });
};

/**
 * User feedback widget
 */
export const showUserFeedback = (options = {}) => {
  const user = Sentry.getCurrentHub().getScope().getUser();
  
  Sentry.showReportDialog({
    ...options,
    user: user || {
      email: '',
      name: ''
    }
  });
};

/**
 * Add custom breadcrumb
 */
export const addBreadcrumb = (message, category = 'custom', level = 'info', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: {
      ...data,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Set user context
 */
export const setUserContext = (user) => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      subscription: user.subscription,
      role: user.role
    });
    
    // Store for future use
    window.currentUser = user;
  } else {
    Sentry.setUser(null);
    window.currentUser = null;
  }
};

/**
 * Set custom tags for filtering
 */
export const setTags = (tags) => {
  Sentry.configureScope((scope) => {
    Object.keys(tags).forEach(key => {
      scope.setTag(key, tags[key]);
    });
  });
};

/**
 * Monitor API calls
 */
export const monitorAPI = async (url, options = {}) => {
  const transaction = Sentry.startTransaction({
    op: 'http.client',
    name: `${options.method || 'GET'} ${url}`,
    data: {
      url,
      method: options.method || 'GET'
    }
  });

  try {
    const response = await fetch(url, options);
    
    transaction.setHttpStatus(response.status);
    
    if (!response.ok) {
      transaction.setStatus('http_error');
      
      if (response.status >= 500) {
        Sentry.captureMessage(`API Error: ${response.status} ${url}`, 'error');
      }
    } else {
      transaction.setStatus('ok');
    }
    
    return response;
  } catch (error) {
    transaction.setStatus('network_error');
    Sentry.captureException(error);
    throw error;
  } finally {
    transaction.finish();
  }
};

/**
 * React Router integration
 */
import { useLocation, useNavigationType } from 'react-router-dom';
import { createRoutesFromChildren, matchRoutes } from 'react-router';
import React from 'react';

export const SentryRoutes = Sentry.withSentryRouting(Routes);

/**
 * Export all monitoring utilities
 */
export default {
  initSentry,
  SentryErrorBoundary,
  SentryProfiler,
  captureError,
  measurePerformance,
  trackMetric,
  showUserFeedback,
  addBreadcrumb,
  setUserContext,
  setTags,
  monitorAPI,
  SentryRoutes
};