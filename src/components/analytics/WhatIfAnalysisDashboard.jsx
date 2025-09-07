/**
 * Interactive What-If Analysis Dashboard
 * Real-time slider controls for working capital and business scenario modeling
 * Supports UK, USA, and Europe market analysis with comprehensive parameter adjustment
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Zap,
  RefreshCw,
  Download,
  Share,
  Info,
  Target,
  Globe,
  Package,
  Truck,
  Building2,
  PieChart,
  LineChart,
  Calculator,
  Slider as SliderIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';

const MARKETS = [
  { id: 'UK', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { id: 'USA', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { id: 'EUROPE', name: 'Europe', flag: '🇪🇺', currency: 'EUR' }
];

const CHART_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function WhatIfAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMarket, setSelectedMarket] = useState('UK');
  const [parameters, setParameters] = useState(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  
  const queryClient = useQueryClient();

  // Fetch initial parameters and scenario
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['whatif-analysis-initial'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/whatif-analysis/initialize');
      if (!response.ok) throw new Error('Failed to initialize What-If analysis');
      return response.json();
    },
    staleTime: 60000
  });

  // Real-time scenario calculation
  const scenarioMutation = useMutation({
    mutationFn: async (updatedParameters) => {
      const response = await fetch('/api/analytics/whatif-analysis/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameters: updatedParameters })
      });
      if (!response.ok) throw new Error('Failed to calculate scenario');
      return response.json();
    },
    onSuccess: (data) => {
      setLastUpdateTime(Date.now());
      queryClient.setQueryData(['whatif-scenario'], data);
    }
  });

  // Initialize parameters from initial data
  useEffect(() => {
    if (initialData && !parameters) {
      setParameters(initialData.parameters);
    }
  }, [initialData, parameters]);

  // Debounced parameter updates for real-time calculation
  const debouncedUpdateScenario = useCallback(
    debounce((newParameters) => {
      if (isRealTimeEnabled) {
        scenarioMutation.mutate(newParameters);
      }
    }, 300),
    [isRealTimeEnabled, scenarioMutation]
  );

  // Handle parameter changes
  const handleParameterChange = useCallback((category, parameter, value) => {
    setParameters(prev => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          [parameter]: value
        }
      };
      debouncedUpdateScenario(updated);
      return updated;
    });
  }, [debouncedUpdateScenario]);

  // Get current scenario data
  const scenarioData = queryClient.getQueryData(['whatif-scenario']) || initialData?.scenario;

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!scenarioData) return null;
    
    const { overallImpact, workingCapitalSummary } = scenarioData;
    
    return {
      totalSales: overallImpact?.financial?.totalSales || 0,
      totalWorkingCapital: workingCapitalSummary?.totalRequired || 0,
      totalBorrowingRequired: workingCapitalSummary?.totalBorrowingRequired || 0,
      roi: overallImpact?.financial?.roi || 0,
      confidence: scenarioData.confidence || 0.85
    };
  }, [scenarioData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium">Loading What-If Analysis...</span>
        </div>
      </div>
    );
  }

  if (!parameters) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Failed to load analysis parameters</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-blue-600" />
            What-If Analysis Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Interactive scenario modeling for UK, USA, and Europe markets with real-time working capital calculations
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <Badge 
            variant={summaryMetrics?.confidence >= 0.8 ? 'default' : 'secondary'}
            className="px-3 py-1"
          >
            Confidence: {((summaryMetrics?.confidence || 0) * 100).toFixed(0)}%
          </Badge>
          
          <Badge variant="outline" className="px-3 py-1">
            Last Update: {new Date(lastUpdateTime).toLocaleTimeString()}
          </Badge>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={isRealTimeEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            >
              <Zap className="w-4 h-4 mr-1" />
              Real-time
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => scenarioMutation.mutate(parameters)}
              disabled={scenarioMutation.isPending}
            >
              {scenarioMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Sales Forecast"
          value={summaryMetrics?.totalSales || 0}
          format="currency"
          icon={TrendingUp}
          color="text-green-600"
          change={scenarioData?.overallImpact?.comparison?.salesVsBaseline || 0}
        />
        
        <SummaryCard
          title="Working Capital Required"
          value={summaryMetrics?.totalWorkingCapital || 0}
          format="currency"
          icon={DollarSign}
          color="text-blue-600"
          change={scenarioData?.overallImpact?.comparison?.workingCapitalVsBaseline || 0}
        />
        
        <SummaryCard
          title="Borrowing Required"
          value={summaryMetrics?.totalBorrowingRequired || 0}
          format="currency"
          icon={Building2}
          color="text-purple-600"
          isWarning={summaryMetrics?.totalBorrowingRequired > 0}
        />
        
        <SummaryCard
          title="Return on Investment"
          value={summaryMetrics?.roi || 0}
          format="percentage"
          icon={Target}
          color="text-orange-600"
          change={scenarioData?.overallImpact?.comparison?.profitVsBaseline || 0}
        />
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Working Capital Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Working Capital by Market
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <RechartsPieChart 
                        data={scenarioData?.workingCapitalSummary?.byMarket ? 
                          Object.entries(scenarioData.workingCapitalSummary.byMarket).map(([market, data]) => ({
                            market,
                            value: data.workingCapital,
                            borrowing: data.borrowing
                          })) : []
                        }
                      >
                        {Object.keys(scenarioData?.workingCapitalSummary?.byMarket || {}).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </RechartsPieChart>
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sales Forecast Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  12-Month Sales Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={generateSalesForecastData(scenarioData?.marketAnalysis)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis formatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="UK" stroke="#10B981" strokeWidth={2} />
                      <Line type="monotone" dataKey="USA" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="EUROPE" stroke="#8B5CF6" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Market Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Market</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Annual Sales</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Working Capital</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Borrowing Needed</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">ROI</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(scenarioData?.marketAnalysis || {}).map(([marketId, marketData]) => {
                      const market = MARKETS.find(m => m.id === marketId);
                      const annualSales = marketData.salesForecast?.reduce((sum, month) => sum + month.sales, 0) || 0;
                      const roi = (annualSales * 0.25) / marketData.workingCapitalRequired * 100;
                      
                      return (
                        <tr key={marketId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">{market?.flag}</span>
                              <span className="font-medium">{market?.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">{formatCurrency(annualSales)}</td>
                          <td className="text-right py-3 px-4">{formatCurrency(marketData.workingCapitalRequired)}</td>
                          <td className="text-right py-3 px-4">{formatCurrency(marketData.borrowingRequired)}</td>
                          <td className="text-right py-3 px-4">{roi.toFixed(1)}%</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant={getRiskVariant(marketData.risks?.length || 0)}>
                              {getRiskLevel(marketData.risks?.length || 0)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parameters Tab - Interactive Sliders */}
        <TabsContent value="parameters" className="space-y-6">
          <ParameterControlPanel
            parameters={parameters}
            onParameterChange={handleParameterChange}
            isUpdating={scenarioMutation.isPending}
          />
        </TabsContent>

        {/* Markets Tab */}
        <TabsContent value="markets" className="space-y-6">
          <MarketAnalysisView
            marketAnalysis={scenarioData?.marketAnalysis}
            selectedMarket={selectedMarket}
            onMarketChange={setSelectedMarket}
          />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <InsightsView insights={scenarioData?.insights} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Parameter Control Panel Component
function ParameterControlPanel({ parameters, onParameterChange, isUpdating }) {
  const parameterCategories = [
    {
      id: 'rawMaterials',
      title: 'Raw Materials',
      icon: Package,
      color: 'text-green-600',
      description: 'Raw material availability, delivery times, and cost factors'
    },
    {
      id: 'manufacturing',
      title: 'Manufacturing',
      icon: Settings,
      color: 'text-blue-600',
      description: 'Production capacity, efficiency, and operational parameters'
    },
    {
      id: 'shipping',
      title: 'Shipping & Logistics',
      icon: Truck,
      color: 'text-purple-600',
      description: 'Delivery times, shipping costs, and reliability factors'
    },
    {
      id: 'sales',
      title: 'Sales & Demand',
      icon: TrendingUp,
      color: 'text-orange-600',
      description: 'Growth rates, seasonality, and market penetration'
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      icon: BarChart3,
      color: 'text-teal-600',
      description: 'Stock levels, turnover targets, and safety stock'
    },
    {
      id: 'financing',
      title: 'Financing & Working Capital',
      icon: DollarSign,
      color: 'text-red-600',
      description: 'Interest rates, credit limits, and payment terms'
    }
  ];

  return (
    <div className="space-y-6">
      {isUpdating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">Updating scenario calculations...</span>
          </div>
        </div>
      )}
      
      {parameterCategories.map(category => {
        const CategoryIcon = category.icon;
        const categoryParams = parameters[category.id] || {};
        
        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className={`flex items-center ${category.color}`}>
                <CategoryIcon className="w-5 h-5 mr-2" />
                {category.title}
              </CardTitle>
              <p className="text-sm text-gray-600">{category.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(getParameterConfig(category.id)).map(([param, config]) => (
                  <ParameterSlider
                    key={param}
                    label={config.label}
                    value={categoryParams[param] || config.default}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    unit={config.unit}
                    description={config.description}
                    onChange={(value) => onParameterChange(category.id, param, value)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Individual Parameter Slider Component
function ParameterSlider({ label, value, min, max, step, unit, description, onChange }) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center cursor-help">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <Info className="w-4 h-4 ml-1 text-gray-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span className="text-sm font-semibold text-gray-900">
          {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}{unit}
        </span>
      </div>
      
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, format, icon: Icon, color, change, isWarning }) {
  const formattedValue = format === 'currency' ? formatCurrency(value) :
                        format === 'percentage' ? `${value.toFixed(1)}%` :
                        value.toLocaleString();
                        
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={isWarning ? 'border-orange-200 bg-orange-50' : ''}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formattedValue}</p>
              {change !== undefined && change !== 0 && (
                <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {Math.abs(change).toFixed(1)}% vs baseline
                </div>
              )}
            </div>
            <Icon className={`w-8 h-8 ${color}`} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Market Analysis View Component
function MarketAnalysisView({ marketAnalysis, selectedMarket, onMarketChange }) {
  const currentMarketData = marketAnalysis?.[selectedMarket];
  
  return (
    <div className="space-y-6">
      {/* Market Selector */}
      <div className="flex space-x-4">
        {MARKETS.map(market => (
          <Button
            key={market.id}
            variant={selectedMarket === market.id ? 'default' : 'outline'}
            onClick={() => onMarketChange(market.id)}
            className="flex items-center"
          >
            <span className="text-xl mr-2">{market.flag}</span>
            {market.name}
          </Button>
        ))}
      </div>
      
      {currentMarketData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Market Overview - {MARKETS.find(m => m.id === selectedMarket)?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Annual Sales</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(currentMarketData.salesForecast?.reduce((sum, month) => sum + month.sales, 0) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Working Capital</p>
                  <p className="text-xl font-bold">{formatCurrency(currentMarketData.workingCapitalRequired)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Production Utilization</p>
                  <p className="text-xl font-bold">{(currentMarketData.production?.capacityUtilization * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Credit Utilization</p>
                  <p className="text-xl font-bold">{(currentMarketData.financing?.creditUtilization * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Seasonal Working Capital */}
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Working Capital Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={currentMarketData.workingCapital?.seasonal || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis formatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="workingCapital" stroke="#3B82F6" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Insights View Component
function InsightsView({ insights }) {
  return (
    <div className="space-y-6">
      {insights?.summary?.map((insight, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-full ${
                insight.type === 'positive' ? 'bg-green-100 text-green-600' :
                insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {insight.type === 'positive' ? <CheckCircle className="w-5 h-5" /> :
                 insight.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                 <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                <p className="text-gray-600 mt-1">{insight.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Helper functions
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

function generateSalesForecastData(marketAnalysis) {
  if (!marketAnalysis) return [];
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return months.map((month, index) => {
    const data = { month };
    
    Object.entries(marketAnalysis).forEach(([marketId, marketData]) => {
      const monthData = marketData.salesForecast?.find(s => s.month === index + 1);
      data[marketId] = monthData?.sales || 0;
    });
    
    return data;
  });
}

function getRiskVariant(riskCount) {
  if (riskCount === 0) return 'default';
  if (riskCount <= 2) return 'secondary';
  return 'destructive';
}

function getRiskLevel(riskCount) {
  if (riskCount === 0) return 'Low';
  if (riskCount <= 2) return 'Medium';
  return 'High';
}

function getParameterConfig(category) {
  const configs = {
    rawMaterials: {
      availability: { label: 'Availability', min: 50, max: 100, default: 85, step: 5, unit: '%', description: 'Raw material availability from suppliers' },
      deliveryTime: { label: 'Delivery Time', min: 7, max: 60, default: 21, step: 1, unit: ' days', description: 'Average delivery time for raw materials' },
      costInflation: { label: 'Cost Inflation', min: -10, max: 25, default: 5, step: 0.5, unit: '%', description: 'Year-over-year cost inflation rate' },
      bufferStock: { label: 'Buffer Stock', min: 10, max: 45, default: 21, step: 1, unit: ' days', description: 'Safety stock buffer in days' }
    },
    manufacturing: {
      capacity: { label: 'Capacity', min: 60, max: 120, default: 100, step: 5, unit: '%', description: 'Manufacturing capacity utilization' },
      efficiency: { label: 'Efficiency', min: 70, max: 98, default: 88, step: 1, unit: '%', description: 'Overall production efficiency' },
      leadTime: { label: 'Lead Time', min: 3, max: 21, default: 7, step: 1, unit: ' days', description: 'Manufacturing lead time' },
      laborCost: { label: 'Labor Cost Change', min: -15, max: 30, default: 8, step: 1, unit: '%', description: 'Labor cost inflation/deflation' }
    },
    shipping: {
      deliveryTime: { label: 'Delivery Time', min: 1, max: 14, default: 5, step: 1, unit: ' days', description: 'Average shipping delivery time' },
      shippingCost: { label: 'Cost Change', min: -20, max: 50, default: 12, step: 1, unit: '%', description: 'Shipping cost inflation' },
      reliabilityRate: { label: 'Reliability', min: 85, max: 99.5, default: 95, step: 0.5, unit: '%', description: 'On-time delivery reliability' }
    },
    sales: {
      growthRate: { label: 'Growth Rate', min: -20, max: 40, default: 12, step: 1, unit: '%', description: 'Annual sales growth rate' },
      seasonalityFactor: { label: 'Seasonality', min: 0.5, max: 2.0, default: 1.2, step: 0.1, unit: 'x', description: 'Seasonal demand multiplier' },
      marketPenetration: { label: 'Market Share', min: 5, max: 25, default: 13.8, step: 0.2, unit: '%', description: 'Market share percentage' }
    },
    inventory: {
      targetStockDays: { label: 'Target Stock', min: 15, max: 90, default: 45, step: 5, unit: ' days', description: 'Target inventory in days of sales' },
      safetyStockLevel: { label: 'Safety Stock', min: 5, max: 30, default: 14, step: 1, unit: ' days', description: 'Safety stock buffer days' },
      turnoverTarget: { label: 'Turnover Target', min: 4, max: 24, default: 8, step: 1, unit: 'x/year', description: 'Inventory turnover per year' }
    },
    financing: {
      interestRate: { label: 'Interest Rate', min: 2, max: 15, default: 6.5, step: 0.25, unit: '%', description: 'Borrowing interest rate' },
      creditLimit: { label: 'Credit Limit', min: 1, max: 20, default: 5, step: 0.5, unit: 'M USD', description: 'Available credit facility' },
      paymentTerms: { label: 'Payment Terms', min: 15, max: 90, default: 30, step: 5, unit: ' days', description: 'Customer payment terms' }
    }
  };
  
  return configs[category] || {};
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}