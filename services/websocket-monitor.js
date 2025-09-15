/**
 * WebSocket Monitor for MCP Server Connection
 * Monitors and manages real-time WebSocket connections
 */

import { getMCPClient } from './mcp-client.js';
import EventEmitter from 'events';

class WebSocketMonitor extends EventEmitter {
  constructor() {
    super();
    this.mcpClient = getMCPClient();
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
      currentStatus: 'initializing'
    };

    this.connectionHistory = [];
    this.messageHistory = [];
    this.maxHistorySize = 100;

    this.monitoringInterval = null;
    this.uptimeInterval = null;

    this.initialize();
  }

  initialize() {
    // Subscribe to MCP Client events
    this.mcpClient.on('connected', () => this.handleConnected());
    this.mcpClient.on('disconnected', () => this.handleDisconnected());
    this.mcpClient.on('error', (error) => this.handleError(error));
    this.mcpClient.on('message', (message) => this.handleMessage(message));
    this.mcpClient.on('ai-response', (data) => this.handleAIResponse(data));
    this.mcpClient.on('manufacturing-alert', (alert) => this.handleManufacturingAlert(alert));
    this.mcpClient.on('api-update', (update) => this.handleAPIUpdate(update));
    this.mcpClient.on('system-status', (status) => this.handleSystemStatus(status));
    this.mcpClient.on('max-reconnect-exceeded', () => this.handleMaxReconnectExceeded());

    // Start monitoring
    this.startMonitoring();
  }

  startMonitoring() {
    // Update stats every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.updateStats();
    }, 5000);

    // Update uptime every second
    this.uptimeInterval = setInterval(() => {
      if (this.stats.currentStatus === 'connected') {
        this.stats.uptime++;
      }
    }, 1000);

    console.log('WebSocket monitoring started');
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

    console.log('WebSocket monitoring stopped');
  }

  // ====================
  // Event Handlers
  // ====================

  handleConnected() {
    this.stats.successfulConnections++;
    this.stats.lastConnected = new Date();
    this.stats.currentStatus = 'connected';
    this.stats.uptime = 0;

    const connectionEvent = {
      type: 'connection',
      status: 'connected',
      timestamp: new Date(),
      attempt: this.stats.connectionAttempts
    };

    this.addToHistory(this.connectionHistory, connectionEvent);
    this.emit('connection-established', connectionEvent);

    console.log('WebSocket connected to MCP Server');
    this.logStatus();
  }

  handleDisconnected() {
    this.stats.lastDisconnected = new Date();
    this.stats.currentStatus = 'disconnected';

    const disconnectionEvent = {
      type: 'connection',
      status: 'disconnected',
      timestamp: new Date(),
      uptime: this.stats.uptime
    };

    this.addToHistory(this.connectionHistory, disconnectionEvent);
    this.emit('connection-lost', disconnectionEvent);

    console.log('WebSocket disconnected from MCP Server');
    this.logStatus();
  }

  handleError(error) {
    this.stats.errors++;
    this.stats.lastError = {
      message: error.message,
      timestamp: new Date()
    };
    this.stats.currentStatus = 'error';

    const errorEvent = {
      type: 'error',
      error: error.message,
      timestamp: new Date()
    };

    this.addToHistory(this.connectionHistory, errorEvent);
    this.emit('connection-error', errorEvent);

    console.error('WebSocket error:', error.message);
  }

  handleMessage(message) {
    this.stats.messagesReceived++;

    const messageEvent = {
      type: 'message',
      messageType: message.type,
      timestamp: new Date(),
      size: JSON.stringify(message).length
    };

    this.addToHistory(this.messageHistory, messageEvent);
    this.emit('message-received', messageEvent);
  }

  handleAIResponse(data) {
    this.stats.messagesReceived++;

    const aiEvent = {
      type: 'ai-response',
      model: data.model || 'unknown',
      timestamp: new Date(),
      responseTime: data.responseTime
    };

    this.addToHistory(this.messageHistory, aiEvent);
    this.emit('ai-response-received', aiEvent);

    console.log(`AI Response received from ${aiEvent.model}`);
  }

  handleManufacturingAlert(alert) {
    this.stats.messagesReceived++;

    const alertEvent = {
      type: 'manufacturing-alert',
      severity: alert.severity,
      alertType: alert.type,
      timestamp: new Date()
    };

    this.addToHistory(this.messageHistory, alertEvent);
    this.emit('manufacturing-alert-received', alertEvent);

    console.log(`Manufacturing Alert: ${alert.severity} - ${alert.type}`);
  }

  handleAPIUpdate(update) {
    this.stats.messagesReceived++;

    const updateEvent = {
      type: 'api-update',
      service: update.service,
      timestamp: new Date()
    };

    this.addToHistory(this.messageHistory, updateEvent);
    this.emit('api-update-received', updateEvent);

    console.log(`API Update from ${update.service}`);
  }

  handleSystemStatus(status) {
    this.stats.messagesReceived++;

    const statusEvent = {
      type: 'system-status',
      healthy: status.healthy,
      timestamp: new Date()
    };

    this.addToHistory(this.messageHistory, statusEvent);
    this.emit('system-status-received', statusEvent);
  }

  handleMaxReconnectExceeded() {
    this.stats.currentStatus = 'failed';
    this.stats.failedConnections++;

    const failureEvent = {
      type: 'connection',
      status: 'failed',
      reason: 'max-reconnect-exceeded',
      timestamp: new Date()
    };

    this.addToHistory(this.connectionHistory, failureEvent);
    this.emit('connection-failed', failureEvent);

    console.error('Maximum reconnection attempts exceeded');
    this.logStatus();
  }

  // ====================
  // Monitoring Methods
  // ====================

  updateStats() {
    // Test connection health
    if (this.mcpClient.isHealthy()) {
      if (this.stats.currentStatus !== 'connected') {
        this.stats.currentStatus = 'connected';
        this.handleConnected();
      }
    } else {
      if (this.stats.currentStatus === 'connected') {
        this.stats.currentStatus = 'disconnected';
        this.handleDisconnected();
      }
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
    console.log('Testing WebSocket connection...');

    try {
      const result = await this.mcpClient.testConnection();

      if (result.healthy) {
        console.log('WebSocket connection test successful');
      } else {
        console.log('WebSocket connection test failed:', result.error);
      }

      return result;
    } catch (error) {
      console.error('WebSocket connection test error:', error);
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  reconnect() {
    console.log('Forcing WebSocket reconnection...');
    this.stats.connectionAttempts++;

    // Disconnect and reinitialize
    this.mcpClient.disconnect();
    setTimeout(() => {
      this.mcpClient.initialize();
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

    console.log('========================================');
    console.log('WebSocket Monitor Status');
    console.log('========================================');
    console.log(`Status: ${stats.currentStatus}`);
    console.log(`Uptime: ${stats.uptimeFormatted}`);
    console.log(`Success Rate: ${stats.successRate}%`);
    console.log(`Messages: ${stats.messagesReceived} received, ${stats.messagesSent} sent`);
    console.log(`Errors: ${stats.errors}`);
    console.log('========================================');
  }

  // ====================
  // Express Middleware
  // ====================

  getStatusEndpoint() {
    return (req, res) => {
      res.json(this.getHealthReport());
    };
  }

  getStatsEndpoint() {
    return (req, res) => {
      res.json(this.getStats());
    };
  }

  getHistoryEndpoint() {
    return (req, res) => {
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