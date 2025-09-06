import { devLog } from '../../lib/devLog.js';
import React, { useState, useEffect } from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  SparklesIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { intelligenceService } from '../../services/intelligenceService';

const PredictiveAnalyticsDashboard = ({ 
  data = [],
  metrics = [],
  timeRange = 30,
  refreshInterval = 60000 
}) => {
  const [predictions, setPredictions] = useState({});
  const [insights, setInsights] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(metrics[0] || 'production');
  const [isLoading, setIsLoading] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    runPredictiveAnalysis();
    const interval = setInterval(runPredictiveAnalysis, refreshInterval);
    return () => clearInterval(interval);
  }, [data, selectedMetric, timeRange, confidenceLevel]);

  const runPredictiveAnalysis = async () => {
    if (isLoading || !data.length) return;
    setIsLoading(true);

    try {
      // Run multiple analyses in parallel
      const [
        trendPrediction,
        anomalyResults,
        optimizationSuggestions,
        dashboardInsights
      ] = await Promise.all([
        intelligenceService.predictTrends(data, {
          horizon: timeRange,
          confidence: confidenceLevel,
          includeSeasonality: true
        }),
        intelligenceService.detectAnomalies(data, 'high'),
        intelligenceService.generateOptimizations({ 
          metrics: data, 
          currentMetric: selectedMetric 
        }),
        intelligenceService.generateDashboardInsights(data, { metric: selectedMetric })
      ]);

      setPredictions(trendPrediction || {});
      setAnomalies(anomalyResults?.detected || []);
      setOptimizations(optimizationSuggestions?.recommendations || []);
      setInsights([
        ...(dashboardInsights?.critical || []),
        ...(dashboardInsights?.opportunities || [])
      ].slice(0, 5));
    } catch (error) {
      devLog.error('Predictive analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data for predictions
  const getPredictionChartData = () => {
    const historicalDates = data.map(d => d.date || d.timestamp);
    const historicalValues = data.map(d => d[selectedMetric] || d.value);
    
    const futureDates = [];
    const today = new Date();
    for (let i = 1; i <= timeRange; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      futureDates.push(futureDate.toLocaleDateString());
    }

    const forecastValues = predictions.forecast || [];
    const upperBound = predictions.upperBound || forecastValues.map(v => v * 1.1);
    const lowerBound = predictions.lowerBound || forecastValues.map(v => v * 0.9);

    return {
      labels: [...historicalDates, ...futureDates],
      datasets: [
        {
          label: 'Historical',
          data: [...historicalValues, ...Array(futureDates.length).fill(null)],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Forecast',
          data: [...Array(historicalDates.length - 1).fill(null), 
                 historicalValues[historicalValues.length - 1],
                 ...forecastValues],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderDash: [5, 5],
          tension: 0.4
        },
        {
          label: 'Upper Bound',
          data: [...Array(historicalDates.length - 1).fill(null),
                 historicalValues[historicalValues.length - 1],
                 ...upperBound],
          borderColor: 'rgba(16, 185, 129, 0.3)',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          borderDash: [2, 2],
          fill: false,
          tension: 0.4
        },
        {
          label: 'Lower Bound',
          data: [...Array(historicalDates.length - 1).fill(null),
                 historicalValues[historicalValues.length - 1],
                 ...lowerBound],
          borderColor: 'rgba(16, 185, 129, 0.3)',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          borderDash: [2, 2],
          fill: '-1',
          tension: 0.4
        }
      ]
    };
  };

  // Prepare anomaly scatter plot data
  const getAnomalyChartData = () => {
    const normalData = data.map((d, i) => ({
      x: i,
      y: d[selectedMetric] || d.value
    }));

    const anomalyData = anomalies.map(a => ({
      x: a.index || 0,
      y: a.value || 0,
      r: (a.severity || 0.5) * 10
    }));

    return {
      datasets: [
        {
          label: 'Normal Data',
          data: normalData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
        },
        {
          label: 'Anomalies',
          data: anomalyData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          pointRadius: anomalyData.map(a => a.r)
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const tabs = [
    { id: 'predictions', label: 'Predictions', icon: ArrowTrendingUpIcon },
    { id: 'anomalies', label: 'Anomalies', icon: ExclamationTriangleIcon },
    { id: 'optimizations', label: 'Optimizations', icon: LightBulbIcon },
    { id: 'insights', label: 'AI Insights', icon: SparklesIcon }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="h-7 w-7 mr-2 text-blue-600" />
            Predictive Analytics Dashboard
          </h2>
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <SparklesIcon className="h-5 w-5 animate-pulse mr-2" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {metrics.map(metric => (
              <option key={metric} value={metric}>
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
          </select>

          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(Number(e.target.value))}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value={0.90}>90% Confidence</option>
            <option value={0.95}>95% Confidence</option>
            <option value={0.99}>99% Confidence</option>
          </select>

          <button
            onClick={runPredictiveAnalysis}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh Analysis
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b dark:border-gray-700">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {timeRange}-Day Forecast
              </h3>
              {predictions.confidence && (
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Confidence: {(predictions.confidence * 100).toFixed(1)}%</span>
                  <span>Model: {predictions.model || 'Time Series ARIMA'}</span>
                </div>
              )}
            </div>

            <div className="h-80">
              <Line data={getPredictionChartData()} options={chartOptions} />
            </div>

            {predictions.insights && predictions.insights.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Prediction Insights
                </h4>
                <div className="space-y-2">
                  {predictions.insights.map((insight, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <LightBulbIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Anomaly Detection
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {anomalies.length} anomalies detected in the data
              </p>
            </div>

            {anomalies.length > 0 ? (
              <>
                <div className="h-80">
                  <Scatter data={getAnomalyChartData()} options={chartOptions} />
                </div>

                <div className="mt-6 space-y-3">
                  {anomalies.slice(0, 5).map((anomaly, index) => (
                    <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            {anomaly.message || `Anomaly in ${selectedMetric}`}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Severity: {((anomaly.severity || 0.5) * 100).toFixed(0)}% | 
                            Time: {anomaly.timestamp || 'Recent'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No anomalies detected in current data</p>
              </div>
            )}
          </div>
        )}

        {/* Optimizations Tab */}
        {activeTab === 'optimizations' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI-Powered Optimization Recommendations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {optimizations.length} optimization opportunities identified
              </p>
            </div>

            {optimizations.length > 0 ? (
              <div className="space-y-4">
                {optimizations.map((opt, index) => (
                  <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                          <span className="text-green-800 dark:text-green-200 font-semibold">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {opt.title || opt.action || 'Optimization Opportunity'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {opt.description || opt.recommendation}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-xs">
                          {opt.impact && (
                            <span className="text-green-600 dark:text-green-400">
                              Impact: {opt.impact}%
                            </span>
                          )}
                          {opt.effort && (
                            <span className="text-blue-600 dark:text-blue-400">
                              Effort: {opt.effort}
                            </span>
                          )}
                          {opt.timeline && (
                            <span className="text-gray-600 dark:text-gray-400">
                              Timeline: {opt.timeline}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <LightBulbIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analyzing for optimization opportunities...</p>
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI-Generated Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time intelligence powered by OpenAI and Anthropic
              </p>
            </div>

            {insights.length > 0 ? (
              <div className="grid gap-4">
                {insights.map((insight, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <div className="flex items-start">
                      <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {insight.message || insight.text || insight}
                        </p>
                        {insight.data && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(insight.data).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <SparklesIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Generating insights from your data...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t dark:border-gray-700">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {predictions.forecast ? predictions.forecast[predictions.forecast.length - 1]?.toFixed(0) : '-'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Predicted Value</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {anomalies.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Anomalies</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {optimizations.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Optimizations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {(confidenceLevel * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Confidence</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;