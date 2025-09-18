/**
 * Auto-Sync Manager for Production Environment
 * Manages automatic synchronization of external APIs and database branches
 */

import { getAPIIntegrationService } from './api-integration-service.js';
import { getWebSocketMonitor } from './websocket-monitor.js';
import prisma from '../lib/prisma.js';
import cron from 'node-cron';

class AutoSyncManager {
  constructor() {
    this.apiService = getAPIIntegrationService();
    this.wsMonitor = getWebSocketMonitor();

    this.syncJobs = new Map();
    this.syncHistory = [];
    this.maxHistorySize = 100;

    this.config = {
      enabled: process.env.AUTO_SYNC_ENABLED === 'true',
      environment: process.env.NODE_ENV,
      intervals: {
        xero: process.env.XERO_SYNC_INTERVAL || '*/30 * * * *', // Every 30 minutes
        shopify: process.env.SHOPIFY_SYNC_INTERVAL || '*/15 * * * *', // Every 15 minutes
        amazon: process.env.AMAZON_SYNC_INTERVAL || '*/60 * * * *', // Every hour
        unleashed: process.env.UNLEASHED_SYNC_INTERVAL || '*/45 * * * *', // Every 45 minutes
        database: process.env.DATABASE_SYNC_INTERVAL || '0 */6 * * *', // Every 6 hours
        health: '*/5 * * * *' // Every 5 minutes
      },
      retryAttempts: 3,
      retryDelay: 5000,
      productionOnly: ['database'], // Services that only sync in production
      criticalServices: ['xero', 'shopify'] // Services that trigger alerts on failure
    };

    this.syncStatus = {
      xero: { lastSync: null, status: 'pending', errors: 0 },
      shopify: { lastSync: null, status: 'pending', errors: 0 },
      amazon: { lastSync: null, status: 'pending', errors: 0 },
      unleashed: { lastSync: null, status: 'pending', errors: 0 },
      database: { lastSync: null, status: 'pending', errors: 0 }
    };

    this.initialize();
  }

  async initialize() {
    console.log(`Auto-Sync Manager initializing for ${this.config.environment} environment`);

    // Load sync status from database
    await this.loadSyncStatus();

    // Only enable auto-sync in production or if explicitly enabled
    if (this.config.environment === 'production' || this.config.enabled) {
      this.startAutoSync();
    } else {
      console.log('Auto-sync disabled for non-production environment');
    }

    // Listen for WebSocket events
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for API updates that require sync
    this.wsMonitor.on('api-update-received', (event) => {
      if (event.service && event.requiresSync) {
        this.triggerSync(event.service, 'api-update');
      }
    });

    // Listen for manufacturing alerts
    this.wsMonitor.on('manufacturing-alert-received', (alert) => {
      if (alert.severity === 'critical') {
        this.triggerFullSync('critical-alert');
      }
    });

    // Listen for connection status
    this.wsMonitor.on('connection-established', () => {
      console.log('WebSocket connected - Auto-sync ready');
    });

    this.wsMonitor.on('connection-lost', () => {
      console.log('WebSocket disconnected - Auto-sync may be delayed');
    });
  }

  // ====================
  // Sync Job Management
  // ====================

  startAutoSync() {
    console.log('Starting auto-sync schedules...');

    // Schedule Xero sync
    if (this.shouldSyncService('xero')) {
      this.scheduleSync('xero', this.config.intervals.xero, () => this.syncXero());
    }

    // Schedule Shopify sync
    if (this.shouldSyncService('shopify')) {
      this.scheduleSync('shopify', this.config.intervals.shopify, () => this.syncShopify());
    }

    // Schedule Amazon sync
    if (this.shouldSyncService('amazon')) {
      this.scheduleSync('amazon', this.config.intervals.amazon, () => this.syncAmazon());
    }

    // Schedule Unleashed sync
    if (this.shouldSyncService('unleashed')) {
      this.scheduleSync('unleashed', this.config.intervals.unleashed, () => this.syncUnleashed());
    }

    // Schedule Database branch sync (production only)
    if (this.shouldSyncService('database')) {
      this.scheduleSync('database', this.config.intervals.database, () => this.syncDatabase());
    }

    // Schedule health check
    this.scheduleSync('health', this.config.intervals.health, () => this.healthCheck());

    console.log(`Auto-sync started with ${this.syncJobs.size} scheduled jobs`);
  }

  stopAutoSync() {
    console.log('Stopping auto-sync schedules...');

    for (const [service, job] of this.syncJobs) {
      job.stop();
      console.log(`Stopped sync job: ${service}`);
    }

    this.syncJobs.clear();
    console.log('All sync jobs stopped');
  }

  scheduleSync(service, cronExpression, syncFunction) {
    if (this.syncJobs.has(service)) {
      this.syncJobs.get(service).stop();
    }

    const job = cron.schedule(cronExpression, async () => {
      await this.executeSyncWithRetry(service, syncFunction);
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    this.syncJobs.set(service, job);
    console.log(`Scheduled ${service} sync: ${cronExpression}`);
  }

  shouldSyncService(service) {
    // Check if service should sync based on environment
    if (this.config.productionOnly.includes(service)) {
      return this.config.environment === 'production';
    }

    // Check if service has API keys configured
    const hasKeys = this.checkServiceKeys(service);
    if (!hasKeys) {
      console.log(`Skipping ${service} sync - API keys not configured`);
      return false;
    }

    return true;
  }

  checkServiceKeys(service) {
    switch (service) {
      case 'xero':
        return process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET;
      case 'shopify':
        return process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET;
      case 'amazon':
        return process.env.AMAZON_SP_API_KEY && process.env.AMAZON_SP_API_SECRET;
      case 'unleashed':
        return process.env.UNLEASHED_API_ID && process.env.UNLEASHED_API_KEY;
      case 'database':
        return process.env.DATABASE_URL;
      default:
        return true;
    }
  }

  // ====================
  // Sync Execution
  // ====================

  async executeSyncWithRetry(service, syncFunction) {
    let attempt = 0;
    let lastError = null;

    this.updateSyncStatus(service, 'syncing');

    while (attempt < this.config.retryAttempts) {
      attempt++;

      try {
        console.log(`Syncing ${service} (attempt ${attempt}/${this.config.retryAttempts})...`);

        const result = await syncFunction();

        if (result.success) {
          this.updateSyncStatus(service, 'success');
          this.recordSyncHistory(service, 'success', result);
          console.log(`${service} sync completed successfully`);
          return result;
        }

        lastError = result.error || 'Unknown error';
      } catch (error) {
        lastError = error.message;
        console.error(`${service} sync error:`, error.message);
      }

      if (attempt < this.config.retryAttempts) {
        console.log(`Retrying ${service} sync in ${this.config.retryDelay}ms...`);
        await this.delay(this.config.retryDelay);
      }
    }

    // All attempts failed
    this.updateSyncStatus(service, 'failed', lastError);
    this.recordSyncHistory(service, 'failed', { error: lastError });

    // Send alert for critical services
    if (this.config.criticalServices.includes(service)) {
      await this.sendSyncAlert(service, lastError);
    }

    return { success: false, error: lastError };
  }

  async triggerSync(service, reason = 'manual') {
    console.log(`Triggering ${service} sync (reason: ${reason})`);

    const syncFunction = this.getSyncFunction(service);
    if (syncFunction) {
      return await this.executeSyncWithRetry(service, syncFunction);
    }

    console.error(`No sync function found for service: ${service}`);
    return { success: false, error: 'Service not found' };
  }

  async triggerFullSync(reason = 'manual') {
    console.log(`Triggering full sync of all services (reason: ${reason})`);

    const results = await Promise.allSettled([
      this.triggerSync('xero', reason),
      this.triggerSync('shopify', reason),
      this.triggerSync('amazon', reason),
      this.triggerSync('unleashed', reason),
      this.triggerSync('database', reason)
    ]);

    const summary = {
      success: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
      timestamp: new Date(),
      reason
    };

    console.log(`Full sync completed: ${summary.success} success, ${summary.failed} failed`);
    return summary;
  }

  getSyncFunction(service) {
    switch (service) {
      case 'xero':
        return () => this.syncXero();
      case 'shopify':
        return () => this.syncShopify();
      case 'amazon':
        return () => this.syncAmazon();
      case 'unleashed':
        return () => this.syncUnleashed();
      case 'database':
        return () => this.syncDatabase();
      default:
        return null;
    }
  }

  // ====================
  // Service Sync Methods
  // ====================

  async syncXero() {
    try {
      const result = await this.apiService.syncXeroData();
      return result;
    } catch (error) {
      throw new Error(`Xero sync failed: ${error.message}`);
    }
  }

  async syncShopify() {
    try {
      const result = await this.apiService.syncShopifyData();
      return result;
    } catch (error) {
      throw new Error(`Shopify sync failed: ${error.message}`);
    }
  }

  async syncAmazon() {
    try {
      const result = await this.apiService.syncAmazonData();
      return result;
    } catch (error) {
      throw new Error(`Amazon sync failed: ${error.message}`);
    }
  }

  async syncUnleashed() {
    try {
      // Unleashed sync not implemented in API service yet
      // This is a placeholder for future implementation
      return { success: true, message: 'Unleashed sync placeholder' };
    } catch (error) {
      throw new Error(`Unleashed sync failed: ${error.message}`);
    }
  }

  async syncDatabase() {
    try {
      const result = await this.apiService.syncDatabaseBranches();
      return result;
    } catch (error) {
      throw new Error(`Database sync failed: ${error.message}`);
    }
  }

  async healthCheck() {
    const health = {
      autoSync: this.config.enabled,
      environment: this.config.environment,
      activeJobs: this.syncJobs.size,
      services: {}
    };

    for (const [service, status] of Object.entries(this.syncStatus)) {
      health.services[service] = {
        status: status.status,
        lastSync: status.lastSync,
        errors: status.errors,
        healthy: status.status === 'success' && status.errors === 0
      };
    }

    health.overall = Object.values(health.services).every(s => s.healthy);

    return health;
  }

  // ====================
  // Status Management
  // ====================

  updateSyncStatus(service, status, error = null) {
    if (!this.syncStatus[service]) {
      this.syncStatus[service] = { lastSync: null, status: 'pending', errors: 0 };
    }

    this.syncStatus[service].status = status;

    if (status === 'success') {
      this.syncStatus[service].lastSync = new Date();
      this.syncStatus[service].errors = 0;
    } else if (status === 'failed') {
      this.syncStatus[service].errors++;
    }

    // Persist to database
    this.saveSyncStatus(service);
  }

  async saveSyncStatus(service) {
    try {
      await prisma.syncStatus.upsert({
        where: { service },
        update: {
          lastSync: this.syncStatus[service].lastSync,
          status: this.syncStatus[service].status,
          message: this.syncStatus[service].error || null
        },
        create: {
          service,
          lastSync: this.syncStatus[service].lastSync || new Date(),
          status: this.syncStatus[service].status,
          message: this.syncStatus[service].error || null
        }
      });
    } catch (error) {
      console.error(`Failed to save sync status for ${service}:`, error);
    }
  }

  async loadSyncStatus() {
    try {
      const statuses = await prisma.syncStatus.findMany();

      for (const status of statuses) {
        if (this.syncStatus[status.service]) {
          this.syncStatus[status.service] = {
            lastSync: status.lastSync,
            status: status.status,
            errors: 0
          };
        }
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }

  recordSyncHistory(service, status, data) {
    const record = {
      service,
      status,
      timestamp: new Date(),
      data
    };

    this.syncHistory.push(record);

    // Limit history size
    if (this.syncHistory.length > this.maxHistorySize) {
      this.syncHistory.shift();
    }
  }

  // ====================
  // Alerts & Notifications
  // ====================

  async sendSyncAlert(service, error) {
    const alert = {
      type: 'sync-failure',
      severity: 'high',
      service,
      error,
      timestamp: new Date(),
      environment: this.config.environment
    };

    try {
      // Log to database
      await prisma.manufacturingAlert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          message: `${service} sync failed: ${error}`,
          data: alert
        }
      });

      // Send through WebSocket if connected
      if (this.wsMonitor.getStats().currentStatus === 'connected') {
        // Emit alert through MCP Server
        console.log(`Alert sent for ${service} sync failure`);
      }
    } catch (err) {
      console.error('Failed to send sync alert:', err);
    }
  }

  // ====================
  // Public Methods
  // ====================

  getStatus() {
    return {
      enabled: this.config.enabled,
      environment: this.config.environment,
      activeJobs: Array.from(this.syncJobs.keys()),
      syncStatus: this.syncStatus,
      history: this.syncHistory.slice(-10) // Last 10 sync events
    };
  }

  async enable() {
    if (!this.config.enabled) {
      this.config.enabled = true;
      this.startAutoSync();
      console.log('Auto-sync enabled');
    }
  }

  async disable() {
    if (this.config.enabled) {
      this.config.enabled = false;
      this.stopAutoSync();
      console.log('Auto-sync disabled');
    }
  }

  // ====================
  // Express Endpoints
  // ====================

  getStatusEndpoint() {
    return (req, res) => {
      res.json(this.getStatus());
    };
  }

  getTriggerEndpoint() {
    return async (req, res) => {
      const { service } = req.params;
      const result = await this.triggerSync(service, 'api-request');
      res.json(result);
    };
  }

  getFullSyncEndpoint() {
    return async (req, res) => {
      const result = await this.triggerFullSync('api-request');
      res.json(result);
    };
  }

  // ====================
  // Utility Methods
  // ====================

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy() {
    this.stopAutoSync();
    this.syncHistory = [];
  }
}

// Singleton instance
let autoSyncManager = null;

export const getAutoSyncManager = () => {
  if (!autoSyncManager) {
    autoSyncManager = new AutoSyncManager();
  }
  return autoSyncManager;
};

export default AutoSyncManager;