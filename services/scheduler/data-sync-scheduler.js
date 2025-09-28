#!/usr/bin/env node

/**
 * Automated Data Synchronization Scheduler
 * Manages periodic imports from all external systems
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';
import { amazonSPAPI } from '../api/amazon-sp-api-config.js';

const prisma = new PrismaClient();

class DataSyncScheduler {
  constructor() {
    this.scheduledTasks = new Map();
    this.isRunning = false;
    this.syncHistory = [];
    this.maxHistoryEntries = 100;
  }

  async initialize() {
    try {
      logInfo('Initializing Data Sync Scheduler');
      
      // Initialize all API connections
      await this.initializeAPIs();
      
      // Schedule all sync tasks
      this.scheduleAllSyncs();
      
      this.isRunning = true;
      logInfo('Data Sync Scheduler initialized successfully');
      
    } catch (error) {
      logError('Failed to initialize Data Sync Scheduler', error);
      throw error;
    }
  }

  async initializeAPIs() {
    logInfo('Initializing external API connections');
    
    // Initialize Amazon SP-API if configured
    try {
      await amazonSPAPI.initialize();
    } catch (error) {
      logWarn('Amazon SP-API initialization failed', error);
    }

    // Add other API initializations here as needed
    // await shopifyAPI.initialize();
    // await unleashedAPI.initialize();
    // await xeroAPI.initialize();
  }

  scheduleAllSyncs() {
    logInfo('Setting up data synchronization schedules');

    // Amazon SP-API: Every 4 hours
    this.scheduledTasks.set('amazon-sync', cron.schedule('0 */4 * * *', 
      () => this.performAmazonSync(),
      { scheduled: false }
    ));

    // Shopify: Every 2 hours
    this.scheduledTasks.set('shopify-sync', cron.schedule('0 */2 * * *',
      () => this.performShopifySync(),
      { scheduled: false }
    ));

    // Unleashed ERP: Every 6 hours
    this.scheduledTasks.set('unleashed-sync', cron.schedule('0 */6 * * *',
      () => this.performUnleashedSync(),
      { scheduled: false }
    ));

    // Xero Accounting: Daily at 2 AM
    this.scheduledTasks.set('xero-sync', cron.schedule('0 2 * * *',
      () => this.performXeroSync(),
      { scheduled: false }
    ));

    // Health check and cleanup: Daily at 1 AM
    this.scheduledTasks.set('maintenance', cron.schedule('0 1 * * *',
      () => this.performMaintenance(),
      { scheduled: false }
    ));

    // Start all scheduled tasks
    this.startAllSchedules();
  }

  startAllSchedules() {
    this.scheduledTasks.forEach(_(task, _name) => {
      task.start();
      logInfo(`Started sync schedule: ${name}`);
    });

    // Perform initial sync for all systems
    setTimeout(() => {
      this.performInitialSync();
    }, 5000); // Wait 5 seconds for systems to be ready
  }

  async performInitialSync() {
    logInfo('Performing initial data synchronization');
    
    try {
      await Promise.allSettled([
        this.performAmazonSync(),
        this.performShopifySync(),
        this.performUnleashedSync(),
        this.performXeroSync()
      ]);
      
      logInfo('Initial data synchronization completed');
    } catch (error) {
      logError('Initial sync failed', error);
    }
  }

  async performAmazonSync() {
    const syncId = `amazon-${Date.now()}`;
    logInfo('Starting Amazon SP-API sync', { syncId });

    try {
      const startTime = Date.now();
      const result = await amazonSPAPI.performFullSync();
      const duration = Date.now() - startTime;

      const syncRecord = {
        id: syncId,
        source: 'Amazon SP-API',
        startTime: new Date(startTime),
        duration,
        success: result.success,
        recordsProcessed: (result.orders || 0) + (result.inventory || 0),
        details: result,
        error: result.error || null
      };

      await this.recordSyncHistory(syncRecord);
      
      if (result.success) {
        logInfo('Amazon SP-API sync completed successfully', syncRecord);
      } else {
        logError('Amazon SP-API sync failed', syncRecord);
      }

      return syncRecord;

    } catch (error) {
      const syncRecord = {
        id: syncId,
        source: 'Amazon SP-API',
        startTime: new Date(),
        duration: 0,
        success: false,
        recordsProcessed: 0,
        error: error.message
      };

      await this.recordSyncHistory(syncRecord);
      logError('Amazon SP-API sync error', error);
      return syncRecord;
    }
  }

  async performShopifySync() {
    const syncId = `shopify-${Date.now()}`;
    logInfo('Starting Shopify sync', { syncId });

    try {
      const startTime = Date.now();
      
      // Placeholder for Shopify sync - implement based on shopify service
      const result = await this.syncShopifyData();
      const duration = Date.now() - startTime;

      const syncRecord = {
        id: syncId,
        source: 'Shopify',
        startTime: new Date(startTime),
        duration,
        success: result.success,
        recordsProcessed: result.recordsProcessed || 0,
        details: result,
        error: result.error || null
      };

      await this.recordSyncHistory(syncRecord);
      logInfo('Shopify sync completed', syncRecord);
      return syncRecord;

    } catch (error) {
      const syncRecord = {
        id: syncId,
        source: 'Shopify',
        startTime: new Date(),
        duration: 0,
        success: false,
        recordsProcessed: 0,
        error: error.message
      };

      await this.recordSyncHistory(syncRecord);
      logError('Shopify sync error', error);
      return syncRecord;
    }
  }

  async performUnleashedSync() {
    const syncId = `unleashed-${Date.now()}`;
    logInfo('Starting Unleashed ERP sync', { syncId });

    try {
      const startTime = Date.now();
      
      // Placeholder for Unleashed sync - implement based on unleashed service
      const result = await this.syncUnleashedData();
      const duration = Date.now() - startTime;

      const syncRecord = {
        id: syncId,
        source: 'Unleashed ERP',
        startTime: new Date(startTime),
        duration,
        success: result.success,
        recordsProcessed: result.recordsProcessed || 0,
        details: result,
        error: result.error || null
      };

      await this.recordSyncHistory(syncRecord);
      logInfo('Unleashed ERP sync completed', syncRecord);
      return syncRecord;

    } catch (error) {
      const syncRecord = {
        id: syncId,
        source: 'Unleashed ERP',
        startTime: new Date(),
        duration: 0,
        success: false,
        recordsProcessed: 0,
        error: error.message
      };

      await this.recordSyncHistory(syncRecord);
      logError('Unleashed ERP sync error', error);
      return syncRecord;
    }
  }

  async performXeroSync() {
    const syncId = `xero-${Date.now()}`;
    logInfo('Starting Xero sync', { syncId });

    try {
      const startTime = Date.now();
      
      // Placeholder for Xero sync - implement based on xero service
      const result = await this.syncXeroData();
      const duration = Date.now() - startTime;

      const syncRecord = {
        id: syncId,
        source: 'Xero',
        startTime: new Date(startTime),
        duration,
        success: result.success,
        recordsProcessed: result.recordsProcessed || 0,
        details: result,
        error: result.error || null
      };

      await this.recordSyncHistory(syncRecord);
      logInfo('Xero sync completed', syncRecord);
      return syncRecord;

    } catch (error) {
      const syncRecord = {
        id: syncId,
        source: 'Xero',
        startTime: new Date(),
        duration: 0,
        success: false,
        recordsProcessed: 0,
        error: error.message
      };

      await this.recordSyncHistory(syncRecord);
      logError('Xero sync error', error);
      return syncRecord;
    }
  }

  async performMaintenance() {
    logInfo('Starting scheduled maintenance');
    
    try {
      // Clean up old sync history
      this.cleanupSyncHistory();
      
      // Database maintenance
      await this.performDatabaseMaintenance();
      
      // Health checks
      await this.performHealthChecks();
      
      logInfo('Scheduled maintenance completed');
      
    } catch (error) {
      logError('Maintenance task failed', error);
    }
  }

  async syncShopifyData() {
    // Placeholder - implement actual Shopify sync logic
    logWarn('Shopify sync not yet implemented');
    return {
      success: true,
      recordsProcessed: 0,
      message: 'Shopify sync placeholder - not yet implemented'
    };
  }

  async syncUnleashedData() {
    // Placeholder - implement actual Unleashed sync logic
    logWarn('Unleashed sync not yet implemented');
    return {
      success: true,
      recordsProcessed: 0,
      message: 'Unleashed sync placeholder - not yet implemented'
    };
  }

  async syncXeroData() {
    // Placeholder - implement actual Xero sync logic
    logWarn('Xero sync not yet implemented');
    return {
      success: true,
      recordsProcessed: 0,
      message: 'Xero sync placeholder - not yet implemented'
    };
  }

  async recordSyncHistory(syncRecord) {
    try {
      // Store in memory
      this.syncHistory.unshift(syncRecord);
      
      // Keep only the most recent entries
      if (this.syncHistory.length > this.maxHistoryEntries) {
        this.syncHistory = this.syncHistory.slice(0, this.maxHistoryEntries);
      }

      // Store in database if data_imports table exists
      try {
        await prisma.data_imports?.create({
          data: {
            source: syncRecord.source,
            status: syncRecord.success ? 'completed' : 'failed',
            records_processed: syncRecord.recordsProcessed,
            duration_ms: syncRecord.duration,
            error_message: syncRecord.error,
            metadata: syncRecord.details,
            started_at: syncRecord.startTime,
            completed_at: new Date(),
            created_by: 'system'
          }
        });
      } catch (dbError) {
        // Ignore if table doesn't exist
        logWarn('Could not store sync history in database - table may not exist');
      }

    } catch (error) {
      logError('Failed to record sync history', error);
    }
  }

  cleanupSyncHistory() {
    const beforeCount = this.syncHistory.length;
    
    // Remove entries older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    this.syncHistory = this.syncHistory.filter(
      record => new Date(record.startTime) > sevenDaysAgo
    );

    const afterCount = this.syncHistory.length;
    if (beforeCount !== afterCount) {
      logInfo('Cleaned up sync history', { 
        removed: beforeCount - afterCount,
        remaining: afterCount 
      });
    }
  }

  async performDatabaseMaintenance() {
    try {
      // Update statistics, clean old data, optimize queries, etc.
      logInfo('Performing database maintenance');
      
      // Example maintenance tasks
      await prisma.$executeRaw`ANALYZE;`;
      
      logInfo('Database maintenance completed');
    } catch (error) {
      logWarn('Database maintenance partially failed', error);
    }
  }

  async performHealthChecks() {
    const healthStatus = {
      database: false,
      amazon: false,
      shopify: false,
      unleashed: false,
      xero: false
    };

    // Database health check
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthStatus.database = true;
    } catch (error) {
      logError('Database health check failed', error);
    }

    // API health checks
    healthStatus.amazon = amazonSPAPI.getConnectionStatus().connected;
    
    logInfo('System health check completed', healthStatus);
    return healthStatus;
  }

  getSyncHistory(limit = 20) {
    return this.syncHistory.slice(0, limit);
  }

  getScheduleStatus() {
    const scheduleStatus = {};
    
    this.scheduledTasks.forEach(_(task, _name) => {
      scheduleStatus[name] = {
        running: task.running,
        scheduled: true
      };
    });

    return {
      schedulerRunning: this.isRunning,
      schedules: scheduleStatus,
      lastSyncHistory: this.getSyncHistory(5)
    };
  }

  async triggerManualSync(source) {
    logInfo(`Manual sync triggered for ${source}`);
    
    switch (source.toLowerCase()) {
      case 'amazon':
        return await this.performAmazonSync();
      case 'shopify':
        return await this.performShopifySync();
      case 'unleashed':
        return await this.performUnleashedSync();
      case 'xero':
        return await this.performXeroSync();
      case 'all':
        const results = await Promise.allSettled([
          this.performAmazonSync(),
          this.performShopifySync(),
          this.performUnleashedSync(),
          this.performXeroSync()
        ]);
        return results;
      default:
        throw new Error(`Unknown sync source: ${source}`);
    }
  }

  stop() {
    logInfo('Stopping Data Sync Scheduler');
    
    this.scheduledTasks.forEach(_(task, _name) => {
      task.stop();
      logInfo(`Stopped sync schedule: ${name}`);
    });
    
    this.isRunning = false;
    logInfo('Data Sync Scheduler stopped');
  }
}

export const dataSyncScheduler = new DataSyncScheduler();