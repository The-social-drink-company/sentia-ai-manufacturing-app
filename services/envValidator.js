import { logError, logWarn, logInfo } from './logger.js';

const requiredEnvVars = [
  'CLERK_SECRET_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY'
];

const optionalEnvVars = [
  'DATABASE_URL',
  'DEV_DATABASE_URL',
  'UNLEASHED_API_ID',
  'UNLEASHED_API_KEY',
  'CORS_ORIGINS',
  'LOG_LEVEL',
  'DATABASE_SSL_CA'
];

export function validateEnvironment() {
  const missing = [];
  const present = [];
  const optional = [];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    } else {
      present.push(envVar);
    }
  });

  optionalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      optional.push(envVar);
    }
  });

  if (missing.length > 0) {
    logError('Missing required environment variables', { missing });
    return false;
  }

  logInfo('Environment validation successful', {
    required: present.length,
    optional: optional.length,
    optionalPresent: optional
  });

  if (optional.length < optionalEnvVars.length) {
    const missingOptional = optionalEnvVars.filter(v => !process.env[v]);
    logWarn('Some optional environment variables are not set', { missingOptional });
  }

  return true;
}

export { requiredEnvVars, optionalEnvVars };