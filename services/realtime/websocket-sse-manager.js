/**
 * WebSocket and SSE Manager for CapLiquify Manufacturing Platform
 * Handles all real-time communication for production deployment
 */

import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

class RealtimeManager extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.sseClients = new Map();
    this.wsClients = new Map();
    this.heartbeatInterval = null;
    this.metrics = {
      wsConnections: 0,
      sseConnections: 0,
      messagesIn: 0,
      messagesOut: 0,
      errors: 0
    };
  }

  /**
   * Initialize WebSocket Server
   */
  initializeWebSocket(server, options = {}) {
    const wsOptions = {
      server,
      path: options.path || '/ws',
      clientTracking: true,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        threshold: 1024
      }
    };

    this.wss = new WebSocketServer(wsOptions);

    this.wss.on(_'connection', _(ws, req) => {
      const clientId = this.generateClientId();
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      
      logInfo('WebSocket client connected', { clientId, clientIp });
      
      this.wsClients.set(clientId, {
        ws,
        connected: new Date(),
        lastActivity: new Date(),
        subscriptions: new Set()
      });
      
      this.metrics.wsConnections++;

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        clientId,
        timestamp: new Date().toISOString(),
        message: 'Connected to CapLiquify Manufacturing Platform'
      });

      // Handle messages
      ws.on(_'message', (data) => {
        this.handleWebSocketMessage(clientId, data);
      });

      // Handle pong for heartbeat
      ws.on(_'pong', _() => {
        const client = this.wsClients.get(clientId);
        if (client) {
          client.lastActivity = new Date();
        }
      });

      // Handle close
      ws.on(_'close', _() => {
        logInfo('WebSocket client disconnected', { clientId });
        this.wsClients.delete(clientId);
        this.metrics.wsConnections--;
      });

      // Handle errors
      ws.on(_'error', _(error) => {
        logError('WebSocket error', { clientId, error: error.message });
        this.metrics.errors++;
      });
    });

    // Start heartbeat
    this.startHeartbeat();

    logInfo('WebSocket server initialized', { path: wsOptions.path });
  }

  /**
   * Initialize Server-Sent Events
   */
  initializeSSE(app) {
    app.get(_'/api/sse/events', _(req, res) => {
      const clientId = this.generateClientId();
      
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      // Store client
      this.sseClients.set(clientId, {
        res,
        connected: new Date(),
        lastActivity: new Date(),
        subscriptions: new Set()
      });
      
      this.metrics.sseConnections++;

      // Send initial connection event
      res.write(`event: connected\n`);
      res.write(`data: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

      // Handle client disconnect
      req.on(_'close', _() => {
        logInfo('SSE client disconnected', { clientId });
        this.sseClients.delete(clientId);
        this.metrics.sseConnections--;
      });

      logInfo('SSE client connected', { clientId });
    });

    // SSE event endpoints for specific streams
    this.setupSSEStreams(app);
  }

  /**
   * Setup specific SSE event streams
   */
  setupSSEStreams(app) {
    const streams = [
      '/api/sse/manufacturing',
      '/api/sse/financial',
      '/api/sse/ai-insights',
      '/api/sse/inventory',
      '/api/sse/quality',
      '/api/sse/alerts'
    ];

    streams.forEach(stream => {
      _app.get(stream, _(req, res) => {
        const streamName = stream.split('/').pop();
        const clientId = this.generateClientId();

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        this.sseClients.set(`${streamName}-${clientId}`, {
          res,
          stream: streamName,
          connected: new Date()
        });

        res.write(`event: subscribed\n`);
        res.write(`data: ${JSON.stringify({ stream: streamName, clientId })}\n\n`);

        req.on(_'close', _() => {
          this.sseClients.delete(`${streamName}-${clientId}`);
        });
      });
    });
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      this.metrics.messagesIn++;

      const client = this.wsClients.get(clientId);
      if (client) {
        client.lastActivity = new Date();
      }

      // Process message based on type
      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, message.channel);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(clientId, message.channel);
          break;
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        case 'request':
          this.handleRequest(clientId, message);
          break;
        default:
          this.emit('message', { clientId, message });
      }
    } catch (error) {
      logError('Failed to handle WebSocket message', { clientId, error: error.message });
      this.sendToClient(clientId, { type: 'error', message: 'Invalid message format' });
    }
  }

  /**
   * Handle subscription
   */
  handleSubscribe(clientId, channel) {
    const client = this.wsClients.get(clientId);
    if (client) {
      client.subscriptions.add(channel);
      this.sendToClient(clientId, {
        type: 'subscribed',
        channel,
        message: `Subscribed to ${channel}`
      });
      logInfo('Client subscribed to channel', { clientId, channel });
    }
  }

  /**
   * Handle unsubscription
   */
  handleUnsubscribe(clientId, channel) {
    const client = this.wsClients.get(clientId);
    if (client) {
      client.subscriptions.delete(channel);
      this.sendToClient(clientId, {
        type: 'unsubscribed',
        channel,
        message: `Unsubscribed from ${channel}`
      });
      logInfo('Client unsubscribed from channel', { clientId, channel });
    }
  }

  /**
   * Handle request
   */
  async handleRequest(clientId, message) {
    try {
      // Emit request event for handlers to process
      this.emit(_'request', {
        clientId,
        request: _message.request,
        data: _message.data,
        respond: _(response) => {
          this.sendToClient(clientId, {
            type: 'response',
            requestId: message.requestId,
            data: response
          });
        }
      });
    } catch (error) {
      logError('Failed to handle request', { clientId, error: error.message });
      this.sendToClient(clientId, {
        type: 'error',
        requestId: message.requestId,
        message: 'Request processing failed'
      });
    }
  }

  /**
   * Send message to specific WebSocket client
   */
  sendToClient(clientId, message) {
    const client = this.wsClients.get(clientId);
    if (client && client.ws.readyState === 1) {
      try {
        client.ws.send(JSON.stringify(message));
        this.metrics.messagesOut++;
      } catch (error) {
        logError('Failed to send message to client', { clientId, error: error.message });
      }
    }
  }

  /**
   * Broadcast to all WebSocket clients
   */
  broadcastWebSocket(message, channel = null) {
    this.wsClients.forEach((client, clientId) => {
      if (client.ws.readyState === 1) {
        if (!channel || client.subscriptions.has(channel)) {
          this.sendToClient(clientId, message);
        }
      }
    });
  }

  /**
   * Send SSE event to all connected clients
   */
  broadcastSSE(event, data, stream = null) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    
    this.sseClients.forEach((client, clientId) => {
      try {
        if (!stream || client.stream === stream) {
          client.res.write(message);
          this.metrics.messagesOut++;
        }
      } catch (error) {
        logError('Failed to send SSE message', { clientId, error: error.message });
        this.sseClients.delete(clientId);
      }
    });
  }

  /**
   * Broadcast to both WebSocket and SSE clients
   */
  broadcast(event, data, channel = null) {
    // WebSocket broadcast
    this.broadcastWebSocket({
      type: 'event',
      event,
      data,
      timestamp: new Date().toISOString()
    }, channel);

    // SSE broadcast
    this.broadcastSSE(event, data, channel);
  }

  /**
   * Start heartbeat for connection monitoring
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(_() => {
      // Check WebSocket clients
      this.wsClients.forEach((client, clientId) => {
        if (client.ws.readyState === 1) {
          client.ws.ping();
        } else {
          this.wsClients.delete(clientId);
        }
      });

      // Send heartbeat to SSE clients
      this.sseClients.forEach((client, clientId) => {
        try {
          client.res.write(`:heartbeat\n\n`);
        } catch (error) {
          this.sseClients.delete(clientId);
        }
      });
    }, 30000); // 30 seconds
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      ...this.metrics,
      activeWebSockets: this.wsClients.size,
      activeSSE: this.sseClients.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Shutdown gracefully
   */
  shutdown() {
    logInfo('Shutting down realtime connections...');

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close WebSocket connections
    this.wsClients.forEach((client, clientId) => {
      client.ws.close(1000, 'Server shutting down');
    });

    // Close SSE connections
    this.sseClients.forEach((client, clientId) => {
      client.res.end();
    });

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    logInfo('Realtime connections shutdown complete');
  }
}

// Export singleton instance
export default new RealtimeManager();