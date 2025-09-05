import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, Tooltip, Legend } from 'recharts';
// Import service with error handling
let smartInventoryService;
try {
  smartInventoryService = require('../../services/smartInventory').default;
} catch (error) {
  // Fallback mock service
  smartInventoryService = {
    getInventoryAnalysis: () => Promise.resolve({
      success: true,
      data: [
        { sku: 'SKU001', name: 'Steel Sheets', category: 'Raw Materials', currentStock: 150, potentialSavings: 2500 },
        { sku: 'SKU002', name: 'Electronic Components', category: 'Components', currentStock: 75, potentialSavings: 1800 }
      ],
      summary: {
        totalItems: 10,
        totalValue: 125000,
        itemsRequiringAttention: 3,
        totalOptimizationSavings: 15000,
        averageTurnoverRate: 4.2
      }
    }),
    getReorderRecommendations: () => Promise.resolve({
      success: true,
      data: [
        { sku: 'SKU001', name: 'Steel Sheets', recommendedOrderQuantity: 100, estimatedCost: 4500, urgency: 8 }
      ],
      summary: { totalRecommendations: 1, urgentReorders: 1, totalReorderValue: 4500 }
    })
  };
}

const SmartInventoryWidget = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch inventory analysis
  const { data: analysisData, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ['inventory', 'analysis'],
    queryFn: () => smartInventoryService.getInventoryAnalysis(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 50000
  });

  // Fetch reorder recommendations
  const { data: reorderData, isLoading: reorderLoading } = useQuery({
    queryKey: ['inventory', 'reorder'],
    queryFn: () => smartInventoryService.getReorderRecommendations(),
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 240000
  });

  // Fetch AI optimization insights
  const { data: aiInsights, isLoading: aiLoading } = useQuery({
    queryKey: ['inventory', 'ai-insights'],
    queryFn: () => smartInventoryService.generateOptimizationInsights(),
    refetchInterval: 600000, // Refresh every 10 minutes
    staleTime: 480000
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getABCColor = (abcClass) => {
    switch (abcClass) {
      case 'A': return 'bg-red-500';
      case 'B': return 'bg-yellow-500';
      case 'C': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getVelocityColor = (category) => {
    switch (category) {
      case 'fast': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'slow': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStockoutRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const OverviewTab = () => {
    if (analysisLoading || !analysisData?.success) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const summary = analysisData.summary;
    const items = analysisData.data || [];

    // Prepare chart data
    const categoryData = items.reduce((acc, item) => {
      const existing = acc.find(cat => cat.name === item.category);
      if (existing) {
        existing.value += item.totalValue;
        existing.count += 1;
      } else {
        acc.push({ name: item.category, value: item.totalValue, count: 1 });
      }
      return acc;
    }, []);

    const abcData = [
      { name: 'Class A', value: items.filter(item => item.abcClass === 'A').length, color: '#EF4444' },
      { name: 'Class B', value: items.filter(item => item.abcClass === 'B').length, color: '#F59E0B' },
      { name: 'Class C', value: items.filter(item => item.abcClass === 'C').length, color: '#10B981' }
    ];

    const velocityVsValue = items.slice(0, 20).map(item => ({
      name: item.name.substring(0, 10) + (item.name.length > 10 ? '...' : ''),
      value: item.totalValue,
      velocity: item.velocityAnalysis.velocity,
      turnover: item.turnoverRate
    }));

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <CubeIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Total Items</p>
                <p className="text-lg font-bold text-gray-900">{summary.totalItems}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Total Value</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalValue)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Need Attention</p>
                <p className="text-lg font-bold text-red-600">{summary.itemsRequiringAttention}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Potential Savings</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalOptimizationSavings)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category Distribution */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Inventory by Category</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ABC Classification */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-3">ABC Classification</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={abcData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {abcData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Velocity vs Value Analysis */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Velocity vs Value Analysis</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={velocityVsValue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="value" name="Value" tick={{ fontSize: 10 }} />
                <YAxis dataKey="velocity" name="Velocity" tick={{ fontSize: 10 }} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    name === 'Value' ? formatCurrency(value) : value.toFixed(2),
                    name === 'Value' ? 'Total Value' : 'Velocity'
                  ]}
                  labelFormatter={(label) => `Item: ${label}`}
                />
                <Scatter dataKey="velocity" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Items Requiring Attention */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium text-gray-900">Items Requiring Attention</h4>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {items.filter(item => item.optimization.action !== 'maintain').slice(0, 10).map((item, index) => (
              <div 
                key={index} 
                className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getABCColor(item.abcClass)} mr-3`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.optimization.action === 'urgent_reorder' ? 'text-red-800 bg-red-100' :
                      item.optimization.action === 'reorder' ? 'text-yellow-800 bg-yellow-100' :
                      item.optimization.action === 'reduce' ? 'text-blue-800 bg-blue-100' :
                      'text-gray-800 bg-gray-100'
                    }`}>
                      {item.optimization.action.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(item.potentialSavings)} savings</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ReorderTab = () => {
    if (reorderLoading || !reorderData?.success) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      );
    }

    const recommendations = reorderData.data || [];
    const summary = reorderData.summary;

    return (
      <div className="space-y-4">
        {/* Reorder Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Total Reorders</p>
                <p className="text-lg font-bold text-gray-900">{summary.totalRecommendations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Urgent</p>
                <p className="text-lg font-bold text-red-600">{summary.urgentReorders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Total Value</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalReorderValue)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Avg Lead Time</p>
                <p className="text-lg font-bold text-yellow-600">{Math.round(summary.averageLeadTime)} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reorder Recommendations */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium text-gray-900">Reorder Recommendations</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {recommendations.length > 0 ? (
              recommendations.map((recommendation, index) => (
                <div key={index} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          recommendation.urgency >= 9 ? 'text-red-800 bg-red-100' : 
                          recommendation.urgency >= 7 ? 'text-yellow-800 bg-yellow-100' :
                          'text-green-800 bg-green-100'
                        }`}>
                          {recommendation.urgency >= 9 ? 'URGENT' : recommendation.urgency >= 7 ? 'HIGH' : 'NORMAL'}
                        </span>
                        <h5 className="text-sm font-medium text-gray-900 ml-3">{recommendation.name}</h5>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{recommendation.category}</p>
                      
                      <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-500">Current Stock</p>
                          <p className="font-medium text-gray-900">{recommendation.currentStock} units</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Recommended Order</p>
                          <p className="font-medium text-blue-600">{recommendation.recommendedOrderQuantity} units</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Estimated Cost</p>
                          <p className="font-medium text-green-600">{formatCurrency(recommendation.estimatedCost)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Days Until Stockout</p>
                          <p className={`font-medium ${
                            recommendation.daysUntilStockout <= 7 ? 'text-red-600' :
                            recommendation.daysUntilStockout <= 14 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {recommendation.daysUntilStockout} days
                          </p>
                        </div>
                      </div>

                      {recommendation.supplier && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <p><span className="font-medium">Supplier:</span> {recommendation.supplier.name}</p>
                          <p><span className="font-medium">Lead Time:</span> {recommendation.supplier.leadTime} days</p>
                          <p><span className="font-medium">Reliability:</span> {Math.round(recommendation.supplier.reliability * 100)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm">No reorder recommendations at this time</p>
                <p className="text-xs">All inventory levels are within optimal ranges</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AIInsightsTab = () => {
    if (aiLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (!aiInsights?.success) {
      return (
        <div className="text-center py-8">
          <SparklesIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">AI insights temporarily unavailable</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* AI Insights Header */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
          <div className="flex items-center mb-2">
            <SparklesIcon className="h-5 w-5 text-purple-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-900">AI-Powered Inventory Optimization</h4>
          </div>
          <p className="text-xs text-gray-600">
            Generated at {aiInsights.generatedAt ? new Date(aiInsights.generatedAt).toLocaleString() : 'Unknown time'}
          </p>
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h5 className="text-sm font-medium text-gray-900">Key Insights</h5>
          </div>
          <div className="p-4">
            {aiInsights.insights && aiInsights.insights.length > 0 ? (
              <ul className="space-y-2">
                {aiInsights.insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <ChartBarIcon className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific insights available at this time.</p>
            )}
          </div>
        </div>

        {/* Optimization Opportunities */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h5 className="text-sm font-medium text-gray-900">Optimization Opportunities</h5>
          </div>
          <div className="p-4">
            {aiInsights.optimizationOpportunities && aiInsights.optimizationOpportunities.length > 0 ? (
              <ul className="space-y-2">
                {aiInsights.optimizationOpportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start">
                    <AdjustmentsHorizontalIcon className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{opportunity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No optimization opportunities identified at this time.</p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h5 className="text-sm font-medium text-gray-900">AI Recommendations</h5>
          </div>
          <div className="p-4">
            {aiInsights.recommendations && aiInsights.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {aiInsights.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific recommendations available at this time.</p>
            )}
          </div>
        </div>

        {/* Key Findings */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h5 className="text-sm font-medium text-gray-900">Key Findings</h5>
          </div>
          <div className="p-4">
            {aiInsights.keyFindings && aiInsights.keyFindings.length > 0 ? (
              <ul className="space-y-2">
                {aiInsights.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{finding}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No key findings available at this time.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CubeIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Smart Inventory</h3>
        </div>
        <button
          onClick={() => {
            refetchAnalysis();
            window.location.reload(); // Force full refresh for all data
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-4 border-b">
        <button
          className={`pb-2 text-sm font-medium border-b-2 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`pb-2 text-sm font-medium border-b-2 ${
            activeTab === 'reorder'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('reorder')}
        >
          Reorder
        </button>
        <button
          className={`pb-2 text-sm font-medium border-b-2 ${
            activeTab === 'ai-insights'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('ai-insights')}
        >
          AI Insights
        </button>
      </div>

      {/* Tab Content */}
      <div className="h-full">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'reorder' && <ReorderTab />}
        {activeTab === 'ai-insights' && <AIInsightsTab />}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">{selectedItem.name}</h4>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Stock</p>
                  <p className="text-lg font-medium text-gray-900">{selectedItem.currentStock} units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-lg font-medium text-gray-900">{formatCurrency(selectedItem.totalValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ABC Class</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getABCColor(selectedItem.abcClass)}`}>
                    Class {selectedItem.abcClass}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Velocity</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVelocityColor(selectedItem.velocityAnalysis.category)}`}>
                    {selectedItem.velocityAnalysis.category}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Optimization Action</p>
                <p className="text-lg font-medium text-blue-600 capitalize">
                  {selectedItem.optimization.action.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedItem.optimization.reasoning}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Potential Savings</p>
                <p className="text-lg font-medium text-green-600">
                  {formatCurrency(selectedItem.potentialSavings)}
                </p>
              </div>

              {selectedItem.recommendations.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {selectedItem.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="text-xs text-gray-700">
                        • {rec.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartInventoryWidget;