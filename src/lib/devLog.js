/**
 * Development logging utility
 * Only logs in development mode
 */

export const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV]', ...args);
  }
};

export const devWarn = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DEV WARNING]', ...args);
  }
};

export const devError = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('[DEV ERROR]', ...args);
  }
};

export default { devLog, devWarn, devError };