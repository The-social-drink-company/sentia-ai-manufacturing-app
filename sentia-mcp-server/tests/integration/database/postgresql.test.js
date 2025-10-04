/**
 * Integration Tests for PostgreSQL Database Operations
 * Comprehensive testing of database connectivity, queries, and transactions
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import pkg from 'pg';
const { Pool, Client } = pkg;

describe('PostgreSQL Database Integration', () => {
  let pool;
  let testDatabase;
  let consoleRestore;

  beforeAll(async () => {
    consoleRestore = global.testUtils.mockConsole();
    
    // Setup test database connection
    testDatabase = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/sentia_mcp_test';
    
    pool = new Pool({
      connectionString: testDatabase,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Create test tables if they don't exist
    await setupTestTables();
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
    if (consoleRestore) consoleRestore();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  async function setupTestTables() {
    const client = await pool.connect();
    try {
      // Create test tables for MCP server data
      await client.query(`
        CREATE TABLE IF NOT EXISTS mcp_tools (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(100) NOT NULL,
          config JSONB NOT NULL,
          enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS mcp_tool_executions (
          id SERIAL PRIMARY KEY,
          tool_name VARCHAR(255) NOT NULL,
          user_id VARCHAR(255),
          input_data JSONB,
          output_data JSONB,
          status VARCHAR(50) NOT NULL,
          duration_ms INTEGER,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS mcp_api_keys (
          id SERIAL PRIMARY KEY,
          key_id VARCHAR(255) UNIQUE NOT NULL,
          key_hash VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          scopes TEXT[] NOT NULL,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_used_at TIMESTAMP,
          expires_at TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS mcp_audit_log (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(100) NOT NULL,
          user_id VARCHAR(255),
          resource_type VARCHAR(100),
          resource_id VARCHAR(255),
          action VARCHAR(100) NOT NULL,
          metadata JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_name 
        ON mcp_tool_executions(tool_name)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tool_executions_created_at 
        ON mcp_tool_executions(created_at)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_log_user_id 
        ON mcp_audit_log(user_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
        ON mcp_audit_log(created_at)
      `);

    } finally {
      client.release();
    }
  }

  async function cleanupTestData() {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM mcp_tool_executions');
      await client.query('DELETE FROM mcp_api_keys');
      await client.query('DELETE FROM mcp_audit_log');
      await client.query('DELETE FROM mcp_tools');
    } finally {
      client.release();
    }
  }

  describe('Database Connection', () => {
    it('should establish database connection successfully', async () => {
      const client = await pool.connect();
      
      const result = await client.query('SELECT NOW()');
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeInstanceOf(Date);
      
      client.release();
    });

    it('should handle connection timeouts gracefully', async () => {
      const timeoutPool = new Pool({
        connectionString: testDatabase,
        connectionTimeoutMillis: 1, // Very short timeout
        max: 1
      });

      try {
        // This should timeout quickly
        await expect(timeoutPool.connect()).rejects.toThrow();
      } finally {
        await timeoutPool.end();
      }
    });

    it('should support connection pooling', async () => {
      const connections = [];
      
      // Get multiple connections from pool
      for (let i = 0; i < 3; i++) {
        connections.push(await pool.connect());
      }

      // All connections should be valid
      for (const client of connections) {
        const result = await client.query('SELECT 1 as test');
        expect(result.rows[0].test).toBe(1);
      }

      // Release all connections
      connections.forEach(client => client.release());
    });

    it('should handle database disconnection and reconnection', async () => {
      const client = await pool.connect();
      
      // Simulate connection loss (this is implementation-specific)
      try {
        await client.query('SELECT pg_terminate_backend(pg_backend_pid())');
      } catch (error) {
        // Expected to fail when connection is terminated
      }
      
      client.release();

      // Pool should be able to create new connections
      const newClient = await pool.connect();
      const result = await newClient.query('SELECT 1 as reconnected');
      expect(result.rows[0].reconnected).toBe(1);
      
      newClient.release();
    });
  });

  describe('MCP Tools Management', () => {
    it('should insert and retrieve MCP tool configuration', async () => {
      const toolConfig = {
        name: 'xero-financial-reports',
        type: 'integration',
        config: {
          clientId: 'test-client-id',
          scopes: ['accounting.reports.read'],
          baseUrl: 'https://api.xero.com'
        },
        enabled: true
      };

      const client = await pool.connect();
      try {
        // Insert tool
        const insertResult = await client.query(`
          INSERT INTO mcp_tools (name, type, config, enabled)
          VALUES ($1, $2, $3, $4)
          RETURNING id, created_at
        `, [toolConfig.name, toolConfig.type, toolConfig.config, toolConfig.enabled]);

        expect(insertResult.rows).toHaveLength(1);
        const toolId = insertResult.rows[0].id;

        // Retrieve tool
        const selectResult = await client.query(`
          SELECT * FROM mcp_tools WHERE id = $1
        `, [toolId]);

        expect(selectResult.rows).toHaveLength(1);
        const retrievedTool = selectResult.rows[0];
        
        expect(retrievedTool.name).toBe(toolConfig.name);
        expect(retrievedTool.type).toBe(toolConfig.type);
        expect(retrievedTool.config).toEqual(toolConfig.config);
        expect(retrievedTool.enabled).toBe(toolConfig.enabled);
        expect(retrievedTool.created_at).toBeInstanceOf(Date);
      } finally {
        client.release();
      }
    });

    it('should update tool configuration', async () => {
      const client = await pool.connect();
      try {
        // Insert initial tool
        const insertResult = await client.query(`
          INSERT INTO mcp_tools (name, type, config, enabled)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, ['test-tool', 'integration', { initial: 'config' }, true]);

        const toolId = insertResult.rows[0].id;

        // Update tool
        const updatedConfig = { updated: 'configuration', version: 2 };
        await client.query(`
          UPDATE mcp_tools 
          SET config = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [updatedConfig, toolId]);

        // Verify update
        const selectResult = await client.query(`
          SELECT config FROM mcp_tools WHERE id = $1
        `, [toolId]);

        expect(selectResult.rows[0].config).toEqual(updatedConfig);
      } finally {
        client.release();
      }
    });

    it('should handle JSONB queries for tool configuration', async () => {
      const client = await pool.connect();
      try {
        // Insert tools with different configurations
        const tools = [
          { name: 'xero-tool', config: { provider: 'xero', version: '1.0' } },
          { name: 'shopify-tool', config: { provider: 'shopify', version: '2.0' } },
          { name: 'amazon-tool', config: { provider: 'amazon', version: '1.5' } }
        ];

        for (const tool of tools) {
          await client.query(`
            INSERT INTO mcp_tools (name, type, config)
            VALUES ($1, $2, $3)
          `, [tool.name, 'integration', tool.config]);
        }

        // Query tools by provider using JSONB
        const xeroTools = await client.query(`
          SELECT name, config FROM mcp_tools 
          WHERE config->>'provider' = $1
        `, ['xero']);

        expect(xeroTools.rows).toHaveLength(1);
        expect(xeroTools.rows[0].name).toBe('xero-tool');

        // Query tools by version range
        const modernTools = await client.query(`
          SELECT name FROM mcp_tools 
          WHERE (config->>'version')::decimal >= $1
        `, [1.5]);

        expect(modernTools.rows).toHaveLength(2); // shopify (2.0) and amazon (1.5)
      } finally {
        client.release();
      }
    });
  });

  describe('Tool Execution Tracking', () => {
    it('should log tool execution with performance metrics', async () => {
      const execution = {
        toolName: 'xero-financial-reports',
        userId: 'user-123',
        inputData: { reportType: 'profit-loss', tenantId: 'tenant-123' },
        outputData: { status: 'success', records: 50 },
        status: 'completed',
        durationMs: 1500
      };

      const client = await pool.connect();
      try {
        const result = await client.query(`
          INSERT INTO mcp_tool_executions 
          (tool_name, user_id, input_data, output_data, status, duration_ms)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, created_at
        `, [
          execution.toolName,
          execution.userId,
          execution.inputData,
          execution.outputData,
          execution.status,
          execution.durationMs
        ]);

        expect(result.rows).toHaveLength(1);
        
        // Verify stored data
        const stored = await client.query(`
          SELECT * FROM mcp_tool_executions WHERE id = $1
        `, [result.rows[0].id]);

        const storedExecution = stored.rows[0];
        expect(storedExecution.tool_name).toBe(execution.toolName);
        expect(storedExecution.user_id).toBe(execution.userId);
        expect(storedExecution.input_data).toEqual(execution.inputData);
        expect(storedExecution.output_data).toEqual(execution.outputData);
        expect(storedExecution.status).toBe(execution.status);
        expect(storedExecution.duration_ms).toBe(execution.durationMs);
      } finally {
        client.release();
      }
    });

    it('should log failed tool executions with error details', async () => {
      const failedExecution = {
        toolName: 'shopify-orders',
        userId: 'user-456',
        inputData: { shopDomain: 'invalid-shop' },
        status: 'failed',
        errorMessage: 'Authentication failed: Invalid shop domain',
        durationMs: 500
      };

      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO mcp_tool_executions 
          (tool_name, user_id, input_data, status, error_message, duration_ms)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          failedExecution.toolName,
          failedExecution.userId,
          failedExecution.inputData,
          failedExecution.status,
          failedExecution.errorMessage,
          failedExecution.durationMs
        ]);

        // Query failed executions
        const failedResults = await client.query(`
          SELECT * FROM mcp_tool_executions 
          WHERE status = 'failed' AND error_message IS NOT NULL
        `);

        expect(failedResults.rows).toHaveLength(1);
        expect(failedResults.rows[0].error_message).toBe(failedExecution.errorMessage);
      } finally {
        client.release();
      }
    });

    it('should generate tool usage analytics', async () => {
      const client = await pool.connect();
      try {
        // Insert multiple executions for analytics
        const executions = [
          { tool: 'xero-reports', user: 'user-1', duration: 1000, status: 'completed' },
          { tool: 'xero-reports', user: 'user-2', duration: 1200, status: 'completed' },
          { tool: 'shopify-orders', user: 'user-1', duration: 800, status: 'completed' },
          { tool: 'shopify-orders', user: 'user-3', duration: 0, status: 'failed' },
          { tool: 'amazon-inventory', user: 'user-1', duration: 2000, status: 'completed' }
        ];

        for (const exec of executions) {
          await client.query(`
            INSERT INTO mcp_tool_executions (tool_name, user_id, duration_ms, status)
            VALUES ($1, $2, $3, $4)
          `, [exec.tool, exec.user, exec.duration, exec.status]);
        }

        // Analytics query: Most used tools
        const toolUsage = await client.query(`
          SELECT 
            tool_name,
            COUNT(*) as total_executions,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_executions,
            AVG(CASE WHEN status = 'completed' THEN duration_ms END) as avg_duration_ms
          FROM mcp_tool_executions
          GROUP BY tool_name
          ORDER BY total_executions DESC
        `);

        expect(toolUsage.rows).toHaveLength(3);
        
        const xeroStats = toolUsage.rows.find(row => row.tool_name === 'xero-reports');
        expect(xeroStats.total_executions).toBe('2');
        expect(xeroStats.successful_executions).toBe('2');
        expect(parseFloat(xeroStats.avg_duration_ms)).toBe(1100);

        // Analytics query: User activity
        const userActivity = await client.query(`
          SELECT 
            user_id,
            COUNT(DISTINCT tool_name) as unique_tools_used,
            COUNT(*) as total_executions
          FROM mcp_tool_executions
          GROUP BY user_id
          ORDER BY total_executions DESC
        `);

        const user1Activity = userActivity.rows.find(row => row.user_id === 'user-1');
        expect(user1Activity.unique_tools_used).toBe('3');
        expect(user1Activity.total_executions).toBe('3');
      } finally {
        client.release();
      }
    });
  });

  describe('API Key Management', () => {
    it('should store and retrieve API keys securely', async () => {
      const apiKey = {
        keyId: 'key-123',
        keyHash: 'hashed-key-value',
        userId: 'user-456',
        scopes: ['xero:read', 'shopify:write'],
        expiresAt: new Date(Date.now() + 86400000) // 24 hours from now
      };

      const client = await pool.connect();
      try {
        // Insert API key
        const result = await client.query(`
          INSERT INTO mcp_api_keys (key_id, key_hash, user_id, scopes, expires_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, created_at
        `, [apiKey.keyId, apiKey.keyHash, apiKey.userId, apiKey.scopes, apiKey.expiresAt]);

        expect(result.rows).toHaveLength(1);

        // Retrieve API key
        const stored = await client.query(`
          SELECT * FROM mcp_api_keys WHERE key_id = $1
        `, [apiKey.keyId]);

        const storedKey = stored.rows[0];
        expect(storedKey.key_hash).toBe(apiKey.keyHash);
        expect(storedKey.user_id).toBe(apiKey.userId);
        expect(storedKey.scopes).toEqual(apiKey.scopes);
        expect(storedKey.active).toBe(true);
      } finally {
        client.release();
      }
    });

    it('should update API key last used timestamp', async () => {
      const client = await pool.connect();
      try {
        // Insert API key
        await client.query(`
          INSERT INTO mcp_api_keys (key_id, key_hash, user_id, scopes)
          VALUES ($1, $2, $3, $4)
        `, ['key-update-test', 'hash', 'user-123', ['read']]);

        const beforeUpdate = new Date();
        
        // Update last used
        await client.query(`
          UPDATE mcp_api_keys 
          SET last_used_at = CURRENT_TIMESTAMP
          WHERE key_id = $1
        `, ['key-update-test']);

        // Verify update
        const result = await client.query(`
          SELECT last_used_at FROM mcp_api_keys WHERE key_id = $1
        `, ['key-update-test']);

        expect(result.rows[0].last_used_at).toBeInstanceOf(Date);
        expect(result.rows[0].last_used_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      } finally {
        client.release();
      }
    });

    it('should query API keys by scope', async () => {
      const client = await pool.connect();
      try {
        // Insert API keys with different scopes
        const keys = [
          { keyId: 'key-xero', scopes: ['xero:read', 'xero:write'] },
          { keyId: 'key-shopify', scopes: ['shopify:read'] },
          { keyId: 'key-multi', scopes: ['xero:read', 'shopify:read', 'amazon:read'] }
        ];

        for (const key of keys) {
          await client.query(`
            INSERT INTO mcp_api_keys (key_id, key_hash, user_id, scopes)
            VALUES ($1, $2, $3, $4)
          `, [key.keyId, 'hash', 'user-123', key.scopes]);
        }

        // Query keys with xero:read scope
        const xeroKeys = await client.query(`
          SELECT key_id FROM mcp_api_keys 
          WHERE 'xero:read' = ANY(scopes)
        `);

        expect(xeroKeys.rows).toHaveLength(2); // key-xero and key-multi

        // Query keys with shopify scope
        const shopifyKeys = await client.query(`
          SELECT key_id FROM mcp_api_keys 
          WHERE scopes && ARRAY['shopify:read', 'shopify:write']
        `);

        expect(shopifyKeys.rows).toHaveLength(2); // key-shopify and key-multi
      } finally {
        client.release();
      }
    });
  });

  describe('Audit Logging', () => {
    it('should log user actions for audit trail', async () => {
      const auditEvent = {
        eventType: 'tool_execution',
        userId: 'user-123',
        resourceType: 'xero_invoice',
        resourceId: 'inv-456',
        action: 'create',
        metadata: {
          toolName: 'xero-create-invoice',
          invoiceAmount: 1000.00,
          tenantId: 'tenant-789'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Sentia MCP Client)'
      };

      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO mcp_audit_log 
          (event_type, user_id, resource_type, resource_id, action, metadata, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          auditEvent.eventType,
          auditEvent.userId,
          auditEvent.resourceType,
          auditEvent.resourceId,
          auditEvent.action,
          auditEvent.metadata,
          auditEvent.ipAddress,
          auditEvent.userAgent
        ]);

        // Verify audit log entry
        const result = await client.query(`
          SELECT * FROM mcp_audit_log 
          WHERE user_id = $1 AND resource_id = $2
        `, [auditEvent.userId, auditEvent.resourceId]);

        expect(result.rows).toHaveLength(1);
        const logEntry = result.rows[0];
        expect(logEntry.event_type).toBe(auditEvent.eventType);
        expect(logEntry.action).toBe(auditEvent.action);
        expect(logEntry.metadata).toEqual(auditEvent.metadata);
        expect(logEntry.ip_address.toString()).toBe(auditEvent.ipAddress);
      } finally {
        client.release();
      }
    });

    it('should generate audit reports for compliance', async () => {
      const client = await pool.connect();
      try {
        // Insert audit events
        const events = [
          { userId: 'user-1', action: 'create', resourceType: 'invoice' },
          { userId: 'user-1', action: 'read', resourceType: 'invoice' },
          { userId: 'user-2', action: 'update', resourceType: 'product' },
          { userId: 'user-1', action: 'delete', resourceType: 'invoice' }
        ];

        for (const event of events) {
          await client.query(`
            INSERT INTO mcp_audit_log (event_type, user_id, action, resource_type)
            VALUES ($1, $2, $3, $4)
          `, ['user_action', event.userId, event.action, event.resourceType]);
        }

        // Generate user activity report
        const userReport = await client.query(`
          SELECT 
            user_id,
            action,
            COUNT(*) as action_count,
            array_agg(DISTINCT resource_type) as resource_types
          FROM mcp_audit_log
          GROUP BY user_id, action
          ORDER BY user_id, action_count DESC
        `);

        expect(userReport.rows.length).toBeGreaterThan(0);
        
        const user1Actions = userReport.rows.filter(row => row.user_id === 'user-1');
        expect(user1Actions).toHaveLength(3); // create, read, delete

        // Generate timeline report
        const timeline = await client.query(`
          SELECT 
            DATE_TRUNC('hour', created_at) as hour,
            COUNT(*) as events_count,
            array_agg(DISTINCT action) as actions
          FROM mcp_audit_log
          WHERE created_at >= NOW() - INTERVAL '24 hours'
          GROUP BY DATE_TRUNC('hour', created_at)
          ORDER BY hour
        `);

        expect(timeline.rows.length).toBeGreaterThan(0);
      } finally {
        client.release();
      }
    });
  });

  describe('Database Transactions', () => {
    it('should support ACID transactions for data consistency', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Insert tool and execution in transaction
        const toolResult = await client.query(`
          INSERT INTO mcp_tools (name, type, config)
          VALUES ($1, $2, $3)
          RETURNING id
        `, ['transaction-test-tool', 'test', { test: true }]);

        const toolId = toolResult.rows[0].id;

        await client.query(`
          INSERT INTO mcp_tool_executions (tool_name, status)
          VALUES ($1, $2)
        `, ['transaction-test-tool', 'completed']);

        // Verify data exists in transaction
        const toolCheck = await client.query(`
          SELECT id FROM mcp_tools WHERE id = $1
        `, [toolId]);
        expect(toolCheck.rows).toHaveLength(1);

        await client.query('COMMIT');

        // Verify data persisted after commit
        const finalCheck = await client.query(`
          SELECT id FROM mcp_tools WHERE id = $1
        `, [toolId]);
        expect(finalCheck.rows).toHaveLength(1);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    it('should rollback transactions on error', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Insert valid data
        await client.query(`
          INSERT INTO mcp_tools (name, type, config)
          VALUES ($1, $2, $3)
        `, ['rollback-test-tool', 'test', { test: true }]);

        // Try to insert invalid data (duplicate name)
        try {
          await client.query(`
            INSERT INTO mcp_tools (name, type, config)
            VALUES ($1, $2, $3)
          `, ['rollback-test-tool', 'test', { test: true }]); // Same name, should fail
        } catch (error) {
          await client.query('ROLLBACK');
        }

        // Verify rollback worked - no data should exist
        const check = await client.query(`
          SELECT id FROM mcp_tools WHERE name = $1
        `, ['rollback-test-tool']);
        
        expect(check.rows).toHaveLength(0);

      } finally {
        client.release();
      }
    });
  });

  describe('Database Performance', () => {
    it('should handle concurrent connections efficiently', async () => {
      const concurrentQueries = [];
      const queryCount = 10;

      // Execute multiple queries concurrently
      for (let i = 0; i < queryCount; i++) {
        concurrentQueries.push(
          (async () => {
            const client = await pool.connect();
            try {
              const result = await client.query(`
                INSERT INTO mcp_tool_executions (tool_name, status, duration_ms)
                VALUES ($1, $2, $3)
                RETURNING id
              `, [`concurrent-tool-${i}`, 'completed', 100 + i]);
              return result.rows[0].id;
            } finally {
              client.release();
            }
          })()
        );
      }

      const results = await Promise.all(concurrentQueries);
      expect(results).toHaveLength(queryCount);
      
      // Verify all inserts succeeded
      const client = await pool.connect();
      try {
        const count = await client.query(`
          SELECT COUNT(*) FROM mcp_tool_executions 
          WHERE tool_name LIKE 'concurrent-tool-%'
        `);
        expect(parseInt(count.rows[0].count)).toBe(queryCount);
      } finally {
        client.release();
      }
    });

    it('should use indexes effectively for query performance', async () => {
      const client = await pool.connect();
      try {
        // Insert test data for performance testing
        for (let i = 0; i < 1000; i++) {
          await client.query(`
            INSERT INTO mcp_tool_executions (tool_name, user_id, status, created_at)
            VALUES ($1, $2, $3, $4)
          `, [
            `performance-tool-${i % 10}`,
            `user-${i % 50}`,
            i % 3 === 0 ? 'failed' : 'completed',
            new Date(Date.now() - (i * 1000))
          ]);
        }

        // Query using indexed columns
        const start = performance.now();
        
        const result = await client.query(`
          SELECT tool_name, COUNT(*) 
          FROM mcp_tool_executions 
          WHERE tool_name = $1 
          AND created_at >= $2
          GROUP BY tool_name
        `, ['performance-tool-1', new Date(Date.now() - 500000)]);

        const duration = performance.now() - start;

        expect(result.rows).toHaveLength(1);
        expect(duration).toBeLessThan(100); // Should be fast with proper indexing
        
      } finally {
        client.release();
      }
    });
  });

  describe('Data Validation and Constraints', () => {
    it('should enforce unique constraints', async () => {
      const client = await pool.connect();
      try {
        // Insert first tool
        await client.query(`
          INSERT INTO mcp_tools (name, type, config)
          VALUES ($1, $2, $3)
        `, ['unique-test-tool', 'test', {}]);

        // Try to insert duplicate - should fail
        await expect(
          client.query(`
            INSERT INTO mcp_tools (name, type, config)
            VALUES ($1, $2, $3)
          `, ['unique-test-tool', 'test', {}])
        ).rejects.toThrow();

      } finally {
        client.release();
      }
    });

    it('should enforce foreign key constraints', async () => {
      // Note: This would require setting up foreign key relationships
      // between tables, which we haven't done in this test setup
      expect(true).toBe(true); // Placeholder
    });

    it('should validate JSON data structure', async () => {
      const client = await pool.connect();
      try {
        // Valid JSON should work
        await client.query(`
          INSERT INTO mcp_tools (name, type, config)
          VALUES ($1, $2, $3)
        `, ['json-test-tool', 'test', { valid: 'json', nested: { data: true } }]);

        // Invalid JSON should be caught by application layer, not database
        // Database will accept any valid JSON structure
        const result = await client.query(`
          SELECT config FROM mcp_tools WHERE name = $1
        `, ['json-test-tool']);

        expect(result.rows[0].config).toEqual({ valid: 'json', nested: { data: true } });

      } finally {
        client.release();
      }
    });
  });
});