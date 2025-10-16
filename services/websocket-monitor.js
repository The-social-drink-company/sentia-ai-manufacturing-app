/**
 * WebSocket Monitor for Real-time Data Streaming
 * Monitors and manages direct WebSocket connections (MCP-independent)
 */

import EventEmitter from 'events';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger.js';


class WebSocketMonitor extends EventEmitter {
  constructor() {
    super();
    
    // Remove MCP dependencies - use direct WebSocket monitoring
    this.connectedClients = new Set();
    this.dataStreams = new Map(); // Track active data streams
    
    this.stats = {
      connectionAttempts: 0,
      successfulConnections: 0,
      failedConnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      lastConnected: null,
      lastDisconnected: null,
      lastError: null,
      uptime: 0,
      currentStatus: 'ready'
    };

    this.connectionHistory = [];
    this.messageHistory = [];
    this.maxHistorySize = 100;

    this.monitoringInterval = null;
    this.uptimeInterval = null;
    this.dataStreamInterval = null;

    this.initialize();
  }

  initialize() {
    // Initialize direct data streaming (MCP-independent)
    this.startMonitoring();
    this.startDataStreaming();
    
    logDebug('WebSocket Monitor initialized with direct data streaming');
  }

  startMonitoring() {
    // Update stats every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.updateStats();
    }, 5000);

    // Update uptime every second
    this.uptimeInterval = setInterval(() => {
      if (this.stats.currentStatus === 'active') {
        this.stats.uptime++;
      }
    }, 1000);

    logDebug('WebSocket monitoring started');
  }

  startDataStreaming() {
    // Stream real-time data updates every 30 seconds
    this.dataStreamInterval = setInterval(async () => {
      await this.streamRealTimeUpdates();
    }, 30000);

    logDebug('Direct data streaming started');
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }

    if (this.dataStreamInterval) {
      clearInterval(this.dataStreamInterval);
      this.dataStreamInterval = null;
    }

    logDebug('WebSocket monitoring stopped');
  }

  // ====================
  // Real-time Data Streaming (MCP-independent)
  // ====================

  async streamRealTimeUpdates() {
    try {
      // Stream updates from all connected services
      const updates = await this.gatherRealTimeData();
      
      if (updates && Object.keys(updates).length > 0) {
        this.stats.messagesReceived++;
        
        const updateEvent = {
          type: 'real-time-update',
          data: updates,
          timestamp: new Date(),
          sources: Object.keys(updates)
        };

        this.addToHistory(this.messageHistory, updateEvent);
        this.emit('real-time-update', updateEvent);
        
        logDebug(`Real-time update streamed with data from: ${updateEvent.sources.join(', ')}`);
      }
    } catch (error) {
      this.handleStreamingError(error);
    }
  }

  async gatherRealTimeData() {
    const updates = {};
    
    try {
      // Gather Shopify data
      const shopifyModule = await import('./shopify-multistore.js');
      const shopifyMultiStore = shopifyModule.default;
      if (shopifyMultiStore) {
        const shopifyStats = await shopifyMultiStore.getQuickStats();
        if (shopifyStats) {
          updates.shopify = {
            stores: shopifyStats.activeStores || 0,
            products: shopifyStats.totalProducts || 0,
            revenue: shopifyStats.totalRevenue || 0,
            lastUpdated: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      logDebug('Shopify real-time data unavailable:', error.message);
    }

    try {
      // Gather Xero data
      const xeroModule = await import('./xeroService.js');
      const xeroService = xeroModule.default;
      if (xeroService && xeroService.isConnected) {
        const workingCapital = await xeroService.getWorkingCapital();
        if (workingCapital) {
          updates.xero = {
            accountsReceivable: workingCapital.accountsReceivable || 0,
            accountsPayable: workingCapital.accountsPayable || 0,
            bankBalances: workingCapital.bankBalances || 0,
            lastUpdated: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      logDebug('Xero real-time data unavailable:', error.message);
    }

    try {
      // Gather Unleashed ERP data
      const unleashedModule = await import('./unleashed-erp.js');
      const unleashedERPService = unleashedModule.default;
      if (unleashedERPService && unleashedERPService.isConnected) {
        const manufacturingData = await unleashedERPService.getConsolidatedData();
        if (manufacturingData) {
          updates.unleashed = {
            activeBatches: manufacturingData.production?.activeBatches || 0,
            qualityScore: manufacturingData.production?.qualityScore || 95.0,
            utilizationRate: manufacturingData.production?.utilizationRate || 85.0,
            qualityAlerts: manufacturingData.qualityAlerts?.length || 0,
            lastUpdated: manufacturingData.lastUpdated
          };
        }
      }
    } catch (error) {
      logDebug('Unleashed ERP real-time data unavailable:', error.message);
    }

    return updates;
  }

  handleStreamingError(error) {
    this.stats.errors++;
    this.stats.lastError = {
      message: error.message,
      timestamp: new Date()
    };

    const errorEvent = {
      type: 'streaming-error',
      error: error.message,
      timestamp: new Date()
    };

    this.addToHistory(this.connectionHistory, errorEvent);
    this.emit('streaming-error', errorEvent);

    logError('Data streaming error:', error.message);
  }

  addClient(clientId) {
    this.connectedClients.add(clientId);
    this.stats.connectionAttempts++;
    this.stats.successfulConnections++;
    this.stats.lastConnected = new Date();
    this.stats.currentStatus = 'active';
    
    const connectionEvent = {
      type: 'client-connected',
      clientId: clientId,
      timestamp: new Date(),
      totalClients: this.connectedClients.size
    };

    this.addToHistory(this.connectionHistory, connectionEvent);
    this.emit('client-connected', connectionEvent);

    logDebug(`Client connected: ${clientId} (total: ${this.connectedClients.size})`);
  }

  removeClient(clientId) {
    this.connectedClients.delete(clientId);
    this.stats.lastDisconnected = new Date();
    
    if (this.connectedClients.size === 0) {
      this.stats.currentStatus = 'ready';
    }
    
    const disconnectionEvent = {
      type: 'client-disconnected',
      clientId: clientId,
      timestamp: new Date(),
      totalClients: this.connectedClients.size
    };

    this.addToHistory(this.connectionHistory, disconnectionEvent);
    this.emit('client-disconnected', disconnectionEvent);

    logDebug(`Client disconnected: ${clientId} (total: ${this.connectedClients.size})`);
  }

  // ====================
  // Monitoring Methods
  // ====================

  updateStats() {
    // Update connection status based on active clients
    const previousStatus = this.stats.currentStatus;
    
    if (this.connectedClients.size > 0) {
      this.stats.currentStatus = 'active';
    } else if (this.dataStreamInterval) {
      this.stats.currentStatus = 'ready';
    } else {
      this.stats.currentStatus = 'stopped';
    }
    
    // Emit status change if changed
    if (previousStatus !== this.stats.currentStatus) {
      const statusEvent = {
        type: 'status-change',
        previousStatus,
        currentStatus: this.stats.currentStatus,
        clientCount: this.connectedClients.size,
        timestamp: new Date()
      };
      
      this.addToHistory(this.connectionHistory, statusEvent);
      this.emit('status-changed', statusEvent);
    }

    // Emit stats update
    this.emit('stats-updated', this.getStats());
  }

  addToHistory(history, event) {
    history.push(event);

    // Keep history size limited
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  // ====================
  // Public Methods
  // ====================

  getStats() {
    return {
      ...this.stats,
      uptimeFormatted: this.formatUptime(this.stats.uptime),
      successRate: this.calculateSuccessRate(),
      averageMessagesPerMinute: this.calculateMessageRate()
    };
  }

  getConnectionHistory() {
    return [...this.connectionHistory];
  }

  getMessageHistory() {
    return [...this.messageHistory];
  }

  getHealthReport() {
    const stats = this.getStats();

    return {
      status: stats.currentStatus,
      healthy: stats.currentStatus === 'connected',
      uptime: stats.uptimeFormatted,
      metrics: {
        connections: {
          attempts: stats.connectionAttempts,
          successful: stats.successfulConnections,
          failed: stats.failedConnections,
          successRate: stats.successRate
        },
        messages: {
          received: stats.messagesReceived,
          sent: stats.messagesSent,
          rate: stats.averageMessagesPerMinute
        },
        errors: stats.errors
      },
      lastEvents: {
        connected: stats.lastConnected,
        disconnected: stats.lastDisconnected,
        error: stats.lastError
      }
    };
  }

  async testConnection() {
    logDebug('Testing data streaming connections...');

    try {
      // Test connections to all external services
      const testResults = {
        shopify: false,
        xero: false,
        unleashed: false,
        overall: false
      };

      // Test Shopify connection
      try {
        const shopifyModule = await import('./shopify-multistore.js');
        const shopifyMultiStore = shopifyModule.default;
        if (shopifyMultiStore) {
          await shopifyMultiStore.connect();
          testResults.shopify = true;
        }
      } catch (error) {
        logDebug('Shopify connection test failed:', error.message);
      }

      // Test Xero connection
      try {
        const xeroModule = await import('./xeroService.js');
        const xeroService = xeroModule.default;
        testResults.xero = xeroService && xeroService.isConnected;
      } catch (error) {
        logDebug('Xero connection test failed:', error.message);
      }

      // Test Unleashed connection
      try {
        const unleashedModule = await import('./unleashed-erp.js');
        const unleashedERPService = unleashedModule.default;
        testResults.unleashed = unleashedERPService && unleashedERPService.isConnected;
      } catch (error) {
        logDebug('Unleashed connection test failed:', error.message);
      }

      // Calculate overall health
      const connectedServices = Object.values(testResults).filter(Boolean).length - 1; // Exclude 'overall' 
      testResults.overall = connectedServices > 0;

      logDebug(`Data streaming test completed: ${connectedServices}/3 services connected`);

      return {
        healthy: testResults.overall,
        services: testResults,
        connectedCount: connectedServices,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logError('Data streaming test error:', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  reconnect() {
    logDebug('Restarting data streaming...');
    this.stats.connectionAttempts++;

    // Stop and restart data streaming
    this.stopMonitoring();
    setTimeout(() => {
      this.initialize();
    }, 1000);
  }

  // ====================
  // Utility Methods
  // ====================

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  calculateSuccessRate() {
    if (this.stats.connectionAttempts === 0) return 0;
    return Math.round((this.stats.successfulConnections / this.stats.connectionAttempts) * 100);
  }

  calculateMessageRate() {
    if (this.stats.uptime === 0) return 0;
    return Math.round((this.stats.messagesReceived / this.stats.uptime) * 60);
  }

  logStatus() {
    const stats = this.getStats();

    logDebug('========================================');
    logDebug('WebSocket Monitor Status');
    logDebug('========================================');
    logDebug(`Status: ${stats.currentStatus}`);
    logDebug(`Uptime: ${stats.uptimeFormatted}`);
    logDebug(`Success Rate: ${stats.successRate}%`);
    logDebug(`Messages: ${stats.messagesReceived} received, ${stats.messagesSent} sent`);
    logDebug(`Errors: ${stats.errors}`);
    logDebug('========================================');
  }

  // ====================
  // Express Middleware
  // ====================

  getStatusEndpoint() {
    return (_req, res) => {
      res.json(this.getHealthReport());
    };
  }

  getStatsEndpoint() {
    return (_req, res) => {
      res.json(this.getStats());
    };
  }

  getHistoryEndpoint() {
    return (_req, res) => {
      res.json({
        connections: this.getConnectionHistory(),
        messages: this.getMessageHistory()
      });
    };
  }

  // ====================
  // Cleanup
  // ====================

  destroy() {
    this.stopMonitoring();
    this.removeAllListeners();
    this.connectionHistory = [];
    this.messageHistory = [];
  }
}

// Singleton instance
let monitor = null;

export const getWebSocketMonitor = () => {
  if (!monitor) {
    monitor = new WebSocketMonitor();
  }
  return monitor;
};

export default WebSocketMonitor;