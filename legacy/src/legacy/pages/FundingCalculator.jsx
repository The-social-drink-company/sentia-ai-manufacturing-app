/**
 * FUNDING CALCULATOR - ENTERPRISE LEVEL
 * Answers: "If I want to grow at X%, how much cash injection needed?"
 * 
 * CLIENT REQUIREMENTS (Matt Coulshed - September 11, 2025):
 * - Calculate funding needs for growth scenarios
 * - Support multiple funding options (overdraft, invoice finance, term loan, etc.)
 * - Show comparison of funding costs
 * - NO MOCK DATA - Real calculations only
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalculatorIcon,
  ArrowUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { Bar, Doughnut } from 'react-chartjs-2';
import { CLIENT_REQUIREMENTS } from '../config/clientRequirements';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


const FundingCalculator = () => {
  const navigate = useNavigate();
  const [growthRate, setGrowthRate] = useState(25); // Default 25% growth
  const [timeHorizon, setTimeHorizon] = useState(12); // Default 12 months
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFundingType, setSelectedFundingType] = useState('');
  
  // Real business data (NO MOCK DATA)
  const [businessData, setBusinessData] = useState({
    currentRevenue: 0,
    currentExpenses: 0,
    grossMargin: 0,
    workingCapitalCycle: 0,
    hasData: false
  });

  // Funding options from client requirements
  const fundingOptions = CLIENT_REQUIREMENTS.workingCapital.fundingOptions;

  // Calculate funding requirements
  const calculateFundingNeeds = () => {
    if (!businessData.hasData) {
      return {
        totalFundingNeeded: 0,
        workingCapitalNeeds: 0,
        expansionCosts: 0,
        cashBufferRequired: 0,
        breakdown: []
      };
    }

    const targetRevenue = businessData.currentRevenue * (1 + growthRate / 100);
    const revenueIncrease = targetRevenue - businessData.currentRevenue;
    
    // Working capital needs (based on cycle days)
    const workingCapitalNeeds = (revenueIncrease * businessData.workingCapitalCycle) / 365;
    
    // Expansion costs (hiring, equipment, etc.)
    const expansionCosts = revenueIncrease * 0.25; // 25% of revenue increase for expansion
    
    // Cash buffer (3 months of increased expenses)
    const increasedExpenses = businessData.currentExpenses * (1 + growthRate / 100);
    const cashBufferRequired = (increasedExpenses * 3) / 12;
    
    const totalFundingNeeded = workingCapitalNeeds + expansionCosts + cashBufferRequired;

    return {
      totalFundingNeeded,
      workingCapitalNeeds,
      expansionCosts,
      cashBufferRequired,
      targetRevenue,
      revenueIncrease,
      breakdown: [
        { category: 'Working Capital', amount: workingCapitalNeeds, percentage: (workingCapitalNeeds / totalFundingNeeded) * 100 },
        { category: 'Expansion Costs', amount: expansionCosts, percentage: (expansionCosts / totalFundingNeeded) * 100 },
        { category: 'Cash Buffer', amount: cashBufferRequired, percentage: (cashBufferRequired / totalFundingNeeded) * 100 }
      ]
    };
  };

  // Calculate funding costs for different options
  const calculateFundingCosts = (fundingAmount) => {
    return [
      {
        type: 'Overdraft',
        interestRate: 8.5,
        term: 'Flexible',
        totalCost: fundingAmount * 0.085,
        monthlyPayment: (fundingAmount * 0.085) / 12,
        pros: 'Flexible, quick access',
        cons: 'Higher interest rate',
        suitability: growthRate < 20 ? 'High' : 'Medium'
      },
      {
        type: 'Invoice Finance',
        interestRate: 3.5,
        term: '30-90 days',
        totalCost: fundingAmount * 0.035,
        monthlyPayment: 'Based on invoices',
        pros: 'Unlocks cash from sales',
        cons: 'Only for B2B businesses',
        suitability: businessData.workingCapitalCycle > 60 ? 'High' : 'Low'
      },
      {
        type: 'Term Loan',
        interestRate: 6.5,
        term: '3-5 years',
        totalCost: fundingAmount * 0.065 * 3,
        monthlyPayment: (fundingAmount + fundingAmount * 0.065 * 3) / 36,
        pros: 'Fixed payments, longer term',
        cons: 'Requires collateral',
        suitability: 'High'
      },
      {
        type: 'Shareholder Injection',
        interestRate: 0,
        term: 'Permanent',
        totalCost: 0,
        monthlyPayment: 0,
        pros: 'No repayment required',
        cons: 'Dilutes ownership',
        suitability: growthRate > 50 ? 'High' : 'Medium'
      },
      {
        type: 'Private Equity',
        interestRate: 0,
        term: '3-7 years',
        totalCost: 'Equity dilution',
        monthlyPayment: 0,
        pros: 'Large funding, expertise',
        cons: 'Loss of control',
        suitability: growthRate > 100 ? 'High' : 'Low'
      }
    ];
  };

  const fundingNeeds = calculateFundingNeeds();
  const fundingCosts = calculateFundingCosts(fundingNeeds.totalFundingNeeded);

  // Chart data for funding breakdown
  const breakdownChartData = {
    labels: fundingNeeds.breakdown.map(b => b.category),
    datasets: [{
      data: fundingNeeds.breakdown.map(b => b.amount),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      borderWidth: 1
    }]
  };

  const breakdownChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#4b5563' }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const percentage = fundingNeeds.breakdown[context.dataIndex].percentage;
            return `Â£${value.toLocaleString()} (${percentage.toFixed(1)}%)`;
          }
        }
      }
    }
  };

  // Chart data for funding comparison
  const comparisonChartData = {
    labels: fundingCosts.map(f => f.type),
    datasets: [
      {
        label: 'Total Cost',
        data: fundingCosts.map(f => typeof f.totalCost === 'number' ? f.totalCost : 0),
        backgroundColor: '#dc2626',
        borderWidth: 1
      },
      {
        label: 'Monthly Payment',
        data: fundingCosts.map(f => typeof f.monthlyPayment === 'number' ? f.monthlyPayment : 0),
        backgroundColor: '#3b82f6',
        borderWidth: 1
      }
    ]
  };

  const comparisonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#4b5563' }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: Â£${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `Â£${(value / 1000).toFixed(0)}k`,
          color: '#6b7280'
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
        const response = await fetch('/api/working-capital/business-metrics');
        if (response.ok) {
          const data = await response.json();
          setBusinessData({
            ...data,
            hasData: true
          });
        } else {
          // Check localStorage for imported data
          const importedData = localStorage.getItem('businessMetrics');
          if (importedData) {
            setBusinessData({
              ...JSON.parse(importedData),
              hasData: true
            });
          }
        }
      } catch (error) {
        logError('Failed to load business data:', error);
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
              â† Back to Dashboard
            </button>
            <div className="flex items-center space-x-2">
              <CalculatorIcon className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Growth Funding Calculator</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/cash-runway')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cash Runway Analysis
            </button>
            <button
              onClick={() => navigate('/working-capital-optimizer')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Optimize Working Capital
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Key Question Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h2 className="font-semibold text-green-900">
                Key Question: How much funding do I need to grow?
              </h2>
              <p className="text-green-700 mt-1">
                Calculate the exact funding requirements for your target growth rate,
                including working capital, expansion costs, and cash buffer needs.
              </p>
            </div>
          </div>
        </div>

        {!businessData.hasData ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">
                  Business Data Required
                </h3>
                <p className="text-yellow-700 mt-1">
                  Please import your business metrics to calculate funding requirements.
                  We need your current revenue, expenses, gross margin, and working capital cycle.
                </p>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => alert('Import CSV coming soon')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Import Business Data
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Connect Accounting System
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Growth Parameters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Set Your Growth Target</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Growth Rate Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Growth Rate: <span className="text-2xl font-bold text-green-600">{growthRate}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10%</span>
                    <span>50%</span>
                    <span>100%</span>
                    <span>150%</span>
                    <span>200%</span>
                  </div>
                </div>

                {/* Time Horizon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Horizon: <span className="text-2xl font-bold text-blue-600">{timeHorizon} months</span>
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="36"
                    step="6"
                    value={timeHorizon}
                    onChange={(e) => setTimeHorizon(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>6m</span>
                    <span>12m</span>
                    <span>18m</span>
                    <span>24m</span>
                    <span>36m</span>
                  </div>
                </div>
              </div>

              {/* Current vs Target Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div>
                  <div className="text-sm text-gray-500">Current Revenue</div>
                  <div className="text-xl font-bold">Â£{businessData.currentRevenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Target Revenue</div>
                  <div className="text-xl font-bold text-green-600">
                    Â£{fundingNeeds.targetRevenue.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Revenue Increase</div>
                  <div className="text-xl font-bold text-blue-600">
                    Â£{fundingNeeds.revenueIncrease.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Funding Needed</div>
                  <div className="text-xl font-bold text-red-600">
                    Â£{fundingNeeds.totalFundingNeeded.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Funding Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Breakdown Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Funding Breakdown</h3>
                <div style={{ height: '300px' }}>
                  <Doughnut data={breakdownChartData} options={breakdownChartOptions} />
                </div>
                <div className="mt-4 space-y-2">
                  {fundingNeeds.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.category}</span>
                      <span className="font-semibold">Â£{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Funding Components</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Working Capital Needs</span>
                      <ScaleIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">Â£{fundingNeeds.workingCapitalNeeds.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      To fund increased inventory and receivables
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Expansion Costs</span>
                      <ArrowUpIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">Â£{fundingNeeds.expansionCosts.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      For hiring, equipment, and infrastructure
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Cash Buffer</span>
                      <BanknotesIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">Â£{fundingNeeds.cashBufferRequired.toLocaleString()}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      3 months of operating expenses
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Funding Options Comparison */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Funding Options Comparison</h3>
              
              {/* Comparison Chart */}
              <div style={{ height: '300px' }} className="mb-6">
                <Bar data={comparisonChartData} options={comparisonChartOptions} />
              </div>

              {/* Options Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Funding Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interest Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Term
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Suitability
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fundingCosts.map((option, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{option.type}</div>
                            <div className="text-xs text-gray-500">
                              {option.pros}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {option.interestRate > 0 ? `${option.interestRate}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {option.term}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof option.totalCost === 'number' 
                            ? `Â£${option.totalCost.toLocaleString()}` 
                            : option.totalCost}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            option.suitability === 'High' 
                              ? 'bg-green-100 text-green-800'
                              : option.suitability === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {option.suitability}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedFundingType(option.type);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Details â†’
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Recommended Funding Strategy
              </h3>
              <p className="text-blue-700 mb-4">
                Based on your {growthRate}% growth target over {timeHorizon} months:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Primary Funding</h4>
                  <p className="text-gray-600">
                    {growthRate > 50 
                      ? 'Consider Private Equity or Shareholder Injection for rapid scaling'
                      : 'Term Loan provides stable funding with predictable payments'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Working Capital Support</h4>
                  <p className="text-gray-600">
                    {businessData.workingCapitalCycle > 60
                      ? 'Invoice Finance can unlock cash from your receivables'
                      : 'Overdraft facility provides flexibility for cash flow management'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => alert('Funding application coming soon')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply for Funding
                </button>
                <button
                  onClick={() => navigate('/working-capital-optimizer')}
                  className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  Optimize First
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">
              {selectedFundingType} Details
            </h3>
            {fundingCosts.find(f => f.type === selectedFundingType) && (
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Pros:</span>
                  <p className="text-gray-600">
                    {fundingCosts.find(f => f.type === selectedFundingType).pros}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Cons:</span>
                  <p className="text-gray-600">
                    {fundingCosts.find(f => f.type === selectedFundingType).cons}
                  </p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">
                    This funding option is rated as{' '}
                    <span className="font-semibold">
                      {fundingCosts.find(f => f.type === selectedFundingType).suitability}
                    </span>{' '}
                    suitability for your growth plans.
                  </p>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => alert('Application process coming soon')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundingCalculator;
