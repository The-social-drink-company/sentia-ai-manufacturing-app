/**
 * WORKING CAPITAL OPTIMIZER - ENTERPRISE LEVEL
 * Optimizes working capital efficiency through DPO, DSO, DIO analysis
 * 
 * CLIENT REQUIREMENTS (Matt Coulshed - September 11, 2025):
 * - Analyze Days Payable Outstanding (DPO)
 * - Analyze Days Sales Outstanding (DSO)
 * - Analyze Days Inventory Outstanding (DIO)
 * - Calculate Cash Conversion Cycle
 * - Provide optimization recommendations
 * - NO MOCK DATA - Real calculations only
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChartPieIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Radar, Bar, Line } from 'react-chartjs-2';
import { CLIENT_REQUIREMENTS } from '../config/clientRequirements';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


const WorkingCapitalOptimizer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [optimizationScenario, setOptimizationScenario] = useState('balanced');
  
  // Real working capital metrics (NO MOCK DATA)
  const [metrics, setMetrics] = useState({
    dso: 0, // Days Sales Outstanding
    dpo: 0, // Days Payable Outstanding
    dio: 0, // Days Inventory Outstanding
    revenue: 0,
    cogs: 0,
    inventory: 0,
    receivables: 0,
    payables: 0,
    hasData: false
  });

  // Calculate Cash Conversion Cycle
  const calculateCCC = () => {
    if (!metrics.hasData) return 0;
    return metrics.dso + metrics.dio - metrics.dpo;
  };

  // Calculate working capital amount
  const calculateWorkingCapital = () => {
    if (!metrics.hasData) return 0;
    return metrics.receivables + metrics.inventory - metrics.payables;
  };

  // Calculate optimization opportunities
  const calculateOptimizations = () => {
    if (!metrics.hasData) {
      return {
        potential: 0,
        recommendations: [],
        scenarios: []
      };
    }

    const currentCCC = calculateCCC();
    const currentWC = calculateWorkingCapital();
    const dailyRevenue = metrics.revenue / 365;

    // Industry benchmarks (customize per client industry)
    const benchmarks = {
      dso: 45, // Industry average DSO
      dpo: 60, // Industry average DPO
      dio: 30  // Industry average DIO
    };

    const recommendations = [];
    let potentialSavings = 0;

    // DSO Optimization
    if (metrics.dso > benchmarks.dso) {
      const reduction = metrics.dso - benchmarks.dso;
      const savings = reduction * dailyRevenue;
      potentialSavings += savings;
      recommendations.push({
        metric: 'DSO',
        current: metrics.dso,
        target: benchmarks.dso,
        impact: savings,
        actions: [
          'Implement automated invoicing',
          'Offer early payment discounts (2/10 net 30)',
          'Improve credit control processes',
          'Use invoice factoring for large receivables'
        ]
      });
    }

    // DPO Optimization
    if (metrics.dpo < benchmarks.dpo) {
      const extension = benchmarks.dpo - metrics.dpo;
      const benefit = extension * (metrics.cogs / 365);
      potentialSavings += benefit;
      recommendations.push({
        metric: 'DPO',
        current: metrics.dpo,
        target: benchmarks.dpo,
        impact: benefit,
        actions: [
          'Negotiate extended payment terms',
          'Optimize payment scheduling',
          'Use supply chain finance',
          'Centralize procurement'
        ]
      });
    }

    // DIO Optimization
    if (metrics.dio > benchmarks.dio) {
      const reduction = metrics.dio - benchmarks.dio;
      const savings = reduction * (metrics.cogs / 365);
      potentialSavings += savings;
      recommendations.push({
        metric: 'DIO',
        current: metrics.dio,
        target: benchmarks.dio,
        impact: savings,
        actions: [
          'Implement JIT inventory management',
          'Improve demand forecasting',
          'Reduce safety stock levels',
          'Optimize SKU portfolio'
        ]
      });
    }

    // Generate optimization scenarios
    const scenarios = [
      {
        name: 'Conservative',
        dso: metrics.dso - 5,
        dpo: metrics.dpo + 5,
        dio: metrics.dio - 3,
        ccc: (metrics.dso - 5) + (metrics.dio - 3) - (metrics.dpo + 5),
        impact: potentialSavings * 0.3
      },
      {
        name: 'Balanced',
        dso: Math.min(metrics.dso, benchmarks.dso),
        dpo: Math.max(metrics.dpo, benchmarks.dpo),
        dio: Math.min(metrics.dio, benchmarks.dio),
        ccc: benchmarks.dso + benchmarks.dio - benchmarks.dpo,
        impact: potentialSavings * 0.6
      },
      {
        name: 'Aggressive',
        dso: benchmarks.dso - 5,
        dpo: benchmarks.dpo + 10,
        dio: benchmarks.dio - 5,
        ccc: (benchmarks.dso - 5) + (benchmarks.dio - 5) - (benchmarks.dpo + 10),
        impact: potentialSavings
      }
    ];

    return {
      potential: potentialSavings,
      recommendations,
      scenarios,
      benchmarks
    };
  };

  const optimizations = calculateOptimizations();
  const currentCCC = calculateCCC();
  const workingCapital = calculateWorkingCapital();

  // Radar chart for metrics comparison
  const radarData = {
    labels: ['DSO', 'DPO', 'DIO'],
    datasets: [
      {
        label: 'Current',
        data: [metrics.dso, metrics.dpo, metrics.dio],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        borderWidth: 2
      },
      {
        label: 'Industry Benchmark',
        data: optimizations.benchmarks ? [
          optimizations.benchmarks.dso,
          optimizations.benchmarks.dpo,
          optimizations.benchmarks.dio
        ] : [45, 60, 30],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        borderWidth: 2
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#4b5563' }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: { color: '#6b7280' },
        grid: { color: '#e5e7eb' },
        pointLabels: { color: '#374151', font: { size: 12 } }
      }
    }
  };

  // Bar chart for scenario comparison
  const scenarioData = {
    labels: optimizations.scenarios.map(s => s.name),
    datasets: [
      {
        label: 'Cash Conversion Cycle (Days)',
        data: optimizations.scenarios.map(s => s.ccc),
        backgroundColor: ['#fbbf24', '#3b82f6', '#dc2626'],
        borderWidth: 1
      }
    ]
  };

  const scenarioOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} days`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value} days`,
          color: '#6b7280'
        },
        title: {
          display: true,
          text: 'Cash Conversion Cycle',
          color: '#4b5563'
        }
      },
      x: {
        ticks: { color: '#6b7280' }
      }
    }
  };

  // Load real data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Try to fetch from API
        const response = await fetch('/api/working-capital/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics({
            ...data,
            hasData: true
          });
        } else {
          // Check localStorage for imported data
          const importedData = localStorage.getItem('workingCapitalMetrics');
          if (importedData) {
            setMetrics({
              ...JSON.parse(importedData),
              hasData: true
            });
          }
        }
      } catch (error) {
        logError('Failed to load working capital metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Working Capital Optimizer</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/cash-runway')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cash Runway
            </button>
            <button
              onClick={() => navigate('/funding-calculator')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Funding Calculator
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Optimization Goal Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <LightBulbIcon className="w-6 h-6 text-indigo-600 mt-1" />
            <div>
              <h2 className="font-semibold text-indigo-900">
                Optimize Your Cash Conversion Cycle
              </h2>
              <p className="text-indigo-700 mt-1">
                Reduce your working capital requirements by optimizing payment terms,
                collection processes, and inventory management.
              </p>
            </div>
          </div>
        </div>

        {!metrics.hasData ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">
                  Working Capital Data Required
                </h3>
                <p className="text-yellow-700 mt-1">
                  Please import your working capital metrics (DSO, DPO, DIO) to analyze optimization opportunities.
                  Connect your accounting system or import a CSV file.
                </p>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => alert('Import CSV coming soon')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Import Metrics CSV
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Connect Xero/QuickBooks
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Current Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* DSO Card */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">DSO</span>
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics.dso}</div>
                <div className="text-xs text-gray-500">days to collect</div>
                {metrics.dso > 45 && (
                  <div className="mt-2 text-xs text-red-600 font-medium">
                    ↑ Above benchmark
                  </div>
                )}
              </div>

              {/* DPO Card */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">DPO</span>
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics.dpo}</div>
                <div className="text-xs text-gray-500">days to pay</div>
                {metrics.dpo < 60 && (
                  <div className="mt-2 text-xs text-yellow-600 font-medium">
                    ↓ Could extend
                  </div>
                )}
              </div>

              {/* DIO Card */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">DIO</span>
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics.dio}</div>
                <div className="text-xs text-gray-500">days in inventory</div>
                {metrics.dio > 30 && (
                  <div className="mt-2 text-xs text-red-600 font-medium">
                    ↑ Above benchmark
                  </div>
                )}
              </div>

              {/* CCC Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-indigo-600">CCC</span>
                  <ArrowPathIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-indigo-600">{currentCCC}</div>
                <div className="text-xs text-gray-500">cash cycle days</div>
              </div>

              {/* Working Capital Card */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Working Capital</span>
                  <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  £{(workingCapital / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-gray-500">tied up</div>
              </div>
            </div>

            {/* Optimization Potential */}
            {optimizations.potential > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      Optimization Potential Identified
                    </h3>
                    <p className="text-green-700 mt-1">
                      You could free up to <span className="font-bold text-2xl">£{optimizations.potential.toLocaleString()}</span> in working capital
                    </p>
                  </div>
                  <button
                    onClick={() => setShowScenarioModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    View Scenarios
                  </button>
                </div>
              </div>
            )}

            {/* Analysis Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Metrics Comparison Radar */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Metrics vs Benchmark</h3>
                <div style={{ height: '300px' }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>

              {/* Scenario Comparison */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Optimization Scenarios</h3>
                <div style={{ height: '300px' }}>
                  <Bar data={scenarioData} options={scenarioOptions} />
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>
              <div className="space-y-4">
                {optimizations.recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold text-gray-900">
                          Optimize {rec.metric}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({rec.current} days → {rec.target} days)
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Potential Impact</div>
                        <div className="font-semibold text-green-600">
                          £{rec.impact.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Action Items:</div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {rec.actions.map((action, actionIdx) => (
                          <li key={actionIdx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Implementation Roadmap */}
              <div className="mt-6 border-t pt-6">
                <h4 className="font-semibold mb-3">Implementation Roadmap</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium text-gray-900">Month 1-2</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Quick wins: Payment terms negotiation, invoice automation
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium text-gray-900">Month 3-4</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Process improvements: Credit control, inventory optimization
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium text-gray-900">Month 5-6</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Technology implementation: ERP integration, automated forecasting
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Scenario Modal */}
      {showScenarioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Optimization Scenarios</h3>
            
            <div className="space-y-4">
              {optimizations.scenarios.map((scenario, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    optimizationScenario === scenario.name.toLowerCase()
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setOptimizationScenario(scenario.name.toLowerCase())}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {optimizationScenario === scenario.name.toLowerCase() && (
                        <CheckCircleIcon className="w-5 h-5 text-indigo-600" />
                      )}
                      <span className="font-semibold">{scenario.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Cash Freed</div>
                      <div className="font-bold text-green-600">
                        £{scenario.impact.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">DSO:</span>
                      <span className="ml-1 font-medium">{scenario.dso} days</span>
                    </div>
                    <div>
                      <span className="text-gray-500">DPO:</span>
                      <span className="ml-1 font-medium">{scenario.dpo} days</span>
                    </div>
                    <div>
                      <span className="text-gray-500">DIO:</span>
                      <span className="ml-1 font-medium">{scenario.dio} days</span>
                    </div>
                    <div>
                      <span className="text-gray-500">CCC:</span>
                      <span className="ml-1 font-medium">{scenario.ccc} days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowScenarioModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Implementing ${optimizationScenario} scenario...`);
                  setShowScenarioModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Implement {optimizationScenario}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkingCapitalOptimizer;