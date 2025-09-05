import { EventEmitter } from 'events';
import axios from 'axios';
import WebSocket from 'ws';
import logger, { logInfo, logError, logWarn } from '../logger.js';

/**
 * MCP Server Orchestrator - Central hub for manufacturing data integration
 * Implements Anthropic's Model Context Protocol for seamless AI-data connectivity
 */
class MCPOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.mcpServers = new Map();
    this.activeConnections = new Map();
    this.dataStreams = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.reconnectDelay = 5000;
    
    // MCP Protocol Configuration
    this.protocol = {
      version: '2024-11-05',
      implementation: {
        name: 'sentia-manufacturing-mcp',
        version: '1.0.0'
      }
    };
    
    this.setupEventHandlers();
    logInfo('MCP Orchestrator initialized');
  }

  /**
   * Register a new MCP server for data integration
   */
  async registerMCPServer(serverConfig) {
    const {
      id,
      name,
      type,
      endpoint,
      transport = 'http',
      capabilities = [],
      auth = null,
      dataTypes = [],
      updateInterval = 30000
    } = serverConfig;

    try {
      const server = {
        id,
        name,
        type,
        endpoint,
        transport,
        capabilities,
        auth,
        dataTypes,
        updateInterval,
        status: 'disconnected',
        lastUpdate: null,
        metadata: {},
        retryCount: 0
      };

      this.mcpServers.set(id, server);
      logInfo(`MCP Server registered: ${name} (${type})`);

      // Attempt initial connection
      await this.connectToServer(id);
      return { success: true, serverId: id };

    } catch (error) {
      logError(`Failed to register MCP server ${name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect to MCP server using appropriate transport
   */
  async connectToServer(serverId) {
    const server = this.mcpServers.get(serverId);
    if (!server) {
      throw new Error(`MCP Server ${serverId} not found`);
    }

    try {
      server.status = 'connecting';
      
      if (server.transport === 'websocket') {
        await this.connectWebSocket(server);
      } else {
        await this.connectHTTP(server);
      }

      server.status = 'connected';
      server.lastUpdate = new Date();
      server.retryCount = 0;
      
      this.emit('serverConnected', { serverId, server });
      logInfo(`Connected to MCP server: ${server.name}`);

      // Start data polling for HTTP connections
      if (server.transport === 'http') {
        this.startDataPolling(serverId);
      }

    } catch (error) {
      server.status = 'error';
      await this.handleConnectionError(serverId, error);
      throw error;
    }
  }

  /**
   * Establish WebSocket connection for real-time data
   */
  async connectWebSocket(server) {
    return new Promise((resolve, reject) => {
      const wsUrl = server.endpoint.replace('http', 'ws');
      const ws = new WebSocket(wsUrl, {
        headers: this.buildAuthHeaders(server.auth)
      });

      ws.on('open', () => {
        // Send MCP initialization
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: this.protocol.version,
            capabilities: server.capabilities,
            clientInfo: this.protocol.implementation
          },
          id: 1
        }));
        resolve();
      });

      ws.on('message', (data) => {
        this.handleWebSocketMessage(server.id, data);
      });

      ws.on('error', (error) => {
        reject(error);
      });

      ws.on('close', () => {
        this.handleConnectionLoss(server.id);
      });

      this.activeConnections.set(server.id, ws);
    });
  }

  /**
   * Setup HTTP connection for polling-based data retrieval
   */
  async connectHTTP(server) {
    const client = axios.create({
      baseURL: server.endpoint,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...this.buildAuthHeaders(server.auth)
      }
    });

    // Test connection with MCP handshake
    const response = await client.post('/mcp/initialize', {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: this.protocol.version,
        capabilities: server.capabilities,
        clientInfo: this.protocol.implementation
      },
      id: 1
    });

    if (response.data.result) {
      this.activeConnections.set(server.id, client);
      server.metadata = response.data.result.serverInfo || {};
    } else {
      throw new Error('MCP initialization failed');
    }
  }

  /**
   * Start polling data from HTTP-based MCP servers
   */
  startDataPolling(serverId) {
    const server = this.mcpServers.get(serverId);
    if (!server || server.transport !== 'http') return;

    const pollData = async () => {
      try {
        const client = this.activeConnections.get(serverId);
        if (!client) return;

        // Request available resources
        const resourcesResponse = await client.post('/mcp/resources/list', {
          jsonrpc: '2.0',
          method: 'resources/list',
          params: {},
          id: Date.now()
        });

        if (resourcesResponse.data.result?.resources) {
          await this.processResources(serverId, resourcesResponse.data.result.resources);
        }

        server.lastUpdate = new Date();
        this.emit('dataUpdated', { serverId, timestamp: server.lastUpdate });

      } catch (error) {
        logWarn(`Polling error for server ${serverId}:`, error.message);
        await this.handleConnectionError(serverId, error);
      }
    };

    // Start polling
    const intervalId = setInterval(pollData, server.updateInterval);
    this.dataStreams.set(serverId, intervalId);
  }

  /**
   * Process resources received from MCP server
   */
  async processResources(serverId, resources) {
    const server = this.mcpServers.get(serverId);
    const processedData = [];

    for (const resource of resources) {
      try {
        // Read resource data
        const client = this.activeConnections.get(serverId);
        const dataResponse = await client.post('/mcp/resources/read', {
          jsonrpc: '2.0',
          method: 'resources/read',
          params: { uri: resource.uri },
          id: Date.now()
        });

        if (dataResponse.data.result?.contents) {
          const processedContent = await this.transformData(
            serverId,
            resource,
            dataResponse.data.result.contents
          );
          processedData.push(processedContent);
        }
      } catch (error) {
        logWarn(`Failed to read resource ${resource.uri}:`, error.message);
      }
    }

    this.emit('resourcesProcessed', { serverId, data: processedData });
  }

  /**
   * Transform raw MCP data into standardized format
   */
  async transformData(serverId, resource, contents) {
    const server = this.mcpServers.get(serverId);
    
    return {
      serverId,
      serverType: server.type,
      resourceUri: resource.uri,
      resourceType: resource.mimeType,
      name: resource.name,
      description: resource.description,
      data: contents,
      timestamp: new Date(),
      metadata: {
        serverName: server.name,
        dataType: server.dataTypes.find(dt => resource.uri.includes(dt)),
        capabilities: server.capabilities
      }
    };
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(serverId, data) {
    try {
      const message = JSON.parse(data);
      
      if (message.method === 'notifications/resources/updated') {
        this.handleResourceUpdate(serverId, message.params);
      } else if (message.method === 'notifications/tools/list_changed') {
        this.handleToolsUpdate(serverId, message.params);
      }
      
      this.emit('messageReceived', { serverId, message });
    } catch (error) {
      logWarn(`Failed to parse WebSocket message from ${serverId}:`, error.message);
    }
  }

  /**
   * Handle resource updates from MCP server
   */
  async handleResourceUpdate(serverId, params) {
    const { uri } = params;
    const server = this.mcpServers.get(serverId);
    
    try {
      // Fetch updated resource data
      const ws = this.activeConnections.get(serverId);
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'resources/read',
        params: { uri },
        id: Date.now()
      }));
      
      server.lastUpdate = new Date();
      this.emit('resourceUpdated', { serverId, uri, timestamp: server.lastUpdate });
    } catch (error) {
      logWarn(`Failed to handle resource update ${uri}:`, error.message);
    }
  }

  /**
   * Execute tools via MCP server
   */
  async executeTool(serverId, toolName, arguments_) {
    const server = this.mcpServers.get(serverId);
    if (!server || server.status !== 'connected') {
      throw new Error(`Server ${serverId} not connected`);
    }

    try {
      const connection = this.activeConnections.get(serverId);
      
      if (server.transport === 'websocket') {
        return await this.executeWebSocketTool(connection, toolName, arguments_);
      } else {
        return await this.executeHTTPTool(connection, toolName, arguments_);
      }
    } catch (error) {
      logError(`Tool execution failed on ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Execute tool via WebSocket
   */
  async executeWebSocketTool(ws, toolName, arguments_) {
    return new Promise((resolve, reject) => {
      const requestId = Date.now();
      
      const timeout = setTimeout(() => {
        reject(new Error('Tool execution timeout'));
      }, 30000);

      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data);
          if (response.id === requestId) {
            clearTimeout(timeout);
            ws.off('message', messageHandler);
            
            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          // Ignore parsing errors for other messages
        }
      };

      ws.on('message', messageHandler);
      
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: arguments_
        },
        id: requestId
      }));
    });
  }

  /**
   * Execute tool via HTTP
   */
  async executeHTTPTool(client, toolName, arguments_) {
    const response = await client.post('/mcp/tools/call', {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: arguments_
      },
      id: Date.now()
    });

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.result;
  }

  /**
   * Query manufacturing data across all connected MCP servers
   */
  async queryManufacturingData(query) {
    const results = [];
    const { dataTypes, timeRange, filters = {} } = query;

    for (const [serverId, server] of this.mcpServers) {
      if (server.status !== 'connected') continue;

      try {
        const relevantDataTypes = server.dataTypes.filter(dt => 
          !dataTypes || dataTypes.includes(dt)
        );

        if (relevantDataTypes.length > 0) {
          const serverData = await this.queryServer(serverId, {
            dataTypes: relevantDataTypes,
            timeRange,
            filters
          });
          results.push({
            serverId,
            serverName: server.name,
            serverType: server.type,
            data: serverData
          });
        }
      } catch (error) {
        logWarn(`Query failed for server ${serverId}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Query specific MCP server
   */
  async queryServer(serverId, query) {
    const server = this.mcpServers.get(serverId);
    if (!server) throw new Error(`Server ${serverId} not found`);

    // Use tools to query data if available
    if (server.capabilities.includes('tools')) {
      return await this.executeTool(serverId, 'query_manufacturing_data', query);
    }

    // Fallback to resource listing and filtering
    const connection = this.activeConnections.get(serverId);
    const resourcesResponse = await connection.post('/mcp/resources/list', {
      jsonrpc: '2.0',
      method: 'resources/list',
      params: {},
      id: Date.now()
    });

    return resourcesResponse.data.result?.resources || [];
  }

  /**
   * Handle connection errors and implement retry logic
   */
  async handleConnectionError(serverId, error) {
    const server = this.mcpServers.get(serverId);
    if (!server) return;

    server.retryCount = (server.retryCount || 0) + 1;
    logWarn(`Connection error for ${server.name} (attempt ${server.retryCount}):`, error.message);

    if (server.retryCount < this.maxRetries) {
      setTimeout(async () => {
        try {
          await this.connectToServer(serverId);
        } catch (retryError) {
          logError(`Retry failed for ${server.name}:`, retryError.message);
        }
      }, this.reconnectDelay * server.retryCount);
    } else {
      server.status = 'failed';
      this.emit('serverFailed', { serverId, error: error.message });
    }
  }

  /**
   * Handle connection loss and cleanup
   */
  async handleConnectionLoss(serverId) {
    const server = this.mcpServers.get(serverId);
    if (!server) return;

    server.status = 'disconnected';
    
    // Clear polling interval
    const intervalId = this.dataStreams.get(serverId);
    if (intervalId) {
      clearInterval(intervalId);
      this.dataStreams.delete(serverId);
    }

    this.emit('serverDisconnected', { serverId });
    logWarn(`Lost connection to MCP server: ${server.name}`);

    // Attempt reconnection
    setTimeout(async () => {
      try {
        await this.connectToServer(serverId);
      } catch (error) {
        logError(`Reconnection failed for ${server.name}:`, error.message);
      }
    }, this.reconnectDelay);
  }

  /**
   * Build authentication headers
   */
  buildAuthHeaders(auth) {
    if (!auth) return {};

    switch (auth.type) {
      case 'bearer':
        return { 'Authorization': `Bearer ${auth.token}` };
      case 'api-key':
        return { [auth.header || 'X-API-Key']: auth.key };
      case 'basic':
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        return { 'Authorization': `Basic ${credentials}` };
      default:
        return {};
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('serverConnected', ({ serverId, server }) => {
      logInfo(`MCP Server ${server.name} connected successfully`);
    });

    this.on('serverDisconnected', ({ serverId }) => {
      const server = this.mcpServers.get(serverId);
      logWarn(`MCP Server ${server?.name || serverId} disconnected`);
    });

    this.on('dataUpdated', ({ serverId, timestamp }) => {
      logInfo(`Data updated from server ${serverId} at ${timestamp.toISOString()}`);
    });
  }

  /**
   * Get server status and health metrics
   */
  getServerStatus() {
    const status = {
      totalServers: this.mcpServers.size,
      connectedServers: 0,
      failedServers: 0,
      servers: []
    };

    for (const [id, server] of this.mcpServers) {
      const serverStatus = {
        id,
        name: server.name,
        type: server.type,
        status: server.status,
        lastUpdate: server.lastUpdate,
        retryCount: server.retryCount,
        capabilities: server.capabilities,
        dataTypes: server.dataTypes
      };

      status.servers.push(serverStatus);

      if (server.status === 'connected') status.connectedServers++;
      if (server.status === 'failed') status.failedServers++;
    }

    return status;
  }

  /**
   * Disconnect from all servers and cleanup
   */
  async disconnect() {
    for (const [serverId, connection] of this.activeConnections) {
      try {
        if (connection.close) {
          connection.close(); // WebSocket
        }
      } catch (error) {
        logWarn(`Error closing connection to ${serverId}:`, error.message);
      }
    }

    for (const intervalId of this.dataStreams.values()) {
      clearInterval(intervalId);
    }

    this.activeConnections.clear();
    this.dataStreams.clear();
    this.mcpServers.clear();

    logInfo('MCP Orchestrator disconnected from all servers');
  }
}

export default MCPOrchestrator;