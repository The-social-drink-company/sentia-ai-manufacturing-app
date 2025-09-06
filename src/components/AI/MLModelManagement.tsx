import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BeakerIcon,
  ChartBarIcon,
  CpuChipIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { logInfo, logWarn, logError } from '../../lib/logger';

export interface MLModel {
  id: string;
  name: string;
  description: string;
  type: 'demand_forecasting' | 'anomaly_detection' | 'price_optimization' | 'quality_prediction' | 'supplier_scoring';
  version: string;
  status: 'training' | 'ready' | 'deployed' | 'deprecated' | 'failed';
  framework: 'tensorflow' | 'pytorch' | 'scikit-learn' | 'xgboost' | 'lightgbm';
  environment: 'development' | 'staging' | 'production';
  
  // Model metadata
  metadata: {
    datasetSize: number;
    features: number;
    targetVariable: string;
    algorithm: string;
    hyperparameters: Record<string, any>;
    trainingTime: number; // in seconds
    modelSize: number; // in MB
  };
  
  // Performance metrics
  performance: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mae?: number; // Mean Absolute Error
    rmse?: number; // Root Mean Square Error
    r2Score?: number;
    auc?: number; // Area Under Curve
    customMetrics?: Record<string, number>;
  };
  
  // Validation results
  validation: {
    crossValidationScore: number;
    validationLoss: number;
    overfittingRisk: 'low' | 'medium' | 'high';
    dataLeakageCheck: boolean;
    biasAssessment: {
      overallBias: 'low' | 'medium' | 'high';
      protectedAttributes: Array<{
        attribute: string;
        biasLevel: 'low' | 'medium' | 'high';
        mitigation: string;
      }>;
    };
  };
  
  // Deployment info
  deployment: {
    endpoint?: string;
    replicas: number;
    cpuRequest: string;
    memoryRequest: string;
    lastDeployed?: Date;
    deploymentStrategy: 'blue-green' | 'canary' | 'rolling';
    healthCheck: {
      status: 'healthy' | 'unhealthy' | 'unknown';
      lastCheck: Date;
      latency: number;
      errorRate: number;
    };
  };
  
  // Lineage and versioning
  lineage: {
    parentModelId?: string;
    datasetVersion: string;
    codeVersion: string;
    experimentId: string;
    tags: string[];
  };
  
  // Monitoring
  monitoring: {
    predictions: number;
    avgLatency: number;
    errorRate: number;
    driftScore: number;
    lastRetrained?: Date;
    nextRetrainingDue?: Date;
  };
  
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused' | 'cancelled';
  
  models: Array<{
    modelId: string;
    modelName: string;
    version: string;
    trafficPercentage: number;
    alias: string; // e.g., 'control', 'variant_a', 'variant_b'
  }>;
  
  configuration: {
    trafficSplit: Record<string, number>; // model alias -> percentage
    duration: number; // in days
    sampleSize: number;
    significanceLevel: number;
    powerAnalysis: number;
    primaryMetric: string;
    secondaryMetrics: string[];
  };
  
  results: {
    startDate: Date;
    endDate?: Date;
    participants: number;
    conversions: Record<string, number>;
    metrics: Record<string, Record<string, number>>; // model -> metric -> value
    statisticalSignificance: Record<string, boolean>; // metric -> significant
    confidence: Record<string, number>; // metric -> confidence level
    winner?: string; // model alias
    recommendation: string;
  };
  
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ModelExperiment {
  id: string;
  name: string;
  modelType: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  
  parameters: {
    dataset: string;
    features: string[];
    algorithm: string;
    hyperparameters: Record<string, any>;
    crossValidation: {
      folds: number;
      strategy: string;
    };
  };
  
  results: {
    bestScore: number;
    bestParams: Record<string, any>;
    allResults: Array<{
      params: Record<string, any>;
      score: number;
      std: number;
    }>;
    trainingTime: number;
  };
  
  createdAt: Date;
  completedAt?: Date;
}

const mockModels: MLModel[] = [
  {
    id: 'model_001',
    name: 'Demand Forecasting v2.1',
    description: 'LSTM-based demand forecasting model with seasonal decomposition',
    type: 'demand_forecasting',
    version: '2.1.0',
    status: 'deployed',
    framework: 'tensorflow',
    environment: 'production',
    
    metadata: {
      datasetSize: 2500000,
      features: 45,
      targetVariable: 'demand_quantity',
      algorithm: 'LSTM with Attention',
      hyperparameters: {
        lstm_units: 128,
        attention_heads: 8,
        dropout_rate: 0.2,
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 100
      },
      trainingTime: 14400, // 4 hours
      modelSize: 156.7
    },
    
    performance: {
      mae: 45.2,
      rmse: 67.8,
      r2Score: 0.89,
      customMetrics: {
        mape: 8.3,
        forecast_accuracy: 91.7,
        seasonal_accuracy: 94.2
      }
    },
    
    validation: {
      crossValidationScore: 0.87,
      validationLoss: 0.023,
      overfittingRisk: 'low',
      dataLeakageCheck: true,
      biasAssessment: {
        overallBias: 'low',
        protectedAttributes: [
          {
            attribute: 'product_category',
            biasLevel: 'low',
            mitigation: 'Feature importance balancing applied'
          }
        ]
      }
    },
    
    deployment: {
      endpoint: 'https://api.sentia.com/ml/demand-forecast/v2',
      replicas: 3,
      cpuRequest: '2',
      memoryRequest: '4Gi',
      lastDeployed: new Date('2024-01-10T14:30:00Z'),
      deploymentStrategy: 'blue-green',
      healthCheck: {
        status: 'healthy',
        lastCheck: new Date('2024-01-12T10:00:00Z'),
        latency: 125,
        errorRate: 0.002
      }
    },
    
    lineage: {
      parentModelId: 'model_legacy_001',
      datasetVersion: 'v2.5.1',
      codeVersion: 'commit_abc123',
      experimentId: 'exp_demand_v21',
      tags: ['lstm', 'attention', 'seasonal', 'production']
    },
    
    monitoring: {
      predictions: 45632,
      avgLatency: 125,
      errorRate: 0.002,
      driftScore: 0.12,
      lastRetrained: new Date('2024-01-01T00:00:00Z'),
      nextRetrainingDue: new Date('2024-02-01T00:00:00Z')
    },
    
    createdBy: 'data_scientist@company.com',
    createdAt: new Date('2023-12-15'),
    lastUpdated: new Date('2024-01-10')
  },
  {
    id: 'model_002',
    name: 'Quality Prediction Engine',
    description: 'Ensemble model for predicting product quality based on manufacturing parameters',
    type: 'quality_prediction',
    version: '1.0.3',
    status: 'ready',
    framework: 'xgboost',
    environment: 'staging',
    
    metadata: {
      datasetSize: 850000,
      features: 32,
      targetVariable: 'quality_score',
      algorithm: 'XGBoost + Random Forest Ensemble',
      hyperparameters: {
        n_estimators: 500,
        max_depth: 8,
        learning_rate: 0.05,
        subsample: 0.8,
        colsample_bytree: 0.8
      },
      trainingTime: 3600,
      modelSize: 45.2
    },
    
    performance: {
      accuracy: 0.94,
      precision: 0.92,
      recall: 0.89,
      f1Score: 0.90,
      auc: 0.96,
      customMetrics: {
        quality_prediction_accuracy: 94.1,
        defect_detection_rate: 89.2
      }
    },
    
    validation: {
      crossValidationScore: 0.93,
      validationLoss: 0.087,
      overfittingRisk: 'medium',
      dataLeakageCheck: true,
      biasAssessment: {
        overallBias: 'medium',
        protectedAttributes: [
          {
            attribute: 'manufacturing_line',
            biasLevel: 'medium',
            mitigation: 'Stratified sampling implemented'
          }
        ]
      }
    },
    
    deployment: {
      replicas: 2,
      cpuRequest: '1',
      memoryRequest: '2Gi',
      deploymentStrategy: 'canary',
      healthCheck: {
        status: 'healthy',
        lastCheck: new Date('2024-01-12T09:45:00Z'),
        latency: 85,
        errorRate: 0.001
      }
    },
    
    lineage: {
      datasetVersion: 'v1.8.0',
      codeVersion: 'commit_def456',
      experimentId: 'exp_quality_v103',
      tags: ['xgboost', 'ensemble', 'quality', 'staging']
    },
    
    monitoring: {
      predictions: 12450,
      avgLatency: 85,
      errorRate: 0.001,
      driftScore: 0.08
    },
    
    createdBy: 'ml_engineer@company.com',
    createdAt: new Date('2024-01-05'),
    lastUpdated: new Date('2024-01-11')
  }
];

const mockABTests: ABTest[] = [
  {
    id: 'ab_001',
    name: 'Price Optimization Model Comparison',
    description: 'A/B test comparing XGBoost vs Neural Network for price optimization',
    status: 'running',
    
    models: [
      {
        modelId: 'model_price_001',
        modelName: 'Price XGBoost',
        version: '1.2.0',
        trafficPercentage: 50,
        alias: 'control'
      },
      {
        modelId: 'model_price_002',
        modelName: 'Price Neural Net',
        version: '1.0.0',
        trafficPercentage: 50,
        alias: 'variant_a'
      }
    ],
    
    configuration: {
      trafficSplit: { control: 50, variant_a: 50 },
      duration: 14,
      sampleSize: 10000,
      significanceLevel: 0.05,
      powerAnalysis: 0.8,
      primaryMetric: 'revenue_per_unit',
      secondaryMetrics: ['conversion_rate', 'margin_improvement']
    },
    
    results: {
      startDate: new Date('2024-01-05'),
      participants: 7543,
      conversions: { control: 3250, variant_a: 3890 },
      metrics: {
        control: { revenue_per_unit: 45.30, conversion_rate: 0.086, margin_improvement: 0.12 },
        variant_a: { revenue_per_unit: 48.75, conversion_rate: 0.103, margin_improvement: 0.18 }
      },
      statisticalSignificance: { revenue_per_unit: true, conversion_rate: true, margin_improvement: false },
      confidence: { revenue_per_unit: 0.95, conversion_rate: 0.92, margin_improvement: 0.67 },
      recommendation: 'Variant A shows significant improvement in primary metric'
    },
    
    createdBy: 'product_manager@company.com',
    createdAt: new Date('2024-01-01'),
    lastUpdated: new Date('2024-01-12')
  }
];

const mockExperiments: ModelExperiment[] = [
  {
    id: 'exp_001',
    name: 'Hyperparameter Tuning - Demand LSTM',
    modelType: 'demand_forecasting',
    status: 'completed',
    
    parameters: {
      dataset: 'demand_historical_v2.5',
      features: ['historical_demand', 'seasonality', 'promotions', 'weather', 'economic_indicators'],
      algorithm: 'LSTM',
      hyperparameters: {
        lstm_units: [64, 128, 256],
        dropout_rate: [0.1, 0.2, 0.3],
        learning_rate: [0.001, 0.01, 0.1],
        batch_size: [16, 32, 64]
      },
      crossValidation: {
        folds: 5,
        strategy: 'time_series_split'
      }
    },
    
    results: {
      bestScore: 0.89,
      bestParams: {
        lstm_units: 128,
        dropout_rate: 0.2,
        learning_rate: 0.001,
        batch_size: 32
      },
      allResults: [
        { params: { lstm_units: 128, dropout_rate: 0.2, learning_rate: 0.001, batch_size: 32 }, score: 0.89, std: 0.02 },
        { params: { lstm_units: 256, dropout_rate: 0.1, learning_rate: 0.001, batch_size: 16 }, score: 0.87, std: 0.03 },
        { params: { lstm_units: 64, dropout_rate: 0.3, learning_rate: 0.01, batch_size: 64 }, score: 0.82, std: 0.04 }
      ],
      trainingTime: 18000
    },
    
    createdAt: new Date('2023-12-10'),
    completedAt: new Date('2023-12-12')
  }
];

export const MLModelManagement: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [selectedABTest, setSelectedABTest] = useState<ABTest | null>(null);
  const [activeTab, setActiveTab] = useState<'models' | 'experiments' | 'abtests'>('models');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEnvironment, setFilterEnvironment] = useState<string>('all');

  const queryClient = useQueryClient();

  // Fetch models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['ml-models', filterStatus, filterEnvironment],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filtered = [...mockModels];
      
      if (filterStatus !== 'all') {
        filtered = filtered.filter(model => model.status === filterStatus);
      }
      
      if (filterEnvironment !== 'all') {
        filtered = filtered.filter(model => model.environment === filterEnvironment);
      }
      
      return filtered.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
    }
  });

  // Fetch A/B tests
  const { data: abTests = [] } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...mockABTests].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  });

  // Fetch experiments
  const { data: experiments = [] } = useQuery({
    queryKey: ['ml-experiments'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...mockExperiments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  });

  // Deploy model mutation
  const deployModelMutation = useMutation({
    mutationFn: async ({ modelId, environment }: { modelId: string; environment: string }) => {
      logInfo('Deploying model', { modelId, environment });
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { modelId, environment, deployedAt: new Date() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
    }
  });

  // Retrain model mutation
  const retrainModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      logInfo('Starting model retraining', { modelId });
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { modelId, retrainedAt: new Date() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
    }
  });

  const getStatusColor = (status: string) => {
    const colors = {
      training: 'bg-blue-100 text-blue-800',
      ready: 'bg-yellow-100 text-yellow-800',
      deployed: 'bg-green-100 text-green-800',
      deprecated: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getEnvironmentColor = (env: string) => {
    const colors = {
      development: 'bg-blue-50 text-blue-700',
      staging: 'bg-yellow-50 text-yellow-700',
      production: 'bg-green-50 text-green-700'
    };
    return colors[env as keyof typeof colors] || colors.development;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      demand_forecasting: ChartBarIcon,
      anomaly_detection: ExclamationTriangleIcon,
      price_optimization: CpuChipIcon,
      quality_prediction: CheckCircleIcon,
      supplier_scoring: BeakerIcon
    };
    return icons[type as keyof typeof icons] || CpuChipIcon;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <BeakerIcon className="h-7 w-7 text-indigo-600 mr-3" />
            ML Model Management
          </h2>
          <p className="text-gray-600">
            Manage machine learning models, experiments, and A/B tests
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <SparklesIcon className="h-5 w-5 inline mr-2" />
            New Experiment
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'models', label: 'Models', icon: CpuChipIcon, count: models.length },
            { key: 'experiments', label: 'Experiments', icon: BeakerIcon, count: experiments.length },
            { key: 'abtests', label: 'A/B Tests', icon: ChartBarIcon, count: abTests.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="training">Training</option>
                  <option value="ready">Ready</option>
                  <option value="deployed">Deployed</option>
                  <option value="deprecated">Deprecated</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={filterEnvironment}
                  onChange={(e) => setFilterEnvironment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Environments</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
          </div>

          {/* Models Grid */}
          {modelsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {models.map((model) => {
                const TypeIcon = getTypeIcon(model.type);
                
                return (
                  <div
                    key={model.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <TypeIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{model.name}</h3>
                          <div className="text-sm text-gray-500">v{model.version}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(model.status)}`}>
                          {model.status.toUpperCase()}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getEnvironmentColor(model.environment)}`}>
                          {model.environment}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{model.description}</p>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {model.performance.accuracy && (
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.round(model.performance.accuracy * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">Accuracy</div>
                        </div>
                      )}
                      {model.performance.mae && (
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {model.performance.mae.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">MAE</div>
                        </div>
                      )}
                      {model.performance.r2Score && (
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {model.performance.r2Score.toFixed(3)}
                          </div>
                          <div className="text-xs text-gray-500">R² Score</div>
                        </div>
                      )}
                      {model.performance.f1Score && (
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {model.performance.f1Score.toFixed(3)}
                          </div>
                          <div className="text-xs text-gray-500">F1 Score</div>
                        </div>
                      )}
                    </div>

                    {/* Model Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{model.framework}</span>
                      <span>{formatBytes(model.metadata.modelSize * 1024 * 1024)}</span>
                      <span>{model.metadata.features} features</span>
                    </div>

                    {/* Monitoring (for deployed models) */}
                    {model.status === 'deployed' && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-green-900">{model.monitoring.predictions.toLocaleString()}</div>
                            <div className="text-green-600 text-xs">Predictions</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-900">{model.monitoring.avgLatency}ms</div>
                            <div className="text-green-600 text-xs">Latency</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-900">{(model.monitoring.errorRate * 100).toFixed(2)}%</div>
                            <div className="text-green-600 text-xs">Error Rate</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {model.status === 'ready' && (
                        <button
                          onClick={() => deployModelMutation.mutate({ modelId: model.id, environment: 'production' })}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          disabled={deployModelMutation.isPending}
                        >
                          <CloudArrowUpIcon className="h-4 w-4 inline mr-1" />
                          Deploy
                        </button>
                      )}
                      
                      {model.status === 'deployed' && (
                        <button
                          onClick={() => retrainModelMutation.mutate(model.id)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          disabled={retrainModelMutation.isPending}
                        >
                          <ArrowPathIcon className="h-4 w-4 inline mr-1" />
                          Retrain
                        </button>
                      )}
                      
                      <button
                        onClick={() => setSelectedModel(model)}
                        className="px-3 py-2 text-gray-600 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Experiments Tab */}
      {activeTab === 'experiments' && (
        <div className="space-y-4">
          {experiments.map((experiment) => (
            <div key={experiment.id} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{experiment.name}</h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>{experiment.modelType.replace('_', ' ')}</span>
                    <span>Created: {experiment.createdAt.toLocaleDateString()}</span>
                    {experiment.completedAt && (
                      <span>Duration: {formatDuration((experiment.completedAt.getTime() - experiment.createdAt.getTime()) / 1000)}</span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(experiment.status)}`}>
                  {experiment.status.toUpperCase()}
                </span>
              </div>

              {experiment.status === 'completed' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Best Parameters</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {Object.entries(experiment.results.bestParams).map(([param, value]) => (
                        <div key={param} className="flex justify-between">
                          <span>{param}:</span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Best Score</h4>
                    <div className="text-2xl font-bold text-green-600">{experiment.results.bestScore.toFixed(4)}</div>
                    <div className="text-sm text-gray-500">Cross-validation score</div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Training Time</h4>
                    <div className="text-2xl font-bold text-gray-900">{formatDuration(experiment.results.trainingTime)}</div>
                    <div className="text-sm text-gray-500">Total duration</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* A/B Tests Tab */}
      {activeTab === 'abtests' && (
        <div className="space-y-6">
          {abTests.map((test) => (
            <div
              key={test.id}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedABTest(test)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{test.name}</h3>
                  <p className="text-sm text-gray-600">{test.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Started: {test.results.startDate.toLocaleDateString()}</span>
                    <span>{test.models.length} models</span>
                    <span>{test.results.participants.toLocaleString()} participants</span>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(test.status)}`}>
                  {test.status.toUpperCase()}
                </span>
              </div>

              {/* Models Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {test.models.map((model) => {
                  const metrics = test.results.metrics[model.alias];
                  const isWinner = test.results.winner === model.alias;
                  
                  return (
                    <div key={model.modelId} className={`p-4 rounded-lg border-2 ${
                      isWinner ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{model.modelName}</h4>
                          <div className="text-sm text-gray-500">{model.alias} • {model.trafficPercentage}% traffic</div>
                        </div>
                        {isWinner && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Winner
                          </span>
                        )}
                      </div>
                      
                      {metrics && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Revenue/Unit:</span>
                            <span className="text-sm font-medium">${metrics.revenue_per_unit?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Conversion:</span>
                            <span className="text-sm font-medium">{(metrics.conversion_rate * 100)?.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Margin:</span>
                            <span className="text-sm font-medium">+{(metrics.margin_improvement * 100)?.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Statistical Significance */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Primary Metric:</span>
                  <span className={`font-medium ${
                    test.results.statisticalSignificance[test.configuration.primaryMetric] 
                      ? 'text-green-600' 
                      : 'text-gray-600'
                  }`}>
                    {test.results.statisticalSignificance[test.configuration.primaryMetric] 
                      ? 'Significant' 
                      : 'Not significant'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">
                    {Math.round(test.results.confidence[test.configuration.primaryMetric] * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    {React.createElement(getTypeIcon(selectedModel.type), { className: "h-8 w-8 text-indigo-600" })}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedModel.name}</h2>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">Version {selectedModel.version}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedModel.status)}`}>
                        {selectedModel.status.toUpperCase()}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getEnvironmentColor(selectedModel.environment)}`}>
                        {selectedModel.environment}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Performance Metrics */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedModel.performance).map(([metric, value]) => {
                    if (typeof value !== 'number') return null;
                    return (
                      <div key={metric} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {metric.includes('Score') || metric.includes('accuracy') 
                            ? (value * 100).toFixed(1) + '%'
                            : value.toFixed(3)
                          }
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Model Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Framework:</span>
                      <span className="font-medium">{selectedModel.framework}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Algorithm:</span>
                      <span className="font-medium">{selectedModel.metadata.algorithm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model Size:</span>
                      <span className="font-medium">{formatBytes(selectedModel.metadata.modelSize * 1024 * 1024)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Features:</span>
                      <span className="font-medium">{selectedModel.metadata.features}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Training Time:</span>
                      <span className="font-medium">{formatDuration(selectedModel.metadata.trainingTime)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Validation Results</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">CV Score:</span>
                      <span className="font-medium">{selectedModel.validation.crossValidationScore.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Validation Loss:</span>
                      <span className="font-medium">{selectedModel.validation.validationLoss.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overfitting Risk:</span>
                      <span className={`font-medium capitalize ${
                        selectedModel.validation.overfittingRisk === 'low' ? 'text-green-600' :
                        selectedModel.validation.overfittingRisk === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {selectedModel.validation.overfittingRisk}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Leakage:</span>
                      <span className={`font-medium ${selectedModel.validation.dataLeakageCheck ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedModel.validation.dataLeakageCheck ? 'Clean' : 'Detected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deployment Information */}
              {selectedModel.status === 'deployed' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Deployment Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Endpoint:</span>
                        <span className="font-mono text-sm text-blue-600">{selectedModel.deployment.endpoint}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Replicas:</span>
                        <span className="font-medium">{selectedModel.deployment.replicas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resources:</span>
                        <span className="font-medium">
                          {selectedModel.deployment.cpuRequest} CPU, {selectedModel.deployment.memoryRequest}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Health Status:</span>
                        <span className={`font-medium ${
                          selectedModel.deployment.healthCheck.status === 'healthy' ? 'text-green-600' :
                          selectedModel.deployment.healthCheck.status === 'unhealthy' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {selectedModel.deployment.healthCheck.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Predictions:</span>
                        <span className="font-medium">{selectedModel.monitoring.predictions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Latency:</span>
                        <span className="font-medium">{selectedModel.monitoring.avgLatency}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Error Rate:</span>
                        <span className="font-medium">{(selectedModel.monitoring.errorRate * 100).toFixed(3)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Drift Score:</span>
                        <span className={`font-medium ${
                          selectedModel.monitoring.driftScore < 0.2 ? 'text-green-600' :
                          selectedModel.monitoring.driftScore < 0.5 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedModel.monitoring.driftScore.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6 border-t border-gray-200">
                {selectedModel.status === 'ready' && (
                  <button
                    onClick={() => deployModelMutation.mutate({ modelId: selectedModel.id, environment: 'production' })}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CloudArrowUpIcon className="h-5 w-5 inline mr-2" />
                    Deploy to Production
                  </button>
                )}
                
                {selectedModel.status === 'deployed' && (
                  <button
                    onClick={() => retrainModelMutation.mutate(selectedModel.id)}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ArrowPathIcon className="h-5 w-5 inline mr-2" />
                    Retrain Model
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedModel(null)}
                  className="px-6 py-3 text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};