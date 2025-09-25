/**
 * CASH RUNWAY CALCULATOR - ENTERPRISE LEVEL
 * Answers: "How much cash in the bank do I need for 30/60/90/120/180 days?"
 * 
 * CLIENT REQUIREMENTS (Matt Coulshed - September 11, 2025):
 * - Show cash requirements for next 30, 60, 90, 120, 180 days
 * - Include all incoming (AR, revenue) and outgoing (AP, expenses)
 * - Calculate cash burn rate and runway
 * - Identify funding gaps
 * - NO MOCK DATA - Real calculations only
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Line, Bar } from 'react-chartjs-2';
import { CLIENT_REQUIREMENTS } from '../config/clientRequirements';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


const CashRunway = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState(90);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Real data state (NO MOCK DATA)
  const [cashData, setCashData] = useState({
    currentCash: 0,
    monthlyBurn: 0,
    monthlyRevenue: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    hasData: false
  });

  // Projection periods from client requirements
  const projectionPeriods = CLIENT_REQUIREMENTS.workingCapital.projectionPeriods;

  // Calculate cash runway projections
  const calculateProjections = () => {
    if (!cashData.hasData) {
      return projectionPeriods.map(days => ({
        period: days,
        cashRequired: 0,
        cashAvailable: 0,
        fundingGap: 0,
        status: 'no-data'
      }));
    }

    const dailyBurn = cashData.monthlyBurn / 30;
    const dailyRevenue = cashData.monthlyRevenue / 30;
    const netDaily = dailyRevenue - dailyBurn;

    return projectionPeriods.map(days => {
      const totalExpenses = dailyBurn * days;
      const totalRevenue = dailyRevenue * days;
      const arCollection = (cashData.accountsReceivable * days) / 90; // Assume 90 day terms
      const apPayments = (cashData.accountsPayable * days) / 60; // Assume 60 day terms
      
      const cashRequired = totalExpenses + apPayments;
      const cashAvailable = cashData.currentCash + totalRevenue + arCollection;
      const fundingGap = Math.max(0, cashRequired - cashAvailable);
      
      return {
        period: days,
        cashRequired,
        cashAvailable,
        fundingGap,
        status: fundingGap > 0 ? 'funding-needed' : 'sufficient',
        details: {
          totalExpenses,
          totalRevenue,
          arCollection,
          apPayments,
          netCashFlow: totalRevenue - totalExpenses
        }
      };
    });
  };

  const projections = calculateProjections();
  const selectedProjection = projections.find(p => p.period === selectedPeriod) || projections[2];

  // Chart data for cash flow visualization
  const chartData = {
    labels: projectionPeriods.map(d => `${d} days`),
    datasets: [
      {
        label: 'Cash Required',
        data: projections.map(p => p.cashRequired),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4
      },
      {
        label: 'Cash Available',
        data: projections.map(p => p.cashAvailable),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        tension: 0.4
      },
      {
        label: 'Funding Gap',
        data: projections.map(p => p.fundingGap),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        borderDash: [5, 5]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#4b5563' }
      },
      title: {
        display: true,
        text: 'Cash Runway Projections',
        color: '#111827',
        font: { size: 16, weight: 'bold' }
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
        },
        title: {
          display: true,
          text: 'Amount (GBP)',
          color: '#4b5563'
        }
      },
      x: {
        ticks: { color: '#6b7280' },
        title: {
          display: true,
          text: 'Projection Period',
          color: '#4b5563'
        }
      }
    }
  };

  // Load real data (from API or localStorage)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Try to fetch from API
        const response = await fetch('/api/working-capital/cash-runway');
        if (response.ok) {
          const data = await response.json();
          setCashData({
            ...data,
            hasData: true
          });
        } else {
          // Check localStorage for imported data
          const importedData = localStorage.getItem('cashRunwayData');
          if (importedData) {
            setCashData({
              ...JSON.parse(importedData),
              hasData: true
            });
          }
        }
      } catch (error) {
        logError('Failed to load cash runway data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // CSV Import handler
  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // Parse CSV and update cashData
      // This is a simplified implementation
      alert('CSV import processing... (implement full parser)');
      setShowImportModal(false);
    };
    reader.readAsText(file);
  };

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
              <ClockIcon className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Cash Runway Calculator</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => navigate('/funding-calculator')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Calculate Funding Needs
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Key Question Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <BanknotesIcon className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h2 className="font-semibold text-blue-900">
                Key Question: How much cash do I need in the bank?
              </h2>
              <p className="text-blue-700 mt-1">
                Calculate your cash requirements for the next 30, 60, 90, 120, or 180 days,
                taking into account all incoming revenue and outgoing expenses.
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Projection Period</h3>
          <div className="grid grid-cols-5 gap-3">
            {projectionPeriods.map(days => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPeriod === days
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl font-bold">{days}</div>
                <div className="text-sm text-gray-500">days</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Status */}
        {!cashData.hasData ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">
                  No Data Available
                </h3>
                <p className="text-yellow-700 mt-1">
                  Please import your financial data via CSV or connect your accounting system (Xero/QuickBooks)
                  to calculate cash runway projections.
                </p>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Import CSV Data
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
            {/* Cash Flow Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Current Cash */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Current Cash Balance</h3>
                  <BanknotesIcon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  Â£{cashData.currentCash.toLocaleString()}
                </div>
                <p className="text-sm text-gray-500 mt-2">As of today</p>
              </div>

              {/* Monthly Burn Rate */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Monthly Burn Rate</h3>
                  <ArrowDownIcon className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-3xl font-bold text-red-600">
                  Â£{cashData.monthlyBurn.toLocaleString()}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Â£{(cashData.monthlyBurn / 30).toFixed(0)}/day
                </p>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
                  <ArrowUpIcon className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-600">
                  Â£{cashData.monthlyRevenue.toLocaleString()}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Â£{(cashData.monthlyRevenue / 30).toFixed(0)}/day
                </p>
              </div>
            </div>

            {/* Selected Period Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedPeriod}-Day Cash Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Cash Required</div>
                  <div className="text-2xl font-bold text-gray-900">
                    Â£{selectedProjection.cashRequired.toLocaleString()}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Cash Available</div>
                  <div className="text-2xl font-bold text-gray-900">
                    Â£{selectedProjection.cashAvailable.toLocaleString()}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Funding Gap</div>
                  <div className={`text-2xl font-bold ${
                    selectedProjection.fundingGap > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Â£{selectedProjection.fundingGap.toLocaleString()}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <div className="flex items-center space-x-2">
                    {selectedProjection.fundingGap > 0 ? (
                      <>
                        <XCircleIcon className="w-6 h-6 text-red-500" />
                        <span className="font-semibold text-red-600">Funding Needed</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                        <span className="font-semibold text-green-600">Sufficient Cash</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              {selectedProjection.details && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Detailed Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Total Revenue:</span>
                      <div className="font-semibold">Â£{selectedProjection.details.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Expenses:</span>
                      <div className="font-semibold">Â£{selectedProjection.details.totalExpenses.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">AR Collection:</span>
                      <div className="font-semibold">Â£{selectedProjection.details.arCollection.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">AP Payments:</span>
                      <div className="font-semibold">Â£{selectedProjection.details.apPayments.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Net Cash Flow:</span>
                      <div className={`font-semibold ${
                        selectedProjection.details.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Â£{selectedProjection.details.netCashFlow.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Projection Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div style={{ height: '400px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Funding Options */}
            {selectedProjection.fundingGap > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">
                  Funding Required: Â£{selectedProjection.fundingGap.toLocaleString()}
                </h3>
                <p className="text-red-700 mb-4">
                  You need additional funding to cover your {selectedPeriod}-day cash requirements.
                  Consider these options:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {CLIENT_REQUIREMENTS.workingCapital.fundingOptions.slice(0, 3).map(option => (
                    <button
                      key={option}
                      onClick={() => navigate('/funding-calculator')}
                      className="border border-red-300 rounded-lg p-4 hover:bg-red-100 transition-colors text-left"
                    >
                      <div className="font-semibold text-red-900">{option}</div>
                      <div className="text-sm text-red-700 mt-1">
                        Calculate requirements â†’
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Import Financial Data</h3>
            <p className="text-gray-600 mb-4">
              Upload a CSV file with your financial data including:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
              <li>Current cash balance</li>
              <li>Monthly revenue</li>
              <li>Monthly expenses</li>
              <li>Accounts receivable</li>
              <li>Accounts payable</li>
            </ul>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => alert('Download template coming soon')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRunway;
