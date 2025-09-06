import { EventEmitter } from 'events';
import { logInfo, logWarn, logError } from '../../logger';
import { MCPProtocol, MCPMessage, MCPContext } from '../protocol';
import { VectorStore, VectorDocument } from '../context/vector-store';
import { KnowledgeBase } from '../context/knowledge-base';

/**
 * Multi-Model Orchestrator for intelligent model routing and ensemble predictions
 */

export interface ModelConfig {
  id: string;
  name: string;
  type: 'llm' | 'embedding' | 'classification' | 'regression' | 'forecasting';
  provider: 'openai' | 'anthropic' | 'huggingface' | 'local' | 'custom';
  endpoint?: string;
  apiKey?: string;
  capabilities: string[];
  performance: {
    latency: number; // Average latency in ms
    accuracy: number; // Accuracy score 0-1
    cost: number; // Cost per 1000 tokens/requests
    reliability: number; // Uptime/success rate 0-1
  };
  constraints?: {
    maxTokens?: number;
    maxRequestsPerMinute?: number;
    dataTypes?: string[];
  };
  metadata?: Record<string, any>;
}

export interface RoutingStrategy {
  type: 'performance' | 'cost' | 'balanced' | 'consensus' | 'fallback';
  weights?: Record<string, number>;
  threshold?: number;
  fallbackOrder?: string[];
}

export interface OrchestratorRequest {
  task: string;
  input: any;
  requirements?: {
    maxLatency?: number;
    minAccuracy?: number;
    maxCost?: number;
    capabilities?: string[];
    preferredModels?: string[];
  };
  strategy?: RoutingStrategy;
  context?: Record<string, any>;
}

export interface OrchestratorResponse {
  result: any;
  modelUsed: string | string[];
  executionTime: number;
  confidence: number;
  consensus?: {
    agreement: number;
    models: Record<string, any>;
  };
  fallbackUsed: boolean;
  metadata?: Record<string, any>;
}

export interface ModelPerformanceMetrics {
  modelId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalCost: number;
  lastUsed: Date;
  errorRate: number;
  scores: {
    accuracy: number[];
    latency: number[];
    reliability: number[];
  };
}

export class ModelOrchestrator extends EventEmitter {
  private models: Map<string, ModelConfig> = new Map();
  private performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map();
  private protocol: MCPProtocol;
  private vectorStore: VectorStore;
  private knowledgeBase: KnowledgeBase;
  private routingHistory: Array<{
    timestamp: Date;
    task: string;
    modelUsed: string;
    success: boolean;
    latency: number;
  }> = [];

  constructor(
    protocol: MCPProtocol,
    vectorStore: VectorStore,
    knowledgeBase: KnowledgeBase
  ) {
    super();
    this.protocol = protocol;
    this.vectorStore = vectorStore;
    this.knowledgeBase = knowledgeBase;
    this.initializeDefaultModels();
  }

  /**
   * Initialize with default model configurations
   */
  private initializeDefaultModels(): void {
    const models: ModelConfig[] = [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        type: 'llm',
        provider: 'openai',
        capabilities: ['text-generation', 'analysis', 'reasoning', 'code'],
        performance: {
          latency: 2000,
          accuracy: 0.95,
          cost: 0.03,
          reliability: 0.98
        },
        constraints: {
          maxTokens: 128000,
          maxRequestsPerMinute: 100
        }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        type: 'llm',
        provider: 'openai',
        capabilities: ['text-generation', 'analysis', 'basic-reasoning'],
        performance: {
          latency: 800,
          accuracy: 0.85,
          cost: 0.002,
          reliability: 0.99
        },
        constraints: {
          maxTokens: 16000,
          maxRequestsPerMinute: 200
        }
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        type: 'llm',
        provider: 'anthropic',
        capabilities: ['text-generation', 'analysis', 'reasoning', 'code', 'vision'],
        performance: {
          latency: 2500,
          accuracy: 0.96,
          cost: 0.075,
          reliability: 0.97
        },
        constraints: {
          maxTokens: 200000,
          maxRequestsPerMinute: 50
        }
      },
      {
        id: 'embedding-3-large',
        name: 'Text Embedding 3 Large',
        type: 'embedding',
        provider: 'openai',
        capabilities: ['text-embedding', 'similarity'],
        performance: {
          latency: 100,
          accuracy: 0.92,
          cost: 0.00013,
          reliability: 0.995
        }
      },
      {
        id: 'forecast-lstm',
        name: 'LSTM Forecasting Model',
        type: 'forecasting',
        provider: 'local',
        capabilities: ['time-series', 'demand-forecasting'],
        performance: {
          latency: 500,
          accuracy: 0.88,
          cost: 0.001,
          reliability: 0.99
        }
      }
    ];

    models.forEach(model => this.registerModel(model));
    logInfo('Model orchestrator initialized with default models', { count: models.length });
  }

  /**
   * Register a model
   */
  registerModel(config: ModelConfig): void {
    this.models.set(config.id, config);
    
    // Initialize performance metrics
    if (!this.performanceMetrics.has(config.id)) {
      this.performanceMetrics.set(config.id, {
        modelId: config.id,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: config.performance.latency,
        totalCost: 0,
        lastUsed: new Date(),
        errorRate: 0,
        scores: {
          accuracy: [config.performance.accuracy],
          latency: [config.performance.latency],
          reliability: [config.performance.reliability]
        }
      });
    }

    this.emit('modelRegistered', config);
    logInfo('Model registered', { modelId: config.id, name: config.name });
  }

  /**
   * Process request through orchestrator
   */
  async processRequest(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    
    try {
      // Select routing strategy
      const strategy = request.strategy || { type: 'balanced' };
      
      // Route to appropriate model(s)
      let response: OrchestratorResponse;
      
      switch (strategy.type) {
        case 'consensus':
          response = await this.executeConsensus(request);
          break;
        case 'fallback':
          response = await this.executeFallback(request);
          break;
        default:
          response = await this.executeSingle(request, strategy);
      }

      // Update metrics
      this.updateMetrics(response.modelUsed, true, Date.now() - startTime);
      
      // Store in history
      this.addToHistory(request.task, response.modelUsed, true, response.executionTime);
      
      // Learn from execution
      await this.learnFromExecution(request, response);

      this.emit('requestProcessed', { request, response });
      
      return response;

    } catch (error: any) {
      logError('Orchestrator request failed', error);
      
      // Try fallback if available
      if (request.strategy?.fallbackOrder) {
        return this.executeFallback(request);
      }
      
      throw error;
    }
  }

  /**
   * Execute single model
   */
  private async executeSingle(
    request: OrchestratorRequest,
    strategy: RoutingStrategy
  ): Promise<OrchestratorResponse> {
    const model = this.selectModel(request, strategy);
    
    if (!model) {
      throw new Error('No suitable model found for request');
    }

    const startTime = Date.now();
    const result = await this.executeModel(model, request);
    const executionTime = Date.now() - startTime;

    return {
      result,
      modelUsed: model.id,
      executionTime,
      confidence: this.calculateConfidence(model, result),
      fallbackUsed: false
    };
  }

  /**
   * Execute consensus strategy
   */
  private async executeConsensus(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const eligibleModels = this.getEligibleModels(request);
    
    if (eligibleModels.length < 2) {
      return this.executeSingle(request, { type: 'balanced' });
    }

    // Select top models for consensus
    const consensusModels = eligibleModels
      .sort((a, b) => this.scoreModel(b, request) - this.scoreModel(a, request))
      .slice(0, Math.min(3, eligibleModels.length));

    const startTime = Date.now();
    const results = await Promise.allSettled(
      consensusModels.map(model => this.executeModel(model, request))
    );

    const successfulResults: Record<string, any> = {};
    const modelIds: string[] = [];

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        const model = consensusModels[i];
        successfulResults[model.id] = (results[i] as any).value;
        modelIds.push(model.id);
      }
    }

    if (Object.keys(successfulResults).length === 0) {
      throw new Error('All consensus models failed');
    }

    // Aggregate results
    const aggregatedResult = this.aggregateResults(successfulResults);
    const agreement = this.calculateAgreement(successfulResults);
    const executionTime = Date.now() - startTime;

    return {
      result: aggregatedResult,
      modelUsed: modelIds,
      executionTime,
      confidence: agreement,
      consensus: {
        agreement,
        models: successfulResults
      },
      fallbackUsed: false
    };
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallback(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const fallbackOrder = request.strategy?.fallbackOrder || 
      Array.from(this.models.keys());

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (const modelId of fallbackOrder) {
      const model = this.models.get(modelId);
      if (!model || !this.isModelEligible(model, request)) {
        continue;
      }

      try {
        const result = await this.executeModel(model, request);
        const executionTime = Date.now() - startTime;

        return {
          result,
          modelUsed: modelId,
          executionTime,
          confidence: this.calculateConfidence(model, result),
          fallbackUsed: fallbackOrder.indexOf(modelId) > 0,
          metadata: {
            attemptedModels: fallbackOrder.slice(0, fallbackOrder.indexOf(modelId) + 1)
          }
        };
      } catch (error: any) {
        lastError = error;
        logWarn('Fallback model failed, trying next', { 
          modelId, 
          error: error.message 
        });
      }
    }

    throw lastError || new Error('All fallback models failed');
  }

  /**
   * Select best model based on strategy
   */
  private selectModel(request: OrchestratorRequest, strategy: RoutingStrategy): ModelConfig | null {
    const eligibleModels = this.getEligibleModels(request);
    
    if (eligibleModels.length === 0) {
      return null;
    }

    // Score models based on strategy
    const scoredModels = eligibleModels.map(model => ({
      model,
      score: this.scoreModel(model, request, strategy)
    }));

    // Sort by score and return best
    scoredModels.sort((a, b) => b.score - a.score);
    
    return scoredModels[0].model;
  }

  /**
   * Get eligible models for request
   */
  private getEligibleModels(request: OrchestratorRequest): ModelConfig[] {
    return Array.from(this.models.values()).filter(model => 
      this.isModelEligible(model, request)
    );
  }

  /**
   * Check if model is eligible for request
   */
  private isModelEligible(model: ModelConfig, request: OrchestratorRequest): boolean {
    // Check capabilities
    if (request.requirements?.capabilities) {
      const hasCapabilities = request.requirements.capabilities.every(cap =>
        model.capabilities.includes(cap)
      );
      if (!hasCapabilities) return false;
    }

    // Check performance requirements
    if (request.requirements?.maxLatency && 
        model.performance.latency > request.requirements.maxLatency) {
      return false;
    }

    if (request.requirements?.minAccuracy && 
        model.performance.accuracy < request.requirements.minAccuracy) {
      return false;
    }

    if (request.requirements?.maxCost && 
        model.performance.cost > request.requirements.maxCost) {
      return false;
    }

    // Check if model is preferred
    if (request.requirements?.preferredModels && 
        !request.requirements.preferredModels.includes(model.id)) {
      // Still eligible but will have lower score
    }

    return true;
  }

  /**
   * Score model based on request and strategy
   */
  private scoreModel(
    model: ModelConfig,
    request: OrchestratorRequest,
    strategy?: RoutingStrategy
  ): number {
    const metrics = this.performanceMetrics.get(model.id);
    if (!metrics) return 0;

    let score = 0;
    const weights = strategy?.weights || {
      performance: 0.3,
      cost: 0.2,
      latency: 0.25,
      reliability: 0.25
    };

    // Performance score
    const recentAccuracy = metrics.scores.accuracy.slice(-10);
    const avgAccuracy = recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length;
    score += avgAccuracy * (weights.performance || 0.3);

    // Cost score (inverse - lower is better)
    const costScore = 1 / (1 + model.performance.cost);
    score += costScore * (weights.cost || 0.2);

    // Latency score (inverse - lower is better)
    const latencyScore = 1000 / (1000 + model.performance.latency);
    score += latencyScore * (weights.latency || 0.25);

    // Reliability score
    const reliabilityScore = 1 - metrics.errorRate;
    score += reliabilityScore * (weights.reliability || 0.25);

    // Boost for preferred models
    if (request.requirements?.preferredModels?.includes(model.id)) {
      score *= 1.2;
    }

    return score;
  }

  /**
   * Execute model (mock implementation)
   */
  private async executeModel(model: ModelConfig, request: OrchestratorRequest): Promise<any> {
    // In production, this would call actual model APIs
    await new Promise(resolve => setTimeout(resolve, model.performance.latency));
    
    // Mock response based on model type
    switch (model.type) {
      case 'llm':
        return {
          text: `Response from ${model.name} for: ${request.task}`,
          tokens: Math.floor(Math.random() * 1000)
        };
      
      case 'embedding':
        return {
          embedding: Array(768).fill(0).map(() => Math.random() - 0.5),
          model: model.id
        };
      
      case 'forecasting':
        return {
          forecast: Array(7).fill(0).map(() => Math.random() * 1000),
          confidence: 0.85 + Math.random() * 0.1
        };
      
      default:
        return { result: 'Mock result', model: model.id };
    }
  }

  /**
   * Calculate confidence for result
   */
  private calculateConfidence(model: ModelConfig, result: any): number {
    // Base confidence from model accuracy
    let confidence = model.performance.accuracy;
    
    // Adjust based on result characteristics
    if (result.confidence !== undefined) {
      confidence = (confidence + result.confidence) / 2;
    }
    
    // Adjust based on recent performance
    const metrics = this.performanceMetrics.get(model.id);
    if (metrics) {
      const recentReliability = 1 - metrics.errorRate;
      confidence = (confidence + recentReliability) / 2;
    }
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Aggregate results from multiple models
   */
  private aggregateResults(results: Record<string, any>): any {
    const values = Object.values(results);
    
    // For text, use most common or longest response
    if (values[0]?.text) {
      // Simple: return longest response
      return values.reduce((longest, current) => 
        current.text.length > longest.text.length ? current : longest
      );
    }
    
    // For numeric, use average
    if (typeof values[0] === 'number') {
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    // For arrays, element-wise average
    if (Array.isArray(values[0])) {
      const length = values[0].length;
      const aggregated = new Array(length).fill(0);
      
      for (const value of values) {
        for (let i = 0; i < length; i++) {
          aggregated[i] += value[i] / values.length;
        }
      }
      
      return aggregated;
    }
    
    // Default: return first result
    return values[0];
  }

  /**
   * Calculate agreement between models
   */
  private calculateAgreement(results: Record<string, any>): number {
    const values = Object.values(results);
    if (values.length < 2) return 1;
    
    // For numeric results, use variance
    if (typeof values[0] === 'number') {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const coefficient = Math.sqrt(variance) / (mean || 1);
      return Math.max(0, 1 - coefficient);
    }
    
    // For arrays, use average correlation
    if (Array.isArray(values[0])) {
      let totalCorrelation = 0;
      let comparisons = 0;
      
      for (let i = 0; i < values.length - 1; i++) {
        for (let j = i + 1; j < values.length; j++) {
          totalCorrelation += this.correlation(values[i], values[j]);
          comparisons++;
        }
      }
      
      return comparisons > 0 ? totalCorrelation / comparisons : 0;
    }
    
    // For text, simple similarity check
    if (values[0]?.text) {
      // Simplified: check if all contain similar keywords
      return 0.7; // Mock value
    }
    
    return 0.5; // Default moderate agreement
  }

  /**
   * Calculate correlation between two arrays
   */
  private correlation(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    const n = a.length;
    const meanA = a.reduce((sum, val) => sum + val, 0) / n;
    const meanB = b.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denomA = 0;
    let denomB = 0;
    
    for (let i = 0; i < n; i++) {
      const diffA = a[i] - meanA;
      const diffB = b[i] - meanB;
      numerator += diffA * diffB;
      denomA += diffA * diffA;
      denomB += diffB * diffB;
    }
    
    const denom = Math.sqrt(denomA * denomB);
    return denom === 0 ? 0 : numerator / denom;
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(
    modelUsed: string | string[],
    success: boolean,
    latency: number
  ): void {
    const modelIds = Array.isArray(modelUsed) ? modelUsed : [modelUsed];
    
    for (const modelId of modelIds) {
      const metrics = this.performanceMetrics.get(modelId);
      const model = this.models.get(modelId);
      
      if (!metrics || !model) continue;
      
      metrics.totalRequests++;
      if (success) {
        metrics.successfulRequests++;
      } else {
        metrics.failedRequests++;
      }
      
      // Update average latency
      metrics.averageLatency = (
        metrics.averageLatency * (metrics.totalRequests - 1) + latency
      ) / metrics.totalRequests;
      
      // Update error rate
      metrics.errorRate = metrics.failedRequests / metrics.totalRequests;
      
      // Add to cost
      metrics.totalCost += model.performance.cost;
      
      // Update last used
      metrics.lastUsed = new Date();
      
      // Update scores (keep last 100)
      metrics.scores.latency.push(latency);
      if (metrics.scores.latency.length > 100) {
        metrics.scores.latency.shift();
      }
      
      if (success) {
        metrics.scores.reliability.push(1);
      } else {
        metrics.scores.reliability.push(0);
      }
      if (metrics.scores.reliability.length > 100) {
        metrics.scores.reliability.shift();
      }
    }
  }

  /**
   * Add to routing history
   */
  private addToHistory(
    task: string,
    modelUsed: string | string[],
    success: boolean,
    latency: number
  ): void {
    const modelId = Array.isArray(modelUsed) ? modelUsed.join(',') : modelUsed;
    
    this.routingHistory.push({
      timestamp: new Date(),
      task,
      modelUsed: modelId,
      success,
      latency
    });
    
    // Keep last 1000 entries
    if (this.routingHistory.length > 1000) {
      this.routingHistory.shift();
    }
  }

  /**
   * Learn from execution results
   */
  private async learnFromExecution(
    request: OrchestratorRequest,
    response: OrchestratorResponse
  ): Promise<void> {
    // Store successful patterns in vector store for future reference
    if (response.confidence > 0.8) {
      const document: VectorDocument = {
        id: `routing_${Date.now()}`,
        content: `Task: ${request.task}. Model: ${response.modelUsed}. Success with confidence ${response.confidence}`,
        metadata: {
          type: 'memory',
          timestamp: new Date(),
          tags: ['routing', 'success'],
          importance: response.confidence
        }
      };
      
      await this.vectorStore.addDocument(document);
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    models: Array<{
      id: string;
      name: string;
      metrics: ModelPerformanceMetrics;
    }>;
    overallStats: {
      totalRequests: number;
      successRate: number;
      averageLatency: number;
      totalCost: number;
    };
    recommendations: string[];
  } {
    const modelReports = Array.from(this.models.entries()).map(([id, config]) => ({
      id,
      name: config.name,
      metrics: this.performanceMetrics.get(id)!
    }));

    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalLatency = 0;
    let totalCost = 0;

    for (const metrics of this.performanceMetrics.values()) {
      totalRequests += metrics.totalRequests;
      totalSuccessful += metrics.successfulRequests;
      totalLatency += metrics.averageLatency * metrics.totalRequests;
      totalCost += metrics.totalCost;
    }

    const recommendations: string[] = [];
    
    // Generate recommendations based on metrics
    for (const [id, metrics] of this.performanceMetrics.entries()) {
      if (metrics.errorRate > 0.1) {
        recommendations.push(`Consider replacing or fixing model ${id} due to high error rate`);
      }
      if (metrics.averageLatency > 5000) {
        recommendations.push(`Model ${id} has high latency, consider caching or optimization`);
      }
    }

    return {
      models: modelReports,
      overallStats: {
        totalRequests,
        successRate: totalRequests > 0 ? totalSuccessful / totalRequests : 0,
        averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
        totalCost
      },
      recommendations
    };
  }

  /**
   * Get model by ID
   */
  getModel(id: string): ModelConfig | undefined {
    return this.models.get(id);
  }

  /**
   * Get all models
   */
  getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Update model configuration
   */
  updateModel(id: string, updates: Partial<ModelConfig>): void {
    const model = this.models.get(id);
    if (model) {
      this.models.set(id, { ...model, ...updates, id });
      this.emit('modelUpdated', { id, updates });
    }
  }
}

// Export singleton instance
export const createModelOrchestrator = (
  protocol: MCPProtocol,
  vectorStore: VectorStore,
  knowledgeBase: KnowledgeBase
) => new ModelOrchestrator(protocol, vectorStore, knowledgeBase);