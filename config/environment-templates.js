/**
 * ENVIRONMENT VARIABLE TEMPLATES AND MANAGEMENT SYSTEM
 * Fortune 500-Level Environment Configuration for Render Deployment
 * Provides templates, validation, and management for all environments
 */

export const ENVIRONMENT_TEMPLATES = {
  // ==================================================
  // PRODUCTION ENVIRONMENT TEMPLATE
  // ==================================================
  production: {
    // Core Configuration
    NODE_ENV: 'production',
    BRANCH: 'production',
    PORT: '10000',
    LOG_LEVEL: 'error',

    // Database Configuration
    DATABASE_URL: '${PRODUCTION_DATABASE_URL}', // From Render database service
    PROD_DATABASE_URL: '${PRODUCTION_DATABASE_URL}',

    // Security Configuration
    JWT_SECRET: '${GENERATE_SECURE_JWT_SECRET}',
    SESSION_SECRET: '${GENERATE_SECURE_SESSION_SECRET}',
    CORS_ORIGINS: 'https://sentia-manufacturing-production.onrender.com',

    // Clerk Authentication (Production Keys Required)
    CLERK_ENVIRONMENT: 'production',
    CLERK_SECRET_KEY: '${PROD_CLERK_SECRET_KEY}',
    CLERK_WEBHOOK_SECRET: '${PROD_CLERK_WEBHOOK_SECRET}',
    VITE_CLERK_PUBLISHABLE_KEY: '${PROD_CLERK_PUBLISHABLE_KEY}',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '${PROD_CLERK_PUBLISHABLE_KEY}',
    VITE_CLERK_DOMAIN: 'clerk.financeflo.ai',
    VITE_CLERK_AFTER_SIGN_IN_URL: '/dashboard',
    VITE_CLERK_AFTER_SIGN_UP_URL: '/dashboard',
    VITE_CLERK_SIGN_IN_URL: '/sign-in',
    VITE_CLERK_SIGN_UP_URL: '/sign-up',
    VITE_DISABLE_AUTH_FALLBACK: 'true',
    VITE_FORCE_CLERK_AUTH: 'true',

    // Frontend Configuration
    VITE_API_BASE_URL: 'https://sentia-manufacturing-production.onrender.com/api',
    VITE_APP_TITLE: 'Sentia Manufacturing Dashboard',
    VITE_APP_VERSION: '1.0.10',

    // MCP Server Configuration
    MCP_SERVER_URL: 'https://mcp-server-production.onrender.com',
    MCP_JWT_SECRET: '${GENERATE_MCP_JWT_SECRET}',
    MCP_ENABLE_WEBSOCKET: 'true',
    MCP_SERVER_HEALTH_CHECK_INTERVAL: '30000',

    // External API Integrations - Production Credentials Required
    XERO_CLIENT_ID: '${PROD_XERO_CLIENT_ID}',
    XERO_CLIENT_SECRET: '${PROD_XERO_CLIENT_SECRET}',
    XERO_REDIRECT_URI: 'https://sentia-manufacturing-production.onrender.com/api/xero/callback',
    XERO_SYNC_INTERVAL: '*/30 * * * *',

    SHOPIFY_UK_ACCESS_TOKEN: '${PROD_SHOPIFY_UK_ACCESS_TOKEN}',
    SHOPIFY_UK_API_KEY: '${PROD_SHOPIFY_UK_API_KEY}',
    SHOPIFY_UK_SECRET: '${PROD_SHOPIFY_UK_SECRET}',
    SHOPIFY_UK_SHOP_URL: 'sentiaspirits.myshopify.com',
    SHOPIFY_USA_ACCESS_TOKEN: '${PROD_SHOPIFY_USA_ACCESS_TOKEN}',
    SHOPIFY_USA_API_KEY: '${PROD_SHOPIFY_USA_API_KEY}',
    SHOPIFY_USA_SECRET: '${PROD_SHOPIFY_USA_SECRET}',
    SHOPIFY_USA_SHOP_URL: 'us-sentiaspirits.myshopify.com',
    SHOPIFY_SYNC_INTERVAL: '*/15 * * * *',

    UNLEASHED_API_ID: '${PROD_UNLEASHED_API_ID}',
    UNLEASHED_API_KEY: '${PROD_UNLEASHED_API_KEY}',
    UNLEASHED_API_URL: 'https://api.unleashedsoftware.com',

    MICROSOFT_TENANT_ID: 'common',
    MICROSOFT_CLIENT_ID: '${PROD_MICROSOFT_CLIENT_ID}',
    MICROSOFT_CLIENT_SECRET: '${PROD_MICROSOFT_CLIENT_SECRET}',
    MICROSOFT_ADMIN_EMAIL: 'admin@app.sentiaspirits.com',
    MICROSOFT_DATA_EMAIL: 'data@app.sentiaspirits.com',

    // AI Services - Production API Keys Required
    OPENAI_API_KEY: '${PROD_OPENAI_API_KEY}',
    ANTHROPIC_API_KEY: '${PROD_ANTHROPIC_API_KEY}',
    GOOGLE_AI_API_KEY: '${PROD_GOOGLE_AI_API_KEY}',

    // Amazon Configuration
    AMAZON_UK_MARKETPLACE_ID: 'A1F83G8C2ARO7P',
    AMAZON_USA_MARKETPLACE_ID: 'ATVPDKIKX0DER',
    AMAZON_SYNC_INTERVAL: '*/60 * * * *',

    // Feature Flags - Production
    AUTO_DEPLOY_ENABLED: 'false',
    AUTO_FIX_ENABLED: 'false',
    ENABLE_AUTONOMOUS_TESTING: 'false',
    ENABLE_DETAILED_LOGGING: 'false',
    AUTO_SYNC_ENABLED: 'true',
    DISABLE_TEST_DATA_GENERATION: 'true',
    DATABASE_SYNC_INTERVAL: '0 */6 * * *',

    // Financial Services
    FINANCIAL_AGGREGATOR_URL: 'https://api.financialaggreg.com/v1',
    FINANCIAL_AGGREGATOR_TOKEN: '${PROD_FINANCIAL_AGGREGATOR_TOKEN}',
    FINANCIAL_AI_ENDPOINT: 'https://ai.financialinsights.com/api/v2',
    FINANCIAL_AI_TOKEN: '${PROD_FINANCIAL_AI_TOKEN}',
    CASH_ENGINE_SIM_ITERATIONS: '10000'
  },

  // ==================================================
  // TESTING ENVIRONMENT TEMPLATE
  // ==================================================
  testing: {
    // Core Configuration
    NODE_ENV: 'testing',
    BRANCH: 'testing',
    PORT: '10000',
    LOG_LEVEL: 'info',

    // Database Configuration
    DATABASE_URL: '${TESTING_DATABASE_URL}',
    TEST_DATABASE_URL: '${TESTING_DATABASE_URL}',

    // Security Configuration
    JWT_SECRET: '${GENERATE_SECURE_JWT_SECRET}',
    SESSION_SECRET: '${GENERATE_SECURE_SESSION_SECRET}',
    CORS_ORIGINS: 'https://sentia-manufacturing-testing.onrender.com',

    // Clerk Authentication (Can use development keys for testing)
    CLERK_ENVIRONMENT: 'production',
    CLERK_SECRET_KEY: '${TEST_CLERK_SECRET_KEY}',
    CLERK_WEBHOOK_SECRET: '${TEST_CLERK_WEBHOOK_SECRET}',
    VITE_CLERK_PUBLISHABLE_KEY: '${TEST_CLERK_PUBLISHABLE_KEY}',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '${TEST_CLERK_PUBLISHABLE_KEY}',
    VITE_CLERK_DOMAIN: 'clerk.financeflo.ai',
    VITE_CLERK_AFTER_SIGN_IN_URL: '/dashboard',
    VITE_CLERK_AFTER_SIGN_UP_URL: '/dashboard',
    VITE_CLERK_SIGN_IN_URL: '/sign-in',
    VITE_CLERK_SIGN_UP_URL: '/sign-up',
    VITE_DISABLE_AUTH_FALLBACK: 'true',
    VITE_FORCE_CLERK_AUTH: 'true',

    // Frontend Configuration
    VITE_API_BASE_URL: 'https://sentia-manufacturing-testing.onrender.com/api',
    VITE_APP_TITLE: 'Sentia Manufacturing Dashboard (Testing)',
    VITE_APP_VERSION: '1.0.10-testing',

    // MCP Server Configuration
    MCP_SERVER_URL: 'https://mcp-server-testing.onrender.com',
    MCP_JWT_SECRET: '${GENERATE_MCP_JWT_SECRET}',
    MCP_ENABLE_WEBSOCKET: 'true',
    MCP_SERVER_HEALTH_CHECK_INTERVAL: '15000',

    // External API Integrations - Testing/Development Credentials
    XERO_CLIENT_ID: '${TEST_XERO_CLIENT_ID}',
    XERO_CLIENT_SECRET: '${TEST_XERO_CLIENT_SECRET}',
    XERO_REDIRECT_URI: 'https://sentia-manufacturing-testing.onrender.com/api/xero/callback',
    XERO_SYNC_INTERVAL: '*/30 * * * *',

    SHOPIFY_UK_ACCESS_TOKEN: '${TEST_SHOPIFY_UK_ACCESS_TOKEN}',
    SHOPIFY_UK_API_KEY: '${TEST_SHOPIFY_UK_API_KEY}',
    SHOPIFY_UK_SECRET: '${TEST_SHOPIFY_UK_SECRET}',
    SHOPIFY_UK_SHOP_URL: 'sentiaspirits.myshopify.com',
    SHOPIFY_SYNC_INTERVAL: '*/15 * * * *',

    UNLEASHED_API_ID: '${TEST_UNLEASHED_API_ID}',
    UNLEASHED_API_KEY: '${TEST_UNLEASHED_API_KEY}',
    UNLEASHED_API_URL: 'https://api.unleashedsoftware.com',

    // AI Services - Testing API Keys
    OPENAI_API_KEY: '${TEST_OPENAI_API_KEY}',
    ANTHROPIC_API_KEY: '${TEST_ANTHROPIC_API_KEY}',

    // Feature Flags - Testing
    AUTO_DEPLOY_ENABLED: 'false',
    AUTO_FIX_ENABLED: 'true',
    ENABLE_AUTONOMOUS_TESTING: 'true',
    ENABLE_DETAILED_LOGGING: 'true',
    AUTO_SYNC_ENABLED: 'true',
    DATABASE_SYNC_INTERVAL: '0 */6 * * *'
  },

  // ==================================================
  // DEVELOPMENT ENVIRONMENT TEMPLATE
  // ==================================================
  development: {
    // Core Configuration
    NODE_ENV: 'development',
    BRANCH: 'development',
    PORT: '10000',
    LOG_LEVEL: 'debug',

    // Database Configuration
    DATABASE_URL: '${DEVELOPMENT_DATABASE_URL}',
    DEV_DATABASE_URL: '${DEVELOPMENT_DATABASE_URL}',

    // Security Configuration
    JWT_SECRET: '${GENERATE_SECURE_JWT_SECRET}',
    SESSION_SECRET: '${GENERATE_SECURE_SESSION_SECRET}',
    CORS_ORIGINS: 'https://sentia-manufacturing-development.onrender.com',

    // Clerk Authentication (Development keys)
    CLERK_ENVIRONMENT: 'production',
    CLERK_SECRET_KEY: '${DEV_CLERK_SECRET_KEY}',
    CLERK_WEBHOOK_SECRET: '${DEV_CLERK_WEBHOOK_SECRET}',
    VITE_CLERK_PUBLISHABLE_KEY: '${DEV_CLERK_PUBLISHABLE_KEY}',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '${DEV_CLERK_PUBLISHABLE_KEY}',
    VITE_CLERK_DOMAIN: 'clerk.financeflo.ai',
    VITE_CLERK_AFTER_SIGN_IN_URL: '/dashboard',
    VITE_CLERK_AFTER_SIGN_UP_URL: '/dashboard',
    VITE_CLERK_SIGN_IN_URL: '/sign-in',
    VITE_CLERK_SIGN_UP_URL: '/sign-up',
    VITE_DISABLE_AUTH_FALLBACK: 'true',
    VITE_FORCE_CLERK_AUTH: 'true',

    // Frontend Configuration
    VITE_API_BASE_URL: 'https://sentia-manufacturing-development.onrender.com/api',
    VITE_APP_TITLE: 'Sentia Manufacturing Dashboard (Development)',
    VITE_APP_VERSION: '1.0.10-development',

    // MCP Server Configuration
    MCP_SERVER_URL: 'https://mcp-server-development.onrender.com',
    MCP_JWT_SECRET: '${GENERATE_MCP_JWT_SECRET}',
    MCP_ENABLE_WEBSOCKET: 'true',
    MCP_SERVER_HEALTH_CHECK_INTERVAL: '10000',

    // External API Integrations - Development Credentials
    XERO_CLIENT_ID: '${DEV_XERO_CLIENT_ID}',
    XERO_CLIENT_SECRET: '${DEV_XERO_CLIENT_SECRET}',
    XERO_REDIRECT_URI: 'https://sentia-manufacturing-development.onrender.com/api/xero/callback',

    SHOPIFY_UK_ACCESS_TOKEN: '${DEV_SHOPIFY_UK_ACCESS_TOKEN}',
    SHOPIFY_UK_API_KEY: '${DEV_SHOPIFY_UK_API_KEY}',
    SHOPIFY_UK_SECRET: '${DEV_SHOPIFY_UK_SECRET}',
    SHOPIFY_UK_SHOP_URL: 'sentiaspirits.myshopify.com',

    UNLEASHED_API_ID: '${DEV_UNLEASHED_API_ID}',
    UNLEASHED_API_KEY: '${DEV_UNLEASHED_API_KEY}',
    UNLEASHED_API_URL: 'https://api.unleashedsoftware.com',

    // AI Services - Development API Keys
    OPENAI_API_KEY: '${DEV_OPENAI_API_KEY}',
    ANTHROPIC_API_KEY: '${DEV_ANTHROPIC_API_KEY}',

    // Feature Flags - Development
    AUTO_DEPLOY_ENABLED: 'true',
    AUTO_FIX_ENABLED: 'true',
    ENABLE_AUTONOMOUS_TESTING: 'true',
    ENABLE_DETAILED_LOGGING: 'true',
    AUTO_SYNC_ENABLED: 'true',
    DATABASE_SYNC_INTERVAL: '0 */6 * * *'
  },

  // ==================================================
  // HOTFIX ENVIRONMENT TEMPLATE
  // ==================================================
  hotfix: {
    // Core Configuration (inherits from production)
    NODE_ENV: 'production',
    BRANCH: 'hotfix',
    PORT: '10000',
    LOG_LEVEL: 'warn',

    // Database Configuration (uses production database)
    DATABASE_URL: '${PRODUCTION_DATABASE_URL}',

    // Security Configuration
    JWT_SECRET: '${PROD_JWT_SECRET}',
    SESSION_SECRET: '${PROD_SESSION_SECRET}',
    CORS_ORIGINS: 'https://sentia-manufacturing-hotfix.onrender.com',

    // Clerk Authentication (production keys)
    CLERK_ENVIRONMENT: 'production',
    CLERK_SECRET_KEY: '${PROD_CLERK_SECRET_KEY}',
    VITE_CLERK_PUBLISHABLE_KEY: '${PROD_CLERK_PUBLISHABLE_KEY}',
    VITE_CLERK_DOMAIN: 'clerk.financeflo.ai',

    // Frontend Configuration
    VITE_API_BASE_URL: 'https://sentia-manufacturing-hotfix.onrender.com/api',
    VITE_APP_TITLE: 'Sentia Manufacturing Dashboard (Hotfix)',
    VITE_APP_VERSION: '1.0.10-hotfix',

    // Feature Flags - Hotfix (minimal features)
    AUTO_DEPLOY_ENABLED: 'false',
    AUTO_FIX_ENABLED: 'false',
    ENABLE_AUTONOMOUS_TESTING: 'false',
    ENABLE_DETAILED_LOGGING: 'false'
  }
};

// ==================================================
// ENVIRONMENT VALIDATION RULES
// ==================================================
export const VALIDATION_RULES = {
  required: {
    production: [
      'DATABASE_URL',
      'CLERK_SECRET_KEY',
      'VITE_CLERK_PUBLISHABLE_KEY',
      'JWT_SECRET',
      'SESSION_SECRET'
    ],
    testing: [
      'DATABASE_URL',
      'CLERK_SECRET_KEY',
      'VITE_CLERK_PUBLISHABLE_KEY'
    ],
    development: [
      'DATABASE_URL'
    ],
    hotfix: [
      'DATABASE_URL',
      'CLERK_SECRET_KEY',
      'VITE_CLERK_PUBLISHABLE_KEY'
    ]
  },

  format: {
    PORT: /^\d+$/,
    NODE_ENV: /^(development|testing|production)$/,
    LOG_LEVEL: /^(debug|info|warn|error)$/,
    DATABASE_URL: /^postgresql:\/\/.+/,
    CORS_ORIGINS: /^https?:\/\/.+/,
    VITE_CLERK_PUBLISHABLE_KEY: /^pk_(live|test)_.+/,
    CLERK_SECRET_KEY: /^sk_(live|test)_.+/
  },

  security: {
    // Keys that should be generated and not have placeholder values
    generateRequired: [
      'JWT_SECRET',
      'SESSION_SECRET',
      'MCP_JWT_SECRET'
    ],

    // Keys that should not contain placeholder patterns
    noPlaceholders: [
      'DATABASE_URL',
      'CLERK_SECRET_KEY',
      'VITE_CLERK_PUBLISHABLE_KEY'
    ]
  }
};

// ==================================================
// ENVIRONMENT MANAGEMENT UTILITIES
// ==================================================
export class EnvironmentManager {
  static validateEnvironment(env, variables) {
    const errors = [];
    const warnings = [];

    // Check required variables
    const required = VALIDATION_RULES.required[env] || [];
    for (const varName of required) {
      if (!variables[varName]) {
        errors.push(`Missing required variable: ${varName}`);
      }
    }

    // Check format validation
    for (const [varName, pattern] of Object.entries(VALIDATION_RULES.format)) {
      if (variables[varName] && !pattern.test(variables[varName])) {
        errors.push(`Invalid format for ${varName}`);
      }
    }

    // Check for placeholder values
    for (const varName of VALIDATION_RULES.security.noPlaceholders) {
      if (variables[varName] && variables[varName].includes('${')) {
        errors.push(`${varName} contains placeholder value - must be replaced with actual value`);
      }
    }

    // Check for missing generated secrets
    for (const varName of VALIDATION_RULES.security.generateRequired) {
      if (!variables[varName] || variables[varName].includes('${GENERATE_')) {
        warnings.push(`${varName} should be generated - use a secure random value`);
      }
    }

    return { errors, warnings };
  }

  static generateSecureSecret(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return Buffer.from(result).toString('base64').slice(0, length);
  }

  static getEnvironmentTemplate(env) {
    return ENVIRONMENT_TEMPLATES[env] || ENVIRONMENT_TEMPLATES.production;
  }

  static generateEnvironmentFile(env, customValues = {}) {
    const template = this.getEnvironmentTemplate(env);
    const variables = { ...template, ...customValues };

    // Generate any missing secrets
    for (const varName of VALIDATION_RULES.security.generateRequired) {
      if (!variables[varName] || variables[varName].includes('${GENERATE_')) {
        variables[varName] = this.generateSecureSecret();
      }
    }

    // Convert to .env format
    let envContent = `# ${env.toUpperCase()} ENVIRONMENT CONFIGURATION\n`;
    envContent += `# Generated: ${new Date().toISOString()}\n`;
    envContent += `# Sentia Manufacturing Dashboard\n\n`;

    for (const [key, value] of Object.entries(variables)) {
      envContent += `${key}=${value}\n`;
    }

    return envContent;
  }

  static createRenderEnvVariables(env, customValues = {}) {
    const template = this.getEnvironmentTemplate(env);
    const variables = { ...template, ...customValues };

    // Format for Render API
    const renderVars = [];
    for (const [key, value] of Object.entries(variables)) {
      if (!value.includes('${')) { // Skip placeholder values
        renderVars.push({
          key,
          value: value.toString()
        });
      }
    }

    return renderVars;
  }
}

export default {
  ENVIRONMENT_TEMPLATES,
  VALIDATION_RULES,
  EnvironmentManager
};