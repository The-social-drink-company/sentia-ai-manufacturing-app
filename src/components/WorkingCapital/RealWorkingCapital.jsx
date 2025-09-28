import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import apiService from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const RealWorkingCapital = () => {
  const [liveData, setLiveData] = useState(null);
  const [sseConnection, setSseConnection] = useState(null);

  // Fetch real working capital data
  const { data: workingCapitalData, isLoading: wcLoading, error: wcError } = useQuery({
    queryKey: ['workingCapital'],
    queryFn: () => apiService.getWorkingCapital(),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
  });

  // Fetch real cash flow data
  const { data: cashFlowData, isLoading: cfLoading, error: cfError } = useQuery({
    queryKey: ['cashFlow'],
    queryFn: () => apiService.getCashFlow(),
    refetchInterval: 30000,
    retry: 3,
  });

  // Fetch financial metrics
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['financialMetrics'],
    queryFn: () => apiService.getFinancialMetrics(),
    refetchInterval: 60000, // Refresh every minute
    retry: 3,
  });

  // Connect to live data stream
  useEffect(() => {
    const eventSource = apiService.connectToLiveData(
      (data) => {
        console.log('Live data received:', data);
        setLiveData(data);
      },
      (error) => {
        console.error('Live data error:', error);
      }
    );

    setSseConnection(eventSource);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (!value && value !== 0) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Calculate derived metrics from real data
  const calculateMetrics = () => {
    if (!workingCapitalData) return {};

    const currentAssets = workingCapitalData.currentAssets || 0;
    const currentLiabilities = workingCapitalData.currentLiabilities || 0;
    const inventory = workingCapitalData.inventory || 0;
    const receivables = workingCapitalData.receivables || 0;
    const payables = workingCapitalData.payables || 0;
    const cash = workingCapitalData.cash || 0;

    return {
      workingCapital: currentAssets - currentLiabilities,
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0,
      cashRatio: currentLiabilities > 0 ? cash / currentLiabilities : 0,
      daysReceivable: workingCapitalData.daysReceivable || 0,
      daysPayable: workingCapitalData.daysPayable || 0,
      daysInventory: workingCapitalData.daysInventory || 0,
      cashConversionCycle: (workingCapitalData.daysReceivable || 0) +
                           (workingCapitalData.daysInventory || 0) -
                           (workingCapitalData.daysPayable || 0),
    };
  };

  const metrics = calculateMetrics();

  if (wcLoading || cfLoading || metricsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading real financial data from MCP Server...</p>
        </div>
      </div>
    );
  }

  if (wcError || cfError || metricsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Data Connection Error</h2>
          <p className="text-gray-700">Unable to connect to MCP Server. Please ensure the server is running.</p>
          <p className="text-sm text-gray-600 mt-2">Server: https://mcp-server-tkyu.onrender.com</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Working Capital Management</h1>
          <p className="text-gray-600 mt-1">Real-time financial data from integrated systems</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${liveData ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {liveData ? 'Live Data Active' : 'Connecting to MCP Server...'}
          </span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-blue-600 font-medium">Working Capital</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {formatCurrency(metrics.workingCapital)}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-600 font-medium">Current Ratio</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {metrics.currentRatio?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-xs text-green-700 mt-2">
                  Target: &gt;2.0
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-purple-600 font-medium">Cash Conversion Cycle</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {Math.round(metrics.cashConversionCycle)} days
                </p>
                <p className="text-xs text-purple-700 mt-2">
                  Industry Avg: 45 days
                </p>
              </div>
              <div className="text-3xl">🔄</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-orange-600 font-medium">Available Cash</p>
                <p className="text-3xl font-bold text-orange-900 mt-2">
                  {formatCurrency(workingCapitalData?.cash || 0)}
                </p>
                <p className="text-xs text-orange-700 mt-2">
                  Quick Ratio: {metrics.quickRatio?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="text-3xl">💵</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Current Assets (Real-time)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Cash & Equivalents</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(workingCapitalData?.cash || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Accounts Receivable</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(workingCapitalData?.receivables || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Inventory</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(workingCapitalData?.inventory || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Prepaid Expenses</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(workingCapitalData?.prepaidExpenses || 0)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Current Assets</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(workingCapitalData?.currentAssets || 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Liabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Current Liabilities (Real-time)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Accounts Payable</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(workingCapitalData?.payables || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Short-term Debt</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(workingCapitalData?.shortTermDebt || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Accrued Expenses</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(workingCapitalData?.accruedExpenses || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Current Portion LT Debt</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(workingCapitalData?.currentPortionLTDebt || 0)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Current Liabilities</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(workingCapitalData?.currentLiabilities || 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Analysis (Live from MCP Server)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Operating Activities</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Net Income</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.netIncome || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Depreciation</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.depreciation || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Working Capital Changes</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.wcChanges || 0)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Operating Cash Flow</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(cashFlowData?.operatingCashFlow || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Investing Activities</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capital Expenditures</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.capex || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Asset Sales</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.assetSales || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Investments</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.investments || 0)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Investing Cash Flow</span>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(cashFlowData?.investingCashFlow || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Financing Activities</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Debt Issuance</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.debtIssuance || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Debt Repayment</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.debtRepayment || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dividends</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.dividends || 0)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Financing Cash Flow</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(cashFlowData?.financingCashFlow || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Net Cash Flow</span>
              <span className="text-2xl font-bold text-blue-900">
                {formatCurrency(
                  (cashFlowData?.operatingCashFlow || 0) +
                  (cashFlowData?.investingCashFlow || 0) +
                  (cashFlowData?.financingCashFlow || 0)
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI-Powered Financial Insights</span>
            <span className="text-sm font-normal text-purple-600">Powered by MCP Server</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metricsData?.aiRecommendations?.map((rec, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                <p className="text-sm text-gray-600">{rec.description}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    Impact: {rec.impact}
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    Confidence: {rec.confidence}%
                  </span>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                <p>Connecting to AI service for insights...</p>
                <p className="text-xs mt-2">MCP Server: https://mcp-server-tkyu.onrender.com</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealWorkingCapital;