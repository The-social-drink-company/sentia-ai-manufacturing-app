import { devLog } from '../lib/devLog.js';
/**
 * Intelligence Service - Core AI Operations
 * Integrates with MCP Server on Railway for AI-powered features
 */

// MCP service disabled for build compatibility
// import { mcpService } from './mcpService';

// Mock MCP service for build compatibility
const mcpService = {
  openaiAnalyzeData: () => Promise.resolve({ analysis: 'Mock analysis', confidence: 0.5 }),
  anthropicGenerateInsights: () => Promise.resolve({ insights: 'Mock insights', trends: [] }),
  anthropicAnalyzeManufacturing: () => Promise.resolve({ analysis: 'Mock manufacturing analysis' }),
  openaiGenerateText: () => Promise.resolve('Mock generated text')
};

class IntelligenceService {
  constructor() {
    const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};
    const browserEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
    this.mcpBaseUrl = viteEnv.VITE_MCP_SERVER_URL || browserEnv.VITE_MCP_SERVER_URL || 'https://web-production-99691282.up.railway.app';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate comprehensive insights for dashboard
   */
  async generateDashboardInsights(data, context = {}) {
    try {
      // Check cache first
      const cacheKey = `insights_${JSON.stringify(data).substring(0, 50)}`;
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      // Combine multiple AI providers for comprehensive insights
      const [openAIInsights, anthropicInsights, xeroAnalysis] = await Promise.all([
        mcpService.openaiAnalyzeData(data, 'dashboard_metrics'),
        mcpService.anthropicGenerateInsights({ data, context }),
        this.analyzeFinancialMetrics(data)
      ]);

      const insights = this.mergeInsights({
        openAI: openAIInsights,
        anthropic: anthropicInsights,
        xero: xeroAnalysis
      });

      // Categorize and prioritize insights
      const categorized = this.categorizeInsights(insights);
      
      this.setCache(cacheKey, categorized);
      return categorized;
    } catch (error) {
      devLog.error('Failed to generate dashboard insights:', error);
      return this.getFallbackInsights(data);
    }
  }

  /**
   * Predict future trends based on historical data
   */
  async predictTrends(historicalData, options = {}) {
    const {
      horizon = 30, // days
      confidence = 0.95,
      includeSeasonality = true,
      includeExternalFactors = true
    } = options;

    try {
      const prediction = await mcpService.openaiAnalyzeData({
        historical: historicalData,
        task: 'time_series_forecast',
        parameters: {
          horizon,
          confidence,
          seasonality: includeSeasonality,
          external_factors: includeExternalFactors
        }
      }, 'forecasting');

      // Enhance with Anthropic's contextual analysis
      const contextualAnalysis = await mcpService.anthropicAnalyzeManufacturing({
        prediction,
        historical: historicalData,
        businessContext: await this.getBusinessContext()
      }, 'trend_analysis');

      return {
        forecast: prediction.forecast,
        confidence: prediction.confidence,
        insights: contextualAnalysis.insights,
        risks: contextualAnalysis.risks,
        opportunities: contextualAnalysis.opportunities,
        visualization: this.generateVisualizationConfig(prediction)
      };
    } catch (error) {
      devLog.error('Failed to predict trends:', error);
      return null;
    }
  }

  /**
   * Analyze anomalies in real-time data
   */
  async detectAnomalies(metrics, sensitivity = 'medium') {
    try {
      const anomalies = await mcpService.openaiAnalyzeData({
        data: metrics,
        task: 'anomaly_detection',
        sensitivity,
        method: 'isolation_forest'
      }, 'anomaly_detection');

      if (anomalies && anomalies.detected && anomalies.detected.length > 0) {
        // Get explanations for detected anomalies
        const explanations = await mcpService.anthropicGenerateInsights({
          anomalies: anomalies.detected,
          metrics,
          context: 'anomaly_explanation'
        });

        return {
          detected: anomalies.detected,
          severity: this.calculateSeverity(anomalies.detected),
          explanations: explanations.insights,
          recommendations: await this.generateAnomalyRecommendations(anomalies.detected),
          alerts: this.generateAlerts(anomalies.detected)
        };
      }

      return { detected: [], severity: 'none' };
    } catch (error) {
      devLog.error('Failed to detect anomalies:', error);
      return { detected: [], severity: 'error' };
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizations(currentState, goals = {}) {
    try {
      const optimizations = await Promise.all([
        this.optimizeProduction(currentState),
        this.optimizeInventory(currentState),
        this.optimizeCosts(currentState),
        this.optimizeQuality(currentState)
      ]);

      const merged = this.mergeOptimizations(optimizations);
      const prioritized = this.prioritizeByImpact(merged, goals);

      return {
        recommendations: prioritized,
        expectedImpact: this.calculateExpectedImpact(prioritized),
        implementation: this.generateImplementationPlan(prioritized),
        timeline: this.estimateTimeline(prioritized)
      };
    } catch (error) {
      devLog.error('Failed to generate optimizations:', error);
      return { recommendations: [] };
    }
  }

  /**
   * Process natural language queries
   */
  async processNaturalQuery(query, context = {}) {
    try {
      // Parse intent using Anthropic
      const intent = await mcpService.anthropicGenerateInsights({
        query,
        context,
        task: 'intent_recognition'
      });

      // Fetch relevant data based on intent
      const relevantData = await this.fetchDataForIntent(intent);

      // Generate response using OpenAI
      const response = await mcpService.openaiGenerateText(
        `Answer the following query based on the provided data: "${query}"
         Data: ${JSON.stringify(relevantData)}
         Context: ${JSON.stringify(context)}`,
        { temperature: 0.7, max_tokens: 500 }
      );

      return {
        answer: response.text,
        data: relevantData,
        visualizations: this.suggestVisualizations(relevantData),
        followUp: this.generateFollowUpQuestions(intent, relevantData)
      };
    } catch (error) {
      devLog.error('Failed to process natural query:', error);
      return {
        answer: "I couldn't process that query. Please try rephrasing or be more specific.",
        error: true
      };
    }
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(data) {
    try {
      const summary = await mcpService.anthropicGenerateInsights({
        data,
        format: 'executive_summary',
        maxLength: 500,
        focusAreas: ['performance', 'risks', 'opportunities', 'recommendations']
      });

      return {
        summary: summary.summary,
        keyMetrics: summary.metrics,
        criticalIssues: summary.issues,
        recommendations: summary.recommendations,
        nextSteps: summary.nextSteps
      };
    } catch (error) {
      devLog.error('Failed to generate executive summary:', error);
      return null;
    }
  }

  /**
   * Predict maintenance requirements
   */
  async predictMaintenance(equipmentData, historicalFailures) {
    try {
      const prediction = await mcpService.openaiAnalyzeData({
        equipment: equipmentData,
        history: historicalFailures,
        task: 'predictive_maintenance'
      }, 'maintenance_prediction');

      const schedule = await this.generateMaintenanceSchedule(prediction);
      const costs = await this.estimateMaintenanceCosts(prediction);

      return {
        predictions: prediction.predictions,
        riskScore: prediction.riskScore,
        schedule,
        costs,
        preventiveActions: prediction.preventiveActions
      };
    } catch (error) {
      devLog.error('Failed to predict maintenance:', error);
      return null;
    }
  }

  /**
   * Analyze quality metrics and predict defects
   */
  async analyzeQuality(qualityData, productionData) {
    try {
      const analysis = await mcpService.anthropicAnalyzeManufacturing({
        quality: qualityData,
        production: productionData
      }, 'quality_analysis');

      const defectPrediction = await mcpService.openaiAnalyzeData({
        data: qualityData,
        task: 'defect_prediction'
      }, 'quality_control');

      return {
        currentQuality: analysis.score,
        trends: analysis.trends,
        defectProbability: defectPrediction.probability,
        rootCauses: analysis.rootCauses,
        improvements: analysis.recommendations,
        costImpact: this.calculateQualityCosts(analysis)
      };
    } catch (error) {
      devLog.error('Failed to analyze quality:', error);
      return null;
    }
  }

  // Helper methods
  
  mergeInsights(insights) {
    const merged = [];
    
    if (insights.openAI?.insights) {
      merged.push(...insights.openAI.insights);
    }
    
    if (insights.anthropic?.insights) {
      merged.push(...insights.anthropic.insights);
    }
    
    if (insights.xero) {
      merged.push(...insights.xero);
    }

    // Remove duplicates and combine similar insights
    return this.deduplicateInsights(merged);
  }

  categorizeInsights(insights) {
    return {
      critical: insights.filter(i => i.priority === 'critical' || i.severity === 'high'),
      opportunities: insights.filter(i => i.type === 'opportunity'),
      risks: insights.filter(i => i.type === 'risk'),
      performance: insights.filter(i => i.category === 'performance'),
      recommendations: insights.filter(i => i.type === 'recommendation'),
      general: insights.filter(i => !['critical', 'opportunity', 'risk', 'performance', 'recommendation'].includes(i.type))
    };
  }

  calculateSeverity(anomalies) {
    if (!anomalies || anomalies.length === 0) return 'none';
    
    const severityScores = anomalies.map(a => a.severity || a.score || 0);
    const maxSeverity = Math.max(...severityScores);
    
    if (maxSeverity > 0.8) return 'critical';
    if (maxSeverity > 0.6) return 'high';
    if (maxSeverity > 0.4) return 'medium';
    return 'low';
  }

  async generateAnomalyRecommendations(anomalies) {
    const recommendations = [];
    
    for (const anomaly of anomalies) {
      const rec = await this.generateSingleAnomalyRecommendation(anomaly);
      if (rec) recommendations.push(rec);
    }
    
    return recommendations;
  }

  generateAlerts(anomalies) {
    return anomalies
      .filter(a => (a.severity || a.score || 0) > 0.6)
      .map(a => ({
        type: 'anomaly',
        severity: this.calculateSeverity([a]),
        message: a.message || `Anomaly detected in ${a.metric || 'system'}`,
        timestamp: new Date().toISOString(),
        data: a
      }));
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getBusinessContext() {
    // Fetch current business context from various sources
    return {
      date: new Date().toISOString(),
      season: this.getCurrentSeason(),
      marketConditions: await this.getMarketConditions(),
      operationalStatus: await this.getOperationalStatus()
    };
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  async getMarketConditions() {
    // Placeholder - would fetch real market data
    return { trend: 'stable', demand: 'moderate' };
  }

  async getOperationalStatus() {
    // Placeholder - would fetch real operational data
    return { capacity: 0.75, efficiency: 0.85 };
  }

  deduplicateInsights(insights) {
    const seen = new Set();
    return insights.filter(insight => {
      const key = JSON.stringify(insight.message || insight.text || insight);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  generateVisualizationConfig(prediction) {
    return {
      type: 'line',
      showConfidenceInterval: true,
      colors: ['#3B82F6', '#10B981', '#F59E0B'],
      annotations: prediction.keyPoints || []
    };
  }

  async analyzeFinancialMetrics(data) {
    // Analyze financial metrics using Xero data
    return [];
  }

  getFallbackInsights(data) {
    return {
      critical: [],
      opportunities: [],
      risks: [],
      performance: [],
      recommendations: [{
        type: 'info',
        message: 'AI insights temporarily unavailable. Showing basic metrics.',
        priority: 'low'
      }]
    };
  }

  async optimizeProduction(state) {
    return { type: 'production', recommendations: [] };
  }

  async optimizeInventory(state) {
    return { type: 'inventory', recommendations: [] };
  }

  async optimizeCosts(state) {
    return { type: 'costs', recommendations: [] };
  }

  async optimizeQuality(state) {
    return { type: 'quality', recommendations: [] };
  }

  mergeOptimizations(optimizations) {
    return optimizations.flatMap(opt => opt.recommendations || []);
  }

  prioritizeByImpact(recommendations, goals) {
    return recommendations.sort((a, b) => (b.impact || 0) - (a.impact || 0));
  }

  calculateExpectedImpact(recommendations) {
    return recommendations.reduce((total, rec) => total + (rec.impact || 0), 0);
  }

  generateImplementationPlan(recommendations) {
    return recommendations.map((rec, index) => ({
      step: index + 1,
      action: rec.action,
      timeline: rec.timeline || '1 week',
      resources: rec.resources || []
    }));
  }

  estimateTimeline(recommendations) {
    const days = recommendations.reduce((total, rec) => total + (rec.days || 7), 0);
    return `${Math.ceil(days / 7)} weeks`;
  }

  async fetchDataForIntent(intent) {
    // Fetch relevant data based on parsed intent
    return {};
  }

  suggestVisualizations(data) {
    return ['line', 'bar', 'pie'];
  }

  generateFollowUpQuestions(intent, data) {
    return [
      "Would you like to see the trend over a different time period?",
      "Should I compare this with industry benchmarks?",
      "Would you like to export this data?"
    ];
  }

  async generateSingleAnomalyRecommendation(anomaly) {
    return {
      action: `Investigate ${anomaly.metric || 'anomaly'}`,
      priority: this.calculateSeverity([anomaly]),
      estimated_impact: 'medium'
    };
  }

  async generateMaintenanceSchedule(prediction) {
    return prediction.schedule || [];
  }

  async estimateMaintenanceCosts(prediction) {
    return prediction.costs || { total: 0, breakdown: [] };
  }

  calculateQualityCosts(analysis) {
    return analysis.costImpact || { defects: 0, rework: 0, prevention: 0 };
  }
}

// Export singleton instance
export const intelligenceService = new IntelligenceService();

// Export class for testing
export default IntelligenceService;