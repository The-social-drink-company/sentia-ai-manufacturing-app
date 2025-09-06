// Database configuration optimized for Railway + Neon PostgreSQL
// Addresses connection timeouts and vector database performance

import { logInfo, logWarn, logError } from '../services/observability/structuredLogger.js';

export const databaseConfig = {
  // Neon PostgreSQL connection configuration
  connection: {
    host: process.env.DATABASE_HOST || process.env.PGHOST,
    port: parseInt(process.env.DATABASE_PORT || process.env.PGPORT || '5432'),
    database: process.env.DATABASE_NAME || process.env.PGDATABASE,
    user: process.env.DATABASE_USER || process.env.PGUSER,
    password: process.env.DATABASE_PASSWORD || process.env.PGPASSWORD,
    
    // Critical: SSL configuration for Neon
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false, // Required for Neon
      ca: process.env.DATABASE_CA_CERT,
      key: process.env.DATABASE_CLIENT_KEY,
      cert: process.env.DATABASE_CLIENT_CERT,
    } : false,
    
    // Connection optimization for Railway deployment
    connectionTimeoutMillis: 10000, // 10 seconds
    idleTimeoutMillis: 30000, // 30 seconds
    max: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '5'), // Max 5 connections on Railway
    min: 1, // Minimum 1 connection
    
    // Neon-specific optimizations
    application_name: `sentia-dashboard-${process.env.NODE_ENV || 'development'}`,
    statement_timeout: 60000, // 1 minute
    query_timeout: 30000, // 30 seconds
    
    // Vector database optimizations
    search_path: 'public,extensions', // Include extensions schema for pgvector
  },
  
  // Pool configuration for high-performance vector operations
  pool: {
    min: 1,
    max: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '5'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 20000,
    
    // Handle connection errors gracefully
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  
  // Vector database specific configuration
  vector: {
    // pgvector extension settings
    enableExtension: true,
    dimensionality: 1536, // OpenAI embedding size
    indexType: 'ivfflat', // or 'hnsw' for larger datasets
    
    // Performance tuning for vector operations
    maintenanceWorkMem: '512MB',
    sharedPreloadLibraries: 'vector',
    maxParallelWorkers: 4,
    
    // Vector search optimization
    vectorSearchLimit: 100,
    similarityThreshold: 0.8,
  },
  
  // Migration and schema configuration
  migrations: {
    directory: './database/migrations',
    tableName: 'knex_migrations',
    schemaName: 'public',
    disableTransactions: false,
  },
  
  seeds: {
    directory: './database/seeds',
  },
  
  // Environment-specific overrides
  development: {
    debug: true,
    pool: { min: 1, max: 2 },
    connection: {
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    }
  },
  
  test: {
    connection: {
      database: process.env.TEST_DATABASE_NAME || 'sentia_dashboard_test',
    },
    pool: { min: 1, max: 1 },
    migrations: {
      directory: './database/migrations',
    }
  },
  
  production: {
    debug: false,
    pool: {
      min: 1,
      max: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '5'),
      acquireTimeoutMillis: 30000,
    },
    connection: {
      // Production SSL is required for Neon
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      statement_timeout: 120000, // 2 minutes for complex vector queries
    }
  }
};

// Connection string builder for different environments
export const buildConnectionString = (env = process.env.NODE_ENV) => {
  const config = databaseConfig.connection;
  
  // Use DATABASE_URL if available (Railway/Neon standard)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Build connection string manually
  const ssl = env === 'production' ? '?sslmode=require' : '';
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}${ssl}`;
};

// Test database connection
export const testConnection = async (pool) => {
  try {
    const client = await pool.connect();
    
    // Test basic connectivity
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    logInfo('Database connected successfully');
    logInfo('Database server details', {
      serverTime: result.rows[0].current_time,
      postgresVersion: result.rows[0].pg_version.split(' ')[0]
    });
    
    // Test vector extension if enabled
    if (databaseConfig.vector.enableExtension) {
      try {
        await client.query('SELECT extversion FROM pg_extension WHERE extname = $1', ['vector']);
        logInfo('Vector extension (pgvector) is available');
      } catch (vectorError) {
        logWarn('Vector extension not available', vectorError);
      }
    }
    
    client.release();
    return true;
    
  } catch (error) {
    logError('Database connection failed', {
      error: error.message,
      troubleshooting: [
        'Check DATABASE_URL or individual DB config variables',
        'Verify SSL configuration for production',
        'Confirm network connectivity to Neon'
      ]
    });
    return false;
  }
};

// Vector database utilities
export const vectorUtils = {
  // Create vector table
  createVectorTable: async (client, tableName, dimensions = 1536) => {
    const query = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(${dimensions}) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create vector similarity index
      CREATE INDEX IF NOT EXISTS ${tableName}_embedding_idx 
      ON ${tableName} USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `;
    
    await client.query(query);
  },
  
  // Perform vector similarity search
  similaritySearch: async (client, tableName, queryVector, limit = 10, threshold = 0.8) => {
    const query = `
      SELECT id, content, metadata, 
             1 - (embedding <=> $1::vector) AS similarity
      FROM ${tableName}
      WHERE 1 - (embedding <=> $1::vector) > $3
      ORDER BY embedding <=> $1::vector
      LIMIT $2;
    `;
    
    const result = await client.query(query, [JSON.stringify(queryVector), limit, threshold]);
    return result.rows;
  }
};

export default databaseConfig;