#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Ensures all required variables are set for Render deployment
 */

import fs from 'fs';
import path from 'path';

// Complete list of required environment variables by category
const ENVVARIABLES = {
  // Core Configuration
  core: {
    required: ['NODE_ENV', 'PORT', 'DATABASE_URL', 'CORS_ORIGINS'],
    optional: ['DEV_DATABASE_URL', 'TEST_DATABASE_URL']
  },

  // Authentication
  auth: {
    required: [
      'VITE_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY'
    ],
    optional: ['CLERK_WEBHOOK_SECRET']
  },

  // Session & Security
  security: {
    required: ['SESSION_SECRET', 'JWT_SECRET'],
    optional: ['MCP_JWT_SECRET']
  },

  // Xero Integration
  xero: {
    required: [
      'XERO_CLIENT_ID',
      'XERO_CLIENT_SECRET',
      'XERO_REDIRECT_URI'
    ],
    optional: ['XERO_TENANT_ID']
  },

  // Shopify UK
  shopify_uk: {
    required: [
      'SHOPIFY_UK_API_KEY',
      'SHOPIFY_UK_SECRET',
      'SHOPIFY_UK_ACCESS_TOKEN',
      'SHOPIFY_UK_SHOP_URL'
    ],
    optional: []
  },

  // Shopify USA
  shopify_usa: {
    required: [
      'SHOPIFY_USA_API_KEY',
      'SHOPIFY_USA_SECRET',
      'SHOPIFY_USA_ACCESS_TOKEN',
      'SHOPIFY_USA_SHOP_URL'
    ],
    optional: ['SHOPIFY_WEBHOOK_SECRET']
  },

  // Amazon SP-API
  amazon: {
    required: [
      'AMAZON_UK_MARKETPLACE_ID',
      'AMAZON_USA_MARKETPLACE_ID'
    ],
    optional: [
      'AMAZON_SP_API_CLIENT_ID',
      'AMAZON_SP_API_CLIENT_SECRET',
      'AMAZON_SP_API_REFRESH_TOKEN',
      'AMAZON_SELLER_ID'
    ]
  },

  // Unleashed ERP
  unleashed: {
    required: [
      'UNLEASHED_API_ID',
      'UNLEASHED_API_KEY',
      'UNLEASHED_API_URL'
    ],
    optional: []
  },

  // AI Services
  ai: {
    required: [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY'
    ],
    optional: [
      'GOOGLE_AI_API_KEY',
      'LOCAL_LLM_ENDPOINT',
      'LOCAL_LLM_MODEL'
    ]
  },

  // Microsoft Graph
  microsoft: {
    required: [
      'MICROSOFT_CLIENT_ID',
      'MICROSOFT_CLIENT_SECRET',
      'MICROSOFT_TENANT_ID'
    ],
    optional: [
      'MICROSOFT_ADMIN_EMAIL',
      'MICROSOFT_DATA_EMAIL'
    ]
  },

  // MCP Server
  mcp: {
    required: [
      'MCP_SERVER_URL'
    ],
    optional: [
      'MCP_WEBSOCKET_URL',
      'MCP_ENABLE_WEBSOCKET',
      'MCP_SERVER_PORT',
      'MCP_SERVER_HEALTH_CHECK_INTERVAL'
    ]
  },

  // Auto-Sync
  sync: {
    required: ['AUTO_SYNC_ENABLED'],
    optional: [
      'XERO_SYNC_INTERVAL',
      'SHOPIFY_SYNC_INTERVAL',
      'AMAZON_SYNC_INTERVAL',
      'DATABASE_SYNC_INTERVAL'
    ]
  },

  // Application Settings
  app: {
    required: [
      'VITE_API_BASE_URL',
      'VITE_APP_TITLE',
      'VITE_APP_VERSION'
    ],
    optional: []
  },

  // Monitoring
  monitoring: {
    required: ['LOG_LEVEL'],
    optional: ['SENTRY_DSN', 'REDIS_URL']
  },

  // Feature Flags
  features: {
    required: [],
    optional: [
      'ENABLE_AUTONOMOUS_TESTING',
      'AUTO_FIX_ENABLED',
      'AUTO_DEPLOY_ENABLED'
    ]
  }
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Load environment variables from .env file if it exists
function loadEnvFile(envFile = '.env') {
  const envPath = path.resolve(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return envVars;
}

// Check if a variable is set
function isVarSet(varName, envVars) {
  if (process.env[varName]) return true;
  if (envVars[varName]) return true;
  return false;
}

// Validate environment variables
function validateEnvironment(environment = 'development') {
  console.log(`${colors.blue}Environment Variable Validation${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`Environment: ${colors.cyan}${environment}${colors.reset}\n`);

  // Load .env file
  const envVars = loadEnvFile('.env');
  const envFileCount = Object.keys(envVars).length;

  if (envFileCount > 0) {
    console.log(`${colors.gray}Loaded ${envFileCount} variables from .env file${colors.reset}\n`);
  }

  let totalRequired = 0;
  let totalMissing = 0;
  let totalOptional = 0;
  let missingVars = [];

  // Check each category
  for (const [category, vars] of Object.entries(ENV_VARIABLES)) {
    console.log(`${colors.cyan}${category.toUpperCase()}:${colors.reset}`);

    // Check required variables
    for (const varName of vars.required) {
      totalRequired++;
      if (isVarSet(varName, envVars)) {
        const value = process.env[varName] || envVars[varName];
        const displayValue = value && value.length > 20
          ? value.substring(0, 20) + '...'
          : '(set)';
        console.log(`  ${colors.green}✓${colors.reset} ${varName}: ${colors.gray}${displayValue}${colors.reset}`);
      } else {
        totalMissing++;
        missingVars.push(`${category}.${varName}`);
        console.log(`  ${colors.red}✗${colors.reset} ${varName}: ${colors.red}MISSING${colors.reset}`);
      }
    }

    // Check optional variables
    for (const varName of vars.optional) {
      totalOptional++;
      if (isVarSet(varName, envVars)) {
        console.log(`  ${colors.green}✓${colors.reset} ${varName}: ${colors.gray}(optional, set)${colors.reset}`);
      } else {
        console.log(`  ${colors.gray}-${colors.reset} ${varName}: ${colors.gray}(optional, not set)${colors.reset}`);
      }
    }

    console.log();
  }

  // Summary
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}VALIDATION SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);

  console.log(`Required Variables: ${totalRequired}`);
  console.log(`  ${colors.green}✓ Set: ${totalRequired - totalMissing}${colors.reset}`);
  console.log(`  ${colors.red}✗ Missing: ${totalMissing}${colors.reset}`);
  console.log(`Optional Variables: ${totalOptional}\n`);

  if (totalMissing === 0) {
    console.log(`${colors.green}SUCCESS: All required environment variables are set!${colors.reset}`);
    console.log(`${colors.green}Your application is ready for Render deployment.${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}ERROR: ${totalMissing} required variables are missing:${colors.reset}`);
    missingVars.forEach(v => {
      console.log(`  ${colors.red}- ${v}${colors.reset}`);
    });
    console.log(`\n${colors.yellow}Please set these variables in your Render dashboard or .env file.${colors.reset}`);
    return false;
  }
}

// Generate example .env file
function generateEnvExample() {
  console.log(`${colors.blue}Generating .env.example file...${colors.reset}`);

  let content = '# CapLiquify Manufacturing Platform - Environment Variables\n';
  content += '# Copy this file to .env and fill in your values\n\n';

  for (const [category, vars] of Object.entries(ENV_VARIABLES)) {
    content += `# === ${category.toUpperCase()} ===\n`;

    // Add required variables
    for (const varName of vars.required) {
      content += `${varName}=your-${varName.toLowerCase()}-here\n`;
    }

    // Add optional variables (commented)
    for (const varName of vars.optional) {
      content += `# ${varName}=optional-value\n`;
    }

    content += '\n';
  }

  fs.writeFileSync('.env.example', content);
  console.log(`${colors.green}✓ Created .env.example file${colors.reset}`);
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

if (command === 'generate') {
  generateEnvExample();
} else if (command === 'validate') {
  const environment = args[1] || 'development';
  const isValid = validateEnvironment(environment);
  process.exit(isValid ? 0 : 1);
} else {
  // Default: validate current environment
  const environment = process.env.NODE_ENV || 'development';
  const isValid = validateEnvironment(environment);

  console.log(`\n${colors.gray}Usage:${colors.reset}`);
  console.log('  node validate-env-vars.js          - Validate current environment');
  console.log('  node validate-env-vars.js validate [env] - Validate specific environment');
  console.log('  node validate-env-vars.js generate - Generate .env.example file');

  process.exit(isValid ? 0 : 1);
}