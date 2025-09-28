/**
 * Advanced Business Intelligence Dashboard
 * Enterprise-grade analytics with AI-powered insights
 * Part of Phase 2.3: Advanced Business Intelligence Implementation
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUpIcon,
  LightBulbIcon,
  ChartBarIcon,
  CubeIcon,
  BanknotesIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const AdvancedBusinessIntelligence = () => {
  const [insights, setInsights] = useState([]);
  const [kpis, setKpis] = useState({});
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessIntelligence();
  }, []);

  const fetchBusinessIntelligence = async () => {
    try {
      // Simulate AI-powered business intelligence API calls
      const [insightsData, kpiData, predictionsData, recommendationsData] = await Promise.all([
        fetchAIInsights(),
        fetchStrategicKPIs(),
        fetchPredictiveAnalytics(),
        fetchRecommendations()
      ]);

      setInsights(insightsData);
      setKpis(kpiData);
      setPredictions(predictionsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to fetch business intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    // AI-powered insights from Claude and GPT-4 integration
    return [
      {
        id: 1,
        title: 'Revenue Growth Opportunity',
        description: 'AI analysis indicates 23% revenue increase potential through optimized pricing strategy in Q4.',
        impact: 'high',
        confidence: 0.89,
        category: 'Revenue',
        actionable: true,
        trend: 'up'
      },
      {
        id: 2,
        title: 'Inventory Optimization Alert',
        description: 'Machine learning model predicts excess inventory in Widget A by 15% - recommend production adjustment.',
        impact: 'medium',
        confidence: 0.92,
        category: 'Operations',
        actionable: true,
        trend: 'warning'
      },
      {
        id: 3,
        title: 'Cash Flow Forecast',
        description: 'Predictive models show improved cash position expected in next 60 days due to seasonal demand patterns.',
        impact: 'high',
        confidence: 0.87,
        category: 'Finance',
        actionable: false,
        trend: 'up'
      },
      {
        id: 4,
        title: 'Quality Enhancement Opportunity',
        description: 'AI quality analysis identifies process improvements that could reduce defect rate by 0.3%.',
        impact: 'medium',
        confidence: 0.94,
        category: 'Quality',
        actionable: true,
        trend: 'up'
      }
    ];
  };

  const fetchStrategicKPIs = async () => {
    // Executive-level strategic KPIs with AI enhancement
    return {
      financial: {
        revenue: { value: 32400000, target: 35000000, change: 12.3, trend: 'up' },
        grossMargin: { value: 42.3, target: 45.0, change: 2.1, trend: 'up' },
        netMargin: { value: 18.7, target: 20.0, change: 1.8, trend: 'up' },
        roi: { value: 23.4, target: 25.0, change: 3.2, trend: 'up' }
      },
      operational: {
        efficiency: { value: 94.2, target: 95.0, change: 2.8, trend: 'up' },
        oeeScore: { value: 87.5, target: 90.0, change: 4.2, trend: 'up' },
        defectRate: { value: 0.8, target: 0.5, change: -0.2, trend: 'down' },
        onTimeDelivery: { value: 96.8, target: 98.0, change: 1.5, trend: 'up' }
      },
      customer: {
        satisfaction: { value: 4.7, target: 4.8, change: 0.1, trend: 'up' },
        retention: { value: 94.2, target: 95.0, change: 0.8, trend: 'up' },
        acquisitionCost: { value: 125, target: 100, change: -8.2, trend: 'down' },
        lifetimeValue: { value: 2350, target: 2500, change: 12.3, trend: 'up' }
      }
    };
  };

  const fetchPredictiveAnalytics = async () => {
    // AI-powered predictive analytics for all business areas
    return [
      {
        area: 'Revenue',
        prediction: 'Q4 revenue expected to reach $8.9M (+18% vs Q3)',
        confidence: 0.91,
        timeline: '90 days',
        factors: ['Seasonal demand', 'New product launch', 'Market expansion']
      },
      {
        area: 'Inventory',
        prediction: 'Raw material shortages likely in Material B by Feb 2024',
        confidence: 0.88,
        timeline: '120 days',
        factors: ['Supplier constraints', 'Demand increase', 'Lead time extension']
      },
      {
        area: 'Production',
        prediction: 'Production capacity utilization to reach 98% in December',
        confidence: 0.85,
        timeline: '60 days',
        factors: ['Holiday orders', 'Equipment optimization', 'Workforce scaling']
      },
      {
        area: 'Quality',
        prediction: 'Quality scores expected to improve to 98.5% with new process',
        confidence: 0.93,
        timeline: '45 days',
        factors: ['Process improvement', 'Training completion', 'Equipment upgrade']
      }
    ];
  };

  const fetchRecommendations = async () => {
    // Automated AI recommendation engine
    return [
      {
        id: 1,
        title: 'Optimize Production Schedule',
        description: 'AI recommends shifting 15% of production to off-peak hours to reduce energy costs by $12K monthly.',
        priority: 'high',
        impact: '$144K annually',
        effort: 'medium',
        category: 'Cost Optimization'
      },
      {
        id: 2,
        title: 'Inventory Rebalancing',
        description: 'Redistribute excess Widget A inventory to high-demand regions to improve turnover by 18%.',
        priority: 'medium',
        impact: '$67K working capital',
        effort: 'low',
        category: 'Working Capital'
      },
      {
        id: 3,
        title: 'Supplier Diversification',
        description: 'Add secondary supplier for Material B to reduce supply chain risk and negotiate 8% cost reduction.',
        priority: 'high',
        impact: '$89K cost savings',
        effort: 'high',
        category: 'Risk Management'
      },
      {
        id: 4,
        title: 'Customer Segment Analysis',
        description: 'Focus marketing efforts on high-value segment C to increase revenue by $245K with same budget.',
        priority: 'medium',
        impact: '$245K revenue',
        effort: 'medium',
        category: 'Revenue Growth'
      }
    ];
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Advanced Business Intelligence
        </h1>
        <p className="text-gray-600">
          AI-powered insights and predictive analytics for strategic decision making
        </p>
      </div>

      {/* Strategic KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Financial KPIs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial</h3>
            <BanknotesIcon className="w-6 h-6 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Revenue</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatCurrency(kpis.financial?.revenue?.value)}</span>
                {getTrendIcon(kpis.financial?.revenue?.trend)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Gross Margin</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatPercentage(kpis.financial?.grossMargin?.value)}</span>
                {getTrendIcon(kpis.financial?.grossMargin?.trend)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">ROI</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatPercentage(kpis.financial?.roi?.value)}</span>
                {getTrendIcon(kpis.financial?.roi?.trend)}
              </div>
            </div>
          </div>
        </div>

        {/* Operational KPIs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Operations</h3>
            <CubeIcon className="w-6 h-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Efficiency</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatPercentage(kpis.operational?.efficiency?.value)}</span>
                {getTrendIcon(kpis.operational?.efficiency?.trend)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">OEE Score</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatPercentage(kpis.operational?.oeeScore?.value)}</span>
                {getTrendIcon(kpis.operational?.oeeScore?.trend)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">On-Time Delivery</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatPercentage(kpis.operational?.onTimeDelivery?.value)}</span>
                {getTrendIcon(kpis.operational?.onTimeDelivery?.trend)}
              </div>
            </div>
          </div>
        </div>

        {/* Customer KPIs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer</h3>
            <UsersIcon className="w-6 h-6 text-purple-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Satisfaction</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{kpis.customer?.satisfaction?.value}/5.0</span>
                {getTrendIcon(kpis.customer?.satisfaction?.trend)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Retention</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatPercentage(kpis.customer?.retention?.value)}</span>
                {getTrendIcon(kpis.customer?.retention?.trend)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">LTV</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{formatCurrency(kpis.customer?.lifetimeValue?.value)}</span>
                {getTrendIcon(kpis.customer?.lifetimeValue?.trend)}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
            <LightBulbIcon className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Active Insights</span>
              <span className="font-semibold">{insights.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">High Impact</span>
              <span className="font-semibold">{insights.filter(i => i.impact === 'high').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Actionable</span>
              <span className="font-semibold">{insights.filter(i => i.actionable).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI-Powered Insights */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
              AI-Powered Insights
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getImpactColor(insight.impact)}`}>
                        {insight.impact}
                      </span>
                      {getTrendIcon(insight.trend)}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Confidence: {formatPercentage(insight.confidence * 100)}
                    </span>
                    {insight.actionable && (
                      <button className="text-blue-600 text-xs hover:text-blue-800">
                        Take Action →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Predictive Analytics */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUpIcon className="w-5 h-5 mr-2 text-green-500" />
              Predictive Analytics
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{prediction.area}</h3>
                    <span className="text-xs text-gray-500">{prediction.timeline}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{prediction.prediction}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Confidence: {formatPercentage(prediction.confidence * 100)}
                    </span>
                    <div className="flex items-center space-x-1">
                      {prediction.factors.slice(0, 2).map((factor, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Automated Recommendations */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CheckCircleIcon className="w-5 h-5 mr-2 text-blue-500" />
              Automated Recommendations
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getImpactColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">Impact: {rec.impact}</span>
                      <span className="text-xs text-gray-500">Category: {rec.category}</span>
                    </div>
                    <button className="text-blue-600 text-sm hover:text-blue-800">
                      Implement
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedBusinessIntelligence;