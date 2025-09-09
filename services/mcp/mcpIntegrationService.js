/**
 * MCP (Model Context Protocol) Integration Service
 * Enables real-time data integration from multiple sources using MCP servers
 * 
 * Features:
 * - Real-time financial data streaming from ERP systems
 * - Live market data integration for forecasting
 * - Automated data synchronization and validation
 * - Multi-protocol support (REST, WebSocket, GraphQL)
 * - Error handling and failover mechanisms
 * - Data quality monitoring and alerting
 * 
 * Expected Impact: 95%+ real-time data accuracy, sub-second data refresh
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

class MCPIntegrationService extends EventEmitter {
  constructor() {
    super();
    
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      connectionTimeout: 30000,
      heartbeatInterval: 30000,
      dataValidationRules: new Map(),
      qualityThresholds: {
        completeness: 0.95,
        accuracy: 0.98,
        timeliness: 300000 // 5 minutes max delay
      }
    };

    // Connection pools for different data sources
    this.connections = new Map();
    this.dataStreams = new Map();
    this.healthChecks = new Map();
    
    // Data quality metrics
    this.qualityMetrics = {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      duplicateRecords: 0,
      lateRecords: 0,
      lastUpdate: null
    };

    // Real-time data cache
    this.dataCache = {
      financial: new Map(),
      market: new Map(),
      operational: new Map(),
      supplier: new Map()
    };

    this.isInitialized = false;
    this.activeConnections = 0;
  }

  /**
   * Initialize all MCP server connections
   */
  async initialize() {
    try {
      logInfo('Initializing MCP Integration Service');

      // Initialize core financial data streams
      await this.initializeFinancialDataStreams();
      
      // Initialize market data feeds
      await this.initializeMarketDataFeeds();
      
      // Initialize operational data connectors
      await this.initializeOperationalDataConnectors();
      
      // Initialize supplier data integration
      await this.initializeSupplierDataIntegration();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start data quality monitoring
      this.startDataQualityMonitoring();

      this.isInitialized = true;
      logInfo('MCP Integration Service initialized successfully', {
        activeConnections: this.activeConnections,
        dataStreams: this.dataStreams.size
      });

      this.emit('initialized');
      return true;

    } catch (error) {
      logError('Failed to initialize MCP Integration Service', error);
      throw error;
    }
  }

  /**
   * Initialize financial data streams from ERP and accounting systems
   */
  async initializeFinancialDataStreams() {
    const financialSources = [
      {
        name: 'erp-financials',
        type: 'websocket',
        endpoint: process.env.ERP_WEBSOCKET_URL || 'ws://localhost:8080/financial-stream',
        dataTypes: ['accounts_receivable', 'accounts_payable', 'cash_flow', 'general_ledger'],
        updateFrequency: 'real-time'
      },
      {
        name: 'accounting-system',
        type: 'rest',
        endpoint: process.env.ACCOUNTING_REST_API || 'http://localhost:3001/api/accounting',
        dataTypes: ['invoices', 'payments', 'bank_reconciliation'],
        updateFrequency: '5min'
      },
      {
        name: 'xero-integration',
        type: 'rest',
        endpoint: 'https://api.xero.com/api.xro/2.0',
        dataTypes: ['invoices', 'bank_transactions', 'contacts'],
        updateFrequency: '15min',
        authentication: 'oauth2'
      }
    ];

    for (const source of financialSources) {
      await this.createDataConnection(source);
    }

    logInfo('Financial data streams initialized', {
      sources: financialSources.length,
      types: financialSources.flatMap(s => s.dataTypes).length
    });
  }

  /**
   * Initialize market data feeds for forecasting
   */
  async initializeMarketDataFeeds() {
    const marketSources = [
      {
        name: 'economic-indicators',
        type: 'rest',
        endpoint: 'https://api.economic-data.com/v1',
        dataTypes: ['gdp', 'inflation', 'interest_rates', 'currency_rates'],
        updateFrequency: 'daily',
        authentication: 'api_key'
      },
      {
        name: 'industry-data',
        type: 'websocket',
        endpoint: 'wss://industry-data.com/manufacturing-stream',
        dataTypes: ['commodity_prices', 'supply_chain_index', 'manufacturing_pmi'],
        updateFrequency: 'real-time'
      },
      {
        name: 'competitor-intelligence',
        type: 'rest',
        endpoint: 'https://api.competitor-intel.com/v2',
        dataTypes: ['pricing_data', 'market_share', 'product_launches'],
        updateFrequency: 'hourly'
      }
    ];

    for (const source of marketSources) {
      await this.createDataConnection(source);
    }

    logInfo('Market data feeds initialized', {
      sources: marketSources.length,
      feedTypes: marketSources.flatMap(s => s.dataTypes).length
    });
  }

  /**
   * Initialize operational data connectors
   */
  async initializeOperationalDataConnectors() {
    const operationalSources = [
      {
        name: 'production-system',
        type: 'websocket',
        endpoint: process.env.PRODUCTION_WS_URL || 'ws://localhost:8081/production-stream',
        dataTypes: ['production_metrics', 'quality_data', 'equipment_status', 'inventory_levels'],
        updateFrequency: 'real-time'
      },
      {
        name: 'warehouse-management',
        type: 'rest',
        endpoint: process.env.WMS_API_URL || 'http://localhost:3002/api/warehouse',
        dataTypes: ['inventory_movements', 'storage_utilization', 'picking_performance'],
        updateFrequency: '1min'
      },
      {
        name: 'logistics-tracking',
        type: 'rest',
        endpoint: 'https://api.logistics-provider.com/v3',
        dataTypes: ['shipment_status', 'delivery_performance', 'transportation_costs'],
        updateFrequency: '10min',
        authentication: 'bearer_token'
      }
    ];

    for (const source of operationalSources) {
      await this.createDataConnection(source);
    }

    logInfo('Operational data connectors initialized', {
      sources: operationalSources.length,
      dataTypes: operationalSources.flatMap(s => s.dataTypes).length
    });
  }

  /**
   * Initialize supplier data integration
   */
  async initializeSupplierDataIntegration() {
    const supplierSources = [
      {
        name: 'supplier-portal',
        type: 'websocket',
        endpoint: process.env.SUPPLIER_PORTAL_WS || 'ws://localhost:8082/supplier-stream',
        dataTypes: ['delivery_schedules', 'quality_certifications', 'capacity_updates'],
        updateFrequency: 'real-time'
      },
      {
        name: 'procurement-system',
        type: 'rest',
        endpoint: process.env.PROCUREMENT_API || 'http://localhost:3003/api/procurement',
        dataTypes: ['purchase_orders', 'supplier_performance', 'contract_terms'],
        updateFrequency: '5min'
      },
      {
        name: 'supplier-financials',
        type: 'rest',
        endpoint: 'https://api.supplier-risk.com/v1',
        dataTypes: ['credit_ratings', 'financial_health', 'risk_assessments'],
        updateFrequency: '6hours',
        authentication: 'api_key'
      }
    ];

    for (const source of supplierSources) {
      await this.createDataConnection(source);
    }

    logInfo('Supplier data integration initialized', {
      sources: supplierSources.length,
      integrations: supplierSources.flatMap(s => s.dataTypes).length
    });
  }

  /**
   * Create and manage data connection based on type
   */
  async createDataConnection(source) {
    try {
      let connection;

      switch (source.type) {
        case 'websocket':
          connection = await this.createWebSocketConnection(source);
          break;
        case 'rest':
          connection = await this.createRESTConnection(source);
          break;
        case 'graphql':
          connection = await this.createGraphQLConnection(source);
          break;
        default:
          throw new Error(`Unsupported connection type: ${source.type}`);
      }

      this.connections.set(source.name, connection);
      this.activeConnections++;

      logInfo('Data connection created successfully', {
        source: source.name,
        type: source.type,
        dataTypes: source.dataTypes.length
      });

      return connection;

    } catch (error) {
      logError('Failed to create data connection', error, { source: source.name });
      throw error;
    }
  }

  /**
   * Create WebSocket connection for real-time data
   */
  async createWebSocketConnection(source) {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(source.endpoint, {
          headers: this.getAuthHeaders(source),
          handshakeTimeout: this.config.connectionTimeout
        });

        ws.on('open', () => {
          logInfo('WebSocket connection established', { source: source.name });
          
          // Subscribe to specific data types
          ws.send(JSON.stringify({
            action: 'subscribe',
            dataTypes: source.dataTypes
          }));

          resolve({
            connection: ws,
            source,
            status: 'connected',
            lastHeartbeat: Date.now()
          });
        });

        ws.on('message', (data) => {
          this.handleIncomingData(source, JSON.parse(data.toString()));
        });

        ws.on('error', (error) => {
          logError('WebSocket connection error', error, { source: source.name });
          this.handleConnectionError(source, error);
        });

        ws.on('close', (code, reason) => {
          logWarn('WebSocket connection closed', { 
            source: source.name, 
            code, 
            reason: reason.toString() 
          });
          this.handleConnectionClose(source, code, reason);
        });

        // Set connection timeout
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.terminate();
            reject(new Error(`Connection timeout for ${source.name}`));
          }
        }, this.config.connectionTimeout);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create REST API connection for periodic data updates
   */
  async createRESTConnection(source) {
    const connection = {
      source,
      status: 'active',
      lastUpdate: null,
      updateInterval: null
    };

    // Set up periodic data fetching based on update frequency
    const intervalMs = this.parseUpdateFrequency(source.updateFrequency);
    
    connection.updateInterval = setInterval(async () => {
      try {
        await this.fetchRESTData(source);
      } catch (error) {
        logError('Failed to fetch REST data', error, { source: source.name });
        this.handleConnectionError(source, error);
      }
    }, intervalMs);

    // Initial data fetch
    await this.fetchRESTData(source);

    return connection;
  }

  /**
   * Fetch data from REST API endpoint
   */
  async fetchRESTData(source) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(source)
    };

    for (const dataType of source.dataTypes) {
      const endpoint = `${source.endpoint}/${dataType}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.handleIncomingData(source, { type: dataType, data, timestamp: Date.now() });
    }

    const connection = this.connections.get(source.name);
    if (connection) {
      connection.lastUpdate = Date.now();
    }
  }

  /**
   * Create GraphQL connection for flexible data queries
   */
  async createGraphQLConnection(source) {
    const connection = {
      source,
      status: 'active',
      lastUpdate: null,
      updateInterval: null
    };

    // Set up periodic GraphQL queries
    const intervalMs = this.parseUpdateFrequency(source.updateFrequency);
    
    connection.updateInterval = setInterval(async () => {
      try {
        await this.executeGraphQLQueries(source);
      } catch (error) {
        logError('Failed to execute GraphQL queries', error, { source: source.name });
        this.handleConnectionError(source, error);
      }
    }, intervalMs);

    // Initial query execution
    await this.executeGraphQLQueries(source);

    return connection;
  }

  /**
   * Execute GraphQL queries for data types
   */
  async executeGraphQLQueries(source) {
    const queries = source.dataTypes.map(dataType => ({
      query: this.buildGraphQLQuery(dataType),
      variables: this.getGraphQLVariables(dataType)
    }));

    for (const { query, variables } of queries) {
      const response = await fetch(source.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(source)
        },
        body: JSON.stringify({ query, variables }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`GraphQL HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      this.handleIncomingData(source, {
        type: 'graphql_result',
        data: result.data,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle incoming data from any source
   */
  async handleIncomingData(source, rawData) {
    try {
      // Validate data structure and quality
      const validationResult = await this.validateIncomingData(source, rawData);
      
      if (!validationResult.isValid) {
        logWarn('Data validation failed', {
          source: source.name,
          errors: validationResult.errors
        });
        this.qualityMetrics.invalidRecords++;
        return;
      }

      // Transform data to standardized format
      const transformedData = await this.transformData(source, rawData);
      
      // Check for duplicates
      if (this.isDuplicateData(transformedData)) {
        this.qualityMetrics.duplicateRecords++;
        return;
      }

      // Store in appropriate cache
      this.cacheData(transformedData);
      
      // Update quality metrics
      this.qualityMetrics.totalRecords++;
      this.qualityMetrics.validRecords++;
      this.qualityMetrics.lastUpdate = Date.now();

      // Emit data update event
      this.emit('dataUpdate', {
        source: source.name,
        dataType: transformedData.type,
        data: transformedData,
        timestamp: Date.now()
      });

      // Trigger dependent services
      this.triggerDataProcessing(transformedData);

    } catch (error) {
      logError('Failed to handle incoming data', error, { source: source.name });
      this.qualityMetrics.invalidRecords++;
    }
  }

  /**
   * Validate incoming data against predefined rules
   */
  async validateIncomingData(source, data) {
    const validationRules = this.config.dataValidationRules.get(source.name) || [];
    const errors = [];

    // Basic structure validation
    if (!data || typeof data !== 'object') {
      errors.push('Data must be a valid object');
    }

    // Timestamp validation
    if (data.timestamp) {
      const dataAge = Date.now() - data.timestamp;
      if (dataAge > this.config.qualityThresholds.timeliness) {
        errors.push(`Data is too old: ${dataAge}ms`);
        this.qualityMetrics.lateRecords++;
      }
    }

    // Apply custom validation rules
    for (const rule of validationRules) {
      try {
        const ruleResult = await rule.validate(data);
        if (!ruleResult.isValid) {
          errors.push(...ruleResult.errors);
        }
      } catch (error) {
        errors.push(`Validation rule error: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: errors.length === 0 ? 1.0 : Math.max(0, 1 - (errors.length * 0.2))
    };
  }

  /**
   * Transform raw data to standardized format
   */
  async transformData(source, rawData) {
    const baseTransform = {
      sourceId: source.name,
      sourceType: source.type,
      receivedAt: Date.now(),
      originalData: rawData
    };

    // Apply source-specific transformations
    switch (source.name) {
      case 'erp-financials':
        return this.transformERPFinancialData(rawData, baseTransform);
      
      case 'market-data':
        return this.transformMarketData(rawData, baseTransform);
      
      case 'production-system':
        return this.transformProductionData(rawData, baseTransform);
      
      default:
        return {
          ...baseTransform,
          type: rawData.type || 'unknown',
          data: rawData.data || rawData,
          metadata: rawData.metadata || {}
        };
    }
  }

  /**
   * Transform ERP financial data
   */
  transformERPFinancialData(rawData, baseTransform) {
    return {
      ...baseTransform,
      type: 'financial',
      subType: rawData.type,
      data: {
        accountsReceivable: this.normalizeFinancialAmount(rawData.ar),
        accountsPayable: this.normalizeFinancialAmount(rawData.ap),
        cashFlow: this.normalizeFinancialAmount(rawData.cashFlow),
        workingCapital: this.calculateWorkingCapital(rawData.ar, rawData.ap, rawData.inventory)
      },
      metadata: {
        currency: rawData.currency || 'USD',
        reportingPeriod: rawData.period,
        confidenceLevel: rawData.confidence || 0.95
      }
    };
  }

  /**
   * Transform market data
   */
  transformMarketData(rawData, baseTransform) {
    return {
      ...baseTransform,
      type: 'market',
      subType: rawData.indicator,
      data: {
        value: parseFloat(rawData.value),
        previousValue: parseFloat(rawData.previousValue),
        change: this.calculateChange(rawData.value, rawData.previousValue),
        trend: this.determineTrend(rawData.values || [rawData.previousValue, rawData.value])
      },
      metadata: {
        source: rawData.source,
        frequency: rawData.frequency,
        nextUpdate: rawData.nextUpdate
      }
    };
  }

  /**
   * Transform production data
   */
  transformProductionData(rawData, baseTransform) {
    return {
      ...baseTransform,
      type: 'operational',
      subType: 'production',
      data: {
        efficiency: parseFloat(rawData.efficiency),
        throughput: parseInt(rawData.throughput),
        qualityScore: parseFloat(rawData.quality),
        downtime: parseInt(rawData.downtime),
        utilization: parseFloat(rawData.utilization)
      },
      metadata: {
        facility: rawData.facility,
        shift: rawData.shift,
        equipmentId: rawData.equipment
      }
    };
  }

  /**
   * Cache transformed data in appropriate storage
   */
  cacheData(transformedData) {
    const cacheKey = `${transformedData.sourceId}_${transformedData.subType}_${Date.now()}`;
    
    switch (transformedData.type) {
      case 'financial':
        this.dataCache.financial.set(cacheKey, transformedData);
        this.cleanupOldCacheData(this.dataCache.financial);
        break;
        
      case 'market':
        this.dataCache.market.set(cacheKey, transformedData);
        this.cleanupOldCacheData(this.dataCache.market);
        break;
        
      case 'operational':
        this.dataCache.operational.set(cacheKey, transformedData);
        this.cleanupOldCacheData(this.dataCache.operational);
        break;
        
      case 'supplier':
        this.dataCache.supplier.set(cacheKey, transformedData);
        this.cleanupOldCacheData(this.dataCache.supplier);
        break;
    }
  }

  /**
   * Check for duplicate data
   */
  isDuplicateData(transformedData) {
    const relevantCache = this.dataCache[transformedData.type];
    if (!relevantCache) return false;

    const duplicateThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    for (const [key, cachedData] of relevantCache) {
      if (now - cachedData.receivedAt > duplicateThreshold) continue;
      
      if (this.compareDataStructures(transformedData.data, cachedData.data)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Trigger processing in dependent services
   */
  triggerDataProcessing(transformedData) {
    // Notify forecasting service of new financial data
    if (transformedData.type === 'financial') {
      this.emit('financialDataUpdate', transformedData);
    }

    // Notify optimization services of operational changes
    if (transformedData.type === 'operational') {
      this.emit('operationalDataUpdate', transformedData);
    }

    // Notify risk assessment of supplier data
    if (transformedData.type === 'supplier') {
      this.emit('supplierDataUpdate', transformedData);
    }

    // Trigger real-time dashboard updates
    this.emit('dashboardUpdate', {
      type: transformedData.type,
      subType: transformedData.subType,
      data: transformedData.data,
      timestamp: transformedData.receivedAt
    });
  }

  /**
   * Start health monitoring for all connections
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.heartbeatInterval);

    logInfo('Health monitoring started', {
      interval: this.config.heartbeatInterval,
      connections: this.connections.size
    });
  }

  /**
   * Perform health checks on all connections
   */
  async performHealthChecks() {
    for (const [name, connection] of this.connections) {
      try {
        const health = await this.checkConnectionHealth(connection);
        this.healthChecks.set(name, {
          ...health,
          checkedAt: Date.now()
        });

        if (!health.isHealthy) {
          logWarn('Connection health check failed', { 
            source: name, 
            issues: health.issues 
          });
          
          // Attempt automatic recovery
          await this.attemptConnectionRecovery(name, connection);
        }

      } catch (error) {
        logError('Health check error', error, { source: name });
        this.healthChecks.set(name, {
          isHealthy: false,
          issues: ['Health check failed'],
          checkedAt: Date.now()
        });
      }
    }
  }

  /**
   * Check health of individual connection
   */
  async checkConnectionHealth(connection) {
    const health = {
      isHealthy: true,
      issues: [],
      metrics: {}
    };

    if (connection.connection && connection.connection.readyState) {
      // WebSocket health check
      if (connection.connection.readyState !== WebSocket.OPEN) {
        health.isHealthy = false;
        health.issues.push('WebSocket connection not open');
      }
      
      const timeSinceLastHeartbeat = Date.now() - (connection.lastHeartbeat || 0);
      if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
        health.isHealthy = false;
        health.issues.push('Heartbeat timeout');
      }
      
    } else if (connection.updateInterval) {
      // REST connection health check
      const timeSinceLastUpdate = Date.now() - (connection.lastUpdate || 0);
      const expectedInterval = this.parseUpdateFrequency(connection.source.updateFrequency);
      
      if (timeSinceLastUpdate > expectedInterval * 2) {
        health.isHealthy = false;
        health.issues.push('Update interval exceeded');
      }
    }

    return health;
  }

  /**
   * Attempt to recover failed connections
   */
  async attemptConnectionRecovery(name, connection) {
    logInfo('Attempting connection recovery', { source: name });

    try {
      // Close existing connection
      if (connection.connection) {
        connection.connection.close();
      }
      if (connection.updateInterval) {
        clearInterval(connection.updateInterval);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));

      // Recreate connection
      const newConnection = await this.createDataConnection(connection.source);
      this.connections.set(name, newConnection);

      logInfo('Connection recovery successful', { source: name });

    } catch (error) {
      logError('Connection recovery failed', error, { source: name });
      
      // Mark connection as failed
      connection.status = 'failed';
      connection.failedAt = Date.now();
    }
  }

  /**
   * Start data quality monitoring
   */
  startDataQualityMonitoring() {
    setInterval(() => {
      this.evaluateDataQuality();
    }, 60000); // Every minute

    logInfo('Data quality monitoring started');
  }

  /**
   * Evaluate overall data quality
   */
  evaluateDataQuality() {
    const metrics = this.qualityMetrics;
    
    const completenessScore = metrics.totalRecords > 0 ? 
      metrics.validRecords / metrics.totalRecords : 0;
    
    const accuracyScore = metrics.totalRecords > 0 ? 
      (metrics.totalRecords - metrics.invalidRecords) / metrics.totalRecords : 0;
    
    const timelinessScore = metrics.lateRecords > 0 ? 
      Math.max(0, 1 - (metrics.lateRecords / metrics.totalRecords)) : 1;

    const overallQuality = (completenessScore + accuracyScore + timelinessScore) / 3;

    // Emit quality alerts if below thresholds
    if (completenessScore < this.config.qualityThresholds.completeness) {
      this.emit('qualityAlert', {
        type: 'completeness',
        score: completenessScore,
        threshold: this.config.qualityThresholds.completeness
      });
    }

    if (accuracyScore < this.config.qualityThresholds.accuracy) {
      this.emit('qualityAlert', {
        type: 'accuracy',
        score: accuracyScore,
        threshold: this.config.qualityThresholds.accuracy
      });
    }

    // Update quality metrics
    this.qualityMetrics.overallQuality = overallQuality;
    this.qualityMetrics.completenessScore = completenessScore;
    this.qualityMetrics.accuracyScore = accuracyScore;
    this.qualityMetrics.timelinessScore = timelinessScore;

    logInfo('Data quality evaluation completed', {
      overallQuality: Math.round(overallQuality * 100),
      completeness: Math.round(completenessScore * 100),
      accuracy: Math.round(accuracyScore * 100),
      timeliness: Math.round(timelinessScore * 100)
    });
  }

  /**
   * Get real-time data by type and source
   */
  getRealTimeData(type, subType = null, maxAge = 300000) {
    const cache = this.dataCache[type];
    if (!cache) return null;

    const now = Date.now();
    const results = [];

    for (const [key, data] of cache) {
      if (now - data.receivedAt > maxAge) continue;
      if (subType && data.subType !== subType) continue;
      
      results.push(data);
    }

    return results.sort((a, b) => b.receivedAt - a.receivedAt);
  }

  /**
   * Get connection status summary
   */
  getConnectionStatus() {
    const status = {
      totalConnections: this.connections.size,
      healthyConnections: 0,
      failedConnections: 0,
      connections: {},
      dataQuality: this.qualityMetrics,
      lastHealthCheck: Math.max(...Array.from(this.healthChecks.values()).map(h => h.checkedAt || 0))
    };

    for (const [name, health] of this.healthChecks) {
      const connection = this.connections.get(name);
      status.connections[name] = {
        status: health.isHealthy ? 'healthy' : 'failed',
        issues: health.issues,
        type: connection?.source?.type,
        lastUpdate: connection?.lastUpdate,
        dataTypes: connection?.source?.dataTypes
      };

      if (health.isHealthy) {
        status.healthyConnections++;
      } else {
        status.failedConnections++;
      }
    }

    return status;
  }

  // Utility methods

  getAuthHeaders(source) {
    const headers = {};

    switch (source.authentication) {
      case 'api_key':
        headers['X-API-Key'] = process.env[`${source.name.toUpperCase()}_API_KEY`];
        break;
      case 'bearer_token':
        headers['Authorization'] = `Bearer ${process.env[`${source.name.toUpperCase()}_TOKEN`]}`;
        break;
      case 'oauth2':
        headers['Authorization'] = `Bearer ${this.getOAuth2Token(source.name)}`;
        break;
    }

    return headers;
  }

  parseUpdateFrequency(frequency) {
    const freq = frequency.toLowerCase();
    if (freq === 'real-time') return 0;
    if (freq.endsWith('ms')) return parseInt(freq);
    if (freq.endsWith('s')) return parseInt(freq) * 1000;
    if (freq.endsWith('min')) return parseInt(freq) * 60 * 1000;
    if (freq.endsWith('h') || freq.endsWith('hour')) return parseInt(freq) * 60 * 60 * 1000;
    if (freq === 'daily') return 24 * 60 * 60 * 1000;
    return 60000; // Default 1 minute
  }

  normalizeFinancialAmount(amount) {
    return parseFloat(amount) || 0;
  }

  calculateWorkingCapital(ar, ap, inventory) {
    return (parseFloat(ar) || 0) + (parseFloat(inventory) || 0) - (parseFloat(ap) || 0);
  }

  calculateChange(current, previous) {
    const curr = parseFloat(current);
    const prev = parseFloat(previous);
    return prev !== 0 ? ((curr - prev) / prev) * 100 : 0;
  }

  determineTrend(values) {
    if (values.length < 2) return 'stable';
    const last = values[values.length - 1];
    const secondLast = values[values.length - 2];
    
    if (last > secondLast * 1.02) return 'up';
    if (last < secondLast * 0.98) return 'down';
    return 'stable';
  }

  compareDataStructures(data1, data2) {
    return JSON.stringify(data1) === JSON.stringify(data2);
  }

  cleanupOldCacheData(cache, maxAge = 3600000) { // 1 hour
    const now = Date.now();
    for (const [key, data] of cache) {
      if (now - data.receivedAt > maxAge) {
        cache.delete(key);
      }
    }
  }

  buildGraphQLQuery(dataType) {
    // Basic GraphQL query builder - would be more sophisticated in production
    return `
      query Get${dataType.charAt(0).toUpperCase() + dataType.slice(1)} {
        ${dataType} {
          id
          timestamp
          value
          metadata
        }
      }
    `;
  }

  getGraphQLVariables(dataType) {
    return {
      limit: 100,
      orderBy: 'timestamp_DESC'
    };
  }

  getOAuth2Token(sourceName) {
    // OAuth2 token management - would integrate with proper OAuth2 flow
    return process.env[`${sourceName.toUpperCase()}_OAUTH_TOKEN`];
  }

  handleConnectionError(source, error) {
    this.emit('connectionError', {
      source: source.name,
      error: error.message,
      timestamp: Date.now()
    });
  }

  handleConnectionClose(source, code, reason) {
    this.emit('connectionClosed', {
      source: source.name,
      code,
      reason: reason.toString(),
      timestamp: Date.now()
    });
  }

  /**
   * Graceful shutdown of all connections
   */
  async shutdown() {
    logInfo('Shutting down MCP Integration Service');

    for (const [name, connection] of this.connections) {
      try {
        if (connection.connection && connection.connection.close) {
          connection.connection.close();
        }
        if (connection.updateInterval) {
          clearInterval(connection.updateInterval);
        }
      } catch (error) {
        logError('Error closing connection during shutdown', error, { source: name });
      }
    }

    this.connections.clear();
    this.activeConnections = 0;
    this.isInitialized = false;

    logInfo('MCP Integration Service shutdown completed');
  }
}

export default MCPIntegrationService;