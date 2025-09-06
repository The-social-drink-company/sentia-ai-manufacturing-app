import { logInfo, logWarn, logError } from '../logger';
import { EventEmitter } from 'events';

/**
 * Model Context Protocol (MCP) Implementation
 * Provides standardized communication between AI models and tools
 */

export interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'notification' | 'error';
  method?: string;
  params?: any;
  result?: any;
  error?: MCPError;
  timestamp: Date;
  metadata?: {
    model?: string;
    tool?: string;
    sessionId?: string;
    userId?: string;
    correlationId?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPCapability {
  name: string;
  version: string;
  methods: string[];
  description: string;
  requirements?: string[];
  limitations?: string[];
}

export interface MCPSession {
  id: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  context: Map<string, any>;
  capabilities: MCPCapability[];
  statistics: {
    requestCount: number;
    responseCount: number;
    errorCount: number;
    avgResponseTime: number;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  version: string;
  execute: (params: any, context: MCPContext) => Promise<any>;
  validate?: (params: any) => boolean | string;
  permissions?: string[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface MCPContext {
  sessionId: string;
  userId?: string;
  requestId: string;
  timestamp: Date;
  metadata: Record<string, any>;
  securityContext: MCPSecurityContext;
}

export interface MCPSecurityContext {
  authenticated: boolean;
  userId?: string;
  roles: string[];
  permissions: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  encryptionRequired: boolean;
}

export class MCPProtocol extends EventEmitter {
  private sessions: Map<string, MCPSession> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private messageHandlers: Map<string, (message: MCPMessage) => Promise<MCPMessage>> = new Map();
  private securityPolicy: MCPSecurityPolicy;
  private rateLimiter: MCPRateLimiter;
  
  constructor(securityPolicy?: MCPSecurityPolicy) {
    super();
    this.securityPolicy = securityPolicy || new DefaultSecurityPolicy();
    this.rateLimiter = new MCPRateLimiter();
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers(): void {
    // Register default message handlers
    this.registerHandler('initialize', this.handleInitialize.bind(this));
    this.registerHandler('execute', this.handleExecute.bind(this));
    this.registerHandler('query', this.handleQuery.bind(this));
    this.registerHandler('subscribe', this.handleSubscribe.bind(this));
    this.registerHandler('unsubscribe', this.handleUnsubscribe.bind(this));
    this.registerHandler('getCapabilities', this.handleGetCapabilities.bind(this));
  }

  /**
   * Create a new MCP session
   */
  createSession(userId?: string): MCPSession {
    const sessionId = `mcp_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: MCPSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      context: new Map(),
      capabilities: this.getAvailableCapabilities(),
      statistics: {
        requestCount: 0,
        responseCount: 0,
        errorCount: 0,
        avgResponseTime: 0
      }
    };

    this.sessions.set(sessionId, session);
    this.emit('sessionCreated', session);
    
    logInfo('MCP session created', { sessionId, userId });
    
    return session;
  }

  /**
   * Register a tool with the protocol
   */
  registerTool(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      logWarn('Tool already registered, updating', { toolName: tool.name });
    }
    
    this.tools.set(tool.name, tool);
    this.emit('toolRegistered', tool);
    
    logInfo('MCP tool registered', { 
      toolName: tool.name, 
      version: tool.version 
    });
  }

  /**
   * Register a message handler
   */
  registerHandler(method: string, handler: (message: MCPMessage) => Promise<MCPMessage>): void {
    this.messageHandlers.set(method, handler);
    logInfo('MCP handler registered', { method });
  }

  /**
   * Send a message through the protocol
   */
  async sendMessage(message: Omit<MCPMessage, 'id' | 'timestamp'>): Promise<MCPMessage> {
    const fullMessage: MCPMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date()
    };

    try {
      // Security validation
      await this.validateSecurity(fullMessage);
      
      // Rate limiting
      await this.rateLimiter.checkLimit(fullMessage);
      
      // Update session statistics
      if (fullMessage.metadata?.sessionId) {
        this.updateSessionStats(fullMessage.metadata.sessionId, 'request');
      }

      // Route to appropriate handler
      const handler = this.messageHandlers.get(fullMessage.method || '');
      
      if (!handler) {
        throw new Error(`No handler for method: ${fullMessage.method}`);
      }

      const startTime = Date.now();
      const response = await handler(fullMessage);
      const responseTime = Date.now() - startTime;

      // Update statistics
      if (fullMessage.metadata?.sessionId) {
        this.updateSessionStats(fullMessage.metadata.sessionId, 'response', responseTime);
      }

      this.emit('messageProcessed', { request: fullMessage, response, responseTime });
      
      return response;

    } catch (error: any) {
      const errorResponse: MCPMessage = {
        id: this.generateMessageId(),
        type: 'error',
        error: {
          code: error.code || -1,
          message: error.message,
          data: error.data
        },
        timestamp: new Date(),
        metadata: fullMessage.metadata
      };

      if (fullMessage.metadata?.sessionId) {
        this.updateSessionStats(fullMessage.metadata.sessionId, 'error');
      }

      this.emit('messageError', { request: fullMessage, error: errorResponse });
      
      return errorResponse;
    }
  }

  /**
   * Handle initialize request
   */
  private async handleInitialize(message: MCPMessage): Promise<MCPMessage> {
    const session = this.createSession(message.metadata?.userId);
    
    return {
      id: this.generateMessageId(),
      type: 'response',
      result: {
        sessionId: session.id,
        capabilities: session.capabilities,
        tools: Array.from(this.tools.keys())
      },
      timestamp: new Date(),
      metadata: message.metadata
    };
  }

  /**
   * Handle tool execution
   */
  private async handleExecute(message: MCPMessage): Promise<MCPMessage> {
    const { tool: toolName, params } = message.params || {};
    
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Validate parameters if validation function exists
    if (tool.validate) {
      const validation = tool.validate(params);
      if (validation !== true) {
        throw new Error(`Invalid parameters: ${validation}`);
      }
    }

    // Check permissions
    const context = this.createContext(message);
    if (tool.permissions && !this.checkPermissions(context, tool.permissions)) {
      throw new Error('Insufficient permissions for tool execution');
    }

    // Execute tool
    const result = await tool.execute(params, context);

    return {
      id: this.generateMessageId(),
      type: 'response',
      result,
      timestamp: new Date(),
      metadata: message.metadata
    };
  }

  /**
   * Handle query request
   */
  private async handleQuery(message: MCPMessage): Promise<MCPMessage> {
    // This would typically query a vector store or database
    const { query, filters, limit = 10 } = message.params || {};
    
    // Placeholder implementation
    const results = {
      items: [],
      totalCount: 0,
      query,
      filters
    };

    return {
      id: this.generateMessageId(),
      type: 'response',
      result: results,
      timestamp: new Date(),
      metadata: message.metadata
    };
  }

  /**
   * Handle subscription request
   */
  private async handleSubscribe(message: MCPMessage): Promise<MCPMessage> {
    const { event, filters } = message.params || {};
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Register subscription (implementation would depend on event system)
    this.emit('subscriptionCreated', { subscriptionId, event, filters });

    return {
      id: this.generateMessageId(),
      type: 'response',
      result: { subscriptionId },
      timestamp: new Date(),
      metadata: message.metadata
    };
  }

  /**
   * Handle unsubscribe request
   */
  private async handleUnsubscribe(message: MCPMessage): Promise<MCPMessage> {
    const { subscriptionId } = message.params || {};
    
    // Remove subscription
    this.emit('subscriptionRemoved', { subscriptionId });

    return {
      id: this.generateMessageId(),
      type: 'response',
      result: { success: true },
      timestamp: new Date(),
      metadata: message.metadata
    };
  }

  /**
   * Handle get capabilities request
   */
  private async handleGetCapabilities(message: MCPMessage): Promise<MCPMessage> {
    const capabilities = this.getAvailableCapabilities();
    const tools = Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      version: tool.version
    }));

    return {
      id: this.generateMessageId(),
      type: 'response',
      result: { capabilities, tools },
      timestamp: new Date(),
      metadata: message.metadata
    };
  }

  /**
   * Get available capabilities
   */
  private getAvailableCapabilities(): MCPCapability[] {
    return [
      {
        name: 'core',
        version: '1.0.0',
        methods: ['initialize', 'execute', 'query'],
        description: 'Core MCP functionality'
      },
      {
        name: 'tools',
        version: '1.0.0',
        methods: Array.from(this.tools.keys()),
        description: 'Available tools for execution'
      },
      {
        name: 'events',
        version: '1.0.0',
        methods: ['subscribe', 'unsubscribe'],
        description: 'Event subscription capabilities'
      }
    ];
  }

  /**
   * Create execution context
   */
  private createContext(message: MCPMessage): MCPContext {
    const session = message.metadata?.sessionId 
      ? this.sessions.get(message.metadata.sessionId)
      : null;

    return {
      sessionId: message.metadata?.sessionId || '',
      userId: session?.userId || message.metadata?.userId,
      requestId: message.id,
      timestamp: message.timestamp,
      metadata: message.metadata || {},
      securityContext: {
        authenticated: !!session?.userId,
        userId: session?.userId,
        roles: this.getUserRoles(session?.userId),
        permissions: this.getUserPermissions(session?.userId),
        dataClassification: 'internal',
        encryptionRequired: false
      }
    };
  }

  /**
   * Validate security for message
   */
  private async validateSecurity(message: MCPMessage): Promise<void> {
    if (!this.securityPolicy.validateMessage(message)) {
      throw new Error('Security validation failed');
    }
  }

  /**
   * Check permissions
   */
  private checkPermissions(context: MCPContext, required: string[]): boolean {
    return required.every(permission => 
      context.securityContext.permissions.includes(permission)
    );
  }

  /**
   * Get user roles (placeholder implementation)
   */
  private getUserRoles(userId?: string): string[] {
    if (!userId) return ['anonymous'];
    // In real implementation, fetch from database or auth service
    return ['user', 'analyst'];
  }

  /**
   * Get user permissions (placeholder implementation)
   */
  private getUserPermissions(userId?: string): string[] {
    if (!userId) return ['read'];
    // In real implementation, fetch from database or auth service
    return ['read', 'write', 'execute'];
  }

  /**
   * Update session statistics
   */
  private updateSessionStats(
    sessionId: string, 
    type: 'request' | 'response' | 'error',
    responseTime?: number
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.lastActivity = new Date();

    switch (type) {
      case 'request':
        session.statistics.requestCount++;
        break;
      case 'response':
        session.statistics.responseCount++;
        if (responseTime) {
          const count = session.statistics.responseCount;
          const currentAvg = session.statistics.avgResponseTime;
          session.statistics.avgResponseTime = 
            (currentAvg * (count - 1) + responseTime) / count;
        }
        break;
      case 'error':
        session.statistics.errorCount++;
        break;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity.getTime() < cutoff) {
        this.sessions.delete(sessionId);
        this.emit('sessionExpired', session);
        logInfo('MCP session expired', { sessionId });
      }
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): MCPSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): MCPSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get registered tools
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }
}

/**
 * Security Policy Interface
 */
export interface MCPSecurityPolicy {
  validateMessage(message: MCPMessage): boolean;
  encryptData?(data: any): any;
  decryptData?(data: any): any;
  sanitizeInput?(input: any): any;
  validatePermissions?(context: MCPContext, required: string[]): boolean;
}

/**
 * Default Security Policy Implementation
 */
export class DefaultSecurityPolicy implements MCPSecurityPolicy {
  validateMessage(message: MCPMessage): boolean {
    // Basic validation
    if (!message.id || !message.type || !message.timestamp) {
      return false;
    }

    // Check for potential injection attacks
    const stringFields = JSON.stringify(message);
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /eval\(/,
      /new Function/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(stringFields)) {
        logWarn('Potential security threat detected', { 
          messageId: message.id,
          pattern: pattern.toString()
        });
        return false;
      }
    }

    return true;
  }

  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potential XSS vectors
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = Array.isArray(input) ? [] : {};
      for (const key in input) {
        sanitized[key] = this.sanitizeInput(input[key]);
      }
      return sanitized;
    }
    
    return input;
  }
}

/**
 * Rate Limiter for MCP
 */
export class MCPRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { maxRequests: number; windowMs: number }> = new Map();

  constructor() {
    // Default limits
    this.limits.set('default', { maxRequests: 100, windowMs: 60000 });
    this.limits.set('execute', { maxRequests: 50, windowMs: 60000 });
    this.limits.set('query', { maxRequests: 200, windowMs: 60000 });
  }

  async checkLimit(message: MCPMessage): Promise<void> {
    const key = `${message.metadata?.userId || 'anonymous'}_${message.method || 'default'}`;
    const limit = this.limits.get(message.method || 'default') || this.limits.get('default')!;
    
    const now = Date.now();
    const windowStart = now - limit.windowMs;
    
    // Get and clean request times
    let requestTimes = this.requests.get(key) || [];
    requestTimes = requestTimes.filter(time => time > windowStart);
    
    if (requestTimes.length >= limit.maxRequests) {
      throw new Error(`Rate limit exceeded: ${limit.maxRequests} requests per ${limit.windowMs}ms`);
    }
    
    requestTimes.push(now);
    this.requests.set(key, requestTimes);
  }

  setLimit(method: string, maxRequests: number, windowMs: number): void {
    this.limits.set(method, { maxRequests, windowMs });
  }
}

// Export singleton instance
export const mcpProtocol = new MCPProtocol();