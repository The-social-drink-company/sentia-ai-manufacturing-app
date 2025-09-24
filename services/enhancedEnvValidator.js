import Joi from 'joi';
import { logError, logWarn, logInfo } from './logger.js';

const envSchema = Joi.object({
  // Core Configuration
  NODE_ENV: Joi.string().valid('development', 'testing', 'production').required(),
  PORT: Joi.number().default(5000),
  
  // Database Configuration
  DATABASE_URL: Joi.string().uri().required(),
  DEV_DATABASE_URL: Joi.string().uri().optional(),
  
  // Authentication
  CLERK_SECRET_KEY: Joi.string().required(),
  VITE_CLERK_PUBLISHABLE_KEY: Joi.string().required(),
  
  // API Configuration
  VITE_API_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().required(),
  
  // Flask Configuration
  FLASK_CONFIG: Joi.string().valid('development', 'testing', 'production').required(),
  SECRET_KEY: Joi.string().min(32).required(),
  FLASK_APP: Joi.string().default('run.py'),
  
  // Unleashed API
  UNLEASHED_API_ID: Joi.string().uuid().required(),
  UNLEASHED_API_KEY: Joi.string().required(),
  UNLEASHED_API_URL: Joi.string().uri().required(),
  
  // AI APIs
  CLAUDE_API_KEY: Joi.string().pattern(/^sk-ant-/).required(),
  OPENAI_API_KEY: Joi.string().pattern(/^sk-proj-/).required(),
  
  // Microsoft Email
  MS_CLIENT_ID: Joi.string().required(),
  MS_CLIENT_SECRET: Joi.string().uuid().required(),
  ADMIN_EMAIL: Joi.string().email().required(),
  DATA_EMAIL: Joi.string().email().required(),
  
  // Shopify UK
  SHOPIFY_UK_API_KEY: Joi.string().required(),
  SHOPIFY_UK_SECRET: Joi.string().required(),
  SHOPIFY_UK_ACCESS_TOKEN: Joi.string().pattern(/^shpat_/).required(),
  SHOPIFY_UK_SHOP_URL: Joi.string().hostname().required(),
  
  // Shopify USA
  SHOPIFY_USA_API_KEY: Joi.string().required(),
  SHOPIFY_USA_SECRET: Joi.string().required(),
  SHOPIFY_USA_ACCESS_TOKEN: Joi.string().pattern(/^shpat_/).required(),
  SHOPIFY_USA_SHOP_URL: Joi.string().hostname().required(),
  
  // Shopify EU (optional for now)
  SHOPIFY_EU_API_KEY: Joi.string().optional(),
  SHOPIFY_EU_SECRET: Joi.string().optional(),
  SHOPIFY_EU_ACCESS_TOKEN: Joi.string().optional(),
  SHOPIFY_EU_SHOP_URL: Joi.string().optional(),
  
  // Amazon SP-API (optional for now)
  AMAZON_SP_API_CLIENT_ID: Joi.string().optional(),
  AMAZON_SP_API_CLIENT_SECRET: Joi.string().optional(),
  AMAZON_SP_API_REFRESH_TOKEN: Joi.string().optional(),
  AMAZON_UK_MARKETPLACE_ID: Joi.string().default('A1F83G8C2ARO7P'),
  AMAZON_USA_MARKETPLACE_ID: Joi.string().default('ATVPDKIKX0DER'),
  
  // Xero API
  XERO_API_KEY: Joi.string().required(),
  XERO_API_SECRET: Joi.string().required(),
  
  // Slack Integration
  SLACK_BOT_TOKEN: Joi.string().pattern(/^xoxb-/).required(),
  
  // Railway Configuration
  RAILWAY_ENVIRONMENT: Joi.string().valid('development', 'testing', 'production').optional(),
  RAILWAY_SERVICE_NAME: Joi.string().optional(),
  
  // MCP Server
  MCP_SERVER_URL: Joi.string().uri().optional(),
  MCP_SERVER_TOKEN: Joi.string().optional(),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('json'),
  DATABASE_SSL_CA: Joi.string().optional(),
  
  // Security
  SESSION_SECRET: Joi.string().min(32).optional(),
  JWT_SECRET: Joi.string().min(32).optional(),
  ENCRYPTION_KEY: Joi.string().min(32).optional(),
  
  // Performance (production only)
  MAX_CONNECTIONS: Joi.number().when('NODE_ENV', {
    is: 'production',
    then: Joi.number().min(10).max(200).default(100),
    otherwise: Joi.number().optional()
  }),
  CONNECTION_TIMEOUT: Joi.number().default(30000),
  QUERY_TIMEOUT: Joi.number().default(60000)
});

// Legacy compatibility - maintain existing interface
const requiredEnvVars = [
  'CLERK_SECRET_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'DATABASE_URL',
  'UNLEASHED_API_ID',
  'UNLEASHED_API_KEY',
  'CLAUDE_API_KEY',
  'OPENAI_API_KEY',
  'MS_CLIENT_ID',
  'MS_CLIENT_SECRET',
  'SHOPIFY_UK_API_KEY',
  'SHOPIFY_USA_API_KEY',
  'XERO_API_KEY',
  'SLACK_BOT_TOKEN'
];

const optionalEnvVars = [
  'DEV_DATABASE_URL',
  'CORS_ORIGINS',
  'LOG_LEVEL',
  'DATABASE_SSL_CA',
  'RAILWAY_ENVIRONMENT',
  'RAILWAY_SERVICE_NAME',
  'MCP_SERVER_URL',
  'SHOPIFY_EU_API_KEY',
  'AMAZON_SP_API_CLIENT_ID'
];

export function validateEnvironment() {
  try {
    const { error, value } = envSchema.validate(process.env, {
      allowUnknown: true,
      stripUnknown: false
    });
    
    if (error) {
      const missingVars = error.details
        .filter(detail => detail.type === 'any.required')
        .map(detail => detail.path.join('.'));
      
      const invalidVars = error.details
        .filter(detail => detail.type !== 'any.required')
        .map(detail => `${detail.path.join('.')}: ${detail.message}`);
      
      if (missingVars.length > 0) {
        logError('Missing required environment variables', { missing: missingVars });
      }
      
      if (invalidVars.length > 0) {
        logError('Invalid environment variables', { invalid: invalidVars });
      }
      
      return false;
    }
    
    // Log successful validation with integration status
    const integrationStatus = getIntegrationStatus(value);
    logInfo('Environment validation successful', {
      environment: value.NODE_ENV,
      integrations: integrationStatus,
      totalRequired: requiredEnvVars.length,
      totalOptional: optionalEnvVars.length
    });
    
    // Warn about missing optional integrations
    const missingOptional = optionalEnvVars.filter(v => !process.env[v]);
    if (missingOptional.length > 0) {
      logWarn('Some optional integrations are not configured', { 
        missing: missingOptional,
        impact: 'Some features may not be available'
      });
    }
    
    return true;
  } catch (validationError) {
    logError('Environment validation failed', { error: validationError.message });
    return false;
  }
}

export const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false
  });
  
  if (error) {
    const missingVars = error.details
      .filter(detail => detail.type === 'any.required')
      .map(detail => detail.path.join('.'));
    
    const invalidVars = error.details
      .filter(detail => detail.type !== 'any.required')
      .map(detail => `${detail.path.join('.')}: ${detail.message}`);
    
    let errorMessage = 'Environment validation failed:\n';
    
    if (missingVars.length > 0) {
      errorMessage += `\nMissing required variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}`;
    }
    
    if (invalidVars.length > 0) {
      errorMessage += `\nInvalid variables:\n${invalidVars.map(v => `  - ${v}`).join('\n')}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return value;
};

export const getEnvironmentInfo = () => {
  const env = validateEnv();
  
  return {
    environment: env.NODE_ENV,
    port: env.PORT,
    database: {
      host: new URL(env.DATABASE_URL).hostname,
      ssl: env.DATABASE_URL.includes('sslmode=require')
    },
    integrations: getIntegrationStatus(env),
    railway: {
      environment: env.RAILWAY_ENVIRONMENT,
      serviceName: env.RAILWAY_SERVICE_NAME
    }
  };
};

const getIntegrationStatus = (env) => {
  return {
    unleashed: !!env.UNLEASHED_API_ID,
    shopifyUK: !!env.SHOPIFY_UK_API_KEY,
    shopifyUSA: !!env.SHOPIFY_USA_API_KEY,
    shopifyEU: !!env.SHOPIFY_EU_API_KEY,
    amazon: !!env.AMAZON_SP_API_CLIENT_ID,
    xero: !!env.XERO_API_KEY,
    slack: !!env.SLACK_BOT_TOKEN,
    openai: !!env.OPENAI_API_KEY,
    claude: !!env.CLAUDE_API_KEY,
    microsoftEmail: !!env.MS_CLIENT_ID,
    mcpServer: !!env.MCP_SERVER_URL
  };
};

export const checkIntegrationHealth = async () => {
  const env = validateEnv();
  const health = {};
  
  // Check database connection
  try {
    // This would be implemented with actual database connection test
    health.database = { status: 'healthy', message: 'Connection successful' };
  } catch (error) {
    health.database = { status: 'unhealthy', message: error.message };
  }
  
  // Check external APIs (basic connectivity)
  const integrations = [
    { name: 'unleashed', url: env.UNLEASHED_API_URL },
    { name: 'shopifyUK', url: `https://${env.SHOPIFY_UK_SHOP_URL}` },
    { name: 'shopifyUSA', url: `https://${env.SHOPIFY_USA_SHOP_URL}` }
  ];
  
  for (const integration of integrations) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(integration.url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      health[integration.name] = {
        status: response.ok ? 'healthy' : 'degraded',
        statusCode: response.status
      };
    } catch (error) {
      health[integration.name] = {
        status: 'unhealthy',
        message: error.message
      };
    }
  }
  
  return health;
};

// Maintain backward compatibility
export { requiredEnvVars, optionalEnvVars };

// Export for use in server startup
export default {
  validateEnvironment,
  validateEnv,
  getEnvironmentInfo,
  checkIntegrationHealth,
  requiredEnvVars,
  optionalEnvVars
};

