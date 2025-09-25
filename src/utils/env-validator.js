import { logDebug, logInfo, logWarn, logError } from 'logger';

/**
 * Environment Variable Validator
 * Validates required environment variables on application startup
 * Implements TASK-002 from SpecKit specifications
 */

// Required environment variables for backend
const requiredBackendEnvVars = [
  'CLERK_SECRET_KEY',
  'DATABASE_URL_DEVELOPMENT',
  'DATABASE_URL_TESTING', 
  'DATABASE_URL_PRODUCTION'
];

// Required environment variables for frontend
const requiredFrontendEnvVars = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_CLERK_DOMAIN'
];

/**
 * Validates backend environment variables
 * Called from server startup
 */
export function validateBackendEnvironment() {
  logDebug('🔍 Validating backend environment variables...');
  
  const missing = requiredBackendEnvVars.filter(
    key => !process.env[key] || process.env[key].trim() === ''
  );

  if (missing.length > 0) {
    logError('❌ CRITICAL: Missing required backend environment variables:');
    missing.forEach(key => {
      logError(`   - ${key}`);
    });
    logError('\n📋 Required environment variables:');
    requiredBackendEnvVars.forEach(key => {
      const status = process.env[key] ? '✅' : '❌';
      const value = process.env[key] ? '[SET]' : '[MISSING]';
      logError(`   ${status} ${key}: ${value}`);
    });
    logError('\n🔧 Please set these environment variables and restart the application.');
    process.exit(1);
  }

  // Validate Clerk secret key format
  if (process.env.CLERK_SECRET_KEY && !process.env.CLERK_SECRET_KEY.startsWith('sk_')) {
    logError('❌ CRITICAL: CLERK_SECRET_KEY must start with "sk_"');
    process.exit(1);
  }

  // Validate database URLs format
  const dbUrls = [
    'DATABASE_URL_DEVELOPMENT',
    'DATABASE_URL_TESTING', 
    'DATABASE_URL_PRODUCTION'
  ];

  dbUrls.forEach(key => {
    if (process.env[key] && !process.env[key].startsWith('postgresql://')) {
      logError(`❌ CRITICAL: ${key} must be a valid PostgreSQL connection string`);
      process.exit(1);
    }
  });

  logDebug('✅ Backend environment validation passed');
  
  // Log configuration summary (without sensitive values)
  logDebug('📋 Environment Configuration:');
  logDebug(`   - CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? 'SET' : 'MISSING'}`);
  logDebug(`   - DATABASE_URL_DEVELOPMENT: ${process.env.DATABASE_URL_DEVELOPMENT ? 'SET' : 'MISSING'}`);
  logDebug(`   - DATABASE_URL_TESTING: ${process.env.DATABASE_URL_TESTING ? 'SET' : 'MISSING'}`);
  logDebug(`   - DATABASE_URL_PRODUCTION: ${process.env.DATABASE_URL_PRODUCTION ? 'SET' : 'MISSING'}`);
}

/**
 * Validates frontend environment variables
 * Called from React app startup
 */
export function validateFrontendEnvironment() {
  logDebug('🔍 Validating frontend environment variables...');
  
  const missing = requiredFrontendEnvVars.filter(
    key => !import.meta.env[key] || import.meta.env[key].trim() === ''
  );

  if (missing.length > 0) {
    logError('❌ CRITICAL: Missing required frontend environment variables:');
    missing.forEach(key => {
      logError(`   - ${key}`);
    });
    logError('\n📋 Required environment variables:');
    requiredFrontendEnvVars.forEach(key => {
      const status = import.meta.env[key] ? '✅' : '❌';
      const value = import.meta.env[key] ? '[SET]' : '[MISSING]';
      logError(`   ${status} ${key}: ${value}`);
    });
    logError('\n🔧 Please set these environment variables in .env.local and restart the application.');
    
    // For frontend, show user-friendly error instead of crashing
    return false;
  }

  // Validate Clerk publishable key format
  if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    logError('❌ CRITICAL: VITE_CLERK_PUBLISHABLE_KEY must start with "pk_"');
    return false;
  }

  logDebug('✅ Frontend environment validation passed');
  
  // Log configuration summary (without sensitive values)
  logDebug('📋 Frontend Environment Configuration:');
  logDebug(`   - VITE_CLERK_PUBLISHABLE_KEY: ${import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING'}`);
  logDebug(`   - VITE_CLERK_DOMAIN: ${import.meta.env.VITE_CLERK_DOMAIN ? 'SET' : 'MISSING'}`);
  
  return true;
}

/**
 * Get environment validation status for health checks
 */
export function getEnvironmentStatus() {
  const backendStatus = requiredBackendEnvVars.every(
    key => process.env[key] && process.env[key].trim() !== ''
  );
  
  return {
    backend: backendStatus,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validate specific environment variable
 */
export function validateEnvVar(key, value, pattern = null) {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${key} is required but not set` };
  }
  
  if (pattern && !pattern.test(value)) {
    return { valid: false, error: `${key} does not match required pattern` };
  }
  
  return { valid: true };
}
