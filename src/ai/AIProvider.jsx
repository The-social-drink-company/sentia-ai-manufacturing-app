import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logInfo, logWarn, logError } from '../services/observability/structuredLogger.js';

const AIContext = createContext(null);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

// AI service configurations
const AI_SERVICES = {
  DEMAND_FORECASTING: 'demand_forecasting',
  QUALITY_PREDICTION: 'quality_prediction',
  MAINTENANCE_PREDICTION: 'maintenance_prediction',
  INVENTORY_OPTIMIZATION: 'inventory_optimization',
  PRODUCTION_OPTIMIZATION: 'production_optimization',
  ANOMALY_DETECTION: 'anomaly_detection',
  COST_ANALYSIS: 'cost_analysis',
  SUPPLY_CHAIN: 'supply_chain'
};

// AI model status tracking
const AI_MODEL_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
  OFFLINE: 'offline'
};

export const AIProvider = ({ children }) => {
  const [aiServices, setAIServices] = useState({});
  const [activeAnalyses, setActiveAnalyses] = useState(new Map());
  const [modelPerformance, setModelPerformance] = useState({});
  const [insights, setInsights] = useState([]);
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [apiEndpoint] = useState(
    process.env.NODE_ENV === 'production' 
      ? 'https://web-production-99691282.up.railway.app/mcp'
      : 'http://localhost:3001/mcp'
  );

  // Initialize AI services
  useEffect(() => {
    initializeAIServices();
  }, []);

  const initializeAIServices = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/status`);
      const data = await response.json();
      
      if (data.status === 'healthy') {
        const serviceStates = {};
        Object.values(AI_SERVICES).forEach(service => {
          serviceStates[service] = {
            status: AI_MODEL_STATUS.IDLE,
            lastRun: null,
            accuracy: null,
            isAvailable: true
          };
        });
        
        setAIServices(serviceStates);
        setIsAIEnabled(true);
        logInfo('AI services initialized successfully', { services: Object.keys(serviceStates) });
      } else {
        throw new Error('AI service unavailable');
      }
    } catch (error) {
      logWarn('AI services initialization failed, running in fallback mode', { error: error.message });
      setIsAIEnabled(false);
      
      // Initialize with offline states
      const serviceStates = {};
      Object.values(AI_SERVICES).forEach(service => {
        serviceStates[service] = {
          status: AI_MODEL_STATUS.OFFLINE,
          lastRun: null,
          accuracy: null,
          isAvailable: false
        };
      });
      setAIServices(serviceStates);
    }
  };

  // Execute AI analysis
  const runAIAnalysis = useCallback(async (serviceType, inputData, options = {}) => {
    const analysisId = `${serviceType}_${Date.now()}`;
    
    try {
      // Update service status to processing
      setAIServices(prev => ({
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          status: AI_MODEL_STATUS.PROCESSING
        }
      }));

      // Track active analysis
      setActiveAnalyses(prev => new Map(prev).set(analysisId, {
        serviceType,
        startTime: Date.now(),
        status: 'running'
      }));

      logInfo('Starting AI analysis', { serviceType, analysisId, inputData: Object.keys(inputData) });

      // Call AI service endpoint
      const response = await fetch(`${apiEndpoint}/ai-manufacturing-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: serviceType,
          data: inputData,
          options: {
            analysisId,
            ...options
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const result = await response.json();
      
      // Update service status to completed
      setAIServices(prev => ({
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          status: AI_MODEL_STATUS.COMPLETED,
          lastRun: Date.now(),
          accuracy: result.metadata?.accuracy || null
        }
      }));

      // Remove from active analyses
      setActiveAnalyses(prev => {
        const updated = new Map(prev);
        updated.delete(analysisId);
        return updated;
      });

      // Add insights if provided
      if (result.insights && result.insights.length > 0) {
        setInsights(prev => [...result.insights, ...prev].slice(0, 50)); // Keep last 50 insights
      }

      logInfo('AI analysis completed successfully', { 
        serviceType, 
        analysisId, 
        processingTime: Date.now() - activeAnalyses.get(analysisId)?.startTime 
      });

      return {
        success: true,
        data: result.data,
        insights: result.insights || [],
        metadata: result.metadata || {},
        analysisId
      };

    } catch (error) {
      logError('AI analysis failed', { serviceType, analysisId, error: error.message });

      // Update service status to error
      setAIServices(prev => ({
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          status: AI_MODEL_STATUS.ERROR
        }
      }));

      // Remove from active analyses
      setActiveAnalyses(prev => {
        const updated = new Map(prev);
        updated.delete(analysisId);
        return updated;
      });

      return {
        success: false,
        error: error.message,
        analysisId
      };
    }
  }, [apiEndpoint, activeAnalyses]);

  // Demand forecasting with AI
  const forecastDemand = useCallback(async (historicalData, timeHorizon = 30) => {
    return runAIAnalysis(AI_SERVICES.DEMAND_FORECASTING, {
      historical_data: historicalData,
      forecast_horizon: timeHorizon,
      include_confidence_intervals: true,
      seasonal_adjustment: true
    });
  }, [runAIAnalysis]);

  // Quality prediction
  const predictQuality = useCallback(async (productionData, qualityMetrics) => {
    return runAIAnalysis(AI_SERVICES.QUALITY_PREDICTION, {
      production_parameters: productionData,
      historical_quality: qualityMetrics,
      include_recommendations: true
    });
  }, [runAIAnalysis]);

  // Maintenance prediction
  const predictMaintenance = useCallback(async (equipmentData, maintenanceHistory) => {
    return runAIAnalysis(AI_SERVICES.MAINTENANCE_PREDICTION, {
      equipment_metrics: equipmentData,
      maintenance_history: maintenanceHistory,
      prediction_window: 7, // days
      include_priority_ranking: true
    });
  }, [runAIAnalysis]);

  // Inventory optimization
  const optimizeInventory = useCallback(async (inventoryData, demandForecast, constraints = {}) => {
    return runAIAnalysis(AI_SERVICES.INVENTORY_OPTIMIZATION, {
      current_inventory: inventoryData,
      demand_forecast: demandForecast,
      constraints: {
        budget_limit: constraints.budgetLimit,
        storage_capacity: constraints.storageCapacity,
        lead_times: constraints.leadTimes,
        ...constraints
      }
    });
  }, [runAIAnalysis]);

  // Production optimization
  const optimizeProduction = useCallback(async (productionData, constraints, objectives) => {
    return runAIAnalysis(AI_SERVICES.PRODUCTION_OPTIMIZATION, {
      production_capacity: productionData,
      constraints: constraints,
      objectives: objectives,
      optimization_horizon: 24, // hours
      include_scenario_analysis: true
    });
  }, [runAIAnalysis]);

  // Anomaly detection
  const detectAnomalies = useCallback(async (timeSeriesData, sensitivity = 'medium') => {
    return runAIAnalysis(AI_SERVICES.ANOMALY_DETECTION, {
      time_series: timeSeriesData,
      sensitivity_level: sensitivity,
      detection_window: 168, // hours (1 week)
      include_root_cause_analysis: true
    });
  }, [runAIAnalysis]);

  // Cost analysis and optimization
  const analyzeCosts = useCallback(async (costData, productionMetrics) => {
    return runAIAnalysis(AI_SERVICES.COST_ANALYSIS, {
      cost_breakdown: costData,
      production_metrics: productionMetrics,
      include_optimization_recommendations: true,
      analysis_period: 30 // days
    });
  }, [runAIAnalysis]);

  // Supply chain optimization
  const optimizeSupplyChain = useCallback(async (supplierData, logisticsData, demandForecast) => {
    return runAIAnalysis(AI_SERVICES.SUPPLY_CHAIN, {
      supplier_performance: supplierData,
      logistics_data: logisticsData,
      demand_forecast: demandForecast,
      include_risk_assessment: true
    });
  }, [runAIAnalysis]);

  // Get AI recommendations based on current context
  const getContextualRecommendations = useCallback(async (context) => {
    const recommendations = [];
    
    // Analyze context and suggest AI analyses
    if (context.hasProductionData && !aiServices[AI_SERVICES.PRODUCTION_OPTIMIZATION]?.lastRun) {
      recommendations.push({
        type: 'analysis',
        service: AI_SERVICES.PRODUCTION_OPTIMIZATION,
        title: 'Optimize Production Schedule',
        description: 'AI can analyze your production data to optimize scheduling and resource allocation',
        priority: 'high',
        estimatedTime: '2-3 minutes'
      });
    }

    if (context.hasQualityIssues) {
      recommendations.push({
        type: 'analysis',
        service: AI_SERVICES.QUALITY_PREDICTION,
        title: 'Quality Issue Prediction',
        description: 'Predict potential quality issues before they impact production',
        priority: 'high',
        estimatedTime: '1-2 minutes'
      });
    }

    if (context.hasInventoryData && context.hasDemandData) {
      recommendations.push({
        type: 'analysis',
        service: AI_SERVICES.INVENTORY_OPTIMIZATION,
        title: 'Inventory Optimization',
        description: 'Optimize inventory levels based on AI-powered demand forecasting',
        priority: 'medium',
        estimatedTime: '3-5 minutes'
      });
    }

    return recommendations;
  }, [aiServices]);

  // Update model performance metrics
  const updateModelPerformance = useCallback((serviceType, metrics) => {
    setModelPerformance(prev => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        ...metrics,
        lastUpdated: Date.now()
      }
    }));
  }, []);

  // Clear old insights
  const clearInsights = useCallback(() => {
    setInsights([]);
  }, []);

  // Get service health status
  const getServiceHealth = useCallback(() => {
    const totalServices = Object.keys(aiServices).length;
    const availableServices = Object.values(aiServices).filter(service => service.isAvailable).length;
    const processingServices = Object.values(aiServices).filter(service => 
      service.status === AI_MODEL_STATUS.PROCESSING
    ).length;
    
    return {
      overall: isAIEnabled ? 'healthy' : 'degraded',
      availability: totalServices > 0 ? (availableServices / totalServices) : 0,
      activeAnalyses: activeAnalyses.size,
      processingServices,
      totalInsights: insights.length
    };
  }, [aiServices, isAIEnabled, activeAnalyses.size, insights.length]);

  const contextValue = {
    // Service state
    aiServices,
    activeAnalyses: Array.from(activeAnalyses.entries()),
    modelPerformance,
    insights,
    isAIEnabled,
    
    // Core AI functions
    runAIAnalysis,
    forecastDemand,
    predictQuality,
    predictMaintenance,
    optimizeInventory,
    optimizeProduction,
    detectAnomalies,
    analyzeCosts,
    optimizeSupplyChain,
    
    // Utility functions
    getContextualRecommendations,
    updateModelPerformance,
    clearInsights,
    getServiceHealth,
    
    // Constants
    AI_SERVICES,
    AI_MODEL_STATUS
  };

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

export default AIProvider;