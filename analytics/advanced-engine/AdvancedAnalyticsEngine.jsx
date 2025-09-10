/**
 * Advanced Analytics Engine
 * Machine learning-powered analytics with predictive modeling and real-time insights
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  BoltIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  CogIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Analytics Model Configuration
const ANALYTICS_MODELS = {
  demand_forecasting: {
    name: 'Demand Forecasting',
    type: 'time_series',
    algorithm: 'ARIMA',
    accuracy: 0.94,
    status: 'trained',
    lastTrained: '2025-01-08T10:30:00Z',
    features: ['historical_sales', 'seasonality', 'economic_indicators', 'marketing_campaigns'],
    horizon: '12_weeks'
  },
  quality_prediction: {
    name: 'Quality Prediction',
    type: 'classification',
    algorithm: 'Random Forest',
    accuracy: 0.97,
    status: 'trained',
    lastTrained: '2025-01-07T14:20:00Z',
    features: ['machine_params', 'material_properties', 'environmental_conditions', 'operator_skill'],
    horizon: 'real_time'
  },
  maintenance_optimization: {
    name: 'Predictive Maintenance',
    type: 'regression',
    algorithm: 'XGBoost',
    accuracy: 0.91,
    status: 'training',
    lastTrained: '2025-01-06T08:45:00Z',
    features: ['vibration', 'temperature', 'pressure', 'usage_hours', 'maintenance_history'],
    horizon: '30_days'
  },
  cost_optimization: {
    name: 'Cost Optimization',
    type: 'optimization',
    algorithm: 'Genetic Algorithm',
    accuracy: 0.88,
    status: 'trained',
    lastTrained: '2025-01-05T16:15:00Z',
    features: ['material_costs', 'labor_rates', 'energy_prices', 'inventory_levels'],
    horizon: 'quarterly'
  },
  anomaly_detection: {
    name: 'Anomaly Detection',
    type: 'unsupervised',
    algorithm: 'Isolation Forest',
    accuracy: 0.92,
    status: 'active',
    lastTrained: '2025-01-09T12:00:00Z',
    features: ['sensor_data', 'process_parameters', 'quality_metrics', 'operational_kpis'],
    horizon: 'real_time'
  },
  inventory_optimization: {
    name: 'Inventory Optimization',
    type: 'reinforcement_learning',
    algorithm: 'Q-Learning',
    accuracy: 0.89,
    status: 'trained',
    lastTrained: '2025-01-04T11:30:00Z',
    features: ['demand_patterns', 'lead_times', 'carrying_costs', 'stockout_costs'],
    horizon: '6_months'
  }
};

// Analytics Engine Class
class AdvancedAnalyticsEngine {
  constructor() {
    this.models = { ...ANALYTICS_MODELS };
    this.insights = [];
    this.predictions = new Map();
    this.realtimeData = {
      production: [],
      quality: [],
      efficiency: [],
      alerts: []
    };
    this.metrics = {
      totalPredictions: 0,
      accuracyScore: 0,
      modelsActive: 0,
      insightsGenerated: 0,
      dataPointsProcessed: 0
    };
    
    this.initializeEngine();
  }

  async initializeEngine() {
    await this.loadModels();
    this.startRealtimeProcessing();
    this.generateInitialInsights();
  }

  async loadModels() {
    for (const [key, model] of Object.entries(this.models)) {
      try {
        await this.validateModel(key);
        this.models[key].loaded = true;
        this.metrics.modelsActive++;
      } catch (error) {
        this.models[key].loaded = false;
        this.models[key].error = error.message;
      }
    }
  }

  async validateModel(modelKey) {
    const endpoint = `/api/analytics/models/${modelKey}/validate`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Model validation failed: ${response.statusText}`);
    }

    const validation = await response.json();
    return validation.isValid;
  }

  async runPrediction(modelKey, inputData, options = {}) {
    const model = this.models[modelKey];
    if (!model || !model.loaded) {
      throw new Error(`Model ${modelKey} not available`);
    }

    const endpoint = `/api/analytics/models/${modelKey}/predict`;
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId,
          inputData,
          options,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Prediction failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      const prediction = {
        id: predictionId,
        model: modelKey,
        input: inputData,
        output: result.prediction,
        confidence: result.confidence,
        timestamp: Date.now(),
        status: 'completed'
      };

      this.predictions.set(predictionId, prediction);
      this.metrics.totalPredictions++;
      
      // Generate insight from prediction
      this.generateInsightFromPrediction(prediction);
      
      return prediction;
    } catch (error) {
      const errorPrediction = {
        id: predictionId,
        model: modelKey,
        input: inputData,
        error: error.message,
        timestamp: Date.now(),
        status: 'failed'
      };
      
      this.predictions.set(predictionId, errorPrediction);
      throw error;
    }
  }

  generateInsightFromPrediction(prediction) {
    let insight = null;
    
    switch (prediction.model) {
      case 'demand_forecasting':
        insight = this.generateDemandInsight(prediction);
        break;
      case 'quality_prediction':
        insight = this.generateQualityInsight(prediction);
        break;
      case 'maintenance_optimization':
        insight = this.generateMaintenanceInsight(prediction);
        break;
      case 'cost_optimization':
        insight = this.generateCostInsight(prediction);
        break;
      case 'anomaly_detection':
        insight = this.generateAnomalyInsight(prediction);
        break;
      case 'inventory_optimization':
        insight = this.generateInventoryInsight(prediction);
        break;
    }
    
    if (insight) {
      this.insights.unshift(insight);
      this.insights = this.insights.slice(0, 50); // Keep last 50 insights
      this.metrics.insightsGenerated++;
    }
  }

  generateDemandInsight(prediction) {
    const forecast = prediction.output;
    const trend = this.calculateTrend(forecast.values);
    
    return {
      id: `insight_${Date.now()}`,
      type: 'demand_forecast',
      title: `Demand Forecast: ${trend > 0 ? 'Increasing' : 'Decreasing'} Trend Detected`,
      description: `Predicted ${Math.abs(trend).toFixed(1)}% ${trend > 0 ? 'increase' : 'decrease'} in demand over next ${this.models.demand_forecasting.horizon}`,
      severity: Math.abs(trend) > 20 ? 'high' : 'medium',
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      actionable: true,
      actions: [
        'Adjust production capacity',
        'Update inventory levels',
        'Inform sales team'
      ]
    };
  }

  generateQualityInsight(prediction) {
    const qualityScore = prediction.output.quality_score;
    const defectProbability = prediction.output.defect_probability;
    
    return {
      id: `insight_${Date.now()}`,
      type: 'quality_prediction',
      title: `Quality Alert: ${defectProbability > 0.3 ? 'High' : 'Low'} Defect Risk`,
      description: `Quality score: ${qualityScore.toFixed(2)}, Defect probability: ${(defectProbability * 100).toFixed(1)}%`,
      severity: defectProbability > 0.3 ? 'high' : defectProbability > 0.1 ? 'medium' : 'low',
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      actionable: defectProbability > 0.1,
      actions: [
        'Inspect machine parameters',
        'Check material quality',
        'Review operator procedures'
      ]
    };
  }

  generateMaintenanceInsight(prediction) {
    const daysUntilMaintenance = prediction.output.days_until_maintenance;
    const failureRisk = prediction.output.failure_risk;
    
    return {
      id: `insight_${Date.now()}`,
      type: 'maintenance_prediction',
      title: `Maintenance Required: ${daysUntilMaintenance} days remaining`,
      description: `Failure risk: ${(failureRisk * 100).toFixed(1)}%. Schedule maintenance within ${daysUntilMaintenance} days`,
      severity: daysUntilMaintenance < 7 ? 'high' : daysUntilMaintenance < 14 ? 'medium' : 'low',
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      actionable: true,
      actions: [
        'Schedule maintenance window',
        'Order replacement parts',
        'Notify maintenance team'
      ]
    };
  }

  generateCostInsight(prediction) {
    const costSaving = prediction.output.potential_savings;
    const recommendations = prediction.output.recommendations;
    
    return {
      id: `insight_${Date.now()}`,
      type: 'cost_optimization',
      title: `Cost Optimization: $${costSaving.toLocaleString()} potential savings`,
      description: `${recommendations.length} optimization opportunities identified`,
      severity: costSaving > 10000 ? 'high' : costSaving > 5000 ? 'medium' : 'low',
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      actionable: true,
      actions: recommendations.slice(0, 3)
    };
  }

  generateAnomalyInsight(prediction) {
    const anomalies = prediction.output.anomalies;
    const severity = prediction.output.severity;
    
    return {
      id: `insight_${Date.now()}`,
      type: 'anomaly_detection',
      title: `Anomaly Detected: ${anomalies.length} unusual patterns found`,
      description: `Severity: ${severity}. Immediate investigation recommended`,
      severity: severity.toLowerCase(),
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      actionable: true,
      actions: [
        'Investigate root cause',
        'Check system logs',
        'Contact technical team'
      ]
    };
  }

  generateInventoryInsight(prediction) {
    const recommendations = prediction.output.recommendations;
    const costImpact = prediction.output.cost_impact;
    
    return {
      id: `insight_${Date.now()}`,
      type: 'inventory_optimization',
      title: `Inventory Optimization: ${recommendations.length} adjustments recommended`,
      description: `Potential cost impact: $${Math.abs(costImpact).toLocaleString()} ${costImpact > 0 ? 'savings' : 'investment'}`,
      severity: Math.abs(costImpact) > 50000 ? 'high' : 'medium',
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      actionable: true,
      actions: [
        'Adjust reorder points',
        'Update safety stock levels',
        'Review supplier contracts'
      ]
    };
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return ((last - first) / first) * 100;
  }

  startRealtimeProcessing() {
    // Simulate real-time data updates
    setInterval(() => {
      this.updateRealtimeData();
      this.metrics.dataPointsProcessed += 10;
    }, 2000);
  }

  updateRealtimeData() {
    const timestamp = Date.now();
    
    // Production metrics
    this.realtimeData.production.push({
      timestamp,
      output: 85 + Math.random() * 30,
      efficiency: 75 + Math.random() * 20,
      downtime: Math.random() * 5
    });
    
    // Quality metrics  
    this.realtimeData.quality.push({
      timestamp,
      defectRate: Math.random() * 3,
      qualityScore: 92 + Math.random() * 8,
      inspectionTime: 15 + Math.random() * 10
    });
    
    // Efficiency metrics
    this.realtimeData.efficiency.push({
      timestamp,
      oee: 75 + Math.random() * 20,
      availability: 85 + Math.random() * 15,
      performance: 80 + Math.random() * 18
    });
    
    // Keep only last 50 data points
    Object.keys(this.realtimeData).forEach(key => {
      if (this.realtimeData[key].length > 50) {
        this.realtimeData[key] = this.realtimeData[key].slice(-50);
      }
    });
  }

  generateInitialInsights() {
    // Generate sample insights
    this.insights = [
      {
        id: 'insight_1',
        type: 'demand_forecast',
        title: 'Seasonal Demand Peak Approaching',
        description: 'Historical patterns indicate 25% increase in demand expected next month',
        severity: 'high',
        confidence: 0.94,
        timestamp: Date.now() - 3600000,
        actionable: true,
        actions: ['Increase production capacity', 'Build safety stock', 'Alert sales team']
      },
      {
        id: 'insight_2',
        type: 'quality_prediction',
        title: 'Material Quality Variance Detected',
        description: 'Supplier batch showing 12% higher defect rate than baseline',
        severity: 'medium',
        confidence: 0.87,
        timestamp: Date.now() - 7200000,
        actionable: true,
        actions: ['Contact supplier', 'Increase inspection frequency', 'Consider alternative source']
      }
    ];
  }

  getSystemMetrics() {
    const activeModels = Object.values(this.models).filter(m => m.loaded && m.status !== 'training').length;
    const avgAccuracy = Object.values(this.models)
      .filter(m => m.loaded)
      .reduce((sum, m) => sum + m.accuracy, 0) / activeModels || 0;
    
    return {
      ...this.metrics,
      modelsActive: activeModels,
      accuracyScore: avgAccuracy,
      realtimeData: this.realtimeData,
      insights: this.insights,
      models: this.models,
      predictions: Array.from(this.predictions.values()).slice(-20)
    };
  }
}

// React Component
const AdvancedAnalyticsDashboard = () => {
  const [analyticsEngine] = useState(() => new AdvancedAnalyticsEngine());
  const [metrics, setMetrics] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [activePrediction, setActivePrediction] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(analyticsEngine.getSystemMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [analyticsEngine]);

  const handleRunPrediction = useCallback(async (modelKey) => {
    setActivePrediction({ model: modelKey, status: 'running' });
    
    try {
      const sampleData = generateSampleData(modelKey);
      const result = await analyticsEngine.runPrediction(modelKey, sampleData);
      setActivePrediction({ model: modelKey, status: 'completed', result });
    } catch (error) {
      setActivePrediction({ model: modelKey, status: 'failed', error: error.message });
    }
  }, [analyticsEngine]);

  const generateSampleData = (modelKey) => {
    switch (modelKey) {
      case 'demand_forecasting':
        return { historicalData: Array.from({length: 12}, () => Math.random() * 1000) };
      case 'quality_prediction':
        return { machineParams: { temperature: 75, pressure: 120, speed: 1800 } };
      case 'maintenance_optimization':
        return { sensorData: { vibration: 0.5, temperature: 85, hours: 2340 } };
      default:
        return { data: 'sample' };
    }
  };

  const chartData = useMemo(() => {
    if (!metrics) return null;
    
    return {
      production: metrics.realtimeData.production.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        output: item.output,
        efficiency: item.efficiency
      })),
      quality: metrics.realtimeData.quality.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        defectRate: item.defectRate,
        qualityScore: item.qualityScore
      }))
    };
  }, [metrics]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'trained':
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'training':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <CogIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <BoltIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Advanced Analytics Engine</h1>
        </div>
        <p className="text-purple-100">
          Machine learning-powered analytics with predictive modeling and real-time insights
        </p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Models</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.modelsActive}</p>
            </div>
            <CpuChipIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Accuracy Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(metrics.accuracyScore * 100).toFixed(1)}%
              </p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Predictions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalPredictions}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Insights</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.insightsGenerated}</p>
            </div>
            <LightBulbIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.dataPointsProcessed.toLocaleString()}
              </p>
            </div>
            <ChartPieIcon className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Production Analytics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData?.production || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="output" stroke="#3b82f6" name="Output" />
              <Line type="monotone" dataKey="efficiency" stroke="#10b981" name="Efficiency" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quality Analytics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData?.quality || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="qualityScore" stackId="1" stroke="#8884d8" fill="#8884d8" name="Quality Score" />
              <Area type="monotone" dataKey="defectRate" stackId="2" stroke="#ef4444" fill="#ef4444" name="Defect Rate" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Models Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <BeakerIcon className="w-6 h-6" />
          <span>Machine Learning Models</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(metrics.models).map(([key, model]) => (
            <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">{model.name}</h3>
                {getStatusIcon(model.status)}
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Algorithm:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{model.algorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(model.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Horizon:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{model.horizon}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleRunPrediction(key)}
                disabled={activePrediction?.model === key && activePrediction?.status === 'running'}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
              >
                {activePrediction?.model === key && activePrediction?.status === 'running' ? 'Running...' : 'Run Prediction'}
              </button>
              
              {model.error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
                  {model.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Insights Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <LightBulbIcon className="w-6 h-6" />
          <span>AI-Generated Insights</span>
        </h2>
        
        <div className="space-y-4">
          {metrics.insights.slice(0, 10).map((insight) => (
            <div key={insight.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{insight.title}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSeverityColor(insight.severity)}`}>
                      {insight.severity}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{insight.description}</p>
                  
                  {insight.actionable && insight.actions && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Recommended Actions:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {insight.actions.slice(0, 3).map((action, index) => (
                          <li key={index}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(insight.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;