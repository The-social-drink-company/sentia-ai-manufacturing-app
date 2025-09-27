// Real-time Event System - Complete SSE Implementation for Manufacturing Dashboard
import { logInfo, logError, logDebug } from './structuredLogger.js';

class RealTimeEventSystem {
  constructor() {
    this.clients = new Map();
    this.eventQueues = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.heartbeatInterval = 30000; // 30 seconds
    this.isActive = false;
    
    // Event types and their configurations
    this.eventTypes = {
      // Manufacturing events
      'production.line.status': { priority: 'high', persistent: true },
      'production.batch.completed': { priority: 'medium', persistent: true },
      'quality.alert': { priority: 'critical', persistent: true },
      'inventory.low-stock': { priority: 'high', persistent: true },
      'equipment.maintenance': { priority: 'medium', persistent: false },
      
      // Financial events
      'finance.working-capital.update': { priority: 'medium', persistent: true },
      'finance.cash-flow.alert': { priority: 'high', persistent: true },
      'finance.payment.received': { priority: 'low', persistent: false },
      
      // System events
      'system.health.warning': { priority: 'high', persistent: true },
      'system.performance.degraded': { priority: 'medium', persistent: true },
      'user.activity': { priority: 'low', persistent: false },
      
      // Business intelligence events
      'bi.forecast.updated': { priority: 'medium', persistent: true },
      'bi.kpi.threshold': { priority: 'high', persistent: true },
      'bi.report.generated': { priority: 'low', persistent: false }
    };

    this.startHeartbeat();
  }

  // Start the event system
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    logInfo('Real-time event system started');
    
    // Start periodic data updates
    this.startDataUpdates();
  }

  // Stop the event system
  stop() {
    this.isActive = false;
    this.clients.clear();
    logInfo('Real-time event system stopped');
  }

  // Express middleware for SSE connections
  createSSEEndpoint() {
    return (req, res) => {
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const clientId = this.generateClientId();
      const client = {
        id: clientId,
        res: res,
        userId: req.user?.id,
        connectionTime: new Date(),
        lastActivity: new Date(),
        subscriptions: new Set(),
        metadata: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          role: req.user?.role
        }
      };

      // Store client connection
      this.clients.set(clientId, client);
      
      logInfo('SSE client connected', {
        clientId,
        userId: client.userId,
        totalClients: this.clients.size
      });

      // Send initial connection message
      this.sendEventToClient(clientId, {
        type: 'connection.established',
        data: {
          clientId,
          serverTime: new Date().toISOString(),
          availableEventTypes: Object.keys(this.eventTypes)
        }
      });

      // Send recent events based on client role
      this.sendHistoricalEvents(clientId);

      // Handle client disconnect
      req.on(_'close', _() => {
        this.clients.delete(clientId);
        logInfo('SSE client disconnected', {
          clientId,
          connectionDuration: Date.now() - client.connectionTime.getTime(),
          totalClients: this.clients.size
        });
      });

      // Handle client errors
      req.on(_'error', _(error) => {
        logError('SSE client error', error, { clientId });
        this.clients.delete(clientId);
      });
    };
  }

  // Subscribe client to specific event types
  subscribeClient(clientId, eventTypes) {
    const client = this.clients.get(clientId);
    if (!client) return false;

    eventTypes.forEach(eventType => {
      if (this.eventTypes[eventType]) {
        client.subscriptions.add(eventType);
      }
    });

    this.sendEventToClient(clientId, {
      type: 'subscription.confirmed',
      data: {
        subscriptions: Array.from(client.subscriptions)
      }
    });

    return true;
  }

  // Broadcast event to all relevant clients
  broadcastEvent(eventType, data, options = {}) {
    if (!this.isActive) return;

    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: data,
      timestamp: new Date().toISOString(),
      ...options
    };

    // Add to history if persistent
    if (this.eventTypes[eventType]?.persistent) {
      this.addToHistory(event);
    }

    logDebug('Broadcasting event', { eventType, clientCount: this.clients.size });

    // Send to subscribed clients
    for (const [clientId, client] of this.clients) {
      if (this.shouldSendEventToClient(client, eventType, event)) {
        this.sendEventToClient(clientId, event);
      }
    }
  }

  // Send event to specific client
  sendEventToClient(clientId, event) {
    const client = this.clients.get(clientId);
    if (!client || !client.res) return false;

    try {
      const eventData = `data: ${JSON.stringify(event)}\n\n`;
      client.res.write(`id: ${event.id || 'unknown'}\n`);
      client.res.write(`event: ${event.type}\n`);
      client.res.write(eventData);
      client.lastActivity = new Date();
      return true;
    } catch (error) {
      logError('Failed to send event to client', error, { clientId, eventType: event.type });
      this.clients.delete(clientId);
      return false;
    }
  }

  // Determine if event should be sent to client
  shouldSendEventToClient(client, eventType, event) {
    // Check subscription
    if (client.subscriptions.size > 0 && !client.subscriptions.has(eventType)) {
      return false;
    }

    // Check role-based permissions
    if (event.requiredRole && client.metadata.role !== event.requiredRole) {
      const roleHierarchy = { admin: 4, manager: 3, operator: 2, viewer: 1 };
      const clientRoleLevel = roleHierarchy[client.metadata.role] || 0;
      const requiredLevel = roleHierarchy[event.requiredRole] || 0;
      
      if (clientRoleLevel < requiredLevel) {
        return false;
      }
    }

    return true;
  }

  // Add event to history
  addToHistory(event) {
    this.eventHistory.push(event);
    
    // Maintain maximum history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  // Send historical events to new clients
  sendHistoricalEvents(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Send last 10 relevant events
    const recentEvents = this.eventHistory
      .slice(-10)
      .filter(event => this.shouldSendEventToClient(client, event.type, event));

    recentEvents.forEach(event => {
      this.sendEventToClient(clientId, {
        ...event,
        historical: true
      });
    });
  }

  // Start periodic data updates
  startDataUpdates() {
    const updateInterval = 10000; // 10 seconds

    const periodicUpdate = setInterval(_() => {
      if (!this.isActive) {
        clearInterval(periodicUpdate);
        return;
      }

      // Manufacturing data updates
      this.broadcastProductionUpdates();
      this.broadcastInventoryUpdates();
      this.broadcastQualityUpdates();
      
      // Financial data updates
      this.broadcastFinancialUpdates();
      
      // System health updates
      this.broadcastSystemUpdates();

    }, updateInterval);
  }

  // Manufacturing event broadcasts
  broadcastProductionUpdates() {
    // Mock production data - replace with real data source
    const productionData = {
      lines: [
        { id: 'LINE-A', status: 'running', efficiency: 92.5, output: 850 },
        { id: 'LINE-B', status: 'maintenance', efficiency: 0, output: 0 }
      ],
      totalOutput: 850,
      targetOutput: 1000,
      efficiency: 85.2
    };

    this.broadcastEvent('production.line.status', productionData);
  }

  broadcastInventoryUpdates() {
    // Mock inventory data
    const inventoryData = {
      lowStockItems: [
        { sku: 'GABA-001', name: 'GABA Red 750ml', current: 45, minimum: 50 },
        { sku: 'GABA-003', name: 'GABA Premium 500ml', current: 12, minimum: 25 }
      ],
      totalItems: 156,
      lastUpdated: new Date().toISOString()
    };

    if (inventoryData.lowStockItems.length > 0) {
      this.broadcastEvent('inventory.low-stock', inventoryData, {
        priority: 'high',
        requiredRole: 'operator'
      });
    }
  }

  broadcastQualityUpdates() {
    // Mock quality data
    const qualityData = {
      batchId: 'BATCH-2024-001',
      status: 'passed',
      score: 98.5,
      tests: {
        alcohol: { value: 40.2, target: 40.0, status: 'passed' },
        color: { value: 'amber', target: 'amber', status: 'passed' },
        clarity: { value: 'clear', target: 'clear', status: 'passed' }
      }
    };

    this.broadcastEvent('production.batch.completed', qualityData);
  }

  // Financial event broadcasts
  broadcastFinancialUpdates() {
    // Mock financial data
    const financialData = {
      workingCapital: {
        current: 750000,
        target: 600000,
        trend: 'improving',
        lastUpdated: new Date().toISOString()
      },
      cashFlow: {
        today: 15000,
        week: 105000,
        month: 425000
      }
    };

    this.broadcastEvent('finance.working-capital.update', financialData, {
      requiredRole: 'manager'
    });
  }

  // System event broadcasts
  broadcastSystemUpdates() {
    const systemData = {
      health: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      activeUsers: this.clients.size,
      timestamp: new Date().toISOString()
    };

    // Only broadcast if there are issues
    if (systemData.memory.heapUsed > 500 * 1024 * 1024) {
      this.broadcastEvent('system.performance.degraded', {
        type: 'high_memory',
        value: Math.round(systemData.memory.heapUsed / 1024 / 1024),
        threshold: 500
      }, { requiredRole: 'admin' });
    }
  }

  // Heartbeat to keep connections alive
  startHeartbeat() {
    setInterval(_() => {
      if (!this.isActive) return;

      const now = new Date();
      for (const [clientId, client] of this.clients) {
        // Remove stale connections
        if (now - client.lastActivity > this.heartbeatInterval * 3) {
          this.clients.delete(clientId);
          logInfo('Removed stale SSE client', { clientId });
          continue;
        }

        // Send heartbeat
        this.sendEventToClient(clientId, {
          type: 'heartbeat',
          data: { timestamp: now.toISOString() }
        });
      }
    }, this.heartbeatInterval);
  }

  // Utility functions
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get system statistics
  getStats() {
    return {
      isActive: this.isActive,
      connectedClients: this.clients.size,
      eventHistory: this.eventHistory.length,
      uptime: process.uptime(),
      clients: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        userId: client.userId,
        connectionTime: client.connectionTime,
        subscriptions: Array.from(client.subscriptions),
        role: client.metadata.role
      }))
    };
  }
}

// Create singleton instance
const eventSystem = new RealTimeEventSystem();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  eventSystem.start();
}

export default eventSystem;
export { RealTimeEventSystem };