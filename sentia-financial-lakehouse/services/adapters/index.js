import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import axios from 'axios';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Feature flags
const featureFlags = {
  xeroIntegration: process.env.FF_XERO_INTEGRATION === 'true',
  quickbooksIntegration: process.env.FF_QUICKBOOKS_INTEGRATION === 'true',
  sapIntegration: process.env.FF_SAP_INTEGRATION === 'true',
  realtimeSync: process.env.FF_REALTIME_SYNC === 'true',
  autoRetry: process.env.FF_AUTO_RETRY !== 'false',
  dataValidation: process.env.FF_DATA_VALIDATION !== 'false',
};

// Data source queue
const syncQueue = new Queue('data-sync', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Base adapter class
class DataAdapter {
  constructor(config) {
    this.config = config;
    this.name = config.type;
    this.enabled = config.enabled;
  }
  
  async connect() {
    throw new Error('connect() must be implemented');
  }
  
  async fetchData(options = {}) {
    throw new Error('fetchData() must be implemented');
  }
  
  async transform(data) {
    // Default transformation to standard format
    return data;
  }
  
  async validate(data) {
    if (!featureFlags.dataValidation) return true;
    
    // Basic validation
    return data && Array.isArray(data) && data.length > 0;
  }
}

// Xero adapter
class XeroAdapter extends DataAdapter {
  async connect() {
    if (!featureFlags.xeroIntegration) {
      throw new Error('Xero integration is disabled');
    }
    
    // Initialize Xero OAuth2 connection
    this.client = axios.create({
      baseURL: 'https://api.xero.com/api.xro/2.0',
      headers: {
        'Authorization': `Bearer ${this.config.credentials.apiKey}`,
        'Xero-tenant-id': this.config.credentials.tenantId,
      },
    });
    
    return true;
  }
  
  async fetchData(options = {}) {
    const { startDate, endDate } = options;
    
    // Fetch bank transactions
    const transactions = await this.client.get('/BankTransactions', {
      params: {
        where: `Date >= DateTime(${startDate}) AND Date <= DateTime(${endDate})`,
      },
    });
    
    // Fetch invoices
    const invoices = await this.client.get('/Invoices', {
      params: {
        where: `Date >= DateTime(${startDate}) AND Date <= DateTime(${endDate})`,
      },
    });
    
    return {
      transactions: transactions.data.BankTransactions,
      invoices: invoices.data.Invoices,
    };
  }
  
  async transform(data) {
    const transformed = [];
    
    // Transform bank transactions
    if (data.transactions) {
      data.transactions.forEach(tx => {
        transformed.push({
          id: tx.BankTransactionID,
          date: tx.Date,
          amount: tx.Total,
          type: tx.Type === 'RECEIVE' ? 'inflow' : 'outflow',
          category: tx.LineItems?.[0]?.AccountCode || 'uncategorized',
          description: tx.Reference,
          source: 'xero',
          currency: tx.CurrencyCode || 'USD',
        });
      });
    }
    
    // Transform invoices
    if (data.invoices) {
      data.invoices.forEach(inv => {
        transformed.push({
          id: inv.InvoiceID,
          date: inv.Date,
          amount: inv.Total,
          type: inv.Type === 'ACCREC' ? 'inflow' : 'outflow',
          category: 'invoice',
          description: `Invoice ${inv.InvoiceNumber}`,
          source: 'xero',
          currency: inv.CurrencyCode || 'USD',
        });
      });
    }
    
    return transformed;
  }
}

// QuickBooks adapter
class QuickBooksAdapter extends DataAdapter {
  async connect() {
    if (!featureFlags.quickbooksIntegration) {
      throw new Error('QuickBooks integration is disabled');
    }
    
    this.client = axios.create({
      baseURL: 'https://sandbox-quickbooks.api.intuit.com/v3',
      headers: {
        'Authorization': `Bearer ${this.config.credentials.apiKey}`,
        'Accept': 'application/json',
      },
    });
    
    return true;
  }
  
  async fetchData(options = {}) {
    const companyId = this.config.credentials.companyId;
    
    // Fetch transactions
    const response = await this.client.get(`/company/${companyId}/query`, {
      params: {
        query: `SELECT * FROM Purchase WHERE TxnDate >= '${options.startDate}' AND TxnDate <= '${options.endDate}'`,
      },
    });
    
    return response.data.QueryResponse;
  }
  
  async transform(data) {
    const transformed = [];
    
    if (data.Purchase) {
      data.Purchase.forEach(purchase => {
        transformed.push({
          id: purchase.Id,
          date: purchase.TxnDate,
          amount: purchase.TotalAmt,
          type: 'outflow',
          category: purchase.AccountRef?.name || 'uncategorized',
          description: purchase.PrivateNote || '',
          source: 'quickbooks',
          currency: purchase.CurrencyRef?.value || 'USD',
        });
      });
    }
    
    return transformed;
  }
}

// Mock adapter for testing
class MockAdapter extends DataAdapter {
  async connect() {
    logger.info('Mock adapter connected');
    return true;
  }
  
  async fetchData(options = {}) {
    // Generate mock financial data
    const days = 30;
    const data = [];
    const baseDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      // Random transactions
      for (let j = 0; j < Math.floor(Math.random() * 10) + 1; j++) {
        data.push({
          id: `mock-${i}-${j}`,
          date: date.toISOString(),
          amount: Math.random() * 10000,
          type: Math.random() > 0.5 ? 'inflow' : 'outflow',
          category: ['sales', 'expenses', 'payroll', 'inventory'][Math.floor(Math.random() * 4)],
          description: `Mock transaction ${i}-${j}`,
          source: 'mock',
          currency: 'USD',
        });
      }
    }
    
    return data;
  }
  
  async transform(data) {
    return data; // Already in standard format
  }
}

// Adapter factory
class AdapterFactory {
  static create(config) {
    switch (config.type) {
      case 'xero':
        return new XeroAdapter(config);
      case 'quickbooks':
        return new QuickBooksAdapter(config);
      case 'mock':
        return new MockAdapter(config);
      default:
        throw new Error(`Unknown adapter type: ${config.type}`);
    }
  }
}

// Store adapter configurations
const adapters = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'adapters',
    featureFlags,
    activeAdapters: Array.from(adapters.keys()),
    timestamp: new Date().toISOString(),
  });
});

// Register adapter
app.post('/register', async (req, res) => {
  try {
    const config = req.body;
    
    if (!config.type || !config.credentials) {
      return res.status(400).json({ error: 'Type and credentials required' });
    }
    
    const adapter = AdapterFactory.create(config);
    await adapter.connect();
    
    adapters.set(config.type, adapter);
    
    logger.info(`Registered adapter: ${config.type}`);
    
    res.json({
      success: true,
      adapter: config.type,
      enabled: adapter.enabled,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync data from adapter
app.post('/sync/:adapter', async (req, res) => {
  try {
    const { adapter: adapterName } = req.params;
    const { startDate, endDate } = req.body;
    
    const adapter = adapters.get(adapterName);
    if (!adapter) {
      return res.status(404).json({ error: 'Adapter not found' });
    }
    
    // Queue sync job
    const job = await syncQueue.add('sync', {
      adapter: adapterName,
      startDate,
      endDate,
    });
    
    res.json({
      success: true,
      jobId: job.id,
      status: 'queued',
    });
  } catch (error) {
    logger.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process sync jobs
syncQueue.process(async (job) => {
  const { adapter: adapterName, startDate, endDate } = job.data;
  
  logger.info(`Processing sync job for ${adapterName}`);
  
  const adapter = adapters.get(adapterName);
  if (!adapter) {
    throw new Error('Adapter not found');
  }
  
  // Fetch data
  const rawData = await adapter.fetchData({ startDate, endDate });
  
  // Transform data
  const transformedData = await adapter.transform(rawData);
  
  // Validate data
  const isValid = await adapter.validate(transformedData);
  if (!isValid) {
    throw new Error('Data validation failed');
  }
  
  // Send to lakehouse
  const lakehouseUrl = process.env.LAKEHOUSE_URL || 'http://localhost:8100';
  await axios.post(`${lakehouseUrl}/ingest/cash_flows`, {
    data: transformedData,
    schema: 'raw',
  });
  
  logger.info(`Synced ${transformedData.length} records from ${adapterName}`);
  
  return {
    recordsSync};})};

const PORT = process.env.ADAPTERS_PORT || 8103;
app.listen(PORT, () => {
  logger.info(`Adapters service running on port ${PORT}`);
  
  // Auto-register mock adapter for testing
  const mockAdapter = AdapterFactory.create({
    type: 'mock',
    enabled: true,
    credentials: {},
  });
  mockAdapter.connect();
  adapters.set('mock', mockAdapter);
});