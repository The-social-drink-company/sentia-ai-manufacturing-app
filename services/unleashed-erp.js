import axios from 'axios';
import crypto from 'crypto';
import redisCacheService from './redis-cache.js';

class UnleashedERPService {
  constructor() {
    this.apiId = process.env.UNLEASHED_API_ID;
    this.apiKey = process.env.UNLEASHED_API_KEY;
    this.baseUrl = process.env.UNLEASHED_BASE_URL || 'https://api.unleashedsoftware.com';
    this.isConnected = false;
    this.syncInterval = null;
    this.syncFrequency = 15 * 60 * 1000; // 15 minutes
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.request.use(
      (config) => this.addAuthHeaders(config),
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('UNLEASHED ERP: Request failed:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  addAuthHeaders(config) {
    if (!this.apiId || !this.apiKey) {
      throw new Error('UNLEASHED ERP: Missing API credentials');
    }

    const timestamp = new Date().toISOString();
    const signature = this.generateSignature(config.method?.toUpperCase() || 'GET', config.url || '', timestamp);

    config.headers = {
      ...config.headers,
      'api-auth-id': this.apiId,
      'api-auth-signature': signature,
      'api-auth-timestamp': timestamp
    };

    return config;
  }

  generateSignature(method, url, timestamp) {
    const queryString = url.includes('?') ? url.split('?')[1] : '';
    const signatureText = `${method}${url}${this.apiId}${timestamp}${queryString}`;
    
    return crypto
      .createHmac('sha256', this.apiKey)
      .update(signatureText)
      .digest('base64');
  }

  async connect() {
    try {
      console.log('UNLEASHED ERP: Initializing connection...');

      if (!this.apiId || !this.apiKey) {
        throw new Error('Missing Unleashed ERP API credentials');
      }

      // Test connection with a simple API call
      const response = await this.client.get('/Products/1');
      
      if (response.status === 200 || response.status === 404) {
        this.isConnected = true;
        console.log('UNLEASHED ERP: Connected successfully');
        await this.startSyncScheduler();
        return true;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

    } catch (error) {
      console.error('UNLEASHED ERP: Connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async startSyncScheduler() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`UNLEASHED ERP: Starting sync scheduler (every ${this.syncFrequency / 1000 / 60} minutes)`);
    
    // Initial sync
    await this.syncAllData();

    // Schedule regular syncs
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncAllData();
      } catch (error) {
        console.error('UNLEASHED ERP: Scheduled sync failed:', error);
      }
    }, this.syncFrequency);
  }

  async syncAllData() {
    if (!this.isConnected) {
      console.warn('UNLEASHED ERP: Not connected, skipping sync');
      return;
    }

    console.log('UNLEASHED ERP: Starting comprehensive data sync...');
    const syncResults = {};

    try {
      // Sync production data
      syncResults.production = await this.syncProductionData();
      console.log('UNLEASHED ERP: Production data synced');

      // Sync inventory data
      syncResults.inventory = await this.syncInventoryData();
      console.log('UNLEASHED ERP: Inventory data synced');

      // Sync sales orders
      syncResults.salesOrders = await this.syncSalesOrderData();
      console.log('UNLEASHED ERP: Sales orders synced');

      // Sync purchase orders
      syncResults.purchaseOrders = await this.syncPurchaseOrderData();
      console.log('UNLEASHED ERP: Purchase orders synced');

      // Sync resources/assets
      syncResults.resources = await this.syncResourceData();
      console.log('UNLEASHED ERP: Resources synced');

      // Generate consolidated manufacturing data
      const consolidatedData = this.consolidateManufacturingData(syncResults);
      
      // Cache the consolidated data
      await redisCacheService.set('unleashed:consolidated_data', consolidatedData, 1800); // 30 min cache
      await redisCacheService.set('unleashed:last_sync', new Date().toISOString(), 3600);

      console.log('UNLEASHED ERP: Sync completed successfully');
      return consolidatedData;

    } catch (error) {
      console.error('UNLEASHED ERP: Sync failed:', error);
      throw error;
    }
  }

  async syncProductionData() {
    try {
      const response = await this.client.get('/AssemblyJobs', {
        params: {
          pageSize: 100,
          page: 1,
          orderBy: 'ModifiedOn',
          orderDirection: 'Desc'
        }
      });

      const assemblyJobs = response.data?.Items || [];
      
      const productionMetrics = {
        activeBatches: assemblyJobs.filter(job => job.JobStatus === 'InProgress').length,
        completedToday: this.getJobsCompletedToday(assemblyJobs),
        totalJobs: assemblyJobs.length,
        qualityScore: this.calculateQualityScore(assemblyJobs),
        utilizationRate: this.calculateUtilizationRate(assemblyJobs)
      };

      const productionSchedule = assemblyJobs
        .filter(job => job.JobStatus === 'Planned')
        .slice(0, 10)
        .map(job => ({
          jobId: job.Guid,
          productName: job.Product?.ProductDescription || 'Unknown Product',
          quantity: job.PlannedQuantity || 0,
          scheduledTime: job.PlannedStartDate,
          priority: job.Priority || 'Normal'
        }));

      const qualityAlerts = assemblyJobs
        .filter(job => this.hasQualityIssues(job))
        .slice(0, 5)
        .map(job => ({
          batchId: job.AssemblyJobNumber,
          issue: this.getQualityIssue(job),
          severity: 'Medium',
          timestamp: job.ModifiedOn
        }));

      // Cache production data
      const cacheKey = redisCacheService.generateCacheKey('unleashed', 'production');
      await redisCacheService.set(cacheKey, {
        metrics: productionMetrics,
        schedule: productionSchedule,
        alerts: qualityAlerts
      }, 900); // 15 min cache

      return {
        metrics: productionMetrics,
        schedule: productionSchedule,
        alerts: qualityAlerts,
        rawJobs: assemblyJobs.slice(0, 20) // Keep sample for analysis
      };

    } catch (error) {
      console.error('UNLEASHED ERP: Production sync failed:', error);
      return {
        metrics: { activeBatches: 0, completedToday: 0, qualityScore: 0, utilizationRate: 0 },
        schedule: [],
        alerts: []
      };
    }
  }

  async syncInventoryData() {
    try {
      const response = await this.client.get('/StockOnHand', {
        params: {
          pageSize: 250,
          page: 1,
          orderBy: 'LastModifiedOn',
          orderDirection: 'Desc'
        }
      });

      const stockItems = response.data?.Items || [];
      
      const inventoryMetrics = {
        totalItems: stockItems.length,
        totalValue: stockItems.reduce((sum, item) => sum + (item.QtyOnHand * item.AverageLandedCost), 0),
        lowStockItems: stockItems.filter(item => item.QtyOnHand < (item.MinStockLevel || 10)).length,
        zeroStockItems: stockItems.filter(item => item.QtyOnHand === 0).length
      };

      const lowStockAlerts = stockItems
        .filter(item => item.QtyOnHand < (item.MinStockLevel || 10))
        .slice(0, 10)
        .map(item => ({
          productCode: item.ProductCode,
          description: item.Product?.ProductDescription,
          currentStock: item.QtyOnHand,
          minLevel: item.MinStockLevel || 10,
          location: item.Warehouse?.WarehouseName
        }));

      // Cache inventory data
      const cacheKey = redisCacheService.generateCacheKey('unleashed', 'inventory');
      await redisCacheService.set(cacheKey, {
        metrics: inventoryMetrics,
        alerts: lowStockAlerts
      }, 900); // 15 min cache

      return {
        metrics: inventoryMetrics,
        alerts: lowStockAlerts,
        rawStock: stockItems.slice(0, 50) // Keep sample for analysis
      };

    } catch (error) {
      console.error('UNLEASHED ERP: Inventory sync failed:', error);
      return {
        metrics: { totalItems: 0, totalValue: 0, lowStockItems: 0, zeroStockItems: 0 },
        alerts: []
      };
    }
  }

  async syncSalesOrderData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const response = await this.client.get('/SalesOrders', {
        params: {
          pageSize: 100,
          page: 1,
          modifiedSince: thirtyDaysAgo.toISOString(),
          orderBy: 'OrderDate',
          orderDirection: 'Desc'
        }
      });

      const salesOrders = response.data?.Items || [];
      
      const salesMetrics = {
        totalOrders: salesOrders.length,
        totalValue: salesOrders.reduce((sum, order) => sum + (order.Total || 0), 0),
        pendingOrders: salesOrders.filter(order => order.OrderStatus === 'Placed').length,
        fulfilledOrders: salesOrders.filter(order => order.OrderStatus === 'Completed').length
      };

      // Cache sales data
      const cacheKey = redisCacheService.generateCacheKey('unleashed', 'sales');
      await redisCacheService.set(cacheKey, {
        metrics: salesMetrics
      }, 900); // 15 min cache

      return {
        metrics: salesMetrics,
        rawOrders: salesOrders.slice(0, 20) // Keep sample for analysis
      };

    } catch (error) {
      console.error('UNLEASHED ERP: Sales order sync failed:', error);
      return {
        metrics: { totalOrders: 0, totalValue: 0, pendingOrders: 0, fulfilledOrders: 0 }
      };
    }
  }

  async syncPurchaseOrderData() {
    try {
      const response = await this.client.get('/PurchaseOrders', {
        params: {
          pageSize: 50,
          page: 1,
          orderBy: 'OrderDate',
          orderDirection: 'Desc'
        }
      });

      const purchaseOrders = response.data?.Items || [];
      
      const purchaseMetrics = {
        totalOrders: purchaseOrders.length,
        totalValue: purchaseOrders.reduce((sum, order) => sum + (order.Total || 0), 0),
        pendingOrders: purchaseOrders.filter(order => order.OrderStatus === 'Placed').length
      };

      return {
        metrics: purchaseMetrics,
        rawOrders: purchaseOrders.slice(0, 10) // Keep sample for analysis
      };

    } catch (error) {
      console.error('UNLEASHED ERP: Purchase order sync failed:', error);
      return {
        metrics: { totalOrders: 0, totalValue: 0, pendingOrders: 0 }
      };
    }
  }

  async syncResourceData() {
    // Mock resource data since Unleashed doesn't have a specific resource endpoint
    const mockResources = [
      { id: 'line_1', name: 'Production Line 1', status: 'active', utilization: 87 },
      { id: 'line_2', name: 'Production Line 2', status: 'active', utilization: 92 },
      { id: 'packaging', name: 'Packaging Unit', status: 'maintenance', utilization: 0 },
      { id: 'quality_station', name: 'Quality Control', status: 'active', utilization: 76 }
    ];

    const resourceMetrics = {
      totalResources: mockResources.length,
      activeResources: mockResources.filter(r => r.status === 'active').length,
      averageUtilization: mockResources.reduce((sum, r) => sum + r.utilization, 0) / mockResources.length
    };

    return {
      metrics: resourceMetrics,
      status: mockResources
    };
  }

  consolidateManufacturingData(syncResults) {
    const now = new Date().toISOString();

    return {
      production: {
        activeBatches: syncResults.production?.metrics?.activeBatches || 0,
        completedToday: syncResults.production?.metrics?.completedToday || 0,
        qualityScore: syncResults.production?.metrics?.qualityScore || 95.0,
        utilizationRate: syncResults.resources?.metrics?.averageUtilization || 85.0
      },
      resources: {
        status: syncResults.resources?.status || [],
        utilizationRate: syncResults.resources?.metrics?.averageUtilization || 85.0
      },
      productionSchedule: syncResults.production?.schedule || [],
      qualityAlerts: syncResults.production?.alerts || [],
      inventoryAlerts: syncResults.inventory?.alerts || [],
      lastUpdated: now
    };
  }

  async getConsolidatedData() {
    try {
      // Try cache first
      const cached = await redisCacheService.get('unleashed:consolidated_data');
      if (cached) {
        return cached;
      }

      // If no cache, trigger sync
      console.log('UNLEASHED ERP: No cached data, triggering sync...');
      return await this.syncAllData();
      
    } catch (error) {
      console.error('UNLEASHED ERP: Error getting consolidated data:', error);
      return {
        error: error.message,
        production: {
          activeBatches: 0,
          completedToday: 0,
          qualityScore: 0,
          utilizationRate: 0
        },
        resources: { status: [], utilizationRate: 0 },
        productionSchedule: [],
        qualityAlerts: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Helper methods
  getJobsCompletedToday(jobs) {
    const today = new Date().toDateString();
    return jobs.filter(job => 
      job.CompletedDate && new Date(job.CompletedDate).toDateString() === today
    ).length;
  }

  calculateQualityScore(jobs) {
    const completedJobs = jobs.filter(job => job.JobStatus === 'Completed');
    if (completedJobs.length === 0) return 95.0;

    const qualityJobs = completedJobs.filter(job => !this.hasQualityIssues(job));
    return (qualityJobs.length / completedJobs.length) * 100;
  }

  calculateUtilizationRate(jobs) {
    const activeJobs = jobs.filter(job => job.JobStatus === 'InProgress');
    // Simple calculation based on active jobs vs planned capacity
    return Math.min((activeJobs.length / 4) * 100, 100); // Assume capacity of 4 concurrent jobs
  }

  hasQualityIssues(job) {
    // Mock quality issue detection logic
    return job.ActualQuantity < job.PlannedQuantity * 0.95;
  }

  getQualityIssue(job) {
    if (job.ActualQuantity < job.PlannedQuantity * 0.95) {
      return `Yield shortfall: ${job.ActualQuantity}/${job.PlannedQuantity}`;
    }
    return 'Quality parameters outside tolerance';
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      apiEndpoint: this.baseUrl,
      lastSync: null, // Will be populated from cache
      syncInterval: this.syncFrequency / 1000 / 60 + ' minutes'
    };
  }

  async disconnect() {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      this.isConnected = false;
      console.log('UNLEASHED ERP: Disconnected successfully');
    } catch (error) {
      console.error('UNLEASHED ERP: Disconnect error:', error);
    }
  }
}

const unleashedERPService = new UnleashedERPService();

export default unleashedERPService;