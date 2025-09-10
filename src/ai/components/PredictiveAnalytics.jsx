import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CogIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { useAI } from '../AIProvider';
import { useTheme } from '../../theming';
import { LineChart, BarChart } from '../../charts';

export const PredictiveAnalytics = ({
  className = '',
  analysisTypes = ['demand', 'quality', 'maintenance'],
  autoRun = false,
  refreshInterval = 300000, // 5 minutes
  ...props
}) => {
  const { 
    forecastDemand, 
    predictQuality, 
    predictMaintenance,
    aiServices,
    activeAnalyses,
    isAIEnabled
  } = useAI();
  const { resolvedTheme } = useTheme();
  
  const [predictions, setPredictions] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(analysisTypes[0]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(autoRun);

  // Mock data generators for demo purposes
  const generateMockHistoricalData = useCallback((type) => {
    const now = Date.now();
    const dataPoints = [];
    
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000); // Daily data for 30 days
      let value;
      
      switch (type) {
        case 'demand':
          value = Math.floor(Math.random() * 1000) + 500 + Math.sin(i * 0.2) * 200;
          break;
        case 'quality':
          value = 95 + Math.random() * 5 - Math.random() * 10;
          break;
        case 'maintenance':
          value = Math.random() * 100;
          break;
        default:
          value = Math.random() * 100;
      }
      
      dataPoints.push({
        timestamp,
        value,
        date: new Date(timestamp).toISOString().split('T')[0]
      });
    }
    
    return dataPoints;
  }, []);

  // Run predictive analysis
  const runAnalysis = useCallback(async (analysisType) => {
    if (!isAIEnabled) {
      console.warn('AI services are not enabled');
      return;
    }

    setIsRunning(true);
    
    try {
      let result;
      const historicalData = generateMockHistoricalData(analysisType);
      
      switch (analysisType) {
        case 'demand':
          result = await forecastDemand(historicalData, 14); // 14-day forecast
          break;
        case 'quality':
          result = await predictQuality(
            { temperature: 25, humidity: 60, pressure: 1013 },
            historicalData
          );
          break;
        case 'maintenance':
          result = await predictMaintenance(
            { 
              vibration: Math.random() * 10,
              temperature: 45 + Math.random() * 20,
              runtime_hours: 8760 * Math.random()
            },
            historicalData
          );
          break;
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }

      if (result.success) {
        setPredictions(prev => ({
          ...prev,
          [analysisType]: {
            ...result,
            timestamp: Date.now(),
            historicalData
          }
        }));

        setAnalysisHistory(prev => [...prev, {
          type: analysisType,
          timestamp: Date.now(),
          success: true,
          accuracy: result.metadata?.accuracy
        }].slice(-20)); // Keep last 20 analyses
      }

    } catch (error) {
      console.error(`Analysis failed for ${analysisType}:`, error);
      setAnalysisHistory(prev => [...prev, {
        type: analysisType,
        timestamp: Date.now(),
        success: false,
        error: error.message
      }].slice(-20));
    } finally {
      setIsRunning(false);
    }
  }, [isAIEnabled, forecastDemand, predictQuality, predictMaintenance, generateMockHistoricalData]);

  // Auto-refresh effect
  useEffect(() => {
    let interval;
    
    if (autoRefresh && isAIEnabled) {
      interval = setInterval(() => {
        analysisTypes.forEach(type => {
          runAnalysis(type);
        });
      }, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isAIEnabled, analysisTypes, runAnalysis, refreshInterval]);

  // Initial analysis run
  useEffect(() => {
    if (isAIEnabled && analysisTypes.length > 0) {
      runAnalysis(selectedAnalysis);
    }
  }, [isAIEnabled, selectedAnalysis]);

  const formatTrend = (trend) => {
    if (!trend) return 'Stable';
    if (trend > 5) return 'Increasing';
    if (trend < -5) return 'Decreasing';
    return 'Stable';
  };

  const getTrendIcon = (trend) => {
    if (!trend) return CheckCircleIcon;
    if (trend > 5) return ArrowTrendingUpIcon;
    if (trend < -5) return ArrowTrendingDownIcon;
    return CheckCircleIcon;
  };

  const getTrendColor = (trend) => {
    if (!trend) return 'text-gray-500';
    if (trend > 5) return 'text-green-500';
    if (trend < -5) return 'text-red-500';
    return 'text-gray-500';
  };

  const currentPrediction = predictions[selectedAnalysis];
  
  const cardClasses = `
    rounded-lg border shadow-sm
    ${resolvedTheme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
    }
  `;

  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`${cardClasses} ${className}`} {...props}>
      {/* Header */}
      <div className={`
        flex items-center justify-between p-4 border-b
        ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
      `}>
        <div className="flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2 text-blue-500" />
          <h3 className={`font-semibold ${textPrimaryClasses}`}>
            Predictive Analytics
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`
              p-1 rounded transition-colors
              ${autoRefresh 
                ? 'text-green-500 bg-green-100 dark:bg-green-900/30' 
                : 'text-gray-400 hover:text-gray-600'}
            `}
            title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            {autoRefresh ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => runAnalysis(selectedAnalysis)}
            disabled={isRunning || !isAIEnabled}
            className={`
              p-1 rounded transition-colors
              ${isRunning 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}
            `}
          >
            <CogIcon className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Analysis Type Selector */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex space-x-2">
          {analysisTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedAnalysis(type)}
              disabled={isRunning}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${selectedAnalysis === type
                  ? resolvedTheme === 'dark'
                    ? 'bg-blue-900 text-blue-200'
                    : 'bg-blue-100 text-blue-800'
                  : resolvedTheme === 'dark'
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Prediction
            </button>
          ))}
        </div>
      </div>

      {/* Prediction Results */}
      {currentPrediction ? (
        <div className="p-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${textMutedClasses}`}>Accuracy</p>
                  <p className={`text-xl font-semibold ${textPrimaryClasses}`}>
                    {currentPrediction.metadata?.accuracy ? 
                      `${Math.round(currentPrediction.metadata.accuracy * 100)}%` : 'N/A'}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${textMutedClasses}`}>Trend</p>
                  <p className={`text-xl font-semibold ${textPrimaryClasses}`}>
                    {formatTrend(currentPrediction.data?.trend)}
                  </p>
                </div>
                {React.createElement(getTrendIcon(currentPrediction.data?.trend), {
                  className: `w-8 h-8 ${getTrendColor(currentPrediction.data?.trend)}`
                })}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${textMutedClasses}`}>Confidence</p>
                  <p className={`text-xl font-semibold ${textPrimaryClasses}`}>
                    {currentPrediction.data?.confidence ? 
                      `${Math.round(currentPrediction.data.confidence * 100)}%` : 'High'}
                  </p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Prediction Chart */}
          {currentPrediction.historicalData && (
            <div className="mb-6">
              <h4 className={`text-lg font-medium mb-4 ${textPrimaryClasses}`}>
                {selectedAnalysis.charAt(0).toUpperCase() + selectedAnalysis.slice(1)} Forecast
              </h4>
              
              <LineChart
                data={{
                  labels: currentPrediction.historicalData.map(d => d.date),
                  datasets: [{
                    label: 'Historical Data',
                    data: currentPrediction.historicalData.map(d => d.value),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true
                  }]
                }}
                height={300}
                options={{
                  scales: {
                    y: {
                      beginAtZero: selectedAnalysis === 'quality' ? false : true,
                      title: {
                        display: true,
                        text: selectedAnalysis === 'demand' ? 'Units' : 
                              selectedAnalysis === 'quality' ? 'Quality Score (%)' : 'Risk Score'
                      }
                    }
                  }
                }}
              />
            </div>
          )}

          {/* AI Insights */}
          {currentPrediction.insights && currentPrediction.insights.length > 0 && (
            <div>
              <h4 className={`text-lg font-medium mb-3 ${textPrimaryClasses}`}>
                AI Insights
              </h4>
              <div className="space-y-2">
                {currentPrediction.insights.slice(0, 3).map((insight, index) => (
                  <div 
                    key={index}
                    className={`
                      p-3 rounded-lg border-l-4 border-blue-500
                      ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-blue-50'}
                    `}
                  >
                    <p className={`text-sm ${textSecondaryClasses}`}>
                      {insight.description || insight.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          {isRunning ? (
            <div>
              <CogIcon className={`w-12 h-12 mx-auto mb-3 animate-spin ${textMutedClasses}`} />
              <p className={textSecondaryClasses}>
                Running {selectedAnalysis} analysis...
              </p>
            </div>
          ) : !isAIEnabled ? (
            <div>
              <ExclamationTriangleIcon className={`w-12 h-12 mx-auto mb-3 text-yellow-500`} />
              <p className={textSecondaryClasses}>
                AI services are currently offline
              </p>
            </div>
          ) : (
            <div>
              <ChartBarIcon className={`w-12 h-12 mx-auto mb-3 ${textMutedClasses}`} />
              <p className={textSecondaryClasses}>
                No predictions available yet
              </p>
              <button
                onClick={() => runAnalysis(selectedAnalysis)}
                className={`
                  mt-3 px-4 py-2 rounded-md text-sm font-medium
                  ${resolvedTheme === 'dark'
                    ? 'bg-blue-900 text-blue-200 hover:bg-blue-800'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }
                `}
              >
                Run Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analysis History Footer */}
      {analysisHistory.length > 0 && (
        <div className={`
          px-4 py-3 border-t text-xs ${textMutedClasses}
          ${resolvedTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'}
        `}>
          <div className="flex justify-between items-center">
            <span>
              Last {analysisHistory.length} analyses: {' '}
              {analysisHistory.filter(a => a.success).length} successful
            </span>
            <span>
              {autoRefresh && `Auto-refresh: ${Math.floor(refreshInterval / 60000)}min`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalytics;