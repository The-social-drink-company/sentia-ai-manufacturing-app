import axios from 'axios';

class MCPIntegratedAIService {
  constructor() {
    this.mcpServerUrl = process.env.MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';
    this.apiKey = process.env.MCP_API_KEY;
    
    // Initialize connection to MCP server
    this.initializeMCPConnection();
    
    // Cache for AI responses
    this.responseCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  async initializeMCPConnection() {
    try {
      const response = await axios.get(`${this.mcpServerUrl}/health`);
      console.log('MCP Server connected:', response.data);
      this.mcpConnected = true;
    } catch (error) {
      console.warn('MCP Server connection failed:', error.message);
      this.mcpConnected = false;
    }
  }

  /**
   * Enhanced working capital analysis using MCP server AI capabilities
   */
  async analyzeWorkingCapitalWithMCP(data) {
    const cacheKey = `wc-analysis-${JSON.stringify(data).slice(0, 100)}`;
    const cached = this.getCachedResponse(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.post(`${this.mcpServerUrl}/ai/working-capital-analysis`, {
        data,
        analysisType: 'comprehensive',
        includeForecasting: true,
        includeBenchmarking: true,
        includeOptimization: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const analysis = response.data;
      this.cacheResponse(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error('MCP working capital analysis error:', error);
      return this.getFallbackAnalysis(data);
    }
  }

  /**
   * Industry benchmarking using MCP server's multi-AI integration
   */
  async getIndustryBenchmarksViaMCP(params) {
    const { industry, revenue, employees, region, dataSource } = params;
    
    const cacheKey = `benchmarks-${industry}-${revenue}-${employees}-${region}`;
    const cached = this.getCachedResponse(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.post(`${this.mcpServerUrl}/ai/industry-benchmarks`, {
        industry,
        revenue,
        employees,
        region,
        dataSource: dataSource || 'comprehensive', // Use multiple AI models
        includeCompetitiveAnalysis: true,
        includeOptimizationRecommendations: true,
        outputFormat: 'executive_summary'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const benchmarks = response.data;
      this.cacheResponse(cacheKey, benchmarks);
      
      return benchmarks;
    } catch (error) {
      console.error('MCP benchmarking error:', error);
      return this.getFallbackBenchmarks(params);
    }
  }

  /**
   * Cash flow forecasting with advanced AI models via MCP
   */
  async generateCashFlowForecastMCP(params) {
    const { historicalData, timeHorizon, scenarios, includeSeasonality } = params;
    
    try {
      const response = await axios.post(`${this.mcpServerUrl}/ai/cash-flow-forecast`, {
        historicalData,
        timeHorizon,
        scenarios,
        includeSeasonality,
        modelType: 'ensemble', // Use multiple AI models for accuracy
        confidenceIntervals: true,
        riskAssessment: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('MCP cash flow forecast error:', error);
      return this.getFallbackForecast(params);
    }
  }

  /**
   * Executive insights generation using MCP's natural language AI
   */
  async generateExecutiveInsightsMCP(data) {
    try {
      const response = await axios.post(`${this.mcpServerUrl}/ai/executive-insights`, {
        financialData: data.financialMetrics,
        workingCapitalData: data.workingCapital,
        benchmarkData: data.benchmarks,
        insightType: 'board_ready',
        audience: 'c_suite',
        includeActionItems: true,
        includeRiskAssessment: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('MCP executive insights error:', error);
      return this.getFallbackInsights(data);
    }
  }

  /**
   * Scenario planning and modeling via MCP
   */
  async runScenarioAnalysisMCP(scenarios) {
    try {
      const response = await axios.post(`${this.mcpServerUrl}/ai/scenario-analysis`, {
        scenarios,
        analysisDepth: 'comprehensive',
        includeRiskModeling: true,
        includeSensitivityAnalysis: true,
        outputFormat: 'executive_dashboard'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('MCP scenario analysis error:', error);
      return this.getFallbackScenarioAnalysis(scenarios);
    }
  }

  /**
   * Real-time data processing and analysis via MCP
   */
  async processRealTimeDataMCP(dataStream) {
    try {
      const response = await axios.post(`${this.mcpServerUrl}/ai/real-time-analysis`, {
        dataStream,
        analysisType: 'working_capital_monitoring',
        alertThresholds: {
          cashRunway: 30, // days
          dsoIncrease: 10, // %
          workingCapitalDecrease: 15 // %
        },
        generateAlerts: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('MCP real-time analysis error:', error);
      return null;
    }
  }

  /**
   * Multi-API data integration via MCP server
   */
  async integrateMultiAPIDataMCP(apiSources) {
    try {
      const response = await axios.post(`${this.mcpServerUrl}/integration/multi-api-sync`, {
        sources: apiSources,
        syncType: 'comprehensive',
        dataValidation: true,
        conflictResolution: 'ai_mediated',
        outputFormat: 'normalized'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('MCP multi-API integration error:', error);
      return null;
    }
  }

  /**
   * Advanced pattern recognition for financial data
   */
  async detectFinancialPatternsMCP(data) {
    try {
      const response = await axios.post(`${this.mcpServerUrl}/ai/pattern-recognition`, {
        data,
        patternTypes: [
          'seasonal_trends',
          'anomaly_detection',
          'correlation_analysis',
          'predictive_indicators'
        ],
        confidenceThreshold: 0.8,
        includeVisualization: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('MCP pattern recognition error:', error);
      return null;
    }
  }

  /**
   * Generate board-ready presentations via MCP
   */
  async generateBoardPresentationMCP(data) {
    try {
      const response = await axios.post(`${this.mcpServerUrl}/ai/board-presentation`, {
        data,
        presentationType: 'working_capital_intelligence',
        audience: 'board_of_directors',
        includeExecutiveSummary: true,
        includeActionItems: true,
        includeFinancialProjections: true,
        format: 'structured_content'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('MCP board presentation error:', error);
      return this.getFallbackPresentation(data);
    }
  }

  /**
   * Risk assessment and mitigation strategies via MCP
   */
  async assessFinancialRisksMCP(data) {
    try {
      const response = await axios.post(`${this.mcpServerUrl}/ai/risk-assessment`, {
        financialData: data,
        riskTypes: [
          'liquidity_risk',
          'operational_risk',
          'market_risk',
          'credit_risk'
        ],
        assessmentDepth: 'comprehensive',
        includeMitigationStrategies: true,
        timeHorizon: '12_months'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('MCP risk assessment error:', error);
      return this.getFallbackRiskAssessment(data);
    }
  }

  /**
   * Cache management
   */
  getCachedResponse(key) {
    const cached = this.responseCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  cacheResponse(key, data) {
    this.responseCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Fallback methods when MCP server is unavailable
   */
  getFallbackAnalysis(data) {
    return {
      summary: 'Basic analysis - MCP server unavailable',
      recommendations: ['Connect to MCP server for enhanced analysis'],
      confidence: 'low',
      source: 'fallback'
    };
  }

  getFallbackBenchmarks(params) {
    return {
      workingCapital: {
        dso: { average: 35, bestInClass: 25 },
        dpo: { average: 35, bestInClass: 45 },
        inventoryTurns: { average: 8, bestInClass: 12 }
      },
      source: 'fallback',
      confidence: 'low'
    };
  }

  getFallbackForecast(params) {
    return {
      forecast: [],
      confidence: 'low',
      source: 'fallback',
      message: 'Connect to MCP server for advanced forecasting'
    };
  }

  getFallbackInsights(data) {
    return {
      insights: ['MCP server required for AI-powered insights'],
      recommendations: ['Ensure MCP server connection'],
      confidence: 'low'
    };
  }

  getFallbackScenarioAnalysis(scenarios) {
    return {
      results: [],
      message: 'MCP server required for scenario analysis',
      confidence: 'low'
    };
  }

  getFallbackPresentation(data) {
    return {
      slides: [],
      message: 'MCP server required for presentation generation',
      confidence: 'low'
    };
  }

  getFallbackRiskAssessment(data) {
    return {
      risks: [],
      message: 'MCP server required for comprehensive risk assessment',
      confidence: 'low'
    };
  }

  /**
   * Health check for MCP server connection
   */
  async checkMCPHealth() {
    try {
      const response = await axios.get(`${this.mcpServerUrl}/health`);
      this.mcpConnected = response.status === 200;
      return {
        connected: this.mcpConnected,
        status: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.mcpConnected = false;
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get available AI models from MCP server
   */
  async getAvailableAIModels() {
    try {
      const response = await axios.get(`${this.mcpServerUrl}/ai/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching AI models:', error);
      return [];
    }
  }

  /**
   * Stream real-time insights from MCP server
   */
  async streamRealTimeInsights(callback) {
    try {
      // This would typically use WebSocket or Server-Sent Events
      const response = await axios.get(`${this.mcpServerUrl}/ai/stream/insights`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        responseType: 'stream'
      });

      response.data.on('data', (chunk) => {
        try {
          const insight = JSON.parse(chunk.toString());
          callback(insight);
        } catch (error) {
          console.error('Error parsing streamed insight:', error);
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error streaming insights:', error);
      return null;
    }
  }
}

export default MCPIntegratedAIService;
