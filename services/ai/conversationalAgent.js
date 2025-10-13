import { EventEmitter } from 'events';
import axios from 'axios';
import logger, { logInfo, logError, logWarn } from '../logger.js';
import ManufacturingMCPServers from '../mcp/manufacturingMCPServers.js';
import PredictiveMaintenanceSystem from './predictiveMaintenance.js';
import AIEnsembleForecastingService from '../../src/services/aiEnsembleForecasting.js';

/**
 * Enterprise Conversational AI Agent
 * Natural language interface for manufacturing operations
 * Multi-modal AI with voice, text, and autonomous task execution
 */
class ConversationalManufacturingAgent extends EventEmitter {
  constructor() {
    super();
    
    this.mcpServers = new ManufacturingMCPServers();
    this.predictiveMaintenance = new PredictiveMaintenanceSystem();
    this.forecastingService = new AIEnsembleForecastingService();
    
    // AI Model Clients
    this.aiClients = {
      openai: this.initializeOpenAI(),
      claude: this.initializeClaude(),
      azure: this.initializeAzureOpenAI()
    };

    // NLP Processing
    this.nlp = {
      intentClassifier: this.initializeIntentClassifier(),
      entityExtractor: this.initializeEntityExtractor(),
      contextManager: this.initializeContextManager()
    };

    // Conversation State
    this.conversations = new Map();
    this.userContexts = new Map();
    this.activeDialogs = new Map();
    
    // Agent Capabilities
    this.capabilities = {
      dataQuery: true,
      reportGeneration: true,
      taskAutomation: true,
      alertManagement: true,
      visualizationGeneration: true,
      voiceInteraction: true,
      multiLanguage: true,
      contextAwareness: true
    };

    // Voice Recognition Setup
    this.voiceConfig = {
      enabled: process.env.VOICE_RECOGNITION_ENABLED === 'true',
      provider: process.env.VOICE_PROVIDER || 'azure',
      languages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN']
    };

    this.initializeAgent();
    logInfo('Conversational Manufacturing Agent initialized');
  }

  /**
   * Initialize the conversational agent
   */
  async initializeAgent() {
    try {
      // Setup MCP integration
      await this.mcpServers.initializeDefaultServers();
      
      // Initialize NLP models
      await this.initializeNLPModels();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Register agent commands
      this.registerAgentCommands();
      
      logInfo('Conversational Agent initialization complete');
    } catch (error) {
      logError('Agent initialization failed:', error);
    }
  }

  /**
   * Initialize AI clients
   */
  initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    return axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  initializeClaude() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) return null;

    return axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });
  }

  initializeAzureOpenAI() {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    if (!apiKey || !endpoint) return null;

    return axios.create({
      baseURL: `${endpoint}/openai/deployments`,
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Initialize NLP models and processors
   */
  async initializeNLPModels() {
    // Intent classification patterns
    this.intentPatterns = {
      // Data Query Intents
      'data_query': [
        /(?:show|get|find|retrieve|display)\s+(?:me\s+)?(?:the\s+)?(.+)/i,
        /what(?:'s|\s+is)\s+(?:the\s+)?(.+)/i,
        /how\s+(?:much|many)\s+(.+)/i,
        /tell\s+me\s+about\s+(.+)/i
      ],
      
      // Production Intents
      'production_status': [
        /(?:production|manufacturing)\s+status/i,
        /how\s+(?:is\s+)?production\s+(?:going|doing)/i,
        /current\s+production\s+(?:levels|rates)/i
      ],
      
      // Equipment Intents
      'equipment_status': [
        /equipment\s+(?:status|health|condition)/i,
        /(?:how\s+(?:is\s+)?)?(?:machine|equipment)\s+(.+)/i,
        /maintenance\s+(?:status|schedule|alerts)/i
      ],
      
      // Forecasting Intents
      'forecast_demand': [
        /forecast\s+(?:for\s+)?(.+)/i,
        /predict\s+(?:demand|sales)\s+(?:for\s+)?(.+)/i,
        /what\s+(?:will|are)\s+(?:sales|demand)\s+(?:be\s+)?(?:for\s+)?(.+)/i
      ],
      
      // Alert Intents
      'alert_management': [
        /(?:show|get|clear)\s+alerts/i,
        /any\s+(?:problems|issues|alerts)/i,
        /what\s+(?:needs|requires)\s+attention/i
      ],
      
      // Report Generation
      'generate_report': [
        /(?:generate|create|make)\s+(?:a\s+)?report\s+(?:on\s+|for\s+)?(.+)/i,
        /report\s+(?:on\s+|for\s+)?(.+)/i,
        /summary\s+(?:of\s+)?(.+)/i
      ],
      
      // Task Automation
      'automate_task': [
        /(?:start|run|execute)\s+(.+)/i,
        /automate\s+(.+)/i,
        /schedule\s+(.+)/i
      ]
    };

    // Entity extraction patterns
    this.entityPatterns = {
      equipment: /(?:pump|motor|conveyor|compressor|machine|equipment)\s*[A-Z0-9_-]*/gi,
      sku: /SKU[\s\-_]?[A-Z0-9-]+/gi,
      date: /(?:today|yesterday|tomorrow|\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      timeframe: /(?:last|next|past)\s+(?:\d+\s+)?(?:day|week|month|year)s?/gi,
      metric: /(?:temperature|pressure|flow|vibration|speed|efficiency|oee|downtime)/gi,
      location: /(?:line|area|zone|facility|plant)\s*[A-Z0-9_-]*/gi
    };

    logInfo('NLP models initialized');
  }

  /**
   * Process natural language input
   */
  async processUserInput(input, userId, sessionId = null) {
    try {
      const session = sessionId || `session_${Date.now()}_${userId}`;
      
      // Get or create conversation context
      let conversation = this.conversations.get(session) || {
        id: session,
        userId,
        messages: [],
        context: {},
        startTime: new Date(),
        lastActivity: new Date()
      };

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: input,
        timestamp: new Date()
      });

      // Extract intent and entities
      const intent = await this.classifyIntent(input);
      const entities = await this.extractEntities(input);
      
      // Update context
      conversation.context = await this.updateContext(conversation.context, intent, entities);

      // Generate response
      const response = await this.generateResponse(intent, entities, conversation);
      
      // Add assistant message
      conversation.messages.push({
        role: 'assistant',
        content: response.text,
        actions: response.actions,
        data: response.data,
        timestamp: new Date()
      });

      // Update conversation
      conversation.lastActivity = new Date();
      this.conversations.set(session, conversation);

      return {
        sessionId: session,
        intent: intent.name,
        entities,
        response: response.text,
        actions: response.actions,
        data: response.data,
        context: conversation.context
      };

    } catch (error) {
      logError('User input processing failed:', error);
      return {
        error: 'I apologize, but I encountered an issue processing your request. Please try again.',
        details: error.message
      };
    }
  }

  /**
   * Classify user intent
   */
  async classifyIntent(input) {
    const normalizedInput = input.toLowerCase();
    
    // Pattern-based classification
    for (const [intentName, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        const match = normalizedInput.match(pattern);
        if (match) {
          return {
            name: intentName,
            confidence: 0.9,
            match: match[1] || match[0],
            method: 'pattern_based'
          };
        }
      }
    }

    // AI-based classification for complex queries
    if (this.aiClients.openai) {
      try {
        const aiIntent = await this.classifyWithAI(input);
        return aiIntent;
      } catch (error) {
        logWarn('AI intent classification failed:', error);
      }
    }

    return {
      name: 'general_inquiry',
      confidence: 0.5,
      match: input,
      method: 'fallback'
    };
  }

  /**
   * AI-powered intent classification
   */
  async classifyWithAI(input) {
    const prompt = `
Classify the following manufacturing-related query into one of these intents:
- data_query: Asking for specific data or information
- production_status: Asking about production performance
- equipment_status: Asking about equipment health or maintenance
- forecast_demand: Requesting demand or sales predictions
- alert_management: Managing alerts or issues
- generate_report: Requesting report generation
- automate_task: Requesting task automation
- general_inquiry: General questions or conversation

Query: "${input}"

Respond with JSON: {"intent": "intent_name", "confidence": 0.95, "reasoning": "brief explanation"}
    `;

    const response = await this.aiClients.openai.post('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 150
    });

    const result = JSON.parse(response.data.choices[0].message.content);
    return {
      name: result.intent,
      confidence: result.confidence,
      reasoning: result.reasoning,
      method: 'ai_powered'
    };
  }

  /**
   * Extract entities from user input
   */
  async extractEntities(input) {
    const entities = {};

    // Pattern-based extraction
    for (const [entityType, pattern] of Object.entries(this.entityPatterns)) {
      const matches = [...input.matchAll(pattern)];
      if (matches.length > 0) {
        entities[entityType] = matches.map(match => match[0].trim());
      }
    }

    // Extract dates and times
    entities.dates = this.extractDates(input);
    entities.numbers = this.extractNumbers(input);

    return entities;
  }

  /**
   * Generate response based on intent and entities
   */
  async generateResponse(intent, entities, conversation) {
    switch (intent.name) {
      case 'data_query':
        return await this.handleDataQuery(intent, entities, conversation);
      
      case 'production_status':
        return await this.handleProductionStatus(intent, entities, conversation);
      
      case 'equipment_status':
        return await this.handleEquipmentStatus(intent, entities, conversation);
      
      case 'forecast_demand':
        return await this.handleForecastRequest(intent, entities, conversation);
      
      case 'alert_management':
        return await this.handleAlertManagement(intent, entities, conversation);
      
      case 'generate_report':
        return await this.handleReportGeneration(intent, entities, conversation);
      
      case 'automate_task':
        return await this.handleTaskAutomation(intent, entities, conversation);
      
      default:
        return await this.handleGeneralInquiry(intent, entities, conversation);
    }
  }

  /**
   * Handle data query requests
   */
  async handleDataQuery(intent, entities, conversation) {
    try {
      const queryParams = this.buildQueryParameters(entities);
      const mcpData = await this.mcpServers.queryManufacturingIntelligence({
        intent: intent.match,
        parameters: queryParams,
        useSemanticSearch: true
      });

      if (mcpData && mcpData.data && mcpData.data.length > 0) {
        const summary = this.generateDataSummary(mcpData.data);
        return {
          text: `Here's what I found: ${summary.text}`,
          data: mcpData.data,
          actions: [{
            type: 'display_data',
            title: 'View Details',
            data: mcpData
          }],
          visualization: summary.visualization
        };
      } else {
        return {
          text: "I couldn't find specific data matching your query. Could you be more specific about what you're looking for?",
          actions: [{
            type: 'suggest_alternatives',
            suggestions: ['production data', 'equipment status', 'inventory levels']
          }]
        };
      }
    } catch (error) {
      logError('Data query handling failed:', error);
      return {
        text: "I encountered an issue while retrieving the data. Please try rephrasing your question.",
        error: error.message
      };
    }
  }

  /**
   * Handle production status requests
   */
  async handleProductionStatus(intent, entities, conversation) {
    try {
      const productionData = await this.mcpServers.queryManufacturingIntelligence({
        intent: 'current production metrics and OEE',
        parameters: {
          dataTypes: ['production-data', 'oee-metrics', 'work-orders'],
          timeRange: { hours: 24 }
        }
      });

      const maintenanceData = this.predictiveMaintenance.getMaintenanceDashboard();

      const summary = `Current production status:
• Overall Equipment Effectiveness: ${this.calculateOEE(productionData)}%
• Active production lines: ${this.countActiveLines(productionData)}
• Equipment at risk: ${maintenanceData.overview.highRiskEquipment}
• Active alerts: ${maintenanceData.overview.activeAlerts}`;

      return {
        text: summary,
        data: {
          production: productionData,
          maintenance: maintenanceData
        },
        actions: [{
          type: 'display_dashboard',
          title: 'View Production Dashboard',
          dashboard: 'production'
        }]
      };
    } catch (error) {
      return {
        text: "I'm having trouble accessing production data right now. Please check the system status.",
        error: error.message
      };
    }
  }

  /**
   * Handle equipment status requests
   */
  async handleEquipmentStatus(intent, entities, conversation) {
    try {
      const equipmentId = entities.equipment?.[0];
      const dashboard = this.predictiveMaintenance.getMaintenanceDashboard();

      if (equipmentId) {
        // Specific equipment query
        const equipment = dashboard.equipment.find(eq => 
          eq.name.toLowerCase().includes(equipmentId.toLowerCase()) ||
          eq.id.includes(equipmentId)
        );

        if (equipment) {
          return {
            text: `${equipment.name} status: ${equipment.status.toUpperCase()}, Risk Level: ${equipment.riskLevel}, Active Alerts: ${equipment.alerts}`,
            data: equipment,
            actions: [{
              type: 'view_equipment_details',
              equipmentId: equipment.id,
              title: `View ${equipment.name} Details`
            }]
          };
        } else {
          return {
            text: `I couldn't find equipment matching "${equipmentId}". Here are available equipment:`,
            data: dashboard.equipment.map(eq => ({ id: eq.id, name: eq.name })),
            actions: [{
              type: 'list_equipment',
              title: 'Show All Equipment'
            }]
          };
        }
      } else {
        // General equipment overview
        const highRisk = dashboard.equipment.filter(eq => eq.riskLevel === 'high' || eq.riskLevel === 'critical');
        const summary = `Equipment Overview:
• Total Equipment: ${dashboard.overview.totalEquipment}
• High Risk: ${highRisk.length}
• Maintenance Scheduled: ${dashboard.overview.maintenanceScheduled}
• Active Alerts: ${dashboard.overview.activeAlerts}`;

        return {
          text: summary,
          data: dashboard,
          actions: [{
            type: 'display_maintenance_dashboard',
            title: 'View Maintenance Dashboard'
          }]
        };
      }
    } catch (error) {
      return {
        text: "Unable to retrieve equipment status at this time.",
        error: error.message
      };
    }
  }

  /**
   * Handle demand forecasting requests
   */
  async handleForecastRequest(intent, entities, conversation) {
    try {
      const sku = entities.sku?.[0] || intent.match;
      const timeframe = this.parseTimeframe(entities.timeframe?.[0]) || 90;

      const forecast = await this.forecastingService.generateEnsembleForecast({
        sku,
        timeHorizon: timeframe,
        includeExternalFactors: true,
        useSeasonalDecomposition: true
      });

      if (forecast.success) {
        const summary = `Demand forecast for ${sku} (next ${timeframe} days):
• Predicted total demand: ${forecast.forecast.reduce((sum, day) => sum + day.predicted_demand, 0).toFixed(0)} units
• Confidence score: ${forecast.insights?.confidence_score || 75}%
• Trend: ${forecast.insights?.trend_direction || 'stable'}
• Model agreement: ${Math.round((forecast.insights?.model_agreement || 0.8) * 100)}%`;

        return {
          text: summary,
          data: forecast,
          actions: [{
            type: 'display_forecast_chart',
            title: 'View Forecast Chart',
            data: forecast.forecast
          }]
        };
      } else {
        return {
          text: `Unable to generate forecast for ${sku}. ${forecast.error || 'Please check the SKU and try again.'}`,
          error: forecast.error
        };
      }
    } catch (error) {
      return {
        text: "Forecast generation encountered an error. Please try again later.",
        error: error.message
      };
    }
  }

  /**
   * Handle alert management requests
   */
  async handleAlertManagement(intent, entities, conversation) {
    const dashboard = this.predictiveMaintenance.getMaintenanceDashboard();
    const activeAlerts = dashboard.alerts.slice(0, 10); // Limit to 10 most recent

    if (activeAlerts.length === 0) {
      return {
        text: "Great news! There are no active alerts at this time. All systems are operating normally.",
        data: { alerts: [] }
      };
    }

    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
    const summary = `Alert Summary:
• Total active alerts: ${activeAlerts.length}
• Critical alerts: ${criticalAlerts.length}
• Most recent: ${activeAlerts[0].description}`;

    return {
      text: summary,
      data: { alerts: activeAlerts },
      actions: [{
        type: 'display_alerts',
        title: 'View All Alerts',
        alerts: activeAlerts
      }, {
        type: 'acknowledge_alerts',
        title: 'Acknowledge Alerts'
      }]
    };
  }

  /**
   * Handle report generation requests
   */
  async handleReportGeneration(intent, entities, conversation) {
    const reportType = this.determineReportType(intent.match, entities);
    const timeframe = this.parseTimeframe(entities.timeframe?.[0]) || 7;

    const reportData = await this.generateReportData(reportType, timeframe);
    const report = await this.formatReport(reportType, reportData, timeframe);

    return {
      text: `I've generated a ${reportType} report covering the last ${timeframe} days. The report includes key metrics, trends, and recommendations.`,
      data: report,
      actions: [{
        type: 'display_report',
        title: 'View Report',
        report
      }, {
        type: 'export_report',
        title: 'Export PDF',
        format: 'pdf'
      }, {
        type: 'email_report',
        title: 'Email Report'
      }]
    };
  }

  /**
   * Handle task automation requests
   */
  async handleTaskAutomation(intent, entities, conversation) {
    const taskType = this.identifyTaskType(intent.match, entities);
    
    switch (taskType) {
      case 'maintenance_schedule':
        return await this.automateMaintenanceScheduling(entities);
      case 'production_optimization':
        return await this.automateProductionOptimization(entities);
      case 'inventory_reorder':
        return await this.automateInventoryReorder(entities);
      default:
        return {
          text: `I can help automate various tasks. What specific task would you like to automate?`,
          actions: [{
            type: 'suggest_automation',
            suggestions: ['maintenance scheduling', 'production optimization', 'inventory reordering']
          }]
        };
    }
  }

  /**
   * Handle general inquiries with AI assistance
   */
  async handleGeneralInquiry(intent, entities, conversation) {
    try {
      // Use AI to generate contextual response
      const context = await this.gatherRelevantContext(conversation);
      const aiResponse = await this.generateAIResponse(intent.match, context);
      
      return {
        text: aiResponse,
        actions: [{
          type: 'offer_help',
          suggestions: ['Check production status', 'View equipment health', 'Generate forecast']
        }]
      };
    } catch (error) {
      return {
        text: "I'm here to help with your manufacturing operations. You can ask me about production status, equipment health, forecasts, or any other manufacturing-related questions.",
        actions: [{
          type: 'show_capabilities',
          capabilities: Object.keys(this.capabilities)
        }]
      };
    }
  }

  /**
   * Generate AI-powered contextual response
   */
  async generateAIResponse(query, context) {
    if (!this.aiClients.claude) {
      return "I'm here to help with manufacturing operations. What would you like to know?";
    }

    const prompt = `You are an expert manufacturing AI assistant. Based on the following context and query, provide a helpful response.

Context: ${JSON.stringify(context, null, 2)}

Query: "${query}"

Provide a conversational, helpful response focusing on manufacturing operations, production optimization, equipment maintenance, and data insights. Keep it concise and actionable.`;

    try {
      const response = await this.aiClients.claude.post('/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return response.data.content[0].text;
    } catch (error) {
      logWarn('AI response generation failed:', error);
      return "I'm here to help with manufacturing operations. How can I assist you today?";
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle maintenance alerts
    this.predictiveMaintenance.on(_'anomalyDetected', _(anomaly) => {
      this.broadcastAlert('anomaly', anomaly);
    });

    this.predictiveMaintenance.on(_'maintenanceRequired', _(data) => {
      this.broadcastAlert('maintenance_required', data);
    });

    // Handle MCP data updates
    this.mcpServers.orchestrator.on(_'dataUpdated', _(data) => {
      this.emit('dataUpdated', data);
    });
  }

  /**
   * Broadcast alerts to active conversations
   */
  broadcastAlert(type, data) {
    const alert = {
      type,
      timestamp: new Date(),
      data,
      message: this.formatAlertMessage(type, data)
    };

    // Emit to all active conversations
    for (const [sessionId, conversation] of this.conversations) {
      if (Date.now() - conversation.lastActivity.getTime() < 3600000) { // Active within 1 hour
        this.emit('alertBroadcast', { sessionId, alert });
      }
    }
  }

  /**
   * Get conversation summary and analytics
   */
  getConversationAnalytics() {
    const analytics = {
      totalConversations: this.conversations.size,
      activeConversations: 0,
      topIntents: {},
      averageResolutionTime: 0,
      userSatisfaction: 0,
      capabilities: this.capabilities
    };

    for (const conversation of this.conversations.values()) {
      if (Date.now() - conversation.lastActivity.getTime() < 3600000) {
        analytics.activeConversations++;
      }

      // Count intents
      conversation.messages.forEach(msg => {
        if (msg.role === 'user') {
          // This would be enhanced with actual intent tracking
          analytics.topIntents['general'] = (analytics.topIntents['general'] || 0) + 1;
        }
      });
    }

    return analytics;
  }

  /**
   * Helper methods for data processing
   */
  buildQueryParameters(entities) {
    const params = {};
    
    if (entities.equipment) params.equipment = entities.equipment;
    if (entities.sku) params.sku = entities.sku;
    if (entities.dates) params.dates = entities.dates;
    if (entities.timeframe) params.timeframe = entities.timeframe;
    if (entities.metric) params.metrics = entities.metric;
    if (entities.location) params.location = entities.location;
    
    return params;
  }

  parseTimeframe(timeframeStr) {
    if (!timeframeStr) return null;
    
    const match = timeframeStr.match(/(\d+)\s+(day|week|month|year)s?/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      switch (unit) {
        case 'day': return value;
        case 'week': return value * 7;
        case 'month': return value * 30;
        case 'year': return value * 365;
        default: return value;
      }
    }
    
    return null;
  }

  extractDates(input) {
    const dates = [];
    const datePatterns = [
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b\d{1,2}/\d{1,2}/\d{4}\b/g,
      /\b(?:today|tomorrow|yesterday)\b/gi
    ];

    datePatterns.forEach(pattern => {
      const matches = [...input.matchAll(pattern)];
      dates.push(...matches.map(m => m[0]));
    });

    return dates;
  }

  extractNumbers(input) {
    const numberPattern = /\b\d+(?:.\d+)?\b/g;
    return [...input.matchAll(numberPattern)].map(m => parseFloat(m[0]));
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    await this.mcpServers.shutdown();
    await this.predictiveMaintenance.shutdown();
    await this.forecastingService.shutdown();
    
    this.conversations.clear();
    this.userContexts.clear();
    this.activeDialogs.clear();
    
    logInfo('Conversational Manufacturing Agent shutdown complete');
  }
}

export default ConversationalManufacturingAgent;