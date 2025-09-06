import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  CpuChipIcon, 
  CloudIcon, 
  SparklesIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  CogIcon,
  WifiIcon,
  DatabaseIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';

interface MCPProvider {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  type: 'openai' | 'anthropic' | 'statistical' | 'external';
  version: string;
  lastUpdate: string;
  capabilities: string[];
  weight: number;
}

interface EnsemblePrediction {
  date: string;
  ensembleForecast: number;
  confidenceLower: number;
  confidenceUpper: number;
  modelContributions: {
    [key: string]: {
      value: number;
      weight: number;
      confidence: number;
    };
  };
  dataQuality: number;
  modelAgreement: number;
}

interface MCPDataSource {
  id: string;
  name: string;
  type: 'erp' | 'mes' | 'scm' | 'external';
  status: 'active' | 'inactive' | 'error';
  dataPoints: number;
  lastSync: string;
  quality: number;
}

const MCPEnsembleIntegration: React.FC = () => {
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState(30);
  const [selectedConfidence, setSelectedConfidence] = useState(95);
  const [enabledProviders, setEnabledProviders] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<EnsemblePrediction[]>([]);

  // Fetch MCP providers status
  const { data: providers = [], refetch: refetchProviders } = useQuery({
    queryKey: ['mcp-providers'],
    queryFn: async () => {
      const response = await fetch('/api/mcp/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      return response.json() as MCPProvider[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch MCP data sources
  const { data: dataSources = [] } = useQuery({
    queryKey: ['mcp-data-sources'],
    queryFn: async () => {
      const response = await fetch('/api/mcp/data-sources');
      if (!response.ok) throw new Error('Failed to fetch data sources');
      return response.json() as MCPDataSource[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Generate ensemble prediction mutation
  const generatePredictionMutation = useMutation({
    mutationFn: async (params: {
      timeHorizon: number;
      confidence: number;
      enabledProviders: string[];
      includeMCPData: boolean;
    }) => {
      const response = await fetch('/api/forecasting/ensemble-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to generate ensemble prediction');
      return response.json();
    },
    onMutate: () => setIsGenerating(true),
    onSuccess: (data) => {
      setCurrentPrediction(data.predictions);
      setIsGenerating(false);
    },
    onError: () => setIsGenerating(false),
  });

  // Initialize enabled providers
  useEffect(() => {
    const connectedProviders = providers.filter(p => p.status === 'connected').map(p => p.id);
    setEnabledProviders(connectedProviders);
  }, [providers]);

  const generateEnsembleForecast = useCallback(() => {
    generatePredictionMutation.mutate({
      timeHorizon: selectedTimeHorizon,
      confidence: selectedConfidence,
      enabledProviders,
      includeMCPData: true
    });
  }, [selectedTimeHorizon, selectedConfidence, enabledProviders, generatePredictionMutation]);

  const toggleProvider = useCallback((providerId: string) => {
    setEnabledProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  }, []);

  const getProviderIcon = useCallback((type: string) => {
    switch (type) {
      case 'openai': return <SparklesIcon className="h-4 w-4" />;
      case 'anthropic': return <CpuChipIcon className="h-4 w-4" />;
      case 'statistical': return <ChartBarIcon className="h-4 w-4" />;
      case 'external': return <CloudIcon className="h-4 w-4" />;
      default: return <CogIcon className="h-4 w-4" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'connected': case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected': case 'inactive': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const connectedProviders = providers.filter(p => p.status === 'connected');
  const activeDataSources = dataSources.filter(ds => ds.status === 'active');

  // Mock ensemble prediction data for visualization
  const mockEnsembleData = Array.from({ length: selectedTimeHorizon }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const baseValue = 1000 + Math.sin(i / 7) * 200 + Math.random() * 100;
    
    return {
      date: date.toISOString().split('T')[0],
      ensembleForecast: Math.round(baseValue),
      confidenceLower: Math.round(baseValue * 0.85),
      confidenceUpper: Math.round(baseValue * 1.15),
      gpt4: Math.round(baseValue + (Math.random() - 0.5) * 100),
      claude: Math.round(baseValue + (Math.random() - 0.5) * 80),
      statistical: Math.round(baseValue + (Math.random() - 0.5) * 120),
      dataQuality: 75 + Math.random() * 20,
      modelAgreement: 0.7 + Math.random() * 0.3
    };
  });

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BoltIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>MCP Ensemble Integration</CardTitle>
                <CardDescription>
                  Multi-model forecasting with Model Context Protocol integration
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <WifiIcon className="h-3 w-3" />
                <span>{connectedProviders.length} Connected</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <DatabaseIcon className="h-3 w-3" />
                <span>{activeDataSources.length} Sources</span>
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Quick Status Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">MCP Status</span>
              </div>
              <div className="text-lg font-bold text-green-700">Active</div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">AI Models</span>
              </div>
              <div className="text-lg font-bold text-blue-700">
                {providers.filter(p => ['openai', 'anthropic'].includes(p.type)).length}
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Ensemble Weight</span>
              </div>
              <div className="text-lg font-bold text-purple-700">
                {enabledProviders.length > 0 ? Math.round(100 / enabledProviders.length) : 0}%
              </div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <DatabaseIcon className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Data Quality</span>
              </div>
              <div className="text-lg font-bold text-orange-700">
                {activeDataSources.length > 0 
                  ? Math.round(activeDataSources.reduce((sum, ds) => sum + ds.quality, 0) / activeDataSources.length)
                  : 0}%
              </div>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Time Horizon:</label>
              <Select value={selectedTimeHorizon.toString()} onValueChange={(value) => setSelectedTimeHorizon(Number(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Confidence:</label>
              <Select value={selectedConfidence.toString()} onValueChange={(value) => setSelectedConfidence(Number(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
                  <SelectItem value="99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateEnsembleForecast} disabled={isGenerating || enabledProviders.length === 0}>
              {isGenerating ? (
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BoltIcon className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Forecast'}
            </Button>

            <Button variant="outline" onClick={() => refetchProviders()}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ensemble" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ensemble">Ensemble Forecast</TabsTrigger>
          <TabsTrigger value="providers">MCP Providers</TabsTrigger>
          <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
          <TabsTrigger value="performance">Model Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="ensemble" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ensemble Prediction Results</CardTitle>
              <CardDescription>
                Combined forecast from {enabledProviders.length} enabled models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockEnsembleData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockEnsembleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          name === 'ensembleForecast' ? 'Ensemble Forecast' :
                          name === 'confidenceLower' ? 'Lower Bound' :
                          name === 'confidenceUpper' ? 'Upper Bound' :
                          name.toUpperCase()
                        ]}
                      />
                      <Legend />
                      
                      {/* Confidence interval */}
                      <Line
                        type="monotone"
                        dataKey="confidenceLower"
                        stroke="#e5e7eb"
                        strokeDasharray="2 2"
                        dot={false}
                        name="Lower Bound"
                      />
                      <Line
                        type="monotone"
                        dataKey="confidenceUpper"
                        stroke="#e5e7eb"
                        strokeDasharray="2 2"
                        dot={false}
                        name="Upper Bound"
                      />

                      {/* Individual model predictions */}
                      {enabledProviders.includes('openai') && (
                        <Line
                          type="monotone"
                          dataKey="gpt4"
                          stroke="#10B981"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          name="GPT-4"
                        />
                      )}
                      {enabledProviders.includes('anthropic') && (
                        <Line
                          type="monotone"
                          dataKey="claude"
                          stroke="#8B5CF6"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          name="Claude"
                        />
                      )}
                      {enabledProviders.includes('statistical') && (
                        <Line
                          type="monotone"
                          dataKey="statistical"
                          stroke="#F59E0B"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          name="Statistical"
                        />
                      )}

                      {/* Ensemble forecast */}
                      <Line
                        type="monotone"
                        dataKey="ensembleForecast"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name="Ensemble Forecast"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BoltIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Generate an ensemble forecast to see predictions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MCP Provider Configuration</CardTitle>
              <CardDescription>
                Configure which AI models to include in ensemble predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <div key={provider.id} className={`p-4 border rounded-lg ${getStatusColor(provider.status)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getProviderIcon(provider.type)}
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm opacity-75">{provider.version}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {(provider.weight * 100).toFixed(0)}% weight
                        </Badge>
                        <button
                          onClick={() => toggleProvider(provider.id)}
                          disabled={provider.status !== 'connected'}
                          className={`w-10 h-6 rounded-full transition-colors ${
                            enabledProviders.includes(provider.id) && provider.status === 'connected'
                              ? 'bg-green-500' : 'bg-gray-300'
                          } ${provider.status !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            enabledProviders.includes(provider.id) ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className="font-medium">{provider.status}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Last Update:</span>
                        <span>{new Date(provider.lastUpdate).toLocaleString()}</span>
                      </div>
                      <div className="text-sm">
                        <span>Capabilities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {provider.capabilities.slice(0, 3).map((cap, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                          {provider.capabilities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{provider.capabilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MCP Data Sources</CardTitle>
              <CardDescription>
                Manufacturing data integration through Model Context Protocol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataSources.map((source) => (
                  <div key={source.id} className={`p-4 border rounded-lg ${getStatusColor(source.status)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <DatabaseIcon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <div className="text-sm opacity-75">{source.type.toUpperCase()} System</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium">{source.quality}% Quality</div>
                        <div className="text-xs opacity-75">{source.dataPoints.toLocaleString()} points</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-medium">{source.status}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Sync:</span>
                        <span className="ml-2">{new Date(source.lastSync).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <Progress value={source.quality} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Comparison</CardTitle>
              <CardDescription>
                Historical accuracy and contribution to ensemble predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { model: 'GPT-4', accuracy: 87, weight: 30, predictions: 124 },
                    { model: 'Claude', accuracy: 85, weight: 30, predictions: 118 },
                    { model: 'Statistical', accuracy: 76, weight: 20, predictions: 156 },
                    { model: 'Azure AI', accuracy: 82, weight: 20, predictions: 98 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'accuracy' ? `${value}%` : name === 'weight' ? `${value}%` : value,
                        name === 'accuracy' ? 'Accuracy' : name === 'weight' ? 'Weight' : 'Predictions'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="accuracy" fill="#3B82F6" name="Accuracy %" />
                    <Bar dataKey="weight" fill="#10B981" name="Ensemble Weight %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MCPEnsembleIntegration;