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
  url: 'https://mcp-server-tkyu.onrender.com',
  websocketUrl: 'wss://mcp-server-tkyu.onrender.com',
  healthCheckEndpoint: '/health',
  apiVersion: 'v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

// Database configurations per branch/environment
const DATABASE_CONFIGS = {
  development: {
    // Development Database
    internal: 'postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a/sentia_manufacturing_dev',
    external: 'postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a.oregon-postgres.render.com/sentia_manufacturing_dev',
    host: 'dpg-d344rkfdiees73a20c50-a',
    database: 'sentia_manufacturing_dev',
    username: 'sentia_dev',
    password: 'nZ4vtXienMAwxahr0GJByc2qXFIFSoYL',
    port: 5432
  },
  test: {
    // Testing Database
    internal: 'postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a/sentia_manufacturing_test',
    external: 'postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a.oregon-postgres.render.com/sentia_manufacturing_test',
    host: 'dpg-d344rkfdiees73a20c40-a',
    database: 'sentia_manufacturing_test',
    username: 'sentia_test',
    password: 'He45HKApt8BjbCXXVPtEhIxbaBXxk3we',
    port: 5432
  },
  testing: {
    // Alias for test
    internal: 'postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a/sentia_manufacturing_test',
    external: 'postgresql://sentia_test:He45HKApt8BjbCXXVPtEhIxbaBXxk3we@dpg-d344rkfdiees73a20c40-a.oregon-postgres.render.com/sentia_manufacturing_test',
    host: 'dpg-d344rkfdiees73a20c40-a',
    database: 'sentia_manufacturing_test',
    username: 'sentia_test',
    password: 'He45HKApt8BjbCXXVPtEhIxbaBXxk3we',
    port: 5432
  },
  production: {
    // Production Database
    internal: 'postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a/sentia_manufacturing_prod',
    external: 'postgresql://sentia_prod:nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2@dpg-d344rkfdiees73a20c30-a.oregon-postgres.render.com/sentia_manufacturing_prod',
    host: 'dpg-d344rkfdiees73a20c30-a',
    database: 'sentia_manufacturing_prod',
    username: 'sentia_prod',
    password: 'nKnFo2pRzVrQ2tQEkFNEULhwLZIBmwK2',
    port: 5432
  }
};

// Get database configuration for current environment
export function getDatabaseConfig() {
  const env = BRANCH.toLowerCase();
  const config = DATABASE_CONFIGS[env] || DATABASE_CONFIGS.development;

  // Use internal connection if running on Render, external otherwise
  const isRender = process.env.RENDER === 'true';
  const connectionString = isRender ? config.internal : config.external;

  console.log(`[Database Config] Environment: ${env}`);
  console.log(`[Database Config] Using ${isRender ? 'internal' : 'external'} connection`);
  console.log(`[Database Config] Database: ${config.database}`);
  console.log(`[Database Config] MCP Server: ${MCP_CONFIG.url}`);

  return {
    connectionString,
    ...config,
    ssl: !isRender ? { rejectUnauthorized: false } : false,
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