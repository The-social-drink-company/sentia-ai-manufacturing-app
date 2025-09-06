import { EventEmitter } from 'events';
import axios from 'axios';
import crypto from 'crypto';
import logger, { logInfo, logError, logWarn } from '../logger.js';
import MCPOrchestrator from './mcpOrchestrator.js';

/**
 * Sentia MCP Integration Layer
 * Comprehensive integration with Unleashed (production/BOM/inventory) and Xero (accounting)
 * Provides unified data access via Model Context Protocol for AI systems
 */
class SentiaIntegrationLayer extends EventEmitter {
  constructor() {
    super();
    
    this.mcpOrchestrator = new MCPOrchestrator();
    
    // Core system clients
    this.clients = {
      unleashed: this.initializeUnleashedClient(),
      xero: this.initializeXeroClient()
    };

    // Data synchronization
    this.sync = {
      intervals: new Map(),
      lastSync: new Map(),
      syncStatus: new Map(),
      dataCache: new Map()
    };

    // Sentia-specific data mappings
    this.sentiaDataMappings = {
      products: new Map(),
      botanicals: new Map(),
      customers: new Map(),
      suppliers: new Map(),
      financials: new Map()
    };
    this.initializeDataMappings();

    // MCP server configurations for Sentia systems
    this.mcpConfigurations = {
      unleashed: this.createUnleashedMCPConfig(),
      xero: this.createXeroMCPConfig(),
      sentia_analytics: this.createSentiaAnalyticsMCPConfig()
    };

    // Real-time data streaming
    this.dataStreams = {
      production: new Map(),
      inventory: new Map(),
      financial: new Map(),
      quality: new Map()
    };

    this.initializeIntegration();
    logInfo('Sentia MCP Integration Layer initialized');
  }

  /**
   * Initialize Unleashed API client
   */
  initializeUnleashedClient() {
    const apiId = process.env.UNLEASHED_API_ID;
    const apiKey = process.env.UNLEASHED_API_KEY;
    const baseUrl = process.env.UNLEASHED_BASE_URL || 'https://api.unleashedsoftware.com';

    if (!apiId || !apiKey) {
      logWarn('Unleashed API credentials not configured');
      return null;
    }

    // Generate Unleashed signature
    const generateSignature = (url, method, body = '') => {
      const queryString = url.split('?')[1] || '';
      const signature = crypto
        .createHmac('sha256', apiKey)
        .update(apiId + method + url + queryString + body)
        .digest('base64');
      return signature;
    };

    const client = axios.create({
      baseURL: baseUrl,
      timeout: 30000
    });

    // Add request interceptor for Unleashed authentication
    client.interceptors.request.use(config => {
      const signature = generateSignature(
        config.url,
        config.method.toUpperCase(),
        config.data ? JSON.stringify(config.data) : ''
      );
      
      config.headers['api-auth-id'] = apiId;
      config.headers['api-auth-signature'] = signature;
      config.headers['Content-Type'] = 'application/json';
      
      return config;
    });

    logInfo('Unleashed client initialized');
    return client;
  }

  /**
   * Initialize Xero API client
   */
  initializeXeroClient() {
    const clientId = process.env.XERO_CLIENT_ID;
    const clientSecret = process.env.XERO_CLIENT_SECRET;
    const tenantId = process.env.XERO_TENANT_ID;
    const baseUrl = 'https://api.xero.com/api.xro/2.0';

    if (!clientId || !clientSecret || !tenantId) {
      logWarn('Xero API credentials not configured');
      return null;
    }

    const client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Xero-Tenant-Id': tenantId,
        'Content-Type': 'application/json'
      }
    });

    // Add OAuth2 token handling (simplified for demo)
    client.interceptors.request.use(async config => {
      const token = await this.getXeroAccessToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });

    logInfo('Xero client initialized');
    return client;
  }

  /**
   * Initialize the integration layer
   */
  async initializeIntegration() {
    try {
      // Register MCP servers for Sentia systems
      await this.registerSentiaMCPServers();
      
      // Setup data synchronization
      await this.setupDataSynchronization();
      
      // Initialize real-time data streams
      this.setupRealTimeStreams();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Start initial data sync
      await this.performInitialDataSync();
      
      logInfo('Sentia MCP Integration Layer initialization complete');
    } catch (error) {
      logError('Integration layer initialization failed:', error);
    }
  }

  /**
   * Register MCP servers for Sentia's core systems
   */
  async registerSentiaMCPServers() {
    // Register Unleashed MCP Server
    if (this.clients.unleashed) {
      const unleashedResult = await this.mcpOrchestrator.registerMCPServer(
        this.mcpConfigurations.unleashed
      );
      logInfo(`Unleashed MCP server registration: ${unleashedResult.success ? 'SUCCESS' : 'FAILED'}`);
    }

    // Register Xero MCP Server
    if (this.clients.xero) {
      const xeroResult = await this.mcpOrchestrator.registerMCPServer(
        this.mcpConfigurations.xero
      );
      logInfo(`Xero MCP server registration: ${xeroResult.success ? 'SUCCESS' : 'FAILED'}`);
    }

    // Register Sentia Analytics MCP Server (internal)
    const analyticsResult = await this.mcpOrchestrator.registerMCPServer(
      this.mcpConfigurations.sentia_analytics
    );
    logInfo(`Sentia Analytics MCP server registration: ${analyticsResult.success ? 'SUCCESS' : 'FAILED'}`);
  }

  /**
   * Create Unleashed MCP server configuration
   */
  createUnleashedMCPConfig() {
    return {
      id: 'unleashed-production',
      name: 'Unleashed Production Management System',
      type: 'erp',
      endpoint: 'http://localhost:3010/mcp', // Internal MCP bridge
      transport: 'http',
      capabilities: ['resources', 'tools', 'prompts'],
      auth: {
        type: 'internal',
        system: 'unleashed'
      },
      dataTypes: [
        'bills-of-materials',
        'production-orders',
        'work-orders', 
        'inventory-levels',
        'stock-movements',
        'purchase-orders',
        'sales-orders',
        'supplier-data',
        'customer-data',
        'product-catalog'
      ],
      updateInterval: 30000, // 30 seconds
      tools: [
        'create_production_order',
        'update_inventory_levels',
        'query_bom_data',
        'get_stock_status',
        'create_purchase_order',
        'update_work_order_status',
        'query_customer_orders',
        'get_supplier_performance'
      ],
      resources: [
        'current_inventory',
        'active_production_orders',
        'bom_specifications',
        'supplier_catalog',
        'product_pricing'
      ]
    };
  }

  /**
   * Create Xero MCP server configuration
   */
  createXeroMCPConfig() {
    return {
      id: 'xero-accounting',
      name: 'Xero Accounting System',
      type: 'finance',
      endpoint: 'http://localhost:3011/mcp', // Internal MCP bridge
      transport: 'http',
      capabilities: ['resources', 'tools'],
      auth: {
        type: 'internal',
        system: 'xero'
      },
      dataTypes: [
        'financial-transactions',
        'accounts-payable',
        'accounts-receivable',
        'profit-loss',
        'balance-sheet',
        'cash-flow',
        'invoices',
        'bills',
        'purchase-orders',
        'expense-claims',
        'tax-information'
      ],
      updateInterval: 60000, // 1 minute
      tools: [
        'create_invoice',
        'record_payment',
        'create_purchase_order',
        'query_financial_data',
        'get_cash_position',
        'analyze_profitability',
        'generate_financial_report'
      ],
      resources: [
        'current_financials',
        'outstanding_invoices',
        'cash_flow_forecast',
        'expense_analysis',
        'profit_margins'
      ]
    };
  }

  /**
   * Create Sentia Analytics MCP server configuration
   */
  createSentiaAnalyticsMCPConfig() {
    return {
      id: 'sentia-analytics',
      name: 'Sentia Business Analytics Engine',
      type: 'analytics',
      endpoint: 'http://localhost:3012/mcp', // Internal MCP bridge
      transport: 'http',
      capabilities: ['resources', 'tools', 'prompts'],
      auth: {
        type: 'internal',
        system: 'sentia'
      },
      dataTypes: [
        'product-performance',
        'botanical-analytics',
        'customer-insights',
        'sales-analytics',
        'production-efficiency',
        'quality-metrics',
        'supply-chain-analytics',
        'financial-performance'
      ],
      updateInterval: 15000, // 15 seconds
      tools: [
        'analyze_product_performance',
        'generate_botanical_insights',
        'forecast_demand',
        'optimize_production',
        'assess_supplier_risk',
        'calculate_profitability',
        'predict_quality_issues'
      ],
      resources: [
        'real_time_metrics',
        'performance_dashboards',
        'predictive_insights',
        'optimization_recommendations'
      ]
    };
  }

  /**
   * Setup data synchronization schedules
   */
  async setupDataSynchronization() {
    // Unleashed data sync - every 30 seconds for critical data
    if (this.clients.unleashed) {
      const unleashedSync = setInterval(async () => {
        await this.syncUnleashedData();
      }, 30000);
      
      this.sync.intervals.set('unleashed', unleashedSync);
    }

    // Xero data sync - every minute for financial data
    if (this.clients.xero) {
      const xeroSync = setInterval(async () => {
        await this.syncXeroData();
      }, 60000);
      
      this.sync.intervals.set('xero', xeroSync);
    }

    logInfo('Data synchronization schedules established');
  }

  /**
   * Sync Unleashed data and make available via MCP
   */
  async syncUnleashedData() {
    try {
      this.sync.syncStatus.set('unleashed', 'syncing');
      
      // Sync Bills of Materials
      const bomsData = await this.fetchUnleashedBOMs();
      this.dataStreams.production.set('boms', {
        data: bomsData,
        timestamp: new Date(),
        source: 'unleashed'
      });

      // Sync Inventory Levels
      const inventoryData = await this.fetchUnleashedInventory();
      this.dataStreams.inventory.set('current_levels', {
        data: inventoryData,
        timestamp: new Date(),
        source: 'unleashed'
      });

      // Sync Production Orders
      const productionData = await this.fetchUnleashedProduction();
      this.dataStreams.production.set('orders', {
        data: productionData,
        timestamp: new Date(),
        source: 'unleashed'
      });

      // Sync Sales Orders
      const salesData = await this.fetchUnleashedSales();
      this.dataStreams.production.set('sales', {
        data: salesData,
        timestamp: new Date(),
        source: 'unleashed'
      });

      // Sync Suppliers
      const supplierData = await this.fetchUnleashedSuppliers();
      this.dataStreams.production.set('suppliers', {
        data: supplierData,
        timestamp: new Date(),
        source: 'unleashed'
      });

      this.sync.lastSync.set('unleashed', new Date());
      this.sync.syncStatus.set('unleashed', 'completed');
      
      this.emit('unleashedSyncCompleted', {
        timestamp: new Date(),
        recordsCounts: {
          boms: bomsData.length,
          inventory: inventoryData.length,
          production: productionData.length,
          sales: salesData.length,
          suppliers: supplierData.length
        }
      });

    } catch (error) {
      this.sync.syncStatus.set('unleashed', 'failed');
      logError('Unleashed data sync failed:', error);
    }
  }

  /**
   * Sync Xero data and make available via MCP
   */
  async syncXeroData() {
    try {
      this.sync.syncStatus.set('xero', 'syncing');
      
      // Sync Invoices
      const invoicesData = await this.fetchXeroInvoices();
      this.dataStreams.financial.set('invoices', {
        data: invoicesData,
        timestamp: new Date(),
        source: 'xero'
      });

      // Sync Payments
      const paymentsData = await this.fetchXeroPayments();
      this.dataStreams.financial.set('payments', {
        data: paymentsData,
        timestamp: new Date(),
        source: 'xero'
      });

      // Sync Profit & Loss
      const plData = await this.fetchXeroProfitLoss();
      this.dataStreams.financial.set('profit_loss', {
        data: plData,
        timestamp: new Date(),
        source: 'xero'
      });

      // Sync Cash Flow
      const cashFlowData = await this.fetchXeroCashFlow();
      this.dataStreams.financial.set('cash_flow', {
        data: cashFlowData,
        timestamp: new Date(),
        source: 'xero'
      });

      // Sync Accounts Payable
      const apData = await this.fetchXeroAccountsPayable();
      this.dataStreams.financial.set('accounts_payable', {
        data: apData,
        timestamp: new Date(),
        source: 'xero'
      });

      this.sync.lastSync.set('xero', new Date());
      this.sync.syncStatus.set('xero', 'completed');
      
      this.emit('xeroSyncCompleted', {
        timestamp: new Date(),
        recordsCounts: {
          invoices: invoicesData.length,
          payments: paymentsData.length,
          profitLoss: plData.length,
          cashFlow: cashFlowData.length,
          accountsPayable: apData.length
        }
      });

    } catch (error) {
      this.sync.syncStatus.set('xero', 'failed');
      logError('Xero data sync failed:', error);
    }
  }

  /**
   * Fetch Unleashed Bills of Materials
   */
  async fetchUnleashedBOMs() {
    if (!this.clients.unleashed) return [];

    try {
      const response = await this.clients.unleashed.get('/BillOfMaterials', {
        params: { pageSize: 200 }
      });
      
      const boms = response.data.Items || [];
      
      // Filter for Sentia products and enrich with mappings
      const sentiaBOMs = boms.filter(bom => 
        this.isSentiaProduct(bom.ProductCode)
      ).map(bom => this.enrichBOMData(bom));

      return sentiaBOMs;
    } catch (error) {
      logError('Failed to fetch Unleashed BOMs:', error);
      return [];
    }
  }

  /**
   * Fetch Unleashed inventory data
   */
  async fetchUnleashedInventory() {
    if (!this.clients.unleashed) return [];

    try {
      const response = await this.clients.unleashed.get('/StockOnHand', {
        params: { pageSize: 500 }
      });
      
      const inventory = response.data.Items || [];
      
      // Focus on botanical ingredients and finished products
      const relevantInventory = inventory.filter(item => 
        this.isSentiaRelevant(item.ProductCode)
      ).map(item => this.enrichInventoryData(item));

      return relevantInventory;
    } catch (error) {
      logError('Failed to fetch Unleashed inventory:', error);
      return [];
    }
  }

  /**
   * Fetch Unleashed production/work orders
   */
  async fetchUnleashedProduction() {
    if (!this.clients.unleashed) return [];

    try {
      // Get production orders
      const productionResponse = await this.clients.unleashed.get('/SalesOrders', {
        params: { 
          orderStatus: 'Parked,Placed,InProgress',
          pageSize: 100
        }
      });

      const orders = productionResponse.data.Items || [];
      
      // Filter for Sentia products
      const sentiaOrders = orders.filter(order =>
        order.OrderLines && order.OrderLines.some(line =>
          this.isSentiaProduct(line.Product?.ProductCode)
        )
      ).map(order => this.enrichProductionData(order));

      return sentiaOrders;
    } catch (error) {
      logError('Failed to fetch Unleashed production data:', error);
      return [];
    }
  }

  /**
   * Fetch Xero invoices
   */
  async fetchXeroInvoices() {
    if (!this.clients.xero) return [];

    try {
      const response = await this.clients.xero.get('/Invoices', {
        params: { 
          where: `Date >= DateTime.Now.AddDays(-30)`,
          order: 'Date DESC'
        }
      });
      
      const invoices = response.data.Invoices || [];
      return invoices.map(invoice => this.enrichFinancialData(invoice, 'invoice'));
    } catch (error) {
      logError('Failed to fetch Xero invoices:', error);
      return [];
    }
  }

  /**
   * Fetch Xero profit & loss data
   */
  async fetchXeroProfitLoss() {
    if (!this.clients.xero) return [];

    try {
      const response = await this.clients.xero.get('/ProfitAndLoss', {
        params: {
          fromDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          toDate: new Date().toISOString().split('T')[0]
        }
      });
      
      return this.transformProfitLossData(response.data);
    } catch (error) {
      logError('Failed to fetch Xero P&L:', error);
      return [];
    }
  }

  /**
   * Query integrated Sentia data via MCP
   */
  async querySentiaData(query) {
    const {
      dataTypes = [],
      timeRange = {},
      filters = {},
      includeFinancials = true,
      includeProduction = true,
      includeAnalytics = true
    } = query;

    const results = {
      query,
      timestamp: new Date(),
      sources: [],
      data: {
        production: {},
        financial: {},
        analytics: {}
      },
      insights: {},
      recommendations: []
    };

    try {
      // Query production data from Unleashed via MCP
      if (includeProduction && (dataTypes.length === 0 || dataTypes.some(t => t.includes('production')))) {
        const productionQuery = await this.mcpOrchestrator.queryServer('unleashed-production', {
          dataTypes: ['bills-of-materials', 'inventory-levels', 'production-orders'],
          timeRange,
          filters: { ...filters, system: 'unleashed' }
        });

        if (productionQuery) {
          results.sources.push('unleashed-production');
          results.data.production = this.processProductionQueryResults(productionQuery);
        }
      }

      // Query financial data from Xero via MCP
      if (includeFinancials && (dataTypes.length === 0 || dataTypes.some(t => t.includes('financial')))) {
        const financialQuery = await this.mcpOrchestrator.queryServer('xero-accounting', {
          dataTypes: ['invoices', 'profit-loss', 'cash-flow'],
          timeRange,
          filters: { ...filters, system: 'xero' }
        });

        if (financialQuery) {
          results.sources.push('xero-accounting');
          results.data.financial = this.processFinancialQueryResults(financialQuery);
        }
      }

      // Query analytics data from Sentia Analytics MCP
      if (includeAnalytics) {
        const analyticsQuery = await this.mcpOrchestrator.queryServer('sentia-analytics', {
          dataTypes: ['product-performance', 'botanical-analytics'],
          timeRange,
          filters: { ...filters, system: 'sentia' }
        });

        if (analyticsQuery) {
          results.sources.push('sentia-analytics');
          results.data.analytics = this.processAnalyticsQueryResults(analyticsQuery);
        }
      }

      // Generate cross-system insights
      results.insights = this.generateCrossSystemInsights(results.data);
      
      // Generate recommendations
      results.recommendations = this.generateActionableRecommendations(results.data, results.insights);

      return results;

    } catch (error) {
      logError('Sentia data query failed:', error);
      return { ...results, error: error.message };
    }
  }

  /**
   * Generate Sentia-specific business insights
   */
  generateSentiaBusinessInsights() {
    const insights = {
      timestamp: new Date(),
      productPerformance: {},
      botanicalEfficiency: {},
      financialHealth: {},
      operationalEfficiency: {},
      marketInsights: {},
      recommendations: []
    };

    // Analyze GABA product performance
    const productionData = this.dataStreams.production.get('orders')?.data || [];
    const financialData = this.dataStreams.financial.get('profit_loss')?.data || [];

    // GABA Red analysis
    insights.productPerformance.gabaRed = this.analyzeGABAProduct('RED', productionData, financialData);
    
    // GABA Gold analysis  
    insights.productPerformance.gabaGold = this.analyzeGABAProduct('GOLD', productionData, financialData);
    
    // GABA Black analysis
    insights.productPerformance.gabaBlack = this.analyzeGABAProduct('BLACK', productionData, financialData);

    // Botanical ingredient efficiency analysis
    insights.botanicalEfficiency = this.analyzeBotanicalEfficiency();
    
    // Financial health metrics
    insights.financialHealth = this.analyzeFinancialHealth();
    
    // Operational efficiency
    insights.operationalEfficiency = this.analyzeOperationalEfficiency();
    
    // Generate strategic recommendations
    insights.recommendations = this.generateStrategicRecommendations(insights);

    return insights;
  }

  /**
   * Get comprehensive integration status
   */
  getIntegrationStatus() {
    return {
      timestamp: new Date(),
      systems: {
        unleashed: {
          connected: !!this.clients.unleashed,
          lastSync: this.sync.lastSync.get('unleashed'),
          syncStatus: this.sync.syncStatus.get('unleashed'),
          dataStreams: this.getStreamCounts('production')
        },
        xero: {
          connected: !!this.clients.xero,
          lastSync: this.sync.lastSync.get('xero'),
          syncStatus: this.sync.syncStatus.get('xero'),
          dataStreams: this.getStreamCounts('financial')
        }
      },
      mcpServers: this.mcpOrchestrator.getServerStatus(),
      dataHealth: this.assessDataHealth(),
      performance: this.getPerformanceMetrics()
    };
  }

  /**
   * Helper methods
   */
  isSentiaProduct(productCode) {
    if (!productCode) return false;
    const code = productCode.toLowerCase();
    return code.includes('gaba') || code.includes('sentia') || 
           code.includes('red') || code.includes('gold') || code.includes('black');
  }

  isSentiaRelevant(productCode) {
    return this.isSentiaProduct(productCode) || this.isBotanicalIngredient(productCode);
  }

  isBotanicalIngredient(productCode) {
    if (!productCode) return false;
    const botanicals = ['ashwagandha', 'passionflower', 'magnolia', 'lemon_balm', 
                       'schisandra', 'hops', 'ginseng', 'ginkgo', 'linden'];
    return botanicals.some(botanical => 
      productCode.toLowerCase().includes(botanical.toLowerCase())
    );
  }

  enrichBOMData(bom) {
    return {
      ...bom,
      sentiaProduct: this.mapSentiaProduct(bom.ProductCode),
      botanicalIngredients: this.extractBotanicalIngredients(bom),
      estimatedCost: this.calculateBOMCost(bom),
      complexityScore: this.calculateComplexityScore(bom),
      lastProcessed: new Date()
    };
  }

  enrichInventoryData(item) {
    return {
      ...item,
      botanical: this.identifyBotanical(item.ProductCode),
      sentiaRelevance: this.assessSentiaRelevance(item),
      riskLevel: this.assessInventoryRisk(item),
      restockRecommendation: this.generateRestockRecommendation(item),
      lastProcessed: new Date()
    };
  }

  async getXeroAccessToken() {
    // In production, implement proper OAuth2 token management
    // For demo purposes, return a placeholder
    return process.env.XERO_ACCESS_TOKEN;
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle MCP server events
    this.mcpOrchestrator.on('serverConnected', ({ serverId }) => {
      logInfo(`MCP server connected: ${serverId}`);
    });

    this.mcpOrchestrator.on('serverDisconnected', ({ serverId }) => {
      logWarn(`MCP server disconnected: ${serverId}`);
    });

    // Handle data sync events
    this.on('unleashedSyncCompleted', (data) => {
      logInfo(`Unleashed sync completed: ${JSON.stringify(data.recordsCounts)}`);
    });

    this.on('xeroSyncCompleted', (data) => {
      logInfo(`Xero sync completed: ${JSON.stringify(data.recordsCounts)}`);
    });
  }

  /**
   * Perform initial comprehensive data sync
   */
  async performInitialDataSync() {
    logInfo('Starting initial data synchronization...');
    
    try {
      // Sync Unleashed data
      await this.syncUnleashedData();
      
      // Sync Xero data
      await this.syncXeroData();
      
      // Generate initial insights
      const initialInsights = this.generateSentiaBusinessInsights();
      this.dataStreams.analytics = new Map([['business_insights', {
        data: initialInsights,
        timestamp: new Date(),
        source: 'sentia_integration'
      }]]);
      
      logInfo('Initial data synchronization completed successfully');
    } catch (error) {
      logError('Initial data synchronization failed:', error);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    // Clear sync intervals
    for (const [system, interval] of this.sync.intervals) {
      clearInterval(interval);
      logInfo(`Stopped ${system} sync interval`);
    }

    // Clear data streams
    this.dataStreams.production.clear();
    this.dataStreams.inventory.clear();
    this.dataStreams.financial.clear();
    this.dataStreams.quality.clear();

    // Shutdown MCP orchestrator
    await this.mcpOrchestrator.disconnect();

    // Clear sync tracking
    this.sync.intervals.clear();
    this.sync.lastSync.clear();
    this.sync.syncStatus.clear();
    this.sync.dataCache.clear();

    logInfo('Sentia MCP Integration Layer shutdown complete');
  }
}

export default SentiaIntegrationLayer;