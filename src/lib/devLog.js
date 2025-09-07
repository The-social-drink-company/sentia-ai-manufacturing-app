/**
 * Development-only logging utility
 * Provides console logging that's automatically disabled in production
 * Use this for debugging that should never reach production builds
 */

/**
 * Get environment mode for browser or Node.js context
 * @returns {string} Environment mode
 */
const getEnvironmentMode = () => {
  try {
    // Browser environment (Vite) - check for import.meta
    if (typeof window !== 'undefined' && import.meta && import.meta.env) {
      return import.meta.env.MODE;
    }
  } catch (e) {
    // Fallback if import.meta is not available
  }
  
  // Node.js environment fallback
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV;
  }
  
  return 'production'; // Safe default
};

/**
 * Environment-aware development logger
 * Only logs in development environment, silent in production
 */
export const devLog = {
  /**
   * Development-only console.log
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (getEnvironmentMode() === 'development') {
      devLog.log('[DEV]', ...args);
    }
  },

  /**
   * Development-only console.info
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (getEnvironmentMode() === 'development') {
      devLog.log('[DEV]', ...args);
    }
  },

  /**
   * Development-only console.warn
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (getEnvironmentMode() === 'development') {
      devLog.warn('[DEV]', ...args);
    }
  },

  /**
   * Development-only console.error
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    if (getEnvironmentMode() === 'development') {
      devLog.error('[DEV]', ...args);
    }
  },

  /**
   * Development-only console.debug
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (getEnvironmentMode() === 'development') {
      console.debug('[DEV]', ...args);
    }
  },

  /**
   * Development-only table logging
   * @param {any} data - Data to display in table format
   */
  table: (data) => {
    if (getEnvironmentMode() === 'development') {
      console.table(data);
    }
  },

  /**
   * Development-only group logging
   * @param {string} label - Group label
   */
  group: (label) => {
    if (getEnvironmentMode() === 'development') {
      console.group(`[DEV] ${label}`);
    }
  },

  /**
   * Development-only group end
   */
  groupEnd: () => {
    if (getEnvironmentMode() === 'development') {
      console.groupEnd();
    }
  },

  /**
   * Development-only time tracking
   * @param {string} label - Timer label
   */
  time: (label) => {
    if (getEnvironmentMode() === 'development') {
      console.time(`[DEV] ${label}`);
    }
  },

  /**
   * Development-only time end
   * @param {string} label - Timer label
   */
  timeEnd: (label) => {
    if (getEnvironmentMode() === 'development') {
      console.timeEnd(`[DEV] ${label}`);
    }
  },

  /**
   * Development-only component lifecycle logging
   * @param {string} component - Component name
   * @param {string} lifecycle - Lifecycle event (mount, unmount, update)
   * @param {Object} props - Component props/data
   */
  component: (component, lifecycle, props = {}) => {
    if (getEnvironmentMode() === 'development') {
      devLog.log(`[DEV] ${component} - ${lifecycle}`, props);
    }
  },

  /**
   * Development-only API call logging
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request/response data
   */
  api: (method, endpoint, data = {}) => {
    if (getEnvironmentMode() === 'development') {
      devLog.log(`[DEV] API ${method} ${endpoint}`, data);
    }
  },

  /**
   * Development-only state change logging
   * @param {string} state - State name
   * @param {any} oldValue - Previous value
   * @param {any} newValue - New value
   */
  stateChange: (state, oldValue, newValue) => {
    if (getEnvironmentMode() === 'development') {
      devLog.log(`[DEV] State: ${state}`, {
        from: oldValue,
        to: newValue
      });
    }
  }
};

/**
 * Get environment variable for browser or Node.js context
 * @param {string} key - Environment variable key
 * @returns {string} Environment variable value
 */
const getEnvironmentVariable = (key) => {
  try {
    // Browser environment (Vite)
    if (typeof window !== 'undefined' && import.meta && import.meta.env) {
      return import.meta.env[key];
    }
  } catch (e) {
    // Fallback if import.meta is not available
  }
  
  // Node.js environment fallback
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  return undefined;
};

/**
 * Conditional console logging based on feature flags
 * @param {string} feature - Feature flag name
 * @returns {Object} Conditional logger
 */
export const featureLog = (feature) => ({
  log: (...args) => {
    if (getEnvironmentMode() === 'development' && getEnvironmentVariable(`FEATURE_DEBUG_${feature.toUpperCase()}`) === 'true') {
      devLog.log(`[${feature}]`, ...args);
    }
  },
  warn: (...args) => {
    if (getEnvironmentMode() === 'development' && getEnvironmentVariable(`FEATURE_DEBUG_${feature.toUpperCase()}`) === 'true') {
      devLog.warn(`[${feature}]`, ...args);
    }
  },
  error: (...args) => {
    if (getEnvironmentMode() === 'development' && getEnvironmentVariable(`FEATURE_DEBUG_${feature.toUpperCase()}`) === 'true') {
      devLog.error(`[${feature}]`, ...args);
    }
  }
});

export default devLog;
