import { EventEmitter } from 'events';
import logger, { logInfo, logError, logWarn } from './logger.js';
import agentMonitor from './ai/agentMonitor.js';

// Core AI Systems
import ManufacturingMCPServers from './mcp/manufacturingMCPServers.js';
import SentiaIntegrationLayer from './mcp/sentiaIntegrationLayer.js';
import AIEnsembleForecastingService from '../src/services/aiEnsembleForecasting.js';
import PredictiveMaintenanceSystem from './ai/predictiveMaintenance.js';
import ConversationalManufacturingAgent from './ai/conversationalAgent.js';
import SentiaDigitalTwinPlatform from './ai/digitalTwinPlatform.js';
import SentiaComputerVisionQuality from './ai/computerVisionQuality.js';
import SentiaSupplyChainIntelligence from './ai/supplyChainIntelligence.js';
import SentiaManufacturingExecution from './ai/manufacturingExecution.js';
import SentiaAnalyticsDashboard from './analytics/sentiaAnalyticsDashboard.js';

/**
 * Sentia AI Orchestrator
 * Master controller for all AI systems in the manufacturing dashboard
 * Coordinates between all AI modules and provides unified interface
 */
class SentiaAIOrchestrator extends EventEmitter {
  constructor() {
    super();
    
    // Core AI Systems
    this.systems = {
      mcp: null,
      integration: null,
      forecasting: null,
      maintenance: null,
      agent: null,
      digitalTwin: null,
      quality: null,
      supplyChain: null,
      execution: null,
      analytics: null
    };

    // System status tracking
    this.systemStatus = {
      initialized: false,
      activeModules: 0,
      healthScore: 0,
      lastHealthCheck: null,
      alerts: new Map(),
      performance: new Map()
    };

    // Unified data access
    this.unifiedData = {
      production: new Map(),
      quality: new Map(),
      financial: new Map(),
      botanical: new Map(),
      predictive: new Map()
    };

    // AI recommendations engine
    this.recommendations = {
      production: [],
      quality: [],
      supply: [],
      financial: [],
      strategic: []
    };

    // Performance monitoring
    this.monitoring = {
      metrics: new Map(),
      kpis: new Map(),
      slas: new Map(),
      incidents: []
    };

    logInfo('Sentia AI Orchestrator initialized');
  }

  /**
   * Initialize all AI systems
   */
  async initialize() {
    try {
      logInfo('Starting Sentia AI Systems initialization...');
      
      // Phase 1: Core Infrastructure
      await this.initializeCoreInfrastructure();
      
      // Phase 2: AI Analytics Systems
      await this.initializeAIAnalytics();
      
      // Phase 3: Operational AI Systems
      await this.initializeOperationalAI();
      
      // Phase 4: Integration and Orchestration
      await this.initializeOrchestration();
      
      // Phase 5: Start monitoring
      this.startSystemMonitoring();
      
      this.systemStatus.initialized = true;
      this.systemStatus.activeModules = Object.values(this.systems).filter(s => s !== null).length;
      
      // Initialize 24/7 Agent Monitoring
      this.setup247Monitoring();
      
      logInfo(`Sentia AI Orchestrator initialization complete. ${this.systemStatus.activeModules} modules active.`);
      
      this.emit('initialized', {
        timestamp: new Date(),
        modules: this.systemStatus.activeModules,
        status: 'ready'
      });
      
      return {
        success: true,
        modules: this.systemStatus.activeModules,
        status: this.getSystemStatus()
      };
      
    } catch (error) {
      logError('AI Orchestrator initialization failed:', error);
      this.systemStatus.initialized = false;
      throw error;
    }
  }

  /**
   * Initialize core infrastructure
   */
  async initializeCoreInfrastructure() {
    logInfo('Phase 1: Initializing core infrastructure...');
    
    // MCP Server Orchestration
    try {
      this.systems.mcp = new ManufacturingMCPServers();
      await this.systems.mcp.initializeDefaultServers();
      logInfo('✓ MCP Servers initialized');
    } catch (error) {
      logError('MCP initialization failed:', error);
    }

    // Integration Layer (Unleashed + Xero)
    try {
      this.systems.integration = new SentiaIntegrationLayer();
      await this.systems.integration.initializeIntegration();
      logInfo('✓ Integration Layer (Unleashed/Xero) initialized');
    } catch (error) {
      logError('Integration layer initialization failed:', error);
    }
  }

  /**
   * Initialize AI analytics systems
   */
  async initializeAIAnalytics() {
    logInfo('Phase 2: Initializing AI analytics systems...');
    
    // Ensemble Forecasting
    try {
      this.systems.forecasting = new AIEnsembleForecastingService();
      logInfo('✓ AI Ensemble Forecasting initialized');
    } catch (error) {
      logError('Forecasting initialization failed:', error);
    }

    // Supply Chain Intelligence
    try {
      this.systems.supplyChain = new SentiaSupplyChainIntelligence();
      await this.systems.supplyChain.initializeSystem();
      logInfo('✓ Supply Chain Intelligence initialized');
    } catch (error) {
      logError('Supply chain intelligence initialization failed:', error);
    }

    // Analytics Dashboard
    try {
      this.systems.analytics = new SentiaAnalyticsDashboard();
      await this.systems.analytics.initializeAnalytics();
      logInfo('✓ Analytics Dashboard initialized');
    } catch (error) {
      logError('Analytics dashboard initialization failed:', error);
    }
  }

  /**
   * Initialize operational AI systems
   */
  async initializeOperationalAI() {
    logInfo('Phase 3: Initializing operational AI systems...');
    
    // Digital Twin Platform
    try {
      this.systems.digitalTwin = new SentiaDigitalTwinPlatform();
      await this.systems.digitalTwin.initializePlatform();
      logInfo('✓ Digital Twin Platform initialized');
    } catch (error) {
      logError('Digital twin initialization failed:', error);
    }

    // Computer Vision Quality
    try {
      this.systems.quality = new SentiaComputerVisionQuality();
      await this.systems.quality.initializeSystem();
      logInfo('✓ Computer Vision Quality System initialized');
    } catch (error) {
      logError('Quality system initialization failed:', error);
    }

    // Predictive Maintenance
    try {
      this.systems.maintenance = new PredictiveMaintenanceSystem();
      await this.systems.maintenance.initializeSystem();
      logInfo('✓ Predictive Maintenance System initialized');
    } catch (error) {
      logError('Maintenance system initialization failed:', error);
    }

    // Manufacturing Execution
    try {
      this.systems.execution = new SentiaManufacturingExecution();
      await this.systems.execution.initializeSystem();
      logInfo('✓ Manufacturing Execution Intelligence initialized');
    } catch (error) {
      logError('Manufacturing execution initialization failed:', error);
    }

    // Conversational AI Agent
    try {
      this.systems.agent = new ConversationalManufacturingAgent();
      await this.systems.agent.initializeAgent();
      logInfo('✓ Conversational AI Agent initialized');
    } catch (error) {
      logError('Conversational agent initialization failed:', error);
    }
  }

  /**
   * Initialize orchestration and cross-system integration
   */
  async initializeOrchestration() {
    logInfo('Phase 4: Initializing orchestration...');
    
    // Setup cross-system event handlers
    this.setupCrossSystemIntegration();
    
    // Initialize unified data layer
    await this.initializeUnifiedDataLayer();
    
    // Setup recommendation engine
    this.setupRecommendationEngine();
    
    // Initialize KPI tracking
    this.initializeKPITracking();
    
    logInfo('✓ Orchestration layer initialized');
  }

  /**
   * Setup cross-system integration
   */
  setupCrossSystemIntegration() {
    // Digital Twin <-> Manufacturing Execution
    if (this.systems.digitalTwin && this.systems.execution) {
      this.systems.digitalTwin.on('batchStarted', (data) => {
        this.systems.execution.handleBatchStarted?.(data);
      });
    }

    // Quality System <-> Supply Chain
    if (this.systems.quality && this.systems.supplyChain) {
      this.systems.quality.on('qualityAlert', (alert) => {
        this.systems.supplyChain.handleQualityAlert?.(alert);
      });
    }

    // Forecasting <-> Manufacturing Execution
    if (this.systems.forecasting && this.systems.execution) {
      this.systems.forecasting.on('forecastUpdated', (forecast) => {
        this.systems.execution.updateProductionSchedule?.(forecast);
      });
    }

    // Maintenance <-> Digital Twin
    if (this.systems.maintenance && this.systems.digitalTwin) {
      this.systems.maintenance.on('maintenanceRequired', (data) => {
        this.systems.digitalTwin.updateEquipmentStatus?.(data);
      });
    }

    // Analytics <-> All Systems
    if (this.systems.analytics) {
      this.setupAnalyticsIntegration();
    }

    logInfo('Cross-system integration established');
  }

  /**
   * Execute unified query across all AI systems
   */
  async executeUnifiedQuery(query, options = {}) {
    const {
      systems = 'all',
      aggregateResults = true,
      includeRecommendations = true,
      format = 'structured'
    } = options;

    const results = {
      query,
      timestamp: new Date(),
      responses: {},
      insights: {},
      recommendations: [],
      visualizations: []
    };

    try {
      // Route query to conversational agent for NLP processing
      if (this.systems.agent) {
        const nlpResponse = await this.systems.agent.processUserInput(
          query,
          'orchestrator',
          `session_${Date.now()}`
        );
        results.nlpInterpretation = nlpResponse;
      }

      // Query relevant systems based on intent
      const relevantSystems = this.identifyRelevantSystems(query, systems);
      
      for (const systemId of relevantSystems) {
        const system = this.systems[systemId];
        if (system && typeof system.query === 'function') {
          try {
            results.responses[systemId] = await system.query(query);
          } catch (error) {
            results.responses[systemId] = { error: error.message };
          }
        }
      }

      // Aggregate and synthesize results
      if (aggregateResults) {
        results.insights = this.synthesizeInsights(results.responses);
      }

      // Generate recommendations
      if (includeRecommendations) {
        results.recommendations = await this.generateUnifiedRecommendations(
          query,
          results.insights
        );
      }

      // Generate visualizations if applicable
      if (this.systems.digitalTwin && query.toLowerCase().includes('visual')) {
        results.visualizations.push({
          type: '3d_digital_twin',
          data: this.systems.digitalTwin.generate3DSceneData()
        });
      }

      return this.formatResponse(results, format);

    } catch (error) {
      logError('Unified query execution failed:', error);
      return { error: error.message, query };
    }
  }

  /**
   * Start production batch with AI optimization
   */
  async startProductionBatch(productType, quantity, options = {}) {
    const {
      priority = 'normal',
      optimizeFor = 'balanced', // balanced, quality, speed, cost
      constraints = {}
    } = options;

    try {
      // Step 1: Check botanical inventory
      const inventoryCheck = await this.systems.supplyChain.checkBotanicalAvailability(
        productType,
        quantity
      );

      if (!inventoryCheck.sufficient) {
        return {
          success: false,
          reason: 'insufficient_botanicals',
          details: inventoryCheck.shortages,
          recommendations: inventoryCheck.procurementSuggestions
        };
      }

      // Step 2: Generate optimized production plan
      const productionPlan = await this.systems.execution.createOptimizedProductionPlan(
        productType,
        quantity,
        { priority, optimizeFor, constraints }
      );

      // Step 3: Start digital twin simulation
      const simulationResult = await this.systems.digitalTwin.startProductionBatch(
        productType,
        quantity,
        priority
      );

      // Step 4: Configure quality checkpoints
      await this.systems.quality.configureProductionQualityChecks(
        simulationResult.batchId,
        productType
      );

      // Step 5: Execute production
      const executionResult = await this.systems.execution.executeProductionOrder(
        productionPlan.orderId,
        { simulation: simulationResult }
      );

      // Step 6: Setup real-time monitoring
      this.monitorProductionBatch(executionResult);

      return {
        success: true,
        batchId: simulationResult.batchId,
        orderId: productionPlan.orderId,
        estimatedCompletion: executionResult.estimatedCompletion,
        digitalTwinId: simulationResult.batchId,
        qualityCheckpoints: productionPlan.qualityCheckpoints,
        monitoring: 'active'
      };

    } catch (error) {
      logError('Production batch start failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive system dashboard
   */
  async getUnifiedDashboard(dashboardType = 'executive') {
    const dashboard = {
      type: dashboardType,
      timestamp: new Date(),
      systemHealth: this.getSystemHealth(),
      modules: {},
      insights: {},
      alerts: [],
      recommendations: []
    };

    try {
      // Collect dashboard data from each system
      if (this.systems.analytics) {
        dashboard.modules.analytics = await this.systems.analytics.getDashboardData(dashboardType);
      }

      if (this.systems.digitalTwin) {
        dashboard.modules.digitalTwin = this.systems.digitalTwin.getPlatformStatus();
      }

      if (this.systems.execution) {
        dashboard.modules.execution = this.systems.execution.getExecutionDashboard();
      }

      if (this.systems.quality) {
        dashboard.modules.quality = this.systems.quality.getQualityDashboard();
      }

      if (this.systems.supplyChain) {
        dashboard.modules.supplyChain = this.systems.supplyChain.getSupplyChainDashboard();
      }

      if (this.systems.maintenance) {
        dashboard.modules.maintenance = this.systems.maintenance.getMaintenanceDashboard();
      }

      // Generate unified insights
      dashboard.insights = await this.generateUnifiedInsights(dashboard.modules);

      // Collect active alerts
      dashboard.alerts = this.getActiveAlerts();

      // Generate strategic recommendations
      dashboard.recommendations = await this.generateStrategicRecommendations(
        dashboard.insights,
        dashboardType
      );

      return dashboard;

    } catch (error) {
      logError('Failed to generate unified dashboard:', error);
      dashboard.error = error.message;
      return dashboard;
    }
  }

  /**
   * Generate forecast with ensemble AI
   */
  async generateForecast(productSKU, options = {}) {
    const {
      timeHorizon = 90,
      includeScenarios = true,
      optimizationGoal = 'balanced'
    } = options;

    try {
      // Get ensemble forecast
      const forecast = await this.systems.forecasting.generateEnsembleForecast({
        sku: productSKU,
        timeHorizon,
        includeExternalFactors: true,
        useSeasonalDecomposition: true
      });

      // Enhance with supply chain intelligence
      const supplyChainFactors = await this.systems.supplyChain.assessSupplyChainImpact(
        productSKU,
        timeHorizon
      );

      // Generate production recommendations
      const productionRecommendations = await this.systems.execution.generateProductionStrategy(
        forecast,
        supplyChainFactors
      );

      // Create scenario analysis if requested
      let scenarios = null;
      if (includeScenarios) {
        scenarios = await this.generateScenarioAnalysis(
          productSKU,
          forecast,
          optimizationGoal
        );
      }

      return {
        forecast,
        supplyChainFactors,
        productionRecommendations,
        scenarios,
        confidence: forecast.insights?.confidence_score || 0,
        timestamp: new Date()
      };

    } catch (error) {
      logError('Forecast generation failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Perform quality inspection with computer vision
   */
  async performQualityInspection(imageData, inspectionType, productInfo) {
    try {
      // Process image with computer vision
      const inspectionId = await this.systems.quality.processImage(
        imageData,
        inspectionType,
        productInfo.productType
      );

      // Wait for processing to complete
      const maxWait = 10000; // 10 seconds
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWait) {
        const result = this.systems.quality.inspectionResults.get(inspectionId);
        if (result && result.status === 'completed') {
          // Update digital twin with quality data
          if (this.systems.digitalTwin) {
            await this.systems.digitalTwin.updateQualityData(
              productInfo.batchId,
              result
            );
          }

          // Generate quality recommendations
          const recommendations = this.generateQualityRecommendations(result);

          return {
            inspectionId,
            result: result.results,
            recommendations,
            timestamp: new Date()
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return {
        inspectionId,
        status: 'processing',
        message: 'Inspection still processing, check back later'
      };

    } catch (error) {
      logError('Quality inspection failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Get system health and performance metrics
   */
  getSystemHealth() {
    const health = {
      overall: 'healthy',
      score: 0,
      modules: {},
      issues: [],
      performance: {}
    };

    let healthyModules = 0;
    let totalModules = 0;

    // Check each system module
    for (const [name, system] of Object.entries(this.systems)) {
      if (system) {
        totalModules++;
        const moduleHealth = this.checkModuleHealth(name, system);
        health.modules[name] = moduleHealth;
        
        if (moduleHealth.status === 'healthy') {
          healthyModules++;
        } else if (moduleHealth.status === 'degraded') {
          health.issues.push({
            module: name,
            issue: moduleHealth.issue,
            severity: 'warning'
          });
        } else if (moduleHealth.status === 'error') {
          health.issues.push({
            module: name,
            issue: moduleHealth.issue,
            severity: 'critical'
          });
        }
      }
    }

    // Calculate overall health score
    health.score = totalModules > 0 ? Math.round((healthyModules / totalModules) * 100) : 0;
    
    // Determine overall status
    if (health.score >= 90) {
      health.overall = 'healthy';
    } else if (health.score >= 70) {
      health.overall = 'degraded';
    } else {
      health.overall = 'critical';
    }

    // Add performance metrics
    health.performance = this.getPerformanceMetrics();

    this.systemStatus.healthScore = health.score;
    this.systemStatus.lastHealthCheck = new Date();

    return health;
  }

  /**
   * Check individual module health
   */
  checkModuleHealth(name, system) {
    try {
      // Check if system has a health check method
      if (typeof system.getHealth === 'function') {
        return system.getHealth();
      }

      // Check if system has a status method
      if (typeof system.getStatus === 'function') {
        const status = system.getStatus();
        return {
          status: status.operational ? 'healthy' : 'degraded',
          details: status
        };
      }

      // Default to healthy if no health check available
      return { status: 'healthy', details: 'No health check available' };

    } catch (error) {
      return {
        status: 'error',
        issue: error.message,
        details: { error: error.message }
      };
    }
  }

  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    const monitoringInterval = 60000; // 1 minute

    setInterval(async () => {
      try {
        // Perform health check
        const health = this.getSystemHealth();
        
        // Check for critical issues
        if (health.overall === 'critical') {
          this.handleCriticalSystemIssue(health);
        }

        // Update monitoring metrics
        this.monitoring.metrics.set('system_health', health.score);
        this.monitoring.metrics.set('active_modules', this.systemStatus.activeModules);
        
        // Emit monitoring event
        this.emit('monitoringUpdate', {
          timestamp: new Date(),
          health,
          metrics: Object.fromEntries(this.monitoring.metrics)
        });

      } catch (error) {
        logError('System monitoring error:', error);
      }
    }, monitoringInterval);

    logInfo('System monitoring started');
  }

  /**
   * Handle critical system issues
   */
  handleCriticalSystemIssue(health) {
    logError(`CRITICAL: System health degraded to ${health.score}%`);
    
    // Create incident
    const incident = {
      id: `incident_${Date.now()}`,
      severity: 'critical',
      description: `System health critical: ${health.score}%`,
      issues: health.issues,
      timestamp: new Date(),
      status: 'open'
    };

    this.monitoring.incidents.push(incident);
    
    // Emit critical alert
    this.emit('criticalAlert', incident);
    
    // Attempt auto-recovery for specific issues
    this.attemptAutoRecovery(health.issues);
  }

  /**
   * Attempt automatic recovery for known issues
   */
  async attemptAutoRecovery(issues) {
    for (const issue of issues) {
      if (issue.severity === 'critical') {
        logInfo(`Attempting auto-recovery for ${issue.module}`);
        
        try {
          // Attempt to restart the affected module
          const system = this.systems[issue.module];
          if (system && typeof system.restart === 'function') {
            await system.restart();
            logInfo(`Successfully restarted ${issue.module}`);
          }
        } catch (error) {
          logError(`Auto-recovery failed for ${issue.module}:`, error);
        }
      }
    }
  }

  /**
   * Shutdown all systems gracefully
   */
  async shutdown() {
    logInfo('Starting Sentia AI Orchestrator shutdown...');
    
    try {
      // Shutdown each system in reverse order
      const shutdownOrder = [
        'agent', 'analytics', 'execution', 'supplyChain',
        'quality', 'maintenance', 'digitalTwin', 'forecasting',
        'integration', 'mcp'
      ];

      for (const systemName of shutdownOrder) {
        const system = this.systems[systemName];
        if (system && typeof system.shutdown === 'function') {
          try {
            await system.shutdown();
            logInfo(`✓ ${systemName} shutdown complete`);
          } catch (error) {
            logError(`Failed to shutdown ${systemName}:`, error);
          }
        }
      }

      // Clear all data
      this.unifiedData.production.clear();
      this.unifiedData.quality.clear();
      this.unifiedData.financial.clear();
      this.unifiedData.botanical.clear();
      this.unifiedData.predictive.clear();

      // Clear monitoring
      this.monitoring.metrics.clear();
      this.monitoring.kpis.clear();
      this.monitoring.slas.clear();
      
      this.systemStatus.initialized = false;
      this.systemStatus.activeModules = 0;
      
      logInfo('Sentia AI Orchestrator shutdown complete');
      
      this.emit('shutdown', { timestamp: new Date() });
      
    } catch (error) {
      logError('Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      initialized: this.systemStatus.initialized,
      activeModules: this.systemStatus.activeModules,
      healthScore: this.systemStatus.healthScore,
      lastHealthCheck: this.systemStatus.lastHealthCheck,
      activeAlerts: this.systemStatus.alerts.size,
      openIncidents: this.monitoring.incidents.filter(i => i.status === 'open').length,
      modules: Object.keys(this.systems).reduce((acc, key) => {
        acc[key] = this.systems[key] ? 'active' : 'inactive';
        return acc;
      }, {}),
      monitoring247: agentMonitor.getStatus()
    };
  }

  /**
   * Setup 24/7 Agent Monitoring
   */
  setup247Monitoring() {
    logInfo('Setting up 24/7 agent monitoring...');
    
    // Register all AI agents for monitoring
    const agentConfigs = [
      { id: 'mcp', agent: this.systems.mcp, critical: true },
      { id: 'forecasting', agent: this.systems.forecasting, critical: true },
      { id: 'maintenance', agent: this.systems.maintenance, critical: true },
      { id: 'quality', agent: this.systems.quality, critical: false },
      { id: 'supplyChain', agent: this.systems.supplyChain, critical: true },
      { id: 'digitalTwin', agent: this.systems.digitalTwin, critical: false },
      { id: 'execution', agent: this.systems.execution, critical: true },
      { id: 'agent', agent: this.systems.agent, critical: false },
      { id: 'analytics', agent: this.systems.analytics, critical: true },
      { id: 'integration', agent: this.systems.integration, critical: true }
    ];

    agentConfigs.forEach(({ id, agent, critical }) => {
      if (agent) {
        agentMonitor.registerAgent(id, agent, {
          critical,
          autoRestart: true,
          healthCheckMethod: 'getSystemStatus'
        });
      }
    });

    // Setup event listeners for monitoring events
    agentMonitor.on('agent-failed', (event) => {
      logError(`Critical agent failed: ${event.agentId}`);
      this.systemStatus.alerts.add({
        type: 'agent-failure',
        severity: event.critical ? 'critical' : 'warning',
        message: `Agent ${event.agentId} failed after ${event.attempts} restart attempts`,
        timestamp: new Date()
      });
    });

    agentMonitor.on('agent-restarted', (event) => {
      logInfo(`Agent restarted successfully: ${event.agentId}`);
    });

    agentMonitor.on('critical-agent-down', (event) => {
      logError(`CRITICAL ALERT: Essential agent down - ${event.agentId}`);
      // Could trigger external alerts here (email, Slack, etc.)
    });

    // Start 24/7 monitoring
    agentMonitor.start();
    
    logInfo('24/7 agent monitoring activated');
  }

  /**
   * Get agent monitoring status
   */
  getAgentMonitoringStatus() {
    return agentMonitor.getStatus();
  }

  /**
   * Manually restart specific agent
   */
  async restartAgent(agentId) {
    return await agentMonitor.forceRestartAgent(agentId);
  }

  /**
   * Force health check on all agents
   */
  async checkAgentHealth() {
    return await agentMonitor.performHealthCheck();
  }
}

// Export singleton instance
const sentiaAIOrchestrator = new SentiaAIOrchestrator();

export default sentiaAIOrchestrator;
export { SentiaAIOrchestrator };