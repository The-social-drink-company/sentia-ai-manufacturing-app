// CommonJS wrapper for logger.js
const path = require('path');

// Create a simple logger that mimics winston interface
const logger = {
  info: (message, ...args) => console.log('[INFO]', message, ...args),
  warn: (message, ...args) => console.warn('[WARN]', message, ...args),
  error: (message, ...args) => console.error('[ERROR]', message, ...args),
  debug: (message, ...args) => console.debug('[DEBUG]', message, ...args)
};

module.exports = {
  logger,
  logInfo: logger.info,
  logWarn: logger.warn,
  logError: logger.error,
  logDebug: logger.debug
};