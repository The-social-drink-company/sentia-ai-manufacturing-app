/**
 * Browser-compatible logging utility for frontend code
 * Provides structured logging without Node.js dependencies
 */

/**
 * Log levels in priority order
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Get current log level from environment
 */
const getCurrentLogLevel = () => {
  const level = import.meta.env.VITE_LOG_LEVEL?.toLowerCase() || 'info';
  return LOG_LEVELS[level] ?? LOG_LEVELS.info;
};

/**
 * Check if logging should be enabled for a given level
 */
const shouldLog = (level) => {
  const currentLevel = getCurrentLogLevel();
  const targetLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  return targetLevel >= currentLevel;
};

/**
 * Create structured log entry
 */
const createLogEntry = (level, message, metadata = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: import.meta.env.MODE || 'development',
    url: window.location?.href,
    userAgent: navigator.userAgent,
    ...metadata
  };

  // Add correlation ID if available
  if (window.correlationId) {
    entry.correlationId = window.correlationId;
  }

  return entry;
};

/**
 * Send log to external service (if configured)
 */
const sendToLogService = async (entry) => {
  const logEndpoint = import.meta.env.VITE_LOG_ENDPOINT;
  if (!logEndpoint || import.meta.env.DEV) {
    return; // Skip external logging in development
  }

  try {
    await fetch(logEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry)
    });
  } catch (error) {
    // Silently fail - don't break the app for logging issues
    if (import.meta.env.DEV) {
      devLog.warn('Failed to send log to service:', error);
    }
  }
};

/**
 * Core logging function
 */
const log = (level, message, metadata = {}) => {
  if (!shouldLog(level)) {
    return;
  }

  const entry = createLogEntry(level, message, metadata);

  // Console output (always in development, structured in production)
  if (import.meta.env.DEV) {
    const consoleMethod = console[level] || console.log;
    consoleMethod(`[${level.toUpperCase()}] ${message}`, metadata);
  } else {
    devLog.log(JSON.stringify(entry));
  }

  // Send to external log service if configured
  sendToLogService(entry);
};

/**
 * Debug logging (development only)
 */
export const logDebug = (message, metadata = {}) => {
  log('debug', message, metadata);
};

/**
 * Info logging
 */
export const logInfo = (message, metadata = {}) => {
  log('info', message, metadata);
};

/**
 * Warning logging
 */
export const logWarn = (message, metadata = {}) => {
  log('warn', message, metadata);
};

/**
 * Error logging
 */
export const logError = (message, error = null, metadata = {}) => {
  const errorMeta = error ? {
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    }
  } : {};

  log('error', message, { ...errorMeta, ...metadata });
};

/**
 * Performance logging
 */
export const logPerformance = (operation, duration, metadata = {}) => {
  logInfo(`Performance: ${operation}`, {
    operation,
    duration,
    performanceEntry: true,
    ...metadata
  });
};

/**
 * User action logging
 */
export const logUserAction = (action, metadata = {}) => {
  logInfo(`User action: ${action}`, {
    action,
    userAction: true,
    ...metadata
  });
};

/**
 * API call logging
 */
export const logApiCall = (method, endpoint, duration, statusCode, error = null) => {
  const metadata = {
    method,
    endpoint,
    duration,
    statusCode,
    apiCall: true
  };

  if (error) {
    logError(`API call failed: ${method} ${endpoint}`, error, metadata);
  } else {
    logInfo(`API call: ${method} ${endpoint}`, metadata);
  }
};

/**
 * Component lifecycle logging (development only)
 */
export const logComponent = (component, lifecycle, props = {}) => {
  if (import.meta.env.DEV) {
    logDebug(`Component ${component} - ${lifecycle}`, {
      component,
      lifecycle,
      componentEvent: true,
      ...props
    });
  }
};

/**
 * Route navigation logging
 */
export const logNavigation = (from, to, metadata = {}) => {
  logInfo('Navigation', {
    from,
    to,
    navigation: true,
    ...metadata
  });
};

/**
 * Feature flag logging
 */
export const logFeatureFlag = (flag, enabled, metadata = {}) => {
  logDebug(`Feature flag: ${flag}`, {
    flag,
    enabled,
    featureFlag: true,
    ...metadata
  });
};

/**
 * Business event logging
 */
export const logBusinessEvent = (event, metadata = {}) => {
  logInfo(`Business event: ${event}`, {
    event,
    businessEvent: true,
    ...metadata
  });
};

/**
 * Set correlation ID for request tracking
 */
export const setCorrelationId = (correlationId) => {
  window.correlationId = correlationId;
};

/**
 * Get current correlation ID
 */
export const getCorrelationId = () => {
  return window.correlationId || null;
};

/**
 * Development-only logging utilities
 */
export const devLog = {
  log: (...args) => {
    if (import.meta.env.DEV) {
      devLog.log('[DEV]', ...args);
    }
  },
  warn: (...args) => {
    if (import.meta.env.DEV) {
      devLog.warn('[DEV]', ...args);
    }
  },
  error: (...args) => {
    if (import.meta.env.DEV) {
      devLog.error('[DEV]', ...args);
    }
  },
  table: (data) => {
    if (import.meta.env.DEV) {
      console.table(data);
    }
  },
  group: (label) => {
    if (import.meta.env.DEV) {
      console.group(`[DEV] ${label}`);
    }
  },
  groupEnd: () => {
    if (import.meta.env.DEV) {
      console.groupEnd();
    }
  }
};

export default {
  logDebug,
  logInfo,
  logWarn,
  logError,
  logPerformance,
  logUserAction,
  logApiCall,
  logComponent,
  logNavigation,
  logFeatureFlag,
  logBusinessEvent,
  setCorrelationId,
  getCorrelationId,
  devLog
};
