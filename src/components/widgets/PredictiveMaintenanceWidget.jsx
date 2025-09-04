import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ChartBarIcon,
  BoltIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip, Legend } from 'recharts';
import predictiveMaintenanceService from '../../services/predictiveMaintenance';

const PredictiveMaintenanceWidget = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Fetch equipment health status
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['maintenance', 'health'],
    queryFn: () => predictiveMaintenanceService.getEquipmentHealthStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000
  });

  // Fetch maintenance predictions
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({
    queryKey: ['maintenance', 'predictions'],
    queryFn: () => predictiveMaintenanceService.getMaintenancePredictions(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 55000
  });

  // Fetch AI insights
  const { data: aiInsights, isLoading: aiLoading } = useQuery({
    queryKey: ['maintenance', 'ai-insights'],
    queryFn: () => predictiveMaintenanceService.generateAIInsights(),
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 240000
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'good': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const OverviewTab = () => {
    if (healthLoading || !healthData?.success) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const summary = healthData.summary;
    const equipmentList = healthData.data || [];

    // Prepare chart data
    const statusDistribution = [
      { name: 'Good', value: summary.good, color: '#10B981' },
      { name: 'Warning', value: summary.warning, color: '#F59E0B' },
      { name: 'Critical', value: summary.critical, color: '#EF4444' }
    ];

    const healthScoreData = equipmentList.slice(0, 8).map(eq => ({
      name: eq.name.substring(0, 10) + (eq.name.length > 10 ? '...' : ''),
      health: eq.healthScore,
      risk: eq.riskLevel === 'high' ? 100 : eq.riskLevel === 'medium' ? 60 : 20
    }));

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Total Equipment</p>
                <p className="text-lg font-bold text-gray-900">{summary.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Critical</p>
                <p className="text-lg font-bold text-red-600">{summary.critical}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Urgent Maintenance</p>
                <p className="text-lg font-bold text-yellow-600">{summary.urgentMaintenanceNeeded}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Avg Health</p>
                <p className="text-lg font-bold text-green-600">{summary.averageHealthScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status Distribution */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Equipment Status</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health Scores */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Health Scores</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthScoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="health" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium text-gray-900">Equipment Status</h4>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {equipmentList.map((equipment) => (
              <div key={equipment.id} className="px-4 py-2 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getRiskColor(equipment.riskLevel)} mr-3`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{equipment.name}</p>
                      <p className="text-xs text-gray-500">{equipment.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(equipment.status)}`}>
                      {equipment.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{equipment.healthScore}% health</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const PredictionsTab = () => {
    if (predictionsLoading || !predictionsData?.success) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const predictions = predictionsData.data || [];
    const highPriorityPredictions = predictions.filter(p => p.priority >= 8);

    return (
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Total Predictions</p>
                <p className="text-lg font-bold text-gray-900">{predictions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">High Risk</p>
                <p className="text-lg font-bold text-red-600">{predictionsData.highRiskEquipment}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Urgent Actions</p>
                <p className="text-lg font-bold text-yellow-600">{predictionsData.urgentMaintenanceNeeded}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Est. Cost</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(predictionsData.estimatedTotalCost)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* High Priority Predictions */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium text-gray-900">High Priority Maintenance Predictions</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {highPriorityPredictions.length > 0 ? (
              highPriorityPredictions.map((prediction, index) => (
                <div key={index} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          prediction.priority >= 9 ? 'text-red-800 bg-red-100' : 'text-yellow-800 bg-yellow-100'
                        }`}>
                          Priority {prediction.priority}
                        </span>
                        <h5 className="text-sm font-medium text-gray-900 ml-3">{prediction.equipmentName}</h5>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{prediction.type} - {prediction.businessImpact} impact</p>
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          Failure Probability: {Math.round(prediction.prediction.failureProbability * 100)}%
                        </p>
                        <p className="text-xs text-gray-600">
                          Estimated Cost: {formatCurrency(prediction.estimatedCost)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.prediction.riskLevel === 'high' ? 'text-red-800 bg-red-100' : 
                        prediction.prediction.riskLevel === 'medium' ? 'text-yellow-800 bg-yellow-100' :
                        'text-green-800 bg-green-100'
                      }`}>
                        {prediction.prediction.riskLevel} risk
                      </span>
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  {prediction.recommendations.length > 0 && (
                    <div className="mt-3 pt-2 border-t">
                      <h6 className="text-xs font-medium text-gray-700 mb-1">Recommendations:</h6>
                      {prediction.recommendations.slice(0, 2).map((rec, idx) => (
                        <div key={idx} className="flex items-start text-xs text-gray-600 mb-1">
                          <BoltIcon className="h-3 w-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{rec.action}: {rec.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm">No high priority maintenance predictions at this time</p>
              </div>
            )}
          </div>
        </div>

        {/* All Predictions List */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-medium text-gray-900">All Maintenance Predictions</h4>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {predictions.map((prediction, index) => (
              <div 
                key={index} 
                className="px-4 py-2 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedEquipment(prediction)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CpuChipIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prediction.equipmentName}</p>
                      <p className="text-xs text-gray-500">{prediction.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-900">{Math.round(prediction.prediction.failureProbability * 100)}% risk</p>
                    <p className="text-xs text-gray-500">{formatCurrency(prediction.estimatedCost)}</p>
                  </div>
                </div>
              </div>
            ))}
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
            <h4 className="text-sm font-medium text-gray-900">AI-Powered Maintenance Insights</h4>
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
                    <BoltIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
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
          <WrenchScrewdriverIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Predictive Maintenance</h3>
        </div>
        <button
          onClick={() => {
            refetchHealth();
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
            activeTab === 'predictions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('predictions')}
        >
          Predictions
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
        {activeTab === 'predictions' && <PredictionsTab />}
        {activeTab === 'ai-insights' && <AIInsightsTab />}
      </div>

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">{selectedEquipment.equipmentName}</h4>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Failure Probability</p>
                <p className="text-lg font-medium text-red-600">
                  {Math.round(selectedEquipment.prediction.failureProbability * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Cost</p>
                <p className="text-lg font-medium text-gray-900">
                  {formatCurrency(selectedEquipment.estimatedCost)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business Impact</p>
                <p className="text-lg font-medium text-gray-900 capitalize">
                  {selectedEquipment.businessImpact}
                </p>
              </div>
              {selectedEquipment.recommendations.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {selectedEquipment.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        • {rec.action}
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

export default PredictiveMaintenanceWidget;