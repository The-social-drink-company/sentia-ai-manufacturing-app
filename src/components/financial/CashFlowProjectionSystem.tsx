import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  BoltIcon,
  LightBulbIcon,
  TruckIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface WeeklyCashFlow {
  week: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  receipts: {
    salesReceipts: number;
    otherIncome: number;
    loanProceeds: number;
    total: number;
  };
  payments: {
    payroll: number;
    suppliers: number;
    operatingExpenses: number;
    capitalExpenditure: number;
    loanPayments: number;
    taxes: number;
    total: number;
  };
  netCashFlow: number;
  cumulativeCash: number;
  projectedBalance: number;
  minimumCashRequired: number;
  cashSurplusDeficit: number;
  confidence: number;
}

interface ScenarioModel {
  id: string;
  name: string;
  probability: number;
  assumptions: {
    salesGrowth: number;
    collectionPeriod: number;
    paymentPeriod: number;
    operatingExpenseChange: number;
  };
  impact: {
    totalCashGenerated: number;
    peakCashDeficit: number;
    averageBalance: number;
    riskScore: number;
  };
  triggers: string[];
}

interface PaymentOptimization {
  category: string;
  currentTiming: number;
  optimizedTiming: number;
  cashImpact: number;
  riskLevel: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  recommendations: Array<{
    action: string;
    impact: number;
    timeframe: string;
    status: 'identified' | 'in_progress' | 'implemented';
  }>;
}

interface CollectionAcceleration {
  opportunity: string;
  currentDSO: number;
  targetDSO: number;
  potentialImprovement: number;
  implementationCost: number;
  netBenefit: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeline: string;
  description: string;
}

interface CurrencyExposure {
  currency: string;
  exposureAmount: number;
  exposureType: 'receivable' | 'payable' | 'investment';
  maturityWeek: number;
  currentRate: number;
  budgetRate: number;
  variance: number;
  hedged: boolean;
  hedgeRatio: number;
  unrealizedGainLoss: number;
}

export const CashFlowProjectionSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'scenarios' | 'optimization' | 'collections' | 'currency'>('forecast');
  const [selectedScenario, setSelectedScenario] = useState<string>('base');
  const [forecastHorizon, setForecastHorizon] = useState<13 | 26 | 52>(13);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  const [confidenceLevel, setConfidenceLevel] = useState<80 | 90 | 95>(90);

  // Fetch cash flow projection data
  const { data: cashFlowData, isLoading } = useQuery({
    queryKey: ['cash-flow-projections', forecastHorizon, selectedScenario],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const startDate = new Date();
      const weeklyData: WeeklyCashFlow[] = [];
      let cumulativeCash = 2500000; // Starting cash balance
      
      for (let i = 0; i < forecastHorizon; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Generate realistic cash flow patterns
        const salesReceipts = 850000 + (Math.random() * 200000) - 100000;
        const payroll = 180000 + (i % 4 === 0 ? 20000 : 0); // Higher every 4th week
        const suppliers = 420000 + (Math.random() * 100000) - 50000;
        const operatingExpenses = 95000 + (Math.random() * 20000) - 10000;
        const capitalExpenditure = i % 8 === 0 ? 150000 : 0; // Every 8th week
        const loanPayments = i % 4 === 0 ? 25000 : 0; // Monthly
        const taxes = i % 13 === 0 ? 80000 : 0; // Quarterly

        const totalReceipts = salesReceipts + 15000; // Other income
        const totalPayments = payroll + suppliers + operatingExpenses + capitalExpenditure + loanPayments + taxes;
        const netCashFlow = totalReceipts - totalPayments;
        cumulativeCash += netCashFlow;
        
        const minimumRequired = 500000;
        const confidence = Math.max(70, 95 - (i * 2)); // Decreasing confidence over time

        weeklyData.push({
          week: `W${i + 1}`,
          weekNumber: i + 1,
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          receipts: {
            salesReceipts,
            otherIncome: 15000,
            loanProceeds: 0,
            total: totalReceipts
          },
          payments: {
            payroll,
            suppliers,
            operatingExpenses,
            capitalExpenditure,
            loanPayments,
            taxes,
            total: totalPayments
          },
          netCashFlow,
          cumulativeCash,
          projectedBalance: cumulativeCash,
          minimumCashRequired: minimumRequired,
          cashSurplusDeficit: cumulativeCash - minimumRequired,
          confidence
        });
      }

      return {
        weeklyProjections: weeklyData,
        summary: {
          startingBalance: 2500000,
          endingBalance: cumulativeCash,
          totalInflows: weeklyData.reduce((sum, week) => sum + week.receipts.total, 0),
          totalOutflows: weeklyData.reduce((sum, week) => sum + week.payments.total, 0),
          netCashGenerated: weeklyData.reduce((sum, week) => sum + week.netCashFlow, 0),
          peakBalance: Math.max(...weeklyData.map(w => w.cumulativeCash)),
          lowBalance: Math.min(...weeklyData.map(w => w.cumulativeCash)),
          weeksNegative: weeklyData.filter(w => w.cashSurplusDeficit < 0).length,
          averageConfidence: weeklyData.reduce((sum, week) => sum + week.confidence, 0) / weeklyData.length
        }
      };
    }
  });

  const scenarioModels: ScenarioModel[] = [
    {
      id: 'base',
      name: 'Base Case',
      probability: 50,
      assumptions: {
        salesGrowth: 5,
        collectionPeriod: 42,
        paymentPeriod: 35,
        operatingExpenseChange: 3
      },
      impact: {
        totalCashGenerated: 2100000,
        peakCashDeficit: -150000,
        averageBalance: 2250000,
        riskScore: 3
      },
      triggers: ['Normal market conditions', 'Historical performance patterns']
    },
    {
      id: 'optimistic',
      name: 'Optimistic',
      probability: 25,
      assumptions: {
        salesGrowth: 12,
        collectionPeriod: 35,
        paymentPeriod: 40,
        operatingExpenseChange: 2
      },
      impact: {
        totalCashGenerated: 3200000,
        peakCashDeficit: 0,
        averageBalance: 2850000,
        riskScore: 2
      },
      triggers: ['Strong market demand', 'Improved collection efficiency', 'Extended supplier terms']
    },
    {
      id: 'conservative',
      name: 'Conservative',
      probability: 20,
      assumptions: {
        salesGrowth: -2,
        collectionPeriod: 50,
        paymentPeriod: 30,
        operatingExpenseChange: 5
      },
      impact: {
        totalCashGenerated: 800000,
        peakCashDeficit: -450000,
        averageBalance: 1850000,
        riskScore: 6
      },
      triggers: ['Market slowdown', 'Collection delays', 'Supplier pressure']
    },
    {
      id: 'stress',
      name: 'Stress Test',
      probability: 5,
      assumptions: {
        salesGrowth: -15,
        collectionPeriod: 65,
        paymentPeriod: 25,
        operatingExpenseChange: 10
      },
      impact: {
        totalCashGenerated: -500000,
        peakCashDeficit: -850000,
        averageBalance: 1200000,
        riskScore: 9
      },
      triggers: ['Economic recession', 'Major customer loss', 'Supply chain disruption']
    }
  ];

  const paymentOptimizations: PaymentOptimization[] = [
    {
      category: 'Supplier Payments',
      currentTiming: 35,
      optimizedTiming: 42,
      cashImpact: 420000,
      riskLevel: 'medium',
      effort: 'medium',
      recommendations: [
        {
          action: 'Negotiate extended terms with top 10 suppliers',
          impact: 280000,
          timeframe: '2-3 months',
          status: 'identified'
        },
        {
          action: 'Implement dynamic payment scheduling',
          impact: 140000,
          timeframe: '1 month',
          status: 'in_progress'
        }
      ]
    },
    {
      category: 'Payroll Timing',
      currentTiming: 14,
      optimizedTiming: 16,
      cashImpact: 85000,
      riskLevel: 'low',
      effort: 'low',
      recommendations: [
        {
          action: 'Shift payroll date to align with cash receipts',
          impact: 85000,
          timeframe: '1 month',
          status: 'identified'
        }
      ]
    },
    {
      category: 'Operating Expenses',
      currentTiming: 30,
      optimizedTiming: 35,
      cashImpact: 120000,
      riskLevel: 'low',
      effort: 'medium',
      recommendations: [
        {
          action: 'Optimize recurring expense payment dates',
          impact: 75000,
          timeframe: '2 months',
          status: 'in_progress'
        },
        {
          action: 'Negotiate monthly vs quarterly payments',
          impact: 45000,
          timeframe: '3 months',
          status: 'identified'
        }
      ]
    }
  ];

  const collectionOpportunities: CollectionAcceleration[] = [
    {
      opportunity: 'Early Payment Discount Program',
      currentDSO: 42,
      targetDSO: 35,
      potentialImprovement: 650000,
      implementationCost: 85000,
      netBenefit: 565000,
      riskLevel: 'low',
      timeline: '1-2 months',
      description: 'Offer 2% discount for payment within 10 days'
    },
    {
      opportunity: 'Automated Collection System',
      currentDSO: 42,
      targetDSO: 38,
      potentialImprovement: 380000,
      implementationCost: 45000,
      netBenefit: 335000,
      riskLevel: 'low',
      timeline: '2-3 months',
      description: 'Implement automated reminders and follow-up system'
    },
    {
      opportunity: 'Customer Credit Policy Review',
      currentDSO: 42,
      targetDSO: 39,
      potentialImprovement: 285000,
      implementationCost: 15000,
      netBenefit: 270000,
      riskLevel: 'medium',
      timeline: '1 month',
      description: 'Tighten credit terms for new customers'
    },
    {
      opportunity: 'Factoring/Invoice Financing',
      currentDSO: 42,
      targetDSO: 2,
      potentialImprovement: 1200000,
      implementationCost: 180000,
      netBenefit: 1020000,
      riskLevel: 'high',
      timeline: '1 month',
      description: 'Factor high-quality receivables at 3% discount'
    }
  ];

  const currencyExposures: CurrencyExposure[] = [
    {
      currency: 'USD',
      exposureAmount: 1850000,
      exposureType: 'receivable',
      maturityWeek: 6,
      currentRate: 1.27,
      budgetRate: 1.25,
      variance: 0.02,
      hedged: true,
      hedgeRatio: 75,
      unrealizedGainLoss: 29133
    },
    {
      currency: 'EUR',
      exposureAmount: 980000,
      exposureType: 'payable',
      maturityWeek: 4,
      currentRate: 1.15,
      budgetRate: 1.18,
      variance: -0.03,
      hedged: false,
      hedgeRatio: 0,
      unrealizedGainLoss: -25714
    },
    {
      currency: 'JPY',
      exposureAmount: 45000000,
      exposureType: 'receivable',
      maturityWeek: 8,
      currentRate: 0.0078,
      budgetRate: 0.0075,
      variance: 0.0003,
      hedged: true,
      hedgeRatio: 50,
      hedgeRatio: 50,
      unrealizedGainLoss: 6750
    }
  ];

  const formatCurrency = useCallback((amount: number, compact = false) => {
    if (compact && Math.abs(amount) >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
  }, []);

  const getBalanceColor = useCallback((balance: number, minimum: number) => {
    if (balance < minimum) return 'text-red-600';
    if (balance < minimum * 1.5) return 'text-yellow-600';
    return 'text-green-600';
  }, []);

  const renderCashFlowForecast = () => {
    if (!cashFlowData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">13-Week Net Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(cashFlowData.summary.netCashGenerated, true)}
              </div>
              <div className="text-xs text-gray-600">
                Confidence: {cashFlowData.summary.averageConfidence.toFixed(0)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Peak Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(cashFlowData.summary.peakBalance, true)}
              </div>
              <div className="text-xs text-gray-600">
                Low: {formatCurrency(cashFlowData.summary.lowBalance, true)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cash Runway</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {cashFlowData.summary.weeksNegative > 0 ? 
                  `${13 - cashFlowData.summary.weeksNegative} weeks` : 
                  '13+ weeks'
                }
              </div>
              <div className="text-xs text-gray-600">
                Risk weeks: {cashFlowData.summary.weeksNegative}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ending Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", 
                getBalanceColor(cashFlowData.summary.endingBalance, 500000)
              )}>
                {formatCurrency(cashFlowData.summary.endingBalance, true)}
              </div>
              <div className="text-xs text-gray-600">
                vs Starting: {formatCurrency(cashFlowData.summary.endingBalance - cashFlowData.summary.startingBalance, true)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>13-Week Rolling Cash Flow Projection</CardTitle>
            <CardDescription>Weekly inflows, outflows, and cumulative balance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={cashFlowData.weeklyProjections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value, true)} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value, true)} />
                <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} />
                <Legend />
                <Bar yAxisId="left" dataKey="receipts.total" fill="#10B981" name="Cash Inflows" />
                <Bar yAxisId="left" dataKey="payments.total" fill="#EF4444" name="Cash Outflows" />
                <Line yAxisId="right" type="monotone" dataKey="cumulativeCash" stroke="#3B82F6" strokeWidth={3} name="Cumulative Cash" />
                <ReferenceLine yAxisId="right" y={500000} stroke="#8B5CF6" strokeDasharray="5 5" label="Minimum Cash" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Detail Table */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Cash Flow Detail</CardTitle>
            <CardDescription>Detailed breakdown of inflows and outflows by week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Week</th>
                    <th className="text-left py-2">Period</th>
                    <th className="text-right py-2">Inflows</th>
                    <th className="text-right py-2">Outflows</th>
                    <th className="text-right py-2">Net Flow</th>
                    <th className="text-right py-2">Balance</th>
                    <th className="text-right py-2">Surplus/Deficit</th>
                    <th className="text-right py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowData.weeklyProjections.slice(0, 13).map((week) => (
                    <tr key={week.week} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{week.week}</td>
                      <td className="py-2 text-gray-600">
                        {formatDate(week.startDate)} - {formatDate(week.endDate)}
                      </td>
                      <td className="py-2 text-right text-green-600">
                        {formatCurrency(week.receipts.total)}
                      </td>
                      <td className="py-2 text-right text-red-600">
                        {formatCurrency(week.payments.total)}
                      </td>
                      <td className={cn("py-2 text-right font-medium", 
                        week.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(week.netCashFlow)}
                      </td>
                      <td className={cn("py-2 text-right font-medium",
                        getBalanceColor(week.cumulativeCash, week.minimumCashRequired)
                      )}>
                        {formatCurrency(week.cumulativeCash)}
                      </td>
                      <td className={cn("py-2 text-right",
                        week.cashSurplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(week.cashSurplusDeficit)}
                      </td>
                      <td className="py-2 text-right">
                        <Badge variant={week.confidence >= 90 ? 'default' : 
                                      week.confidence >= 80 ? 'secondary' : 'destructive'}>
                          {week.confidence.toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderScenarioModeling = () => {
    const selectedScenarioData = scenarioModels.find(s => s.id === selectedScenario);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Scenario Analysis</CardTitle>
                <CardDescription>Compare different business scenarios and their cash flow impact</CardDescription>
              </div>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scenarioModels.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name} ({scenario.probability}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedScenarioData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(selectedScenarioData.impact.totalCashGenerated, true)}
                    </div>
                    <div className="text-sm text-gray-600">Total Cash Generated</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(selectedScenarioData.impact.peakCashDeficit, true)}
                    </div>
                    <div className="text-sm text-gray-600">Peak Cash Deficit</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedScenarioData.impact.averageBalance, true)}
                    </div>
                    <div className="text-sm text-gray-600">Average Balance</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {selectedScenarioData.impact.riskScore}/10
                    </div>
                    <div className="text-sm text-gray-600">Risk Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Key Assumptions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Sales Growth:</span>
                        <span className="font-medium">{selectedScenarioData.assumptions.salesGrowth}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Collection Period:</span>
                        <span className="font-medium">{selectedScenarioData.assumptions.collectionPeriod} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Period:</span>
                        <span className="font-medium">{selectedScenarioData.assumptions.paymentPeriod} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OpEx Change:</span>
                        <span className="font-medium">{selectedScenarioData.assumptions.operatingExpenseChange}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Scenario Triggers</h4>
                    <div className="space-y-1">
                      {selectedScenarioData.triggers.map((trigger, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                          <span>{trigger}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scenario Comparison</CardTitle>
            <CardDescription>Side-by-side comparison of all scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Scenario</th>
                    <th className="text-right py-3">Probability</th>
                    <th className="text-right py-3">Total Cash</th>
                    <th className="text-right py-3">Peak Deficit</th>
                    <th className="text-right py-3">Avg Balance</th>
                    <th className="text-right py-3">Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioModels.map((scenario) => (
                    <tr key={scenario.id} className={cn(
                      "border-b hover:bg-gray-50",
                      selectedScenario === scenario.id && "bg-blue-50"
                    )}>
                      <td className="py-3">
                        <div className="font-medium">{scenario.name}</div>
                      </td>
                      <td className="py-3 text-right">{scenario.probability}%</td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(scenario.impact.totalCashGenerated)}
                      </td>
                      <td className="py-3 text-right font-medium text-red-600">
                        {formatCurrency(scenario.impact.peakCashDeficit)}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(scenario.impact.averageBalance)}
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant={scenario.impact.riskScore <= 3 ? 'default' : 
                                      scenario.impact.riskScore <= 6 ? 'secondary' : 'destructive'}>
                          {scenario.impact.riskScore}/10
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPaymentOptimization = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Timing Optimization</CardTitle>
            <CardDescription>Optimize payment schedules to improve cash flow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {paymentOptimizations.map((optimization) => (
                <Card key={optimization.category}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{optimization.category}</CardTitle>
                      <Badge variant={optimization.riskLevel === 'low' ? 'default' : 
                                    optimization.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                        {optimization.riskLevel} risk
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-gray-600">
                            {optimization.currentTiming}
                          </div>
                          <div className="text-xs text-gray-500">Current Days</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {optimization.optimizedTiming}
                          </div>
                          <div className="text-xs text-gray-500">Optimized Days</div>
                        </div>
                      </div>

                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(optimization.cashImpact, true)}
                        </div>
                        <div className="text-sm text-gray-600">Cash Impact</div>
                      </div>

                      <div className="space-y-2">
                        {optimization.recommendations.map((rec, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{rec.action}</span>
                              <Badge variant={rec.status === 'implemented' ? 'default' : 
                                            rec.status === 'in_progress' ? 'secondary' : 'outline'}>
                                {rec.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>{rec.timeframe}</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(rec.impact, true)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Optimization Impact</CardTitle>
            <CardDescription>Cumulative cash flow impact of optimization strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentOptimizations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Cash Impact']} />
                <Bar dataKey="cashImpact" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCollectionAcceleration = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Collection Acceleration Opportunities</CardTitle>
            <CardDescription>Strategies to accelerate cash collections and reduce DSO</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collectionOpportunities.map((opportunity, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <BoltIcon className="h-4 w-4 text-yellow-500" />
                        <h4 className="font-medium">{opportunity.opportunity}</h4>
                        <Badge variant={opportunity.riskLevel === 'low' ? 'default' : 
                                      opportunity.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                          {opportunity.riskLevel} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                      <div className="text-xs text-gray-500">Timeline: {opportunity.timeline}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(opportunity.netBenefit, true)}
                      </div>
                      <div className="text-xs text-gray-500">Net Benefit</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="font-medium text-gray-600">Current DSO</div>
                      <div className="text-lg font-bold">{opportunity.currentDSO} days</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Target DSO</div>
                      <div className="text-lg font-bold text-blue-600">{opportunity.targetDSO} days</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Improvement</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(opportunity.potentialImprovement, true)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collection Opportunity Comparison</CardTitle>
            <CardDescription>Net benefit vs implementation cost analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={collectionOpportunities}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="opportunity" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Legend />
                <Bar dataKey="potentialImprovement" fill="#3B82F6" name="Potential Improvement" />
                <Bar dataKey="implementationCost" fill="#EF4444" name="Implementation Cost" />
                <Line type="monotone" dataKey="netBenefit" stroke="#10B981" strokeWidth={2} name="Net Benefit" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCurrencyExposureAnalysis = () => {
    const totalExposure = currencyExposures.reduce((sum, exp) => sum + Math.abs(exp.exposureAmount), 0);
    const totalUnrealizedGainLoss = currencyExposures.reduce((sum, exp) => sum + exp.unrealizedGainLoss, 0);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency Exposure Summary</CardTitle>
            <CardDescription>Foreign exchange risk analysis for cash flow projections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalExposure, true)}
                </div>
                <div className="text-sm text-gray-600">Total FX Exposure</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {((currencyExposures.filter(e => e.hedged).length / currencyExposures.length) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Hedged Positions</div>
              </div>
              <div className={cn("text-center p-4 rounded-lg", 
                totalUnrealizedGainLoss >= 0 ? 'bg-green-50' : 'bg-red-50'
              )}>
                <div className={cn("text-2xl font-bold", 
                  totalUnrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(totalUnrealizedGainLoss, true)}
                </div>
                <div className="text-sm text-gray-600">Unrealized P&L</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Currency</th>
                    <th className="text-right py-2">Exposure</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Maturity</th>
                    <th className="text-right py-2">Current Rate</th>
                    <th className="text-right py-2">Budget Rate</th>
                    <th className="text-right py-2">Variance</th>
                    <th className="text-right py-2">Hedged</th>
                    <th className="text-right py-2">Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {currencyExposures.map((exposure, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{exposure.currency}</td>
                      <td className="py-2 text-right">
                        {exposure.currency === 'JPY' 
                          ? `¥${exposure.exposureAmount.toLocaleString()}`
                          : formatCurrency(exposure.exposureAmount)
                        }
                      </td>
                      <td className="py-2">
                        <Badge variant={exposure.exposureType === 'receivable' ? 'default' : 'secondary'}>
                          {exposure.exposureType}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">Week {exposure.maturityWeek}</td>
                      <td className="py-2 text-right">{exposure.currentRate}</td>
                      <td className="py-2 text-right">{exposure.budgetRate}</td>
                      <td className={cn("py-2 text-right", 
                        exposure.variance >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {exposure.variance > 0 ? '+' : ''}{exposure.variance}
                      </td>
                      <td className="py-2 text-right">
                        {exposure.hedged ? (
                          <Badge variant="default">{exposure.hedgeRatio}%</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </td>
                      <td className={cn("py-2 text-right font-medium", 
                        exposure.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(exposure.unrealizedGainLoss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FX Impact on Cash Flow</CardTitle>
            <CardDescription>Weekly currency exposure impact on projected cash flows</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={currencyExposures.map((exp, i) => ({
                currency: exp.currency,
                exposure: Math.abs(exp.exposureAmount),
                unrealizedPL: exp.unrealizedGainLoss,
                week: exp.maturityWeek
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="currency" />
                <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Area dataKey="exposure" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Exposure" />
                <Area dataKey="unrealizedPL" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Unrealized P&L" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cash Flow Projection System</h2>
          <p className="text-gray-600">13-week rolling forecast with scenario modeling and optimization</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={forecastHorizon.toString()} onValueChange={(value) => setForecastHorizon(parseInt(value) as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="13">13 weeks</SelectItem>
              <SelectItem value="26">26 weeks</SelectItem>
              <SelectItem value="52">52 weeks</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfidenceInterval(!showConfidenceInterval)}
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Confidence
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="optimization">Payment Timing</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="currency">FX Exposure</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-6">
          {renderCashFlowForecast()}
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          {renderScenarioModeling()}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {renderPaymentOptimization()}
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          {renderCollectionAcceleration()}
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          {renderCurrencyExposureAnalysis()}
        </TabsContent>
      </Tabs>
    </div>
  );
};