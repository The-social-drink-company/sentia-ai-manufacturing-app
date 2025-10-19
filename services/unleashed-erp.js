import axios from 'axios';
import crypto from 'crypto';
import redisCacheService from './redis-cache.js';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';
import sseService from '../server/services/sse/index.cjs';


class UnleashedERPService {
  constructor() {
    this.apiId = process.env.UNLEASHED_API_ID;
    this.apiKey = process.env.UNLEASHED_API_KEY;
    this.baseUrl = process.env.UNLEASHED_API_URL || 'https://api.unleashedsoftware.com';
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

    // Extract query string from URL if present
    const url = config.url || '';
    const queryString = url.includes('?') ? url.split('?')[1] : '';
    const signature = this.generateSignature(queryString);

    config.headers = {
      ...config.headers,
      'api-auth-id': this.apiId,
      'api-auth-signature': signature
    };

    return config;
  }

  generateSignature(queryString) {
    // Unleashed API expects simple HMAC-SHA256 of query string only
    return crypto
      .createHmac('sha256', this.apiKey)
      .update(queryString || '')
      .digest('base64');
  }

  async connect() {
    try {
      logDebug('UNLEASHED ERP: Initializing connection...');

      if (!this.apiId || !this.apiKey) {
        throw new Error('Missing Unleashed ERP API credentials');
      }

      // Test connection with a safe API call
      const response = await this.client.get('/Currencies', {
        params: { pageSize: 1 }
      });

      if (response.status === 200) {
        this.isConnected = true;
        logDebug('UNLEASHED ERP: Connected successfully');
        await this.startSyncScheduler();
        return true;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

    } catch (error) {
      logError('UNLEASHED ERP: Connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async startSyncScheduler() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    logDebug(`UNLEASHED ERP: Starting sync scheduler (every ${this.syncFrequency / 1000 / 60} minutes)`);
    
    // Initial sync
    await this.syncAllData();

    // Schedule regular syncs
    this.syncInterval = setInterval(async _() => {
      try {
        await this.syncAllData();
      } catch (error) {
        logError('UNLEASHED ERP: Scheduled sync failed:', error);
      }
    }, this.syncFrequency);
  }

  async syncAllData() {
    if (!this.isConnected) {
      logWarn('UNLEASHED ERP: Not connected, skipping sync');
      return;
    }

    logDebug('UNLEASHED ERP: Starting comprehensive data sync...');
    const syncResults = {};

    // Send SSE event: sync started
    sseService.broadcast('unleashed-sync-started', {
      timestamp: new Date().toISOString()
    });

    try {
      // Sync production data
      syncResults.production = await this.syncProductionData();
      logDebug('UNLEASHED ERP: Production data synced');

      // Sync inventory data
      syncResults.inventory = await this.syncInventoryData();
      logDebug('UNLEASHED ERP: Inventory data synced');

      // Sync sales orders
      syncResults.salesOrders = await this.syncSalesOrderData();
      logDebug('UNLEASHED ERP: Sales orders synced');

      // Sync purchase orders
      syncResults.purchaseOrders = await this.syncPurchaseOrderData();
      logDebug('UNLEASHED ERP: Purchase orders synced');

      // Sync resources/assets
      syncResults.resources = await this.syncResourceData();
      logDebug('UNLEASHED ERP: Resources synced');

      // Generate consolidated manufacturing data
      const consolidatedData = this.consolidateManufacturingData(syncResults);

      // Cache the consolidated data
      await redisCacheService.set('unleashed:consolidated_data', consolidatedData, 1800); // 30 min cache
      await redisCacheService.set('unleashed:last_sync', new Date().toISOString(), 3600);

      logDebug('UNLEASHED ERP: Sync completed successfully');

      // Send SSE event: sync completed
      sseService.broadcast('unleashed-sync-completed', {
        production: {
          activeBatches: consolidatedData.production.activeBatches,
          completedToday: consolidatedData.production.completedToday,
          qualityScore: consolidatedData.production.qualityScore,
          utilizationRate: consolidatedData.production.utilizationRate
        },
        inventory: {
          totalItems: syncResults.inventory?.metrics?.totalItems || 0,
          totalValue: syncResults.inventory?.metrics?.totalValue || 0,
          lowStockItems: syncResults.inventory?.alerts?.length || 0
        },
        alerts: {
          qualityAlerts: consolidatedData.qualityAlerts.length,
          inventoryAlerts: consolidatedData.inventoryAlerts.length
        },
        timestamp: new Date().toISOString()
      });

      return consolidatedData;

    } catch (error) {
      logError('UNLEASHED ERP: Sync failed:', error);

      // Send SSE event: sync error
      sseService.broadcast('unleashed-sync-error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

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

      // Send SSE event if quality issues detected
      if (qualityAlerts.length > 0) {
        sseService.broadcast('unleashed-quality-alert', {
          count: qualityAlerts.length,
          criticalIssues: qualityAlerts.filter(a => a.severity === 'High').length,
          alerts: qualityAlerts.slice(0, 3), // Top 3 critical alerts
          timestamp: new Date().toISOString()
        });
      }

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
      logError('UNLEASHED ERP: Production sync failed:', error);
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

      // Send SSE event if low-stock items detected
      if (lowStockAlerts.length > 0) {
        sseService.broadcast('unleashed-low-stock-alert', {
          count: lowStockAlerts.length,
          criticalItems: lowStockAlerts.filter(item => item.currentStock === 0).length,
          items: lowStockAlerts.slice(0, 5), // Top 5 critical items
          timestamp: new Date().toISOString()
        });
      }

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
      logError('UNLEASHED ERP: Inventory sync failed:', error);
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
      logError('UNLEASHED ERP: Sales order sync failed:', error);
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
      logError('UNLEASHED ERP: Purchase order sync failed:', error);
      return {
        metrics: { totalOrders: 0, totalValue: 0, pendingOrders: 0 }
      };
    }
  }

  async syncResourceData() {
    // NOTE: Unleashed API doesn't have a specific resource/equipment endpoint
    // Calculate resource utilization from AssemblyJobs data instead
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
      const activeJobs = assemblyJobs.filter(job => job.JobStatus === 'InProgress');
      const plannedJobs = assemblyJobs.filter(job => job.JobStatus === 'Planned');

      // Calculate utilization from real job data
      // Assume manufacturing capacity of 4 concurrent production lines
      const maxCapacity = 4;
      const averageUtilization = Math.min((activeJobs.length / maxCapacity) * 100, 100);

      const resourceMetrics = {
        activeJobs: activeJobs.length,
        plannedJobs: plannedJobs.length,
        totalCapacity: maxCapacity,
        averageUtilization: parseFloat(averageUtilization.toFixed(1)),
        utilizationDetails: {
          note: 'Calculated from AssemblyJobs (Unleashed API has no direct resource endpoint)',
          activeJobCount: activeJobs.length,
          maxConcurrentCapacity: maxCapacity
        }
      };

      return {
        metrics: resourceMetrics,
        status: [] // No specific resource status available from Unleashed API
      };

    } catch (error) {
      logError('UNLEASHED ERP: Resource data calculation failed:', error);
      return {
        metrics: {
          activeJobs: 0,
          plannedJobs: 0,
          totalCapacity: 4,
          averageUtilization: 0,
          utilizationDetails: {
            note: 'Data unavailable - Unleashed API connection error',
            error: error.message
          }
        },
        status: []
      };
    }
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
      logDebug('UNLEASHED ERP: No cached data, triggering sync...');
      return await this.syncAllData();
      
    } catch (error) {
      logError('UNLEASHED ERP: Error getting consolidated data:', error);
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
      logDebug('UNLEASHED ERP: Disconnected successfully');
    } catch (error) {
      logError('UNLEASHED ERP: Disconnect error:', error);
    }
  }
}

const unleashedERPService = new UnleashedERPService();

export default unleashedERPService;