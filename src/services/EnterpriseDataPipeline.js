import { Readable, Writable, Transform, pipeline } from 'stream';
import { PrismaClient } from '@prisma/client';
import Bull from 'bull';
import Redis from 'ioredis';
import axios from 'axios';
import Papa from 'papaparse';
import fs from 'fs';
import { EventEmitter } from 'events';

const REQUIRED_ENV = [
  'REDIS_URL',
  'FINANCIAL_AGGREGATOR_URL',
  'FINANCIAL_AGGREGATOR_TOKEN',
  'DATA_WAREHOUSE_API',
  'DATA_WAREHOUSE_TOKEN',
  'ANALYTICS_STREAM_URL',
  'OPS_ALERT_WEBHOOK'
];

const ensureEnvVars = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`EnterpriseDataPipeline missing env vars: ${missing.join(', ')}`);
  }
};

const ONE_MINUTE = 60_000;
const FIVE_MINUTES = 300_000;

export class EnterpriseDataPipeline extends EventEmitter {
  constructor() {
    super();
    ensureEnvVars();
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL);
    this.pollers = new Map();
    this.metrics = new Map();
    this.initializeQueues();
    this.setupDataStreams();
    this.initializeMonitoring();
  }

  initializeQueues() {
    const redisConfig = { redis: { url: process.env.REDIS_URL } };
    this.queues = {
      ingestion: new Bull('data-ingestion', redisConfig),
      processing: new Bull('data-processing', redisConfig),
      analysis: new Bull('data-analysis', redisConfig),
      alerts: new Bull('data-alerts', redisConfig)
    };
    this.setupQueueProcessors();
  }

  setupQueueProcessors() {
    this.queues.ingestion.process(async (job) => {
      const { type, payload } = job.data;
      const handlers = {
        banking: this.processBankingPayload.bind(this),
        accounting: this.processAccountingPayload.bind(this),
        erp: this.processERPPayload.bind(this),
        ecommerce: this.processEcommercePayload.bind(this),
        production: this.processProductionPayload.bind(this),
        market: this.processMarketPayload.bind(this)
      };
      const handler = handlers[type];
      if (!handler) {
        throw new Error(`Unknown ingestion type: ${type}`);
      }
      await handler(payload);
    });

    this.queues.processing.process(async (job) => {
      await this.performRealTimeAnalytics(job.data);
    });

    this.queues.analysis.process(async (job) => {
      await this.aggregateAnalytics(job.data);
    });

    this.queues.alerts.process(async (job) => {
      await this.dispatchAlert(job.data);
    });
  }

  setupDataStreams() {
    this.dataStreams = new Map();
  }

  initializeMonitoring() {
    this.on('pipeline-error', async (source, error) => {
      await this.handlePipelineError(source, error);
    });

    this.on('data-quality-issue', async (payload) => {
      console.warn('[data-quality-issue]', payload);
      await this.queues.alerts.add({ type: 'data-quality', payload });
    });
  }

  async startDataIngestion() {
    await Promise.all([
      this.ingestAccountingData(),
      this.ingestBankingData(),
      this.ingestERPData(),
      this.ingestEcommerceData(),
      this.ingestProductionData(),
      this.ingestMarketData()
    ]);
  }

  async ingestAccountingData() {
    const source = 'xero';
    const stream = new Readable({
      objectMode: true,
      async read() {
        try {
          const { data } = await axios.get(
            `${process.env.FINANCIAL_AGGREGATOR_URL}/xero/updates`,
            { headers: { Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}` } }
          );
          if (!data || !Array.isArray(data) || data.length === 0) {
            this.push(null);
            return;
          }
          data.forEach((item) => this.push({ ...item, sourceType: source }));
        } catch (error) {
          this.destroy(error);
        }
      }
    });

    pipeline(
      stream,
      this.createValidationTransform(source),
      this.createEnrichmentTransform(),
      this.createStorageWritable('accounting'),
      (err) => {
        if (err) this.emit('pipeline-error', source, err);
      }
    );
  }

  async ingestBankingData() {
    const poller = setInterval(async () => {
      try {
        const [transactions, balances] = await Promise.all([
          axios.get(`${process.env.FINANCIAL_AGGREGATOR_URL}/banking/transactions`, {
            headers: { Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}` }
          }),
          axios.get(`${process.env.FINANCIAL_AGGREGATOR_URL}/banking/balances`, {
            headers: { Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}` }
          })
        ]);

        await this.queues.ingestion.add({
          type: 'banking',
          payload: {
            transactions: transactions.data,
            balances: balances.data,
            fetchedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        this.emit('pipeline-error', 'banking', error);
      }
    }, ONE_MINUTE);

    this.pollers.set('banking', poller);
  }

  async ingestERPData() {
    const handler = async (req, res) => {
      try {
        const validated = await this.validateERPData(req.body);
        await this.queues.ingestion.add({ type: 'erp', payload: validated });
        res.status(200).json({ success: true });
      } catch (error) {
        this.emit('pipeline-error', 'erp', error);
        res.status(400).json({ error: error.message });
      }
    };
    this.registerWebhook('/webhooks/erp', handler);
  }

  async ingestEcommerceData() {
    const shopifyStream = await this.createShopifyStream();
    const amazonStream = await this.createAmazonStream();
    const merged = this.mergeStreams([shopifyStream, amazonStream]);
    merged.pipe(this.createEcommerceProcessor());
  }

  async ingestProductionData() {
    const productionStream = await this.createProductionStream();
    productionStream.pipe(this.createProductionProcessor());
  }

  async ingestMarketData() {
    const poller = setInterval(async () => {
      try {
        const { data } = await axios.get(`${process.env.FINANCIAL_AGGREGATOR_URL}/market/indices`, {
          headers: { Authorization: `Bearer ${process.env.FINANCIAL_AGGREGATOR_TOKEN}` }
        });
        await this.queues.ingestion.add({ type: 'market', payload: data });
      } catch (error) {
        this.emit('pipeline-error', 'market', error);
      }
    }, FIVE_MINUTES);
    this.pollers.set('market', poller);
  }

  createValidationTransform(source) {
    return new Transform({
      objectMode: true,
      async transform(chunk, encoding, callback) {
        try {
          const requiredFields = await this.getRequiredFields(source);
          const missingFields = requiredFields.filter((field) => chunk[field] === undefined || chunk[field] === null);
          if (missingFields.length) {
            this.emit('data-quality-issue', { source, missingFields, payload: chunk });
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }
          callback(null, chunk);
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  createEnrichmentTransform() {
    return new Transform({
      objectMode: true,
      async transform(chunk, encoding, callback) {
        try {
          const enriched = {
            ...chunk,
            workingCapital: Number(chunk.currentAssets || 0) - Number(chunk.currentLiabilities || 0),
            currentRatio: this.safeRatio(chunk.currentAssets, chunk.currentLiabilities),
            quickRatio: this.safeRatio((Number(chunk.currentAssets || 0) - Number(chunk.inventory || 0)), chunk.currentLiabilities),
            cashConversionCycle: Number(chunk.dso || 0) + Number(chunk.dio || 0) - Number(chunk.dpo || 0),
            assetTurnover: this.safeRatio(chunk.revenue, chunk.totalAssets),
            inventoryTurnover: this.safeRatio(chunk.cogs, chunk.averageInventory),
            grossMargin: this.safeMargin(chunk.revenue, chunk.cogs),
            ebitdaMargin: this.safeMargin(chunk.revenue, chunk.ebitda),
            processedAt: new Date().toISOString(),
            dataQuality: await this.assessDataQuality(chunk)
          };
          callback(null, enriched);
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  createStorageWritable(domain) {
    return new Writable({
      objectMode: true,
      async write(chunk, encoding, callback) {
        try {
          await this.storeInWarehouse(domain, chunk);
          await this.logIngestion(domain, chunk);
          await this.queues.processing.add(chunk);
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  async processBankingPayload(payload) {
    const startTime = Date.now();
    try {
      await this.storeInWarehouse('banking', payload);
      await this.queues.processing.add(payload);
      this.incrementMetric('recordsProcessed');
      this.updateMetric('lastProcessingTime', Date.now() - startTime);
    } catch (error) {
      this.incrementMetric('errorsCount');
      throw error;
    }
  }

  async processAccountingPayload(payload) {
    const startTime = Date.now();
    try {
      await this.storeInWarehouse('accounting', payload);
      await this.queues.processing.add(payload);
      this.incrementMetric('recordsProcessed');
      this.updateMetric('lastProcessingTime', Date.now() - startTime);
    } catch (error) {
      this.incrementMetric('errorsCount');
      throw error;
    }
  }

  async processERPPayload(payload) {
    const startTime = Date.now();
    try {
      await this.storeInWarehouse('erp', payload);
      await this.queues.processing.add(payload);
      this.incrementMetric('recordsProcessed');
      this.updateMetric('lastProcessingTime', Date.now() - startTime);
    } catch (error) {
      this.incrementMetric('errorsCount');
      throw error;
    }
  }

  async processEcommercePayload(payload) {
    await this.storeInWarehouse('ecommerce', payload);
    await this.queues.processing.add(payload);
  }

  async processProductionPayload(payload) {
    await this.storeInWarehouse('production', payload);
    await this.queues.processing.add(payload);
  }

  async processMarketPayload(payload) {
    await this.storeInWarehouse('market', payload);
    await this.queues.processing.add(payload);
  }

  async performRealTimeAnalytics(data) {
    const analytics = {
      timestamp: new Date().toISOString(),
      metrics: {
        cashPosition: await this.calculateCashPosition(data),
        burnRate: await this.calculateBurnRate(data),
        runway: await this.calculateRunway(data),
        workingCapitalTrend: await this.analyzeWorkingCapitalTrend(data),
        revenueGrowth: await this.calculateRevenueGrowth(data)
      },
      anomalies: await this.detectAnomalies(data),
      predictions: {
        cashFlow: await this.predictCashFlow(data, 180),
        revenue: await this.predictRevenue(data, 12),
        workingCapital: await this.predictWorkingCapital(data, 90)
      }
    };

    analytics.alerts = this.generateAlerts(analytics);
    await this.storeAnalytics(analytics);
    this.broadcastAnalytics(analytics);
    return analytics;
  }

  async detectAnomalies(data) {
    const stats = await this.calculateStatistics(data);
    const anomalies = [];
    Object.keys(stats).forEach((metric) => {
      const { q1, q3 } = stats[metric];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      if (data[metric] < lower || data[metric] > upper) {
        anomalies.push({
          metric,
          value: data[metric],
          expectedRange: [lower, upper],
          severity: this.calculateSeverity(data[metric], lower, upper),
          timestamp: new Date().toISOString()
        });
      }
    });
    const mlAnomalies = await this.detectMLAnomalies(data);
    return anomalies.concat(mlAnomalies);
  }

  async assessDataQuality(data) {
    const requiredFields = await this.getRequiredFields(data?.sourceType || 'generic');
    const missingFields = requiredFields.filter((field) => !data[field]);
    const quality = {
      completeness: requiredFields.length ? (requiredFields.length - missingFields.length) / requiredFields.length : 1,
      accuracy: await this.validateBusinessRules(data),
      consistency: await this.checkConsistency(data),
      timeliness: this.checkTimeliness(data)
    };

    quality.overall = (
      quality.completeness * 0.3 +
      quality.accuracy * 0.3 +
      quality.consistency * 0.2 +
      quality.timeliness * 0.2
    );

    if (quality.overall < 0.85) {
      this.emit('data-quality-issue', { data, quality });
    }

    return quality;
  }

  async validateBusinessRules(data) {
    const rules = await this.prisma.dataQualityRule.findMany({ where: { active: true } });
    if (!rules.length) return 1;
    const violations = await Promise.all(
      rules.map(async (rule) => {
        const { endpoint } = rule;
        const { data: result } = await axios.post(endpoint, { payload: data });
        return result.valid ? 0 : 1;
      })
    );
    const totalViolations = violations.reduce((acc, item) => acc + item, 0);
    return 1 - totalViolations / rules.length;
  }

  async checkConsistency(data) {
    const key = data.id || data.transactionId || data.orderId;
    if (!key) return 1;
    const existing = await this.prisma.dataConsistencySnapshot.findFirst({ where: { referenceId: key } });
    if (!existing) return 1;
    const mismatch = Object.keys(existing.snapshot || {}).filter((field) => existing.snapshot[field] !== data[field]);
    return mismatch.length ? Math.max(0, 1 - mismatch.length / Object.keys(existing.snapshot).length) : 1;
  }

  checkTimeliness(data) {
    const timestamp = new Date(data.timestamp || data.processedAt || Date.now()).getTime();
    const now = Date.now();
    const ageMinutes = (now - timestamp) / 60_000;
    if (ageMinutes < 5) return 1;
    if (ageMinutes > 60) return 0;
    return Math.max(0, 1 - ageMinutes / 60);
  }

  async handlePipelineError(source, error) {
    console.error(`Pipeline error in ${source}:`, error);
    await this.logError({ source, error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    const recovered = await this.attemptRecovery(source, error);
    if (!recovered) {
      await this.sendOpsAlert({
        severity: 'CRITICAL',
        source,
        error: error.message,
        stack: error.stack,
        action: 'Manual intervention required'
      });
    }
    return recovered;
  }

  async logError(payload) {
    await this.prisma.pipelineErrorLog.create({ data: payload });
  }

  async attemptRecovery(source, error) {
    try {
      switch (source) {
        case 'banking':
        case 'market':
          // restart poller
          const poller = this.pollers.get(source);
          if (poller) clearInterval(poller);
          if (source === 'banking') await this.ingestBankingData();
          if (source === 'market') await this.ingestMarketData();
          break;
        case 'xero':
        case 'accounting':
          await this.ingestAccountingData();
          break;
        default:
          break;
      }
      return true;
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }
  }

  async sendOpsAlert(payload) {
    await axios.post(process.env.OPS_ALERT_WEBHOOK, payload, { headers: { 'Content-Type': 'application/json' } });
  }

  safeRatio(numerator, denominator) {
    const num = Number(numerator || 0);
    const den = Number(denominator || 0);
    if (den === 0) return 0;
    return num / den;
  }

  safeMargin(revenue, metric) {
    const rev = Number(revenue || 0);
    if (rev === 0) return 0;
    return (rev - Number(metric || 0)) / rev;
  }

  mergeStreams(streams) {
    const merged = new Readable({ objectMode: true, read() {} });
    let ended = 0;
    const total = streams.length;
    streams.forEach((stream) => {
      stream.on('data', (chunk) => merged.push(chunk));
      stream.on('end', () => {
        ended += 1;
        if (ended === total) merged.push(null);
      });
      stream.on('error', (error) => this.emit('pipeline-error', 'stream-merge', error));
    });
    return merged;
  }

  registerWebhook(path, handler) {
    if (!this.webhooks) this.webhooks = new Map();
    this.webhooks.set(path, handler);
  }

  async processCSVUpload(file, type) {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file.path);
      const records = [];
      const errors = [];
      Papa.parse(stream, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: async (result) => {
          try {
            const validated = await this.validateCSVData(result.data, type);
            const inserted = await this.batchInsert(validated, type);
            await this.triggerRecalculations(type);
            resolve({ success: true, recordsProcessed: inserted.count, errors });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          errors.push(error);
        }
      });
    });
  }

  async storeInWarehouse(domain, payload) {
    await axios.post(
      `${process.env.DATA_WAREHOUSE_API}/ingest/${domain}`,
      { payload },
      { headers: { Authorization: `Bearer ${process.env.DATA_WAREHOUSE_TOKEN}` } }
    );
  }

  async logIngestion(domain, payload) {
    await this.prisma.ingestionLog.create({
      data: {
        domain,
        referenceId: payload.id || payload.transactionId || payload.orderId || null,
        receivedAt: new Date(),
        metadata: payload
      }
    });
  }

  async storeAnalytics(analytics) {
    await this.prisma.analyticsSnapshot.create({ data: analytics });
  }

  broadcastAnalytics(analytics) {
    this.emit('analytics-update', analytics);
  }

  async aggregateAnalytics(data) {
    await axios.post(`${process.env.DATA_WAREHOUSE_API}/analytics/aggregate`, data, {
      headers: { Authorization: `Bearer ${process.env.DATA_WAREHOUSE_TOKEN}` }
    });
  }

  async dispatchAlert(alert) {
    await axios.post(process.env.OPS_ALERT_WEBHOOK, alert, { headers: { 'Content-Type': 'application/json' } });
  }

  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {},
      metrics: {
        recordsProcessed: this.metrics.get('recordsProcessed') || 0,
        errorsCount: this.metrics.get('errorsCount') || 0,
        lastProcessingTime: this.metrics.get('lastProcessingTime') || 0,
        dataQuality: this.metrics.get('dataQuality') || 0
      },
      queues: {}
    };

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.components.database = { status: 'connected', latency: 0 };
    } catch (error) {
      health.components.database = { status: 'disconnected', error: error.message };
      health.status = 'degraded';
    }

    // Check Redis
    try {
      const start = Date.now();
      await this.redis.ping();
      health.components.redis = { status: 'connected', latency: Date.now() - start };
    } catch (error) {
      health.components.redis = { status: 'disconnected', error: error.message };
      health.status = 'degraded';
    }

    // Check external services
    const services = [
      { name: 'financial_aggregator', url: process.env.FINANCIAL_AGGREGATOR_URL },
      { name: 'data_warehouse', url: process.env.DATA_WAREHOUSE_API },
      { name: 'analytics_stream', url: process.env.ANALYTICS_STREAM_URL }
    ];

    for (const service of services) {
      try {
        const start = Date.now();
        await axios.head(service.url, { timeout: 5000 });
        health.components[service.name] = { status: 'reachable', latency: Date.now() - start };
      } catch (error) {
        health.components[service.name] = { status: 'unreachable', error: error.message };
        health.status = 'degraded';
      }
    }

    // Check queue health
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount()
        ]);
        health.queues[name] = { waiting, active, completed, failed };
      } catch (error) {
        health.queues[name] = { status: 'error', error: error.message };
      }
    }

    return health;
  }

  updateMetric(key, value) {
    this.metrics.set(key, value);
    this.emit('metric-update', { key, value, timestamp: new Date().toISOString() });
  }

  incrementMetric(key, amount = 1) {
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + amount);
    this.emit('metric-update', { key, value: current + amount, timestamp: new Date().toISOString() });
  }

  shutdown() {
    this.pollers.forEach((interval) => clearInterval(interval));
    Object.values(this.queues).forEach((queue) => queue.close());
    this.redis.disconnect();
    this.prisma.$disconnect();
  }

  // Placeholder analytics utilities (to be implemented with existing services)
  async calculateCashPosition(data) { return data.cashPosition || 0; }
  async calculateBurnRate(data) { return data.burnRate || 0; }
  async calculateRunway(data) { return data.runway || 0; }
  async analyzeWorkingCapitalTrend(data) { return data.workingCapitalTrend || []; }
  async calculateRevenueGrowth(data) { return data.revenueGrowth || 0; }
  async predictCashFlow(data, horizon) { return { horizon, forecast: [] }; }
  async predictRevenue(data, months) { return { months, forecast: [] }; }
  async predictWorkingCapital(data, horizon) { return { horizon, forecast: [] }; }
  async calculateStatistics(data) { return {}; }
  calculateSeverity(value, lower, upper) {
    if (value < lower) return 'low';
    if (value > upper) return 'high';
    return 'medium';
  }
  async detectMLAnomalies() { return []; }
  generateAlerts() { return []; }
  async getRequiredFields() { return []; }
  async validateERPData(data) { return data; }
  transformERPData(data) { return data; }
  async triggerAnalytics() {}
  async createShopifyStream() { return new Readable({ read() { this.push(null); } }); }
  async createAmazonStream() { return new Readable({ read() { this.push(null); } }); }
  createEcommerceProcessor() { return new Transform({ objectMode: true, transform(chunk, enc, cb) { cb(null, chunk); } }); }
  async createProductionStream() { return new Readable({ read() { this.push(null); } }); }
  createProductionProcessor() { return new Transform({ objectMode: true, transform(chunk, enc, cb) { cb(null, chunk); } }); }
  async validateCSVData(data) { return data; }
  async batchInsert(data) { return { count: data.length }; }
  async triggerRecalculations() {}
  async measureAccuracy() { return 1; }
  async measureConsistency() { return 1; }
  async measureTimeliness() { return 1; }
}

export default EnterpriseDataPipeline;
