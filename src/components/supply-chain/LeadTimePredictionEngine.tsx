import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { 
  ClockIcon,
  CpuChipIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  CalendarIcon,
  CloudIcon,
  GlobeAltIcon,
  CogIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// TensorFlow.js types (simplified for this example)
interface MLModel {
  id: string;
  name: string;
  type: 'lstm' | 'regression' | 'ensemble';
  accuracy: number;
  lastTrained: string;
  status: 'ready' | 'training' | 'error';
  features: string[];
  targetMetric: string;
}

interface LeadTimePrediction {
  supplierId: string;
  supplierName: string;
  productCategory: string;
  route: {
    origin: string;
    destination: string;
    distance: number;
    mode: 'sea' | 'air' | 'road' | 'rail';
  };
  basePrediction: {
    meanLeadTime: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    confidence: number;
  };
  adjustedPrediction: {
    adjustedLeadTime: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    confidence: number;
    adjustmentFactors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  };
  historicalPattern: Array<{
    date: string;
    actualLeadTime: number;
    predictedLeadTime: number;
    accuracy: number;
  }>;
  externalFactors: {
    weather: {
      impact: number;
      description: string;
    };
    holidays: {
      impact: number;
      description: string;
    };
    geopolitical: {
      impact: number;
      description: string;
    };
    seasonal: {
      impact: number;
      description: string;
    };
  };
  recommendation: {
    suggestedLeadTime: number;
    bufferDays: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    mitigationActions: string[];
  };
  modelMetadata: {
    modelUsed: string;
    features: string[];
    trainingDate: string;
    predictionAccuracy: number;
  };
}

interface SupplierPerformanceData {
  supplierId: string;
  supplierName: string;
  location: string;
  averageLeadTime: number;
  variance: number;
  reliability: number;
  seasonalPatterns: Array<{
    month: number;
    averageLeadTime: number;
    volume: number;
  }>;
  externalFactorSensitivity: {
    weather: number;
    holidays: number;
    geopolitical: number;
    seasonal: number;
  };
}

export function LeadTimePredictionEngine() {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [predictionHorizon, setPredictionHorizon] = useState<'1m' | '3m' | '6m'>('3m');
  const [isTrainingModel, setIsTrainingModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState(true);

  // Fetch ML models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['ml-models'],
    queryFn: async () => {
      const response = await fetch('/api/supply-chain/ml-models');
      if (!response.ok) throw new Error('Failed to fetch ML models');
      return response.json() as MLModel[];
    },
  });

  // Fetch predictions
  const { data: predictions = [], isLoading: predictionsLoading, refetch: refetchPredictions } = useQuery({
    queryKey: ['lead-time-predictions', selectedSupplier, selectedCategory, selectedRoute, predictionHorizon, selectedModel],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(selectedSupplier !== 'all' && { supplier: selectedSupplier }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedRoute !== 'all' && { route: selectedRoute }),
        horizon: predictionHorizon,
        model: selectedModel
      });
      const response = await fetch(`/api/supply-chain/lead-time-predictions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch predictions');
      return response.json() as LeadTimePrediction[];
    },
  });

  // Train model mutation
  const trainModelMutation = useMutation({
    mutationFn: async (params: {
      modelId: string;
      trainingData: any;
      hyperparameters: any;
    }) => {
      setIsTrainingModel(true);
      const response = await fetch('/api/supply-chain/train-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to start model training');
      return response.json();
    },
    onSuccess: () => {
      setTimeout(() => {
        setIsTrainingModel(false);
        refetchPredictions();
      }, 5000); // Simulate training time
    },
    onError: () => {
      setIsTrainingModel(false);
    },
  });

  // Mock data for demonstration
  const mockModels: MLModel[] = [
    {
      id: 'lstm-model',
      name: 'LSTM Neural Network',
      type: 'lstm',
      accuracy: 87.3,
      lastTrained: '2024-01-15T10:00:00Z',
      status: 'ready',
      features: ['historical_lead_times', 'weather', 'holidays', 'supplier_performance', 'route_conditions'],
      targetMetric: 'lead_time_days'
    },
    {
      id: 'regression-model',
      name: 'XGBoost Regression',
      type: 'regression',
      accuracy: 84.1,
      lastTrained: '2024-01-14T14:30:00Z',
      status: 'ready',
      features: ['supplier_location', 'product_category', 'shipping_mode', 'seasonal_factors'],
      targetMetric: 'lead_time_days'
    },
    {
      id: 'ensemble-model',
      name: 'Ensemble Model',
      type: 'ensemble',
      accuracy: 91.2,
      lastTrained: '2024-01-16T08:15:00Z',
      status: 'ready',
      features: ['all_available_features'],
      targetMetric: 'lead_time_days'
    }
  ];

  const mockPredictions: LeadTimePrediction[] = [
    {
      supplierId: 'supplier-asia-1',
      supplierName: 'Pacific Electronics Ltd',
      productCategory: 'Electronics',
      route: {
        origin: 'Tokyo, Japan',
        destination: 'London, UK',
        distance: 9600,
        mode: 'sea'
      },
      basePrediction: {
        meanLeadTime: 14.2,
        confidenceInterval: { lower: 12.8, upper: 15.6 },
        confidence: 0.85
      },
      adjustedPrediction: {
        adjustedLeadTime: 16.1,
        confidenceInterval: { lower: 14.5, upper: 17.7 },
        confidence: 0.78,
        adjustmentFactors: [
          { factor: 'Seasonal Peak', impact: 1.2, description: 'Q1 shipping congestion' },
          { factor: 'Weather Conditions', impact: 0.7, description: 'Favorable weather forecast' }
        ]
      },
      historicalPattern: Array.from({ length: 12 }, (_, i) => ({
        date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        actualLeadTime: 14 + Math.sin(i / 2) * 2 + Math.random() * 2,
        predictedLeadTime: 14.2 + Math.sin(i / 2) * 1.8 + Math.random() * 1.5,
        accuracy: 85 + Math.random() * 10
      })),
      externalFactors: {
        weather: { impact: -0.5, description: 'Favorable conditions expected' },
        holidays: { impact: 0.0, description: 'No major holidays in forecast period' },
        geopolitical: { impact: 0.3, description: 'Minor trade tension impact' },
        seasonal: { impact: 1.4, description: 'Peak shipping season' }
      },
      recommendation: {
        suggestedLeadTime: 18,
        bufferDays: 2,
        riskLevel: 'medium',
        mitigationActions: [
          'Consider alternative shipping routes',
          'Increase safety stock by 15%',
          'Monitor weather conditions closely'
        ]
      },
      modelMetadata: {
        modelUsed: 'Ensemble Model',
        features: ['historical_patterns', 'seasonal_factors', 'weather_data', 'route_conditions'],
        trainingDate: '2024-01-16T08:15:00Z',
        predictionAccuracy: 91.2
      }
    },
    {
      supplierId: 'supplier-eu-1',
      supplierName: 'European Components GmbH',
      productCategory: 'Components',
      route: {
        origin: 'Berlin, Germany',
        destination: 'London, UK',
        distance: 950,
        mode: 'road'
      },
      basePrediction: {
        meanLeadTime: 2.8,
        confidenceInterval: { lower: 2.2, upper: 3.4 },
        confidence: 0.92
      },
      adjustedPrediction: {
        adjustedLeadTime: 3.1,
        confidenceInterval: { lower: 2.6, upper: 3.6 },
        confidence: 0.89,
        adjustmentFactors: [
          { factor: 'Border Delays', impact: 0.3, description: 'Post-Brexit processing time' }
        ]
      },
      historicalPattern: Array.from({ length: 12 }, (_, i) => ({
        date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        actualLeadTime: 2.8 + Math.sin(i / 3) * 0.5 + Math.random() * 0.4,
        predictedLeadTime: 2.8 + Math.sin(i / 3) * 0.4 + Math.random() * 0.3,
        accuracy: 90 + Math.random() * 8
      })),
      externalFactors: {
        weather: { impact: 0.1, description: 'Minimal weather impact on road transport' },
        holidays: { impact: 0.2, description: 'Potential delays during holiday periods' },
        geopolitical: { impact: 0.0, description: 'Stable regional conditions' },
        seasonal: { impact: 0.0, description: 'Consistent year-round performance' }
      },
      recommendation: {
        suggestedLeadTime: 4,
        bufferDays: 1,
        riskLevel: 'low',
        mitigationActions: [
          'Monitor border processing times',
          'Consider air freight for urgent deliveries'
        ]
      },
      modelMetadata: {
        modelUsed: 'LSTM Neural Network',
        features: ['route_conditions', 'border_processing', 'traffic_patterns'],
        trainingDate: '2024-01-15T10:00:00Z',
        predictionAccuracy: 87.3
      }
    }
  ];

  const mockSupplierData: SupplierPerformanceData[] = [
    {
      supplierId: 'supplier-asia-1',
      supplierName: 'Pacific Electronics Ltd',
      location: 'Tokyo, Japan',
      averageLeadTime: 14.2,
      variance: 2.1,
      reliability: 0.94,
      seasonalPatterns: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        averageLeadTime: 14.2 + Math.sin(i / 2) * 2,
        volume: 100 + Math.sin(i / 3) * 30
      })),
      externalFactorSensitivity: {
        weather: 0.3,
        holidays: 0.1,
        geopolitical: 0.2,
        seasonal: 0.4
      }
    }
  ];

  // Calculate overall prediction accuracy
  const overallAccuracy = useMemo(() => {
    if (predictions.length === 0) return 0;
    return predictions.reduce((sum, p) => sum + p.modelMetadata.predictionAccuracy, 0) / predictions.length;
  }, [predictions]);

  // Get confidence level distribution
  const confidenceDistribution = useMemo(() => {
    const distribution = { high: 0, medium: 0, low: 0 };
    predictions.forEach(p => {
      if (p.adjustedPrediction.confidence >= 0.8) distribution.high++;
      else if (p.adjustedPrediction.confidence >= 0.6) distribution.medium++;
      else distribution.low++;
    });
    return distribution;
  }, [predictions]);

  const trainModel = useCallback((modelId: string) => {
    trainModelMutation.mutate({
      modelId,
      trainingData: {
        historical_lead_times: mockSupplierData.flatMap(s => s.seasonalPatterns),
        external_factors: predictions.map(p => p.externalFactors),
        supplier_performance: mockSupplierData
      },
      hyperparameters: {
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 100
      }
    });
  }, [trainModelMutation, predictions, mockSupplierData]);

  const getModelStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-50 border-green-200';
      case 'training': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const getRiskColor = useCallback((risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  if (predictionsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Time Prediction Engine</h2>
          <p className="text-sm text-gray-600">ML-powered predictions with confidence intervals and external factor analysis</p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockModels.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name} ({model.accuracy.toFixed(1)}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={predictionHorizon} onValueChange={(value) => setPredictionHorizon(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowConfidenceIntervals(!showConfidenceIntervals)}
          >
            {showConfidenceIntervals ? 'Hide' : 'Show'} Confidence
          </Button>
        </div>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallAccuracy.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{confidenceDistribution.high}</div>
              <div className="text-sm text-gray-600">High Confidence</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{confidenceDistribution.medium}</div>
              <div className="text-sm text-gray-600">Medium Confidence</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{confidenceDistribution.low}</div>
              <div className="text-sm text-gray-600">Low Confidence</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{predictions.length}</div>
              <div className="text-sm text-gray-600">Active Predictions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{mockModels.length}</div>
              <div className="text-sm text-gray-600">ML Models</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {predictions.map(p => (
              <SelectItem key={p.supplierId} value={p.supplierId}>
                {p.supplierName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Electronics">Electronics</SelectItem>
            <SelectItem value="Components">Components</SelectItem>
            <SelectItem value="Raw Materials">Raw Materials</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedRoute} onValueChange={setSelectedRoute}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Routes</SelectItem>
            <SelectItem value="sea">Sea</SelectItem>
            <SelectItem value="air">Air</SelectItem>
            <SelectItem value="road">Road</SelectItem>
            <SelectItem value="rail">Rail</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="models">ML Models</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
          <TabsTrigger value="factors">External Factors</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          {/* Prediction Cards */}
          <div className="space-y-4">
            {predictions.map(prediction => (
              <Card key={`${prediction.supplierId}-${prediction.productCategory}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ClockIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{prediction.supplierName}</h3>
                        <p className="text-sm text-gray-600">{prediction.productCategory} • {prediction.route.origin} → {prediction.route.destination}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{prediction.route.mode.toUpperCase()}</span>
                          <span>•</span>
                          <span>{prediction.route.distance.toLocaleString()} km</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {prediction.adjustedPrediction.adjustedLeadTime.toFixed(1)}
                        <span className="text-sm text-gray-500 font-normal"> days</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Base: {prediction.basePrediction.meanLeadTime.toFixed(1)} days
                      </div>
                    </div>
                  </div>

                  {/* Confidence and Risk */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Confidence Level</div>
                      <div className="flex items-center space-x-2">
                        <Progress value={prediction.adjustedPrediction.confidence * 100} className="flex-1 h-2" />
                        <span className="text-sm font-medium">
                          {(prediction.adjustedPrediction.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Risk Level</div>
                      <div className={cn('text-sm font-medium', getRiskColor(prediction.recommendation.riskLevel))}>
                        {prediction.recommendation.riskLevel.toUpperCase()}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Suggested Lead Time</div>
                      <div className="text-sm font-medium">
                        {prediction.recommendation.suggestedLeadTime} days
                        <span className="text-xs text-gray-500 ml-1">
                          (+{prediction.recommendation.bufferDays} buffer)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Interval */}
                  {showConfidenceIntervals && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-blue-800 mb-2">Confidence Interval (95%)</div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>Lower: {prediction.adjustedPrediction.confidenceInterval.lower.toFixed(1)} days</span>
                        <span>•</span>
                        <span>Upper: {prediction.adjustedPrediction.confidenceInterval.upper.toFixed(1)} days</span>
                      </div>
                    </div>
                  )}

                  {/* Adjustment Factors */}
                  {prediction.adjustedPrediction.adjustmentFactors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Adjustment Factors</h4>
                      <div className="space-y-2">
                        {prediction.adjustedPrediction.adjustmentFactors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium">{factor.factor}</span>
                              <span className="text-xs text-gray-500 ml-2">{factor.description}</span>
                            </div>
                            <span className={cn(
                              'text-sm font-medium',
                              factor.impact > 0 ? 'text-red-600' : 'text-green-600'
                            )}>
                              {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)} days
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {prediction.recommendation.mitigationActions.map((action, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Model Metadata */}
                  <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    Model: {prediction.modelMetadata.modelUsed} • 
                    Accuracy: {prediction.modelMetadata.predictionAccuracy.toFixed(1)}% • 
                    Features: {prediction.modelMetadata.features.length} • 
                    Trained: {new Date(prediction.modelMetadata.trainingDate).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          {/* ML Models Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockModels.map(model => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge className={getModelStatusColor(isTrainingModel && selectedModel === model.id ? 'training' : model.status)}>
                      {isTrainingModel && selectedModel === model.id ? 'Training' : model.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <div className="font-medium">{model.type.toUpperCase()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Accuracy:</span>
                      <div className="font-medium text-green-600">{model.accuracy}%</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Features:</span>
                      <div className="text-xs mt-1">
                        {model.features.slice(0, 3).join(', ')}
                        {model.features.length > 3 && ` (+${model.features.length - 3} more)`}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Last trained: {new Date(model.lastTrained).toLocaleDateString()}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => trainModel(model.id)}
                      disabled={isTrainingModel}
                    >
                      {isTrainingModel && selectedModel === model.id ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                          Training
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Retrain
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <CogIcon className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </div>

                  {isTrainingModel && selectedModel === model.id && (
                    <div className="mt-2">
                      <Progress value={60} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">Training in progress...</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Historical Pattern Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Historical Lead Time Patterns</CardTitle>
              <CardDescription>
                Actual vs predicted lead times with accuracy tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictions[0]?.historicalPattern || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis yAxisId="leadTime" />
                    <YAxis yAxisId="accuracy" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      yAxisId="leadTime"
                      type="monotone" 
                      dataKey="actualLeadTime" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Actual Lead Time"
                    />
                    <Line 
                      yAxisId="leadTime"
                      type="monotone" 
                      dataKey="predictedLeadTime" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Predicted Lead Time"
                    />
                    <Line 
                      yAxisId="accuracy"
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#F59E0B" 
                      strokeWidth={1}
                      name="Accuracy %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Seasonal Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Lead Time Patterns</CardTitle>
              <CardDescription>
                Monthly variations in lead times and volumes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockSupplierData[0]?.seasonalPatterns || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month"
                      tickFormatter={(value) => new Date(2024, value - 1).toLocaleDateString('en-US', { month: 'short' })}
                    />
                    <YAxis yAxisId="leadTime" />
                    <YAxis yAxisId="volume" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area 
                      yAxisId="leadTime"
                      type="monotone" 
                      dataKey="averageLeadTime" 
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      name="Avg Lead Time (days)"
                    />
                    <Line 
                      yAxisId="volume"
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Volume Index"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-6">
          {/* External Factors Impact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weather Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{prediction.supplierName}</div>
                        <div className="text-sm text-gray-600">{prediction.externalFactors.weather.description}</div>
                      </div>
                      <div className={cn(
                        'text-sm font-medium',
                        prediction.externalFactors.weather.impact > 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {prediction.externalFactors.weather.impact > 0 ? '+' : ''}{prediction.externalFactors.weather.impact.toFixed(1)} days
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{prediction.supplierName}</div>
                        <div className="text-sm text-gray-600">{prediction.externalFactors.seasonal.description}</div>
                      </div>
                      <div className={cn(
                        'text-sm font-medium',
                        prediction.externalFactors.seasonal.impact > 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {prediction.externalFactors.seasonal.impact > 0 ? '+' : ''}{prediction.externalFactors.seasonal.impact.toFixed(1)} days
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geopolitical Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{prediction.supplierName}</div>
                        <div className="text-sm text-gray-600">{prediction.externalFactors.geopolitical.description}</div>
                      </div>
                      <div className={cn(
                        'text-sm font-medium',
                        prediction.externalFactors.geopolitical.impact > 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {prediction.externalFactors.geopolitical.impact > 0 ? '+' : ''}{prediction.externalFactors.geopolitical.impact.toFixed(1)} days
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Holiday Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{prediction.supplierName}</div>
                        <div className="text-sm text-gray-600">{prediction.externalFactors.holidays.description}</div>
                      </div>
                      <div className={cn(
                        'text-sm font-medium',
                        prediction.externalFactors.holidays.impact > 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {prediction.externalFactors.holidays.impact > 0 ? '+' : ''}{prediction.externalFactors.holidays.impact.toFixed(1)} days
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}