// Structured logging utility for production environment
const isProduction = import.meta.env.MODE === 'production';
const isDevelopment = import.meta.env.MODE === 'development';

// Development logger - only logs in development
export const devLog = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// Structured logging functions for production
export function logInfo(message, data = {}) {
  if (!isProduction || import.meta.env.VITE_ENABLE_LOGGING === 'true') {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
}

export function logWarn(message, data = {}) {
  console.warn(JSON.stringify({
    level: 'warn',
    message,
    timestamp: new Date().toISOString(),
    ...data
  }));
}

export function logError(message, error = null, data = {}) {
  const errorData = {
    level: 'error',
    message,
    timestamp: new Date().toISOString(),
    ...data
  };

  if (error) {
    errorData.error = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
  }

  console.error(JSON.stringify(errorData));
}

export function logDebug(message, data = {}) {
  if (isDevelopment) {
    console.debug(JSON.stringify({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
}

// Export default logger
export default {
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
  dev: devLog
};