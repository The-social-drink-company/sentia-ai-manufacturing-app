import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LightBulbIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, WaterfallChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface WorkingCapitalComponent {
  name: string;
  current: number;
  previous: number;
  target: number;
  change: number;
  changePercent: number;
  daysOutstanding: number;
  targetDays: number;
  trend: 'improving' | 'stable' | 'declining';
  impact: 'high' | 'medium' | 'low';
  drivers: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  optimizationOpportunities: Array<{
    opportunity: string;
    potentialSaving: number;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
    status: 'identified' | 'in_progress' | 'implemented';
  }>;
}

interface WaterfallData {
  name: string;
  value: number;
  cumulativeValue: number;
  isPositive: boolean;
  isTotal?: boolean;
}

interface DriverAnalysis {
  category: string;
  impact: number;
  factors: Array<{
    name: string;
    contribution: number;
    description: string;
    actionable: boolean;
  }>;
}

interface OptimizationScenario {
  id: string;
  name: string;
  components: {
    inventory: number;
    receivables: number;
    payables: number;
  };
  totalImprovement: number;
  implementationCost: number;
  netBenefit: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeline: string;
}

export const WorkingCapitalWaterfall: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'waterfall' | 'components' | 'drivers' | 'optimization'>('waterfall');
  const [timePeriod, setTimePeriod] = useState<'1M' | '3M' | '6M' | '12M'>('3M');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [showTargets, setShowTargets] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<string>('current');

  // Fetch working capital data
  const { data: workingCapitalData, isLoading } = useQuery({
    queryKey: ['working-capital-waterfall', timePeriod],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const components: WorkingCapitalComponent[] = [
        {
          name: 'Inventory',
          current: 3200000,
          previous: 2850000,
          target: 2800000,
          change: 350000,
          changePercent: 12.28,
          daysOutstanding: 45,
          targetDays: 35,
          trend: 'declining',
          impact: 'high',
          drivers: [
            { factor: 'Raw Material Buildup', impact: 180000, description: 'Anticipatory buying due to supplier uncertainty' },
            { factor: 'Slow-Moving Stock', impact: 120000, description: 'Obsolete products not written off' },
            { factor: 'Safety Stock Increase', impact: 50000, description: 'Increased buffer levels' }
          ],
          optimizationOpportunities: [
            {
              opportunity: 'Implement Just-in-Time ordering',
              potentialSaving: 150000,
              effort: 'medium',
              timeline: '3-6 months',
              status: 'identified'
            },
            {
              opportunity: 'Clear slow-moving inventory',
              potentialSaving: 120000,
              effort: 'low',
              timeline: '1-2 months',
              status: 'in_progress'
            },
            {
              opportunity: 'Optimize safety stock levels',
              potentialSaving: 80000,
              effort: 'low',
              timeline: '1 month',
              status: 'implemented'
            }
          ]
        },
        {
          name: 'Accounts Receivable',
          current: 2100000,
          previous: 1950000,
          target: 1800000,
          change: 150000,
          changePercent: 7.69,
          daysOutstanding: 42,
          targetDays: 35,
          trend: 'declining',
          impact: 'medium',
          drivers: [
            { factor: 'Extended Payment Terms', impact: 90000, description: 'New large customers with 60-day terms' },
            { factor: 'Collection Delays', impact: 35000, description: 'Slower follow-up on overdue accounts' },
            { factor: 'Seasonal Peak', impact: 25000, description: 'Higher sales in recent months' }
          ],
          optimizationOpportunities: [
            {
              opportunity: 'Implement early payment discounts',
              potentialSaving: 75000,
              effort: 'low',
              timeline: '1 month',
              status: 'identified'
            },
            {
              opportunity: 'Automated collection reminders',
              potentialSaving: 50000,
              effort: 'medium',
              timeline: '2-3 months',
              status: 'in_progress'
            },
            {
              opportunity: 'Credit policy tightening',
              potentialSaving: 100000,
              effort: 'high',
              timeline: '6 months',
              status: 'identified'
            }
          ]
        },
        {
          name: 'Accounts Payable',
          current: -1850000,
          previous: -1680000,
          target: -2000000,
          change: -170000,
          changePercent: 10.12,
          daysOutstanding: 38,
          targetDays: 45,
          trend: 'improving',
          impact: 'medium',
          drivers: [
            { factor: 'Supplier Payment Acceleration', impact: -80000, description: 'Taking advantage of early payment discounts' },
            { factor: 'New Supplier Terms', impact: -60000, description: 'Shorter terms with new suppliers' },
            { factor: 'Cash Flow Constraints', impact: -30000, description: 'Paying suppliers faster to maintain relationships' }
          ],
          optimizationOpportunities: [
            {
              opportunity: 'Negotiate extended payment terms',
              potentialSaving: 120000,
              effort: 'medium',
              timeline: '3-4 months',
              status: 'identified'
            },
            {
              opportunity: 'Optimize early payment discounts',
              potentialSaving: 35000,
              effort: 'low',
              timeline: '1 month',
              status: 'implemented'
            }
          ]
        },
        {
          name: 'Other Working Capital',
          current: 420000,
          previous: 380000,
          target: 350000,
          change: 40000,
          changePercent: 10.53,
          daysOutstanding: 8,
          targetDays: 6,
          trend: 'stable',
          impact: 'low',
          drivers: [
            { factor: 'Prepaid Expenses Increase', impact: 25000, description: 'Annual insurance and software licenses' },
            { factor: 'Accrued Revenue Recognition', impact: 15000, description: 'Revenue recognized but not yet invoiced' }
          ],
          optimizationOpportunities: [
            {
              opportunity: 'Monthly prepayment scheduling',
              potentialSaving: 20000,
              effort: 'low',
              timeline: '1 month',
              status: 'identified'
            }
          ]
        }
      ];

      const totalCurrent = components.reduce((sum, comp) => sum + comp.current, 0);
      const totalPrevious = components.reduce((sum, comp) => sum + comp.previous, 0);
      const totalTarget = components.reduce((sum, comp) => sum + comp.target, 0);

      return {
        components,
        summary: {
          current: totalCurrent,
          previous: totalPrevious,
          target: totalTarget,
          change: totalCurrent - totalPrevious,
          changePercent: ((totalCurrent - totalPrevious) / totalPrevious) * 100,
          targetGap: totalCurrent - totalTarget,
          efficiency: ((totalTarget / totalCurrent) * 100)
        },
        waterfallData: [
          { name: 'Previous Period', value: totalPrevious, cumulativeValue: totalPrevious, isPositive: true, isTotal: true },
          { name: 'Inventory Change', value: 350000, cumulativeValue: totalPrevious + 350000, isPositive: false },
          { name: 'Receivables Change', value: 150000, cumulativeValue: totalPrevious + 350000 + 150000, isPositive: false },
          { name: 'Payables Change', value: -170000, cumulativeValue: totalPrevious + 350000 + 150000 - 170000, isPositive: true },
          { name: 'Other Changes', value: 40000, cumulativeValue: totalCurrent, isPositive: false },
          { name: 'Current Period', value: totalCurrent, cumulativeValue: totalCurrent, isPositive: true, isTotal: true }
        ] as WaterfallData[]
      };
    }
  });

  const optimizationScenarios: OptimizationScenario[] = [
    {
      id: 'current',
      name: 'Current State',
      components: { inventory: 3200000, receivables: 2100000, payables: -1850000 },
      totalImprovement: 0,
      implementationCost: 0,
      netBenefit: 0,
      riskLevel: 'low',
      timeline: 'Current'
    },
    {
      id: 'quick_wins',
      name: 'Quick Wins (1-3 months)',
      components: { inventory: 3080000, receivables: 2025000, payables: -1885000 },
      totalImprovement: 170000,
      implementationCost: 25000,
      netBenefit: 145000,
      riskLevel: 'low',
      timeline: '1-3 months'
    },
    {
      id: 'medium_term',
      name: 'Medium Term (3-6 months)',
      components: { inventory: 2900000, receivables: 1950000, payables: -1950000 },
      totalImprovement: 415000,
      implementationCost: 85000,
      netBenefit: 330000,
      riskLevel: 'medium',
      timeline: '3-6 months'
    },
    {
      id: 'optimal',
      name: 'Optimal Target (6-12 months)',
      components: { inventory: 2800000, receivables: 1800000, payables: -2000000 },
      totalImprovement: 570000,
      implementationCost: 150000,
      netBenefit: 420000,
      riskLevel: 'high',
      timeline: '6-12 months'
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
    return change >= 0 ? 'text-red-600' : 'text-green-600'; // Positive working capital change is bad
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDownIcon className="h-4 w-4 text-red-600" />;
      default: return <ArrowRightIcon className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  const renderWaterfallChart = () => {
    if (!workingCapitalData) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Working Capital Waterfall Analysis</CardTitle>
          <CardDescription>Period-over-period breakdown showing component changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(workingCapitalData.summary.current)}
                </div>
                <div className="text-sm text-gray-600">Current</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {formatCurrency(workingCapitalData.summary.previous)}
                </div>
                <div className="text-sm text-gray-600">Previous</div>
              </div>
              <div>
                <div className={cn("text-2xl font-bold", getChangeColor(workingCapitalData.summary.change))}>
                  {formatCurrency(workingCapitalData.summary.change)}
                </div>
                <div className="text-sm text-gray-600">Change</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(workingCapitalData.summary.target)}
                </div>
                <div className="text-sm text-gray-600">Target</div>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={workingCapitalData.waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={(value) => formatCurrency(value / 1000000) + 'M'} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
              <Bar
                dataKey="value"
                fill={(entry: any) => {
                  if (entry.isTotal) return '#3B82F6';
                  return entry.isPositive ? '#EF4444' : '#10B981';
                }}
                stroke="#1F2937"
                strokeWidth={1}
              />
              {showTargets && (
                <ReferenceLine 
                  y={workingCapitalData.summary.target} 
                  stroke="#8B5CF6" 
                  strokeDasharray="5 5" 
                  label={{ value: "Target", position: "topRight" }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderComponentBreakdown = () => {
    if (!workingCapitalData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workingCapitalData.components.map((component) => (
            <Card key={component.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{component.name}</CardTitle>
                    <CardDescription>
                      {component.daysOutstanding} days (Target: {component.targetDays})
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(component.trend)}
                    <Badge variant={component.impact === 'high' ? 'destructive' : 
                                  component.impact === 'medium' ? 'default' : 'secondary'}>
                      {component.impact} impact
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Current</span>
                    <span className="text-lg font-bold">{formatCurrency(component.current)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Previous Period</span>
                    <span>{formatCurrency(component.previous)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Target</span>
                    <span className="text-blue-600">{formatCurrency(component.target)}</span>
                  </div>
                  <div className={cn("flex justify-between items-center text-sm font-medium", 
                                   getChangeColor(component.change))}>
                    <span>Change</span>
                    <div className="flex items-center space-x-1">
                      {component.change >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                      <span>{formatCurrency(Math.abs(component.change))} ({formatPercentage(component.changePercent)})</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h5 className="text-sm font-medium mb-2">Key Drivers</h5>
                    <div className="space-y-1">
                      {component.drivers.map((driver, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-gray-600">{driver.factor}</span>
                          <span className={cn("font-medium", getChangeColor(driver.impact))}>
                            {formatCurrency(driver.impact)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Component Performance vs Target</CardTitle>
            <CardDescription>Actual performance compared to targets across all components</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={workingCapitalData.components}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value / 1000000) + 'M'} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Legend />
                <Bar dataKey="current" fill="#3B82F6" name="Current" />
                <Bar dataKey="target" fill="#8B5CF6" name="Target" />
                <Line type="monotone" dataKey="daysOutstanding" stroke="#10B981" strokeWidth={2} 
                      yAxisId="right" name="Days Outstanding" />
                <YAxis yAxisId="right" orientation="right" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDriverAnalysis = () => {
    if (!workingCapitalData) return null;

    const allDrivers = workingCapitalData.components.flatMap(comp => 
      comp.drivers.map(driver => ({
        ...driver,
        component: comp.name,
        componentImpact: comp.impact
      }))
    ).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Impact Drivers</CardTitle>
            <CardDescription>Key factors driving working capital changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allDrivers.slice(0, 8).map((driver, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{driver.factor}</span>
                      <Badge variant="outline" className="text-xs">
                        {driver.component}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{driver.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-lg font-bold", getChangeColor(driver.impact))}>
                      {formatCurrency(driver.impact)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {((Math.abs(driver.impact) / workingCapitalData.summary.current) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Impact Analysis</CardTitle>
            <CardDescription>Visual breakdown of driver impacts by component</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allDrivers.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="factor" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => formatCurrency(value / 1000)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Impact']} />
                <Bar dataKey="impact" fill={(entry: any) => entry.impact >= 0 ? '#EF4444' : '#10B981'} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderOptimizationOpportunities = () => {
    if (!workingCapitalData) return null;

    const allOpportunities = workingCapitalData.components.flatMap(comp =>
      comp.optimizationOpportunities.map(opp => ({
        ...opp,
        component: comp.name
      }))
    ).sort((a, b) => b.potentialSaving - a.potentialSaving);

    const selectedScenarioData = optimizationScenarios.find(s => s.id === selectedScenario);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Optimization Scenarios</CardTitle>
                <CardDescription>Compare different improvement strategies</CardDescription>
              </div>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {optimizationScenarios.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedScenarioData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedScenarioData.totalImprovement)}
                  </div>
                  <div className="text-sm text-gray-600">Total Improvement</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedScenarioData.implementationCost)}
                  </div>
                  <div className="text-sm text-gray-600">Implementation Cost</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedScenarioData.netBenefit)}
                  </div>
                  <div className="text-sm text-gray-600">Net Benefit</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-600">{selectedScenarioData.timeline}</div>
                  <div className="text-sm text-gray-600">Timeline</div>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={optimizationScenarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value / 1000) + 'K'} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Legend />
                <Bar dataKey="totalImprovement" fill="#3B82F6" name="Total Improvement" />
                <Bar dataKey="implementationCost" fill="#EF4444" name="Implementation Cost" />
                <Bar dataKey="netBenefit" fill="#10B981" name="Net Benefit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimization Opportunities</CardTitle>
            <CardDescription>Ranked by potential financial impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allOpportunities.map((opportunity, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <LightBulbIcon className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{opportunity.opportunity}</span>
                      <Badge variant="outline" className="text-xs">
                        {opportunity.component}
                      </Badge>
                      <Badge 
                        variant={opportunity.status === 'implemented' ? 'default' : 
                                opportunity.status === 'in_progress' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {opportunity.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Effort: {opportunity.effort}</span>
                      <span>Timeline: {opportunity.timeline}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(opportunity.potentialSaving)}
                    </div>
                    <div className="text-xs text-gray-500">potential saving</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-96 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Working Capital Waterfall Analysis</h2>
          <p className="text-gray-600">Component breakdown with optimization opportunities</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as any)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">1M</SelectItem>
              <SelectItem value="3M">3M</SelectItem>
              <SelectItem value="6M">6M</SelectItem>
              <SelectItem value="12M">12M</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTargets(!showTargets)}
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            {showTargets ? 'Hide' : 'Show'} Targets
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="drivers">Driver Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="waterfall" className="space-y-6">
          {renderWaterfallChart()}
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          {renderComponentBreakdown()}
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          {renderDriverAnalysis()}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {renderOptimizationOpportunities()}
        </TabsContent>
      </Tabs>
    </div>
  );
};