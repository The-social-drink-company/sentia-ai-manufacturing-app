import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { Database } from 'duckdb';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize DuckDB
const db = new Database(':memory:');
const conn = db.connect();

// Initialize lakehouse schema
const initializeLakehouse = () => {
  logger.info('Initializing DuckDB lakehouse...');
  
  // Create schemas
  conn.run(`CREATE SCHEMA IF NOT EXISTS raw`);
  conn.run(`CREATE SCHEMA IF NOT EXISTS staging`);
  conn.run(`CREATE SCHEMA IF NOT EXISTS analytics`);
  
  // Create raw data tables
  conn.run(`
    CREATE TABLE IF NOT EXISTS raw.cash_flows (
      id VARCHAR PRIMARY KEY,
      timestamp TIMESTAMP,
      source VARCHAR,
      amount DECIMAL(15,2),
      currency VARCHAR(3),
      type VARCHAR,
      category VARCHAR,
      description VARCHAR,
      metadata JSON,
      ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  conn.run(`
    CREATE TABLE IF NOT EXISTS raw.transactions (
      id VARCHAR PRIMARY KEY,
      date DATE,
      account VARCHAR,
      amount DECIMAL(15,2),
      currency VARCHAR(3),
      counterparty VARCHAR,
      reference VARCHAR,
      source_system VARCHAR,
      raw_data JSON,
      ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create staging tables with transformations
  conn.run(`
    CREATE TABLE IF NOT EXISTS staging.daily_cash_position AS
    SELECT 
      DATE_TRUNC('day', timestamp) as date,
      currency,
      SUM(CASE WHEN type = 'inflow' THEN amount ELSE -amount END) as net_flow,
      SUM(CASE WHEN type = 'inflow' THEN amount ELSE 0 END) as total_inflow,
      SUM(CASE WHEN type = 'outflow' THEN amount ELSE 0 END) as total_outflow,
      COUNT(*) as transaction_count
    FROM raw.cash_flows
    WHERE 1=0
    GROUP BY DATE_TRUNC('day', timestamp), currency
  `);
  
  // Create analytics views
  conn.run(`
    CREATE TABLE IF NOT EXISTS analytics.liquidity_metrics (
      date DATE,
      cash_on_hand DECIMAL(15,2),
      available_credit DECIMAL(15,2),
      current_ratio DECIMAL(5,2),
      quick_ratio DECIMAL(5,2),
      cash_conversion_cycle INTEGER,
      days_payable_outstanding INTEGER,
      days_receivable_outstanding INTEGER,
      days_inventory_outstanding INTEGER,
      calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  logger.info('Lakehouse initialized successfully');
};

initializeLakehouse();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'lakehouse',
    timestamp: new Date().toISOString()
  });
});

// Data ingestion endpoint
app.post('/ingest/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { data, schema = 'raw' } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    logger.info(`Ingesting ${data.length} records into ${schema}.${table}`);
    
    // Convert to Parquet for efficient storage
    const parquetPath = path.join(__dirname, '../../data/parquet', `${table}_${Date.now()}.parquet`);
    
    // Insert into DuckDB
    const stmt = conn.prepare(`INSERT INTO ${schema}.${table} VALUES (?)`);
    data.forEach(record => {
      stmt.run(JSON.stringify(record));
    });
    stmt.finalize();
    
    res.json({ 
      success: true, 
      recordsIngested: data.length,
      table: `${schema}.${table}`
    });
  } catch (error) {
    logger.error('Ingestion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Query endpoint
app.post('/query', async (req, res) => {
  try {
    const { sql, params = [] } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query required' });
    }
    
    logger.info(`Executing query: ${sql.substring(0, 100)}...`);
    
    const result = conn.all(sql, ...params);
    
    res.json({
      success: true,
      data: result,
      rowCount: result.length
    });
  } catch (error) {
    logger.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoint
app.get('/analytics/:metric', async (req, res) => {
  try {
    const { metric } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    let sql;
    switch (metric) {
      case 'cash-flow':
        sql = `
          SELECT 
            DATE_TRUNC('${groupBy}', timestamp) as period,
            SUM(CASE WHEN type = 'inflow' THEN amount ELSE -amount END) as net_flow,
            SUM(CASE WHEN type = 'inflow' THEN amount ELSE 0 END) as inflow,
            SUM(CASE WHEN type = 'outflow' THEN amount ELSE 0 END) as outflow
          FROM raw.cash_flows
          WHERE timestamp BETWEEN ? AND ?
          GROUP BY DATE_TRUNC('${groupBy}', timestamp)
          ORDER BY period
        `;
        break;
      
      case 'liquidity':
        sql = `
          SELECT * FROM analytics.liquidity_metrics
          WHERE date BETWEEN ? AND ?
          ORDER BY date
        `;
        break;
      
      case 'working-capital':
        sql = `
          SELECT 
            date,
            cash_on_hand,
            days_receivable_outstanding * (SELECT AVG(amount) FROM raw.cash_flows WHERE type = 'inflow') as receivables,
            days_payable_outstanding * (SELECT AVG(amount) FROM raw.cash_flows WHERE type = 'outflow') as payables,
            (cash_on_hand + (days_receivable_outstanding * (SELECT AVG(amount) FROM raw.cash_flows WHERE type = 'inflow')) 
             - (days_payable_outstanding * (SELECT AVG(amount) FROM raw.cash_flows WHERE type = 'outflow'))) as working_capital
          FROM analytics.liquidity_metrics
          WHERE date BETWEEN ? AND ?
          ORDER BY date
        `;
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid metric' });
    }
    
    const result = conn.all(sql, startDate || '2024-01-01', endDate || '2024-12-31');
    
    res.json({
      metric,
      period: { start: startDate, end: endDate },
      data: result
    });
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export to Parquet
app.post('/export/parquet', async (req, res) => {
  try {
    const { table, outputPath } = req.body;
    
    const exportPath = outputPath || path.join(__dirname, '../../data/exports', `${table}_${Date.now()}.parquet`);
    
    conn.run(`COPY ${table} TO '${exportPath}' (FORMAT PARQUET)`);
    
    res.json({
      success: true,
      exportPath,
      table
    });
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.LAKEHOUSE_PORT || 8100;
app.listen(PORT, () => {
  logger.info(`Lakehouse service running on port ${PORT}`);
});