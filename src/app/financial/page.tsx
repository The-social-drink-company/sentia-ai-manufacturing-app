'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BanknotesIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarIcon,
  GlobeAltIcon,
  CalculatorIcon,
  ScaleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkingCapitalWaterfall } from '@/components/financial/WorkingCapitalWaterfall';
import { CashFlowProjectionSystem } from '@/components/financial/CashFlowProjectionSystem';
import { ROICalculator } from '@/components/financial/ROICalculator';
import { CostBreakdownAnalyzer } from '@/components/financial/CostBreakdownAnalyzer';
import { CurrencyExposureDashboard } from '@/components/financial/CurrencyExposureDashboard';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface FinancialMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  workingCapital: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  cashFlow: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  profitMargin: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  roi: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  currencyExposure: {
    totalExposure: number;
    hedgedAmount: number;
    unhedgedRisk: number;
  };
}

interface RevenueData {
  period: string;
  revenue: number;
  cost: number;
  margin: number;
  forecast?: number;
}

interface CashFlowData {
  week: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  cumulativeCash: number;
}

interface WorkingCapitalData {
  component: string;
  current: number;
  previous: number;
  change: number;
  target: number;
}

interface ScenarioComparison {
  name: string;
  revenue: number;
  costs: number;
  margin: number;
  cashFlow: number;
  workingCapital: number;
}

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'YTD';
type ReportType = 'executive' | 'detailed' | 'variance' | 'forecast';

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'waterfall' | 'cashflow' | 'roi' | 'costs' | 'currency'>('overview');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('3M');
  const [selectedScenario, setSelectedScenario] = useState<string>('base');
  const [drillDownView, setDrillDownView] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch financial data
  const { data: financialData, isLoading, refetch } = useQuery({
    queryKey: ['financial-overview', timePeriod],
    queryFn: async () => {
      // Simulate Xero API integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        metrics: {
          revenue: {
            current: 12450000,
            previous: 11850000,
            change: 600000,
            changePercent: 5.06
          },
          workingCapital: {
            current: 2340000,
            previous: 2180000,
            change: 160000,
            changePercent: 7.34
          },
          cashFlow: {
            current: 1850000,
            previous: 1620000,
            change: 230000,
            changePercent: 14.20
          },
          profitMargin: {
            current: 18.5,
            previous: 16.2,
            change: 2.3,
            changePercent: 14.20
          },
          roi: {
            current: 22.8,
            previous: 19.5,
            change: 3.3,
            changePercent: 16.92
          },
          currencyExposure: {
            totalExposure: 5650000,
            hedgedAmount: 3850000,
            unhedgedRisk: 1800000
          }
        } as FinancialMetrics,
        revenueData: [
          { period: 'Jan', revenue: 3800000, cost: 3100000, margin: 18.4, forecast: 3850000 },
          { period: 'Feb', revenue: 4100000, cost: 3350000, margin: 18.3, forecast: 4200000 },
          { period: 'Mar', revenue: 4550000, cost: 3700000, margin: 18.7, forecast: 4650000 },
          { period: 'Apr', revenue: 4200000, cost: 3420000, margin: 18.6, forecast: 4300000 },
          { period: 'May', revenue: 4350000, cost: 3550000, margin: 18.4, forecast: 4450000 },
          { period: 'Jun', revenue: 4750000, cost: 3870000, margin: 18.5, forecast: 4850000 }
        ] as RevenueData[],
        cashFlowData: [
          { week: 'W1', inflow: 850000, outflow: 720000, netFlow: 130000, cumulativeCash: 2130000 },
          { week: 'W2', inflow: 920000, outflow: 780000, netFlow: 140000, cumulativeCash: 2270000 },
          { week: 'W3', inflow: 1100000, outflow: 850000, netFlow: 250000, cumulativeCash: 2520000 },
          { week: 'W4', inflow: 980000, outflow: 820000, netFlow: 160000, cumulativeCash: 2680000 },
          { week: 'W5', inflow: 1150000, outflow: 900000, netFlow: 250000, cumulativeCash: 2930000 },
          { week: 'W6', inflow: 1050000, outflow: 880000, netFlow: 170000, cumulativeCash: 3100000 }
        ] as CashFlowData[],
        workingCapitalData: [
          { component: 'Inventory', current: 1450000, previous: 1320000, change: 130000, target: 1350000 },
          { component: 'Accounts Receivable', current: 980000, previous: 920000, change: 60000, target: 900000 },
          { component: 'Accounts Payable', current: -720000, previous: -680000, change: -40000, target: -750000 },
          { component: 'Accrued Expenses', current: -370000, previous: -380000, change: 10000, target: -400000 }
        ] as WorkingCapitalData[]
      };
    },
    refetchInterval: autoRefresh ? 300000 : false, // Refresh every 5 minutes
  });

  // WebSocket for real-time financial updates
  useWebSocket('wss://localhost:3001/financial', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'financial_update' || data.type === 'xero_sync') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing financial WebSocket message:', error);
      }
    },
  });

  const scenarios: ScenarioComparison[] = [
    {
      name: 'Base Case',
      revenue: 12450000,
      costs: 10150000,
      margin: 18.5,
      cashFlow: 1850000,
      workingCapital: 2340000
    },
    {
      name: 'Optimistic',
      revenue: 14200000,
      costs: 11400000,
      margin: 19.7,
      cashFlow: 2450000,
      workingCapital: 2180000
    },
    {
      name: 'Conservative',
      revenue: 11800000,
      costs: 9850000,
      margin: 16.5,
      cashFlow: 1550000,
      workingCapital: 2650000
    },
    {
      name: 'Stress Test',
      revenue: 10200000,
      costs: 9100000,
      margin: 10.8,
      cashFlow: 850000,
      workingCapital: 3100000
    }
  ];

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }, []);

  const getChangeColor = useCallback((change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  }, []);

  const exportReport = useCallback((type: ReportType) => {
    // Simulate report generation and export
    console.log(`Exporting ${type} report for period: ${timePeriod}`);
    // In real implementation, this would generate and download the report
  }, [timePeriod]);

  const renderExecutiveSummary = () => {
    if (!financialData) return null;

    const { metrics } = financialData;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.current)}</div>
            <div className={cn("text-xs flex items-center", getChangeColor(metrics.revenue.change))}>
              {metrics.revenue.change >= 0 ? (
                <TrendingUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDownIcon className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(metrics.revenue.changePercent)} from last period
            </div>
          </CardContent>
        </Card>

        {/* Working Capital Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Working Capital</CardTitle>
            <ScaleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.workingCapital.current)}</div>
            <div className={cn("text-xs flex items-center", getChangeColor(metrics.workingCapital.change))}>
              {metrics.workingCapital.change >= 0 ? (
                <TrendingUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDownIcon className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(metrics.workingCapital.changePercent)} from last period
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Cash Flow</CardTitle>
            <BanknotesIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.cashFlow.current)}</div>
            <div className={cn("text-xs flex items-center", getChangeColor(metrics.cashFlow.change))}>
              {metrics.cashFlow.change >= 0 ? (
                <TrendingUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDownIcon className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(metrics.cashFlow.changePercent)} from last period
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.profitMargin.current}%</div>
            <div className={cn("text-xs flex items-center", getChangeColor(metrics.profitMargin.change))}>
              {metrics.profitMargin.change >= 0 ? (
                <TrendingUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDownIcon className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(metrics.profitMargin.changePercent)} from last period
            </div>
          </CardContent>
        </Card>

        {/* ROI Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <CalculatorIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.roi.current}%</div>
            <div className={cn("text-xs flex items-center", getChangeColor(metrics.roi.change))}>
              {metrics.roi.change >= 0 ? (
                <TrendingUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDownIcon className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(metrics.roi.changePercent)} from last period
            </div>
          </CardContent>
        </Card>

        {/* Currency Risk Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FX Exposure</CardTitle>
            <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.currencyExposure.unhedgedRisk)}</div>
            <div className="text-xs text-muted-foreground">
              {((metrics.currencyExposure.hedgedAmount / metrics.currencyExposure.totalExposure) * 100).toFixed(0)}% hedged
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInteractiveCharts = () => {
    if (!financialData) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue and Margin Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Margin Trend</CardTitle>
            <CardDescription>Monthly performance with forecast</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => [
                  name === 'margin' ? `${value}%` : formatCurrency(Number(value)),
                  name
                ]} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#10B981" strokeWidth={2} name="Margin %" />
                <Line yAxisId="left" type="monotone" dataKey="forecast" stroke="#F59E0B" strokeDasharray="5 5" name="Forecast" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Cash Flow</CardTitle>
            <CardDescription>Inflow vs Outflow analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={financialData.cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Area stackId="1" dataKey="inflow" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Inflow" />
                <Area stackId="2" dataKey="outflow" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Outflow" />
                <Line type="monotone" dataKey="cumulativeCash" stroke="#8B5CF6" strokeWidth={2} name="Cumulative Cash" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderScenarioComparison = () => {
    return (
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scenario Analysis</CardTitle>
              <CardDescription>Compare different business scenarios</CardDescription>
            </div>
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.name} value={scenario.name.toLowerCase().replace(' ', '_')}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Scenario</th>
                  <th className="text-right py-3 px-4 font-medium">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium">Costs</th>
                  <th className="text-right py-3 px-4 font-medium">Margin %</th>
                  <th className="text-right py-3 px-4 font-medium">Cash Flow</th>
                  <th className="text-right py-3 px-4 font-medium">Working Capital</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario, index) => (
                  <tr key={scenario.name} className={cn(
                    "border-b hover:bg-gray-50",
                    selectedScenario === scenario.name.toLowerCase().replace(' ', '_') && "bg-blue-50"
                  )}>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{scenario.name}</span>
                        {index === 0 && <Badge variant="outline">Current</Badge>}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">{formatCurrency(scenario.revenue)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(scenario.costs)}</td>
                    <td className="text-right py-3 px-4">{scenario.margin}%</td>
                    <td className="text-right py-3 px-4">{formatCurrency(scenario.cashFlow)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(scenario.workingCapital)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DocumentChartBarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Financial Impact Analyzer
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  CFO-level insights with real-time financial analytics and scenario planning
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Time Period Selector */}
              <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1M">1M</SelectItem>
                  <SelectItem value="3M">3M</SelectItem>
                  <SelectItem value="6M">6M</SelectItem>
                  <SelectItem value="1Y">1Y</SelectItem>
                  <SelectItem value="YTD">YTD</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Reports */}
              <Select onValueChange={(value) => exportReport(value as ReportType)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Export Report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  <SelectItem value="variance">Variance Report</SelectItem>
                  <SelectItem value="forecast">Forecast Report</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Executive Summary Cards */}
        {renderExecutiveSummary()}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <ChartBarIcon className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="waterfall" className="flex items-center space-x-2">
              <ScaleIcon className="h-4 w-4" />
              <span>Working Capital</span>
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="flex items-center space-x-2">
              <BanknotesIcon className="h-4 w-4" />
              <span>Cash Flow</span>
            </TabsTrigger>
            <TabsTrigger value="roi" className="flex items-center space-x-2">
              <CalculatorIcon className="h-4 w-4" />
              <span>ROI Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>Cost Breakdown</span>
            </TabsTrigger>
            <TabsTrigger value="currency" className="flex items-center space-x-2">
              <GlobeAltIcon className="h-4 w-4" />
              <span>Currency Risk</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* Interactive Charts */}
              {renderInteractiveCharts()}
              
              {/* Scenario Comparison */}
              {renderScenarioComparison()}
              
              {/* Drill-down capability placeholder */}
              {drillDownView && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Analysis: {drillDownView}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Detailed drill-down analysis would be displayed here.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setDrillDownView(null)}
                      className="mt-4"
                    >
                      Back to Overview
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="waterfall" className="mt-6">
            <WorkingCapitalWaterfall />
          </TabsContent>

          <TabsContent value="cashflow" className="mt-6">
            <CashFlowProjectionSystem />
          </TabsContent>

          <TabsContent value="roi" className="mt-6">
            <ROICalculator />
          </TabsContent>

          <TabsContent value="costs" className="mt-6">
            <CostBreakdownAnalyzer />
          </TabsContent>

          <TabsContent value="currency" className="mt-6">
            <CurrencyExposureDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}