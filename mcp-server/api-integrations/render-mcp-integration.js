import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import winston from 'winston';

/**
 * RENDER MCP INTEGRATION
 * Official Render.com Model Context Protocol Implementation
 * 
 * Features:
 * - Complete Render API integration with user's API key
 * - Database management tools (PostgreSQL with pgvector)
 * - Service deployment and monitoring
 * - Environment variable management
 * - Real-time service health monitoring
 * - Log aggregation and monitoring
 * - Performance metrics and scaling
 */

class RenderMCPIntegration {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/render-mcp.log' })
      ]
    });

    // Initialize Render API client
    this.renderApiKey = process.env.RENDER_API_KEY;
    this.renderApiBase = 'https://api.render.com/v1';
    
    // Initialize Anthropic for AI-powered insights
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Service state tracking
    this.services = new Map();
    this.databases = new Map();
    this.lastHealthCheck = new Map();

    this.logger.info('🎯 Render MCP Integration initialized', {
      hasApiKey: !!this.renderApiKey,
      features: [
        'service-management', 
        'database-operations', 
        'environment-management',
        'health-monitoring',
        'ai-insights'
      ]
    });
  }

  async initialize() {
    if (!this.renderApiKey) {
      throw new Error('RENDER_API_KEY environment variable is required for Render integration');
    }

    this.logger.info('🔌 Connecting to Render API...');
    
    try {
      // Test API connectivity
      const response = await this.makeRenderAPICall('GET', '/services');
      this.logger.info('✅ Render API connection established', {
        servicesCount: response.data?.length || 0
      });
      
      // Cache current services and databases
      await this.refreshServiceCache();
      await this.refreshDatabaseCache();
      
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to connect to Render API:', error);
      throw error;
    }
  }

  async makeRenderAPICall(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.renderApiBase}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.renderApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      this.logger.error(`Render API call failed: ${method} ${endpoint}`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async refreshServiceCache() {
    try {
      const response = await this.makeRenderAPICall('GET', '/services');
      if (response.success && response.data) {
        response.data.forEach(service => {
          this.services.set(service.id, service);
        });
        this.logger.info(`📋 Cached ${response.data.length} Render services`);
      }
    } catch (error) {
      this.logger.error('Failed to refresh service cache:', error);
    }
  }

  async refreshDatabaseCache() {
    try {
      const response = await this.makeRenderAPICall('GET', '/postgres');
      if (response.success && response.data) {
        response.data.forEach(db => {
          this.databases.set(db.id, db);
        });
        this.logger.info(`🗃️ Cached ${response.data.length} Render databases`);
      }
    } catch (error) {
      this.logger.error('Failed to refresh database cache:', error);
    }
  }

  // MCP TOOLS IMPLEMENTATION

  async listRenderServices() {
    this.logger.info('📋 Listing all Render services...');
    
    try {
      const response = await this.makeRenderAPICall('GET', '/services');
      
      if (!response.success) {
        return {
          success: false,
          error: 'Failed to fetch services from Render API'
        };
      }

      const services = response.data.map(service => ({
        id: service.id,
        name: service.name,
        type: service.type,
        status: service.status,
        url: service.serviceDetails?.url,
        region: service.serviceDetails?.region,
        plan: service.serviceDetails?.plan,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        repo: service.repo?.name,
        branch: service.branch,
        buildCommand: service.serviceDetails?.buildCommand,
        startCommand: service.serviceDetails?.startCommand,
        healthCheckPath: service.serviceDetails?.healthCheckPath
      }));

      return {
        success: true,
        services,
        totalCount: services.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to list Render services:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getRenderServiceDetails(serviceId) {
    this.logger.info(`🔍 Getting details for service: ${serviceId}`);
    
    try {
      const response = await this.makeRenderAPICall('GET', `/services/${serviceId}`);
      
      if (!response.success) {
        return {
          success: false,
          error: `Failed to fetch service details for ${serviceId}`
        };
      }

      const service = response.data;
      
      // Get recent deployments
      let deployments = [];
      try {
        const deploysResponse = await this.makeRenderAPICall('GET', `/services/${serviceId}/deploys`);
        if (deploysResponse.success) {
          deployments = deploysResponse.data.slice(0, 5); // Last 5 deployments
        }
      } catch (deployError) {
        this.logger.warn('Could not fetch deployments:', deployError.message);
      }

      return {
        success: true,
        service: {
          id: service.id,
          name: service.name,
          type: service.type,
          status: service.status,
          url: service.serviceDetails?.url,
          region: service.serviceDetails?.region,
          plan: service.serviceDetails?.plan,
          runtime: service.serviceDetails?.runtime,
          buildCommand: service.serviceDetails?.buildCommand,
          startCommand: service.serviceDetails?.startCommand,
          healthCheckPath: service.serviceDetails?.healthCheckPath,
          repo: service.repo,
          branch: service.branch,
          environmentId: service.environmentId,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
          suspend: service.suspend
        },
        deployments,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get service details for ${serviceId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listRenderDatabases() {
    this.logger.info('🗃️ Listing all Render databases...');
    
    try {
      const response = await this.makeRenderAPICall('GET', '/postgres');
      
      if (!response.success) {
        return {
          success: false,
          error: 'Failed to fetch databases from Render API'
        };
      }

      const databases = response.data.map(db => ({
        id: db.id,
        name: db.name,
        status: db.status,
        plan: db.plan,
        region: db.region,
        version: db.version,
        createdAt: db.createdAt,
        maxConnections: db.maxConnections,
        diskSizeGB: db.diskSizeGB,
        highAvailability: db.highAvailability,
        connectionInfo: {
          host: db.connectionInfo?.externalConnectionString ? 'Available' : 'Not Available',
          hasConnectionString: !!db.connectionInfo?.externalConnectionString
        }
      }));

      return {
        success: true,
        databases,
        totalCount: databases.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to list Render databases:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getRenderDatabaseDetails(databaseId) {
    this.logger.info(`🔍 Getting details for database: ${databaseId}`);
    
    try {
      const response = await this.makeRenderAPICall('GET', `/postgres/${databaseId}`);
      
      if (!response.success) {
        return {
          success: false,
          error: `Failed to fetch database details for ${databaseId}`
        };
      }

      const db = response.data;

      return {
        success: true,
        database: {
          id: db.id,
          name: db.name,
          status: db.status,
          plan: db.plan,
          region: db.region,
          version: db.version,
          createdAt: db.createdAt,
          updatedAt: db.updatedAt,
          maxConnections: db.maxConnections,
          diskSizeGB: db.diskSizeGB,
          highAvailability: db.highAvailability,
          role: db.role,
          connectionInfo: {
            hasConnectionString: !!db.connectionInfo?.externalConnectionString,
            internalConnectionString: !!db.connectionInfo?.internalConnectionString,
            psqlCommand: !!db.connectionInfo?.psqlCommand
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get database details for ${databaseId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateServiceEnvironmentVariables(serviceId, envVars) {
    this.logger.info(`🔧 Updating environment variables for service: ${serviceId}`, {
      variableCount: Object.keys(envVars).length
    });
    
    try {
      // Get current environment variables
      const currentResponse = await this.makeRenderAPICall('GET', `/services/${serviceId}/env-vars`);
      
      if (!currentResponse.success) {
        return {
          success: false,
          error: `Failed to fetch current environment variables for ${serviceId}`
        };
      }

      // Prepare updates
      const updates = Object.entries(envVars).map(([key, value]) => ({
        key,
        value: String(value)
      }));

      const response = await this.makeRenderAPICall('PUT', `/services/${serviceId}/env-vars`, updates);
      
      if (!response.success) {
        return {
          success: false,
          error: `Failed to update environment variables for ${serviceId}`
        };
      }

      return {
        success: true,
        serviceId,
        updatedVariables: Object.keys(envVars),
        message: `Updated ${Object.keys(envVars).length} environment variables`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to update environment variables for ${serviceId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deployService(serviceId, options = {}) {
    this.logger.info(`🚀 Triggering deployment for service: ${serviceId}`, options);
    
    try {
      const response = await this.makeRenderAPICall('POST', `/services/${serviceId}/deploys`, {
        clearCache: options.clearCache || false
      });
      
      if (!response.success) {
        return {
          success: false,
          error: `Failed to trigger deployment for ${serviceId}`
        };
      }

      const deployment = response.data;

      return {
        success: true,
        serviceId,
        deploymentId: deployment.id,
        status: deployment.status,
        createdAt: deployment.createdAt,
        clearCache: options.clearCache || false,
        message: `Deployment triggered for service ${serviceId}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to deploy service ${serviceId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getServiceLogs(serviceId, options = {}) {
    this.logger.info(`📜 Fetching logs for service: ${serviceId}`, options);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.startTime) params.append('startTime', options.startTime);
      if (options.endTime) params.append('endTime', options.endTime);
      if (options.level) params.append('level', options.level);
      if (options.limit) params.append('limit', options.limit.toString());

      const endpoint = `/services/${serviceId}/logs${params.toString() ? `?${params}` : ''}`;
      const response = await this.makeRenderAPICall('GET', endpoint);
      
      if (!response.success) {
        return {
          success: false,
          error: `Failed to fetch logs for ${serviceId}`
        };
      }

      return {
        success: true,
        serviceId,
        logs: response.data,
        options,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get logs for service ${serviceId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getServiceMetrics(serviceId, options = {}) {
    this.logger.info(`📊 Fetching metrics for service: ${serviceId}`, options);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.startTime) params.append('startTime', options.startTime);
      if (options.endTime) params.append('endTime', options.endTime);
      if (options.step) params.append('step', options.step.toString());

      const endpoint = `/services/${serviceId}/metrics${params.toString() ? `?${params}` : ''}`;
      const response = await this.makeRenderAPICall('GET', endpoint);
      
      if (!response.success) {
        return {
          success: false,
          error: `Failed to fetch metrics for ${serviceId}`
        };
      }

      return {
        success: true,
        serviceId,
        metrics: response.data,
        options,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics for service ${serviceId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async performHealthCheck() {
    this.logger.info('🏥 Performing comprehensive Render health check...');
    
    try {
      const [servicesResult, databasesResult] = await Promise.all([
        this.listRenderServices(),
        this.listRenderDatabases()
      ]);

      const health = {
        overall: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          total: servicesResult.success ? servicesResult.totalCount : 0,
          healthy: 0,
          issues: []
        },
        databases: {
          total: databasesResult.success ? databasesResult.totalCount : 0,
          healthy: 0,
          issues: []
        },
        apiConnection: {
          status: 'connected',
          lastCheck: new Date().toISOString()
        }
      };

      // Analyze service health
      if (servicesResult.success) {
        servicesResult.services.forEach(service => {
          if (service.status === 'live' || service.status === 'available') {
            health.services.healthy++;
          } else {
            health.services.issues.push({
              id: service.id,
              name: service.name,
              status: service.status,
              issue: `Service is not in healthy state: ${service.status}`
            });
          }
        });
      }

      // Analyze database health
      if (databasesResult.success) {
        databasesResult.databases.forEach(database => {
          if (database.status === 'available') {
            health.databases.healthy++;
          } else {
            health.databases.issues.push({
              id: database.id,
              name: database.name,
              status: database.status,
              issue: `Database is not available: ${database.status}`
            });
          }
        });
      }

      // Determine overall health
      const totalIssues = health.services.issues.length + health.databases.issues.length;
      if (totalIssues === 0) {
        health.overall = 'healthy';
      } else if (totalIssues <= 2) {
        health.overall = 'warning';
      } else {
        health.overall = 'critical';
      }

      return {
        success: true,
        health,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        success: false,
        error: error.message,
        health: {
          overall: 'error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async generateAIInsights(resourceType, resourceId = null) {
    this.logger.info(`🤖 Generating AI insights for ${resourceType}`, { resourceId });
    
    try {
      let context = '';
      let data = {};

      // Gather context based on resource type
      switch (resourceType) {
        case 'services':
          const servicesData = await this.listRenderServices();
          data = servicesData;
          context = `Analyze these Render services and provide insights on performance, scaling, and optimization opportunities:\n\n${JSON.stringify(servicesData, null, 2)}`;
          break;
          
        case 'databases':
          const databasesData = await this.listRenderDatabases();
          data = databasesData;
          context = `Analyze these Render databases and provide insights on performance, capacity, and optimization:\n\n${JSON.stringify(databasesData, null, 2)}`;
          break;
          
        case 'service':
          if (!resourceId) throw new Error('Resource ID required for service analysis');
          const serviceData = await this.getRenderServiceDetails(resourceId);
          data = serviceData;
          context = `Analyze this specific Render service and provide detailed insights and recommendations:\n\n${JSON.stringify(serviceData, null, 2)}`;
          break;
          
        case 'health':
          const healthData = await this.performHealthCheck();
          data = healthData;
          context = `Analyze the overall health of the Render infrastructure and provide recommendations:\n\n${JSON.stringify(healthData, null, 2)}`;
          break;
          
        default:
          throw new Error(`Unknown resource type: ${resourceType}`);
      }

      // Generate AI insights using Claude
      const message = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `You are an expert DevOps and infrastructure analyst specializing in Render.com services. Provide specific, actionable insights and recommendations based on the following data:

${context}

Please provide:
1. Key insights and observations
2. Performance optimization opportunities
3. Cost optimization suggestions
4. Scaling recommendations
5. Risk assessment and mitigation strategies
6. Best practices recommendations

Format your response as a structured analysis with clear sections and bullet points.`
        }]
      });

      return {
        success: true,
        resourceType,
        resourceId,
        insights: message.content[0].text,
        dataAnalyzed: data,
        generatedAt: new Date().toISOString(),
        aiModel: 'claude-3-5-sonnet'
      };
    } catch (error) {
      this.logger.error('Failed to generate AI insights:', error);
      return {
        success: false,
        error: error.message,
        resourceType,
        resourceId
      };
    }
  }

  // UTILITY METHODS

  getConnectionStatus() {
    return {
      connected: !!this.renderApiKey,
      apiKey: this.renderApiKey ? 'configured' : 'missing',
      baseUrl: this.renderApiBase,
      lastHealthCheck: this.lastHealthCheck.get('api') || null,
      timestamp: new Date().toISOString()
    };
  }

  async testConnection() {
    try {
      const response = await this.makeRenderAPICall('GET', '/services?limit=1');
      this.lastHealthCheck.set('api', new Date().toISOString());
      return {
        success: true,
        status: 'connected',
        responseTime: response.headers?.['x-response-time'] || 'unknown',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default RenderMCPIntegration;