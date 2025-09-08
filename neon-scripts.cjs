#!/usr/bin/env node
/**
 * Neon Database Management Scripts
 * Alternative to neonctl CLI for database operations
 */

const { Client } = require('pg');
require('dotenv').config();

const DATABASES = {
  development: process.env.DEV_DATABASE_URL || process.env.DATABASE_URL,
  production: process.env.DATABASE_URL,
  test: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
};

class NeonManager {
  constructor(environment = 'development') {
    this.environment = environment;
    this.connectionString = DATABASES[environment];
    
    if (!this.connectionString) {
      throw new Error(`No database URL configured for environment: ${environment}`);
    }
  }

  async connect() {
    this.client = new Client(this.connectionString);
    await this.client.connect();
    console.log(`✅ Connected to Neon database (${this.environment})`);
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      console.log(`🔌 Disconnected from Neon database`);
    }
  }

  async query(sql, params = []) {
    if (!this.client) {
      await this.connect();
    }
    
    try {
      const result = await this.client.query(sql, params);
      return result;
    } catch (error) {
      console.error('❌ Query failed:', error.message);
      throw error;
    }
  }

  async listTables() {
    const result = await this.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log(`📊 Tables in ${this.environment} database:`);
    result.rows.forEach(row => console.log(`  - ${row.tablename}`));
    return result.rows;
  }

  async getTableInfo(tableName) {
    const result = await this.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position;
    `, [tableName]);

    console.log(`📋 Structure of table '${tableName}':`);
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    return result.rows;
  }

  async getDatabaseStats() {
    const queries = {
      size: "SELECT pg_size_pretty(pg_database_size(current_database())) as size;",
      tables: "SELECT count(*) as count FROM pg_tables WHERE schemaname = 'public';",
      connections: "SELECT count(*) as count FROM pg_stat_activity;"
    };

    const stats = {};
    for (const [key, sql] of Object.entries(queries)) {
      const result = await this.query(sql);
      stats[key] = result.rows[0];
    }

    console.log(`📈 Database Statistics (${this.environment}):`);
    console.log(`  Database Size: ${stats.size.size}`);
    console.log(`  Tables: ${stats.tables.count}`);
    console.log(`  Active Connections: ${stats.connections.count}`);
    
    return stats;
  }

  async testConnection() {
    try {
      await this.connect();
      const result = await this.query('SELECT version(), current_database(), current_user;');
      const info = result.rows[0];
      
      console.log(`🔍 Connection Test Results:`);
      console.log(`  Database: ${info.current_database}`);
      console.log(`  User: ${info.current_user}`);
      console.log(`  Version: ${info.version.split(' ').slice(0, 2).join(' ')}`);
      
      await this.disconnect();
      return true;
    } catch (error) {
      console.error(`❌ Connection test failed:`, error.message);
      return false;
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1] || 'development';

  const neon = new NeonManager(environment);

  try {
    switch (command) {
      case 'test':
        await neon.testConnection();
        break;
      
      case 'tables':
        await neon.connect();
        await neon.listTables();
        await neon.disconnect();
        break;
      
      case 'stats':
        await neon.connect();
        await neon.getDatabaseStats();
        await neon.disconnect();
        break;
      
      case 'info':
        const tableName = args[2];
        if (!tableName) {
          console.error('❌ Please provide table name: node neon-scripts.js info <environment> <table_name>');
          process.exit(1);
        }
        await neon.connect();
        await neon.getTableInfo(tableName);
        await neon.disconnect();
        break;
      
      case 'query':
        const sql = args[2];
        if (!sql) {
          console.error('❌ Please provide SQL query: node neon-scripts.js query <environment> "SELECT * FROM table"');
          process.exit(1);
        }
        await neon.connect();
        const result = await neon.query(sql);
        console.log('📋 Query Results:');
        console.table(result.rows);
        await neon.disconnect();
        break;
      
      default:
        console.log(`
🔧 Neon Database Management Scripts

Usage: node neon-scripts.js <command> [environment] [args]

Commands:
  test [env]              Test database connection
  tables [env]            List all tables
  stats [env]             Show database statistics
  info [env] <table>      Show table structure
  query [env] "<sql>"     Execute SQL query

Environments: development, production, test

Examples:
  node neon-scripts.js test development
  node neon-scripts.js tables production
  node neon-scripts.js info development users
  node neon-scripts.js query development "SELECT COUNT(*) FROM users"
        `);
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { NeonManager };