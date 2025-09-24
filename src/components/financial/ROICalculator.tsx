import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalculatorIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  PlayIcon,
  PauseIcon,
  LightBulbIcon,
  ScaleIcon,
  BanknotesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface InvestmentProject {
  id: string;
  name: string;
  category: 'inventory' | 'equipment' | 'technology' | 'process_improvement' | 'capacity_expansion';
  initialInvestment: number;
  annualCashFlow: number[];
  implementationTimeMonths: number;
  riskProfile: 'low' | 'medium' | 'high';
  strategicAlignment: number; // 1-10 scale
  roi: number;
  npv: number;
  irr: number;
  paybackPeriod: number;
  riskAdjustedROI: number;
  opportunityCost: number;
  description: string;
  assumptions: string[];
  keyRisks: Array<{
    risk: string;
    impact: 'low' | 'medium' | 'high';
    probability: number;
    mitigation: string;
  }>;
  benefits: Array<{
    benefit: string;
    quantified: boolean;
    value: number;
    confidence: number;
  }>;
}

interface InventoryInvestmentAnalysis {
  category: string;
  currentLevel: number;
  proposedLevel: number;
  investmentRequired: number;
  annualCarryingCost: number;
  expectedReturns: {
    salesIncrease: number;
    stockoutReduction: number;
    efficiencyGains: number;
    total: number;
  };
  turnoverImprovement: number;
  roiMetrics: {
    inventoryROI: number;
    incrementalROI: number;
    riskAdjustedROI: number;
    paybackMonths: number;
  };
  risks: string[];
  sensitivities: Array<{
    variable: string;
    baseCase: number;
    optimistic: number;
    pessimistic: number;
    impactOnROI: {
      optimistic: number;
      pessimistic: number;
    };
  }>;
}

interface SensitivityAnalysis {
  variable: string;
  baseValue: number;
  range: { min: number; max: number };
  impact: Array<{
    value: number;
    roi: number;
    npv: number;
    irr: number;
  }>;
}

interface OpportunityCost {
  alternative: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  liquidityImpact: number;
  strategicValue: number;
  description: string;
}

export const ROICalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'inventory' | 'comparison' | 'sensitivity' | 'opportunities'>('calculator');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [calculatorInputs, setCalculatorInputs] = useState({
    initialInvestment: 1000000,
    projectionYears: 5,
    discountRate: 8,
    riskAdjustment: 2,
    taxRate: 25
  });
  const [cashFlows, setCashFlows] = useState<number[]>([200000, 250000, 300000, 350000, 400000]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch ROI analysis data
  const { data: roiData, isLoading } = useQuery({
    queryKey: ['roi-analysis'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const projects: InvestmentProject[] = [
        {
          id: 'inventory_optimization',
          name: 'Inventory Optimization System',
          category: 'inventory',
          initialInvestment: 850000,
          annualCashFlow: [180000, 220000, 280000, 320000, 350000],
          implementationTimeMonths: 6,
          riskProfile: 'medium',
          strategicAlignment: 8,
          roi: 28.5,
          npv: 456000,
          irr: 22.8,
          paybackPeriod: 3.2,
          riskAdjustedROI: 24.1,
          opportunityCost: 95000,
          description: 'AI-powered inventory optimization to reduce carrying costs and improve turnover',
          assumptions: [
            '15% reduction in average inventory levels',
            '25% improvement in stockout reduction',
            '10% increase in inventory turnover ratio'
          ],
          keyRisks: [
            {
              risk: 'Implementation delays',
              impact: 'medium',
              probability: 30,
              mitigation: 'Phased rollout with experienced vendor'
            },
            {
              risk: 'Staff resistance to change',
              impact: 'low',
              probability: 20,
              mitigation: 'Comprehensive training and change management'
            }
          ],
          benefits: [
            { benefit: 'Reduced carrying costs', quantified: true, value: 120000, confidence: 85 },
            { benefit: 'Improved cash flow', quantified: true, value: 200000, confidence: 90 },
            { benefit: 'Better customer service', quantified: false, value: 0, confidence: 75 }
          ]
        },
        {
          id: 'automation_equipment',
          name: 'Production Line Automation',
          category: 'equipment',
          initialInvestment: 2500000,
          annualCashFlow: [450000, 520000, 580000, 650000, 720000],
          implementationTimeMonths: 12,
          riskProfile: 'high',
          strategicAlignment: 9,
          roi: 18.2,
          npv: 287000,
          irr: 15.6,
          paybackPeriod: 4.8,
          riskAdjustedROI: 14.7,
          opportunityCost: 200000,
          description: 'Automated production line to improve efficiency and reduce labor costs',
          assumptions: [
            '30% reduction in direct labor costs',
            '20% improvement in production efficiency',
            '10% reduction in defect rates'
          ],
          keyRisks: [
            {
              risk: 'Technology obsolescence',
              impact: 'high',
              probability: 25,
              mitigation: 'Modular design for future upgrades'
            },
            {
              risk: 'Higher than expected maintenance',
              impact: 'medium',
              probability: 40,
              mitigation: 'Comprehensive service contract'
            }
          ],
          benefits: [
            { benefit: 'Labor cost savings', quantified: true, value: 480000, confidence: 90 },
            { benefit: 'Efficiency improvements', quantified: true, value: 320000, confidence: 80 },
            { benefit: 'Quality improvements', quantified: true, value: 150000, confidence: 70 }
          ]
        },
        {
          id: 'erp_system',
          name: 'Enterprise Resource Planning System',
          category: 'technology',
          initialInvestment: 1200000,
          annualCashFlow: [150000, 240000, 320000, 380000, 420000],
          implementationTimeMonths: 18,
          riskProfile: 'high',
          strategicAlignment: 10,
          roi: 15.8,
          npv: 198000,
          irr: 13.2,
          paybackPeriod: 5.5,
          riskAdjustedROI: 11.4,
          opportunityCost: 180000,
          description: 'Integrated ERP system to streamline operations and improve visibility',
          assumptions: [
            '25% reduction in administrative overhead',
            '15% improvement in planning accuracy',
            '20% reduction in data processing time'
          ],
          keyRisks: [
            {
              risk: 'Implementation complexity',
              impact: 'high',
              probability: 50,
              mitigation: 'Experienced implementation partner'
            },
            {
              risk: 'Business disruption',
              impact: 'medium',
              probability: 35,
              mitigation: 'Parallel system operation during transition'
            }
          ],
          benefits: [
            { benefit: 'Process efficiency', quantified: true, value: 280000, confidence: 75 },
            { benefit: 'Better decision making', quantified: false, value: 0, confidence: 85 },
            { benefit: 'Reduced errors', quantified: true, value: 120000, confidence: 80 }
          ]
        }
      ];

      const inventoryAnalysis: InventoryInvestmentAnalysis[] = [
        {
          category: 'Raw Materials',
          currentLevel: 1200000,
          proposedLevel: 1450000,
          investmentRequired: 250000,
          annualCarryingCost: 48000,
          expectedReturns: {
            salesIncrease: 180000,
            stockoutReduction: 45000,
            efficiencyGains: 25000,
            total: 250000
          },
          turnoverImprovement: 15,
          roiMetrics: {
            inventoryROI: 80.8,
            incrementalROI: 80.8,
            riskAdjustedROI: 72.1,
            paybackMonths: 15
          },
          risks: ['Obsolescence', 'Storage costs', 'Working capital tie-up'],
          sensitivities: [
            {
              variable: 'Demand Growth',
              baseCase: 10,
              optimistic: 20,
              pessimistic: 5,
              impactOnROI: { optimistic: 15.2, pessimistic: -8.5 }
            },
            {
              variable: 'Carrying Cost %',
              baseCase: 20,
              optimistic: 15,
              pessimistic: 25,
              impactOnROI: { optimistic: 8.3, pessimistic: -12.1 }
            }
          ]
        },
        {
          category: 'Work in Process',
          currentLevel: 650000,
          proposedLevel: 580000,
          investmentRequired: -70000,
          annualCarryingCost: -14000,
          expectedReturns: {
            salesIncrease: 0,
            stockoutReduction: 0,
            efficiencyGains: 85000,
            total: 85000
          },
          turnoverImprovement: 25,
          roiMetrics: {
            inventoryROI: 135.7,
            incrementalROI: 135.7,
            riskAdjustedROI: 121.4,
            paybackMonths: 9
          },
          risks: ['Process disruption', 'Quality issues'],
          sensitivities: [
            {
              variable: 'Process Efficiency',
              baseCase: 15,
              optimistic: 25,
              pessimistic: 10,
              impactOnROI: { optimistic: 22.3, pessimistic: -18.9 }
            }
          ]
        },
        {
          category: 'Finished Goods',
          currentLevel: 850000,
          proposedLevel: 950000,
          investmentRequired: 100000,
          annualCarryingCost: 19000,
          expectedReturns: {
            salesIncrease: 125000,
            stockoutReduction: 35000,
            efficiencyGains: 15000,
            total: 175000
          },
          turnoverImprovement: 20,
          roiMetrics: {
            inventoryROI: 156.0,
            incrementalROI: 156.0,
            riskAdjustedROI: 140.4,
            paybackMonths: 7
          },
          risks: ['Product obsolescence', 'Seasonal demand'],
          sensitivities: [
            {
              variable: 'Sales Growth',
              baseCase: 12,
              optimistic: 18,
              pessimistic: 8,
              impactOnROI: { optimistic: 18.7, pessimistic: -15.2 }
            }
          ]
        }
      ];

      return {
        projects,
        inventoryAnalysis,
        opportunityCosts: [
          {
            alternative: 'High-yield savings account',
            expectedReturn: 4.2,
            riskLevel: 'low' as const,
            liquidityImpact: 100,
            strategicValue: 2,
            description: 'Risk-free return with full liquidity'
          },
          {
            alternative: 'Corporate bonds',
            expectedReturn: 6.8,
            riskLevel: 'low' as const,
            liquidityImpact: 80,
            strategicValue: 3,
            description: 'Low-risk fixed income investment'
          },
          {
            alternative: 'Market expansion',
            expectedReturn: 15.5,
            riskLevel: 'medium' as const,
            liquidityImpact: 60,
            strategicValue: 9,
            description: 'Geographic expansion into new markets'
          },
          {
            alternative: 'R&D investment',
            expectedReturn: 22.0,
            riskLevel: 'high' as const,
            liquidityImpact: 30,
            strategicValue: 10,
            description: 'New product development initiative'
          }
        ] as OpportunityCost[]
      };
    }
  });

  // Calculate ROI metrics
  const calculateROIMetrics = useCallback((
    initialInvestment: number, 
    cashFlows: number[], 
    discountRate: number,
    riskAdjustment: number = 0
  ) => {
    const adjustedRate = discountRate + riskAdjustment;
    
    // Calculate NPV
    let npv = -initialInvestment;
    cashFlows.forEach((cf, i) => {
      npv += cf / Math.pow(1 + adjustedRate / 100, i + 1);
    });

    // Calculate IRR (simplified approximation)
    let irr = 0;
    const maxIterations = 100;
    const tolerance = 0.001;
    let rate = 0.1; // Starting guess of 10%
    
    for (let i = 0; i < maxIterations; i++) {
      let npvGuess = -initialInvestment;
      cashFlows.forEach((cf, j) => {
        npvGuess += cf / Math.pow(1 + rate, j + 1);
      });
      
      if (Math.abs(npvGuess) < tolerance) break;
      
      // Newton-Raphson method approximation
      let derivative = 0;
      cashFlows.forEach((cf, j) => {
        derivative += (-cf * (j + 1)) / Math.pow(1 + rate, j + 2);
      });
      
      if (derivative !== 0) {
        rate = rate - npvGuess / derivative;
      }
    }
    irr = rate * 100;

    // Calculate Payback Period
    let cumulativeCF = -initialInvestment;
    let paybackPeriod = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      cumulativeCF += cashFlows[i];
      if (cumulativeCF >= 0) {
        paybackPeriod = i + 1 - (cumulativeCF - cashFlows[i]) / cashFlows[i];
        break;
      }
      if (i === cashFlows.length - 1) {
        paybackPeriod = cashFlows.length + 1; // Beyond projection period
      }
    }

    // Calculate Simple ROI
    const totalCashFlow = cashFlows.reduce((sum, cf) => sum + cf, 0);
    const simpleROI = ((totalCashFlow - initialInvestment) / initialInvestment) * 100;

    return {
      npv: Math.round(npv),
      irr: Math.round(irr * 10) / 10,
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
      simpleROI: Math.round(simpleROI * 10) / 10,
      riskAdjustedNPV: Math.round(npv * (1 - riskAdjustment / 100))
    };
  }, []);

  const formatCurrency = useCallback((amount: number, compact = false) => {
    if (compact && Math.abs(amount) >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    } else if (compact && Math.abs(amount) >= 1000) {
      return `£${(amount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  const getROIColor = useCallback((roi: number) => {
    if (roi >= 20) return 'text-green-600';
    if (roi >= 15) return 'text-blue-600';
    if (roi >= 10) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getRiskColor = useCallback((risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  const renderROICalculator = () => {
    const metrics = calculateROIMetrics(
      calculatorInputs.initialInvestment,
      cashFlows,
      calculatorInputs.discountRate,
      calculatorInputs.riskAdjustment
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Calculator</CardTitle>
              <CardDescription>Enter investment parameters to calculate ROI metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="investment">Initial Investment</Label>
                <Input
                  id="investment"
                  type="number"
                  value={calculatorInputs.initialInvestment}
                  onChange={(e) => setCalculatorInputs(prev => ({
                    ...prev,
                    initialInvestment: parseInt(e.target.value) || 0
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="years">Projection Years: {calculatorInputs.projectionYears}</Label>
                <Slider
                  value={[calculatorInputs.projectionYears]}
                  onValueChange={([value]) => {
                    setCalculatorInputs(prev => ({ ...prev, projectionYears: value }));
                    // Adjust cash flows array
                    const newCashFlows = Array(value).fill(0).map((_, i) => 
                      cashFlows[i] || (i > 0 ? cashFlows[i-1] * 1.1 : calculatorInputs.initialInvestment * 0.2)
                    );
                    setCashFlows(newCashFlows);
                  }}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="discount">Discount Rate: {calculatorInputs.discountRate}%</Label>
                <Slider
                  value={[calculatorInputs.discountRate]}
                  onValueChange={([value]) => setCalculatorInputs(prev => ({ ...prev, discountRate: value }))}
                  max={20}
                  min={1}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="risk">Risk Adjustment: {calculatorInputs.riskAdjustment}%</Label>
                <Slider
                  value={[calculatorInputs.riskAdjustment]}
                  onValueChange={([value]) => setCalculatorInputs(prev => ({ ...prev, riskAdjustment: value }))}
                  max={10}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div>
                <Label>Annual Cash Flows</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cashFlows.map((cf, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="w-12 text-sm">Year {index + 1}:</span>
                      <Input
                        type="number"
                        value={cf}
                        onChange={(e) => {
                          const newCashFlows = [...cashFlows];
                          newCashFlows[index] = parseInt(e.target.value) || 0;
                          setCashFlows(newCashFlows);
                        }}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle>ROI Analysis Results</CardTitle>
              <CardDescription>Calculated financial metrics for your investment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className={cn("text-2xl font-bold", getROIColor(metrics.simpleROI))}>
                    {formatPercentage(metrics.simpleROI)}
                  </div>
                  <div className="text-sm text-gray-600">Simple ROI</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.npv, true)}
                  </div>
                  <div className="text-sm text-gray-600">Net Present Value</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(metrics.irr)}
                  </div>
                  <div className="text-sm text-gray-600">Internal Rate of Return</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {metrics.paybackPeriod} years
                  </div>
                  <div className="text-sm text-gray-600">Payback Period</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Risk-Adjusted NPV:</span>
                  <span className="font-medium">{formatCurrency(metrics.riskAdjustedNPV, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cash Flows:</span>
                  <span className="font-medium">{formatCurrency(cashFlows.reduce((sum, cf) => sum + cf, 0), true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Effective Discount Rate:</span>
                  <span className="font-medium">{calculatorInputs.discountRate + calculatorInputs.riskAdjustment}%</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Investment Recommendation</h5>
                <div className="text-sm">
                  {metrics.npv > 0 && metrics.irr > calculatorInputs.discountRate + calculatorInputs.riskAdjustment ? (
                    <div className="text-green-600 flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      <span>Recommended - Positive NPV and IRR exceeds required rate</span>
                    </div>
                  ) : (
                    <div className="text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                      <span>Not recommended - Negative NPV or insufficient returns</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Projection</CardTitle>
            <CardDescription>Annual cash flows and cumulative present value</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart 
                data={cashFlows.map((cf, index) => ({
                  year: `Year ${index + 1}`,
                  cashFlow: cf,
                  presentValue: cf / Math.pow(1 + (calculatorInputs.discountRate + calculatorInputs.riskAdjustment) / 100, index + 1),
                  cumulativePV: cashFlows.slice(0, index + 1).reduce((sum, c, i) => 
                    sum + c / Math.pow(1 + (calculatorInputs.discountRate + calculatorInputs.riskAdjustment) / 100, i + 1), 0
                  ) - calculatorInputs.initialInvestment
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value, true)} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value, true)} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                <Legend />
                <Bar yAxisId="left" dataKey="cashFlow" fill="#3B82F6" name="Annual Cash Flow" />
                <Bar yAxisId="left" dataKey="presentValue" fill="#10B981" name="Present Value" />
                <Line yAxisId="right" type="monotone" dataKey="cumulativePV" stroke="#8B5CF6" strokeWidth={2} name="Cumulative PV" />
                <ReferenceLine yAxisId="right" y={0} stroke="#EF4444" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInventoryAnalysis = () => {
    if (!roiData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Investment Analysis</CardTitle>
            <CardDescription>ROI analysis for inventory level changes across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Category</th>
                    <th className="text-right py-3">Investment</th>
                    <th className="text-right py-3">Expected Returns</th>
                    <th className="text-right py-3">Inventory ROI</th>
                    <th className="text-right py-3">Risk-Adj ROI</th>
                    <th className="text-right py-3">Payback</th>
                    <th className="text-right py-3">Turnover Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  {roiData.inventoryAnalysis.map((analysis) => (
                    <tr key={analysis.category} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{analysis.category}</td>
                      <td className={cn("py-3 text-right font-medium", 
                        analysis.investmentRequired >= 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {formatCurrency(analysis.investmentRequired)}
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        {formatCurrency(analysis.expectedReturns.total)}
                      </td>
                      <td className={cn("py-3 text-right font-bold", 
                        getROIColor(analysis.roiMetrics.inventoryROI)
                      )}>
                        {formatPercentage(analysis.roiMetrics.inventoryROI)}
                      </td>
                      <td className={cn("py-3 text-right font-medium", 
                        getROIColor(analysis.roiMetrics.riskAdjustedROI)
                      )}>
                        {formatPercentage(analysis.roiMetrics.riskAdjustedROI)}
                      </td>
                      <td className="py-3 text-right">
                        {analysis.roiMetrics.paybackMonths} months
                      </td>
                      <td className="py-3 text-right text-blue-600">
                        +{analysis.turnoverImprovement}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {roiData.inventoryAnalysis.map((analysis) => (
            <Card key={analysis.category}>
              <CardHeader>
                <CardTitle className="text-lg">{analysis.category}</CardTitle>
                <CardDescription>
                  {analysis.investmentRequired >= 0 ? 'Investment' : 'Optimization'} Analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Current Level:</span>
                      <div className="font-medium">{formatCurrency(analysis.currentLevel, true)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Proposed Level:</span>
                      <div className="font-medium">{formatCurrency(analysis.proposedLevel, true)}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className={cn("text-2xl font-bold", getROIColor(analysis.roiMetrics.inventoryROI))}>
                        {formatPercentage(analysis.roiMetrics.inventoryROI)}
                      </div>
                      <div className="text-sm text-gray-600">Inventory ROI</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <h5 className="font-medium">Expected Returns:</h5>
                    {analysis.expectedReturns.salesIncrease > 0 && (
                      <div className="flex justify-between">
                        <span>Sales Increase:</span>
                        <span className="text-green-600">{formatCurrency(analysis.expectedReturns.salesIncrease, true)}</span>
                      </div>
                    )}
                    {analysis.expectedReturns.stockoutReduction > 0 && (
                      <div className="flex justify-between">
                        <span>Stockout Reduction:</span>
                        <span className="text-green-600">{formatCurrency(analysis.expectedReturns.stockoutReduction, true)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Efficiency Gains:</span>
                      <span className="text-green-600">{formatCurrency(analysis.expectedReturns.efficiencyGains, true)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-medium text-sm">Key Risks:</h5>
                    {analysis.risks.map((risk, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderProjectComparison = () => {
    if (!roiData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Investment Project Comparison</CardTitle>
            <CardDescription>Compare ROI metrics across different investment opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Project</th>
                    <th className="text-right py-3">Investment</th>
                    <th className="text-right py-3">ROI</th>
                    <th className="text-right py-3">Risk-Adj ROI</th>
                    <th className="text-right py-3">NPV</th>
                    <th className="text-right py-3">IRR</th>
                    <th className="text-right py-3">Payback</th>
                    <th className="text-left py-3">Risk</th>
                    <th className="text-right py-3">Strategic Value</th>
                  </tr>
                </thead>
                <tbody>
                  {roiData.projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-gray-600">{project.category.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(project.initialInvestment, true)}
                      </td>
                      <td className={cn("py-3 text-right font-bold", getROIColor(project.roi))}>
                        {formatPercentage(project.roi)}
                      </td>
                      <td className={cn("py-3 text-right font-medium", getROIColor(project.riskAdjustedROI))}>
                        {formatPercentage(project.riskAdjustedROI)}
                      </td>
                      <td className={cn("py-3 text-right font-medium", 
                        project.npv >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(project.npv, true)}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatPercentage(project.irr)}
                      </td>
                      <td className="py-3 text-right">
                        {project.paybackPeriod} years
                      </td>
                      <td className="py-3">
                        <Badge variant={project.riskProfile === 'low' ? 'default' : 
                                      project.riskProfile === 'medium' ? 'secondary' : 'destructive'}>
                          {project.riskProfile}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${project.strategicAlignment * 10}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs">{project.strategicAlignment}/10</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>ROI vs Risk Analysis</CardTitle>
              <CardDescription>Risk-return profile of investment projects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={roiData.projects.map(p => ({
                  name: p.name.substring(0, 15) + '...',
                  roi: p.roi,
                  risk: p.riskProfile === 'low' ? 1 : p.riskProfile === 'medium' ? 2 : 3,
                  size: p.initialInvestment / 100000
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="risk" type="number" domain={[0.5, 3.5]} tickFormatter={(value) => 
                    value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'
                  } />
                  <YAxis dataKey="roi" tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value, name) => [
                    name === 'roi' ? `${value}%` : value,
                    name === 'roi' ? 'ROI' : name
                  ]} />
                  <Scatter dataKey="roi" fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Investment Distribution</CardTitle>
              <CardDescription>Investment allocation by project category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roiData.projects.map(p => ({
                      name: p.category.replace('_', ' '),
                      value: p.initialInvestment,
                      fill: p.category === 'inventory' ? '#3B82F6' :
                            p.category === 'equipment' ? '#10B981' :
                            p.category === 'technology' ? '#8B5CF6' :
                            p.category === 'process_improvement' ? '#F59E0B' : '#EF4444'
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roiData.projects.map((entry, index) => (
                      <Cell key={`cell-${index}`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Investment']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderSensitivityAnalysis = () => {
    if (!roiData) return null;

    const selectedProjectData = roiData.projects.find(p => p.id === selectedProject) || roiData.projects[0];
    
    // Generate sensitivity data for key variables
    const sensitivityVariables = [
      { name: 'Initial Investment', baseValue: selectedProjectData.initialInvestment, range: 0.3 },
      { name: 'Annual Cash Flow', baseValue: selectedProjectData.annualCashFlow[0], range: 0.4 },
      { name: 'Implementation Time', baseValue: selectedProjectData.implementationTimeMonths, range: 0.5 },
      { name: 'Discount Rate', baseValue: 8, range: 0.6 }
    ];

    const sensitivityData = sensitivityVariables.map(variable => {
      const variations = [];
      for (let i = -30; i <= 30; i += 10) {
        const variation = i / 100;
        let modifiedValue;
        let modifiedROI;

        if (variable.name === 'Initial Investment') {
          modifiedValue = variable.baseValue * (1 + variation);
          modifiedROI = selectedProjectData.roi * (1 - variation * 0.8); // Inverse relationship
        } else if (variable.name === 'Annual Cash Flow') {
          modifiedValue = variable.baseValue * (1 + variation);
          modifiedROI = selectedProjectData.roi * (1 + variation * 0.9);
        } else {
          modifiedValue = variable.baseValue * (1 + variation);
          modifiedROI = selectedProjectData.roi * (1 - Math.abs(variation) * 0.5);
        }

        variations.push({
          variation: i,
          value: modifiedValue,
          roi: Math.max(0, modifiedROI),
          npv: selectedProjectData.npv * (modifiedROI / selectedProjectData.roi)
        });
      }
      return {
        variable: variable.name,
        baseValue: variable.baseValue,
        variations
      };
    });

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sensitivity Analysis</CardTitle>
                <CardDescription>Impact of variable changes on ROI and NPV</CardDescription>
              </div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {roiData?.projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedProjectData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {formatPercentage(selectedProjectData.roi)}
                  </div>
                  <div className="text-sm text-gray-600">Base ROI</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(selectedProjectData.npv, true)}
                  </div>
                  <div className="text-sm text-gray-600">Base NPV</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">
                    {formatPercentage(selectedProjectData.irr)}
                  </div>
                  <div className="text-sm text-gray-600">IRR</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">
                    {selectedProjectData.paybackPeriod} years
                  </div>
                  <div className="text-sm text-gray-600">Payback</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>ROI Sensitivity</CardTitle>
              <CardDescription>ROI response to variable changes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="variation" tickFormatter={(value) => `${value}%`} />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]} />
                  <Legend />
                  {sensitivityData.map((variable, index) => (
                    <Line
                      key={variable.variable}
                      type="monotone"
                      dataKey="roi"
                      data={variable.variations}
                      stroke={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][index % 4]}
                      strokeWidth={2}
                      name={variable.variable}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>NPV Sensitivity</CardTitle>
              <CardDescription>NPV response to variable changes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="variation" tickFormatter={(value) => `${value}%`} />
                  <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                  <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} />
                  <Legend />
                  {sensitivityData.map((variable, index) => (
                    <Line
                      key={variable.variable}
                      type="monotone"
                      dataKey="npv"
                      data={variable.variations}
                      stroke={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][index % 4]}
                      strokeWidth={2}
                      name={variable.variable}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sensitivity Summary Table</CardTitle>
            <CardDescription>Quantified impact of ±20% changes in key variables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Variable</th>
                    <th className="text-right py-3">Base Value</th>
                    <th className="text-right py-3">-20% Impact on ROI</th>
                    <th className="text-right py-3">+20% Impact on ROI</th>
                    <th className="text-right py-3">-20% Impact on NPV</th>
                    <th className="text-right py-3">+20% Impact on NPV</th>
                  </tr>
                </thead>
                <tbody>
                  {sensitivityData.map((variable) => {
                    const negativeImpact = variable.variations.find(v => v.variation === -20);
                    const positiveImpact = variable.variations.find(v => v.variation === 20);
                    return (
                      <tr key={variable.variable} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{variable.variable}</td>
                        <td className="py-3 text-right">
                          {variable.variable.includes('Rate') ? 
                            `${variable.baseValue}%` : 
                            formatCurrency(variable.baseValue, true)
                          }
                        </td>
                        <td className={cn("py-3 text-right font-medium",
                          negativeImpact && negativeImpact.roi < selectedProjectData.roi ? 'text-red-600' : 'text-green-600'
                        )}>
                          {negativeImpact ? formatPercentage(negativeImpact.roi) : 'N/A'}
                        </td>
                        <td className={cn("py-3 text-right font-medium",
                          positiveImpact && positiveImpact.roi > selectedProjectData.roi ? 'text-green-600' : 'text-red-600'
                        )}>
                          {positiveImpact ? formatPercentage(positiveImpact.roi) : 'N/A'}
                        </td>
                        <td className={cn("py-3 text-right font-medium",
                          negativeImpact && negativeImpact.npv < selectedProjectData.npv ? 'text-red-600' : 'text-green-600'
                        )}>
                          {negativeImpact ? formatCurrency(negativeImpact.npv, true) : 'N/A'}
                        </td>
                        <td className={cn("py-3 text-right font-medium",
                          positiveImpact && positiveImpact.npv > selectedProjectData.npv ? 'text-green-600' : 'text-red-600'
                        )}>
                          {positiveImpact ? formatCurrency(positiveImpact.npv, true) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderOpportunityCosts = () => {
    if (!roiData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Cost Analysis</CardTitle>
            <CardDescription>Alternative investment options and their expected returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roiData.opportunityCosts.map((opportunity, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{opportunity.alternative}</h4>
                        <Badge variant={opportunity.riskLevel === 'low' ? 'default' : 
                                      opportunity.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                          {opportunity.riskLevel} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className={cn("text-xl font-bold", getROIColor(opportunity.expectedReturn))}>
                        {formatPercentage(opportunity.expectedReturn)}
                      </div>
                      <div className="text-xs text-gray-500">Expected Return</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="font-medium text-gray-600">Liquidity Impact</div>
                      <div className="text-lg font-bold text-blue-600">{opportunity.liquidityImpact}%</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Strategic Value</div>
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${opportunity.strategicValue * 10}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm">{opportunity.strategicValue}/10</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600">Risk Level</div>
                      <div className={cn("text-lg font-bold", getRiskColor(opportunity.riskLevel))}>
                        {opportunity.riskLevel}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Return vs Risk Comparison</CardTitle>
              <CardDescription>Risk-return profile of opportunity costs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={roiData.opportunityCosts.map(opp => ({
                  name: opp.alternative,
                  return: opp.expectedReturn,
                  risk: opp.riskLevel === 'low' ? 1 : opp.riskLevel === 'medium' ? 2 : 3,
                  strategic: opp.strategicValue
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="risk" type="number" domain={[0.5, 3.5]} tickFormatter={(value) => 
                    value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'
                  } />
                  <YAxis dataKey="return" tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value, name) => [
                    name === 'return' ? `${value}%` : value,
                    name === 'return' ? 'Expected Return' : name
                  ]} />
                  <Scatter dataKey="return" fill="#8B5CF6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strategic Value vs Returns</CardTitle>
              <CardDescription>Strategic alignment compared to financial returns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={roiData.opportunityCosts.map(opp => ({
                  name: opp.alternative.substring(0, 10) + '...',
                  return: opp.expectedReturn,
                  strategic: opp.strategicValue,
                  liquidity: opp.liquidityImpact
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="strategic" type="number" domain={[0, 10]} />
                  <YAxis dataKey="return" tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value, name) => [
                    name === 'return' ? `${value}%` : value,
                    name === 'return' ? 'Expected Return' : 
                    name === 'strategic' ? 'Strategic Value' : name
                  ]} />
                  <Scatter dataKey="return" fill="#10B981" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Opportunity Cost Summary</CardTitle>
            <CardDescription>Cost of not investing in alternative opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <h5 className="font-medium text-yellow-800">Opportunity Cost Analysis</h5>
              </div>
              <div className="text-sm text-gray-700">
                <p className="mb-2">
                  By choosing the current investment strategy, you are foregoing potential returns from alternative investments.
                  The highest opportunity cost is from <strong>R&D investment</strong> at {formatPercentage(22.0)}, 
                  while the safest alternative is <strong>Corporate bonds</strong> at {formatPercentage(6.8)}.
                </p>
                <p>
                  Consider the balance between financial returns, strategic value, and risk tolerance when making investment decisions.
                </p>
              </div>
            </div>
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
        <div className="grid grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded-lg" />
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ROI Calculator & Investment Analysis</h2>
          <p className="text-gray-600">Comprehensive investment analysis with risk-adjusted returns and sensitivity modeling</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCalculating(!isCalculating)}
          >
            {isCalculating ? <PauseIcon className="h-4 w-4 mr-2" /> : <PlayIcon className="h-4 w-4 mr-2" />}
            {isCalculating ? 'Pause' : 'Calculate'}
          </Button>
          <Button variant="outline" size="sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Analysis
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="inventory">Inventory ROI</TabsTrigger>
          <TabsTrigger value="comparison">Project Comparison</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunity Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          {renderROICalculator()}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {renderInventoryAnalysis()}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {renderProjectComparison()}
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-6">
          {renderSensitivityAnalysis()}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          {renderOpportunityCosts()}
        </TabsContent>
      </Tabs>
    </div>
  );
};