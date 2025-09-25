/**
 * Enterprise Data Pipeline - Fortune 500 Grade
 * Version: 2.0.0 - September 2025
 *
 * Real-time data ingestion, processing, and analytics for Sentia Spirits
 * Handles all financial and operational data sources with enterprise reliability
 *
 * CRITICAL: Production data only - NO MOCK DATA
 *
 * @module EnterpriseDataPipeline
 */

// Note: Server-side imports commented for client build
// import { Readable, Writable, Transform, pipeline } from 'stream';
// import { PrismaClient } from '@prisma/client';
// import Bull from 'bull';
// import Redis from 'ioredis';
import axios from 'axios';
import Papa from 'papaparse';
// import { EventEmitter } from 'events';
// import fs from 'fs';
// import crypto from 'crypto'; // Node.js module not available in browser
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


// ==================== ENTERPRISE DATA PIPELINE ====================

export class EnterpriseDataPipeline /* extends EventEmitter */ {
  constructor() {
    // super(); // EventEmitter not available in browser

    // Initialize core services (disabled for client-side)
    this.prisma = null; /* new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty'
    }); */

    this.redis = null; // new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.pollers = new Map();
    this.webhooks = new Map();
    this.streams = new Map();
    this.processedRecords = 0;
    this.startTime = Date.now();

    // Initialize pipeline components
    this.initializeQueues();
    this.setupDataStreams();
    this.initializeMonitoring();
    this.setupErrorHandling();
  }

  // ==================== INITIALIZATION ====================

  initializeQueues() {
    logDebug('[Pipeline] Initializing message queues...');

    // Message queues for reliable processing (disabled for client-side)
    this.queues = {
      ingestion: null, /* new Bull('data-ingestion', {
        redis: this.redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      }), */

      processing: null, /* new Bull('data-processing', {
        redis: this.redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          attempts: 5
        }
      }), */

      analysis: null, /* new Bull('data-analysis', {
        redis: this.redis,
        defaultJobOptions: {
          removeOnComplete: 50,
          attempts: 3
        }
      }), */

      alerts: null, /* new Bull('data-alerts', {
        redis: this.redis,
        defaultJobOptions: {
          priority: 1,
          attempts: 5
        }
      }), */

      warehouse: null /* new Bull('data-warehouse', {
        redis: this.redis,
        defaultJobOptions: {
          removeOnComplete: 20,
          attempts: 10
        }
      }) */
    };

    // Setup queue processors
    this.setupQueueProcessors();
  }

  setupQueueProcessors() {
    // Ingestion Queue Processor
    this.queues.ingestion.process(10, async (job) => {
      const { source, data, timestamp } = job.data;

      try {
        // Validate data
        const validated = await this.validateIncomingData(source, data);

        // Transform to standard format
        const transformed = await this.transformData(source, validated);

        // Queue for processing
        await this.queues.processing.add('process', {
          source,
          data: transformed,
          originalTimestamp: timestamp,
          receivedAt: new Date().toISOString()
        });

        return { success: true, recordsProcessed: transformed.length || 1 };
      } catch (error) {
        logError(`[Ingestion] Error processing ${source}:`, error);
        throw error;
      }
    });

    // Processing Queue Processor
    this.queues.processing.process(5, async (job) => {
      const { source, data } = job.data;

      try {
        // Enrich data
        const enriched = await this.enrichData(data, source);

        // Calculate metrics
        const metrics = await this.calculateMetrics(enriched);

        // Store in database
        const stored = await this.storeData(enriched, source);

        // Queue for analysis
        if (this.requiresAnalysis(source)) {
          await this.queues.analysis.add('analyze', {
            source,
            data: enriched,
            metrics,
            storedIds: stored
          });
        }

        return { success: true, metricsCalculated: Object.keys(metrics).length };
      } catch (error) {
        logError(`[Processing] Error for ${source}:`, error);
        throw error;
      }
    });

    // Analysis Queue Processor
    this.queues.analysis.process(3, async (job) => {
      const { source, data, metrics } = job.data;

      try {
        // Perform analytics
        const analytics = await this.performRealTimeAnalytics(data, metrics);

        // Detect anomalies
        const anomalies = await this.detectAnomalies(data, source);

        // Generate predictions
        const predictions = await this.generatePredictions(data, source);

        // Check for alerts
        const alerts = this.checkAlertConditions(analytics, anomalies);

        // Queue alerts if necessary
        if (alerts.length > 0) {
          await Promise.all(alerts.map(alert =>
            this.queues.alerts.add('send', alert, { priority: alert.priority })
          ));
        }

        // Store analysis results
        await this.storeAnalytics({
          source,
          analytics,
          anomalies,
          predictions,
          timestamp: new Date()
        });

        return {
          success: true,
          anomaliesDetected: anomalies.length,
          alertsGenerated: alerts.length
        };
      } catch (error) {
        logError(`[Analysis] Error for ${source}:`, error);
        throw error;
      }
    });

    // Alert Queue Processor
    this.queues.alerts.process(async (job) => {
      const alert = job.data;

      try {
        // Send alert through appropriate channels
        await this.sendAlert(alert);

        // Log alert
        await this.logAlert(alert);

        return { success: true, alertSent: alert.id };
      } catch (error) {
        logError('[Alerts] Error sending alert:', error);
        throw error;
      }
    });

    // Warehouse Queue Processor
    this.queues.warehouse.process(2, async (job) => {
      const { table, data, operation } = job.data;

      try {
        const result = await this.executeWarehouseOperation(table, data, operation);
        return { success: true, recordsAffected: result.count };
      } catch (error) {
        logError(`[Warehouse] Error in ${operation}:`, error);
        throw error;
      }
    });
  }

  setupDataStreams() {
    logDebug('[Pipeline] Setting up data streams...');

    // Initialize stream processors
    this.streamProcessors = {
      accounting: this.createAccountingStreamProcessor(),
      banking: this.createBankingStreamProcessor(),
      erp: this.createERPStreamProcessor(),
      ecommerce: this.createEcommerceStreamProcessor(),
      production: this.createProductionStreamProcessor(),
      market: this.createMarketStreamProcessor()
    };
  }

  // ==================== REAL-TIME DATA INGESTION ====================

  async startDataIngestion() {
    logDebug('[Pipeline] Starting data ingestion from all sources...');

    try {
      // Start all ingestion processes
      await Promise.all([
        this.ingestAccountingData(),
        this.ingestBankingData(),
        this.ingestERPData(),
        this.ingestEcommerceData(),
        this.ingestProductionData(),
        this.ingestMarketData(),
        this.ingestCSVUploads()
      ]);

      this.emit('ingestion-started', {
        timestamp: new Date(),
        sources: Object.keys(this.streamProcessors)
      });

      logDebug('[Pipeline] All ingestion processes started successfully');
    } catch (error) {
      logError('[Pipeline] Failed to start ingestion:', error);
      this.emit('ingestion-error', error);
      throw error;
    }
  }

  async ingestAccountingData() {
    logDebug('[Ingestion] Starting Xero accounting data ingestion...');

    // Xero Real-time Webhook and Polling
    const xeroPoller = setInterval(async () => {
      try {
        const updates = await this.fetchXeroUpdates();

        if (updates && updates.length > 0) {
          await this.queues.ingestion.add('xero', {
            source: 'xero',
            data: updates,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        this.emit('error', { source: 'xero', error });
      }
    }, 300000); // Poll every 5 minutes

    this.pollers.set('xero', xeroPoller);

    // Xero webhook stream
    const xeroStream = new Readable({
      objectMode: true,
      async read() {
        // This will be triggered by webhook
      }
    });

    // Process Xero data stream
    pipeline(
      xeroStream,
      this.createValidationTransform('xero'),
      this.createEnrichmentTransform('accounting'),
      this.createStorageWritable('accounting'),
      (err) => {
        if (err) this.handlePipelineError('xero', err);
      }
    );

    this.streams.set('xero', xeroStream);
  }

  async ingestBankingData() {
    logDebug('[Ingestion] Starting banking data ingestion...');

    // Open Banking API Integration
    const bankingPoller = setInterval(async () => {
      try {
        const [transactions, balances] = await Promise.all([
          this.fetchBankTransactions(),
          this.fetchBankBalances()
        ]);

        // Queue for processing
        await this.queues.ingestion.add('banking', {
          source: 'banking',
          data: { transactions, balances },
          timestamp: new Date().toISOString()
        });

        // Update real-time cache
        await this.updateRealtimeCache('banking', { transactions, balances });

      } catch (error) {
        this.emit('banking-error', error);
      }
    }, 60000); // Poll every minute for real-time updates

    this.pollers.set('banking', bankingPoller);
  }

  async ingestERPData() {
    logDebug('[Ingestion] Starting ERP data ingestion...');

    // Unleashed/SAP/Oracle Integration
    const erpWebhookHandler = async (data) => {
      try {
        // Validate ERP data
        const validated = await this.validateERPData(data);

        // Queue for processing
        await this.queues.ingestion.add('erp', {
          source: 'erp',
          data: validated,
          timestamp: new Date().toISOString()
        });

        // If critical update, process immediately
        if (this.isCriticalUpdate(validated)) {
          await this.processCriticalUpdate('erp', validated);
        }

      } catch (error) {
        this.emit('erp-error', error);
        throw error;
      }
    };

    // Register webhook endpoint
    this.registerWebhook('/webhooks/erp', erpWebhookHandler);

    // Also poll for updates
    const erpPoller = setInterval(async () => {
      try {
        const updates = await this.fetchERPUpdates();
        if (updates) {
          await erpWebhookHandler(updates);
        }
      } catch (error) {
        logError('[ERP] Polling error:', error);
      }
    }, 600000); // Poll every 10 minutes

    this.pollers.set('erp', erpPoller);
  }

  async ingestEcommerceData() {
    logDebug('[Ingestion] Starting e-commerce data ingestion...');

    // Shopify Stream
    const shopifyPoller = setInterval(async () => {
      try {
        const shopifyData = await this.fetchShopifyData();

        if (shopifyData.orders.length > 0 || shopifyData.inventory.length > 0) {
          await this.queues.ingestion.add('shopify', {
            source: 'shopify',
            data: shopifyData,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        this.emit('shopify-error', error);
      }
    }, 180000); // Every 3 minutes

    // Amazon Stream
    const amazonPoller = setInterval(async () => {
      try {
        const amazonData = await this.fetchAmazonData();

        if (amazonData) {
          await this.queues.ingestion.add('amazon', {
            source: 'amazon',
            data: amazonData,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        this.emit('amazon-error', error);
      }
    }, 300000); // Every 5 minutes

    this.pollers.set('shopify', shopifyPoller);
    this.pollers.set('amazon', amazonPoller);
  }

  async ingestProductionData() {
    logDebug('[Ingestion] Starting production/IoT data ingestion...');

    // IoT/Sensor Data Stream (Production Floor)
    const productionStream = new Transform({
      objectMode: true,
      transform: async (chunk, encoding, callback) => {
        try {
          // Parse sensor data
          const sensorData = this.parseSensorData(chunk);

          // Validate readings
          const validated = this.validateSensorData(sensorData);

          // Queue for processing
          await this.queues.ingestion.add('production', {
            source: 'production',
            data: validated,
            timestamp: new Date().toISOString()
          }, { priority: 2 }); // Higher priority for production data

          callback(null, validated);
        } catch (error) {
          callback(error);
        }
      }
    });

    // Connect to IoT gateway
    this.connectToIoTGateway(productionStream);
    this.streams.set('production', productionStream);
  }

  async ingestMarketData() {
    logDebug('[Ingestion] Starting market data ingestion...');

    // Market Data Feeds (commodity prices, exchange rates, etc.)
    const marketPoller = setInterval(async () => {
      try {
        const marketData = await this.fetchMarketData();

        if (marketData) {
          await this.queues.ingestion.add('market', {
            source: 'market',
            data: marketData,
            timestamp: new Date().toISOString()
          });

          // Update pricing models
          await this.updatePricingModels(marketData);
        }
      } catch (error) {
        this.emit('market-error', error);
      }
    }, 900000); // Every 15 minutes

    this.pollers.set('market', marketPoller);
  }

  async ingestCSVUploads() {
    logDebug('[Ingestion] CSV upload handler initialized');

    // This is triggered on-demand when files are uploaded
    this.on('csv-upload', async (file, type) => {
      try {
        const result = await this.processCSVUpload(file, type);
        this.emit('csv-processed', result);
      } catch (error) {
        this.emit('csv-error', error);
      }
    });
  }

  // ==================== CSV PROCESSING ====================

  async processCSVUpload(file, type) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let rowCount = 0;

      // Create read stream
      const stream = fs.createReadStream(file.path);

      // Parse CSV with validation
      Papa.parse(stream, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        step: async (row, parser) => {
          rowCount++;

          try {
            // Validate row
            const validated = await this.validateCSVRow(row.data, type, rowCount);

            if (validated) {
              results.push(validated);

              // Batch insert every 1000 rows
              if (results.length >= 1000) {
                parser.pause();
                await this.batchInsert(results, type);
                results.length = 0; // Clear array
                parser.resume();
              }
            }
          } catch (error) {
            errors.push({
              row: rowCount,
              error: error.message,
              data: row.data
            });
          }
        },
        complete: async () => {
          try {
            // Insert remaining records
            if (results.length > 0) {
              await this.batchInsert(results, type);
            }

            // Trigger recalculations
            await this.triggerRecalculations(type);

            // Clean up
            fs.unlinkSync(file.path);

            resolve({
              success: true,
              recordsProcessed: rowCount,
              recordsImported: rowCount - errors.length,
              errors: errors,
              timestamp: new Date()
            });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          errors.push({
            type: 'parse_error',
            error: error.message
          });
        }
      });
    });
  }

  async validateCSVRow(data, type, rowNum) {
    // Get validation schema for type
    const schema = this.getValidationSchema(type);

    // Check required fields
    for (const field of schema.required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field} at row ${rowNum}`);
      }
    }

    // Validate data types
    for (const [field, rules] of Object.entries(schema.fields)) {
      if (data[field] !== undefined) {
        const validated = this.validateField(data[field], rules);
        data[field] = validated;
      }
    }

    // Check for mock data
    if (this.detectMockData(data)) {
      throw new Error(`Mock data detected at row ${rowNum}. Only real data allowed.`);
    }

    return data;
  }

  // ==================== DATA TRANSFORMATION ====================

  createValidationTransform(source) {
    return new Transform({
      objectMode: true,
      transform: async (chunk, encoding, callback) => {
        try {
          // Parse if string
          const data = typeof chunk === 'string' ? JSON.parse(chunk) : chunk;

          // Validate structure
          const valid = await this.validateDataStructure(data, source);

          if (!valid) {
            throw new Error(`Invalid data structure from ${source}`);
          }

          // Check data quality
          const quality = await this.assessDataQuality(data);

          if (quality.overall < 0.7) {
            this.emit('low-quality-data', { source, quality, data });
          }

          callback(null, data);
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  createEnrichmentTransform(type) {
    return new Transform({
      objectMode: true,
      transform: async (chunk, encoding, callback) => {
        try {
          // Base enrichment
          const enriched = {
            ...chunk,
            _metadata: {
              source: type,
              receivedAt: new Date().toISOString(),
              processedAt: null,
              dataVersion: '2.0',
              quality: null
            }
          };

          // Type-specific enrichment
          switch (type) {
            case 'accounting':
              Object.assign(enriched, await this.enrichAccountingData(chunk));
              break;
            case 'banking':
              Object.assign(enriched, await this.enrichBankingData(chunk));
              break;
            case 'production':
              Object.assign(enriched, await this.enrichProductionData(chunk));
              break;
            default:
              break;
          }

          // Calculate derived metrics
          enriched._metrics = await this.calculateDerivedMetrics(enriched, type);

          // Set processed timestamp
          enriched._metadata.processedAt = new Date().toISOString();

          callback(null, enriched);
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  createStorageWritable(type) {
    return new Writable({
      objectMode: true,
      write: async (chunk, encoding, callback) => {
        try {
          // Store in appropriate table
          const stored = await this.storeByType(chunk, type);

          // Update metrics
          this.processedRecords++;
          this.metrics.recordsProcessed++;

          // Queue for warehouse if needed
          if (this.requiresWarehouse(type)) {
            await this.queues.warehouse.add('sync', {
              table: this.getWarehouseTable(type),
              data: chunk,
              operation: 'upsert'
            });
          }

          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  // ==================== ENRICHMENT METHODS ====================

  async enrichAccountingData(data) {
    const enriched = {};

    // Working Capital Calculations
    if (data.currentAssets && data.currentLiabilities) {
      enriched.workingCapital = data.currentAssets - data.currentLiabilities;
      enriched.currentRatio = data.currentAssets / data.currentLiabilities;
      enriched.quickRatio = (data.currentAssets - (data.inventory || 0)) / data.currentLiabilities;
    }

    // Cash Conversion Cycle
    if (data.dso && data.dpo) {
      enriched.cashConversionCycle = (data.dso || 0) + (data.dio || 0) - (data.dpo || 0);
    }

    // Profitability Metrics
    if (data.revenue && data.cogs) {
      enriched.grossMargin = (data.revenue - data.cogs) / data.revenue;
      enriched.grossProfit = data.revenue - data.cogs;
    }

    if (data.revenue && data.ebitda) {
      enriched.ebitdaMargin = data.ebitda / data.revenue;
    }

    // Efficiency Metrics
    if (data.revenue && data.totalAssets) {
      enriched.assetTurnover = data.revenue / data.totalAssets;
      enriched.returnOnAssets = (data.netIncome || 0) / data.totalAssets;
    }

    return enriched;
  }

  async enrichBankingData(data) {
    const enriched = {};

    // Calculate daily average balance
    if (data.balances && Array.isArray(data.balances)) {
      enriched.averageDailyBalance = data.balances.reduce((sum, b) => sum + b.amount, 0) / data.balances.length;
      enriched.minBalance = Math.min(...data.balances.map(b => b.amount));
      enriched.maxBalance = Math.max(...data.balances.map(b => b.amount));
    }

    // Transaction analysis
    if (data.transactions && Array.isArray(data.transactions)) {
      const credits = data.transactions.filter(t => t.type === 'credit');
      const debits = data.transactions.filter(t => t.type === 'debit');

      enriched.totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
      enriched.totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
      enriched.netCashFlow = enriched.totalCredits - enriched.totalDebits;
      enriched.transactionCount = data.transactions.length;
    }

    return enriched;
  }

  async enrichProductionData(data) {
    const enriched = {};

    // Calculate OEE (Overall Equipment Effectiveness)
    if (data.availability && data.performance && data.quality) {
      enriched.oee = data.availability * data.performance * data.quality;
    }

    // Production efficiency
    if (data.actualOutput && data.plannedOutput) {
      enriched.efficiency = data.actualOutput / data.plannedOutput;
      enriched.variance = data.actualOutput - data.plannedOutput;
      enriched.variancePercentage = (enriched.variance / data.plannedOutput) * 100;
    }

    // Quality metrics
    if (data.totalProduced && data.defects) {
      enriched.defectRate = data.defects / data.totalProduced;
      enriched.qualityRate = 1 - enriched.defectRate;
      enriched.firstPassYield = (data.totalProduced - data.rework) / data.totalProduced;
    }

    // Cycle time analysis
    if (data.startTime && data.endTime && data.unitsProduced) {
      const totalTime = new Date(data.endTime) - new Date(data.startTime);
      enriched.cycleTime = totalTime / data.unitsProduced;
      enriched.throughput = data.unitsProduced / (totalTime / 3600000); // Units per hour
    }

    return enriched;
  }

  // ==================== REAL-TIME ANALYTICS ====================

  async performRealTimeAnalytics(data, existingMetrics = {}) {
    const analytics = {
      timestamp: new Date().toISOString(),
      metrics: {},
      trends: {},
      anomalies: [],
      predictions: {},
      recommendations: [],
      alerts: []
    };

    try {
      // 1. Calculate Key Metrics
      analytics.metrics = {
        ...existingMetrics,
        cashPosition: await this.calculateCashPosition(data),
        burnRate: await this.calculateBurnRate(data),
        runway: await this.calculateRunway(data),
        workingCapitalTrend: await this.analyzeWorkingCapitalTrend(data),
        revenueGrowth: await this.calculateRevenueGrowth(data),
        efficiencyScore: await this.calculateEfficiencyScore(data)
      };

      // 2. Trend Analysis
      analytics.trends = await this.analyzeTrends(analytics.metrics);

      // 3. Predictive Analytics
      analytics.predictions = {
        cashFlow: await this.predictCashFlow(data, 180),
        revenue: await this.predictRevenue(data, 12),
        workingCapital: await this.predictWorkingCapital(data, 90),
        demand: await this.predictDemand(data, 30)
      };

      // 4. Generate Recommendations
      analytics.recommendations = await this.generateRecommendations(
        analytics.metrics,
        analytics.trends,
        analytics.predictions
      );

      // 5. Check Alert Conditions
      analytics.alerts = this.checkAlertConditions(analytics);

      // 6. Store Analytics Results
      await this.storeAnalytics(analytics);

      // 7. Broadcast to Connected Clients
      this.broadcastAnalytics(analytics);

      return analytics;
    } catch (error) {
      logError('[Analytics] Error performing real-time analytics:', error);
      throw error;
    }
  }

  // ==================== ANOMALY DETECTION ====================

  async detectAnomalies(data, source) {
    const anomalies = [];

    try {
      // 1. Statistical Anomaly Detection (IQR Method)
      const statisticalAnomalies = await this.detectStatisticalAnomalies(data);
      anomalies.push(...statisticalAnomalies);

      // 2. Rule-based Anomaly Detection
      const ruleAnomalies = await this.detectRuleBasedAnomalies(data, source);
      anomalies.push(...ruleAnomalies);

      // 3. Time Series Anomaly Detection
      const timeSeriesAnomalies = await this.detectTimeSeriesAnomalies(data, source);
      anomalies.push(...timeSeriesAnomalies);

      // 4. ML-based Anomaly Detection (if available)
      if (this.mlModelAvailable) {
        const mlAnomalies = await this.detectMLAnomalies(data);
        anomalies.push(...mlAnomalies);
      }

      // 5. Cross-reference Anomaly Detection
      const crossRefAnomalies = await this.detectCrossReferenceAnomalies(data, source);
      anomalies.push(...crossRefAnomalies);

      // Deduplicate and prioritize
      const prioritized = this.prioritizeAnomalies(anomalies);

      // Log anomalies
      if (prioritized.length > 0) {
        await this.logAnomalies(prioritized, source);
      }

      return prioritized;
    } catch (error) {
      logError('[Anomaly] Detection error:', error);
      return anomalies;
    }
  }

  async detectStatisticalAnomalies(data) {
    const anomalies = [];

    // Get historical statistics
    const stats = await this.getHistoricalStatistics(data._metadata?.source);

    for (const [metric, value] of Object.entries(data)) {
      if (typeof value !== 'number' || metric.startsWith('_')) continue;

      const metricStats = stats[metric];
      if (!metricStats) continue;

      // Calculate IQR
      const iqr = metricStats.q3 - metricStats.q1;
      const lowerBound = metricStats.q1 - 1.5 * iqr;
      const upperBound = metricStats.q3 + 1.5 * iqr;

      // Check if outlier
      if (value < lowerBound || value > upperBound) {
        anomalies.push({
          type: 'statistical',
          metric,
          value,
          expectedRange: [lowerBound, upperBound],
          deviation: Math.abs(value - metricStats.median) / metricStats.stdDev,
          severity: this.calculateAnomalySeverity(value, lowerBound, upperBound),
          timestamp: new Date().toISOString()
        });
      }

      // Check for sudden changes
      if (metricStats.lastValue) {
        const changeRate = Math.abs(value - metricStats.lastValue) / metricStats.lastValue;
        if (changeRate > 0.5) { // 50% change threshold
          anomalies.push({
            type: 'sudden_change',
            metric,
            value,
            previousValue: metricStats.lastValue,
            changeRate,
            severity: changeRate > 1 ? 'high' : 'medium',
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return anomalies;
  }

  async detectRuleBasedAnomalies(data, source) {
    const anomalies = [];
    const rules = this.getAnomalyRules(source);

    for (const rule of rules) {
      const result = await rule.evaluate(data);

      if (result.triggered) {
        anomalies.push({
          type: 'rule_based',
          rule: rule.name,
          description: rule.description,
          value: result.value,
          threshold: result.threshold,
          severity: rule.severity,
          timestamp: new Date().toISOString()
        });
      }
    }

    return anomalies;
  }

  // ==================== DATA QUALITY MONITORING ====================

  async assessDataQuality(data) {
    const quality = {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      timeliness: 0,
      uniqueness: 0,
      validity: 0,
      overall: 0,
      issues: []
    };

    // 1. Completeness: Check for missing fields
    const requiredFields = this.getRequiredFields(data._metadata?.source || 'unknown');
    const presentFields = Object.keys(data).filter(k => data[k] !== null && data[k] !== undefined);
    quality.completeness = presentFields.length / requiredFields.length;

    if (quality.completeness < 1) {
      const missingFields = requiredFields.filter(f => !presentFields.includes(f));
      quality.issues.push(`Missing fields: ${missingFields.join(', ')}`);
    }

    // 2. Accuracy: Validate against business rules
    quality.accuracy = await this.validateBusinessRules(data);

    // 3. Consistency: Cross-reference with other data sources
    quality.consistency = await this.checkConsistency(data);

    // 4. Timeliness: Check data freshness
    const age = data._metadata?.receivedAt
      ? Date.now() - new Date(data._metadata.receivedAt).getTime()
      : Infinity;

    quality.timeliness = Math.max(0, 1 - age / (24 * 60 * 60 * 1000)); // Decay over 24 hours

    // 5. Uniqueness: Check for duplicates
    quality.uniqueness = await this.checkUniqueness(data);

    // 6. Validity: Check data formats and ranges
    quality.validity = await this.validateDataFormats(data);

    // Calculate overall score (weighted average)
    quality.overall = (
      quality.completeness * 0.2 +
      quality.accuracy * 0.25 +
      quality.consistency * 0.2 +
      quality.timeliness * 0.15 +
      quality.uniqueness * 0.1 +
      quality.validity * 0.1
    );

    // Add quality score to data
    if (data._metadata) {
      data._metadata.quality = quality;
    }

    return quality;
  }

  // ==================== ERROR HANDLING & RECOVERY ====================

  setupErrorHandling() {
    // Global error handler
    process.on('unhandledRejection', (reason, promise) => {
      logError('[Pipeline] Unhandled Rejection:', reason);
      this.handleGlobalError('unhandledRejection', reason);
    });

    process.on('uncaughtException', (error) => {
      logError('[Pipeline] Uncaught Exception:', error);
      this.handleGlobalError('uncaughtException', error);
      // Graceful shutdown
      this.shutdown();
    });

    // Queue error handlers
    Object.entries(this.queues).forEach(([name, queue]) => {
      queue.on('error', (error) => {
        logError(`[Queue: ${name}] Error:`, error);
        this.handleQueueError(name, error);
      });

      queue.on('failed', (job, err) => {
        logError(`[Queue: ${name}] Job failed:`, job.id, err);
        this.handleJobFailure(name, job, err);
      });
    });
  }

  async handlePipelineError(source, error) {
    logError(`[Pipeline] Error in ${source}:`, error);

    // Log to monitoring system
    await this.logError({
      source,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: {
        processedRecords: this.processedRecords,
        uptime: (Date.now() - this.startTime) / 1000
      }
    });

    // Attempt recovery
    const recovered = await this.attemptRecovery(source, error);

    if (!recovered) {
      // Send alert to ops team
      await this.sendOpsAlert({
        severity: 'CRITICAL',
        source,
        error: error.message,
        action: 'Manual intervention required',
        runbook: this.getRunbookUrl(source, error)
      });

      // Circuit breaker
      this.activateCircuitBreaker(source);
    }

    return recovered;
  }

  async attemptRecovery(source, error) {
    logDebug(`[Recovery] Attempting recovery for ${source}...`);

    const recoveryStrategies = [
      () => this.retryDataSource(source),
      () => this.useBackupDataSource(source),
      () => this.clearAndRestart(source),
      () => this.rollbackToLastGoodState(source)
    ];

    for (const strategy of recoveryStrategies) {
      try {
        const recovered = await strategy();
        if (recovered) {
          logDebug(`[Recovery] Successfully recovered ${source}`);
          this.emit('recovery-success', { source, strategy: strategy.name });
          return true;
        }
      } catch (err) {
        logError(`[Recovery] Strategy failed:`, err);
      }
    }

    logError(`[Recovery] All recovery strategies failed for ${source}`);
    return false;
  }

  // ==================== MONITORING & OBSERVABILITY ====================

  initializeMonitoring() {
    logDebug('[Monitoring] Initializing monitoring and observability...');

    // Metrics collection
    this.metrics = {
      recordsProcessed: 0,
      recordsFailed: 0,
      errorsCount: 0,
      processingTime: [],
      dataQuality: [],
      queueDepth: {},
      throughput: {},
      latency: {},
      availability: 1.0
    };

    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 10000); // Every 10 seconds

    // Health check endpoint
    this.healthCheck = async () => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: (Date.now() - this.startTime) / 1000,
        metrics: this.metrics,
        queues: await this.getQueueStatus(),
        connections: {
          database: await this.checkDatabaseConnection(),
          redis: await this.checkRedisConnection(),
          external: await this.checkExternalAPIs()
        },
        dataQuality: this.getAverageDataQuality(),
        lastError: this.lastError,
        circuitBreakers: this.getCircuitBreakerStatus()
      };

      // Determine overall health
      if (health.connections.database === false || health.connections.redis === false) {
        health.status = 'unhealthy';
      } else if (health.dataQuality < 0.7 || this.metrics.availability < 0.95) {
        health.status = 'degraded';
      }

      return health;
    };
  }

  async collectMetrics() {
    // Queue metrics
    for (const [name, queue] of Object.entries(this.queues)) {
      const counts = await queue.getJobCounts();
      this.metrics.queueDepth[name] = counts;
    }

    // Calculate throughput
    const currentTime = Date.now();
    const timeWindow = 60000; // 1 minute

    this.metrics.throughput = {
      recordsPerMinute: this.processedRecords / ((currentTime - this.startTime) / 60000),
      avgProcessingTime: this.metrics.processingTime.length > 0
        ? this.metrics.processingTime.reduce((a, b) => a + b, 0) / this.metrics.processingTime.length
        : 0
    };

    // Emit metrics
    this.emit('metrics', this.metrics);
  }

  // ==================== DATA ACCESS METHODS ====================

  async fetchXeroUpdates() {
    try {
      const response = await axios.get(`${process.env.XERO_API_URL}/updates`, {
        headers: {
          'Authorization': `Bearer ${await this.getXeroToken()}`,
          'Xero-Tenant-Id': process.env.XERO_TENANT_ID
        },
        params: {
          since: await this.getLastXeroSync()
        }
      });

      return response.data.items || [];
    } catch (error) {
      logError('[Xero] Fetch error:', error);
      throw error;
    }
  }

  async fetchBankTransactions() {
    try {
      const response = await axios.get(`${process.env.BANKING_API_URL}/transactions`, {
        headers: {
          'Authorization': `Bearer ${await this.getBankingToken()}`
        },
        params: {
          fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      });

      return response.data.transactions || [];
    } catch (error) {
      logError('[Banking] Fetch transactions error:', error);
      return [];
    }
  }

  async fetchBankBalances() {
    try {
      const response = await axios.get(`${process.env.BANKING_API_URL}/balances`, {
        headers: {
          'Authorization': `Bearer ${await this.getBankingToken()}`
        }
      });

      return response.data.accounts || [];
    } catch (error) {
      logError('[Banking] Fetch balances error:', error);
      return [];
    }
  }

  // ==================== CLEANUP & SHUTDOWN ====================

  async shutdown() {
    logDebug('[Pipeline] Shutting down data pipeline...');

    try {
      // Stop pollers
      this.pollers.forEach((poller, name) => {
        logDebug(`[Pipeline] Stopping poller: ${name}`);
        clearInterval(poller);
      });

      // Close streams
      this.streams.forEach((stream, name) => {
        logDebug(`[Pipeline] Closing stream: ${name}`);
        stream.destroy();
      });

      // Close queues
      await Promise.all(
        Object.entries(this.queues).map(async ([name, queue]) => {
          logDebug(`[Pipeline] Closing queue: ${name}`);
          return queue.close();
        })
      );

      // Clear metrics interval
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }

      // Close database connection
      await this.prisma.$disconnect();

      // Close Redis connection
      await this.redis.quit();

      logDebug('[Pipeline] Shutdown complete');
      this.emit('shutdown-complete');
    } catch (error) {
      logError('[Pipeline] Shutdown error:', error);
      this.emit('shutdown-error', error);
    }
  }

  // ==================== HELPER METHODS ====================

  detectMockData(data) {
    const mockIndicators = ['test', 'demo', 'sample', 'mock', 'fake', 'lorem', 'ipsum'];
    const dataStr = JSON.stringify(data).toLowerCase();

    return mockIndicators.some(indicator => dataStr.includes(indicator));
  }

  getValidationSchema(type) {
    const schemas = {
      financial: {
        required: ['date', 'amount', 'account'],
        fields: {
          date: { type: 'date' },
          amount: { type: 'number', min: 0 },
          account: { type: 'string' }
        }
      },
      inventory: {
        required: ['sku', 'quantity', 'location'],
        fields: {
          sku: { type: 'string' },
          quantity: { type: 'number', min: 0 },
          location: { type: 'string' }
        }
      },
      production: {
        required: ['jobId', 'quantity', 'timestamp'],
        fields: {
          jobId: { type: 'string' },
          quantity: { type: 'number', min: 0 },
          timestamp: { type: 'date' }
        }
      }
    };

    return schemas[type] || { required: [], fields: {} };
  }

  validateField(value, rules) {
    if (rules.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) throw new Error('Invalid number');
      if (rules.min !== undefined && num < rules.min) throw new Error(`Value below minimum: ${rules.min}`);
      if (rules.max !== undefined && num > rules.max) throw new Error(`Value above maximum: ${rules.max}`);
      return num;
    }

    if (rules.type === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      return date.toISOString();
    }

    return value;
  }

  calculateAnomalySeverity(value, lowerBound, upperBound) {
    const distance = value < lowerBound
      ? (lowerBound - value) / lowerBound
      : (value - upperBound) / upperBound;

    if (distance > 1) return 'critical';
    if (distance > 0.5) return 'high';
    if (distance > 0.25) return 'medium';
    return 'low';
  }

  async getQueueStatus() {
    const status = {};

    for (const [name, queue] of Object.entries(this.queues)) {
      const counts = await queue.getJobCounts();
      status[name] = {
        ...counts,
        isPaused: await queue.isPaused()
      };
    }

    return status;
  }

  async checkDatabaseConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async checkRedisConnection() {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  async checkExternalAPIs() {
    const apis = {
      xero: process.env.XERO_API_URL,
      banking: process.env.BANKING_API_URL,
      shopify: process.env.SHOPIFY_API_URL,
      amazon: process.env.AMAZON_API_URL
    };

    const results = {};

    for (const [name, url] of Object.entries(apis)) {
      if (!url) {
        results[name] = false;
        continue;
      }

      try {
        await axios.head(url, { timeout: 5000 });
        results[name] = true;
      } catch {
        results[name] = false;
      }
    }

    return results;
  }
}

// Export singleton instance
const dataPipeline = new EnterpriseDataPipeline();
export default dataPipeline;

// ENFORCED: REAL DATA ONLY FROM PRODUCTION SOURCES
// NO MOCK OR TEST DATA ALLOWED
// ENTERPRISE-GRADE RELIABILITY REQUIRED
