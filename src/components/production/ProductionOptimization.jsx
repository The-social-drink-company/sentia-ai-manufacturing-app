import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  BoltIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ScaleIcon,
  BeakerIcon,
  CpuChipIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';
import ChartErrorBoundary from '../charts/ChartErrorBoundary';

const ProductionOptimization = () => {
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState('all');
  const [optimizationMode, setOptimizationMode] = useState('efficiency');
  const [timeRange, setTimeRange] = useState('daily');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);

  useEffect(() => {
    const fetchOptimizationData = async () => {
      try {
        const response = await fetch(`/api/production/optimization?line=${selectedLine}&mode=${optimizationMode}&range=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setOptimizationData(data);
          setAiRecommendations(data.aiRecommendations);
        } else {
          setOptimizationData(mockOptimizationData);
          setAiRecommendations(mockOptimizationData.aiRecommendations);
        }
      } catch (error) {
        console.error('Error fetching optimization data:', error);
        setOptimizationData(mockOptimizationData);
        setAiRecommendations(mockOptimizationData.aiRecommendations);
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizationData();
    const interval = setInterval(fetchOptimizationData, 30000);
    return () => clearInterval(interval);
  }, [selectedLine, optimizationMode, timeRange]);

  const mockOptimizationData = {
    overview: {
      overallEfficiency: 89.2,
      potentialEfficiency: 94.8,
      improvementOpportunity: 5.6,
      costSavingsPotential: 145000,
      energyOptimization: 12.3,
      wasteReduction: 18.7,
      throughputIncrease: 8.4,
      qualityImprovement: 3.2
    },
    productionLines: [
      {
        id: 'line-a',
        name: 'GABA Red Production Line A',
        currentEfficiency: 92.1,
        targetEfficiency: 96.5,
        status: 'optimizing',
        bottleneck: 'mixing_station',
        optimizationPotential: 4.4,
        costSavings: 48000,
        recommendations: 3,
        lastOptimized: '2025-09-08T10:30:00Z'
      },
      {
        id: 'line-b',
        name: 'GABA Clear Production Line B',
        currentEfficiency: 87.8,
        targetEfficiency: 93.2,
        status: 'needs_attention',
        bottleneck: 'quality_check',
        optimizationPotential: 5.4,
        costSavings: 62000,
        recommendations: 5,
        lastOptimized: '2025-09-07T14:20:00Z'
      },
      {
        id: 'line-c',
        name: 'Packaging Line C',
        currentEfficiency: 88.5,
        targetEfficiency: 94.1,
        status: 'optimized',
        bottleneck: 'labeling_unit',
        optimizationPotential: 5.6,
        costSavings: 35000,
        recommendations: 2,
        lastOptimized: '2025-09-08T08:15:00Z'
      }
    ],
    bottleneckAnalysis: [
      {
        station: 'Mixing Station',
        impact: 'high',
        utilizationRate: 94.2,
        cycleTime: 18.5,
        targetCycleTime: 16.2,
        improvement: 12.4,
        priority: 1,
        estimatedCost: 25000,
        estimatedSavings: 78000,
        recommendations: ['Upgrade mixer capacity', 'Optimize recipe parameters', 'Add parallel mixing unit']
      },
      {
        station: 'Quality Check',
        impact: 'high',
        utilizationRate: 91.8,
        cycleTime: 4.2,
        targetCycleTime: 3.1,
        improvement: 26.2,
        priority: 2,
        estimatedCost: 18000,
        estimatedSavings: 52000,
        recommendations: ['Implement automated testing', 'Reduce sampling frequency', 'Add quality sensors']
      },
      {
        station: 'Labeling Unit',
        impact: 'medium',
        utilizationRate: 88.5,
        cycleTime: 2.8,
        targetCycleTime: 2.3,
        improvement: 17.9,
        priority: 3,
        estimatedCost: 12000,
        estimatedSavings: 31000,
        recommendations: ['Calibrate label applicator', 'Optimize label feed speed', 'Preventive maintenance']
      }
    ],
    efficiencyTrend: [
      { date: '2025-09-01', efficiency: 87.2, target: 92.0, throughput: 2380, downtime: 42 },
      { date: '2025-09-02', efficiency: 88.1, target: 92.0, throughput: 2420, downtime: 38 },
      { date: '2025-09-03', efficiency: 86.8, target: 92.0, throughput: 2350, downtime: 45 },
      { date: '2025-09-04', efficiency: 89.5, target: 92.0, throughput: 2480, downtime: 32 },
      { date: '2025-09-05', efficiency: 90.2, target: 92.0, throughput: 2520, downtime: 28 },
      { date: '2025-09-06', efficiency: 88.9, target: 92.0, throughput: 2390, downtime: 35 },
      { date: '2025-09-07', efficiency: 89.8, target: 92.0, throughput: 2450, downtime: 30 },
      { date: '2025-09-08', efficiency: 89.2, target: 92.0, throughput: 2410, downtime: 33 }
    ],
    optimizationScenarios: [
      {
        name: 'Conservative Optimization',
        efficiencyGain: 3.2,
        costSavings: 85000,
        implementationCost: 45000,
        paybackMonths: 6.4,
        risk: 'low',
        impact: 'medium'
      },
      {
        name: 'Aggressive Optimization',
        efficiencyGain: 6.8,
        costSavings: 178000,
        implementationCost: 95000,
        paybackMonths: 6.4,
        risk: 'medium',
        impact: 'high'
      },
      {
        name: 'AI-Driven Optimization',
        efficiencyGain: 8.4,
        costSavings: 234000,
        implementationCost: 125000,
        paybackMonths: 6.4,
        risk: 'medium',
        impact: 'very_high'
      }
    ],
    performanceMetrics: [
      { metric: 'Efficiency', current: 89.2, target: 94.8, unit: '%' },
      { metric: 'Throughput', current: 2410, target: 2600, unit: 'units/day' },
      { metric: 'Quality Rate', current: 97.8, target: 98.5, unit: '%' },
      { metric: 'Energy Usage', current: 1250, target: 1100, unit: 'kWh/day' },
      { metric: 'Waste Rate', current: 2.1, target: 1.7, unit: '%' },
      { metric: 'Setup Time', current: 18, target: 12, unit: 'min' }
    ],
    aiRecommendations: [
      {
        id: 'opt-001',
        title: 'Optimize Mixing Station Throughput',
        description: 'AI analysis suggests increasing mixer speed by 8% and adjusting recipe timing to reduce cycle time from 18.5 to 16.2 minutes',
        priority: 'high',
        impact: 'efficiency_gain',
        estimatedGain: 12.4,
        confidence: 0.94,
        implementationTime: 2,
        cost: 15000,
        savings: 78000,
        status: 'ready',
        category: 'process_optimization'
      },
      {
        id: 'opt-002',
        title: 'Implement Predictive Quality Control',
        description: 'Deploy ML-based quality prediction to reduce inspection time by 26% while maintaining quality standards',
        priority: 'high',
        impact: 'cycle_time_reduction',
        estimatedGain: 26.2,
        confidence: 0.89,
        implementationTime: 4,
        cost: 35000,
        savings: 92000,
        status: 'planning',
        category: 'automation'
      },
      {
        id: 'opt-003',
        title: 'Energy Consumption Optimization',
        description: 'Smart scheduling algorithm to optimize equipment operation during low-cost energy periods',
        priority: 'medium',
        impact: 'cost_reduction',
        estimatedGain: 18.7,
        confidence: 0.91,
        implementationTime: 3,
        cost: 22000,
        savings: 45000,
        status: 'testing',
        category: 'energy_management'
      },
      {
        id: 'opt-004',
        title: 'Automated Changeover Process',
        description: 'Implement automated product changeover to reduce setup time from 18 to 12 minutes',
        priority: 'medium',
        impact: 'downtime_reduction',
        estimatedGain: 33.3,
        confidence: 0.87,
        implementationTime: 6,
        cost: 58000,
        savings: 85000,
        status: 'approved',
        category: 'automation'
      }
    ]
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'optimizing':
        return <CogIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'optimized':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'needs_attention':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const runOptimizationSimulation = async (scenarioName) => {
    setSimulationRunning(true);
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setSimulationRunning(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = optimizationData || mockOptimizationData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Production Optimization
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AI-powered production optimization with real-time bottleneck analysis and performance improvement
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => runOptimizationSimulation('AI-Driven')}
            disabled={simulationRunning}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              simulationRunning 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {simulationRunning ? (
              <>
                <CogIcon className="h-4 w-4 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <RocketLaunchIcon className="h-4 w-4" />
                <span>Run Optimization</span>
              </>
            )}
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <SparklesIcon className="h-4 w-4" />
            <span>AI Insights</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Production Line
            </label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Lines</option>
              <option value="line-a">Line A - GABA Red</option>
              <option value="line-b">Line B - GABA Clear</option>
              <option value="line-c">Line C - Packaging</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Optimization Focus
            </label>
            <select
              value={optimizationMode}
              onChange={(e) => setOptimizationMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="efficiency">Overall Efficiency</option>
              <option value="throughput">Throughput Maximization</option>
              <option value="quality">Quality Optimization</option>
              <option value="energy">Energy Efficiency</option>
              <option value="cost">Cost Reduction</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
              <CpuChipIcon className="h-4 w-4" />
              <span>AI Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.overallEfficiency}%
              </p>
              <p className="text-sm text-blue-600">Target: {data.overview.potentialEfficiency}%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cost Savings Potential</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.overview.costSavingsPotential)}
              </p>
              <p className="text-sm text-green-600">Annual opportunity</p>
            </div>
            <BoltIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Energy Optimization</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.energyOptimization}%
              </p>
              <p className="text-sm text-yellow-600">Reduction potential</p>
            </div>
            <FireIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Throughput Increase</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.throughputIncrease}%
              </p>
              <p className="text-sm text-purple-600">Achievable gain</p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Efficiency Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Production Efficiency Trend
        </h3>
        <div className="h-80">
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.efficiencyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'efficiency' || name === 'target' ? `${value}%` :
                    name === 'throughput' ? `${value} units` :
                    `${value} min`,
                    name === 'efficiency' ? 'Efficiency' :
                    name === 'target' ? 'Target' :
                    name === 'throughput' ? 'Throughput' : 'Downtime'
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB')}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="target"
                  fill="#EF4444"
                  fillOpacity={0.1}
                  stroke="none"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="target"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Bar
                  yAxisId="right"
                  dataKey="downtime"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
        </div>
      </div>

      {/* Production Lines Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Production Line Optimization Status
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data.productionLines.map((line) => (
            <div key={line.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {line.name}
                </h4>
                {getStatusIcon(line.status)}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Efficiency</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {line.currentEfficiency}% / {line.targetEfficiency}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(line.currentEfficiency / line.targetEfficiency) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Bottleneck:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {line.bottleneck.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Potential Savings:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(line.costSavings)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">AI Recommendations:</span>
                  <span className="font-medium text-blue-600">
                    {line.recommendations} pending
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottleneck Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Bottleneck Analysis & Solutions
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current / Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Improvement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.bottleneckAnalysis.map((bottleneck, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {bottleneck.station}
                      </div>
                      <div className="text-xs text-gray-500">
                        Priority #{bottleneck.priority}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bottleneck.impact === 'high' ? 'bg-red-100 text-red-800' :
                      bottleneck.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {bottleneck.impact.charAt(0).toUpperCase() + bottleneck.impact.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-gray-900 dark:text-white">
                      {bottleneck.cycleTime}min / {bottleneck.targetCycleTime}min
                    </div>
                    <div className="text-gray-500">
                      {bottleneck.utilizationRate}% utilization
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      +{bottleneck.improvement}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(bottleneck.estimatedCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(bottleneck.estimatedSavings)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {((bottleneck.estimatedSavings / bottleneck.estimatedCost - 1) * 100).toFixed(0)}% ROI
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            AI Optimization Recommendations
          </h3>
          <SparklesIcon className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiRecommendations.map((recommendation) => (
            <div key={recommendation.id} className={`p-4 rounded-lg border ${getPriorityColor(recommendation.priority)}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">
                  {recommendation.title}
                </h4>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                  {(recommendation.confidence * 100).toFixed(0)}% confident
                </span>
              </div>
              
              <p className="text-sm mb-3 opacity-90">
                {recommendation.description}
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="font-medium">Gain:</span> +{recommendation.estimatedGain}%
                </div>
                <div>
                  <span className="font-medium">Time:</span> {recommendation.implementationTime} weeks
                </div>
                <div>
                  <span className="font-medium">Cost:</span> {formatCurrency(recommendation.cost)}
                </div>
                <div>
                  <span className="font-medium">Savings:</span> {formatCurrency(recommendation.savings)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  recommendation.status === 'ready' ? 'bg-green-100 text-green-800' :
                  recommendation.status === 'testing' ? 'bg-blue-100 text-blue-800' :
                  recommendation.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
                </span>
                
                <button className="text-xs bg-white bg-opacity-50 hover:bg-opacity-75 px-2 py-1 rounded transition-colors">
                  Implement
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductionOptimization;