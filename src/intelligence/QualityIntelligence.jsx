import React, { useState, useEffect, useMemo } from 'react';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  DocumentMagnifyingGlassIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useAI } from '../ai';
import { useRealtime } from '../realtime/RealtimeProvider';
import { useTheme } from '../theming';

export const QualityIntelligence = ({
  className = '',
  timeRange = '24h',
  autoAnalysis = true,
  ...props
}) => {
  const { performAIAnalysis, isLoading: aiLoading } = useAI();
  const { 
    dataStreams, 
    subscribe, 
    STREAM_TYPES 
  } = useRealtime();
  const { resolvedTheme } = useTheme();

  // Quality data states
  const [qualityMetrics, setQualityMetrics] = useState({});
  const [defectAnalysis, setDefectAnalysis] = useState([]);
  const [qualityTrends, setQualityTrends] = useState([]);
  const [spcData, setSpcData] = useState({}); // Statistical Process Control
  const [qualityAlerts, setQualityAlerts] = useState([]);
  const [correctionActions, setCorrectionActions] = useState([]);
  const [batchAnalysis, setBatchAnalysis] = useState({});
  const [selectedView, setSelectedView] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Quality standards and limits
  const QUALITY_STANDARDS = {
    firstPassYield: { target: 99.5, warning: 98, critical: 95 },
    defectRate: { target: 0.5, warning: 1.0, critical: 2.0 },
    cpk: { target: 1.33, warning: 1.0, critical: 0.67 }, // Process capability index
    scrapRate: { target: 0.5, warning: 1.0, critical: 2.0 },
    reworkRate: { target: 1.0, warning: 2.0, critical: 5.0 },
    customerComplaints: { target: 0.1, warning: 0.5, critical: 1.0 }
  };

  // Subscribe to quality data streams
  useEffect(() => {
    const unsubscriber = subscribe(STREAM_TYPES.QUALITY_DATA, (data) => {
      updateQualityMetrics(data);
      
      if (autoAnalysis) {
        performQualityAnalysis(data);
      }
    });

    return unsubscriber;
  }, [subscribe, STREAM_TYPES, autoAnalysis]);

  // Update quality metrics
  const updateQualityMetrics = (data) => {
    setQualityMetrics(prev => ({
      ...prev,
      ...data,
      timestamp: Date.now()
    }));

    // Update trends
    setQualityTrends(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        firstPassYield: data.firstPassYield,
        defectRate: data.defectRate,
        scrapRate: data.scrapRate
      }
    ].slice(-100)); // Keep last 100 data points
  };

  // Perform AI-powered quality analysis
  const performQualityAnalysis = async (data = qualityMetrics) => {
    setIsAnalyzing(true);

    try {
      // Simulate AI analysis for quality data
      const analysis = await analyzeQualityPatterns(data);
      
      setDefectAnalysis(analysis.defectPatterns || []);
      setSpcData(analysis.spcAnalysis || {});
      setQualityAlerts(analysis.alerts || []);
      setCorrectionActions(analysis.recommendations || []);
      setBatchAnalysis(analysis.batchAnalysis || {});

    } catch (error) {
      console.error('Quality analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze quality patterns (simulated AI analysis)
  const analyzeQualityPatterns = async (data) => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const analysis = {
      defectPatterns: [
        {
          type: 'dimensional',
          frequency: 45,
          trend: 'increasing',
          rootCause: 'Tool wear on Station 3',
          severity: 'high',
          affectedProducts: ['Product A', 'Product B']
        },
        {
          type: 'surface_finish',
          frequency: 28,
          trend: 'stable',
          rootCause: 'Coolant contamination',
          severity: 'medium',
          affectedProducts: ['Product C']
        },
        {
          type: 'assembly',
          frequency: 12,
          trend: 'decreasing',
          rootCause: 'Improved training program',
          severity: 'low',
          affectedProducts: ['Product D']
        }
      ],
      spcAnalysis: {
        processCapability: {
          cp: 1.25,
          cpk: 1.18,
          pp: 1.22,
          ppk: 1.15
        },
        controlLimits: {
          ucl: 2.5, // Upper Control Limit
          lcl: 0.1, // Lower Control Limit
          centerline: 1.2
        },
        outOfControlPoints: [
          { timestamp: Date.now() - 3600000, value: 2.8, rule: 'Point beyond UCL' },
          { timestamp: Date.now() - 7200000, value: 2.6, rule: 'Two of three consecutive points' }
        ]
      },
      alerts: [
        {
          id: 'alert-001',
          type: 'process_drift',
          severity: 'high',
          message: 'Process showing upward drift in defect rate',
          timestamp: Date.now(),
          actionRequired: true
        },
        {
          id: 'alert-002',
          type: 'capability_warning',
          severity: 'medium',
          message: 'Process capability index below 1.33 threshold',
          timestamp: Date.now() - 1800000,
          actionRequired: false
        }
      ],
      recommendations: [
        {
          id: 'action-001',
          priority: 'high',
          action: 'Replace cutting tools on Station 3',
          impact: 'Reduce dimensional defects by 60%',
          timeline: '2 hours',
          cost: '$450'
        },
        {
          id: 'action-002',
          priority: 'medium',
          action: 'Schedule coolant system maintenance',
          impact: 'Improve surface finish quality',
          timeline: '4 hours',
          cost: '$280'
        }
      ],
      batchAnalysis: {
        batchesAnalyzed: 24,
        conformingBatches: 22,
        nonConformingBatches: 2,
        averageYield: 98.7,
        topDefects: ['Dimensional tolerance', 'Surface roughness', 'Missing feature']
      }
    };

    return analysis;
  };

  // Calculate quality score
  const calculateQualityScore = () => {
    const fpy = qualityMetrics.firstPassYield || 98.5;
    const defects = qualityMetrics.defectRate || 1.2;
    const scrap = qualityMetrics.scrapRate || 0.8;
    
    // Weighted quality score calculation
    const score = (fpy * 0.5) + ((100 - defects) * 0.3) + ((100 - scrap) * 0.2);
    return Math.min(100, Math.max(0, score));
  };

  // Get metric status
  const getMetricStatus = (metric, value) => {
    const standard = QUALITY_STANDARDS[metric];
    if (!standard) return 'unknown';

    const isLowerBetter = ['defectRate', 'scrapRate', 'reworkRate', 'customerComplaints'].includes(metric);
    
    if (isLowerBetter) {
      if (value <= standard.target) return 'excellent';
      if (value <= standard.warning) return 'good';
      if (value <= standard.critical) return 'warning';
      return 'critical';
    } else {
      if (value >= standard.target) return 'excellent';
      if (value >= standard.warning) return 'good';
      if (value >= standard.critical) return 'warning';
      return 'critical';
    }
  };

  // Generate SPC chart data
  const spcChartData = useMemo(() => {
    if (!spcData.controlLimits) return null;

    return {
      labels: qualityTrends.map((_, index) => `Point ${index + 1}`),
      datasets: [
        {
          label: 'Defect Rate',
          data: qualityTrends.map(point => point.defectRate),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        },
        {
          label: 'Upper Control Limit',
          data: new Array(qualityTrends.length).fill(spcData.controlLimits.ucl),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          pointRadius: 0
        },
        {
          label: 'Lower Control Limit',
          data: new Array(qualityTrends.length).fill(spcData.controlLimits.lcl),
          borderColor: 'rgb(239, 68, 68)',
          borderDash: [5, 5],
          pointRadius: 0
        },
        {
          label: 'Center Line',
          data: new Array(qualityTrends.length).fill(spcData.controlLimits.centerline),
          borderColor: 'rgb(34, 197, 94)',
          borderDash: [10, 5],
          pointRadius: 0
        }
      ]
    };
  }, [qualityTrends, spcData]);

  // Format metric value
  const formatMetric = (value, type) => {
    if (typeof value !== 'number') return 'N/A';
    
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rate':
        return `${value.toFixed(2)}`;
      case 'count':
        return Math.round(value);
      default:
        return value.toFixed(2);
    }
  };

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
    <div className={`space-y-6 ${className}`} {...props}>
      {/* Header */}
      <div className={cardClasses}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BeakerIcon className="w-6 h-6 mr-3 text-green-600" />
              <h2 className={`text-xl font-semibold ${textPrimaryClasses}`}>
                Quality Intelligence System
              </h2>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {calculateQualityScore().toFixed(1)}
                </div>
                <div className={`text-sm ${textMutedClasses}`}>
                  Quality Score
                </div>
              </div>
              
              <button
                onClick={() => performQualityAnalysis()}
                disabled={isAnalyzing}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${isAnalyzing
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                    : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                  }
                `}
              >
                {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['overview', 'spc', 'defects', 'batch', 'actions'].map(view => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${selectedView === view
                    ? 'bg-white shadow text-green-600 dark:bg-gray-800 dark:text-green-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                  }
                `}
              >
                {view.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quality Metrics */}
          {[
            { key: 'firstPassYield', label: 'First Pass Yield', value: qualityMetrics.firstPassYield || 98.5, format: 'percentage' },
            { key: 'defectRate', label: 'Defect Rate', value: qualityMetrics.defectRate || 1.2, format: 'percentage' },
            { key: 'scrapRate', label: 'Scrap Rate', value: qualityMetrics.scrapRate || 0.8, format: 'percentage' },
            { key: 'reworkRate', label: 'Rework Rate', value: qualityMetrics.reworkRate || 2.1, format: 'percentage' }
          ].map(metric => {
            const status = getMetricStatus(metric.key, metric.value);
            const statusColors = {
              excellent: 'text-green-600 bg-green-100 dark:bg-green-900/30',
              good: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
              warning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
              critical: 'text-red-600 bg-red-100 dark:bg-red-900/30'
            };

            return (
              <div key={metric.key} className={cardClasses}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-medium ${textSecondaryClasses}`}>
                      {metric.label}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors.critical}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatMetric(metric.value, metric.format)}
                  </div>
                  
                  <div className={`text-xs mt-1 ${textMutedClasses}`}>
                    Target: {formatMetric(QUALITY_STANDARDS[metric.key]?.target, metric.format)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SPC View */}
      {selectedView === 'spc' && spcChartData && (
        <div className={cardClasses}>
          <div className="p-6">
            <h3 className={`text-lg font-semibold mb-4 ${textPrimaryClasses}`}>
              Statistical Process Control
            </h3>
            <div className="h-80">
              {/* Chart component temporarily disabled - integration pending */}
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <ChartPieIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className={textSecondaryClasses}>SPC Chart Visualization</p>
                  <p className={`text-sm ${textMutedClasses}`}>Chart.js integration pending</p>
                </div>
              </div>
            </div>

            {/* Process Capability */}
            {spcData.processCapability && (
              <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {spcData.processCapability.cp.toFixed(2)}
                  </div>
                  <div className={`text-sm ${textMutedClasses}`}>Cp</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {spcData.processCapability.cpk.toFixed(2)}
                  </div>
                  <div className={`text-sm ${textMutedClasses}`}>Cpk</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {spcData.processCapability.pp.toFixed(2)}
                  </div>
                  <div className={`text-sm ${textMutedClasses}`}>Pp</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {spcData.processCapability.ppk.toFixed(2)}
                  </div>
                  <div className={`text-sm ${textMutedClasses}`}>Ppk</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Defect Analysis */}
      {selectedView === 'defects' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={cardClasses}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${textPrimaryClasses}`}>
                Defect Pattern Analysis
              </h3>
              
              <div className="space-y-4">
                {defectAnalysis.map((defect, index) => (
                  <div key={index} className={`
                    p-4 rounded-lg border-l-4
                    ${defect.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      defect.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-green-500 bg-green-50 dark:bg-green-900/20'
                    }
                  `}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-medium ${textPrimaryClasses}`}>
                        {defect.type.replace('_', ' ').toUpperCase()} Defects
                      </h4>
                      <div className="flex items-center">
                        {defect.trend === 'increasing' ? (
                          <ArrowTrendingUpIcon className="w-4 h-4 text-red-500 mr-1" />
                        ) : defect.trend === 'decreasing' ? (
                          <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1 rotate-180" />
                        ) : (
                          <div className="w-4 h-4 bg-gray-400 rounded mr-1" />
                        )}
                        <span className={`text-sm ${textSecondaryClasses}`}>
                          {defect.frequency} cases
                        </span>
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-2 ${textSecondaryClasses}`}>
                      Root Cause: {defect.rootCause}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {defect.affectedProducts.map(product => (
                        <span key={product} className={`
                          text-xs px-2 py-1 rounded bg-blue-100 text-blue-800
                          dark:bg-blue-900/30 dark:text-blue-400
                        `}>
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quality Alerts */}
          <div className={cardClasses}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${textPrimaryClasses}`}>
                Active Quality Alerts
              </h3>
              
              <div className="space-y-3">
                {qualityAlerts.map(alert => (
                  <div key={alert.id} className={`
                    p-3 rounded-lg flex items-start
                    ${alert.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20' :
                      alert.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                      'bg-blue-50 dark:bg-blue-900/20'
                    }
                  `}>
                    <ExclamationTriangleIcon className={`
                      w-5 h-5 mr-3 mt-0.5
                      ${alert.severity === 'high' ? 'text-red-500' :
                        alert.severity === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                      }
                    `} />
                    <div className="flex-1">
                      <p className={`font-medium ${textPrimaryClasses}`}>
                        {alert.message}
                      </p>
                      <p className={`text-sm ${textMutedClasses}`}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                      {alert.actionRequired && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mt-2 inline-block dark:bg-red-900/30 dark:text-red-400">
                          Action Required
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other views would be implemented here */}
    </div>
  );
};

export default QualityIntelligence;