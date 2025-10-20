/**
 * Tenant-Aware Prisma Client - Multi-Tenant Database Layer
 *
 * BMAD-MULTITENANT-002 Story 4: Tenant-Aware Prisma Client
 *
 * This module provides a singleton Prisma client with tenant-aware helpers
 * for schema switching and isolated query execution.
 *
 * Key Features:
 * - Singleton pattern (prevents multiple connections in development)
 * - Connection pooling configuration
 * - Schema switching with automatic reset
 * - Error handling with search_path cleanup
 * - Type-safe tenant-scoped queries
 *
 * Usage:
 * ```ts
 * import { prisma, withTenantSchema } from './lib/prisma-tenant';
 *
 * // Use with tenant middleware (search_path already set)
 * const products = await prisma.product.findMany();
 *
 * // Manually execute query in specific tenant schema
 * const products = await withTenantSchema('tenant_abc123', async () => {
 *   return await prisma.product.findMany();
 * });
 * ```
 *
 * @module server/lib/prisma-tenant
 */

import { PrismaClient } from '@prisma/client';

// ================================
// Prisma Client Configuration
// ================================

/**
 * Singleton Prisma Client instance
 *
 * In production: Create single instance
 * In development: Reuse global instance to prevent hot-reload connection issues
 */
let prisma: PrismaClient;

/**
 * Global type for development environment
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Initialize Prisma Client with environment-specific configuration
 */
function initializePrisma(): PrismaClient {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const client = new PrismaClient({
    log: isDevelopment
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' }
        ]
      : ['error'],

    // Connection pooling configuration
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },

    // Error formatting
    errorFormat: isDevelopment ? 'pretty' : 'minimal'
  });

  // Development query logging
  if (isDevelopment) {
    client.$on('query' as never, (e: any) => {
      console.log('Query: ' + e.query);
      console.log('Duration: ' + e.duration + 'ms');
    });
  }

  return client;
}

/**
 * Get or create singleton Prisma client
 *
 * Production: Single instance
 * Development: Reuse global instance (prevents connection limit errors during hot-reload)
 */
if (process.env.NODE_ENV === 'production') {
  prisma = initializePrisma();
} else {
  if (!global.prisma) {
    global.prisma = initializePrisma();
  }
  prisma = global.prisma;
}

// ================================
// Tenant Schema Switching
// ================================

/**
 * Execute callback within a specific tenant schema
 *
 * This function:
 * 1. Sets PostgreSQL search_path to tenant schema
 * 2. Executes callback (all queries target tenant schema)
 * 3. Resets search_path to public (cleanup)
 * 4. Returns callback result
 *
 * **IMPORTANT**: Always resets search_path, even on error.
 *
 * @param schemaName - Tenant schema name (e.g., "tenant_abc123")
 * @param callback - Async function to execute in tenant schema
 * @returns Result of callback execution
 *
 * @example
 * // Execute query in specific tenant schema
 * const products = await withTenantSchema('tenant_abc123', async () => {
 *   return await prisma.product.findMany({
 *     where: { isActive: true }
 *   });
 * });
 *
 * @example
 * // Execute transaction in tenant schema
 * const result = await withTenantSchema('tenant_abc123', async () => {
 *   return await prisma.$transaction(async (tx) => {
 *     const product = await tx.product.create({ data: { ... } });
 *     const inventory = await tx.inventoryItem.create({ data: { ... } });
 *     return { product, inventory };
 *   });
 * });
 */
export async function withTenantSchema<T>(
  schemaName: string,
  callback: () => Promise<T>
): Promise<T> {
  try {
    // ====================================
    // STEP 1: Set search_path to tenant schema
    // ====================================
    await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`);

    console.log(`[PrismaTenant] Schema switched to: ${schemaName}`);

    // ====================================
    // STEP 2: Execute callback
    // ====================================
    const result = await callback();

    // ====================================
    // STEP 3: Reset search_path to public
    // ====================================
    await prisma.$executeRawUnsafe(`SET search_path TO public`);

    console.log(`[PrismaTenant] Schema reset to: public`);

    return result;

  } catch (error) {
    // ====================================
    // ERROR HANDLING: Always reset search_path
    // ====================================
    console.error(`[PrismaTenant] Error in tenant schema ${schemaName}:`, error);

    try {
      await prisma.$executeRawUnsafe(`SET search_path TO public`);
      console.log(`[PrismaTenant] Schema reset to public after error`);
    } catch (resetError) {
      console.error(`[PrismaTenant] CRITICAL: Failed to reset search_path after error:`, resetError);
    }

    throw error; // Re-throw original error
  }
}

/**
 * Execute raw SQL within a specific tenant schema
 *
 * Convenience wrapper for executing raw SQL queries in a tenant schema.
 * Automatically handles schema switching and cleanup.
 *
 * @param schemaName - Tenant schema name
 * @param sql - Raw SQL query string
 * @param params - Query parameters (optional)
 * @returns Query result
 *
 * @example
 * // Execute custom SQL in tenant schema
 * const result = await executeInTenantSchema(
 *   'tenant_abc123',
 *   'SELECT * FROM products WHERE category = $1',
 *   ['Electronics']
 * );
 */
export async function executeInTenantSchema<T = any>(
  schemaName: string,
  sql: string,
  params?: any[]
): Promise<T> {
  return withTenantSchema(schemaName, async () => {
    if (params && params.length > 0) {
      return await prisma.$queryRawUnsafe<T>(sql, ...params);
    } else {
      return await prisma.$queryRawUnsafe<T>(sql);
    }
  });
}

/**
 * Get current PostgreSQL search_path
 *
 * Useful for debugging and verifying schema context.
 *
 * @returns Current search_path value
 *
 * @example
 * const currentPath = await getCurrentSearchPath();
 * console.log('Current schema:', currentPath); // "tenant_abc123, public"
 */
export async function getCurrentSearchPath(): Promise<string> {
  const result = await prisma.$queryRaw<Array<{ search_path: string }>>`
    SHOW search_path
  `;

  return result[0]?.search_path || 'unknown';
}

/**
 * Verify that a tenant schema exists
 *
 * @param schemaName - Schema name to check
 * @returns true if schema exists, false otherwise
 *
 * @example
 * const exists = await tenantSchemaExists('tenant_abc123');
 * if (!exists) {
 *   throw new Error('Tenant schema not found');
 * }
 */
export async function tenantSchemaExists(schemaName: string): Promise<boolean> {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata
      WHERE schema_name = ${schemaName}
    ) as exists
  `;

  return result[0]?.exists || false;
}

/**
 * List all tenant schemas in database
 *
 * Useful for master admin dashboard and debugging.
 *
 * @returns Array of tenant schema names
 *
 * @example
 * const tenantSchemas = await listTenantSchemas();
 * console.log('Total tenants:', tenantSchemas.length);
 */
export async function listTenantSchemas(): Promise<string[]> {
  const result = await prisma.$queryRaw<Array<{ schema_name: string }>>`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'tenant_%'
    ORDER BY schema_name
  `;

  return result.map(row => row.schema_name);
}

// ================================
// Connection Management
// ================================

/**
 * Test database connection
 *
 * @returns true if connection successful, false otherwise
 *
 * @example
 * const isConnected = await testConnection();
 * if (!isConnected) {
 *   console.error('Database connection failed');
 * }
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[PrismaTenant] Connection test failed:', error);
    return false;
  }
}

/**
 * Gracefully disconnect from database
 *
 * Call this during server shutdown to properly close connections.
 *
 * @example
 * // In server shutdown handler
 * process.on('SIGTERM', async () => {
 *   await disconnect();
 *   process.exit(0);
 * });
 */
export async function disconnect(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('[PrismaTenant] Disconnected from database');
  } catch (error) {
    console.error('[PrismaTenant] Error disconnecting:', error);
  }
}

/**
 * Get database connection info
 *
 * @returns Database connection metadata
 *
 * @example
 * const info = await getConnectionInfo();
 * console.log('Database:', info.database);
 * console.log('Version:', info.version);
 */
export async function getConnectionInfo(): Promise<{
  database: string;
  version: string;
  poolSize: number;
}> {
  try {
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version()
    `;

    const databaseResult = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database()
    `;

    return {
      database: databaseResult[0]?.current_database || 'unknown',
      version: versionResult[0]?.version || 'unknown',
      poolSize: 10 // Default Prisma pool size
    };
  } catch (error) {
    console.error('[PrismaTenant] Error fetching connection info:', error);
    return {
      database: 'unknown',
      version: 'unknown',
      poolSize: 0
    };
  }
}

// ================================
// Export
// ================================

export { prisma };
export default prisma;
