import { logError, logInfo, logWarn } from '../../services/observability/structuredLogger.js';

/**
 * Environment Validation Middleware
 * Validates required environment variables and security configuration
 * Created as part of Clerk Authentication Security Fix (October 2025)
 */

// Required environment variables for different environments
const REQUIRED_ENV_VARS = {
  production: [
    'NODE_ENV',
    'DATABASE_URL',
    'VITE_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'CLERK_WEBHOOK_SECRET'
  ],
  testing: [
    'NODE_ENV',
    'DATABASE_URL',
    'VITE_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ],
  development: [
    'NODE_ENV',
    'VITE_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ]
};

// Security validation patterns
const SECURITY_PATTERNS = {
  VITE_CLERK_PUBLISHABLE_KEY: /^pk_(live|test)_.{20,}$/,
  CLERK_SECRET_KEY: /^sk_(live|test)_.{20,}$/,
  CLERK_WEBHOOK_SECRET: /^whsec_.{20,}$/
};

// Environment-specific key type validation
// Note: Development environment can use production keys when VITE_DEVELOPMENT_MODE=true (authentication bypass)
const ENVIRONMENT_KEY_TYPES = {
  production: {
    VITE_CLERK_PUBLISHABLE_KEY: 'pk_live_',
    CLERK_SECRET_KEY: 'sk_live_'
  },
  testing: {
    VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_',
    CLERK_SECRET_KEY: 'sk_test_'
  },
  development: {
    // Development can use either test keys OR production keys with development mode bypass
    VITE_CLERK_PUBLISHABLE_KEY: ['pk_test_', 'pk_live_'],
    CLERK_SECRET_KEY: ['sk_test_', 'sk_live_']
  }
};

/**
 * Validates environment variables on startup
 * @returns {Object} Validation result with success/failure and details
 */
export function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const requiredVars = REQUIRED_ENV_VARS[env] || REQUIRED_ENV_VARS.development;
  
  const validation = {
    success: true,
    environment: env,
    missing: [],
    invalid: [],
    warnings: [],
    security: {
      clerkKeysSecure: false,
      environmentMatch: false,
      webhookConfigured: false
    }
  };

  logInfo('Starting environment validation', { environment: env });

  // Check for missing required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      validation.missing.push(varName);
      validation.success = false;
      logError('Missing required environment variable', { variable: varName });
    }
  }

  // Validate security patterns for existing variables
  for (const [varName, pattern] of Object.entries(SECURITY_PATTERNS)) {
    const value = process.env[varName];
    if (value && !pattern.test(value)) {
      validation.invalid.push({
        variable: varName,
        reason: 'Invalid format for security key'
      });
      validation.success = false;
      logError('Invalid environment variable format', { variable: varName });
    }
  }

  // Validate environment-specific key types
  const envKeyTypes = ENVIRONMENT_KEY_TYPES[env];
  if (envKeyTypes) {
    for (const [varName, expectedPrefixes] of Object.entries(envKeyTypes)) {
      const value = process.env[varName];
      if (value) {
        // Handle both single prefix (string) and multiple prefixes (array)
        const prefixArray = Array.isArray(expectedPrefixes) ? expectedPrefixes : [expectedPrefixes];
        const isValidPrefix = prefixArray.some(prefix => value.startsWith(prefix));
        
        if (!isValidPrefix) {
          // Only warn if development environment is NOT using production keys with development mode
          const isDevelopmentBypass = env === 'development' && 
            process.env.VITE_DEVELOPMENT_MODE === 'true' &&
            (value.startsWith('pk_live_') || value.startsWith('sk_live_'));
            
          if (!isDevelopmentBypass) {
            validation.warnings.push({
              variable: varName,
              message: `Using ${value.startsWith('pk_live_') || value.startsWith('sk_live_') ? 'production' : 'test'} key in ${env} environment`
            });
            logWarn('Environment key type mismatch', { 
              variable: varName, 
              environment: env, 
              expectedPrefix: prefixArray.join(' or ')
            });
          }
        }
      }
    }
  }

  // Security checks
  if (process.env.VITE_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
    validation.security.clerkKeysSecure = true;
  }

  if (envKeyTypes) {
    const pubKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    
    if (pubKey && secretKey) {
      const pubKeyEnv = pubKey.startsWith('pk_live_') ? 'production' : 'test';
      const secretKeyEnv = secretKey.startsWith('sk_live_') ? 'production' : 'test';
      
      validation.security.environmentMatch = pubKeyEnv === secretKeyEnv;
      
      // Don't warn about environment mismatch in development mode with authentication bypass
      const isDevelopmentBypass = env === 'development' && process.env.VITE_DEVELOPMENT_MODE === 'true';
      
      if (!validation.security.environmentMatch && !isDevelopmentBypass) {
        validation.warnings.push({
          variable: 'CLERK_KEYS',
          message: 'Publishable and secret keys are from different environments'
        });
        logWarn('Clerk key environment mismatch', { pubKeyEnv, secretKeyEnv });
      }
    }
  }

  if (env === 'production' && process.env.CLERK_WEBHOOK_SECRET) {
    validation.security.webhookConfigured = true;
  }

  // Log validation results
  if (validation.success) {
    logInfo('Environment validation successful', {
      environment: env,
      securityChecks: validation.security,
      warnings: validation.warnings.length
    });
  } else {
    logError('Environment validation failed', {
      environment: env,
      missing: validation.missing,
      invalid: validation.invalid
    });
  }

  return validation;
}

/**
 * Express middleware to validate environment on each request (development only)
 */
export function environmentValidationMiddleware(req, res, next) {
  // Only run in development to avoid performance impact
  if (process.env.NODE_ENV === 'development') {
    const validation = validateEnvironment();
    
    if (!validation.success) {
      return res.status(500).json({
        success: false,
        error: 'Environment configuration error',
        details: {
          missing: validation.missing,
          invalid: validation.invalid
        },
        code: 'ENV_VALIDATION_FAILED'
      });
    }
  }
  
  next();
}

/**
 * Startup validation function - called during server initialization
 * Exits process if critical validation fails
 */
export function validateEnvironmentOnStartup() {
  logInfo('Performing startup environment validation...');
  
  const validation = validateEnvironment();
  
  if (!validation.success) {
    logError('CRITICAL: Environment validation failed on startup', {
      missing: validation.missing,
      invalid: validation.invalid
    });
    
    console.error('\n=== ENVIRONMENT VALIDATION FAILED ===');
    console.error('Missing required variables:', validation.missing);
    console.error('Invalid variables:', validation.invalid);
    console.error('Server cannot start with invalid environment configuration.');
    console.error('Please check your environment variables and try again.');
    console.error('=====================================\n');
    
    process.exit(1);
  }
  
  // Log warnings but don't exit
  if (validation.warnings.length > 0) {
    logWarn('Environment validation warnings', { warnings: validation.warnings });
    
    console.warn('\n=== ENVIRONMENT WARNINGS ===');
    validation.warnings.forEach(warning => {
      console.warn(`${warning.variable}: ${warning.message}`);
    });
    console.warn('============================\n');
  }
  
  logInfo('Environment validation completed successfully', {
    environment: validation.environment,
    security: validation.security
  });
  
  return validation;
}

/**
 * Get current environment status for health checks
 */
export function getEnvironmentStatus() {
  const validation = validateEnvironment();
  
  return {
    environment: validation.environment,
    status: validation.success ? 'healthy' : 'error',
    security: validation.security,
    issues: {
      missing: validation.missing,
      invalid: validation.invalid,
      warnings: validation.warnings
    },
    timestamp: new Date().toISOString()
  };
}

export default {
  validateEnvironment,
  environmentValidationMiddleware,
  validateEnvironmentOnStartup,
  getEnvironmentStatus
};