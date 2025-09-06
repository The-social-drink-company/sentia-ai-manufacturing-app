import { devLog } from '../lib/devLog.js';\nimport React, { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon, LightBulbIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { intelligenceService } from '../../services/intelligenceService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const IntelligentKPICard = ({ 
  metric, 
  historicalData = [], 
  refreshInterval = 30000,
  showPrediction = true,
  showInsights = true,
  showAnomalies = true,
  interactive = true
}) => {
  const [prediction, setPrediction] = useState(null);
  const [insights, setInsights] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    analyzeMetric();
    const interval = setInterval(analyzeMetric, refreshInterval);
    return () => clearInterval(interval);
  }, [metric, historicalData]);

  const analyzeMetric = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Get AI-powered analytics
      const [trendAnalysis, anomalyDetection, metricInsights] = await Promise.all([
        showPrediction ? intelligenceService.predictTrends(historicalData, { horizon: 7 }) : null,
        showAnomalies ? intelligenceService.detectAnomalies([metric]) : null,
        showInsights ? intelligenceService.generateDashboardInsights({ metric, history: historicalData }) : null
      ]);

      if (trendAnalysis) {
        setPrediction(trendAnalysis.forecast);
        setAiAnalysis(trendAnalysis);
      }
      
      if (anomalyDetection && anomalyDetection.detected.length > 0) {
        setAnomalies(anomalyDetection.detected);
      }
      
      if (metricInsights) {
        setInsights([
          ...metricInsights.critical,
          ...metricInsights.opportunities,
          ...metricInsights.recommendations
        ].slice(0, 3));
      }
    } catch (error) {
      devLog.error('Failed to analyze metric:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (!metric.trend) return null;
    
    const trendValue = parseFloat(metric.trend);
    if (trendValue > 0) {
      return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
    } else if (trendValue < 0) {
      return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
    }
    return null;
  };

  const getStatusColor = () => {
    if (anomalies.length > 0) return 'border-red-500';
    if (metric.status === 'good') return 'border-green-500';
    if (metric.status === 'warning') return 'border-yellow-500';
    return 'border-gray-300';
  };

  const formatValue = (value) => {
    if (typeof value === 'number') {
      if (metric.format === 'currency') {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(value);
      }
      if (metric.format === 'percentage') {
        return `${(value * 100).toFixed(1)}%`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const chartData = {
    labels: historicalData.map(d => d.date || d.label || ''),
    datasets: [
      {
        label: 'Actual',
        data: historicalData.map(d => d.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      ...(prediction ? [{
        label: 'Prediction',
        data: [...Array(historicalData.length - 1).fill(null), 
               historicalData[historicalData.length - 1]?.value,
               ...prediction],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderDash: [5, 5],
        tension: 0.4
      }] : [])
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showPrediction,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: metric.beginAtZero !== false,
      },
    },
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${getStatusColor()} transition-all duration-300 hover:shadow-xl`}>
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {metric.name}
            </h3>
            {isLoading && (
              <SparklesIcon className="h-5 w-5 text-blue-500 animate-pulse" />
            )}
          </div>
          {anomalies.length > 0 && (
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 animate-bounce" />
          )}
        </div>
      </div>

      {/* Main Value Display */}
      <div className="p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatValue(metric.value)}
          </div>
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            {metric.trend && (
              <span className={`text-sm font-medium ${
                parseFloat(metric.trend) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend}%
              </span>
            )}
          </div>
        </div>

        {/* Chart */}
        {historicalData.length > 0 && (
          <div className="h-32 mb-4">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {/* AI Insights */}
        {showInsights && insights.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <LightBulbIcon className="h-4 w-4 mr-1" />
                AI Insights
              </h4>
              {insights.length > 2 && (
                <button
                  onClick={() => setExpandedInsights(!expandedInsights)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {expandedInsights ? 'Show less' : `Show all (${insights.length})`}
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              {(expandedInsights ? insights : insights.slice(0, 2)).map((insight, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded flex items-start"
                >
                  <span className={`inline-block w-1 h-1 rounded-full mr-2 mt-1 ${
                    insight.priority === 'critical' ? 'bg-red-500' :
                    insight.type === 'opportunity' ? 'bg-green-500' :
                    'bg-blue-500'
                  }`} />
                  {insight.message || insight.text || insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomaly Alert */}
        {showAnomalies && anomalies.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Anomaly Detected
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {anomalies[0].message || 'Unusual pattern detected in this metric'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Summary */}
        {showPrediction && prediction && aiAnalysis && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
              Next 7 days forecast
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                {formatValue(prediction[prediction.length - 1])}
              </span>
              {aiAnalysis.confidence && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {(aiAnalysis.confidence * 100).toFixed(0)}% confidence
                </span>
              )}
            </div>
          </div>
        )}

        {/* Interactive Actions */}
        {interactive && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => analyzeMetric()}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh Analysis
            </button>
            <button
              onClick={() => {
                // Open detailed view
                devLog.log('Open detailed view for', metric.name);
              }}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100"
            >
              View Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentKPICard;