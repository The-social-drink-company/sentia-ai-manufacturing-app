/**
 * DATABASE CONFIGURATION FOR MULTI-BRANCH DEPLOYMENT
 * Ensures correct database connection per environment
 * All branches use the MCP server hosted on Render
 */

// Get current environment/branch
const NODE_ENV = process.env.NODE_ENV || 'development';
const BRANCH = process.env.BRANCH || process.env.RENDER_GIT_BRANCH || NODE_ENV;

// MCP Server Configuration (shared across all branches)
export const MCP_CONFIG = {
  url: process.env.MCP_SERVER_URL || 'https://sentia-mcp-production.onrender.com',
  websocketUrl: process.env.MCP_WEBSOCKET_URL || 'wss://sentia-mcp-production.onrender.com',
  healthCheckEndpoint: '/health',
  apiVersion: 'v1',
  timeout: parseInt(process.env.MCP_TIMEOUT) || 30000,
  retryAttempts: parseInt(process.env.MCP_RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(process.env.MCP_RETRY_DELAY) || 1000,
  jwtSecret: process.env.MCP_JWT_SECRET || 'sentia-mcp-secret-key'
};

// Database configurations using environment variables
const DATABASE_CONFIGS = {
  development: {
    // Use DATABASE_URL from environment, fallback to current development URL from render.yaml
    connectionString: process.env.DATABASE_URL || 'postgresql://sentia_dev:twIkfNHlhXfoOpHuWsZ45lzeLnjFNVQA@dpg-d3bbggggjchc73fdf1sg-a.oregon-postgres.render.com/sentia_manufacturing_dev_hl6w?sslmode=require',
    database: 'sentia_manufacturing_dev_hl6w',
    environment: 'development'
  },
  test: {
    // Use DATABASE_URL from environment, fallback to current testing URL from render.yaml  
    connectionString: process.env.DATABASE_URL || 'postgresql://sentia_test:Y5C66K5Thr2gIa2inIsfDlfw0RtyPtK4@dpg-d3bbkkmr433s738jbg6g-a.oregon-postgres.render.com/sentia_manufacturing_test_4fky?sslmode=require',
    database: 'sentia_manufacturing_test_4fky',
    environment: 'testing'
  },
  testing: {
    // Alias for test - use same configuration
    connectionString: process.env.DATABASE_URL || 'postgresql://sentia_test:Y5C66K5Thr2gIa2inIsfDlfw0RtyPtK4@dpg-d3bbkkmr433s738jbg6g-a.oregon-postgres.render.com/sentia_manufacturing_test_4fky?sslmode=require',
    database: 'sentia_manufacturing_test_4fky',
    environment: 'testing'
  },
  production: {
    // Use DATABASE_URL from environment, fallback to current production URL from render.yaml
    connectionString: process.env.DATABASE_URL || 'postgresql://sentia_prod:2o0PtIRQYR27VpwElifkaqI88jsX2Fb7@dpg-d3bbik3e5dus73ce3da0-a.oregon-postgres.render.com/sentia_manufacturing_prod_7lgf?sslmode=require',
    database: 'sentia_manufacturing_prod_7lgf',
    environment: 'production'
  }
};

// Get database configuration for current environment
export function getDatabaseConfig() {
  const env = BRANCH.toLowerCase();
  const config = DATABASE_CONFIGS[env] || DATABASE_CONFIGS.development;

  // Always use DATABASE_URL environment variable first, then fallback
  const connectionString = process.env.DATABASE_URL || config.connectionString;

  console.log(`[Database Config] Environment: ${env}`);
  console.log(`[Database Config] Database: ${config.database}`);
  console.log(`[Database Config] Using environment DATABASE_URL: ${!!process.env.DATABASE_URL}`);
  console.log(`[Database Config] MCP Server: ${MCP_CONFIG.url}`);

  return {
    connectionString,
    database: config.database,
    environment: config.environment,
    ssl: { rejectUnauthorized: false },
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  };
}

// Get MCP server configuration
export function getMCPConfig() {
  return {
    ...MCP_CONFIG,
    environment: BRANCH,
    database: getDatabaseConfig().database,
    auth: {
      jwt_secret: process.env.MCP_JWT_SECRET || 'UCL2hGcrBa4GdF32izKAd2dTBDJ5WidLVuV5r3uPTOc='
    }
  };
}

// Get API base URL for current environment
export function getAPIBaseURL() {
  const urls = {
    development: 'https://sentia-manufacturing-development.onrender.com/api',
    test: 'https://sentia-manufacturing-testing.onrender.com/api',
    testing: 'https://sentia-manufacturing-testing.onrender.com/api',
    production: 'https://sentia-manufacturing-production.onrender.com/api'
  };

  return urls[BRANCH.toLowerCase()] || urls.development;
}

// Database connection string helper
export function getDatabaseURL() {
  const config = getDatabaseConfig();
  return process.env.DATABASE_URL || config.connectionString;
}

// Prisma database URL (for migrations)
export function getPrismaDatabaseURL() {
  const url = getDatabaseURL();
  // Add connection pool settings for Prisma
  return `${url}?schema=public&connection_limit=10&pool_timeout=30`;
}

// Export all configurations
export default {
  database: getDatabaseConfig(),
  mcp: getMCPConfig(),
  apiBaseUrl: getAPIBaseURL(),
  environment: BRANCH,
  isProduction: BRANCH === 'production',
  isDevelopment: BRANCH === 'development',
  isTesting: BRANCH === 'test' || BRANCH === 'testing'
};